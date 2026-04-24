"use client";

/* ================= CALENDARIO ESTILO MULTIVERSE ================= */
/* Grid mensual con celdas de día: botones Trabajé / Tardanza.    */
/* Inspirado en multiverse-main/src/components/salary/CalendarGrid */

import { useMemo } from "react";
import { Icon } from "./Icons";

export interface DayStatus {
  worked: boolean;
  late: boolean;
  ausente?: boolean;
  permiso?: boolean;
  override?: number | null;   // monto manual
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
}

export function MultiverseCalendar({
  year, month, getDayData, onToggleWorked, onToggleLate, onDayClick, isHoliday, readonly = false,
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
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap: 6 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{
            textAlign:"center", fontSize: 10, fontWeight: 700,
            color:"var(--text-muted)", fontFamily:"'DM Mono',monospace",
            textTransform:"uppercase", letterSpacing: .8, padding:"4px 0",
          }}>{w}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap: 6 }}>
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const data = getDayData(day);
          const weekend = isWeekend(day);
          const holiday = isHoliday?.(day) ?? false;
          const isToday =
            today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

          return (
            <div key={day} style={{
              background: holiday ? "rgba(99,102,241,0.08)" : weekend ? "rgba(245,158,11,0.06)" : "var(--card)",
              border: `1px solid ${isToday ? "#f59e0b" : data.worked ? "rgba(34,197,94,0.5)" : "var(--border)"}`,
              outline: data.worked ? "1px solid rgba(34,197,94,0.3)" : "none",
              borderRadius: 10,
              padding: "6px",
              display:"flex", flexDirection:"column", gap: 4,
              minHeight: 92,
              cursor: onDayClick ? "pointer" : "default",
              transition: "all 0.15s",
            }}
            onClick={() => onDayClick?.(day)}
            >
              {/* Header día */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{
                  fontFamily:"'DM Mono',monospace",
                  fontSize: 12, fontWeight: isToday ? 800 : 700,
                  color: isToday ? "#f59e0b" : weekend ? "#d97706" : "var(--text)",
                }}>{String(day).padStart(2, "0")}</span>
                {holiday && (
                  <span style={{ fontSize: 8, fontWeight: 800, color:"#6366f1", letterSpacing: .6 }}>FER</span>
                )}
                {weekend && !holiday && (
                  <span style={{ fontSize: 8, fontWeight: 800, color:"#d97706", opacity:.6, letterSpacing: .6 }}>FDS</span>
                )}
              </div>

              {/* Botón Trabajé */}
              <button
                disabled={readonly}
                onClick={(e) => { e.stopPropagation(); onToggleWorked(day); }}
                style={{
                  width: "100%",
                  display:"flex", alignItems:"center", justifyContent:"center", gap: 3,
                  background: data.worked ? "#16a34a" : "var(--bg)",
                  color: data.worked ? "#fff" : "var(--text-muted)",
                  border: data.worked ? "none" : "1px solid var(--border)",
                  borderRadius: 6, padding: "3px 4px",
                  fontSize: 9, fontWeight: 700, cursor: readonly ? "default" : "pointer",
                  transition: "all 0.15s",
                }}>
                <Icon name="check" size={9} color={data.worked ? "#fff" : "var(--text-muted)"} />
                <span>{data.worked ? "Trabajé" : "—"}</span>
              </button>

              {/* Botón Tardanza */}
              <button
                disabled={readonly || !data.worked}
                onClick={(e) => { e.stopPropagation(); onToggleLate(day); }}
                style={{
                  width: "100%",
                  display:"flex", alignItems:"center", justifyContent:"center", gap: 3,
                  background: data.late ? "#f59e0b" : "var(--bg)",
                  color: data.late ? "#fff" : "var(--text-muted)",
                  border: data.late ? "none" : "1px solid var(--border)",
                  borderRadius: 6, padding: "3px 4px",
                  fontSize: 9, fontWeight: 700,
                  cursor: (readonly || !data.worked) ? "default" : "pointer",
                  opacity: data.worked ? 1 : 0.35,
                  transition: "all 0.15s",
                }}>
                <Icon name="clock" size={9} color={data.late ? "#fff" : "var(--text-muted)"} />
                <span>{data.late ? "Tarde" : "A tiempo"}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
