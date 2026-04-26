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
  worker:           Worker | null;
  sede:             Sede | null;
  signOut:          () => void;
  switchTo:         (workerId: string) => void;
  /* Restaura la sesión real cuando el owner está "viendo como" otro usuario */
  restoreSession:   () => void;
  /* True cuando el id activo difiere del id real (impersonación en curso) */
  isImpersonating:  boolean;
  ready:            boolean;
}

const STORAGE_KEY      = "tramys_session_id";       /* sesión efectiva (la que decide el rol activo) */
const REAL_KEY         = "tramys_session_real_id";  /* sesión real del owner cuando está impersonando */

const Ctx = createContext<SessionCtx | null>(null);
/* Context compartido — el SessionProviderSupabase publica el mismo shape aquí */
export const SessionContext = Ctx;
export type SessionCtxValue = SessionCtx;

/* ================= PROVIDER ================= */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const d = useData();
  const [selId,  setSelId]  = useState<string | null>(null);
  const [realId, setRealId] = useState<string | null>(null);
  const [ready,  setReady]  = useState(false);

  /* Hidratar desde localStorage. Si no hay sesión, redirigir a /login */
  useEffect(() => {
    let storedSel: string | null = null;
    let storedReal: string | null = null;
    try {
      storedSel  = localStorage.getItem(STORAGE_KEY);
      storedReal = localStorage.getItem(REAL_KEY);
    } catch {}
    setSelId(storedSel);
    setRealId(storedReal);
    setReady(true);

    /* Sin sesión y dentro de un panel privado → al login */
    if (!storedSel && typeof window !== "undefined") {
      const path = window.location.pathname;
      const inPanel = path.startsWith("/dashboard") || path.startsWith("/mi-")
        || path.startsWith("/trabajadores") || path.startsWith("/asistencia")
        || path.startsWith("/sedes") || path.startsWith("/jaladores")
        || path.startsWith("/planilla") || path.startsWith("/eventos")
        || path.startsWith("/reportes") || path.startsWith("/accesos")
        || path.startsWith("/adelantos") || path.startsWith("/cumpleanos")
        || path.startsWith("/feriados") || path.startsWith("/mis-")
        || path === "/icons";
      if (inPanel) window.location.href = "/login";
    }
  }, []);

  /* Cambiar a otro worker. Si todavía no hay sesión real registrada,
     guarda la actual como "real" (origen de la impersonación). */
  const switchTo = useCallback((workerId: string) => {
    try {
      const realActual = localStorage.getItem(REAL_KEY);
      const sesionActual = localStorage.getItem(STORAGE_KEY);
      if (!realActual && sesionActual && sesionActual !== workerId) {
        localStorage.setItem(REAL_KEY, sesionActual);
        setRealId(sesionActual);
      }
      localStorage.setItem(STORAGE_KEY, workerId);
    } catch {}
    setSelId(workerId);
  }, []);

  /* Vuelve a la sesión original del owner */
  const restoreSession = useCallback(() => {
    try {
      const real = localStorage.getItem(REAL_KEY);
      if (real) {
        localStorage.setItem(STORAGE_KEY, real);
        localStorage.removeItem(REAL_KEY);
        setSelId(real);
        setRealId(null);
        if (typeof window !== "undefined") window.location.href = "/dashboard";
      }
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(REAL_KEY);
    } catch {}
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
  const isImpersonating = !!realId && realId !== selId;

  return (
    <Ctx.Provider value={{ worker, sede, signOut, switchTo, restoreSession, isImpersonating, ready }}>
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
