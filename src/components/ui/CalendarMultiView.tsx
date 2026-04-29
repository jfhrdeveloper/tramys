"use client";

/* ================= CALENDAR MULTI-VIEW ================= */
/* Calendario con vistas: semana · mes · año.                 */
/* Cada vista renderiza celdas con eventos y soporta click.   */

import { useMemo } from "react";
import { Icon } from "./Icons";

export interface CalEvent {
  /* ==== Fecha absoluta (ISO yyyy-mm-dd) para máxima precisión ==== */
  date: string;
  label: string;
  color: string;
  icon?: string;
  meta?: string;
}

export type CalView = "semana" | "mes" | "anio";

const WEEKDAYS_SHORT = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const WEEKDAYS_LONG  = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_ABR = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

interface Props {
  view: CalView;
  onChangeView: (v: CalView) => void;

  /* ==== Fecha de anclaje (sirve como foco para la vista actual) ==== */
  anchor: Date;
  onNavigate: (dir: -1 | 1) => void;
  onAnchorChange?: (d: Date) => void;

  events: CalEvent[];
  accentColor?: string;
  title?: string;

  /* ==== Click de celda: recibe la fecha ISO  ==== */
  onDayClick?: (iso: string) => void;
  selectedIso?: string | null;

  /* ==== Click sobre un evento (para editar) ==== */
  onEventClick?: (ev: CalEvent) => void;

  /* ==== Acción al hacer click en el header del día (crear) ==== */
  onCreateAt?: (iso: string) => void;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}

function startOfWeekMon(d: Date): Date {
  const n = new Date(d);
  const day = n.getDay();
  const offset = day === 0 ? 6 : day - 1;
  n.setDate(n.getDate() - offset);
  n.setHours(0,0,0,0);
  return n;
}

/* ================= MAIN COMPONENT ================= */
export function CalendarMultiView({
  view, onChangeView,
  anchor, onNavigate, onAnchorChange,
  events, accentColor = "var(--brand)", title,
  onDayClick, selectedIso,
  onEventClick, onCreateAt,
}: Props) {

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayIso = toISO(today);

  /* ==== Mapa eventos por fecha ==== */
  const eventsByDate = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return m;
  }, [events]);

  /* ==== Subtítulo según vista ==== */
  const subtitulo = useMemo(() => {
    if (view === "anio") return String(anchor.getFullYear());
    if (view === "mes")  return `${MESES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    const inicio = startOfWeekMon(anchor);
    const fin = new Date(inicio); fin.setDate(inicio.getDate()+6);
    const mismoMes = inicio.getMonth() === fin.getMonth();
    return mismoMes
      ? `Semana del ${inicio.getDate()}–${fin.getDate()} ${MESES_ABR[inicio.getMonth()]} ${inicio.getFullYear()}`
      : `${inicio.getDate()} ${MESES_ABR[inicio.getMonth()]} – ${fin.getDate()} ${MESES_ABR[fin.getMonth()]} ${fin.getFullYear()}`;
  }, [view, anchor]);

  return (
    <div className="card" style={{ padding:"16px 18px" }}>
      {/* ==== Header ==== */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:10 }}>
        <div>
          {title && <div style={{ fontWeight:800, fontSize:15 }}>{title}</div>}
          <div style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"capitalize" }}>
            {subtitulo}
          </div>
        </div>

        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {/* ==== Toggle de vistas ==== */}
          <div style={{ display:"flex", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:3 }}>
            {(["semana","mes","anio"] as CalView[]).map(v => (
              <button key={v} onClick={()=>onChangeView(v)} style={{
                padding:"6px 12px", borderRadius:6, border:"none", cursor:"pointer",
                background: view===v ? accentColor : "transparent",
                color:      view===v ? "#fff" : "var(--text-muted)",
                fontWeight: view===v ? 700 : 500, fontSize:12,
                fontFamily:"'Bricolage Grotesque',sans-serif",
                minHeight:30, textTransform:"capitalize",
              }}>
                {v === "anio" ? "Año" : v}
              </button>
            ))}
          </div>

          {/* ==== Navegación ==== */}
          <div style={{ display:"flex", gap:6 }}>
            <button className="btn-ghost" onClick={()=>onNavigate(-1)} style={{ padding:"6px 8px", border:"1px solid var(--border)", borderRadius:8 }} aria-label="Anterior">
              <span style={{ transform:"rotate(180deg)", display:"inline-flex" }}>
                <Icon name="chevron_right" size={14} />
              </span>
            </button>
            <button className="btn-outline" onClick={()=>onAnchorChange?.(new Date())} style={{ padding:"6px 12px", fontSize:12 }}>Hoy</button>
            <button className="btn-ghost" onClick={()=>onNavigate(1)} style={{ padding:"6px 8px", border:"1px solid var(--border)", borderRadius:8 }} aria-label="Siguiente">
              <Icon name="chevron_right" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ==== Contenido según vista ==== */}
      {view === "semana" && (
        <VistaSemana
          anchor={anchor}
          eventsByDate={eventsByDate}
          todayIso={todayIso}
          selectedIso={selectedIso}
          accentColor={accentColor}
          onDayClick={onDayClick}
          onEventClick={onEventClick}
          onCreateAt={onCreateAt}
        />
      )}
      {view === "mes" && (
        <VistaMes
          anchor={anchor}
          eventsByDate={eventsByDate}
          todayIso={todayIso}
          selectedIso={selectedIso}
          accentColor={accentColor}
          onDayClick={onDayClick}
          onEventClick={onEventClick}
        />
      )}
      {view === "anio" && (
        <VistaAnio
          year={anchor.getFullYear()}
          eventsByDate={eventsByDate}
          accentColor={accentColor}
          onMonthClick={(m)=>{
            const d = new Date(anchor.getFullYear(), m, 1);
            onAnchorChange?.(d);
            onChangeView("mes");
          }}
        />
      )}
    </div>
  );
}

/* ================= VISTA SEMANA ================= */
function VistaSemana({
  anchor, eventsByDate, todayIso, selectedIso, accentColor,
  onDayClick, onEventClick, onCreateAt,
}: {
  anchor: Date;
  eventsByDate: Map<string, CalEvent[]>;
  todayIso: string;
  selectedIso?: string | null;
  accentColor: string;
  onDayClick?: (iso: string) => void;
  onEventClick?: (ev: CalEvent) => void;
  onCreateAt?: (iso: string) => void;
}) {
  const inicio = startOfWeekMon(anchor);
  const dias = Array.from({ length:7 }, (_,i) => {
    const d = new Date(inicio); d.setDate(inicio.getDate()+i); return d;
  });

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap:8 }}>
      {dias.map((d, idx) => {
        const iso = toISO(d);
        const evs = eventsByDate.get(iso) ?? [];
        const isToday = iso === todayIso;
        const isSelected = iso === selectedIso;
        const isWeekend = idx >= 5;

        return (
          <div key={iso} style={{
            background: isWeekend ? "rgba(245,158,11,0.05)" : "var(--card)",
            border: `1px solid ${isSelected ? accentColor : isToday ? "#f59e0b" : "var(--border)"}`,
            outline: isSelected ? `2px solid ${accentColor}` : "none",
            borderRadius:10, padding:10, minHeight:180,
            display:"flex", flexDirection:"column", gap:8,
          }}>
            {/* Header día */}
            <button
              type="button"
              onClick={()=>onDayClick?.(iso)}
              style={{
                background:"transparent", border:"none", cursor:"pointer",
                textAlign:"left", padding:0,
                display:"flex", justifyContent:"space-between", alignItems:"baseline",
              }}
            >
              <div>
                <div style={{ fontSize:10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:0.6 }}>
                  {WEEKDAYS_SHORT[idx]}
                </div>
                <div style={{
                  fontFamily:"'DM Mono',monospace", fontWeight:800, fontSize:18,
                  color: isToday ? "#f59e0b" : "var(--text)",
                }}>
                  {String(d.getDate()).padStart(2,"0")}
                </div>
              </div>
              {onCreateAt && (
                <span
                  role="button"
                  onClick={(e)=>{ e.stopPropagation(); onCreateAt(iso); }}
                  style={{
                    width:22, height:22, borderRadius:"50%",
                    background:"var(--bg)", border:"1px dashed var(--border)",
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    color:"var(--text-muted)",
                  }}
                  aria-label="Crear evento"
                >
                  <Icon name="plus" size={11} />
                </span>
              )}
            </button>

            {/* Eventos */}
            <div style={{ display:"flex", flexDirection:"column", gap:4, overflowY:"auto", minHeight:0 }}>
              {evs.length === 0 && (
                <div style={{ fontSize:10, color:"var(--text-muted)", fontStyle:"italic" }}>Sin eventos</div>
              )}
              {evs.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(ev)=>{ ev.stopPropagation(); onEventClick?.(e); }}
                  style={{
                    display:"flex", alignItems:"center", gap:5,
                    background: `${e.color}14`, color: e.color,
                    padding:"4px 6px", borderRadius:6,
                    fontSize:11, fontWeight:600, cursor: onEventClick ? "pointer" : "default",
                    border:`1px solid ${e.color}30`,
                    width:"100%", textAlign:"left",
                  }}
                >
                  {e.icon && <Icon name={e.icon} size={11} color={e.color} />}
                  <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================= VISTA MES ================= */
function VistaMes({
  anchor, eventsByDate, todayIso, selectedIso, accentColor,
  onDayClick, onEventClick,
}: {
  anchor: Date;
  eventsByDate: Map<string, CalEvent[]>;
  todayIso: string;
  selectedIso?: string | null;
  accentColor: string;
  onDayClick?: (iso: string) => void;
  onEventClick?: (ev: CalEvent) => void;
}) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const cells: Array<Date | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_,i) => new Date(year, month, i+1)),
  ];

  return (
    <>
      {/* ==== Weekdays ==== */}
      <div className="cal-grid" style={{ marginBottom:6 }}>
        {WEEKDAYS_SHORT.map(w => (
          <div key={w} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:0.8, padding:"4px 0" }}>
            {w}
          </div>
        ))}
      </div>

      {/* ==== Días ==== */}
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISO(d);
          const evs = eventsByDate.get(iso) ?? [];
          const isToday = iso === todayIso;
          const isSelected = iso === selectedIso;
          const isWeekend = (i % 7) >= 5;
          const hasEvent = evs.length > 0;

          return (
            <div key={iso}
              className="cal-cell"
              style={{
                background: isWeekend ? "rgba(245,158,11,0.04)" : "var(--card)",
                border: `1px solid ${isSelected ? accentColor : isToday ? "#f59e0b" : hasEvent ? `${evs[0].color}40` : "var(--border)"}`,
                outline: isSelected ? `2px solid ${accentColor}` : "none",
                cursor:"pointer",
              }}
              onClick={()=>onDayClick?.(iso)}
            >
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", minWidth: 0 }}>
                <span className="cal-day-num" style={{
                  fontWeight: isToday ? 800 : 700,
                  color: isToday ? "#f59e0b" : isWeekend ? "#d97706" : "var(--text)",
                }}>{String(d.getDate()).padStart(2,"0")}</span>
                {evs.length > 1 && (
                  <span className="cal-tag-mini" style={{ fontSize:9, fontWeight:700, color: evs[0].color, fontFamily:"'DM Mono',monospace" }}>
                    ×{evs.length}
                  </span>
                )}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:2, overflow:"hidden", minWidth: 0 }}>
                {evs.slice(0,3).map((e, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(ev)=>{ ev.stopPropagation(); onEventClick?.(e); }}
                    className="cal-chip"
                    style={{
                      background: `${e.color}1a`,
                      color: e.color,
                      border:"none", cursor: onEventClick ? "pointer" : "default",
                      textAlign:"left",
                    }}>
                    <span className="cal-btn-label">{e.label}</span>
                  </button>
                ))}
                {evs.length > 3 && (
                  <span className="cal-tag-mini" style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
                    +{evs.length - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ================= VISTA AÑO ================= */
function VistaAnio({
  year, eventsByDate, accentColor, onMonthClick,
}: {
  year: number;
  eventsByDate: Map<string, CalEvent[]>;
  accentColor: string;
  onMonthClick: (m: number) => void;
}) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:12 }}>
      {Array.from({ length:12 }, (_,m) => (
        <MiniMes
          key={m}
          year={year}
          month={m}
          eventsByDate={eventsByDate}
          accentColor={accentColor}
          onClick={()=>onMonthClick(m)}
        />
      ))}
    </div>
  );
}

function MiniMes({
  year, month, eventsByDate, accentColor, onClick,
}: {
  year: number; month: number;
  eventsByDate: Map<string, CalEvent[]>;
  accentColor: string;
  onClick: () => void;
}) {
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date(); today.setHours(0,0,0,0);

  const cells: Array<Date | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_,i) => new Date(year, month, i+1)),
  ];

  const countMes = Array.from({ length: daysInMonth }).reduce<number>((acc, _, i) => {
    const iso = toISO(new Date(year, month, i+1));
    return acc + (eventsByDate.get(iso)?.length ?? 0);
  }, 0);

  return (
    <button onClick={onClick} style={{
      background:"var(--card)", border:"1px solid var(--border)", borderRadius:10,
      padding:10, cursor:"pointer", textAlign:"left",
      transition:"all 0.15s",
    }}
      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow="0 4px 14px rgba(0,0,0,0.08)"}
      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow="none"}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
        <span style={{ fontWeight:700, fontSize:13 }}>{MESES[month]}</span>
        {countMes>0 && (
          <span style={{ fontSize:10, fontWeight:700, color:accentColor, background:`${accentColor}18`, borderRadius:99, padding:"1px 7px" }}>
            {countMes}
          </span>
        )}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:2 }}>
        {WEEKDAYS_SHORT.map(w => (
          <div key={w} style={{ fontSize:7, color:"var(--text-muted)", textAlign:"center", fontFamily:"'DM Mono',monospace" }}>
            {w[0]}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISO(d);
          const evs = eventsByDate.get(iso) ?? [];
          const isToday = d.getTime() === today.getTime();
          return (
            <div key={iso} style={{
              aspectRatio:"1",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:9, fontFamily:"'DM Mono',monospace",
              fontWeight: evs.length>0 ? 800 : 500,
              color: evs.length>0 ? "#fff" : isToday ? "#f59e0b" : "var(--text-muted)",
              background: evs.length>0 ? evs[0].color : "transparent",
              borderRadius:4,
              border: isToday && evs.length===0 ? "1px solid #f59e0b" : "none",
            }}>{d.getDate()}</div>
          );
        })}
      </div>
    </button>
  );
}

/* ================= HELPERS DE NAVEGACIÓN ================= */
export function navigateAnchor(anchor: Date, view: CalView, dir: -1 | 1): Date {
  const d = new Date(anchor);
  if (view === "semana") d.setDate(d.getDate() + 7 * dir);
  if (view === "mes")    d.setMonth(d.getMonth() + dir);
  if (view === "anio")   d.setFullYear(d.getFullYear() + dir);
  return d;
}

export { toISO, WEEKDAYS_LONG, MESES, MESES_ABR };
