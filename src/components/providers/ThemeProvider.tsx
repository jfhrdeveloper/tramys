"use client";
import { createContext, useContext, useEffect, useState } from "react";
type Theme = "light"|"dark";
interface Ctx { theme:Theme; toggleTheme:()=>void; }
const ThemeContext = createContext<Ctx>({ theme:"dark", toggleTheme:()=>{} });

export function ThemeProvider({ children }: { children:React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(()=>{ const s=localStorage.getItem("tramys-theme") as Theme; if(s) setTheme(s); },[]);
  useEffect(()=>{ document.documentElement.classList.toggle("dark",theme==="dark"); localStorage.setItem("tramys-theme",theme); },[theme]);
  return <ThemeContext.Provider value={{ theme, toggleTheme:()=>setTheme(p=>p==="dark"?"light":"dark") }}>{children}</ThemeContext.Provider>;
}
export const useTheme = ()=>useContext(ThemeContext);
