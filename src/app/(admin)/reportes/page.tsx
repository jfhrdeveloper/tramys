"use client";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { Icon } from "@/components/ui/Icons";
import { money } from "@/lib/utils/formatters";

/* ================= DATOS MOCK ================= */
const PLANILLA_MESES = [
  { mes:"Ene", sa:15200, pp:10800 },
  { mes:"Feb", sa:15800, pp:11200 },
  { mes:"Mar", sa:16100, pp:11000 },
  { mes:"Abr", sa:16800, pp:11600 },
];

const ASIST_SEMANA = [
  { dia:"Lun", presentes:20, tardanzas:2, ausentes:2 },
  { dia:"Mar", presentes:22, tardanzas:1, ausentes:1 },
  { dia:"Mié", presentes:21, tardanzas:3, ausentes:0 },
  { dia:"Jue", presentes:19, tardanzas:2, ausentes:3 },
  { dia:"Vie", presentes:23, tardanzas:0, ausentes:1 },
  { dia:"Sáb", presentes:8,  tardanzas:1, ausentes:1 },
  { dia:"Dom", presentes:18, tardanzas:2, ausentes:4 },
];

const CAPT_SEMANA = [
  { dia:"Lun", sa:8,  pp:5  },
  { dia:"Mar", sa:10, pp:7  },
  { dia:"Mié", sa:7,  pp:6  },
  { dia:"Jue", sa:9,  pp:4  },
  { dia:"Vie", sa:12, pp:8  },
  { dia:"Sáb", sa:6,  pp:3  },
  { dia:"Dom", sa:14, pp:9  },
];

const REPORTES_LIST = [
  { id:"planilla",    icono:"💰", titulo:"Planilla mensual",       desc:"Sueldos, descuentos y netos de todos los trabajadores",      formatos:["PDF","Excel"] },
  { id:"asistencia",  icono:"📅", titulo:"Asistencia mensual",     desc:"Registro completo de entradas, salidas y estados del mes",    formatos:["PDF","Excel"] },
  { id:"jaladores",   icono:"🎯", titulo:"Reporte de jaladores",   desc:"Captaciones, metas, comisiones y ranking del mes",            formatos:["PDF","Excel"] },
  { id:"adelantos",   icono:"💳", titulo:"Adelantos emitidos",     desc:"Historial de adelantos aprobados, rechazados y pendientes",   formatos:["PDF","Excel"] },
  { id:"trabajador",  icono:"👤", titulo:"Planilla por trabajador",desc:"Desglose individual de sueldo, tardanzas y adelantos",        formatos:["PDF"]         },
  { id:"sedes",       icono:"🏢", titulo:"Resumen de sedes",       desc:"Comparativa de asistencia y planilla por sede",              formatos:["PDF","Excel"] },
];

/* ================= GRÁFICA BARRAS APILADAS ================= */
function GraficaBarras({
  data, keysY, colores, labelX,
}: {
  data: Record<string,number|string>[];
  keysY: string[]; colores: string[]; labelX: string;
}) {
  const maxVal = Math.max(...data.map(d => keysY.reduce((a,k) => a + (Number(d[k]) || 0), 0)));
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-end", height:90 }}>
      {data.map((d, i) => {
        const total = keysY.reduce((a,k) => a + (Number(d[k]) || 0), 0);
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:"100%", display:"flex", flexDirection:"column", height:72, justifyContent:"flex-end" }}>
              {keysY.map((k, ki) => (
                <div key={k} style={{
                  width:"100%",
                  borderRadius: ki===0 ? "0 0 4px 4px" : ki===keysY.length-1 ? "4px 4px 0 0" : "0",
                  height:`${((Number(d[k])||0)/maxVal)*72}px`,
                  background: colores[ki], minHeight: 2,
                }} />
              ))}
            </div>
            <span style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{String(d[labelX])}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ================= GRÁFICA LÍNEA SVG ================= */
function GraficaLinea({
  data, keyA, keyB, colorA, colorB,
}: {
  data: Record<string,number|string>[];
  keyA: string; keyB: string; colorA: string; colorB: string;
}) {
  const W = 300, H = 80;
  const maxVal = Math.max(...data.flatMap(d => [Number(d[keyA])||0, Number(d[keyB])||0]));

  const pts = (key: string) => data.map((d, i) => [
    (i / (data.length - 1)) * (W - 20) + 10,
    H - 10 - ((Number(d[key])||0) / maxVal) * (H - 20),
  ] as [number,number]);

  const path = (p: [number,number][]) => p.map((pt, i) => i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ height:80 }}>
      <path d={path(pts(keyA))} fill="none" stroke={colorA} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path(pts(keyB))} fill="none" stroke={colorB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
      {pts(keyA).map((p, i) => <circle key={`a${i}`} cx={p[0]} cy={p[1]} r="3" fill={colorA} />)}
      {pts(keyB).map((p, i) => <circle key={`b${i}`} cx={p[0]} cy={p[1]} r="3" fill={colorB} />)}
    </svg>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function ReportesPage() {
  const [tab,         setTab]         = useState<"graficas"|"exportar">("graficas");
  const [mesSelected, setMesSelected] = useState("Abril 2026");
  const [descargando, setDescargando] = useState<string|null>(null);

  function simularDescarga(id: string) {
    setDescargando(id);
    setTimeout(() => setDescargando(null), 1800);
  }

  const INSIGHTS = [
    { icon:"📅", label:"Días mayor asistencia",    value:"Martes y Miércoles"     },
    { icon:"🏆", label:"Jalador top del mes",       value:"Miguel Torres (93%)"    },
    { icon:"🏢", label:"Sede más puntual",          value:"Santa Anita (91%)"      },
    { icon:"🎯", label:"Mayor captación en un día", value:"Viernes (20 clientes)"  },
    { icon:"⚠️", label:"Tardanzas más frecuentes",  value:"Marco Díaz (4)"         },
    { icon:"✅", label:"Total planilla pagada",     value:money(18400)             },
  ];

  return (
    <>
      <Topbar title="Reportes y Exportación" subtitle="Datos actualizados en tiempo real" onMenuToggle={()=>{}} />
      <main className="page-main">

        {/* Tabs + selector mes */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", gap:0, background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, padding:3 }}>
            {(["graficas","exportar"] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 18px", borderRadius:8, border:"none", cursor:"pointer", background:tab===t?"var(--brand)":"transparent", color:tab===t?"#fff":"var(--text-muted)", fontWeight:tab===t?700:500, fontSize:12, fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.2s" }}>
                {t==="graficas"?"📊 Gráficas":"📥 Exportar"}
              </button>
            ))}
          </div>
          <select className="select-base" value={mesSelected} onChange={e=>setMesSelected(e.target.value)}>
            {["Abril 2026","Marzo 2026","Febrero 2026","Enero 2026"].map(m=><option key={m}>{m}</option>)}
          </select>
        </div>

        {/* ====== TAB GRÁFICAS ====== */}
        {tab==="graficas" && (
          <>
            <div className="grid-stats" style={{ marginBottom:16 }}>
              <StatCard label="Planilla total"      value={money(28400)} color="var(--brand)"  sub="Ambas sedes · Abril" />
              <StatCard label="Asistencia promedio" value="82%"          color="#16a34a"       sub="Esta semana"          />
              <StatCard label="Captaciones mes"     value="96"           color="#6366f1"       sub="5 jaladores activos"  />
              <StatCard label="Comisiones mes"      value={money(2880)}  color="#f59e0b"       sub="A pagar fin de mes"   />
            </div>

            <div className="grid-2" style={{ marginBottom:16 }}>
              {/* Planilla por sede */}
              <div className="card">
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Planilla por Sede</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom:16 }}>Enero — Abril 2026</div>
                <GraficaBarras data={PLANILLA_MESES} keysY={["sa","pp"]} colores={["var(--brand)","#1d6fa4"]} labelX="mes" />
                <div style={{ display:"flex", gap:16, marginTop:10 }}>
                  {[["Santa Anita","var(--brand)"],["Puente Piedra","#1d6fa4"]].map(([l,c])=>(
                    <div key={String(l)} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:String(c) }} />
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>{l}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:"var(--text-muted)" }}>Total Abril</span>
                  <span style={{ fontWeight:800, fontSize:15, color:"var(--brand)" }}>{money(28400)}</span>
                </div>
              </div>

              {/* Asistencia semanal */}
              <div className="card">
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Asistencia — Esta Semana</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom:16 }}>14–19 Abril 2026</div>
                <GraficaBarras data={ASIST_SEMANA} keysY={["presentes","tardanzas","ausentes"]} colores={["#22c55e","var(--brand)","#d1d5db"]} labelX="dia" />
                <div style={{ display:"flex", gap:14, marginTop:10 }}>
                  {[["Presentes","#22c55e"],["Tardanzas","var(--brand)"],["Ausentes","#d1d5db"]].map(([l,c])=>(
                    <div key={String(l)} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:String(c) }} />
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid-2">
              {/* Captaciones por sede */}
              <div className="card">
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Captaciones por Sede</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom:12 }}>Comparativa semanal</div>
                <GraficaLinea data={CAPT_SEMANA} keyA="sa" keyB="pp" colorA="var(--brand)" colorB="#1d6fa4" />
                <div style={{ display:"flex", gap:5, marginTop:4, justifyContent:"space-between" }}>
                  {CAPT_SEMANA.map(d=><span key={d.dia} style={{ flex:1, textAlign:"center", fontSize:9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{d.dia}</span>)}
                </div>
                <div style={{ display:"flex", gap:16, marginTop:10 }}>
                  {[["Santa Anita","var(--brand)","——"],["Puente Piedra","#1d6fa4","- -"]].map(([l,c,dash])=>(
                    <div key={String(l)} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ fontSize:11, color:String(c), fontFamily:"'DM Mono',monospace" }}>{dash}</span>
                      <span style={{ fontSize:11, color:"var(--text-muted)" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="card">
                <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Resumen del Mes</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {INSIGHTS.map((r, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8 }}>
                      <span style={{ fontSize:16 }}>{r.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{r.label}</div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{r.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ====== TAB EXPORTAR ====== */}
        {tab==="exportar" && (
          <>
            <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>
              Selecciona el reporte que necesitas descargar · Período: <strong style={{ color:"var(--text)" }}>{mesSelected}</strong>
            </div>

            <div className="grid-2" style={{ marginBottom:16 }}>
              {REPORTES_LIST.map(r => {
                const cargando = descargando===r.id;
                return (
                  <div key={r.id} className="card" style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                    <div style={{ fontSize:28, flexShrink:0 }}>{r.icono}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{r.titulo}</div>
                      <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:10, lineHeight:1.5 }}>{r.desc}</div>
                      <div style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom:10 }}>
                        Período: <span style={{ color:"var(--text)", fontWeight:600 }}>{mesSelected}</span>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        {r.formatos.map(f => (
                          <button key={f} onClick={() => simularDescarga(`${r.id}-${f}`)} disabled={cargando} style={{
                            padding:"7px 14px", borderRadius:8, cursor:cargando?"not-allowed":"pointer", fontSize:12, fontWeight:600,
                            background:cargando?"var(--border)":f==="PDF"?"var(--brand)":"transparent",
                            color:cargando?"var(--text-muted)":f==="PDF"?"#fff":"var(--brand)",
                            border:f==="PDF"?"none":`1px solid var(--brand)`,
                            fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.15s",
                            display:"flex", alignItems:"center", gap:5,
                          }}>
                            {cargando ? (
                              <><div style={{ width:12,height:12,border:`2px solid var(--text-muted)`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite" }} />Generando...</>
                            ) : (
                              <><Icon name="download" size={12} color={f==="PDF"?"#fff":"var(--brand)"} />{f}</>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exportación masiva */}
            <div className="card" style={{ border:"1px solid rgba(196,26,58,0.2)", borderLeft:"4px solid var(--brand)" }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>Exportación Completa del Mes</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:16 }}>
                Descarga todos los reportes de {mesSelected} en un solo archivo comprimido (.zip)
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <button className="btn-primary" style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Icon name="download" size={13} color="#fff" /> 📦 Descargar todo — {mesSelected}
                </button>
                <button className="btn-outline" style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Icon name="timer" size={13} /> Programar envío automático
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}