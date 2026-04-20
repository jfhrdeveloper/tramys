"use client";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { money, iniciales } from "@/lib/utils/formatters";

/* ================= TIPOS ================= */
interface Jalador {
  id: string; nombre: string; sede: string; sedeColor: string;
  meta: number; captMes: number; captHoy: number;
  comisionUnit: number; racha: number;
  badges: string[];
  zonas: string[];
  historial: { dia: string; capt: number; monto: number }[];
}

/* ================= MOCK DATA ================= */
const MOCK_JALADORES: Jalador[] = [
  { id:"1", nombre:"Miguel Torres",  sede:"Puente Piedra", sedeColor:"#1d6fa4", meta:30, captMes:28, captHoy:6, comisionUnit:30, racha:8, badges:["🏆 Top del mes","⭐ Meta cumplida"], zonas:["Jr. Comercio","Av. Túpac Amaru"],
    historial:[{dia:"Lun",capt:5,monto:150},{dia:"Mar",capt:4,monto:120},{dia:"Mié",capt:6,monto:180},{dia:"Jue",capt:3,monto:90},{dia:"Vie",capt:4,monto:120},{dia:"Dom",capt:6,monto:180}] },
  { id:"2", nombre:"Carlos Mendoza", sede:"Santa Anita",   sedeColor:"#C41A3A", meta:30, captMes:26, captHoy:4, comisionUnit:30, racha:5, badges:["⭐ Meta cumplida"], zonas:["Av. Los Chancas","Mercado Central"],
    historial:[{dia:"Lun",capt:4,monto:120},{dia:"Mar",capt:5,monto:150},{dia:"Mié",capt:3,monto:90},{dia:"Jue",capt:4,monto:120},{dia:"Vie",capt:5,monto:150},{dia:"Dom",capt:5,monto:150}] },
  { id:"3", nombre:"Luis Ramos",     sede:"Santa Anita",   sedeColor:"#C41A3A", meta:30, captMes:19, captHoy:3, comisionUnit:30, racha:3, badges:[], zonas:["Parque Industrial"],
    historial:[{dia:"Lun",capt:3,monto:90},{dia:"Mar",capt:2,monto:60},{dia:"Mié",capt:4,monto:120},{dia:"Jue",capt:3,monto:90},{dia:"Vie",capt:4,monto:120},{dia:"Dom",capt:3,monto:90}] },
  { id:"4", nombre:"Jhon Paredes",   sede:"Puente Piedra", sedeColor:"#1d6fa4", meta:30, captMes:14, captHoy:2, comisionUnit:30, racha:1, badges:[], zonas:["Jr. Huaraz"],
    historial:[{dia:"Lun",capt:2,monto:60},{dia:"Mar",capt:3,monto:90},{dia:"Mié",capt:1,monto:30},{dia:"Jue",capt:2,monto:60},{dia:"Vie",capt:4,monto:120},{dia:"Dom",capt:2,monto:60}] },
  { id:"5", nombre:"Roberto Asto",   sede:"Puente Piedra", sedeColor:"#1d6fa4", meta:30, captMes:9,  captHoy:0, comisionUnit:30, racha:0, badges:[], zonas:["Av. Universitaria"],
    historial:[{dia:"Lun",capt:2,monto:60},{dia:"Mar",capt:1,monto:30},{dia:"Mié",capt:2,monto:60},{dia:"Jue",capt:1,monto:30},{dia:"Vie",capt:3,monto:90},{dia:"Dom",capt:0,monto:0}] },
];

/* ================= MINI GRÁFICA BARRAS ================= */
function MiniBarras({ data }: { data: { dia:string; capt:number }[] }) {
  const max = Math.max(...data.map(d => d.capt), 1);
  return (
    <div style={{ display:"flex", gap:5, alignItems:"flex-end", height:60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <div style={{ width:"100%", borderRadius:"3px 3px 0 0", height:`${(d.capt/max)*52}px`, background: i===data.length-1 ? "linear-gradient(180deg,#e8304d,#a01530)" : "rgba(196,26,58,0.35)", minHeight:3 }} />
          <span style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{d.dia}</span>
        </div>
      ))}
    </div>
  );
}

/* ================= PERFIL JALADOR ================= */
function PerfilJalador({ j, onBack }: { j: Jalador; onBack: ()=>void }) {
  const [monto,      setMonto]      = useState("");
  const [zona,       setZona]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [registrado, setRegistrado] = useState(false);

  const pct          = Math.round((j.captMes / j.meta) * 100);
  const comisionTotal = j.captMes * j.comisionUnit;
  const barColor     = pct >= 80 ? "#22c55e" : pct >= 50 ? "var(--brand)" : "#f59e0b";

  function registrarCaptacion(cantidad: number) {
    setLoading(true);
    setTimeout(() => { setLoading(false); setRegistrado(true); setTimeout(() => setRegistrado(false), 2000); }, 800);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <button onClick={onBack} className="btn-outline" style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap:6 }}>
        <Icon name="arrow_left" size={14} /> Volver a Jaladores
      </button>

      {/* ====== Header ====== */}
      <div className="card" style={{ display:"flex", gap:18, alignItems:"flex-start", flexWrap:"wrap" }}>
        <Avatar initials={iniciales(j.nombre)} size={56} color={j.sedeColor} />
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontWeight:800, fontSize:20, marginBottom:4 }}>{j.nombre}</div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:12 }}>
            Jalador · <span style={{ color:j.sedeColor, fontWeight:600 }}>{j.sede}</span>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {j.badges.map((b,i) => (
              <span key={i} style={{ background:"rgba(196,26,58,0.08)", color:"var(--brand)", borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:600 }}>{b}</span>
            ))}
            {j.racha > 0 && (
              <span style={{ background:"rgba(245,158,11,0.1)", color:"#d97706", borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:600 }}>
                <Icon name="flame" size={11} /> Racha {j.racha} días
              </span>
            )}
          </div>
        </div>
        <div style={{ background:"rgba(196,26,58,0.06)", border:"1px solid rgba(196,26,58,0.2)", borderRadius:12, padding:"16px 20px", textAlign:"center" }}>
          <div style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>Comisión mes</div>
          <div style={{ fontSize:24, fontWeight:800, color:"var(--brand)" }}>{money(comisionTotal)}</div>
          <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>{j.captMes} capt. × {money(j.comisionUnit)}</div>
        </div>
      </div>

      {/* ====== Meta + stats ====== */}
      <div className="card">
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontWeight:600, fontSize:14 }}>Progreso de meta mensual</span>
          <span style={{ fontWeight:700, color:barColor, fontFamily:"'DM Mono',monospace" }}>{j.captMes}/{j.meta} ({pct}%)</span>
        </div>
        <ProgressBar value={pct} height={10} showPct={false} />
        {pct >= 100 && <div style={{ fontSize:12, color:"#16a34a", fontWeight:600, marginTop:6 }}>✓ Meta cumplida este mes</div>}

        <div className="grid-stats" style={{ marginTop:16 }}>
          {[
            { label:"Captaciones hoy",  value:j.captHoy,          color:j.captHoy>0?"#16a34a":"var(--text-muted)" },
            { label:"Meta mensual",     value:j.meta,              color:"var(--text)" },
            { label:"Comisión/capt.",   value:money(j.comisionUnit), color:"var(--brand)" },
            { label:"Zonas activas",    value:j.zonas.length,     color:"#6366f1" },
          ].map(s => <StatCard key={s.label} label={s.label} value={s.value} color={s.color} accent="top" />)}
        </div>
      </div>

      {/* ====== Historial + Registrar ====== */}
      <div className="grid-2">

        {/* Historial semanal */}
        <div className="card">
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Captaciones — última semana</div>
          <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom:16 }}>
            Total: {j.historial.reduce((a,d)=>a+d.capt,0)} capt. · {money(j.historial.reduce((a,d)=>a+d.monto,0))}
          </div>
          <MiniBarras data={j.historial} />
          <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:0 }}>
            {j.historial.map((d, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom: i<j.historial.length-1?"1px solid var(--border)":"none" }}>
                <span style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{d.dia}</span>
                <div style={{ display:"flex", gap:14 }}>
                  <span style={{ fontSize:12, fontWeight:600 }}>{d.capt} capt.</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"var(--brand)" }}>{money(d.monto)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registrar captación */}
        <div className="card">
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Registrar captación de hoy</div>
          <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom:16 }}>
            Captaciones hoy: <strong style={{ color:"var(--text)" }}>{j.captHoy}</strong>
          </div>

          {registrado && (
            <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#16a34a", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
              <Icon name="check_circle" size={14} color="#16a34a" /> ¡Captación registrada!
            </div>
          )}

          {/* Opción 1 — botones rápidos */}
          <div style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>
            Opción 1 — Cantidad de captaciones
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:6 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => registrarCaptacion(n)} disabled={loading} style={{ flex:1, padding:"10px 0", borderRadius:8, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.15s" }}
                onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background="var(--brand)"; (e.currentTarget as HTMLElement).style.color="#fff"; (e.currentTarget as HTMLElement).style.borderColor="var(--brand)"; }}
                onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="var(--bg)"; (e.currentTarget as HTMLElement).style.color="var(--text)"; (e.currentTarget as HTMLElement).style.borderColor="var(--border)"; }}
              >+{n}</button>
            ))}
          </div>
          <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:16 }}>Comisión automática: {money(j.comisionUnit)} por captación</div>

          {/* Separador */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ flex:1, height:1, background:"var(--border)" }} />
            <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>o</span>
            <div style={{ flex:1, height:1, background:"var(--border)" }} />
          </div>

          {/* Opción 2 — monto manual */}
          <div style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>
            Opción 2 — Monto manual del día
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <input className="input-base input-mono" placeholder="S/ 0.00" value={monto} onChange={e=>setMonto(e.target.value)} />
            <button className="btn-primary" onClick={() => registrarCaptacion(0)}>Guardar</button>
          </div>

          {/* Zonas */}
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:14 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Zonas de captación</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {j.zonas.map((z,i) => (
                <span key={i} style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:99, padding:"4px 12px", fontSize:11, display:"flex", alignItems:"center", gap:5 }}>
                  <Icon name="map_pin" size={11} color="var(--text-muted)" /> {z}
                </span>
              ))}
              <button className="btn-ghost" style={{ border:"1px dashed var(--border)", borderRadius:99, padding:"4px 12px", fontSize:11, display:"flex", alignItems:"center", gap:5 }}>
                <Icon name="plus" size={11} /> Agregar zona
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function JaladoresPage() {
  const [jaladorSel, setJaladorSel] = useState<Jalador|null>(null);
  const sorted       = [...MOCK_JALADORES].sort((a,b) => b.captMes-a.captMes);
  const totalComis   = MOCK_JALADORES.reduce((a,j)=>a+j.captMes*j.comisionUnit,0);
  const captHoy      = MOCK_JALADORES.reduce((a,j)=>a+j.captHoy,0);
  const captMes      = MOCK_JALADORES.reduce((a,j)=>a+j.captMes,0);
  const promMeta     = Math.round(MOCK_JALADORES.reduce((a,j)=>a+(j.captMes/j.meta)*100,0)/MOCK_JALADORES.length);
  const MEDALS       = ["🥇","🥈","🥉"];

  if (jaladorSel) return (
    <>
      <Topbar title={jaladorSel.nombre} subtitle={`${jaladorSel.sede} · Hoy: ${jaladorSel.captHoy} captaciones`} onMenuToggle={()=>{}} />
      <main className="page-main"><PerfilJalador j={jaladorSel} onBack={()=>setJaladorSel(null)} /></main>
    </>
  );

  return (
    <>
      <Topbar title="Jaladores" subtitle={`${MOCK_JALADORES.length} jaladores activos · Abril 2026`} onMenuToggle={()=>{}} />
      <main className="page-main">

        {/* Stats */}
        <div className="grid-stats" style={{ marginBottom:16 }}>
          <StatCard label="Total jaladores"    value={MOCK_JALADORES.length} color="var(--text)"  />
          <StatCard label="Captaciones hoy"    value={captHoy}               color="#6366f1"       />
          <StatCard label="Captaciones mes"    value={captMes}               color="var(--brand)"  sub={`Meta prom. ${promMeta}%`} />
          <StatCard label="Comisiones totales" value={money(totalComis)}     color="#16a34a"       sub="A pagar este mes" />
        </div>

        {/* Ranking + Cards */}
        <div className="grid-2">

          {/* Ranking */}
          <div className="card">
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>Ranking del Mes</div>
            <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom:20 }}>Abril 2026 · Por captaciones</div>

            {sorted.map((j,i) => {
              const pct      = Math.round((j.captMes/j.meta)*100);
              const barColor = pct>=80?"#22c55e":pct>=50?"var(--brand)":"#f59e0b";
              return (
                <div key={j.id} style={{ marginBottom:14, cursor:"pointer" }} onClick={()=>setJaladorSel(j)}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <span style={{ fontSize:18, width:24, textAlign:"center", flexShrink:0 }}>
                      {i<3 ? MEDALS[i] : <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{i+1}</span>}
                    </span>
                    <Avatar initials={iniciales(j.nombre)} size={24} color={j.sedeColor} />
                    <span style={{ flex:1, fontWeight:600, fontSize:13 }}>{j.nombre}</span>
                    {j.racha>0 && <span style={{ fontSize:11, color:"#f59e0b" }}>🔥{j.racha}</span>}
                    <span style={{ fontSize:12, fontWeight:700, color:barColor, fontFamily:"'DM Mono',monospace" }}>{pct}%</span>
                  </div>
                  <div style={{ paddingLeft:32, display:"flex", alignItems:"center", gap:8 }}>
                    <ProgressBar value={pct} showPct={false} />
                    <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", minWidth:36 }}>{j.captMes}/{j.meta}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"#16a34a", minWidth:52, textAlign:"right" }}>{money(j.captMes*j.comisionUnit)}</span>
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop:10, padding:"10px 12px", background:"rgba(196,26,58,0.06)", border:"1px solid rgba(196,26,58,0.15)", borderRadius:9, display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)" }}>Total comisiones</span>
              <span style={{ fontSize:16, fontWeight:800, color:"var(--brand)" }}>{money(totalComis)}</span>
            </div>
          </div>

          {/* Cards individuales */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {sorted.map((j,i) => {
              const pct      = Math.round((j.captMes/j.meta)*100);
              const barColor = pct>=80?"#22c55e":pct>=50?"var(--brand)":"#f59e0b";
              return (
                <div key={j.id} onClick={()=>setJaladorSel(j)} className="card" style={{ cursor:"pointer", borderLeft:`4px solid ${j.sedeColor}`, padding:"16px 18px", transition:"all 0.2s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 4px 16px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.transform="translateY(-1px)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow="none"; (e.currentTarget as HTMLElement).style.transform="translateY(0)";}}
                >
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    <Avatar initials={iniciales(j.nombre)} size={38} color={j.sedeColor} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                        <span style={{ fontWeight:700, fontSize:14 }}>{j.nombre}</span>
                        <span style={{ fontSize:11, color:j.sedeColor, fontWeight:600 }}>{j.sede}</span>
                        {j.badges[0] && <span style={{ fontSize:11 }}>{j.badges[0]}</span>}
                      </div>
                      <div style={{ marginBottom:6 }}><ProgressBar value={pct} showPct={false} /></div>
                      <div style={{ display:"flex", gap:14, fontSize:11, color:"var(--text-muted)" }}>
                        <span>📅 {j.captMes}/{j.meta} mes</span>
                        <span>Hoy: <strong style={{ color:j.captHoy>0?"#16a34a":"var(--text-muted)" }}>+{j.captHoy}</strong></span>
                        {j.racha>0 && <span style={{ color:"#f59e0b" }}>🔥 {j.racha} días</span>}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:16, fontWeight:800, color:"var(--brand)" }}>{money(j.captMes*j.comisionUnit)}</div>
                      <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>comisión mes</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}