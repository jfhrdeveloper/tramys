"use client";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { money, iniciales, colorSede, calcularNeto } from "@/lib/utils/formatters";

/* ================= MOCK DATA ================= */
const MOCK_PLANILLA = [
  { id:"1", nombre:"Ana Torres",    avatar:"AT", sede:"Santa Anita",   sueldo:1400, diasTrab:18, tardanzas:1, adelantos:0   },
  { id:"2", nombre:"Luis Vera",     avatar:"LV", sede:"Santa Anita",   sueldo:1400, diasTrab:20, tardanzas:0, adelantos:0   },
  { id:"3", nombre:"Marco Díaz",    avatar:"MD", sede:"Puente Piedra", sueldo:1350, diasTrab:17, tardanzas:4, adelantos:350 },
  { id:"4", nombre:"Sofía Ríos",    avatar:"SR", sede:"Santa Anita",   sueldo:1400, diasTrab:16, tardanzas:3, adelantos:0   },
  { id:"5", nombre:"Carmen Flores", avatar:"CF", sede:"Puente Piedra", sueldo:1500, diasTrab:20, tardanzas:0, adelantos:200 },
  { id:"6", nombre:"Pedro Chávez",  avatar:"PC", sede:"Santa Anita",   sueldo:1500, diasTrab:14, tardanzas:2, adelantos:300 },
  { id:"7", nombre:"Rosa Huanca",   avatar:"RH", sede:"Puente Piedra", sueldo:1500, diasTrab:21, tardanzas:0, adelantos:0   },
  { id:"8", nombre:"Jorge Quispe",  avatar:"JQ", sede:"Puente Piedra", sueldo:1350, diasTrab:19, tardanzas:1, adelantos:0   },
];

type PlanillaRow = typeof MOCK_PLANILLA[0];

/* ================= MODAL DESGLOSE ================= */
function ModalDesglose({ open, onClose, w }: { open:boolean; onClose:()=>void; w:PlanillaRow|null }) {
  if (!w) return null;
  const descTard = w.tardanzas * 22.5;
  const neto     = calcularNeto(w.sueldo, w.diasTrab, w.tardanzas, w.adelantos);
  const col      = colorSede(w.sede);

  return (
    <Modal open={open} onClose={onClose} title="Desglose de Planilla" width={440}>
      {/* Header trabajador */}
      <div style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10, marginBottom:20 }}>
        <Avatar initials={iniciales(w.nombre)} size={44} color={col} />
        <div>
          <div style={{ fontWeight:700, fontSize:15 }}>{w.nombre}</div>
          <div style={{ fontSize:12, color:"var(--text-muted)" }}>{w.sede} · Abril 2026</div>
        </div>
      </div>

      {/* Desglose */}
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
        {[
          { label:"Sueldo base",         value: money(w.sueldo),            color:"var(--text)",    bold:false, sub:`22 días hábiles · ${money(w.sueldo/22)}/día` },
          { label:"Días trabajados",     value: money((w.sueldo/22)*w.diasTrab), color:"#16a34a", bold:false, sub:`${w.diasTrab}/22 días trabajados` },
          { label:"Descuento tardanzas", value:`−${money(descTard)}`,       color:"var(--brand)",   bold:false, sub:`${w.tardanzas} tardanza(s) × S/ 22.50` },
          { label:"Adelantos recibidos", value:`−${money(w.adelantos)}`,    color: w.adelantos>0?"#f59e0b":"var(--text-muted)", bold:false, sub: w.adelantos>0?"Aprobado por Owner":"Sin adelantos" },
          { label:"Neto a pagar",        value: money(neto),                color:"#16a34a",         bold:true,  sub:"Abril 2026" },
        ].map(({ label, value, color, bold, sub }) => (
          <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderRadius:10, background:bold?"rgba(34,197,94,0.08)":"var(--bg)", border:`1px solid ${bold?"rgba(34,197,94,0.2)":"var(--border)"}` }}>
            <div>
              <div style={{ fontSize:13, fontWeight:bold?700:500, color:bold?"#16a34a":"var(--text)" }}>{label}</div>
              <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{sub}</div>
            </div>
            <span style={{ fontSize:bold?20:14, fontWeight:bold?800:600, color, fontFamily:"'DM Mono',monospace" }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button className="btn-outline" style={{ flex:1 }} onClick={onClose}>Cerrar</button>
        <button className="btn-outline" style={{ flex:1, display:"flex", alignItems:"center", gap:6, justifyContent:"center" }}>
          <Icon name="download" size={13} /> PDF
        </button>
        <button className="btn-primary" style={{ flex:1 }}>✓ Marcar pagado</button>
      </div>
    </Modal>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function PlanillaPage() {
  const [filtroSede, setFiltroSede] = useState("todas");
  const [pagados,    setPagados]    = useState<string[]>([]);
  const [modalW,     setModalW]     = useState<PlanillaRow|null>(null);

  const filtrados    = MOCK_PLANILLA.filter(w => filtroSede==="todas" || w.sede===filtroSede);
  const totalBruto   = filtrados.reduce((a,w)=>a+w.sueldo,0);
  const totalDesc    = filtrados.reduce((a,w)=>a+(w.tardanzas*22.5)+w.adelantos,0);
  const totalAdel    = filtrados.reduce((a,w)=>a+w.adelantos,0);
  const totalNeto    = filtrados.reduce((a,w)=>a+calcularNeto(w.sueldo,w.diasTrab,w.tardanzas,w.adelantos),0);

  const togglePagado = (id:string) => setPagados(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);

  /* Resumen por sede */
  const resumenSede = ["Santa Anita","Puente Piedra"].map(sede=>{
    const data  = MOCK_PLANILLA.filter(w=>w.sede===sede);
    const bruto = data.reduce((a,w)=>a+w.sueldo,0);
    const neto  = data.reduce((a,w)=>a+calcularNeto(w.sueldo,w.diasTrab,w.tardanzas,w.adelantos),0);
    const col   = colorSede(sede);
    const pagS  = data.filter(w=>pagados.includes(w.id)).length;
    return { sede, bruto, neto, pagados:pagS, total:data.length, color:col };
  });

  return (
    <>
      <Topbar
        title="Planilla"
        subtitle={`Abril 2026 · ${filtrados.length} trabajadores · ${pagados.length} pagados`}
        onMenuToggle={()=>{}}
      />
      <main className="page-main">

        {/* Stats financieros */}
        <div className="grid-stats" style={{ marginBottom:16 }}>
          <StatCard label="Total bruto"        value={money(totalBruto)} color="var(--text)"  sub={`${filtrados.length} trabajadores`} />
          <StatCard label="Total descuentos"   value={money(totalDesc)}  color="var(--brand)" sub="Tardanzas + adelantos"            />
          <StatCard label="Adelantos emitidos" value={money(totalAdel)}  color="#f59e0b"      sub="Descontados del neto"             />
          <StatCard label="Total neto a pagar" value={money(totalNeto)}  color="#16a34a"      sub="Planilla Abril 2026"              />
        </div>

        {/* Resumen por sede */}
        <div className="grid-2" style={{ marginBottom:16 }}>
          {resumenSede.map(s => (
            <div key={s.sede} className="card" style={{ borderTop:`3px solid ${s.color}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{s.sede}</div>
                <span style={{ fontSize:11, color:s.color, fontWeight:600 }}>{s.total} trabajadores</span>
              </div>
              <div className="grid-3" style={{ gap:8 }}>
                {[["Bruto",money(s.bruto),"var(--text)"],["Neto",money(s.neto),"#16a34a"],["Pagados",`${s.pagados}/${s.total}`,"#6366f1"]].map(([lbl,val,c])=>(
                  <div key={String(lbl)} style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", marginBottom:3 }}>{lbl}</div>
                    <div style={{ fontSize:15, fontWeight:800, color:String(c) }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tabla planilla */}
        <div className="card" style={{ padding:0, overflow:"hidden" }}>

          {/* Filtros */}
          <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)" }}>Sede:</span>
            {["todas","Santa Anita","Puente Piedra"].map(s=>(
              <button key={s} onClick={()=>setFiltroSede(s)} style={{
                padding:"5px 14px", borderRadius:99, cursor:"pointer", fontSize:12, fontWeight:600,
                background:filtroSede===s?"var(--brand)":"var(--bg)",
                color:filtroSede===s?"#fff":"var(--text-muted)",
                border:`1px solid ${filtroSede===s?"var(--brand)":"var(--border)"}`,
                fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.15s",
              }}>{s==="todas"?"Todas":s}</button>
            ))}
            <span style={{ marginLeft:"auto", fontSize:12, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
              {pagados.length}/{filtrados.length} pagados
            </span>
            <button className="btn-outline" style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Icon name="download" size={13} /> Excel
            </button>
            <button className="btn-outline" style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Icon name="download" size={13} /> PDF
            </button>
            <button className="btn-primary" style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Icon name="check" size={13} color="#fff" /> Cerrar planilla
            </button>
          </div>

          <div className="table-wrap">
            <table className="tramys-table">
              <thead>
                <tr>
                  {["Trabajador","Sede","Sueldo base","Días","Desc. tardanzas","Adelantos","Neto a pagar","Estado","Acciones"].map(h=><th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(w=>{
                  const col      = colorSede(w.sede);
                  const descTard = w.tardanzas * 22.5;
                  const neto     = calcularNeto(w.sueldo, w.diasTrab, w.tardanzas, w.adelantos);
                  const isPagado = pagados.includes(w.id);
                  return (
                    <tr key={w.id} style={{ opacity:isPagado?0.7:1 }}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <Avatar initials={iniciales(w.nombre)} size={28} color={col} />
                          <div>
                            <div style={{ fontWeight:600, fontSize:13 }}>{w.nombre}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontSize:11, fontWeight:600, color:col }}>{w.sede}</span></td>
                      <td style={{ fontFamily:"'DM Mono',monospace", fontWeight:600 }}>{money(w.sueldo)}</td>
                      <td style={{ fontWeight:600 }}>{w.diasTrab}<span style={{ color:"var(--text-muted)", fontWeight:400 }}>/22</span></td>
                      <td>
                        {descTard>0
                          ? <span style={{ color:"var(--brand)", fontWeight:600, fontFamily:"'DM Mono',monospace" }}>−{money(descTard)}</span>
                          : <span style={{ color:"var(--text-muted)" }}>—</span>}
                      </td>
                      <td>
                        {w.adelantos>0
                          ? <span style={{ color:"#f59e0b", fontWeight:600, fontFamily:"'DM Mono',monospace" }}>−{money(w.adelantos)}</span>
                          : <span style={{ color:"var(--text-muted)" }}>—</span>}
                      </td>
                      <td style={{ fontWeight:800, color:"#16a34a", fontFamily:"'DM Mono',monospace", fontSize:14 }}>{money(neto)}</td>
                      <td>
                        <Badge variant={isPagado?"pagado":"pendiente"} small />
                      </td>
                      <td>
                        <div style={{ display:"flex", gap:6 }}>
                          <button className="btn-outline" style={{ fontSize:11, padding:"4px 10px" }} onClick={()=>setModalW(w)}>Desglose</button>
                          <button onClick={()=>togglePagado(w.id)} style={{
                            background:isPagado?"rgba(34,197,94,0.1)":"transparent",
                            border:`1px solid ${isPagado?"rgba(34,197,94,0.3)":"var(--border)"}`,
                            borderRadius:6, padding:"4px 10px", cursor:"pointer",
                            fontSize:11, color:isPagado?"#16a34a":"var(--text-muted)",
                            fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.15s",
                          }}>{isPagado?"✓ Pagado":"Marcar"}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totales */}
              <tfoot>
                <tr style={{ background:"var(--bg)" }}>
                  <td colSpan={2} style={{ padding:"12px 14px", fontWeight:700, fontSize:13, borderTop:"2px solid var(--border)" }}>Total ({filtrados.length})</td>
                  <td style={{ borderTop:"2px solid var(--border)", fontFamily:"'DM Mono',monospace", fontWeight:700 }}>{money(totalBruto)}</td>
                  <td style={{ borderTop:"2px solid var(--border)" }} />
                  <td style={{ borderTop:"2px solid var(--border)", fontFamily:"'DM Mono',monospace", fontWeight:700, color:"var(--brand)" }}>−{money(filtrados.reduce((a,w)=>a+w.tardanzas*22.5,0))}</td>
                  <td style={{ borderTop:"2px solid var(--border)", fontFamily:"'DM Mono',monospace", fontWeight:700, color:"#f59e0b" }}>−{money(totalAdel)}</td>
                  <td style={{ borderTop:"2px solid var(--border)", fontFamily:"'DM Mono',monospace", fontWeight:800, fontSize:15, color:"#16a34a" }}>{money(totalNeto)}</td>
                  <td colSpan={2} style={{ borderTop:"2px solid var(--border)" }} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>

      <ModalDesglose open={!!modalW} onClose={()=>setModalW(null)} w={modalW} />
    </>
  );
}