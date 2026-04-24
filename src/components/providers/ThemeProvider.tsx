"use client";

/* ================= IMPORTS ================= */
import { createContext, useContext, useEffect, useState } from "react";

/* ================= TIPOS ================= */
type Theme = "light" | "dark";
interface Ctx {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

/* ================= CONSTANTES ================= */
const STORAGE_KEY = "tramys-theme";

/* ================= CONTEXTO ================= */
const ThemeContext = createContext<Ctx>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

/* ================= PROVIDER ================= */
export function ThemeProvider({ children }: { children: React.ReactNode }) {

  /* ====== Estado principal ====== */
  const [theme, setThemeState] = useState<Theme>("dark");
  const [userSet, setUserSet]  = useState(false);

  /* ====== Efecto de montaje: carga preferencia ====== */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
      setUserSet(true);
    } else {
      /* ==== Sin elección previa: seguir al sistema ==== */
      const systemPrefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
      setThemeState(systemPrefersLight ? "light" : "dark");
      setUserSet(false);
    }
  }, []);

  /* ====== Efecto: aplicar clase y persistir ====== */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (userSet) localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, userSet]);

  /* ====== Efecto: escuchar cambios del sistema ====== */
  useEffect(() => {
    if (userSet) return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => setThemeState(e.matches ? "light" : "dark");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [userSet]);

  /* ====== Handlers expuestos ====== */
  const toggleTheme = () => {
    setUserSet(true);
    setThemeState(p => (p === "dark" ? "light" : "dark"));
  };

  const setTheme = (t: Theme) => {
    setUserSet(true);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ================= HOOK ================= */
export const useTheme = () => useContext(ThemeContext);

/* ================= SCRIPT ANTI-FLASH (opcional para <head>) ================= */
/* Uso: <script dangerouslySetInnerHTML={{__html: NO_FLASH_SCRIPT}} /> */
export const NO_FLASH_SCRIPT = `
(function(){try{
  var k='${STORAGE_KEY}';
  var s=localStorage.getItem(k);
  var sys=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
  var t=(s==='light'||s==='dark')?s:sys;
  if(t==='dark')document.documentElement.classList.add('dark');
}catch(e){}})();
`;
