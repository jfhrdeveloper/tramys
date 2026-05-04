"use client";

/* ================= CALENDARIO ESTILO MULTIVERSE ================= */
/* Grid mensual con celdas de día: botones Trabajó / Tardanza.    */
/* Inspirado en multiverse-main/src/components/salary/CalendarGrid */

import { useMemo } from "react";
import { Icon } from "./Icons";

export interface DayStatus {
  worked: boolean;
  late: boolean;
  ausente?: boolean;
  permiso?: boolean;
  override?: number | null;   // monto manual
  vacaciones?: boolean;       // día marcado como vacaciones (subtipo de permiso)
  pagado?: boolean;           // día cubierto por un PagoPlanilla — banda visible
  /* Comparación cuadre personal vs oficial. Se renderiza como pill al pie. */
  compare?: "coincide" | "difiere" | "soloMia" | "soloOficial";
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface Props {
  year: number;
  month: number;               // 0-11
  getDayData: (day: number) => DayStatus;
  onToggleWorked: (day: number) => void;
  onToggleLate: (day: number) => void;
  onDayClick?: (day: number) => void;
  isHoliday?: (day: number) => boolean;
  readonly?: boolean;
  /* Esconde los botones internos (Trabajó / Tardanza) — pensado para vistas
     donde el registro se hace al click del día completo (p.ej. jaladores). */
  hideButtons?: boolean;
}

export function MultiverseCalendar({
  year, month, getDayData, onToggleWorked, onToggleLate, onDayClick, isHoliday, readonly = false, hideButtons = false,
}: Props) {
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDay = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date();

  function isWeekend(day: number) {
    const d = new Date(year, month, day).getDay();
    return d === 0 || d === 6;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
      {/* Cabecera días */}
      <div className="cal-grid">
        {WEEKDAYS.map(w => (
          <div key={w} style={{
            textAlign:"center", fontSize: 10, fontWeight: 700,
            color:"var(--text-muted)", fontFamily:"'DM Mono',monospace",
            textTransform:"uppercase", letterSpacing: .8, padding:"4px 0",
          }}>{w}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="cal-grid">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const data = getDayData(day);
          const weekend = isWeekend(day);
          const holiday = isHoliday?.(day) ?? false;
          const isToday =
            today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

          /* Día pagado: banda diagonal sutil (linear-gradient) sobre el fondo
             para indicar que ya fue liquidado en planilla. */
          const paidLayer = data.pagado
            ? "repeating-linear-gradient(45deg, rgba(34,197,94,0.10) 0 6px, transparent 6px 12px), "
            : "";
          const baseBg = holiday ? "rgba(99,102,241,0.08)" : weekend ? "rgba(245,158,11,0.06)" : "var(--card)";

          return (
            <div key={day}
              className="cal-cell"
              style={{
                background: `${paidLayer}${baseBg}`,
                border: `1px solid ${data.pagado ? "rgba(34,197,94,0.55)" : isToday ? "#f59e0b" : data.worked ? "rgba(34,197,94,0.5)" : "var(--border)"}`,
                outline: data.worked ? "1px solid rgba(34,197,94,0.3)" : "none",
                cursor: onDayClick ? "pointer" : "default",
              }}
              onClick={() => onDayClick?.(day)}
            >
              {/* Header día */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", minWidth: 0, gap: 3 }}>
                <span className="cal-day-num" style={{
                  fontWeight: isToday ? 800 : 700,
                  color: isToday ? "#f59e0b" : weekend ? "#d97706" : "var(--text)",
                  flexShrink: 0,
                }}>{String(day).padStart(2, "0")}</span>
                <div style={{ display:"inline-flex", alignItems:"center", gap: 3, flexShrink: 0 }}>
                  {data.pagado && (
                    <span title="Día incluido en planilla pagada" style={{ fontSize: 9, fontWeight: 800, color:"#16a34a", fontFamily:"'DM Mono',monospace", background:"rgba(34,197,94,0.16)", padding:"1px 5px", borderRadius: 99, letterSpacing: .4 }}>PAG</span>
                  )}
                  {data.vacaciones && (
                    <span title="Vacaciones" style={{ fontSize: 9, fontWeight: 800, color:"#0891b2", fontFamily:"'DM Mono',monospace", background:"rgba(6,182,212,0.14)", padding:"1px 5px", borderRadius: 99, letterSpacing: .4 }}>VAC</span>
                  )}
                  {data.override !== null && data.override !== undefined && (
                    <span title={`Ingreso ajustado: S/ ${data.override}`} style={{ fontSize: 9, fontWeight: 800, color:"var(--brand)", fontFamily:"'DM Mono',monospace" }}>S/</span>
                  )}
                  {holiday && (
                    <span className="cal-tag-mini" style={{ fontSize: 8, fontWeight: 800, color:"#6366f1", letterSpacing: .6 }}>FER</span>
                  )}
                  {weekend && !holiday && (
                    <span className="cal-tag-mini" style={{ fontSize: 8, fontWeight: 800, color:"#d97706", opacity:.6, letterSpacing: .6 }}>FDS</span>
                  )}
                </div>
              </div>

              {/* Botones internos: ocultos cuando hideButtons (p.ej. jaladores). */}
              {!hideButtons && (
                <>
                  {/* Botón Trabajó */}
                  <button
                    disabled={readonly}
                    onClick={(e) => { e.stopPropagation(); onToggleWorked(day); }}
                    className="cal-btn"
                    title={data.worked ? "Trabajó" : "Sin marcar"}
                    style={{
                      background: data.worked ? "#16a34a" : "var(--bg)",
                      color: data.worked ? "#fff" : "var(--text-muted)",
                      border: data.worked ? "none" : "1px solid var(--border)",
                      cursor: readonly ? "default" : "pointer",
                    }}>
                    <Icon name="check" size={10} color={data.worked ? "#fff" : "var(--text-muted)"} />
                    <span className="cal-btn-label">{data.worked ? "Trabajó" : "—"}</span>
                  </button>

                  {/* Botón Tardanza */}
                  <button
                    disabled={readonly || !data.worked}
                    onClick={(e) => { e.stopPropagation(); onToggleLate(day); }}
                    className="cal-btn"
                    title={data.late ? "Tarde" : "A tiempo"}
                    style={{
                      background: data.late ? "#f59e0b" : "var(--bg)",
                      color: data.late ? "#fff" : "var(--text-muted)",
                      border: data.late ? "none" : "1px solid var(--border)",
                      cursor: (readonly || !data.worked) ? "default" : "pointer",
                      opacity: data.worked ? 1 : 0.35,
                    }}>
                    <Icon name="clock" size={10} color={data.late ? "#fff" : "var(--text-muted)"} />
                    <span className="cal-btn-label">{data.late ? "Tarde" : "A tiempo"}</span>
                  </button>
                </>
              )}

              {/* Pill de comparación cuadre vs oficial (solo si compare definido). */}
              {data.compare && data.compare !== "soloOficial" && (() => {
                const map = {
                  coincide:    { label: "✓ coincide",   bg: "rgba(34,197,94,0.16)",  fg: "#16a34a" },
                  difiere:     { label: "≠ oficial",    bg: "rgba(196,26,58,0.14)",  fg: "var(--brand)" },
                  soloMia:     { label: "sin oficial",  bg: "rgba(156,163,175,0.18)",fg: "var(--text-muted)" },
                  soloOficial: { label: "",             bg: "",                       fg: "" },
                } as const;
                const m = map[data.compare!];
                return (
                  <div style={{
                    marginTop: 3, padding:"2px 5px", borderRadius: 5,
                    background: m.bg, color: m.fg,
                    fontSize: 8.5, fontWeight: 800, fontFamily:"'DM Mono',monospace",
                    textAlign:"center", letterSpacing: .3,
                  }}>{m.label}</div>
                );
              })()}

              {/* Indicador compacto cuando hideButtons: pill verde "Asistió" si worked. */}
              {hideButtons && (
                <div style={{
                  display:"flex", alignItems:"center", justifyContent:"center",
                  marginTop:"auto", padding:"4px 6px", borderRadius: 6,
                  background: data.worked ? "rgba(34,197,94,0.14)" : "transparent",
                  color: data.worked ? "#16a34a" : "var(--text-muted)",
                  fontSize: 9.5, fontWeight: 700, letterSpacing: .3,
                  fontFamily:"'DM Mono',monospace",
                  border: data.worked ? "1px solid rgba(34,197,94,0.35)" : "1px dashed var(--border)",
                }}>
                  {data.worked ? "ASISTIÓ" : "—"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
