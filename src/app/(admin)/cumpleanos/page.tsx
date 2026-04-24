import { redirect } from "next/navigation";

/* ================= CUMPLEAÑOS (legacy) ================= */
/* La página fue unificada en /eventos — redirigimos. */
export default function CumpleanosPage() {
  redirect("/eventos");
}
