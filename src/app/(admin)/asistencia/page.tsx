"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { useData, type AsistenciaRec, type EstadoAsist } from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const WEEKDAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

/* ================= MODAL EDITAR REGISTRO ================= */
function ModalEditar({
  open, onClose, rec, workerNombre, fechaISO,
}: {
  open: boolean; onClose: () => void;
  rec: AsistenciaRec | null;
  workerNombre: string;
  fechaISO: string;
}) {
  const d = useData();
  const [estado, setEstado]   = useState<EstadoAsist>(rec?.estado ?? "presente");
  const [entrada, setEntrada] = useState(rec?.entrada ?? "");
  const [salida, setSalida]   = useState(rec?.salida ?? "");
  const [motivo, setMotivo]   = useState("");

  useMemo(() => {
    setEstado(rec?.estado ?? "presente");
    setEntrada(rec?.entrada ?? "");
    setSalida(rec?.salida ?? "");
    setMotivo("");
  }, [rec?.id, open]); // eslint-disable-line

  if (!rec) return null;
  const ESTADOS: EstadoAsist[] = ["presente","tardanza","ausente","permiso","feriado"];

  function guardar() {
    if (!motivo.trim()) return;
    d.setAsistencia(rec!.workerId, fechaISO, {
      estado,
      entrada: entrada || null,
      salida:  salida  || null,
      motivoEdit: motivo,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar registro de asistencia" width={440}>
      <div style={{ fontSize: 12, color:"var(--text-muted)", marginBottom: 14 }}>
        {workerNombre} · {fechaISO}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div><div className="section-label">Entrada</div><input type="time" className="input-base input-mono" value={entrada} onChange={e=>setEntrada(e.target.value)} /></div>
        <div><div className="section-label">Salida</div><input type="time" className="input-base input-mono" value={salida} onChange={e=>setSalida(e.target.value)} /></div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div className="section-label">Estado</div>
        <div style={{ display:"flex", gap: 6, flexWrap:"wrap" }}>
          {ESTADOS.map(e => (
            <button key={e} onClick={()=>setEstado(e)}
              style={{
                padding:"6px 12px", borderRadius: 99, cursor:"pointer",
                border:`1px solid ${estado===e ? "var(--brand)" : "var(--border)"}`,
                background: estado===e ? "rgba(196,26,58,0.08)" : "var(--bg)",
                color:      estado===e ? "var(--brand)" : "var(--text-muted)",
                fontWeight: estado===e ? 700 : 500, fontSize: 12,
                textTransform:"capitalize",
              }}>{e}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div className="section-label">Motivo *</div>
        <textarea className="input-base" rows={3} value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Corrección..." />
      </div>
      <div style={{ display:"flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={guardar} disabled={!motivo.trim()}>Guardar</button>
      </div>
    </Modal>
  );
}

/* ================= PÁGINA ================= */
export default function AsistenciaPage() {
  const d = useData();
  const { worker: actor, sede: sedeActor } = useSession();
  const isEnc = actor?.rol === "encargado";
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selIso, setSelIso] = useState<string>(now.toISOString().slice(0,10));
  const [filtroSede, setFiltroSede] = useState(isEnc && sedeActor ? sedeActor.id : "todas");
  const [modalEdit, setModalEdit] = useState<{ rec: AsistenciaRec; worker: string; iso: string } | null>(null);

  /* Encargado: scope reducido a su sede asignada. */
  const trabajadores = d.workers.filter(w => w.rol === "trabajador" && w.activo
    && (!isEnc || !sedeActor || w.sedeId === sedeActor.id)
    && (filtroSede === "todas" || w.sedeId === filtroSede));

  function dataDia(iso: string) {
    const feriado = esFeriadoOficial(iso).es;
    const lista = trabajadores.map(w => {
      const rec = d.asistencia.find(a => a.workerId === w.id && a.fecha === iso);
      return {
        worker: w,
        rec: rec ?? { id:"", workerId: w.id, fecha: iso, entrada: null, salida: null,
                      estado: feriado ? "feriado" as const : "ausente" as const,
                      overrideIngreso: null } as AsistenciaRec,
      };
    });
    return lista;
  }

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const todayIso    = now.toISOString().slice(0,10);

  return (
    <>
      <Topbar title="Asistencia" subtitle={`${MESES[month]} ${year}`} />
      <main className="page-main animate-fade-in">

        {/* ====== Filtros de sede + dropdown mes/año ====== */}
        <div className="card" style={{ padding: 14, marginBottom: 14, display:"flex", gap: 10, flexWrap:"wrap", alignItems:"center" }}>
          {[
            { id:"todas", label:"Todas las sedes", color:"var(--brand)" },
            ...d.sedes.map(s => ({ id: s.id, label: s.nombre, color: s.color })),
          ].map(s => (
            <button key={s.id} onClick={()=>setFiltroSede(s.id)}
              style={{
                padding:"8px 14px", borderRadius: 8, cursor:"pointer",
                background: filtroSede===s.id ? s.color : "var(--bg)",
                color:      filtroSede===s.id ? "#fff" : "var(--text)",
                border: filtroSede===s.id ? "none" : "1px solid var(--border)",
                fontWeight: filtroSede===s.id ? 700 : 500, fontSize: 12,
                fontFamily:"'Bricolage Grotesque',sans-serif",
              }}>{s.label}</button>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", gap: 8 }}>
            <select className="select-base" value={month} onChange={e=>setMonth(Number(e.target.value))}>
              {MESES.map((m,i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select className="select-base" value={year} onChange={e=>setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* ====== Calendario ====== */}
        <div className="card" style={{ padding:"14px 18px", marginBottom: 14 }}>
          {/* Weekdays */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap: 6, marginBottom: 6 }}>
            {WEEKDAYS.map(w => (
              <div key={w} style={{ textAlign:"center", fontSize: 10, fontWeight: 700, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .8, padding:"4px 0" }}>{w}</div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap: 6 }}>
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_,i)=>i+1).map(day => {
              const iso = toISO(year, month, day);
              const data = dataDia(iso);
              const isToday = iso === todayIso;
              const isSel = iso === selIso;
              const weekend = ((offset + day - 1) % 7) >= 5;
              const feriado = esFeriadoOficial(iso).es;

              const mostrar = data
                .filter(x => x.rec.estado === "presente" || x.rec.estado === "tardanza")
                .slice(0, 3);
              const restantes = data.filter(x => x.rec.estado === "presente" || x.rec.estado === "tardanza").length - mostrar.length;

              return (
                <div key={iso}
                  onClick={()=>setSelIso(iso)}
                  style={{
                    background: feriado ? "rgba(99,102,241,0.08)" : weekend ? "rgba(245,158,11,0.05)" : "var(--card)",
                    border: `1px solid ${isSel ? "var(--brand)" : isToday ? "#f59e0b" : "var(--border)"}`,
                    outline: isSel ? "2px solid var(--brand)" : "none",
                    borderRadius: 10, padding: 7, minHeight: 100,
                    display:"flex", flexDirection:"column", gap: 4,
                    cursor:"pointer", transition:"all 0.15s",
                  }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{
                      fontFamily:"'DM Mono',monospace", fontWeight: isToday ? 800 : 700,
                      fontSize: 13,
                      color: isToday ? "#f59e0b" : weekend ? "#d97706" : "var(--text)",
                    }}>{String(day).padStart(2,"0")}</span>
                    {feriado && <Icon name="calendar" size={10} color="#6366f1" />}
                  </div>

                  {/* Apodos/nombres */}
                  <div style={{ display:"flex", flexDirection:"column", gap: 2, overflow:"hidden" }}>
                    {mostrar.map((x,i) => (
                      <div key={i} style={{
                        display:"flex", alignItems:"center", gap: 3,
                        background: x.rec.estado === "tardanza" ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)",
                        color:      x.rec.estado === "tardanza" ? "#d97706" : "#16a34a",
                        padding:"1px 5px", borderRadius: 99,
                        fontSize: 10, fontWeight: 700,
                        overflow:"hidden",
                      }}>
                        <span style={{ width: 4, height: 4, borderRadius:"50%", background:"currentColor", flexShrink: 0 }} />
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {x.worker.apodo || x.worker.nombre.split(" ")[0]}
                        </span>
                      </div>
                    ))}
                    {restantes > 0 && (
                      <span style={{ fontSize: 9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>+{restantes}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ====== Detalle día seleccionado ====== */}
        <div className="card" style={{ padding: 0, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>
            Detalle de {selIso}
          </div>
          <div className="table-wrap">
            <table className="tramys-table">
              <thead><tr><th>Trabajador</th><th>Apodo</th><th>Sede</th><th>Entrada</th><th>Salida</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {dataDia(selIso).map(x => {
                  const sede = d.sedes.find(s => s.id === x.worker.sedeId);
                  return (
                    <tr key={x.worker.id}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                          <PhotoAvatar src={x.worker.avatarBase64} initials={(x.worker.apodo||x.worker.nombre)[0]} size={28} color={sede?.color ?? "#C41A3A"} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{x.worker.nombre}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: sede?.color, fontWeight: 700 }}>{x.worker.apodo}</td>
                      <td><span style={{ fontSize: 12, fontWeight: 600, color: sede?.color }}>{sede?.nombre}</span></td>
                      <td style={{ fontFamily:"'DM Mono',monospace" }}>{x.rec.entrada ?? "—"}</td>
                      <td style={{ fontFamily:"'DM Mono',monospace", color:"var(--text-muted)" }}>{x.rec.salida ?? "—"}</td>
                      <td><Badge variant={x.rec.estado as "presente"|"tardanza"|"ausente"|"permiso"|"feriado"} small /></td>
                      <td>
                        <button className="btn-outline" style={{ fontSize: 11, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap: 4 }}
                          onClick={()=>setModalEdit({ rec: x.rec, worker: x.worker.nombre, iso: selIso })}>
                          <Icon name="edit" size={11} /> Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modalEdit && (
        <ModalEditar
          open={true}
          onClose={()=>setModalEdit(null)}
          rec={modalEdit.rec}
          workerNombre={modalEdit.worker}
          fechaISO={modalEdit.iso}
        />
      )}
    </>
  );
}
