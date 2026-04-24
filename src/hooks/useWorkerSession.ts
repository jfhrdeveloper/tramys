"use client";

/* ================= WORKER SESSION ================= */
/* Determina el worker "logueado" en la vista /worker. */
/* Por ahora: primer trabajador activo. Puede leerse de */
/* localStorage para simular sesiones distintas.        */

import { useData, type Worker } from "@/components/providers/DataProvider";

const STORAGE_KEY = "tramys_worker_session";

export function useWorkerSession(): Worker | null {
  const d = useData();
  let selId: string | null = null;
  if (typeof window !== "undefined") {
    try { selId = localStorage.getItem(STORAGE_KEY); } catch {}
  }
  if (selId) {
    const found = d.workers.find(w => w.id === selId);
    if (found) return found;
  }
  return d.workers.find(w => w.rol === "trabajador" && w.activo) ?? null;
}
