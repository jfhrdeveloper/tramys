"use client";
import { useState } from "react";
import { Icon } from "./Icons";

/* ================= CALENDAR EVENTS ================= */
/* Calendario mensual genérico que pinta eventos por fecha. */

export interface CalendarEvent {
  day: number;
  label: string;
  color: string;
  icon?: string;
  meta?: string;
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

interface CalendarEventsProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  onChangeMonth: (dir: -1 | 1) => void;
  accentColor?: string;
  title?: string;
  titleIcon?: string;
  onDayClick?: (day: number) => void;
  selectedDay?: number | null;
  compact?: boolean;
}

export function CalendarEvents({
  year, month, events,
  onChangeMonth,
  accentColor = "var(--brand)",
  title,
  titleIcon = "feriados",
  onDayClick,
  selectedDay,
  compact = false,
}: CalendarEventsProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date();

  const cells: Array<number | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function eventsOf(day: number): CalendarEvent[] {
    return events.filter(e => e.day === day);
  }

  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      {/* ==== Header ==== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name={titleIcon} size={18} color={accentColor} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{title ?? `${MESES[month]} ${year}`}</div>
            {!title && <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>{MESES[month]} {year}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-ghost" onClick={() => onChangeMonth(-1)} aria-label="Mes anterior" style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 8 }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}>
              <Icon name="chevron_right" size={14} />
            </span>
          </button>
          <button className="btn-ghost" onClick={() => onChangeMonth(1)} aria-label="Mes siguiente" style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 8 }}>
            <Icon name="chevron_right" size={14} />
          </button>
        </div>
      </div>

      {/* ==== Weekdays ==== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 6, marginBottom: 6 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 0.8, padding: "4px 0" }}>
            {w}
          </div>
        ))}
      </div>

      {/* ==== Days grid ==== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 6 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
          const isWeekend = (i % 7) >= 5;
          const evs = eventsOf(d);
          const selected = selectedDay === d;
          const hasEvent = evs.length > 0;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick?.(d)}
              style={{
                background: hasEvent ? `${evs[0].color}12` : isWeekend ? "rgba(245,158,11,0.04)" : "var(--card)",
                border: `1px solid ${selected ? accentColor : isToday ? "#f59e0b" : hasEvent ? `${evs[0].color}40` : "var(--border)"}`,
                outline: selected ? `2px solid ${accentColor}` : "none",
                borderRadius: 10,
                padding: compact ? "6px" : "8px",
                textAlign: "left",
                cursor: onDayClick ? "pointer" : "default",
                display: "flex", flexDirection: "column", gap: 4,
                minHeight: compact ? 62 : 92,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => hasEvent && ((e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontFamily: "'DM Mono',monospace",
                  fontWeight: isToday ? 800 : 700,
                  fontSize: 13,
                  color: isToday ? "#f59e0b" : isWeekend ? "#d97706" : "var(--text)",
                }}>
                  {String(d).padStart(2, "0")}
                </span>
                {hasEvent && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, color: evs[0].color, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>
                    {evs[0].icon && <Icon name={evs[0].icon} size={11} color={evs[0].color} />}
                    {evs.length > 1 && `×${evs.length}`}
                  </span>
                )}
              </div>

              {/* ==== Eventos listados ==== */}
              {!compact && hasEvent && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0, overflow: "hidden" }}>
                  {evs.slice(0, 2).map((e, idx) => (
                    <div key={idx} style={{
                      fontSize: 10, fontWeight: 600,
                      background: `${e.color}1a`,
                      color: e.color,
                      padding: "1px 6px",
                      borderRadius: 99,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {e.label}
                    </div>
                  ))}
                  {evs.length > 2 && (
                    <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>
                      +{evs.length - 2}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
