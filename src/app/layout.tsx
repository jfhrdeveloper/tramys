import type { Metadata, Viewport } from "next";
import { NO_FLASH_SCRIPT } from "@/components/providers/ThemeProvider";
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
      <head>
        {/* ==== Script anti-flash: aplica tema antes del primer paint ==== */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
