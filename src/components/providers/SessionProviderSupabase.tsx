"use client";

/* ================= SESSION PROVIDER (Supabase) ================= */
/* Sesión basada en auth.uid(): el worker activo se busca dentro    */
/* del store por el id del usuario autenticado. La impersonación    */
/* ("ver como" desde Accesos) se resuelve con override en memoria.  */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useData } from "@/components/providers/DataProvider";
import { SessionContext, type SessionCtxValue } from "@/components/providers/SessionProvider";

const IMPERSONATE_KEY = "tramys_impersonate_id";

export function SessionProviderSupabase({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const d = useData();
  const [authId, setAuthId]   = useState<string | null>(null);
  const [impersonate, setImpersonate] = useState<string | null>(null);
  const [ready, setReady]     = useState(false);

  /* ====== Carga sesión + suscripción a auth state ====== */
  useEffect(() => {
    let active = true;
    async function bootstrap() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setAuthId(data.user?.id ?? null);
      try { setImpersonate(localStorage.getItem(IMPERSONATE_KEY)); } catch {}
      setReady(true);
    }
    void bootstrap();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setAuthId(sess?.user?.id ?? null);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [supabase]);

  /* ====== Worker activo: si hay impersonación, prevalece ====== */
  const activeId = impersonate ?? authId;
  const worker = useMemo(
    () => activeId ? d.workers.find(w => w.id === activeId) ?? null : null,
    [activeId, d.workers],
  );
  const sede = useMemo(
    () => worker ? d.sedes.find(s => s.id === worker.sedeId) ?? null : null,
    [worker, d.sedes],
  );

  const switchTo = useCallback((workerId: string) => {
    try { localStorage.setItem(IMPERSONATE_KEY, workerId); } catch {}
    setImpersonate(workerId);
  }, []);

  const restoreSession = useCallback(() => {
    try { localStorage.removeItem(IMPERSONATE_KEY); } catch {}
    setImpersonate(null);
    if (typeof window !== "undefined") window.location.href = "/dashboard";
  }, []);

  const signOut = useCallback(async () => {
    try { localStorage.removeItem(IMPERSONATE_KEY); } catch {}
    await supabase.auth.signOut();
    if (typeof window !== "undefined") window.location.href = "/login";
  }, [supabase]);

  const isImpersonating = !!impersonate && impersonate !== authId;

  const value: SessionCtxValue = {
    worker, sede, signOut, switchTo, restoreSession, isImpersonating, ready,
  };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
