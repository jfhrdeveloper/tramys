"use client";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { money, iniciales } from "@/lib/utils/formatters";

const SEDES = [
  { id:"sa", nombre:"Santa Anita",   color:"#C41A3A", encargado:"Ricardo Palma", encAvatar:"RP", horario:"08:00–18:00", tel:"01 234-5678", workers:14, presentes:11, tardanzas:2, ausentes:1, jaladores:5, captHoy:9, planilla:16800,
    trabajadores:[{n:"Ana Torres",av:"AT",cargo:"Asistente",estado:"presente"as const},{n:"Luis Vera",av:"LV",cargo:"Asistente",estado:"presente"as const},{n:"Sofía Ríos",av:"SR",cargo:"Asistente",estado:"tardanza"as const},{n:"Carmen Flores",av:"CF",cargo:"Operadora",estado:"presente"as const},{n:"Pedro Chávez",av:"PC",cargo:"Operador",estado:"ausente"as const}] },
  { id:"pp", nombre:"Puente Piedra", color:"#1d6fa4", encargado:"Dueña (Owner)", encAvatar:"DU", horario:"08:00–18:00", tel:"01 876-5432", workers:10, presentes:7,  tardanzas:1, ausentes:2, jaladores:3, captHoy:5,  planilla:11600,
    trabajadores:[{n:"Marco Díaz",av:"MD",cargo:"Asistente",estado:"tardanza"as const},{n:"Rosa Huanca",av:"RH",cargo:"Operadora",estado:"presente"as const},{n:"Jorge Quispe",av:"JQ",cargo:"Asistente",estado:"presente"as const},{n:"María Soto",av:"MS",cargo:"Operadora",estado:"ausente"as const}] },
];

export default function SedesPage() {
  const [expanded, setExpanded] = useState<Record<string,boolean>>({});
  const totalW = SEDES.reduce((a,s)=>a+s.workers,0);
  const totalP = SEDES.reduce((a,s)=>a+s.presentes,0);

  return (
    <>
      <Topbar title="Sedes" subtitle={`${SEDES.length} sedes activas`} onMenuToggle={()=>{}} />
      <main className="page-main">
        <div className="grid-stats" style={{ marginBottom:16 }}>
          <StatCard label="Total trabajadores" value={totalW}                 color="var(--text)" sub="Ambas sedes" />
          <StatCard label="Presentes hoy"      value={totalP}                 color="#16a34a"     sub={`${Math.round((totalP/totalW)*100)}% asistencia`} />
          <StatCard label="Captaciones hoy"    value={SEDES.reduce((a,s)=>a+s.captHoy,0)} color="#6366f1" sub="Todos jaladores" />
          <StatCard label="Planilla mes"        value={`S/ ${(SEDES.reduce((a,s)=>a+s.planilla,0)/1000).toFixed(1)}k`} color="var(--brand)" sub="Ambas sedes" />
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          {SEDES.map(sede=>{
            const pct = Math.round((sede.presentes/sede.workers)*100);
            const exp = expanded[sede.id];
            return (
              <div key={sede.id} className="card" style={{ padding:0,overflow:"hidden" }}>
                <div style={{ height:5,background:`linear-gradient(90deg,${sede.color}99,${sede.color})` }} />
                <div style={{ padding:22 }}>
                  <div style={{ display:"flex",gap:14,alignItems:"center",marginBottom:16 }}>
                    <div style={{ width:48,height:48,borderRadius:12,background:`${sede.color}18`,border:`1px solid ${sede.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>🏢</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800,fontSize:18 }}>{sede.nombre}</div>
                      <div style={{ fontSize:11,color:"var(--text-muted)",marginTop:2 }}>Encargado: <span style={{ color:sede.color,fontWeight:600 }}>{sede.encargado}</span></div>
                    </div>
                    <span style={{ background:"rgba(34,197,94,0.12)",color:"#16a34a",borderRadius:99,padding:"4px 12px",fontSize:11,fontWeight:700 }}>● Activa</span>
                  </div>
                  <div className="grid-3" style={{ gap:8,marginBottom:14 }}>
                    {[["👥",sede.workers,"trabajadores"],["✅",sede.presentes,"presentes"],["⚠️",sede.tardanzas,"tardanzas"],["🎯",sede.jaladores,"jaladores"],["+",sede.captHoy,"capt. hoy"],["💰",`S/${(sede.planilla/1000).toFixed(0)}k`,"planilla"]].map(([ico,val,lbl])=>(
                      <div key={String(lbl)} style={{ background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,padding:"8px",textAlign:"center" }}>
                        <div style={{ fontSize:14 }}>{ico}</div>
                        <div style={{ fontWeight:800,fontSize:16,color:sede.color }}>{val}</div>
                        <div style={{ fontSize:9,color:"var(--text-muted)" }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12 }}>
                    <span style={{ fontWeight:500 }}>Asistencia hoy</span>
                    <span style={{ fontWeight:700,color:sede.color }}>{pct}%</span>
                  </div>
                  <div style={{ height:7,background:"var(--border)",borderRadius:99,overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${sede.color}99,${sede.color})`,borderRadius:99,transition:"width 0.6s" }} />
                  </div>
                </div>
                <div onClick={()=>setExpanded(p=>({...p,[sede.id]:!p[sede.id]}))} style={{ padding:"11px 22px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",cursor:"pointer",transition:"background 0.15s" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--hover)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                >
                  <span style={{ fontSize:13,fontWeight:600,color:exp?sede.color:"var(--text-muted)" }}>{exp?"Ocultar trabajadores":`Ver ${sede.trabajadores.length} trabajadores`}</span>
                  <span style={{ fontSize:12,color:"var(--text-muted)",display:"inline-block",transform:exp?"rotate(180deg)":"none",transition:"transform 0.2s" }}>▼</span>
                </div>
                {exp && (
                  <div style={{ padding:"0 22px 20px" }}>
                    <div className="table-wrap">
                      <table className="tramys-table">
                        <thead><tr><th>Trabajador</th><th>Cargo</th><th>Estado</th></tr></thead>
                        <tbody>
                          {sede.trabajadores.map((w,i)=>(
                            <tr key={i}>
                              <td><div style={{ display:"flex",alignItems:"center",gap:8 }}><Avatar initials={w.av} size={26} color={sede.color} /><span style={{ fontWeight:600,fontSize:13 }}>{w.n}</span></div></td>
                              <td style={{ color:"var(--text-muted)",fontSize:12 }}>{w.cargo}</td>
                              <td><Badge variant={w.estado} small /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
