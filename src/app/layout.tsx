import type { Metadata, Viewport } from "next";
import "./globals.css";

/* ================= METADATA ================= */
export const metadata: Metadata = {
  title:       "TRAMYS — Panel de Gestión Operativa",
  description: "Sistema de gestión para Santa Anita y Puente Piedra",
};

/* ================= VIEWPORT — evita zoom en inputs iOS ================= */
export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  maximumScale: 1,
};

/* ================= LAYOUT RAÍZ ================= */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}