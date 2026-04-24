"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Icon } from "@/components/ui/Icons";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { money } from "@/lib/utils/formatters";
import { useData, ingresoDia, isWeekendISO } from "@/components/providers/DataProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

/* ============ LINE CHART SVG ============ */
function LineChart({
  series, height = 180,
}: {
  series: { label: string; color: string; values: number[] }[];
  height?: number;
}) {
  const W = 640;
  const H = height;
  const padT = 20, padB = 30, padL = 40, padR = 16;
  const maxLen = Math.max(...series.map(s => s.values.length));
  const allVals = series.flatMap(s => s.values);
  const maxVal = Math.max(...allVals, 1);

  const x = (i: number) => padL + (i / Math.max(maxLen - 1, 1)) * (W - padL - padR);
  const y = (v: number) => H - padB - (v / maxVal) * (H - padT - padB);

  const gridLines = 4;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display:"block" }}>
      {/* grid */}
      {Array.from({ length: gridLines+1 }).map((_, i) => {
        const yy = padT + (i / gridLines) * (H - padT - padB);
        const val = Math.round((1 - i/gridLines) * maxVal);
        return (
          <g key={i}>
            <line x1={padL} x2={W-padR} y1={yy} y2={yy} stroke="var(--border)" strokeDasharray="3 3" />
            <text x={padL-6} y={yy+3} fontSize="9" fill="var(--text-muted)" textAnchor="end" fontFamily="'DM Mono',monospace">{val}</text>
          </g>
        );
      })}
      {/* eje X labels */}
      {Array.from({ length: maxLen }).map((_, i) => (
        <text key={i} x={x(i)} y={H - 10} fontSize="9" fill="var(--text-muted)" textAnchor="middle" fontFamily="'DM Mono',monospace">
          {MESES[i] ?? ""}
        </text>
      ))}
      {/* lines + areas */}
      {series.map((s, si) => {
        const path = s.values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
        const area = `${path} L${x(s.values.length-1)},${H-padB} L${padL},${H-padB} Z`;
        return (
          <g key={si}>
            <path d={area} fill={s.color} opacity={0.12} />
            <path d={path} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/* ============ BARRAS HORIZONTALES ============ */
function HBars({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap: 10 }}>
          <span style={{ fontSize: 12, color:"var(--text-muted)", width: 90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.label}</span>
          <div style={{ flex: 1, height: 22, background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 6, overflow:"hidden", position:"relative" }}>
            <div style={{
              height: "100%",
              width: `${(d.value/max)*100}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              transition: "width 0.6s",
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily:"'DM Mono',monospace", minWidth: 48, textAlign:"right" }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ================= PÁGINA ================= */
export default function ReportesPage() {
  const d = useData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  /* Planilla por mes del año */
  const planillaPorMes = useMemo(() => {
    const res: number[] = Array.from({ length: 12 }, () => 0);
    for (const w of d.workers) {
      if (w.rol !== "trabajador" || !w.activo) continue;
      for (const a of d.asistencia) {
        if (a.workerId !== w.id) continue;
        const [y, m] = a.fecha.split("-").map(Number);
        if (y !== year) continue;
        res[m-1] += ingresoDia(a, w.tarifas, isWeekendISO(a.fecha), esFeriadoOficial(a.fecha).es);
      }
    }
    return res;
  }, [d.workers, d.asistencia, year]);

  /* Comisiones jaladores por mes */
  const comisionesPorMes = useMemo(() => {
    const res: number[] = Array.from({ length: 12 }, () => 0);
    for (const i of d.ingresosJaladores) {
      const j = d.jaladores.find(x => x.id === i.jaladorId);
      if (!j) continue;
      const [y, m] = i.fecha.split("-").map(Number);
      if (y !== year) continue;
      res[m-1] += i.monto * j.porcentajeComision / 100;
    }
    return res;
  }, [d.ingresosJaladores, d.jaladores, year]);

  /* Asistencia % por mes */
  const asistenciaPorMes = useMemo(() => {
    const res: number[] = Array.from({ length: 12 }, () => 0);
    const trabajadores = d.workers.filter(w => w.rol === "trabajador" && w.activo);
    for (let m = 0; m < 12; m++) {
      const dim = new Date(year, m+1, 0).getDate();
      let presencias = 0, total = 0;
      for (let day = 1; day <= dim; day++) {
        const iso = `${year}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        for (const w of trabajadores) {
          total += 1;
          const rec = d.asistencia.find(a => a.workerId === w.id && a.fecha === iso);
          if (rec && (rec.estado === "presente" || rec.estado === "tardanza")) presencias += 1;
        }
      }
      res[m] = total ? Math.round((presencias/total) * 100) : 0;
    }
    return res;
  }, [d.workers, d.asistencia, year]);

  /* Top jaladores */
  const topJaladores = useMemo(() => {
    return d.jaladores
      .filter(j => j.activo)
      .map(j => {
        const ing = d.ingresosJaladores
          .filter(i => i.jaladorId === j.id)
          .filter(i => i.fecha.startsWith(String(year)))
          .reduce((a,i) => a + i.monto, 0);
        return { label: j.apodo || j.nombre.split(" ")[0], value: ing };
      })
      .sort((a,b) => b.value - a.value)
      .slice(0, 6);
  }, [d.jaladores, d.ingresosJaladores, year]);

  /* Ingresos por sede */
  const ingresosPorSede = d.sedes.map(s => ({ label: s.nombre, value: s.cajaMes.ingresos, color: s.color }));

  /* Total bruto año */
  const totalPlanillaAnio = planillaPorMes.reduce((a, x) => a + x, 0);
  const totalComisionesAnio = comisionesPorMes.reduce((a, x) => a + x, 0);

  return (
    <>
      <Topbar title="Reportes" subtitle={`Vista analítica · ${year}`} />
      <main className="page-main">

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14, flexWrap:"wrap", gap: 8 }}>
          <div style={{ fontSize: 13, color:"var(--text-muted)" }}>Selecciona año para visualizar todos los datos</div>
          <select className="select-base" value={year} onChange={e=>setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Planilla + comisiones línea */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 8, flexWrap:"wrap", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Planilla y comisiones del año</div>
              <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>Tendencia mensual</div>
            </div>
            <div style={{ display:"flex", gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Planilla total</div>
                <HideableAmount value={money(totalPlanillaAnio)} size={15} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" />
              </div>
              <div>
                <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Comisiones total</div>
                <HideableAmount value={money(totalComisionesAnio)} size={15} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" />
              </div>
            </div>
          </div>
          <LineChart
            series={[
              { label:"Planilla", color:"#C41A3A", values: planillaPorMes },
              { label:"Comisiones", color:"#16a34a", values: comisionesPorMes },
            ]}
            height={200}
          />
          <div style={{ display:"flex", gap: 16, marginTop: 10 }}>
            <div style={{ display:"flex", alignItems:"center", gap: 6, fontSize: 11, color:"var(--text-muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background:"#C41A3A" }} /> Planilla
            </div>
            <div style={{ display:"flex", alignItems:"center", gap: 6, fontSize: 11, color:"var(--text-muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background:"#16a34a" }} /> Comisiones
            </div>
          </div>
        </div>

        {/* Asistencia % línea + top jaladores */}
        <div className="grid-2">
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Asistencia mensual (%)</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom: 12 }}>Promedio general</div>
            <LineChart series={[{ label:"Asistencia", color:"#6366f1", values: asistenciaPorMes }]} height={180} />
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Top jaladores del año</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom: 12 }}>Por ingresos totales</div>
            <HBars data={topJaladores} color="#C41A3A" />
          </div>
        </div>

        {/* Ingresos por sede */}
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Ingresos por sede (mes)</div>
          <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom: 14 }}>Caja mensual</div>
          <div style={{ display:"flex", gap: 12, flexWrap:"wrap" }}>
            {ingresosPorSede.map(s => {
              const max = Math.max(...ingresosPorSede.map(x => x.value), 1);
              const pct = Math.round((s.value / max) * 100);
              return (
                <div key={s.label} style={{ flex:"1 1 220px", background:"var(--bg)", border:"1px solid var(--border)", borderLeft:`4px solid ${s.color}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</span>
                    <HideableAmount value={money(s.value)} size={13} color={s.color} weight={800} fontFamily="'DM Mono',monospace" />
                  </div>
                  <div style={{ height: 8, background:"var(--border)", borderRadius: 99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width: `${pct}%`, background: `linear-gradient(90deg, ${s.color}88, ${s.color})` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exportar */}
        <div className="card" style={{ marginTop: 14, borderLeft:"4px solid var(--brand)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Exportar datos</div>
          <div style={{ fontSize: 12, color:"var(--text-muted)", marginBottom: 14 }}>Descarga los reportes en los formatos disponibles</div>
          <div style={{ display:"flex", gap: 10, flexWrap:"wrap" }}>
            <button className="btn-primary" style={{ display:"inline-flex", alignItems:"center", gap: 6 }}><Icon name="download" size={13} color="#fff" /> Planilla PDF</button>
            <button className="btn-outline" style={{ display:"inline-flex", alignItems:"center", gap: 6 }}><Icon name="download" size={13} /> Asistencia Excel</button>
            <button className="btn-outline" style={{ display:"inline-flex", alignItems:"center", gap: 6 }}><Icon name="download" size={13} /> Jaladores Excel</button>
            <button className="btn-outline" style={{ display:"inline-flex", alignItems:"center", gap: 6 }}><Icon name="download" size={13} /> Reporte completo ZIP</button>
          </div>
        </div>
      </main>
    </>
  );
}
