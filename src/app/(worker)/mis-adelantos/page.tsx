"use client";

/* ================= MIS ADELANTOS (TRABAJADOR) ================= */
/* El trabajador puede solicitar adelantos. Quedan en           */
/* "pendiente" hasta que el admin los apruebe/rechace.          */

import { useMemo, useState } from "react";
import { TopbarWorker } from "@/components/layout/TopbarWorker";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { money, formatFecha } from "@/lib/utils/formatters";
import { useWorkerSession } from "@/hooks/useWorkerSession";
import { useData } from "@/components/providers/DataProvider";
import { Pagination, usePagination } from "@/components/ui/Pagination";

type Filtro = "todos" | "pendiente" | "aprobado" | "rechazado";

const FILTROS: { id: Filtro; label: string; color: string }[] = [
  { id:"todos",      label:"Todos",      color:"var(--brand)" },
  { id:"pendiente",  label:"Pendientes", color:"#d97706"      },
  { id:"aprobado",   label:"Aprobados",  color:"#16a34a"      },
  { id:"rechazado",  label:"Rechazados", color:"#8b8fa8"      },
];

/* ================= MODAL SOLICITAR ================= */
function ModalSolicitar({
  open, onClose, workerId,
}: { open: boolean; onClose: () => void; workerId: string }) {
  const d = useData();
  const [monto, setMonto]   = useState<number>(0);
  const [motivo, setMotivo] = useState("");

  function reset() { setMonto(0); setMotivo(""); }
  function enviar() {
    if (!monto || monto <= 0 || !motivo.trim()) return;
    d.addAdelanto({
      workerId,
      monto,
      motivo: motivo.trim(),
      fecha: new Date().toISOString().slice(0,10),
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Solicitar adelanto" width={420}>
      <div style={{ fontSize: 12, color:"var(--text-muted)", marginBottom: 14 }}>
        Tu solicitud quedará en estado <strong>pendiente</strong> hasta que tu encargado o el admin la revise.
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap: 12, marginBottom: 18 }}>
        <div>
          <div className="section-label">Monto solicitado (S/)</div>
          <input
            type="number"
            className="input-base input-mono"
            value={monto || ""}
            onChange={e => setMonto(Number(e.target.value))}
            placeholder="0.00"
            min={1}
          />
        </div>
        <div>
          <div className="section-label">Motivo</div>
          <textarea
            className="input-base"
            rows={3}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: Pago de servicios, emergencia familiar..."
          />
        </div>
      </div>

      <div style={{ display:"flex", gap: 10 }}>
        <div style={{ flex: 1 }} />
        <button className="btn-outline" onClick={() => { reset(); onClose(); }}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={enviar}
          disabled={!monto || monto <= 0 || !motivo.trim()}
        >
          Enviar solicitud
        </button>
      </div>
    </Modal>
  );
}

/* ================= PÁGINA ================= */
export default function MisAdelantosPage() {
  const worker = useWorkerSession();
  const d = useData();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modalOpen, setModalOpen] = useState(false);

  const mios = useMemo(() => {
    if (!worker) return [];
    return d.adelantos
      .filter(a => a.workerId === worker.id)
      .sort((a,b) => b.fecha.localeCompare(a.fecha));
  }, [worker, d.adelantos]);

  const filtrados = useMemo(
    () => filtro === "todos" ? mios : mios.filter(a => a.estado === filtro),
    [mios, filtro]
  );

  /* ====== KPIs ====== */
  const totalPend = mios.filter(a => a.estado === "pendiente").reduce((a,x)=>a+x.monto, 0);
  const totalApr  = mios.filter(a => a.estado === "aprobado").reduce((a,x)=>a+x.monto, 0);
  const countPend = mios.filter(a => a.estado === "pendiente").length;
  const countApr  = mios.filter(a => a.estado === "aprobado").length;

  /* ====== Aprobados del mes en curso (lo que se descuenta del sueldo) ====== */
  const now = new Date();
  const aprMes = mios.filter(a => {
    if (a.estado !== "aprobado") return false;
    const [y, m] = a.fecha.split("-").map(Number);
    return y === now.getFullYear() && m - 1 === now.getMonth();
  }).reduce((acc, x) => acc + x.monto, 0);

  const pag = usePagination(filtrados);

  if (!worker) {
    return (
      <>
        <TopbarWorker title="Adelantos" subtitle="—" onMenuToggle={()=>{}} />
        <main className="page-main"><div className="card">Cargando...</div></main>
      </>
    );
  }

  return (
    <>
      <TopbarWorker title="Adelantos" subtitle={`${mios.length} solicitud${mios.length === 1 ? "" : "es"}`} onMenuToggle={()=>{}} />
      <main className="page-main animate-fade-in">

        {/* ====== KPIs ====== */}
        <div className="grid-stats" style={{ marginBottom: 14 }}>
          <div className="card" style={{ padding:"14px 16px", borderLeft:"4px solid #d97706" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Pendientes</div>
            <HideableAmount value={money(totalPend)} size={20} color="#d97706" weight={800} fontFamily="'DM Mono',monospace" />
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{countPend} solicitud{countPend === 1 ? "" : "es"}</div>
          </div>
          <div className="card" style={{ padding:"14px 16px", borderLeft:"4px solid #16a34a" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Aprobados (todos)</div>
            <HideableAmount value={money(totalApr)} size={20} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" />
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{countApr} histórico</div>
          </div>
          <div className="card" style={{ padding:"14px 16px", borderLeft:"4px solid var(--brand)" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Descuento de este mes</div>
            <HideableAmount value={money(aprMes)} size={20} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" />
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>Se resta al neto</div>
          </div>
        </div>

        {/* ====== Filtros + acción ====== */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12, gap: 10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap: 6, background:"var(--card)", border:"1px solid var(--border)", borderRadius: 10, padding: 3 }}>
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
            <Icon name="plus" size={13} color="#fff" /> Solicitar adelanto
          </button>
        </div>

        {/* ====== Lista ====== */}
        <div className="card" style={{ padding: 0, overflow:"hidden" }}>
          {filtrados.length === 0 ? (
            <div style={{ padding:"48px 24px", textAlign:"center" }}>
              <div style={{ width: 56, height: 56, borderRadius:"50%", background:"rgba(196,26,58,0.08)", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom: 12 }}>
                <Icon name="adelantos" size={26} color="var(--brand)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {filtro === "todos" ? "Sin solicitudes" : `Sin solicitudes ${filtro}s`}
              </div>
              <div style={{ fontSize: 12, color:"var(--text-muted)", marginBottom: 14 }}>
                Cuando solicites un adelanto aparecerá aquí.
              </div>
              <button className="btn-primary" onClick={()=>setModalOpen(true)} style={{ display:"inline-flex", alignItems:"center", gap: 6 }}>
                <Icon name="plus" size={13} color="#fff" /> Nueva solicitud
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column" }}>
              {pag.pageItems.map((a, i) => {
                const color = a.estado === "aprobado" ? "#16a34a"
                            : a.estado === "rechazado" ? "#8b8fa8"
                            : "#d97706";
                return (
                  <div key={a.id} style={{
                    display:"flex", alignItems:"center", gap: 12,
                    padding:"14px 18px",
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    borderLeft: `4px solid ${color}`,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
                      <Icon name="adelantos" size={18} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap: 8, marginBottom: 2, flexWrap:"wrap" }}>
                        <HideableAmount value={money(a.monto)} size={15} color={color} weight={800} fontFamily="'DM Mono',monospace" />
                        <Badge variant={a.estado as "pendiente"|"aprobado"|"rechazado"} small />
                      </div>
                      <div style={{ fontSize: 12, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis" }}>{a.motivo}</div>
                      <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginTop: 2 }}>
                        Solicitado: {formatFecha(a.fecha)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {pag.needsPagination && (
            <Pagination
              page={pag.page}
              totalPages={pag.totalPages}
              total={pag.total}
              rangeStart={pag.rangeStart}
              rangeEnd={pag.rangeEnd}
              onChange={pag.setPage}
              label="solicitudes"
            />
          )}
        </div>
      </main>

      <ModalSolicitar open={modalOpen} onClose={()=>setModalOpen(false)} workerId={worker.id} />
    </>
  );
}
