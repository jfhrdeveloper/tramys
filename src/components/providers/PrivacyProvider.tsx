"use client";

import { createContext, useContext, useEffect, useState } from "react";

/* ================= PRIVACY PROVIDER ================= */
/* Toggle global: oculta/muestra TODOS los montos sensibles en la UI. */

interface PrivacyCtx {
  hidden: boolean;
  toggle: () => void;
  setHidden: (v: boolean) => void;
}

const Ctx = createContext<PrivacyCtx>({ hidden: false, toggle: () => {}, setHidden: () => {} });

const STORAGE_KEY = "tramys_privacy_hidden";

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHiddenState] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v !== null) setHiddenState(v === "1");
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, hidden ? "1" : "0"); } catch {}
  }, [hidden, hydrated]);

  function setHidden(v: boolean) { setHiddenState(v); }
  function toggle() { setHiddenState(v => !v); }

  return <Ctx.Provider value={{ hidden, toggle, setHidden }}>{children}</Ctx.Provider>;
}

export function usePrivacy() {
  return useContext(Ctx);
}
