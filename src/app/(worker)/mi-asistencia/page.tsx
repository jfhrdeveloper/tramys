"use client";
import { useState } from "react";
import { TopbarWorker } from "@/components/layout/TopbarWorker";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icons";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const ESTADOS_DIA: Record<number, string> = {
  1: "presente", 2: "presente", 3: "presente", 4: "feriado", 5: "feriado",
  6: "presente", 7: "presente", 8: "presente", 9: "presente", 10: "presente",
  11: "feriado", 12: "feriado", 13: "presente", 14: "presente", 15: "tardanza",
  16: "presente", 17: "presente", 18: "permiso", 19: "presente",
};

const HISTORIAL = [
  { fecha: "Lun 14 Abr", entrada: "08:02", salida: "18:05", horas: "10h 03m", estado: "presente" as const },
  { fecha: "Mar 15 Abr", entrada: "08:15", salida: "18:00", horas: "9h 45m", estado: "tardanza" as const },
  { fecha: "Mié 16 Abr", entrada: "07:58", salida: "18:10", horas: "10h 12m", estado: "presente" as const },
  { fecha: "Jue 17 Abr", entrada: "08:01", salida: "18:00", horas: "9h 59m", estado: "presente" as const },
  { fecha: "Vie 18 Abr", entrada: "—", salida: "—", horas: "—", estado: "permiso" as const },
  { fecha: "Dom 19 Abr", entrada: "08:03", salida: "—", horas: "En curso", estado: "presente" as const },
];

export default function MiAsistenciaPage() {
  const [diaS, setDiaS] = useState(19);
  const dias: (number | null)[] = [];
  for (let i = 0; i < 2; i++) dias.push(null);
  for (let d = 1; d <= 30; d++) dias.push(d);

  function bgDia(d: number | null) {
    if (!d) return "transparent";
    if (d === diaS) return "var(--brand)";
    const e = ESTADOS_DIA[d];
    const map: Record<string, string> = { presente: "rgba(34,197,94,0.15)", tardanza: "rgba(196,26,58,0.15)", permiso: "rgba(245,158,11,0.15)", feriado: "rgba(99,102,241,0.15)" };
    return map[e] ?? "var(--bg)";
  }

  const presentes = Object.values(ESTADOS_DIA).filter(e => e === "presente").length;
  const tardanzas = Object.values(ESTADOS_DIA).filter(e => e === "tardanza").length;

  return (
    <>
      <TopbarWorker title="Mi Asistencia" subtitle="Abril 2026 · Solo puedes ver tu propia asistencia" onMenuToggle={() => { }} />
      <main className="page-main">

        {/* Stats personales */}
        <div className="grid-stats" style={{ marginBottom: 16 }}>
          {[
            { label: "Días presentes", value: presentes, color: "#16a34a" },
            { label: "Tardanzas", value: tardanzas, color: "var(--brand)" },
            { label: "Permisos", value: 1, color: "#f59e0b" },
            { label: "Feriados", value: 3, color: "#6366f1" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Calendario + Historial */}
        <div className="grid-cal" style={{ alignItems: "start" }}>

          {/* Calendario */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <button className="btn-ghost" style={{ padding: "4px 8px" }}>
                <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}>
                  <Icon name="chevron_right" size={14} />
                </span>
              </button>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Abril 2026</div>
              <button className="btn-ghost" style={{ padding: "4px 8px" }}><Icon name="chevron_right" size={14} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
              {DIAS_SEMANA.map(d => <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", padding: "3px 0" }}>{d}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
              {dias.map((d, i) => (
                <div key={i} onClick={() => d && setDiaS(d)} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontSize: 11, fontWeight: d === diaS || d === 19 ? 700 : 500, background: bgDia(d), color: d === diaS ? "#fff" : d === 19 ? "var(--brand)" : "var(--text)", cursor: d ? "pointer" : "default", border: d === 19 && d !== diaS ? "1px solid var(--brand)" : "1px solid transparent", transition: "all 0.15s" }}>
                  {d || ""}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {[["rgba(34,197,94,0.15)", "#16a34a", "Presente"], ["rgba(196,26,58,0.15)", "var(--brand)", "Tardanza"], ["rgba(245,158,11,0.15)", "#d97706", "Permiso"], ["rgba(99,102,241,0.15)", "#6366f1", "Feriado"]].map(([bg, c, l]) => (
                <div key={String(l)} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: String(bg), border: `1px solid ${String(c)}30`, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Historial */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>
              Mi historial — Abril 2026
            </div>
            <div className="table-wrap">
              <table className="tramys-table">
                <thead><tr>{["Fecha", "Entrada", "Salida", "Horas", "Estado"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {HISTORIAL.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{h.fecha}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace" }}>{h.entrada}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", color: "var(--text-muted)" }}>{h.salida}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", color: "var(--text-muted)", fontSize: 12 }}>{h.horas}</td>
                      <td><Badge variant={h.estado} small /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "var(--bg)", fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="lock" size={12} color="var(--text-muted)" />
              Solo lectura. Para corregir un registro contacta a tu encargado.
            </div>
          </div>
        </div>
      </main>
    </>
  );
}