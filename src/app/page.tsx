import { redirect } from "next/navigation";

/* ================= PÁGINA RAÍZ ================= */
/* El middleware maneja la redirección real según rol */
export default function RootPage() {
  redirect("/login");
}
