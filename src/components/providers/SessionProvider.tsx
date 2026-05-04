"use client";

/* ================= SESSION PROVIDER ================= */
/* Sesion basada en auth.uid() de Supabase. El worker activo se     */
/* busca dentro del store por el id del usuario autenticado.        */
/* La impersonacion ("ver como" desde Accesos) se resuelve con      */
/* override en localStorage que prevalece sobre auth.uid().         */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useData, type Worker, type Sede } from "@/components/providers/DataProvider";

/* ================= TIPOS ================= */
export interface SessionCtx {
  worker:           Worker | null;
  sede:             Sede | null;
  signOut:          () => void;
  switchTo:         (workerId: string) => void;
  /* Restaura la sesion real cuando el owner esta "viendo como" otro usuario */
  restoreSession:   () => void;
  /* True cuando el id activo difiere del id real (impersonacion en curso) */
  isImpersonating:  boolean;
  ready:            boolean;
}

const IMPERSONATE_KEY = "tramys_impersonate_id";

const Ctx = createContext<SessionCtx | null>(null);
/* Context exportado por si algun componente quiere consumirlo crudo */
export const SessionContext = Ctx;
export type SessionCtxValue = SessionCtx;

/* ================= PROVIDER ================= */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const d = useData();
  const [authId, setAuthId]           = useState<string | null>(null);
  const [impersonate, setImpersonate] = useState<string | null>(null);
  const [ready, setReady]             = useState(false);

  /* ====== Carga sesion + suscripcion a auth state ====== */
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

  /* ====== Worker activo: si hay impersonacion, prevalece ====== */
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

  const value: SessionCtx = {
    worker, sede, signOut, switchTo, restoreSession, isImpersonating, ready,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ================= HOOK ================= */
export function useSession(): SessionCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return v;
}
