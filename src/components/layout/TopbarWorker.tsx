"use client";
import { useState } from "react";
import { useClock } from "@/hooks/useClock";
import { useTheme } from "@/components/providers/ThemeProvider";
import { ModalAsistencia } from "@/components/worker/ModalAsistencia";
import { Icon } from "@/components/ui/Icons"; // <-- Importamos los íconos

interface Props { title:string; subtitle?:string; onMenuToggle:()=>void; }

export function TopbarWorker({ title, subtitle, onMenuToggle }: Props) {
  const { hora } = useClock();
  const { theme, toggleTheme } = useTheme();
  const [showAsist, setShowAsist] = useState(true);

  return (
    <>
      <header style={{ height:60,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",background:"var(--card)",borderBottom:"1px solid var(--border)",flexShrink:0,position:"sticky",top:0,zIndex:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <button onClick={onMenuToggle} style={{ background:"transparent",border:"1px solid var(--border)",borderRadius:8,width:32,height:32,cursor:"pointer",color:"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center", padding:0 }}>
            <Icon name="menu" size={16} />
          </button>
          <div>
            <div style={{ fontWeight:700,fontSize:15 }}>{title}</div>
            {subtitle && <div style={{ fontSize:10,color:"var(--text-muted)",fontFamily:"'DM Mono',monospace" }}>{subtitle}</div>}
          </div>
        </div>
        
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          {/* Reloj */}
          <div className="topbar-clock" style={{ display:"flex",alignItems:"center",gap:6,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:99,padding:"5px 12px" }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:"#22c55e" }} className="animate-pulse-dot" />
            <span style={{ fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:14 }}>{hora}</span>
          </div>
          
          {/* Marcar asistencia */}
          <button onClick={()=>setShowAsist(true)} style={{ background:"linear-gradient(135deg,#a01530,#C41A3A)",color:"#fff",border:"none",borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Bricolage Grotesque',sans-serif",display:"flex",alignItems:"center",gap:6,boxShadow:"0 2px 10px rgba(196,26,58,0.3)" }}>
            <span className="hide-mobile" style={{ display: "flex", alignItems: "center" }}>
              <Icon name="timer" size={14} color="#fff" />
            </span>
            <span>Marcar</span>
          </button>
          
          {/* Toggle */}
          <div onClick={toggleTheme} style={{ width:48,height:26,borderRadius:99,cursor:"pointer",background:theme==="dark"?"var(--brand)":"var(--border)",position:"relative",transition:"background 0.3s" }}>
            <div style={{ position:"absolute",top:3,left:theme==="dark"?25:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.3s",display:"flex",alignItems:"center",justifyContent:"center" }}>
              {theme === "dark" 
                ? <Icon name="moon" size={12} color="var(--brand)" /> 
                : <Icon name="sun" size={13} color="var(--text-muted)" />
              }
            </div>
          </div>
        </div>
      </header>
      <ModalAsistencia open={showAsist} onClose={()=>setShowAsist(false)} />
    </>
  );
}