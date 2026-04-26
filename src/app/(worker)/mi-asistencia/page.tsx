"use client";

import { useMemo, useState } from "react";
import { TopbarWorker } from "@/components/layout/TopbarWorker";
import { Icon } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { MultiverseCalendar } from "@/components/ui/MultiverseCalendar";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { money } from "@/lib/utils/formatters";
import { useWorkerSession } from "@/hooks/useWorkerSession";
import {
  useData, ingresoDia, isWeekendISO, sedeDelDia, turnoDelDia,
  type AsistenciaRec,
} from "@/components/providers/DataProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";

type Panel = "multiverse" | "general" | "calendario";
const WEEKDAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const COLOR_ESTADO: Record<string, string> = {
  presente: "#16a34a",
  tardanza: "#f59e0b",
  ausente:  "#8b8fa8",
  permiso:  "#d97706",
  feriado:  "#6366f1",
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function MiAsistenciaPage() {
  const worker = useWorkerSession();
  const d = useData();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [panel, setPanel] = useState<Panel>("multiverse");
  const [verDia, setVerDia] = useState<{ iso: string; rec: AsistenciaRec | null } | null>(null);

  function isoFor(day: number) {
    return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }
  function getDayData(day: number) {
    if (!worker) return { worked: false, late: false };
    const iso = isoFor(day);
    const rec = d.getAsistencia(worker.id, iso);
    return {
      worked: rec ? (rec.estado === "presente" || rec.estado === "tardanza") : false,
      late: rec?.estado === "tardanza",
    };
  }
  function toggleWorked(day: number) {
    if (!worker) return;
    const iso = isoFor(day);
    const rec = d.getAsistencia(worker.id, iso);
    const workedNow = rec ? (rec.estado === "presente" || rec.estado === "tardanza") : false;
    if (workedNow) {
      d.setAsistencia(worker.id, iso, { estado:"ausente", entrada:null, salida:null });
    } else {
      d.setAsistencia(worker.id, iso, { estado:"presente", entrada: worker.turno.entrada, salida: worker.turno.salida });
    }
  }
  function toggleLate(day: number) {
    if (!worker) return;
    const iso = isoFor(day);
    const rec = d.getAsistencia(worker.id, iso);
    if (!rec) return;
    d.setAsistencia(worker.id, iso, { estado: rec.estado === "tardanza" ? "presente" : "tardanza" });
  }
  function cambiarMes(dir: -1 | 1) {
    setMonth(m => {
      const nx = m + dir;
      if (nx < 0)  { setYear(y=>y-1); return 11; }
      if (nx > 11) { setYear(y=>y+1); return 0; }
      return nx;
    });
  }

  const { resumen, historial } = useMemo(() => {
    const base = { resumen: { normal: 0, tardanza: 0, finSem: 0, feriado: 0, total: 0 }, historial: [] as typeof d.asistencia };
    if (!worker) return base;
    let normal=0, tardanza=0, finSem=0, feriado=0, total=0;
    const hist: typeof d.asistencia = [];
    for (const a of d.asistencia) {
      if (a.workerId !== worker.id) continue;
      const [y, m] = a.fecha.split("-").map(Number);
      if (y !== year || m-1 !== month) continue;
      hist.push(a);
      const esFer = esFeriadoOficial(a.fecha).es;
      const esFds = isWeekendISO(a.fecha);
      total += ingresoDia(a, worker.tarifas, esFds, esFer);
      if (a.estado === "ausente" || a.estado === "permiso") continue;
      if (a.estado === "feriado" || esFer) feriado++;
      else if (esFds) finSem++;
      else if (a.estado === "tardanza") tardanza++;
      else normal++;
    }
    hist.sort((a,b) => b.fecha.localeCompare(a.fecha));
    return { resumen: { normal, tardanza, finSem, feriado, total }, historial: hist.slice(0, 15) };
  }, [d.asistencia, worker, year, month]);

  if (!worker) {
    return (
      <>
        <TopbarWorker title="Mi asistencia" subtitle="—" onMenuToggle={()=>{}} />
        <main className="page-main"><div className="card">Cargando...</div></main>
      </>
    );
  }

  return (
    <>
      <TopbarWorker title="Mi asistencia" subtitle={`${MESES[month]} ${year}`} onMenuToggle={()=>{}} />
      <main className="page-main animate-fade-in">

        {/* Tabs */}
        <div style={{ display:"flex", gap: 4, background:"var(--card)", border:"1px solid var(--border)", borderRadius: 10, padding: 3, marginBottom: 14, width:"fit-content" }}>
          {([
            { id:"multiverse" as Panel,  label:"Cuadrar días", icon:"check" },
            { id:"calendario" as Panel,  label:"Calendario",   icon:"calendar" },
            { id:"general" as Panel,     label:"Historial",    icon:"asistencia" },
          ]).map(t => (
            <button key={t.id} onClick={()=>setPanel(t.id)}
              style={{
                padding:"7px 14px", borderRadius: 8, border:"none", cursor:"pointer",
                background: panel===t.id ? "var(--brand)" : "transparent",
                color:      panel===t.id ? "#fff" : "var(--text-muted)",
                fontWeight: panel===t.id ? 700 : 500, fontSize: 12,
                display:"inline-flex", alignItems:"center", gap: 6,
              }}>
              <Icon name={t.icon} size={13} color={panel===t.id?"#fff":"currentColor"} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Selector mes/año */}
        <div style={{ display:"flex", gap: 8, alignItems:"center", marginBottom: 14, flexWrap:"wrap" }}>
          <button className="btn-outline" onClick={()=>cambiarMes(-1)}><span style={{ transform:"rotate(180deg)", display:"inline-flex" }}><Icon name="chevron_right" size={12} /></span></button>
          <select className="select-base" value={month} onChange={e=>setMonth(Number(e.target.value))}>
            {MESES.map((m,i)=><option key={m} value={i}>{m}</option>)}
          </select>
          <select className="select-base" value={year} onChange={e=>setYear(Number(e.target.value))}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-outline" onClick={()=>cambiarMes(1)}><Icon name="chevron_right" size={12} /></button>
        </div>

        {panel === "multiverse" && (
          <div className="grid-2" style={{ alignItems:"start" }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                Marca tus días — {MESES[month]} {year}
              </div>
              <MultiverseCalendar
                year={year} month={month}
                getDayData={getDayData}
                onToggleWorked={toggleWorked}
                onToggleLate={toggleLate}
                isHoliday={(day) => esFeriadoOficial(isoFor(day)).es}
              />
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap: 12 }}>
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Mis tarifas</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8 }}>
                  {[
                    { k:"Día normal", v: worker.tarifas.diaNormal, color:"#16a34a" },
                    { k:"Tardanza",   v: worker.tarifas.tardanza,   color:"#f59e0b" },
                    { k:"Fin semana", v: worker.tarifas.finSemana,  color:"#6366f1" },
                    { k:"Feriado",    v: worker.tarifas.feriado,    color:"var(--brand)" },
                  ].map(r => (
                    <div key={r.k} style={{ padding: 10, background:"var(--bg)", border:"1px solid var(--border)", borderLeft: `4px solid ${r.color}`, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color:"var(--text-muted)", textTransform:"uppercase" }}>{r.k}</div>
                      <HideableAmount value={money(r.v)} size={14} color={r.color} weight={800} fontFamily="'DM Mono',monospace" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Resumen del mes</div>
                <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
                  {[
                    { k:"Día normal",   n: resumen.normal,   t: worker.tarifas.diaNormal, color:"#16a34a" },
                    { k:"Tardanza",     n: resumen.tardanza, t: worker.tarifas.tardanza,   color:"#f59e0b" },
                    { k:"Fin de semana",n: resumen.finSem,   t: worker.tarifas.finSemana,  color:"#6366f1" },
                    { k:"Feriado",      n: resumen.feriado,  t: worker.tarifas.feriado,    color:"var(--brand)" },
                  ].map(r => (
                    <div key={r.k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 10px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 8 }}>
                      <span style={{ fontSize: 12 }}>{r.k}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: r.color }}>{r.n}</span>
                        <span style={{ color:"var(--text-muted)" }}> × {money(r.t)}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: 14, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.3)", borderRadius: 10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontWeight: 700, color:"#16a34a" }}>Total estimado</span>
                  <HideableAmount value={money(resumen.total)} size={20} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" />
                </div>
              </div>
            </div>
          </div>
        )}

        {panel === "calendario" && (
          <div className="card" style={{ padding: "14px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
              Lo que se ha registrado — {MESES[month]} {year}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap: 6, marginBottom: 6 }}>
              {WEEKDAYS.map(w => (
                <div key={w} style={{ textAlign:"center", fontSize: 10, fontWeight: 700, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .8, padding:"4px 0" }}>{w}</div>
              ))}
            </div>
            {(() => {
              const daysInMonth = new Date(year, month+1, 0).getDate();
              const firstDay    = new Date(year, month, 1).getDay();
              const offset      = firstDay === 0 ? 6 : firstDay - 1;
              const todayIso    = now.toISOString().slice(0,10);
              return (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap: 6 }}>
                  {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_,i)=>i+1).map(day => {
                    const iso = isoFor(day);
                    const rec = d.getAsistencia(worker.id, iso) ?? null;
                    const sedeId = rec ? sedeDelDia(rec, worker) : worker.sedeId;
                    const sede = d.sedes.find(s => s.id === sedeId);
                    const isVisita = !!(rec?.sedeIdDia && rec.sedeIdDia !== worker.sedeId);
                    const color = rec ? COLOR_ESTADO[rec.estado] : "transparent";
                    const isToday = iso === todayIso;
                    return (
                      <div key={iso}
                        onClick={()=>setVerDia({ iso, rec })}
                        style={{
                          background: rec ? `${color}14` : "var(--card)",
                          border: `1px solid ${isToday ? "#f59e0b" : "var(--border)"}`,
                          borderLeft: rec ? `4px solid ${color}` : "1px solid var(--border)",
                          borderRadius: 10, padding: 7, minHeight: 78,
                          display:"flex", flexDirection:"column", gap: 3,
                          cursor:"pointer", transition:"all 0.15s",
                        }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontWeight: isToday?800:700, fontSize: 13, color: isToday ? "#f59e0b" : "var(--text)" }}>
                            {String(day).padStart(2,"0")}
                          </span>
                          {isVisita && <span title={`Visita: ${sede?.nombre}`} style={{ fontSize: 9, color:"#d97706", fontWeight: 800 }}>⇄</span>}
                        </div>
                        {rec && (
                          <>
                            <span style={{ fontSize: 10, fontWeight: 700, color, textTransform:"capitalize", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {rec.estado}
                            </span>
                            {sede && (
                              <span style={{ fontSize: 9, color: sede.color, fontWeight: 600, fontFamily:"'DM Mono',monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {sede.nombre}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div style={{ marginTop: 12, fontSize: 11, color:"var(--text-muted)", display:"flex", gap: 14, flexWrap:"wrap" }}>
              {Object.entries(COLOR_ESTADO).map(([k,c]) => (
                <span key={k} style={{ display:"inline-flex", alignItems:"center", gap: 4, textTransform:"capitalize" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display:"inline-block" }} />
                  {k}
                </span>
              ))}
              <span style={{ display:"inline-flex", alignItems:"center", gap: 4, color:"#d97706" }}>
                <span style={{ fontWeight: 800 }}>⇄</span> Visita a otra sede
              </span>
            </div>
          </div>
        )}

        {panel === "general" && (
          <div className="card" style={{ padding: 0, overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>
              Historial — {MESES[month]} {year}
            </div>
            <div className="table-wrap">
              <table className="tramys-table">
                <thead><tr><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Estado</th></tr></thead>
                <tbody>
                  {historial.length === 0 && <tr><td colSpan={4} style={{ textAlign:"center", padding: 30, color:"var(--text-muted)" }}>Sin registros</td></tr>}
                  {historial.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily:"'DM Mono',monospace", fontSize: 12 }}>{h.fecha}</td>
                      <td style={{ fontFamily:"'DM Mono',monospace" }}>{h.entrada ?? "—"}</td>
                      <td style={{ fontFamily:"'DM Mono',monospace", color:"var(--text-muted)" }}>{h.salida ?? "—"}</td>
                      <td><Badge variant={h.estado as "presente"|"tardanza"|"ausente"|"permiso"|"feriado"} small /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ====== Modal detalle del día (solo lectura para el trabajador) ====== */}
      <Modal open={!!verDia} onClose={()=>setVerDia(null)} title={verDia ? `Detalle · ${verDia.iso}` : ""} width={400}>
        {verDia && (() => {
          const rec = verDia.rec;
          const sedeId = rec ? sedeDelDia(rec, worker) : worker.sedeId;
          const sede = d.sedes.find(s => s.id === sedeId);
          const turno = turnoDelDia(rec ?? undefined, worker);
          const esFer = esFeriadoOficial(verDia.iso).es;
          return (
            <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
              {!rec ? (
                <div style={{ padding: 16, background:"var(--bg)", border:"1px dashed var(--border)", borderRadius: 10, color:"var(--text-muted)", fontSize: 13 }}>
                  Aún no hay registro para este día.
                </div>
              ) : (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9 }}>
                    <span style={{ fontSize: 12, color:"var(--text-muted)" }}>Estado</span>
                    <Badge variant={rec.estado as "presente"|"tardanza"|"ausente"|"permiso"|"feriado"} small />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9 }}>
                    <span style={{ fontSize: 12, color:"var(--text-muted)" }}>Sede del día</span>
                    <span style={{ fontWeight: 700, color: sede?.color }}>
                      {sede?.nombre}
                      {rec.sedeIdDia && rec.sedeIdDia !== worker.sedeId && (
                        <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, color:"#d97706" }}>⇄ visita</span>
                      )}
                    </span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8 }}>
                    <div style={{ padding:"10px 12px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9 }}>
                      <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Entrada</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontWeight: 700 }}>{rec.entrada ?? "—"}</div>
                      <div style={{ fontSize: 10, color:"var(--text-muted)" }}>Esperada {turno.entrada}</div>
                    </div>
                    <div style={{ padding:"10px 12px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9 }}>
                      <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Salida</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontWeight: 700 }}>{rec.salida ?? "—"}</div>
                      <div style={{ fontSize: 10, color:"var(--text-muted)" }}>Esperada {turno.salida}</div>
                    </div>
                  </div>
                  {rec.motivoEdit && (
                    <div style={{ padding:"10px 14px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.25)", borderRadius: 9, fontSize: 12 }}>
                      <span style={{ color:"#d97706", fontWeight: 700 }}>Nota: </span>{rec.motivoEdit}
                    </div>
                  )}
                </>
              )}
              {esFer && (
                <div style={{ padding:"8px 12px", borderRadius: 8, background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.25)", color:"#6366f1", fontSize: 12, fontWeight: 600 }}>
                  Feriado oficial nacional
                </div>
              )}
              <div style={{ fontSize: 11, color:"var(--text-muted)", textAlign:"center", marginTop: 4 }}>
                Solo lectura — los cambios los realiza tu encargado.
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
