"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import {
  useData, sedeDelDia, turnoDelDia,
  type AsistenciaRec, type EstadoAsist, type Worker, type Jalador,
} from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { esVacaciones, estiloEstado } from "@/lib/constants/estados";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const WEEKDAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

/* ================= MODAL CREAR / EDITAR REGISTRO ================= */
function ModalEditar({
  open, onClose, rec, worker, fechaISO,
}: {
  open: boolean; onClose: () => void;
  rec: AsistenciaRec | null;
  worker: Worker | null;
  fechaISO: string;
}) {
  const d = useData();
  const turnoBase = worker ? turnoDelDia(rec ?? undefined, worker) : { entrada: "", salida: "" };
  const sedeBase  = rec?.sedeIdDia ?? worker?.sedeId ?? "";

  const [estado, setEstado]   = useState<EstadoAsist>(rec?.estado ?? "presente");
  const [entrada, setEntrada] = useState(rec?.entrada ?? turnoBase.entrada);
  const [salida, setSalida]   = useState(rec?.salida ?? turnoBase.salida);
  const [sedeId, setSedeId]   = useState<string>(sedeBase);
  const [tEntrada, setTEntrada] = useState<string>(turnoBase.entrada);
  const [tSalida,  setTSalida]  = useState<string>(turnoBase.salida);
  const [motivo, setMotivo]   = useState("");
  const [usaOverride, setUsaOver] = useState<boolean>(rec?.overrideIngreso !== null && rec?.overrideIngreso !== undefined);
  const [override, setOverride]   = useState<number>(rec?.overrideIngreso ?? 0);

  useMemo(() => {
    if (!worker) return;
    const tBase = turnoDelDia(rec ?? undefined, worker);
    setEstado(rec?.estado ?? "presente");
    setEntrada(rec?.entrada ?? tBase.entrada);
    setSalida(rec?.salida ?? tBase.salida);
    setSedeId(rec?.sedeIdDia ?? worker.sedeId);
    setTEntrada(tBase.entrada);
    setTSalida(tBase.salida);
    setMotivo("");
    setUsaOver(rec?.overrideIngreso !== null && rec?.overrideIngreso !== undefined);
    setOverride(rec?.overrideIngreso ?? 0);
  }, [rec?.id, fechaISO, open, worker?.id]); // eslint-disable-line

  if (!worker) return null;
  const esNuevo = !rec || rec.id === "";
  const ESTADOS: EstadoAsist[] = ["presente","tardanza","ausente","permiso","feriado"];

  function guardar() {
    if (!esNuevo && !motivo.trim()) return; // editar requiere motivo; crear no
    const sinHoras = estado === "ausente" || estado === "permiso";
    d.setAsistencia(worker!.id, fechaISO, {
      estado,
      entrada: sinHoras ? null : (entrada || null),
      salida:  sinHoras ? null : (salida  || null),
      sedeIdDia:    sedeId && sedeId !== worker!.sedeId ? sedeId : undefined,
      turnoEntrada: tEntrada !== worker!.turno.entrada ? tEntrada : undefined,
      turnoSalida:  tSalida  !== worker!.turno.salida  ? tSalida  : undefined,
      overrideIngreso: usaOverride ? override : null,
      motivoEdit:   motivo.trim() || undefined,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={esNuevo ? "Registrar asistencia" : "Editar registro de asistencia"} width={460}>
      <div style={{ fontSize: 12, color:"var(--text-muted)", marginBottom: 14 }}>
        {worker.nombre} · {fechaISO}
      </div>

      {/* ====== Sede del día ====== */}
      <div style={{ marginBottom: 12 }}>
        <div className="section-label">Sede del día</div>
        <select className="select-base" value={sedeId} onChange={e=>setSedeId(e.target.value)} style={{ width: "100%" }}>
          {d.sedes.filter(s => s.activa).map(s => (
            <option key={s.id} value={s.id}>
              {s.nombre}{s.id === worker.sedeId ? " (planta)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* ====== Turno esperado del día ====== */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <div className="section-label">Turno entrada</div>
          <input type="time" className="input-base input-mono" value={tEntrada} onChange={e=>setTEntrada(e.target.value)} />
        </div>
        <div>
          <div className="section-label">Turno salida</div>
          <input type="time" className="input-base input-mono" value={tSalida} onChange={e=>setTSalida(e.target.value)} />
        </div>
      </div>

      {/* ====== Marca real ====== */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div><div className="section-label">Entrada real</div><input type="time" className="input-base input-mono" value={entrada} onChange={e=>setEntrada(e.target.value)} /></div>
        <div><div className="section-label">Salida real</div><input type="time" className="input-base input-mono" value={salida} onChange={e=>setSalida(e.target.value)} /></div>
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

      {/* ====== Override manual del ingreso del día ====== */}
      <div style={{ marginBottom: 14, padding: 10, borderRadius: 9, background:"var(--bg)", border:"1px solid var(--border)" }}>
        <label style={{ display:"flex", alignItems:"center", gap: 8, cursor:"pointer", marginBottom: 6 }}>
          <input type="checkbox" checked={usaOverride} onChange={e=>setUsaOver(e.target.checked)} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Override manual del ingreso del día</span>
        </label>
        {usaOverride ? (
          <input type="number" className="input-base input-mono"
            value={override || ""}
            onChange={e=>setOverride(Number(e.target.value))}
            placeholder="Monto fijo (S/)"
          />
        ) : (
          <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
            Usa la tarifa correspondiente al tipo de día.
          </div>
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="section-label">Motivo {esNuevo ? "(opcional)" : "*"}</div>
        <textarea className="input-base" rows={3} value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder={esNuevo ? "Nota o referencia..." : "Corrección..."} />
      </div>

      <div style={{ display:"flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={guardar} disabled={!esNuevo && !motivo.trim()}>
          {esNuevo ? "Registrar" : "Guardar"}
        </button>
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
  /* Filtro de tipo de personal. Trabajadores tienen `AsistenciaRec` real
     (estado, entrada/salida); jaladores no tienen marca diaria, así que
     su "asistencia" se infiere de si tienen `IngresoJalador` ese día. */
  const [tipoPersonal, setTipoPersonal] = useState<"trabajadores" | "jaladores" | "ambos">("trabajadores");
  const [modalEdit, setModalEdit] = useState<{ rec: AsistenciaRec | null; worker: Worker; iso: string } | null>(null);
  const [modalAdd, setModalAdd]   = useState<{ iso: string } | null>(null);
  const [addWorkerId, setAddWorkerId] = useState<string>("");

  /* Encargado: scope reducido a su sede. Acepta workers de planta de su sede
     O cualquier worker que tenga al menos un registro con sedeIdDia = su sede
     (visitas/préstamos de otras sedes).                                       */
  const idsEnSedeDelDia = useMemo(() => {
    if (!isEnc || !sedeActor) return new Set<string>();
    const ids = new Set<string>();
    for (const a of d.asistencia) {
      if (a.sedeIdDia === sedeActor.id) ids.add(a.workerId);
    }
    return ids;
  }, [d.asistencia, isEnc, sedeActor]);

  const trabajadores = d.workers.filter(w => w.rol === "trabajador" && w.activo
    && (!isEnc || !sedeActor || w.sedeId === sedeActor.id || idsEnSedeDelDia.has(w.id))
    && (filtroSede === "todas" || w.sedeId === filtroSede));

  const jaladores = d.jaladores.filter(j => j.activo
    && (!isEnc || !sedeActor || j.sedeId === sedeActor.id)
    && (filtroSede === "todas" || j.sedeId === filtroSede));

  /* Item unificado para iterar trabajadores + jaladores en el detalle del día. */
  type DiaItem =
    | { kind: "worker";  worker: Worker;   rec: AsistenciaRec; activoDia: boolean }
    | { kind: "jalador"; jalador: Jalador; ingresosDia: number; cantidadDia: number };

  function dataDia(iso: string): DiaItem[] {
    const feriado = esFeriadoOficial(iso).es;
    const items: DiaItem[] = [];
    if (tipoPersonal !== "jaladores") {
      for (const w of trabajadores) {
        const rec = d.asistencia.find(a => a.workerId === w.id && a.fecha === iso);
        const recEff: AsistenciaRec = rec ?? {
          id:"", workerId: w.id, fecha: iso, entrada: null, salida: null,
          estado: feriado ? "feriado" : "ausente",
          overrideIngreso: null,
        };
        items.push({ kind: "worker", worker: w, rec: recEff, activoDia: !!rec });
      }
    }
    if (tipoPersonal !== "trabajadores") {
      for (const j of jaladores) {
        const ings = d.ingresosJaladores.filter(ij => ij.jaladorId === j.id && ij.fecha === iso);
        const ingresosDia = ings.reduce((acc, ij) => acc + ij.monto, 0);
        items.push({ kind: "jalador", jalador: j, ingresosDia, cantidadDia: ings.length });
      }
    }
    return items;
  }

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const todayIso    = now.toISOString().slice(0,10);

  function cambiarMes(dir: -1 | 1) {
    setMonth(m => {
      const nx = m + dir;
      if (nx < 0)  { setYear(y => y - 1); return 11; }
      if (nx > 11) { setYear(y => y + 1); return 0; }
      return nx;
    });
  }

  const detalleDia = dataDia(selIso);
  const pagDetalle = usePagination(detalleDia);

  return (
    <>
      <Topbar title="Asistencia" subtitle={`${MESES[month]} ${year}`} />
      <main className="page-main animate-fade-in">

        {/* ====== Filtro tipo de personal ====== */}
        <div className="card" style={{ padding: "10px 14px", marginBottom: 10, display:"flex", gap: 8, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
            Personal
          </span>
          {([
            { k: "trabajadores" as const, label: `Trabajadores (${trabajadores.length})`, icon: "trabajadores", col: "#C41A3A" },
            { k: "jaladores"    as const, label: `Jaladores (${jaladores.length})`,       icon: "jaladores",    col: "#1d6fa4" },
            { k: "ambos"        as const, label: `Ambos`,                                  icon: "trabajadores", col: "#6366f1" },
          ]).map(t => {
            const active = tipoPersonal === t.k;
            return (
              <button key={t.k} onClick={() => setTipoPersonal(t.k)}
                style={{
                  padding: "6px 12px", borderRadius: 99,
                  border: active ? `1px solid ${t.col}` : "1px solid var(--border)",
                  background: active ? `${t.col}14` : "transparent",
                  color: active ? t.col : "var(--text-muted)",
                  fontWeight: active ? 700 : 500, fontSize: 11.5, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontFamily: "'Bricolage Grotesque',sans-serif",
                }}>
                <Icon name={t.icon} size={12} color={active ? t.col : "var(--text-muted)"} />
                {t.label}
              </button>
            );
          })}
        </div>

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
          <div style={{ marginLeft:"auto", display:"flex", gap: 8, alignItems:"center" }}>
            <div style={{ display:"inline-flex", gap: 4 }}>
              <button
                className="btn-outline"
                onClick={()=>cambiarMes(-1)}
                title="Mes anterior" aria-label="Mes anterior"
                style={{ width: 40, height: 40, minHeight: 40, padding: 0, display:"inline-flex", alignItems:"center", justifyContent:"center" }}
              >
                <span style={{ transform:"rotate(180deg)", display:"inline-flex", lineHeight: 0 }}><Icon name="chevron_right" size={12} /></span>
              </button>
              <button
                className="btn-outline"
                onClick={()=>cambiarMes(1)}
                title="Mes siguiente" aria-label="Mes siguiente"
                style={{ width: 40, height: 40, minHeight: 40, padding: 0, display:"inline-flex", alignItems:"center", justifyContent:"center" }}
              >
                <span style={{ display:"inline-flex", lineHeight: 0 }}><Icon name="chevron_right" size={12} /></span>
              </button>
            </div>
            <select className="select-base" value={month} onChange={e=>setMonth(Number(e.target.value))}>
              {MESES.map((m,i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select className="select-base" value={year} onChange={e=>setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              className="btn-primary hide-mobile"
              style={{ display:"inline-flex", alignItems:"center", gap: 6 }}
              onClick={()=>{ setAddWorkerId(""); setModalAdd({ iso: selIso }); }}
            >
              <Icon name="plus" size={13} color="#fff" /> Añadir registro
            </button>
          </div>
        </div>

        {/* Botón "Añadir registro" — solo en móvil, ancho completo abajo del filtro para no romper el layout */}
        <button
          className="btn-primary show-mobile"
          style={{ display:"none", alignItems:"center", justifyContent:"center", gap: 6, width:"100%", marginBottom: 14, padding:"12px 0", minHeight: 44 }}
          onClick={()=>{ setAddWorkerId(""); setModalAdd({ iso: selIso }); }}
        >
          <Icon name="plus" size={14} color="#fff" /> Añadir registro
        </button>

        {/* ====== Calendario ====== */}
        <div className="card" style={{ padding:"14px 18px", marginBottom: 14 }}>
          {/* Weekdays */}
          <div className="cal-grid" style={{ marginBottom: 6 }}>
            {WEEKDAYS.map(w => (
              <div key={w} style={{ textAlign:"center", fontSize: 10, fontWeight: 700, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .8, padding:"4px 0" }}>{w}</div>
            ))}
          </div>
          <div className="cal-grid">
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_,i)=>i+1).map(day => {
              const iso = toISO(year, month, day);
              const data = dataDia(iso);
              const isToday = iso === todayIso;
              const isSel = iso === selIso;
              const weekend = ((offset + day - 1) % 7) >= 5;
              const feriado = esFeriadoOficial(iso).es;

              /* Chips visibles del día: trabajadores con marca útil + jaladores con ingreso. */
              const visibles = data.filter(x => {
                if (x.kind === "worker") {
                  return x.rec.estado === "presente" || x.rec.estado === "tardanza" || esVacaciones(x.rec);
                }
                return x.cantidadDia > 0;
              });
              const mostrar = visibles.slice(0, 3);
              const restantes = visibles.length - mostrar.length;

              return (
                <div key={iso}
                  onClick={()=>setSelIso(iso)}
                  onDoubleClick={()=>{ setAddWorkerId(""); setModalAdd({ iso }); }}
                  title="Doble click para registrar a alguien este día"
                  className="cal-cell"
                  style={{
                    background: feriado ? "rgba(99,102,241,0.08)" : weekend ? "rgba(245,158,11,0.05)" : "var(--card)",
                    border: `1px solid ${isSel ? "var(--brand)" : isToday ? "#f59e0b" : "var(--border)"}`,
                    outline: isSel ? "2px solid var(--brand)" : "none",
                    cursor:"pointer", userSelect: "none",
                  }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", minWidth: 0 }}>
                    <span className="cal-day-num" style={{
                      fontWeight: isToday ? 800 : 700,
                      color: isToday ? "#f59e0b" : weekend ? "#d97706" : "var(--text)",
                    }}>{String(day).padStart(2,"0")}</span>
                    {feriado && <Icon name="calendar" size={10} color="#6366f1" />}
                  </div>

                  {/* Apodos/nombres (en móvil se convierten en barritas/dots) */}
                  <div style={{ display:"flex", flexDirection:"column", gap: 2, overflow:"hidden", minWidth: 0 }}>
                    {mostrar.map((x,i) => {
                      if (x.kind === "worker") {
                        const est = estiloEstado(x.rec);
                        return (
                          <div key={i} className="cal-chip" style={{ background: est.bg, color: est.fg }}>
                            <span style={{ width: 4, height: 4, borderRadius:"50%", background:"currentColor", flexShrink: 0 }} />
                            <span className="cal-btn-label" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {x.worker.apodo || x.worker.nombre.split(" ")[0]}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={i} className="cal-chip" style={{ background: "rgba(29,111,164,0.14)", color: "#1d6fa4" }}>
                          <span style={{ width: 4, height: 4, borderRadius:"50%", background:"currentColor", flexShrink: 0 }} />
                          <span className="cal-btn-label" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {x.jalador.apodo || x.jalador.nombre.split(" ")[0]}
                          </span>
                        </div>
                      );
                    })}
                    {restantes > 0 && (
                      <span className="cal-tag-mini" style={{ fontSize: 9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>+{restantes}</span>
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
            Detalle de {new Date(selIso + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div className="table-wrap">
            <table className="tramys-table">
              <thead><tr>
                <th>Persona</th>
                {tipoPersonal === "ambos" && <th>Tipo</th>}
                <th>Apodo</th>
                <th>Sede del día</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Estado</th>
                <th></th>
              </tr></thead>
              <tbody>
                {pagDetalle.pageItems.map(x => {
                  if (x.kind === "worker") {
                    const sedePlanta = d.sedes.find(s => s.id === x.worker.sedeId);
                    const sedeReal   = d.sedes.find(s => s.id === sedeDelDia(x.rec, x.worker));
                    const tieneRegistro = !!x.rec.id;
                    const visita = tieneRegistro && x.rec.sedeIdDia && x.rec.sedeIdDia !== x.worker.sedeId;
                    return (
                      <tr key={`w-${x.worker.id}`}>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                            <PhotoAvatar src={x.worker.avatarBase64} initials={(x.worker.apodo||x.worker.nombre)[0]} size={28} color={sedePlanta?.color ?? "#C41A3A"} />
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{x.worker.nombre}</span>
                          </div>
                        </td>
                        {tipoPersonal === "ambos" && (
                          <td>
                            <span style={{
                              fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono',monospace",
                              color: "#C41A3A", background: "rgba(196,26,58,0.12)",
                              padding: "2px 8px", borderRadius: 99, letterSpacing: 0.4,
                            }}>TRAB</span>
                          </td>
                        )}
                        <td style={{ fontSize: 12, color: sedePlanta?.color, fontWeight: 700 }}>{x.worker.apodo}</td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600, color: sedeReal?.color }}>{sedeReal?.nombre}</span>
                          {visita && (
                            <span style={{
                              display:"inline-flex", alignItems:"center", gap:4,
                              marginLeft:6, fontSize:9, fontWeight:700,
                              padding:"2px 6px", borderRadius:99,
                              background:"rgba(245,158,11,0.15)", color:"#d97706",
                              fontFamily:"'DM Mono',monospace", textTransform:"uppercase",
                            }} title={`Sede de planta: ${sedePlanta?.nombre}`}>
                              ⇄ visita
                            </span>
                          )}
                        </td>
                        <td style={{ fontFamily:"'DM Mono',monospace" }}>{x.rec.entrada ?? "—"}</td>
                        <td style={{ fontFamily:"'DM Mono',monospace", color:"var(--text-muted)" }}>{x.rec.salida ?? "—"}</td>
                        <td>
                          <span style={{ display:"inline-flex", alignItems:"center", gap: 5 }}>
                            <Badge variant={x.rec.estado as "presente"|"tardanza"|"ausente"|"permiso"|"feriado"} small />
                            {esVacaciones(x.rec) && (
                              <span style={{
                                fontSize: 9, fontWeight: 800, padding:"2px 6px", borderRadius: 99,
                                background:"rgba(6,182,212,0.14)", color:"#0891b2",
                                fontFamily:"'DM Mono',monospace", letterSpacing: .4,
                              }} title={x.rec.motivoEdit ?? "Vacaciones"}>VAC</span>
                            )}
                          </span>
                        </td>
                        <td>
                          <button className="btn-outline" style={{ fontSize: 11, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap: 4 }}
                            onClick={()=>setModalEdit({ rec: tieneRegistro ? x.rec : null, worker: x.worker, iso: selIso })}>
                            <Icon name={tieneRegistro ? "edit" : "plus"} size={11} /> {tieneRegistro ? "Editar" : "Registrar"}
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  /* Jalador: sin marca diaria. Estado = "Activo" si tiene
                     ingreso ese día, "Sin actividad" si no. Edit redirige
                     al panel de jaladores. */
                  const sedeJal = d.sedes.find(s => s.id === x.jalador.sedeId);
                  const activo  = x.cantidadDia > 0;
                  return (
                    <tr key={`j-${x.jalador.id}`} style={{ background: "rgba(29,111,164,0.04)" }}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                          <PhotoAvatar src={x.jalador.avatarBase64} initials={(x.jalador.apodo||x.jalador.nombre)[0]} size={28} color={sedeJal?.color ?? "#1d6fa4"} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{x.jalador.nombre}</span>
                        </div>
                      </td>
                      {tipoPersonal === "ambos" && (
                        <td>
                          <span style={{
                            fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono',monospace",
                            color: "#1d6fa4", background: "rgba(29,111,164,0.12)",
                            padding: "2px 8px", borderRadius: 99, letterSpacing: 0.4,
                          }}>JAL</span>
                        </td>
                      )}
                      <td style={{ fontSize: 12, color: sedeJal?.color, fontWeight: 700 }}>{x.jalador.apodo}</td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: sedeJal?.color }}>{sedeJal?.nombre ?? "—"}</span>
                      </td>
                      <td colSpan={2} style={{ fontFamily:"'DM Mono',monospace", fontSize: 11.5, color: "var(--text-muted)" }}>
                        {activo
                          ? `${x.cantidadDia} ingreso${x.cantidadDia === 1 ? "" : "s"} · S/ ${x.ingresosDia.toFixed(2)}`
                          : "—"}
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
                          background: activo ? "rgba(34,197,94,0.12)" : "rgba(139,143,168,0.15)",
                          color: activo ? "#16a34a" : "var(--text-muted)",
                          fontFamily: "'DM Mono',monospace",
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} />
                          {activo ? "Activo" : "Sin actividad"}
                        </span>
                      </td>
                      <td>
                        <Link href={`/jaladores?sede=${x.jalador.sedeId}`} style={{ textDecoration: "none" }}>
                          <button className="btn-outline" style={{ fontSize: 11, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap: 4 }}>
                            <Icon name="edit" size={11} /> Editar
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagDetalle.needsPagination && (
            <Pagination
              page={pagDetalle.page}
              totalPages={pagDetalle.totalPages}
              total={pagDetalle.total}
              rangeStart={pagDetalle.rangeStart}
              rangeEnd={pagDetalle.rangeEnd}
              onChange={pagDetalle.setPage}
              label="trabajadores"
            />
          )}
        </div>
      </main>

      {modalEdit && (
        <ModalEditar
          open={true}
          onClose={()=>setModalEdit(null)}
          rec={modalEdit.rec}
          worker={modalEdit.worker}
          fechaISO={modalEdit.iso}
        />
      )}

      {/* ====== Modal "Añadir registro": picker de trabajador para una fecha ====== */}
      <Modal
        open={!!modalAdd}
        onClose={()=>setModalAdd(null)}
        title={modalAdd ? `Añadir registro · ${modalAdd.iso}` : ""}
        width={420}
      >
        {modalAdd && (
          <div style={{ display:"flex", flexDirection:"column", gap: 12 }}>
            <div>
              <div className="section-label">Fecha</div>
              <input
                type="date"
                className="input-base input-mono"
                value={modalAdd.iso}
                onChange={e=>setModalAdd({ iso: e.target.value })}
              />
            </div>
            <div>
              <div className="section-label">Trabajador</div>
              <select
                className="select-base"
                value={addWorkerId}
                onChange={e=>setAddWorkerId(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">Selecciona un trabajador…</option>
                {trabajadores.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.nombre}{w.apodo ? ` (${w.apodo})` : ""}
                  </option>
                ))}
              </select>
              {trabajadores.length === 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color:"var(--text-muted)" }}>
                  No hay trabajadores en tu scope para asignar.
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap: 10, marginTop: 4 }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={()=>setModalAdd(null)}>Cancelar</button>
              <button
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={!addWorkerId}
                onClick={()=>{
                  const w = trabajadores.find(x => x.id === addWorkerId);
                  if (!w || !modalAdd) return;
                  const recExist = d.asistencia.find(a => a.workerId === w.id && a.fecha === modalAdd.iso) ?? null;
                  const iso = modalAdd.iso;
                  setSelIso(iso);
                  setModalAdd(null);
                  setModalEdit({ rec: recExist, worker: w, iso });
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
