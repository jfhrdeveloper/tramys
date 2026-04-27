"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { useData, type Rol, type Worker } from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";
import { Pagination, usePagination } from "@/components/ui/Pagination";

type Tab = "usuarios" | "temporales" | "auditlog";

const ROLES_INFO: Record<Rol, { nombre: string; color: string; desc: string }> = {
  owner:      { nombre:"Owner",      color:"#f59e0b", desc:"Acceso total. Único con permisos de pagos y aprobaciones." },
  encargado:  { nombre:"Encargado",  color:"#6366f1", desc:"Gestiona su sede. Sin acceso a pagos." },
  trabajador: { nombre:"Trabajador", color:"#16a34a", desc:"Solo accede a su información personal." },
};

const DURACIONES = [
  { label:"1 hora",  ms: 60*60*1000 },
  { label:"4 horas", ms: 4*60*60*1000 },
  { label:"12 horas",ms: 12*60*60*1000 },
  { label:"1 día",   ms: 24*60*60*1000 },
  { label:"7 días",  ms: 7*24*60*60*1000 },
];

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleString("es-PE", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
  } catch { return d; }
}

/* ============ MODAL EDITAR ROL PERMANENTE ============ */
function ModalRol({
  open, onClose, worker,
}: { open: boolean; onClose: () => void; worker: Worker | null }) {
  const d = useData();
  const [rol, setRol]     = useState<Rol>(worker?.rol ?? "trabajador");
  const [sedeId, setSede] = useState(worker?.sedeId ?? "sa");

  useMemo(() => {
    if (worker) { setRol(worker.rol); setSede(worker.sedeId); }
  }, [worker?.id]); // eslint-disable-line

  if (!worker) return null;

  return (
    <Modal open={open} onClose={onClose} title="Editar rol" width={420}>
      <div style={{ display:"flex", alignItems:"center", gap: 10, padding: 12, background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 10, marginBottom: 16 }}>
        <PhotoAvatar src={worker.avatarBase64} initials={(worker.apodo||worker.nombre)[0]} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{worker.nombre}</div>
          <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{worker.email}</div>
        </div>
        <Badge variant={worker.rol as "owner"|"encargado"|"trabajador"} small />
      </div>

      <div style={{ marginBottom: 14 }}>
        <div className="section-label">Rol</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 6 }}>
          {(Object.keys(ROLES_INFO) as Rol[]).map(r => (
            <button key={r} onClick={()=>setRol(r)}
              style={{
                padding:"10px 6px", borderRadius: 9, cursor:"pointer",
                border: `2px solid ${rol===r ? ROLES_INFO[r].color : "var(--border)"}`,
                background: rol===r ? `${ROLES_INFO[r].color}14` : "var(--bg)",
                color:      rol===r ? ROLES_INFO[r].color : "var(--text-muted)",
                fontWeight: rol===r ? 700 : 500, fontSize: 12,
              }}>{ROLES_INFO[r].nombre}</button>
          ))}
        </div>
        <div style={{ fontSize: 11, color:"var(--text-muted)", marginTop: 8 }}>{ROLES_INFO[rol].desc}</div>
      </div>

      {rol !== "owner" && (
        <div style={{ marginBottom: 18 }}>
          <div className="section-label">Sede</div>
          <select className="select-base" style={{ width:"100%" }} value={sedeId} onChange={e=>setSede(e.target.value)}>
            {d.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      )}

      <div style={{ display:"flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={()=>{ d.updateWorker(worker.id, { rol, sedeId }); onClose(); }}>Guardar</button>
      </div>
    </Modal>
  );
}

/* ============ MODAL ACCESO TEMPORAL ============ */
function ModalAccesoTemp({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const d = useData();
  const [workerId, setWorkerId]   = useState(d.workers[0]?.id ?? "");
  const [rolTemp, setRolTemp]     = useState<Rol>("encargado");
  const [duracion, setDuracion]   = useState<number>(DURACIONES[3].ms);
  const [custom, setCustom]       = useState<string>("");
  const [motivo, setMotivo]       = useState("");

  function guardar() {
    const desde = new Date();
    const hasta = custom ? new Date(custom) : new Date(desde.getTime() + duracion);
    d.addAccesoTemp({
      workerId,
      rolOtorgado: rolTemp,
      otorgadoPor: "w_du",
      desde: desde.toISOString(),
      hasta: hasta.toISOString(),
      motivo: motivo || "—",
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Asignar rol temporal" width={440}>
      <div style={{ fontSize: 12, color:"var(--text-muted)", marginBottom: 16 }}>
        El rol regresa automáticamente al original cuando expira.
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap: 12, marginBottom: 18 }}>
        <div>
          <div className="section-label">Usuario</div>
          <select className="select-base" style={{ width:"100%" }} value={workerId} onChange={e=>setWorkerId(e.target.value)}>
            {d.workers.map(w => <option key={w.id} value={w.id}>{w.nombre} — {w.rol}</option>)}
          </select>
        </div>
        <div>
          <div className="section-label">Rol temporal</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 6 }}>
            {(Object.keys(ROLES_INFO) as Rol[]).map(r => (
              <button key={r} onClick={()=>setRolTemp(r)}
                style={{
                  padding:"9px 6px", borderRadius: 9, cursor:"pointer",
                  border: `2px solid ${rolTemp===r ? ROLES_INFO[r].color : "var(--border)"}`,
                  background: rolTemp===r ? `${ROLES_INFO[r].color}14` : "var(--bg)",
                  color:      rolTemp===r ? ROLES_INFO[r].color : "var(--text-muted)",
                  fontWeight: rolTemp===r ? 700 : 500, fontSize: 12,
                }}>{ROLES_INFO[r].nombre}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="section-label">Duración</div>
          <div style={{ display:"flex", gap: 6, flexWrap:"wrap" }}>
            {DURACIONES.map(du => (
              <button key={du.label} onClick={()=>{ setDuracion(du.ms); setCustom(""); }}
                style={{
                  padding:"6px 12px", borderRadius: 99, cursor:"pointer", fontSize: 12,
                  background: duracion===du.ms && !custom ? "var(--brand)" : "var(--bg)",
                  color:      duracion===du.ms && !custom ? "#fff" : "var(--text-muted)",
                  border: `1px solid ${duracion===du.ms && !custom ? "var(--brand)" : "var(--border)"}`,
                  fontWeight: 600,
                }}>{du.label}</button>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color:"var(--text-muted)" }}>O una fecha/hora exacta:</div>
          <input type="datetime-local" className="input-base input-mono" value={custom} onChange={e=>setCustom(e.target.value)} />
        </div>
        <div>
          <div className="section-label">Motivo</div>
          <input className="input-base" value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej: cubrir vacaciones" />
        </div>
      </div>
      <div style={{ display:"flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={guardar}>Conceder acceso</button>
      </div>
    </Modal>
  );
}

/* ================= PÁGINA ================= */
export default function AccesosPage() {
  const d = useData();
  const { worker: actual, switchTo } = useSession();
  const [tab, setTab] = useState<Tab>("usuarios");
  const [editW, setEditW] = useState<Worker | null>(null);
  const [modalTemp, setModalTemp] = useState(false);

  const ahora = Date.now();

  function impersonar(w: Worker) {
    if (w.id === actual?.id) return;
    switchTo(w.id);
    /* Si la sesión nueva es trabajador, lo enviamos a su panel */
    if (w.rol === "trabajador" && typeof window !== "undefined") {
      window.location.href = "/mi-panel";
    } else if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  }

  const activos = d.accesosTemporales.filter(a => new Date(a.hasta).getTime() > ahora);
  const expirados = d.accesosTemporales.filter(a => new Date(a.hasta).getTime() <= ahora);

  const pagUsers = usePagination(d.workers);
  const pagActivos = usePagination(activos);
  const pagExpirados = usePagination(expirados);
  const pagAudit = usePagination(d.accesosTemporales);

  return (
    <>
      <Topbar title="Accesos" subtitle={`${d.workers.length} usuarios · ${activos.length} accesos temporales activos`} />
      <main className="page-main animate-fade-in">

        {/* Tabs */}
        <div style={{ display:"flex", gap: 4, background:"var(--card)", border:"1px solid var(--border)", borderRadius: 10, padding: 3, width:"fit-content", marginBottom: 16, flexWrap:"wrap" }}>
          {([
            { id:"usuarios" as Tab, label:"Usuarios", icon:"trabajadores" },
            { id:"temporales" as Tab, label:"Accesos temporales", icon:"clock" },
            { id:"auditlog" as Tab, label:"Audit log", icon:"reportes" },
          ]).map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{
                padding:"7px 14px", borderRadius: 8, border:"none", cursor:"pointer",
                background: tab===t.id ? "var(--brand)" : "transparent",
                color:      tab===t.id ? "#fff" : "var(--text-muted)",
                fontWeight: tab===t.id ? 700 : 500, fontSize: 12,
                display:"inline-flex", alignItems:"center", gap: 6,
              }}>
              <Icon name={t.icon} size={13} color={tab===t.id?"#fff":"currentColor"} />
              {t.label}
            </button>
          ))}
        </div>

        {/* USUARIOS */}
        {tab === "usuarios" && (
          <div className="card" style={{ padding: 0, overflow:"hidden" }}>
            <div className="table-wrap">
              <table className="tramys-table">
                <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Sede</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {pagUsers.pageItems.map(w => {
                    const sede = d.sedes.find(s => s.id === w.sedeId);
                    const esActual = w.id === actual?.id;
                    return (
                      <tr key={w.id} style={{ background: esActual ? "rgba(196,26,58,0.04)" : undefined }}>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
                            <PhotoAvatar src={w.avatarBase64} initials={(w.apodo||w.nombre)[0]} size={30} color={sede?.color ?? "#C41A3A"} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, display:"flex", alignItems:"center", gap: 6 }}>
                                {w.nombre}
                                {esActual && <span style={{ fontSize: 9, fontWeight: 700, background:"rgba(196,26,58,0.12)", color:"var(--brand)", padding:"2px 6px", borderRadius: 99 }}>SESIÓN ACTUAL</span>}
                              </div>
                              <div style={{ fontSize: 10, color:"var(--text-muted)" }}>&quot;{w.apodo}&quot;</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily:"'DM Mono',monospace", fontSize: 11, color:"var(--text-muted)" }}>{w.email}</td>
                        <td><Badge variant={w.rol as "owner"|"encargado"|"trabajador"} small /></td>
                        <td><span style={{ fontSize: 12, fontWeight: 600, color: sede?.color }}>{sede?.nombre}</span></td>
                        <td><Badge variant={w.activo ? "activo" : "inactivo"} small /></td>
                        <td>
                          <div style={{ display:"flex", gap: 4 }}>
                            <button className="btn-outline" style={{ fontSize: 11, padding:"3px 10px" }} onClick={()=>setEditW(w)}>Cambiar rol</button>
                            <button
                              onClick={()=>impersonar(w)}
                              disabled={esActual || !w.activo}
                              title={esActual ? "Ya estás usando esta cuenta" : "Iniciar sesión como este usuario"}
                              style={{
                                fontSize: 11, padding:"3px 10px", borderRadius: 6,
                                border:"none", cursor: esActual || !w.activo ? "not-allowed" : "pointer",
                                background: esActual ? "var(--bg)" : "linear-gradient(135deg,#a01530,#C41A3A)",
                                color: esActual ? "var(--text-muted)" : "#fff",
                                fontWeight: 700, opacity: !w.activo ? 0.4 : 1,
                                display:"inline-flex", alignItems:"center", gap: 4,
                              }}>
                              <Icon name="user_check" size={11} color={esActual ? "currentColor" : "#fff"} />
                              {esActual ? "Activa" : "Ver como"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagUsers.needsPagination && (
              <Pagination
                page={pagUsers.page}
                totalPages={pagUsers.totalPages}
                total={pagUsers.total}
                rangeStart={pagUsers.rangeStart}
                rangeEnd={pagUsers.rangeEnd}
                onChange={pagUsers.setPage}
                label="usuarios"
              />
            )}
          </div>
        )}

        {/* TEMPORALES */}
        {tab === "temporales" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Accesos activos</div>
                <div style={{ fontSize: 11, color:"var(--text-muted)" }}>Expiran automáticamente</div>
              </div>
              <button className="btn-primary" onClick={()=>setModalTemp(true)} style={{ display:"flex", alignItems:"center", gap: 6 }}>
                <Icon name="plus" size={13} color="#fff" /> Conceder acceso
              </button>
            </div>

            <div className="card" style={{ padding: 0, overflow:"hidden", marginBottom: 14 }}>
              <div className="table-wrap">
                <table className="tramys-table">
                  <thead><tr><th>Usuario</th><th>Rol temporal</th><th>Desde</th><th>Hasta</th><th>Motivo</th><th></th></tr></thead>
                  <tbody>
                    {activos.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center", padding: 30, color:"var(--text-muted)" }}>Sin accesos temporales activos</td></tr>}
                    {pagActivos.pageItems.map(a => {
                      const w = d.workers.find(x => x.id === a.workerId);
                      const faltante = new Date(a.hasta).getTime() - ahora;
                      const hrs = Math.max(0, Math.round(faltante / (60*60*1000)));
                      return (
                        <tr key={a.id}>
                          <td>
                            {w && (
                              <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                                <PhotoAvatar src={w.avatarBase64} initials={(w.apodo||w.nombre)[0]} size={26} />
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{w.nombre}</span>
                              </div>
                            )}
                          </td>
                          <td><Badge variant={a.rolOtorgado as "owner"|"encargado"|"trabajador"} small /></td>
                          <td style={{ fontFamily:"'DM Mono',monospace", fontSize: 11 }}>{fmtDate(a.desde)}</td>
                          <td>
                            <div style={{ fontFamily:"'DM Mono',monospace", fontSize: 11, fontWeight: 700, color: hrs < 2 ? "var(--brand)" : "#16a34a" }}>
                              {fmtDate(a.hasta)}
                            </div>
                            <div style={{ fontSize: 10, color:"var(--text-muted)" }}>~{hrs}h restantes</div>
                          </td>
                          <td style={{ fontSize: 12, color:"var(--text-muted)" }}>{a.motivo}</td>
                          <td>
                            <button className="btn-ghost" style={{ color:"var(--brand)", border:"1px solid rgba(196,26,58,0.2)", fontSize: 11, padding:"4px 10px" }} onClick={()=>d.removeAccesoTemp(a.id)}>
                              Revocar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pagActivos.needsPagination && (
                <Pagination
                  page={pagActivos.page}
                  totalPages={pagActivos.totalPages}
                  total={pagActivos.total}
                  rangeStart={pagActivos.rangeStart}
                  rangeEnd={pagActivos.rangeEnd}
                  onChange={pagActivos.setPage}
                  label="accesos"
                />
              )}
            </div>

            {expirados.length > 0 && (
              <div className="card" style={{ padding: 0, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>Expirados</div>
                <div className="table-wrap">
                  <table className="tramys-table">
                    <tbody>
                      {pagExpirados.pageItems.map(a => {
                        const w = d.workers.find(x => x.id === a.workerId);
                        return (
                          <tr key={a.id} style={{ opacity: 0.6 }}>
                            <td>{w?.nombre}</td>
                            <td><Badge variant={a.rolOtorgado as "owner"|"encargado"|"trabajador"} small /></td>
                            <td style={{ fontFamily:"'DM Mono',monospace", fontSize: 11 }}>{fmtDate(a.hasta)}</td>
                            <td style={{ fontSize: 12, color:"var(--text-muted)" }}>{a.motivo}</td>
                            <td><button className="btn-ghost" style={{ fontSize: 11 }} onClick={()=>d.removeAccesoTemp(a.id)}>Eliminar</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {pagExpirados.needsPagination && (
                  <Pagination
                    page={pagExpirados.page}
                    totalPages={pagExpirados.totalPages}
                    total={pagExpirados.total}
                    rangeStart={pagExpirados.rangeStart}
                    rangeEnd={pagExpirados.rangeEnd}
                    onChange={pagExpirados.setPage}
                    label="expirados"
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* AUDITLOG */}
        {tab === "auditlog" && (
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Historial de accesos temporales</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)", marginBottom: 14 }}>Registro de todos los cambios</div>
            {d.accesosTemporales.length === 0 ? (
              <div style={{ textAlign:"center", padding: 30, color:"var(--text-muted)" }}>Sin registros</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
                {pagAudit.pageItems.map(a => {
                  const w = d.workers.find(x => x.id === a.workerId);
                  const activo = new Date(a.hasta).getTime() > ahora;
                  return (
                    <div key={a.id} style={{ padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderLeft:`4px solid ${activo ? "#16a34a" : "#8b8fa8"}`, borderRadius: 9, display:"flex", alignItems:"center", gap: 10 }}>
                      <Icon name={activo ? "check_circle" : "x_circle"} size={16} color={activo ? "#16a34a" : "#8b8fa8"} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{w?.nombre} → {ROLES_INFO[a.rolOtorgado].nombre}</div>
                        <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{fmtDate(a.desde)} → {fmtDate(a.hasta)} · {a.motivo}</div>
                      </div>
                      <Badge variant={activo ? "activo" : "inactivo"} small />
                    </div>
                  );
                })}
                {pagAudit.needsPagination && (
                  <Pagination
                    page={pagAudit.page}
                    totalPages={pagAudit.totalPages}
                    total={pagAudit.total}
                    rangeStart={pagAudit.rangeStart}
                    rangeEnd={pagAudit.rangeEnd}
                    onChange={pagAudit.setPage}
                    label="registros"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <ModalRol open={editW !== null} onClose={()=>setEditW(null)} worker={editW} />
      <ModalAccesoTemp open={modalTemp} onClose={()=>setModalTemp(false)} />
    </>
  );
}
