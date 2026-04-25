"use client";

/* ================= MIS PERMISOS (TRABAJADOR) ================= */
/* El trabajador puede solicitar permisos personales, médicos    */
/* o de vacaciones para una fecha específica.                    */

import { useMemo, useState } from "react";
import { TopbarWorker } from "@/components/layout/TopbarWorker";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { useWorkerSession } from "@/hooks/useWorkerSession";
import { useData, type TipoPerm } from "@/components/providers/DataProvider";

type Filtro = "todos" | "pendiente" | "aprobado" | "rechazado";

const FILTROS: { id: Filtro; label: string; color: string }[] = [
  { id:"todos",      label:"Todos",      color:"var(--brand)" },
  { id:"pendiente",  label:"Pendientes", color:"#d97706"      },
  { id:"aprobado",   label:"Aprobados",  color:"#16a34a"      },
  { id:"rechazado",  label:"Rechazados", color:"#8b8fa8"      },
];

const TIPOS: { id: TipoPerm; label: string; icon: string; color: string }[] = [
  { id:"personal",    label:"Personal",    icon:"user",       color:"#6366f1" },
  { id:"medico",      label:"Médico",      icon:"file_check", color:"#16a34a" },
  { id:"vacaciones",  label:"Vacaciones",  icon:"calendar",   color:"#f59e0b" },
];

function infoTipo(t: TipoPerm) {
  return TIPOS.find(x => x.id === t) ?? TIPOS[0];
}

/* ================= MODAL SOLICITAR ================= */
function ModalSolicitar({
  open, onClose, workerId,
}: { open: boolean; onClose: () => void; workerId: string }) {
  const d = useData();
  const [fecha, setFecha]   = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo]     = useState<TipoPerm>("personal");
  const [motivo, setMotivo] = useState("");

  function reset() {
    setFecha(new Date().toISOString().slice(0, 10));
    setTipo("personal");
    setMotivo("");
  }
  function enviar() {
    if (!fecha || !motivo.trim()) return;
    d.addPermiso({ workerId, fecha, tipo, motivo: motivo.trim() });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Solicitar permiso" width={440}>
      <div style={{ fontSize: 12, color:"var(--text-muted)", marginBottom: 14 }}>
        Tu solicitud quedará en estado <strong>pendiente</strong> hasta que tu encargado o el admin la revise.
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap: 14, marginBottom: 18 }}>
        <div>
          <div className="section-label">Tipo</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 8 }}>
            {TIPOS.map(t => (
              <button key={t.id} type="button" onClick={()=>setTipo(t.id)}
                style={{
                  padding:"10px 8px", borderRadius: 9, cursor:"pointer",
                  border: `2px solid ${tipo === t.id ? t.color : "var(--border)"}`,
                  background: tipo === t.id ? `${t.color}14` : "var(--bg)",
                  color:      tipo === t.id ? t.color : "var(--text-muted)",
                  fontWeight: tipo === t.id ? 700 : 500, fontSize: 12,
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap: 4,
                }}>
                <Icon name={t.icon} size={16} color={tipo === t.id ? t.color : "currentColor"} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="section-label">Fecha</div>
          <input type="date" className="input-base" value={fecha} onChange={e=>setFecha(e.target.value)} />
        </div>

        <div>
          <div className="section-label">Motivo</div>
          <textarea
            className="input-base"
            rows={3}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Describe brevemente el motivo del permiso..."
          />
        </div>
      </div>

      <div style={{ display:"flex", gap: 10 }}>
        <div style={{ flex: 1 }} />
        <button className="btn-outline" onClick={() => { reset(); onClose(); }}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={enviar}
          disabled={!fecha || !motivo.trim()}
        >
          Enviar solicitud
        </button>
      </div>
    </Modal>
  );
}

/* ================= PÁGINA ================= */
export default function MisPermisosPage() {
  const worker = useWorkerSession();
  const d = useData();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modalOpen, setModalOpen] = useState(false);

  const mios = useMemo(() => {
    if (!worker) return [];
    return d.permisos
      .filter(p => p.workerId === worker.id)
      .sort((a,b) => b.fecha.localeCompare(a.fecha));
  }, [worker, d.permisos]);

  const filtrados = useMemo(
    () => filtro === "todos" ? mios : mios.filter(p => p.estado === filtro),
    [mios, filtro]
  );

  const countPend = mios.filter(p => p.estado === "pendiente").length;
  const countApr  = mios.filter(p => p.estado === "aprobado").length;
  const countRech = mios.filter(p => p.estado === "rechazado").length;

  if (!worker) {
    return (
      <>
        <TopbarWorker title="Permisos" subtitle="—" onMenuToggle={()=>{}} />
        <main className="page-main"><div className="card">Cargando...</div></main>
      </>
    );
  }

  return (
    <>
      <TopbarWorker title="Permisos" subtitle={`${mios.length} solicitud${mios.length === 1 ? "" : "es"}`} onMenuToggle={()=>{}} />
      <main className="page-main animate-fade-in">

        {/* ====== KPIs ====== */}
        <div className="grid-stats" style={{ marginBottom: 14 }}>
          <div className="card" style={{ padding:"14px 16px", borderLeft:"4px solid #d97706" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Pendientes</div>
            <div style={{ fontSize: 22, fontWeight: 800, color:"#d97706", fontFamily:"'DM Mono',monospace" }}>{countPend}</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>Por revisar</div>
          </div>
          <div className="card" style={{ padding:"14px 16px", borderLeft:"4px solid #16a34a" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Aprobados</div>
            <div style={{ fontSize: 22, fontWeight: 800, color:"#16a34a", fontFamily:"'DM Mono',monospace" }}>{countApr}</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>Histórico</div>
          </div>
          <div className="card" style={{ padding:"14px 16px", borderLeft:"4px solid #8b8fa8" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Rechazados</div>
            <div style={{ fontSize: 22, fontWeight: 800, color:"#8b8fa8", fontFamily:"'DM Mono',monospace" }}>{countRech}</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>Histórico</div>
          </div>
        </div>

        {/* ====== Filtros + acción ====== */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12, gap: 10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap: 6, background:"var(--card)", border:"1px solid var(--border)", borderRadius: 10, padding: 3, flexWrap:"wrap" }}>
            {FILTROS.map(f => (
              <button key={f.id} onClick={()=>setFiltro(f.id)}
                style={{
                  padding:"7px 14px", borderRadius: 8, border:"none", cursor:"pointer",
                  background: filtro===f.id ? f.color : "transparent",
                  color:      filtro===f.id ? "#fff" : "var(--text-muted)",
                  fontWeight: filtro===f.id ? 700 : 500, fontSize: 12,
                }}>
                {f.label}
              </button>
            ))}
          </div>

          <button className="btn-primary" style={{ display:"inline-flex", alignItems:"center", gap: 6 }} onClick={()=>setModalOpen(true)}>
            <Icon name="plus" size={13} color="#fff" /> Nuevo permiso
          </button>
        </div>

        {/* ====== Lista ====== */}
        <div className="card" style={{ padding: 0, overflow:"hidden" }}>
          {filtrados.length === 0 ? (
            <div style={{ padding:"48px 24px", textAlign:"center" }}>
              <div style={{ width: 56, height: 56, borderRadius:"50%", background:"rgba(99,102,241,0.08)", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom: 12 }}>
                <Icon name="file_check" size={26} color="#6366f1" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {filtro === "todos" ? "Sin solicitudes" : `Sin solicitudes ${filtro}s`}
              </div>
              <div style={{ fontSize: 12, color:"var(--text-muted)", marginBottom: 14 }}>
                Cuando solicites un permiso aparecerá aquí.
              </div>
              <button className="btn-primary" onClick={()=>setModalOpen(true)} style={{ display:"inline-flex", alignItems:"center", gap: 6 }}>
                <Icon name="plus" size={13} color="#fff" /> Nueva solicitud
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column" }}>
              {filtrados.map((p, i) => {
                const t = infoTipo(p.tipo);
                return (
                  <div key={p.id} style={{
                    display:"flex", alignItems:"center", gap: 12,
                    padding:"14px 18px",
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    borderLeft: `4px solid ${t.color}`,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: `${t.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
                      <Icon name={t.icon} size={18} color={t.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap: 8, marginBottom: 2, flexWrap:"wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: t.color, textTransform:"capitalize" }}>{t.label}</span>
                        <span style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{p.fecha}</span>
                        <Badge variant={p.estado as "pendiente"|"aprobado"|"rechazado"} small />
                      </div>
                      <div style={{ fontSize: 12, color:"var(--text)" }}>{p.motivo}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ModalSolicitar open={modalOpen} onClose={()=>setModalOpen(false)} workerId={worker.id} />
    </>
  );
}
