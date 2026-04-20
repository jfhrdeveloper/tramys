"use client";
import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createClient } from "@/lib/supabase/client";
import { money, iniciales, colorSede } from "@/lib/utils/formatters";

const FEED = [
  { dot:"#22c55e", text:"Luis Vera registró entrada",      hora:"08:03", sede:"SA" },
  { dot:"#C41A3A", text:"Miguel T. — nueva captación",     hora:"08:15", sede:"PP" },
  { dot:"#f59e0b", text:"Marco Díaz llegó tarde",           hora:"08:47", sede:"PP" },
  { dot:"#C41A3A", text:"Carlos M. — nueva captación",      hora:"09:00", sede:"SA" },
  { dot:"#8b8fa8", text:"Solicitud adelanto — Sofía Ríos",  hora:"09:20", sede:"SA" },
];

const JALADORES_MOCK = [
  { nombre:"Miguel Torres", avatar:"MT", sedeColor:"#1d6fa4", captMes:28, meta:30, captHoy:6, comision:840, racha:8 },
  { nombre:"Carlos Mendoza",avatar:"CM", sedeColor:"#C41A3A", captMes:26, meta:30, captHoy:4, comision:780, racha:5 },
  { nombre:"Luis Ramos",    avatar:"LR", sedeColor:"#C41A3A", captMes:19, meta:30, captHoy:3, comision:570, racha:3 },
  { nombre:"Jhon Paredes",  avatar:"JP", sedeColor:"#1d6fa4", captMes:14, meta:30, captHoy:2, comision:420, racha:1 },
  { nombre:"Roberto Asto",  avatar:"RA", sedeColor:"#1d6fa4", captMes:9,  meta:30, captHoy:0, comision:270, racha:0 },
];

const ASIST_MOCK = [
  { nombre:"Ana Torres",    avatar:"AT", sedeColor:"#C41A3A", sede:"Santa Anita",   entrada:"08:02", estado:"presente" as const },
  { nombre:"Luis Vera",     avatar:"LV", sedeColor:"#C41A3A", sede:"Santa Anita",   entrada:"07:58", estado:"presente" as const },
  { nombre:"Marco Díaz",    avatar:"MD", sedeColor:"#1d6fa4", sede:"Puente Piedra", entrada:"08:47", estado:"tardanza" as const },
  { nombre:"Sofía Ríos",    avatar:"SR", sedeColor:"#C41A3A", sede:"Santa Anita",   entrada:"09:02", estado:"tardanza" as const },
  { nombre:"Carmen Flores", avatar:"CF", sedeColor:"#1d6fa4", sede:"Puente Piedra", entrada:"08:11", estado:"presente" as const },
  { nombre:"Pedro Chávez",  avatar:"PC", sedeColor:"#C41A3A", sede:"Santa Anita",   entrada:"—",     estado:"ausente"  as const },
];

const ADELANTOS_PEND = [
  { nombre:"Marco Díaz",    avatar:"MD", sedeColor:"#1d6fa4", monto:350, motivo:"Emergencia familiar", hace:"2h" },
  { nombre:"Carmen Flores", avatar:"CF", sedeColor:"#1d6fa4", monto:200, motivo:"Pago de alquiler",    hace:"5h" },
  { nombre:"Sofía Ríos",    avatar:"SR", sedeColor:"#C41A3A", monto:150, motivo:"Útiles escolares",    hace:"1d" },
];

export default function DashboardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalComis = JALADORES_MOCK.reduce((a,j)=>a+j.comision,0);
  const captHoy    = JALADORES_MOCK.reduce((a,j)=>a+j.captHoy,0);
  const presentes  = ASIST_MOCK.filter(w=>w.estado==="presente").length;

  return (
    <>
      <Topbar title="Dashboard General" subtitle="Dom 19 Abr 2026 · En vivo" onMenuToggle={()=>setMobileMenuOpen(true)} />
      <main className="page-main">
        {/* ====== KPIs ====== */}
        <div className="grid-stats" style={{ marginBottom:16 }}>
          <StatCard label="Planilla del mes"     value={money(28400)}   color="var(--brand)" sub="24 trabajadores activos" />
          <StatCard label="Comisiones jaladores" value={money(totalComis)} color="#16a34a" sub="5 jaladores · Abril"   />
          <StatCard label="Adelantos pendientes" value="3"              color="#f59e0b"      sub="S/ 700 por aprobar"  />
          <StatCard label="Captaciones hoy"      value={`${captHoy}`}  color="#6366f1"      sub="Todas las sedes"     />
        </div>

        {/* ====== Presencia + Jaladores ====== */}
        <div className="grid-2" style={{ marginBottom:16 }}>
          {/* Presencia */}
          <div className="card">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div>
                <div style={{ fontWeight:700,fontSize:15 }}>Presencia en Vivo</div>
                <div style={{ fontSize:11,color:"var(--text-muted)",fontFamily:"'DM Mono',monospace" }}>{presentes} presentes · {ASIST_MOCK.filter(w=>w.estado==="tardanza").length} tardanzas</div>
              </div>
              <div style={{ fontSize:28,fontWeight:800,color:"var(--brand)" }}>{Math.round((presentes/ASIST_MOCK.length)*100)}%</div>
            </div>
            {ASIST_MOCK.map((w,i)=>(
              <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:"var(--bg)",border:"1px solid var(--border)",marginBottom:6 }}>
                <Avatar initials={w.avatar} size={26} color={w.sedeColor} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600,fontSize:12 }}>{w.nombre}</div>
                  <div style={{ fontSize:10,color:"var(--text-muted)",fontFamily:"'DM Mono',monospace" }}>{w.sede} · {w.entrada}</div>
                </div>
                <Badge variant={w.estado} small />
              </div>
            ))}
          </div>

          {/* Jaladores ranking */}
          <div className="card">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <div>
                <div style={{ fontWeight:700,fontSize:15 }}>Ranking Jaladores</div>
                <div style={{ fontSize:11,color:"var(--text-muted)",fontFamily:"'DM Mono',monospace" }}>Abril 2026 · +{captHoy} hoy</div>
              </div>
              <span style={{ fontSize:11,background:"rgba(196,26,58,0.1)",color:"var(--brand)",borderRadius:99,padding:"3px 10px",fontWeight:600 }}>+{captHoy} hoy</span>
            </div>
            {[...JALADORES_MOCK].sort((a,b)=>b.captMes-a.captMes).map((j,i)=>{
              const pct = Math.round((j.captMes/j.meta)*100);
              const medals = ["🥇","🥈","🥉"];
              return (
                <div key={j.nombre} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                    <span style={{ fontSize:16,width:22,textAlign:"center" }}>{i<3?medals[i]:<span style={{ fontSize:11,color:"var(--text-muted)" }}>{i+1}</span>}</span>
                    <Avatar initials={j.avatar} size={22} color={j.sedeColor} />
                    <span style={{ flex:1,fontWeight:600,fontSize:12 }}>{j.nombre}</span>
                    {j.racha>0 && <span style={{ fontSize:11,color:"#f59e0b" }}>🔥{j.racha}</span>}
                    <span style={{ fontSize:11,fontWeight:700,color:pct>=80?"#22c55e":"var(--brand)",fontFamily:"'DM Mono',monospace" }}>{pct}%</span>
                  </div>
                  <div style={{ paddingLeft:30 }}><ProgressBar value={pct} showPct={false} /></div>
                </div>
              );
            })}
            <div style={{ marginTop:10,padding:"10px 12px",background:"rgba(196,26,58,0.06)",border:"1px solid rgba(196,26,58,0.15)",borderRadius:9,display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontSize:12,color:"var(--text-muted)" }}>Total comisiones</span>
              <span style={{ fontSize:15,fontWeight:800,color:"var(--brand)" }}>{money(totalComis)}</span>
            </div>
          </div>
        </div>

        {/* ====== Adelantos + Feed ====== */}
        <div className="grid-2">
          {/* Adelantos pendientes */}
          <div className="card" style={{ border:"1px solid rgba(245,158,11,0.3)",borderLeft:"4px solid #f59e0b" }}>
            <div style={{ fontWeight:700,fontSize:15,marginBottom:4 }}>⚠️ Adelantos Pendientes</div>
            <div style={{ fontSize:11,color:"var(--text-muted)",fontFamily:"'DM Mono',monospace",marginBottom:14 }}>Requieren aprobación</div>
            {ADELANTOS_PEND.map((a,i)=>(
              <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,marginBottom:8 }}>
                <Avatar initials={a.avatar} size={34} color={a.sedeColor} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:13 }}>{a.nombre}</div>
                  <div style={{ fontSize:11,color:"var(--text-muted)" }}>{a.motivo} · hace {a.hace}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:800,fontSize:16,color:"var(--brand)" }}>{money(a.monto)}</div>
                  <div style={{ display:"flex",gap:6,marginTop:4 }}>
                    <button className="btn-ghost" style={{ fontSize:10,padding:"3px 8px",borderRadius:6 }}>✕</button>
                    <button style={{ background:"#16a34a",color:"#fff",border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'Bricolage Grotesque',sans-serif" }}>✓ Aprobar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feed actividad */}
          <div className="card">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div>
                <div style={{ fontWeight:700,fontSize:15 }}>Actividad Reciente</div>
                <div style={{ fontSize:11,color:"var(--text-muted)",fontFamily:"'DM Mono',monospace" }}>Últimos movimientos</div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:"#22c55e" }} className="animate-pulse-dot" />
                <span style={{ fontSize:10,color:"#16a34a",fontWeight:600,fontFamily:"'DM Mono',monospace" }}>LIVE</span>
              </div>
            </div>
            {FEED.map((f,i)=>(
              <div key={i} style={{ display:"flex",gap:10,paddingBottom:i<FEED.length-1?12:0,borderBottom:i<FEED.length-1?"1px solid var(--border)":"none",marginBottom:i<FEED.length-1?12:0 }}>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center" }}>
                  <div style={{ width:8,height:8,borderRadius:"50%",background:f.dot,marginTop:3,flexShrink:0 }} />
                  {i<FEED.length-1 && <div style={{ width:1,flex:1,background:"var(--border)",marginTop:3 }} />}
                </div>
                <div>
                  <div style={{ fontSize:12,fontWeight:500 }}>{f.text}</div>
                  <div style={{ fontSize:10,color:"var(--text-muted)",fontFamily:"'DM Mono',monospace" }}>{f.hora} · {f.sede}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
