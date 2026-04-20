import type { Metadata } from "next";
import "./globals.css";

/* ================= METADATA ================= */
export const metadata: Metadata = {
  title:       "TRAMYS — Panel de Gestión Operativa",
  description: "Sistema de gestión para Santa Anita y Puente Piedra",
};

/* ================= LAYOUT RAÍZ ================= */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
