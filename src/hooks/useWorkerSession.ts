"use client";

/* ================= WORKER SESSION ================= */
/* Devuelve el worker activo según SessionProvider. Si la  */
/* sesión activa no es trabajador, cae en el primer        */
/* trabajador activo del store (modo demo).                */

import { useData, type Worker } from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";

export function useWorkerSession(): Worker | null {
  const { worker } = useSession();
  const d = useData();
  if (worker && worker.activo) return worker;
  return d.workers.find(w => w.rol === "trabajador" && w.activo) ?? null;
}
