"use client";
import { useState } from "react";
import { useClock } from "@/hooks/useClock";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Icon } from "@/components/ui/Icons"; // <-- Importamos los íconos

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

const NOTIFS = [
  { text:"Marco Díaz cumple años hoy 🎂",      color:"#f59e0b", leido:false },
  { text:"3 adelantos pendientes de aprobación", color:"#C41A3A", leido:false },
  { text:"Miguel T. superó su meta mensual",     color:"#16a34a", leido:true  },
];

export function Topbar({ title, subtitle }: TopbarProps) {
  const { hora } = useClock();
  const { theme, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = NOTIFS.filter(n=>!n.leido).length;

  return (
    <header style={{ height:60,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",background:"var(--card)",borderBottom:"1px solid var(--border)",flexShrink:0,position:"sticky",top:0,zIndex:10 }}>
      {/* Izquierda */}
      <div style={{ display:"flex",alignItems:"center",gap:12 }}>
        <div>
          <div className="topbar-title" style={{ fontWeight:700,fontSize:16 }}>{title}</div>
          {subtitle && <div style={{ fontSize:10,color:"var(--text-muted)",fontFamily:"'DM Mono',monospace" }}>{subtitle}</div>}
        </div>
      </div>

      {/* Derecha */}
      <div style={{ display:"flex",gap:10,alignItems:"center" }}>
        {/* Reloj live */}
        <div className="topbar-clock" style={{ display:"flex",alignItems:"center",gap:6,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:99,padding:"5px 12px" }}>
          <div style={{ width:6,height:6,borderRadius:"50%",background:"#22c55e" }} className="animate-pulse-dot" />
          <span style={{ fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13,color:"var(--text)" }}>{hora}</span>
        </div>

        {/* Notificaciones */}
        <div style={{ position:"relative" }}>
          <button onClick={()=>setNotifOpen(!notifOpen)} style={{ background:notifOpen?"rgba(196,26,58,0.1)":"transparent",border:"1px solid var(--border)",borderRadius:8,width:34,height:34,cursor:"pointer",color:notifOpen?"var(--brand)":"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative", padding:0 }}>
            <Icon name="bell" size={16} />
            {unread>0 && <span style={{ position:"absolute",top:6,right:6,width:8,height:8,borderRadius:"50%",background:"var(--brand)",border:"2px solid var(--card)" }} />}
          </button>
          
          {notifOpen && (
            <div className="animate-fade-in" style={{ position:"absolute",top:42,right:0,width:280,background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",zIndex:200,overflow:"hidden" }}>
              <div style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",fontWeight:700,fontSize:13 }}>Alertas · <span style={{ color:"var(--brand)" }}>{unread} nuevas</span></div>
              {NOTIFS.map((n,i)=>(
                <div key={i} style={{ padding:"11px 16px",borderBottom:i<NOTIFS.length-1?"1px solid var(--border)":"none",cursor:"pointer",display:"flex",gap:8 }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--hover)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                >
                  <div style={{ width:7,height:7,borderRadius:"50%",background:n.leido?"var(--border)":n.color,marginTop:4,flexShrink:0 }} />
                  <div style={{ fontSize:11,fontWeight:n.leido?400:600,color:"var(--text)" }}>{n.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toggle tema */}
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
  );
}