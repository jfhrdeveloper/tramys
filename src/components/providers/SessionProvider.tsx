"use client";

/* ================= SESSION PROVIDER ================= */
/* Sesión activa basada en el DataProvider (modo demo).      */
/* Reemplaza temporalmente al perfil de Supabase para que el */
/* usuario pueda probar las vistas de owner / encargado /    */
/* trabajador desde el mismo navegador.                      */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useData, type Worker, type Sede } from "@/components/providers/DataProvider";

/* ================= TIPOS ================= */
export interface SessionCtx {
  worker:    Worker | null;
  sede:      Sede | null;
  signOut:   () => void;
  switchTo:  (workerId: string) => void;
  ready:     boolean;
}

const STORAGE_KEY = "tramys_session_id";

const Ctx = createContext<SessionCtx | null>(null);

/* ================= PROVIDER ================= */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const d = useData();
  const [selId, setSelId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  /* Hidratar desde localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSelId(raw);
    } catch {}
    setReady(true);
  }, []);

  /* Default: primer owner activo si no hay sesión guardada */
  useEffect(() => {
    if (!ready || selId) return;
    const owner = d.workers.find(w => w.rol === "owner" && w.activo);
    if (owner) setSelId(owner.id);
  }, [ready, selId, d.workers]);

  const switchTo = useCallback((workerId: string) => {
    try { localStorage.setItem(STORAGE_KEY, workerId); } catch {}
    setSelId(workerId);
  }, []);

  const signOut = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    if (typeof window !== "undefined") window.location.href = "/login";
  }, []);

  const worker = useMemo(
    () => selId ? d.workers.find(w => w.id === selId) ?? null : null,
    [selId, d.workers]
  );
  const sede = useMemo(
    () => worker ? d.sedes.find(s => s.id === worker.sedeId) ?? null : null,
    [worker, d.sedes]
  );

  return (
    <Ctx.Provider value={{ worker, sede, signOut, switchTo, ready }}>
      {children}
    </Ctx.Provider>
  );
}

/* ================= HOOK ================= */
export function useSession(): SessionCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return v;
}
