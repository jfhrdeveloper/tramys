"use client";

/* ================= PRELOADER DE BIENVENIDA ================= */
/* Aparece al iniciar sesión saludando por nombre/apodo.          */

import { useEffect, useState } from "react";

interface PreloaderProps {
  nombre: string;
  apodo?: string;
  onDone?: () => void;
  durationMs?: number;
}

export function Preloader({ nombre, apodo, onDone, durationMs = 1800 }: PreloaderProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onDone]);

  if (!visible) return null;
  const display = apodo?.trim() || nombre.split(" ")[0];

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"linear-gradient(135deg, #a01530 0%, #C41A3A 50%, #e8304d 100%)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      color:"#fff",
      animation:"preloader-fade 0.4s ease",
    }}>
      <div style={{
        width:72, height:72, borderRadius:18,
        background:"rgba(255,255,255,0.18)",
        border:"1px solid rgba(255,255,255,0.3)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontWeight:800, fontSize:32, marginBottom:22,
      }}>T</div>

      <div style={{ fontSize:14, opacity:0.8, letterSpacing:1.5, fontFamily:"'DM Mono',monospace", marginBottom:6 }}>
        BIENVENIDO
      </div>
      <div style={{ fontSize:36, fontWeight:800, letterSpacing:-0.5, marginBottom:24 }}>
        {display}
      </div>

      <div style={{ width:200, height:4, background:"rgba(255,255,255,0.2)", borderRadius:99, overflow:"hidden" }}>
        <div style={{
          height:"100%", width:"40%",
          background:"#fff", borderRadius:99,
          animation:"preloader-bar 1.4s cubic-bezier(0.4,0,0.6,1) infinite",
        }} />
      </div>

      <style jsx>{`
        @keyframes preloader-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes preloader-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
