"use client";

/* ================= PROVIDERS WRAPPER ================= */
/* Backend unico: Supabase. La app no soporta modo demo desde el       */
/* lanzamiento — todos los datos viven en Supabase + Realtime.         */

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PrivacyProvider } from "@/components/providers/PrivacyProvider";
import { DataProvider } from "@/components/providers/DataProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { FeedbackProvider } from "@/components/ui/Feedback";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PrivacyProvider>
        <FeedbackProvider>
          <DataProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
          </DataProvider>
        </FeedbackProvider>
      </PrivacyProvider>
    </ThemeProvider>
  );
}
