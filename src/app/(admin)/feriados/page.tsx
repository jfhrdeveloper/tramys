import { redirect } from "next/navigation";

/* ================= FERIADOS (legacy) ================= */
/* La página fue unificada en /eventos — redirigimos. */
export default function FeriadosPage() {
  redirect("/eventos");
}
