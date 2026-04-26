"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { HideableAmount, StatCardHidden } from "@/components/ui/HideableAmount";
import { StatCard } from "@/components/ui/StatCard";
import { money } from "@/lib/utils/formatters";
import { useData, type Adelanto } from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";

type Filtro = "todos" | "pendiente" | "aprobado" | "rechazado";

/* ============ MODAL DECISIÓN ============ */
function ModalDecision({
  open, onClose, adelanto, tipo,
}: { open: boolean; onClose: () => void; adelanto: Adelanto | null; tipo: "aprobar"|"rechazar" }) {
  const d = useData();
  const [nota, setNota] = useState("");
  if (!adelanto) return null;
  const w = d.workers.find(x => x.id === adelanto.workerId);
  const sede = d.sedes.find(s => s.id === w?.sedeId);

  function confirmar() {
    d.updateAdelanto(adelanto!.id, {
      estado: tipo === "aprobar" ? "aprobado" : "rechazado",
      aprobadoPor: "w_du",
      nota,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={tipo==="aprobar" ? "Aprobar adelanto" : "Rechazar adelanto"} width={420}>
      <div style={{ display:"flex", alignItems:"center", gap: 10, padding: 12, background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 10, marginBottom: 14 }}>
        <PhotoAvatar src={w?.avatarBase64 ?? null} initials={w ? (w.apodo||w.nombre)[0] : "?"} size={38} color={sede?.color ?? "#C41A3A"} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{w?.nombre}</div>
          <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{sede?.nombre} · {adelanto.fecha}</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>Motivo: <span style={{ fontWeight: 500 }}>{adelanto.motivo}</span></div>
        </div>
        <HideableAmount value={money(adelanto.monto)} size={18} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" />
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="section-label">Nota (opcional)</div>
        <textarea className="input-base" rows={3} value={nota} onChange={e=>setNota(e.target.value)} style={{ resize:"none" }} />
      </div>

      <div style={{ display:"flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button
          style={{
            flex: 2, padding:"10px 0", borderRadius: 8, border:"none", cursor:"pointer",
            fontWeight: 700, fontSize: 13, color:"#fff",
            background: tipo==="aprobar" ? "#16a34a" : "var(--brand)",
          }}
          onClick={confirmar}
        >{tipo==="aprobar" ? "Aprobar" : "Rechazar"}</button>
      </div>
    </Modal>
  );
}

/* ============ MODAL NUEVO ============ */
function ModalNuevo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const d = useData();
  const [workerId, setWorkerId] = useState(d.workers.find(w => w.rol === "trabajador")?.id ?? "");
  const [monto, setMonto]       = useState(0);
  const [motivo, setMotivo]     = useState("");

  function guardar() {
    if (!workerId || !monto || monto <= 0) return;
    d.addAdelanto({
      workerId, monto, motivo: motivo || "—",
      fecha: new Date().toISOString().slice(0, 10),
    });
    onClose();
    setMonto(0); setMotivo("");
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva solicitud de adelanto" width={420}>
      <div style={{ display:"flex", flexDirection:"column", gap: 12, marginBottom: 18 }}>
        <div>
          <div className="section-label">Trabajador</div>
          <select className="select-base" style={{ width:"100%" }} value={workerId} onChange={e=>setWorkerId(e.target.value)}>
            {d.workers.filter(w => w.rol === "trabajador").map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
          </select>
        </div>
        <div>
          <div className="section-label">Monto (S/)</div>
          <input type="number" className="input-base input-mono" value={monto || ""} onChange={e=>setMonto(Number(e.target.value))} placeholder="0.00" />
        </div>
        <div>
          <div className="section-label">Motivo</div>
          <textarea className="input-base" rows={3} value={motivo} onChange={e=>setMotivo(e.target.value)} style={{ resize:"none" }} />
        </div>
      </div>
      <div style={{ display:"flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={guardar} disabled={!workerId || !monto || monto <= 0}>Enviar</button>
      </div>
    </Modal>
  );
}

/* ============ PÁGINA ============ */
export default function AdelantosPage() {
  const d = useData();
  const { worker: actor, sede: sedeActor } = useSession();
  const isEnc = actor?.rol === "encargado";
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modalDec, setModalDec] = useState<{ adelanto: Adelanto; tipo: "aprobar"|"rechazar" } | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);

  /* Encargado: solo adelantos de trabajadores de su sede. */
  const idsEnSede = new Set(
    d.workers.filter(w => !isEnc || !sedeActor || w.sedeId === sedeActor.id).map(w => w.id)
  );
  const adelantosScope = d.adelantos.filter(a => idsEnSede.has(a.workerId));

  const pendientes = adelantosScope.filter(a => a.estado === "pendiente");
  const aprobados  = adelantosScope.filter(a => a.estado === "aprobado");
  const rechazados = adelantosScope.filter(a => a.estado === "rechazado");
  const totalEmit  = aprobados.reduce((s,a) => s + a.monto, 0);
  const totalPend  = pendientes.reduce((s,a) => s + a.monto, 0);

  const filtrados = filtro === "todos" ? adelantosScope : adelantosScope.filter(a => a.estado === filtro);

  return (
    <>
      <Topbar title="Adelantos" subtitle={`${pendientes.length} pendientes · ${aprobados.length} aprobados`} />
      <main className="page-main animate-fade-in">

        <div className="grid-stats" style={{ marginBottom: 16 }}>
          <StatCard       label="Pendientes"    value={pendientes.length} color="#d97706"      sub={`${money(totalPend)} por aprobar`} />
          <StatCard       label="Aprobados"     value={aprobados.length}  color="#16a34a"      sub="Este mes" />
          <StatCard       label="Rechazados"    value={rechazados.length} color="#8b8fa8"      sub="Histórico" />
          <StatCardHidden label="Total emitido" value={money(totalEmit)}  color="var(--brand)" sub="Se descuenta de planilla" />
        </div>

        {pendientes.length > 0 && (
          <div className="card" style={{ borderLeft:"4px solid #f59e0b", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, display:"flex", alignItems:"center", gap: 6 }}>
              <Icon name="alert_circle" size={16} color="#f59e0b" />
              Requieren aprobación
            </div>
            <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom: 12 }}>
              {pendientes.length} solicitudes · <HideableAmount value={money(totalPend)} size={11} color="var(--brand)" weight={700} fontFamily="'DM Mono',monospace" />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
              {pendientes.map(a => {
                const w = d.workers.find(x => x.id === a.workerId);
                const sede = d.sedes.find(s => s.id === w?.sedeId);
                return (
                  <div key={a.id} style={{ display:"flex", alignItems:"center", gap: 12, padding: 12, background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 10, flexWrap:"wrap" }}>
                    <PhotoAvatar src={w?.avatarBase64 ?? null} initials={w ? (w.apodo||w.nombre)[0] : "?"} size={36} color={sede?.color ?? "#C41A3A"} />
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{w?.nombre}</div>
                      <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{sede?.nombre} · {a.fecha}</div>
                      <div style={{ fontSize: 12, marginTop: 2 }}>Motivo: <span style={{ fontWeight: 500 }}>{a.motivo}</span></div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <HideableAmount value={money(a.monto)} size={18} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" align="right" />
                      <div style={{ display:"flex", gap: 6, marginTop: 6, justifyContent:"flex-end" }}>
                        <button className="btn-ghost" style={{ border:"1px solid var(--border)", fontSize: 11, padding:"5px 10px" }} onClick={()=>setModalDec({ adelanto: a, tipo:"rechazar" })}>Rechazar</button>
                        <button style={{ background:"#16a34a", color:"#fff", border:"none", borderRadius: 6, padding:"5px 12px", cursor:"pointer", fontSize: 11, fontWeight: 700 }} onClick={()=>setModalDec({ adelanto: a, tipo:"aprobar" })}>Aprobar</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", display:"flex", gap: 8, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color:"var(--text-muted)" }}>Historial:</span>
            {(["todos","pendiente","aprobado","rechazado"] as Filtro[]).map(f => (
              <button key={f} onClick={()=>setFiltro(f)}
                style={{
                  padding:"5px 14px", borderRadius: 99, cursor:"pointer", fontSize: 12, fontWeight: 600,
                  background: filtro===f ? "var(--brand)" : "var(--bg)",
                  color:      filtro===f ? "#fff" : "var(--text-muted)",
                  border: `1px solid ${filtro===f ? "var(--brand)" : "var(--border)"}`,
                  textTransform:"capitalize",
                }}>{f === "todos" ? "Todos" : f}</button>
            ))}
            <button className="btn-primary" style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap: 6 }} onClick={()=>setModalNuevo(true)}>
              <Icon name="plus" size={13} color="#fff" /> Nueva solicitud
            </button>
          </div>
          <div className="table-wrap">
            <table className="tramys-table">
              <thead>
                <tr>{["Trabajador","Sede","Monto","Motivo","Fecha","Estado","Acciones"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtrados.map(a => {
                  const w = d.workers.find(x => x.id === a.workerId);
                  const sede = d.sedes.find(s => s.id === w?.sedeId);
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                          <PhotoAvatar src={w?.avatarBase64 ?? null} initials={w ? (w.apodo||w.nombre)[0] : "?"} size={28} color={sede?.color ?? "#C41A3A"} />
                          <span style={{ fontWeight: 600 }}>{w?.nombre}</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 11, fontWeight: 600, color: sede?.color }}>{sede?.nombre}</span></td>
                      <td><HideableAmount value={money(a.monto)} size={13} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" /></td>
                      <td style={{ fontSize: 12, color:"var(--text-muted)", maxWidth: 180 }}>{a.motivo}</td>
                      <td style={{ fontFamily:"'DM Mono',monospace", fontSize: 11, color:"var(--text-muted)" }}>{a.fecha}</td>
                      <td><Badge variant={a.estado as "pendiente"|"aprobado"|"rechazado"} small /></td>
                      <td>
                        {a.estado === "pendiente" ? (
                          <div style={{ display:"flex", gap: 4 }}>
                            <button className="btn-ghost" style={{ border:"1px solid var(--border)", fontSize: 11, padding:"3px 10px" }} onClick={()=>setModalDec({ adelanto: a, tipo:"rechazar" })}>Rechazar</button>
                            <button style={{ background:"#16a34a", color:"#fff", border:"none", borderRadius: 6, padding:"3px 10px", cursor:"pointer", fontSize: 11, fontWeight: 700 }} onClick={()=>setModalDec({ adelanto: a, tipo:"aprobar" })}>Aprobar</button>
                          </div>
                        ) : <span style={{ fontSize: 11, color:"var(--text-muted)" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
                {filtrados.length === 0 && <tr><td colSpan={7} style={{ textAlign:"center", padding: 30, color:"var(--text-muted)" }}>Sin registros</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modalDec && <ModalDecision open={true} onClose={()=>setModalDec(null)} adelanto={modalDec.adelanto} tipo={modalDec.tipo} />}
      <ModalNuevo open={modalNuevo} onClose={()=>setModalNuevo(false)} />
    </>
  );
}
