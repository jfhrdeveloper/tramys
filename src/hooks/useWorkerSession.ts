"use client";

/* ================= WORKER SESSION ================= */
/* Devuelve el worker activo según SessionProvider (auth.uid de        */
/* Supabase, con override de impersonación). Retorna null si no hay     */
/* sesión válida — no caer a "primer trabajador del store" porque       */
/* eso filtraría datos de otro usuario.                                 */

import { type Worker } from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";

export function useWorkerSession(): Worker | null {
  const { worker } = useSession();
  return worker && worker.activo ? worker : null;
}
