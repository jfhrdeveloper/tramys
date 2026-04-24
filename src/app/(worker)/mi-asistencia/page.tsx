"use client";

import { useMemo, useState } from "react";
import { TopbarWorker } from "@/components/layout/TopbarWorker";
import { Icon } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { MultiverseCalendar } from "@/components/ui/MultiverseCalendar";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { money } from "@/lib/utils/formatters";
import { useWorkerSession } from "@/hooks/useWorkerSession";
import { useData, ingresoDia, isWeekendISO } from "@/components/providers/DataProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";

type Panel = "multiverse" | "general";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function MiAsistenciaPage() {
  const worker = useWorkerSession();
  const d = useData();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [panel, setPanel] = useState<Panel>("multiverse");

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
            { id:"multiverse" as Panel, label:"Cuadrar días", icon:"check" },
            { id:"general" as Panel,    label:"Historial",   icon:"asistencia" },
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
    </>
  );
}
