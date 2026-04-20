"use client";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { money, iniciales, colorSede } from "@/lib/utils/formatters";

/* ================= MOCK DATA ================= */
const MOCK_ADELANTOS = [
  { id:"1", nombre:"Ana Torres",    avatar:"AT", sede:"Santa Anita",   monto:300, motivo:"Gastos médicos",     fecha:"10 Abr", estado:"aprobado"  as const, aprobadoPor:"Owner", hace:"10 días" },
  { id:"2", nombre:"Marco Díaz",    avatar:"MD", sede:"Puente Piedra", monto:350, motivo:"Emergencia familiar",fecha:"12 Abr", estado:"pendiente" as const, aprobadoPor:null,    hace:"2h"      },
  { id:"3", nombre:"Carmen Flores", avatar:"CF", sede:"Puente Piedra", monto:200, motivo:"Pago de alquiler",   fecha:"14 Abr", estado:"pendiente" as const, aprobadoPor:null,    hace:"5h"      },
  { id:"4", nombre:"Pedro Chávez",  avatar:"PC", sede:"Santa Anita",   monto:300, motivo:"Gastos personales",  fecha:"08 Abr", estado:"aprobado"  as const, aprobadoPor:"Owner", hace:"12 días" },
  { id:"5", nombre:"Sofía Ríos",    avatar:"SR", sede:"Santa Anita",   monto:150, motivo:"Útiles escolares",   fecha:"17 Abr", estado:"pendiente" as const, aprobadoPor:null,    hace:"1 día"   },
  { id:"6", nombre:"Jorge Quispe",  avatar:"JQ", sede:"Puente Piedra", monto:400, motivo:"Reparación hogar",   fecha:"05 Abr", estado:"rechazado" as const, aprobadoPor:"Owner", hace:"15 días" },
  { id:"7", nombre:"Rosa Huanca",   avatar:"RH", sede:"Puente Piedra", monto:250, motivo:"Gastos médicos",     fecha:"02 Abr", estado:"aprobado"  as const, aprobadoPor:"Owner", hace:"17 días" },
];

type Adelanto = typeof MOCK_ADELANTOS[0];

/* ================= MODAL DECISIÓN ================= */
function ModalDecision({ open, onClose, adelanto, tipo }: {
  open:boolean; onClose:()=>void; adelanto:Adelanto|null; tipo:"aprobar"|"rechazar";
}) {
  const [nota, setNota] = useState("");
  if (!adelanto) return null;
  const col = colorSede(adelanto.sede);

  return (
    <Modal open={open} onClose={onClose} title={tipo==="aprobar"?"Aprobar Adelanto":"Rechazar Adelanto"} width={400}>
      <div style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10, marginBottom:16 }}>
        <Avatar initials={iniciales(adelanto.nombre)} size={38} color={col} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:14 }}>{adelanto.nombre}</div>
          <div style={{ fontSize:11, color:"var(--text-muted)" }}>{adelanto.sede} · {adelanto.fecha}</div>
          <div style={{ fontSize:12, color:"var(--text)", marginTop:3 }}>
            Motivo: <span style={{ fontWeight:500 }}>{adelanto.motivo}</span>
          </div>
        </div>
        <div style={{ fontWeight:800, fontSize:20, color:"var(--brand)" }}>{money(adelanto.monto)}</div>
      </div>

      <div style={{ marginBottom:20 }}>
        <div className="section-label">Nota para el trabajador (opcional)</div>
        <textarea className="input-base" rows={3} placeholder="Agregar un comentario..." value={nota} onChange={e=>setNota(e.target.value)} style={{ resize:"none" }} />
      </div>

      {tipo==="aprobar" && (
        <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:12, color:"#16a34a" }}>
          ✓ Se descontará automáticamente de la planilla de {adelanto.nombre.split(" ")[0]}
        </div>
      )}

      <div style={{ display:"flex", gap:10 }}>
        <button className="btn-outline" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
        {tipo==="rechazar"
          ? <button style={{ flex:1, padding:"10px 0", borderRadius:8, background:"rgba(139,139,168,0.15)", border:"1px solid var(--border)", color:"#8b8fa8", cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"'Bricolage Grotesque',sans-serif" }}>✕ Rechazar</button>
          : <button style={{ flex:1, padding:"10px 0", borderRadius:8, background:"#16a34a", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'Bricolage Grotesque',sans-serif" }}>✓ Aprobar</button>
        }
      </div>
    </Modal>
  );
}

/* ================= MODAL NUEVA SOLICITUD ================= */
function ModalNuevo({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const [trabajador, setTrabajador] = useState("");
  const [monto,      setMonto]      = useState("");
  const [motivo,     setMotivo]     = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Nueva Solicitud de Adelanto" width={420}>
      <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:20 }}>
        Será enviada para aprobación del Owner
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
        <div>
          <div className="section-label">Trabajador</div>
          <select className="select-base" style={{ width:"100%" }} value={trabajador} onChange={e=>setTrabajador(e.target.value)}>
            <option value="">Seleccionar trabajador...</option>
            {MOCK_ADELANTOS.map(a=>a.nombre).filter((n,i,arr)=>arr.indexOf(n)===i).map(n=>(
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="section-label">Monto solicitado</div>
          <input className="input-base input-mono" placeholder="S/ 0.00" value={monto} onChange={e=>setMonto(e.target.value)} />
          {monto && <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:4 }}>Se descontará automáticamente de la planilla del mes</div>}
        </div>
        <div>
          <div className="section-label">Motivo</div>
          <textarea className="input-base" rows={3} placeholder="Ej: Gastos médicos, emergencia familiar..." value={motivo} onChange={e=>setMotivo(e.target.value)} style={{ resize:"none" }} />
        </div>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button className="btn-outline" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex:2 }}>Enviar solicitud</button>
      </div>
    </Modal>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function AdelantosPage() {
  const [filtro,       setFiltro]       = useState<"todos"|"pendiente"|"aprobado"|"rechazado">("todos");
  const [modalDecision, setModalDecision] = useState<{adelanto:Adelanto;tipo:"aprobar"|"rechazar"}|null>(null);
  const [modalNuevo,   setModalNuevo]   = useState(false);

  const pendientes = MOCK_ADELANTOS.filter(a=>a.estado==="pendiente");
  const aprobados  = MOCK_ADELANTOS.filter(a=>a.estado==="aprobado");
  const rechazados = MOCK_ADELANTOS.filter(a=>a.estado==="rechazado");
  const totalEmit  = aprobados.reduce((s,a)=>s+a.monto,0);
  const totalPend  = pendientes.reduce((s,a)=>s+a.monto,0);

  const filtrados = filtro==="todos" ? MOCK_ADELANTOS : MOCK_ADELANTOS.filter(a=>a.estado===filtro);

  return (
    <>
      <Topbar
        title="Adelantos"
        subtitle={`Abril 2026 · ${pendientes.length} pendientes de aprobación`}
        onMenuToggle={()=>{}}
      />
      <main className="page-main">

        {/* Stats */}
        <div className="grid-stats" style={{ marginBottom:16 }}>
          <StatCard label="Pendientes"     value={pendientes.length} color="#d97706"       sub={`${money(totalPend)} por aprobar`} />
          <StatCard label="Aprobados mes"  value={aprobados.length}  color="#16a34a"       sub={`${money(totalEmit)} emitido`}     />
          <StatCard label="Rechazados"     value={rechazados.length} color="#8b8fa8"       sub="Este mes"                          />
          <StatCard label="Total emitido"  value={money(totalEmit)}  color="var(--brand)"  sub="Se descuenta de planilla"          />
        </div>

        {/* Pendientes destacados */}
        {pendientes.length > 0 && (
          <div className="card" style={{ border:"1px solid rgba(245,158,11,0.3)", borderLeft:"4px solid #f59e0b", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>⚠️ Requieren aprobación</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
                  {pendientes.length} solicitudes · {money(totalPend)} en total
                </div>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {pendientes.map(a => {
                const col = colorSede(a.sede);
                return (
                  <div key={a.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10, flexWrap:"wrap" }}>
                    <Avatar initials={iniciales(a.nombre)} size={36} color={col} />
                    <div style={{ flex:1, minWidth:140 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{a.nombre}</div>
                      <div style={{ fontSize:11, color:"var(--text-muted)" }}>{a.sede} · {a.fecha} · hace {a.hace}</div>
                      <div style={{ fontSize:12, marginTop:3 }}>Motivo: <span style={{ fontWeight:500 }}>{a.motivo}</span></div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontWeight:800, fontSize:20, color:"var(--brand)", marginBottom:8 }}>{money(a.monto)}</div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button className="btn-ghost" style={{ border:"1px solid var(--border)", fontSize:12 }} onClick={()=>setModalDecision({adelanto:a,tipo:"rechazar"})}>✕ Rechazar</button>
                        <button style={{ background:"#16a34a", color:"#fff", border:"none", borderRadius:7, padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Bricolage Grotesque',sans-serif" }} onClick={()=>setModalDecision({adelanto:a,tipo:"aprobar"})}>✓ Aprobar</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Historial */}
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)" }}>Historial:</span>
            {(["todos","pendiente","aprobado","rechazado"] as const).map(f=>(
              <button key={f} onClick={()=>setFiltro(f)} style={{
                padding:"5px 14px", borderRadius:99, cursor:"pointer", fontSize:12, fontWeight:600,
                background:filtro===f?"var(--brand)":"var(--bg)",
                color:filtro===f?"#fff":"var(--text-muted)",
                border:`1px solid ${filtro===f?"var(--brand)":"var(--border)"}`,
                fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.15s", textTransform:"capitalize",
              }}>{f==="todos"?"Todos":f}</button>
            ))}
            <span style={{ marginLeft:"auto", fontSize:12, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{filtrados.length} registros</span>
            <button className="btn-primary" style={{ display:"flex", alignItems:"center", gap:6 }} onClick={()=>setModalNuevo(true)}>
              <Icon name="plus" size={13} color="#fff" /> Nueva solicitud
            </button>
          </div>

          <div className="table-wrap">
            <table className="tramys-table">
              <thead>
                <tr>
                  {["Trabajador","Sede","Monto","Motivo","Fecha","Estado","Aprobado por","Acciones"].map(h=><th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(a=>{
                  const col = colorSede(a.sede);
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <Avatar initials={iniciales(a.nombre)} size={28} color={col} />
                          <span style={{ fontWeight:600 }}>{a.nombre}</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize:11, fontWeight:600, color:col }}>{a.sede}</span></td>
                      <td style={{ fontWeight:800, color:"var(--brand)", fontFamily:"'DM Mono',monospace" }}>{money(a.monto)}</td>
                      <td style={{ fontSize:12, color:"var(--text-muted)", maxWidth:140 }}>{a.motivo}</td>
                      <td style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"var(--text-muted)" }}>{a.fecha}</td>
                      <td><Badge variant={a.estado} small /></td>
                      <td style={{ fontSize:12, color:"var(--text-muted)" }}>{a.aprobadoPor ?? "—"}</td>
                      <td>
                        {a.estado==="pendiente"
                          ? <button className="btn-primary" style={{ fontSize:11, padding:"4px 12px" }} onClick={()=>setModalDecision({adelanto:a,tipo:"aprobar"})}>Decidir</button>
                          : <span style={{ fontSize:11, color:"var(--text-muted)" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modalDecision && <ModalDecision open={!!modalDecision} onClose={()=>setModalDecision(null)} adelanto={modalDecision.adelanto} tipo={modalDecision.tipo} />}
      <ModalNuevo open={modalNuevo} onClose={()=>setModalNuevo(false)} />
    </>
  );
}