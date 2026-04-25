"use client";

/* ================= PROVIDERS WRAPPER ================= */
/* Selecciona Data/Session backend según variable de entorno.  */
/* `NEXT_PUBLIC_USE_SUPABASE=true` activa el modo conectado;   */
/* cualquier otro valor (o ausencia) mantiene el demo local.   */

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PrivacyProvider } from "@/components/providers/PrivacyProvider";
import { DataProvider } from "@/components/providers/DataProvider";
import { DataProviderSupabase } from "@/components/providers/DataProviderSupabase";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SessionProviderSupabase } from "@/components/providers/SessionProviderSupabase";

const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

export function Providers({ children }: { children: React.ReactNode }) {
  const Data    = USE_SUPABASE ? DataProviderSupabase    : DataProvider;
  const Session = USE_SUPABASE ? SessionProviderSupabase : SessionProvider;
  return (
    <ThemeProvider>
      <PrivacyProvider>
        <Data>
          <Session>
            {children}
          </Session>
        </Data>
      </PrivacyProvider>
    </ThemeProvider>
  );
}
