"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { useData, type Evento, type TipoEvento } from "@/components/providers/DataProvider";
import { feriadosParaAnio } from "@/lib/utils/peruHolidays";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const WEEKDAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

type FiltroTipo = "todos" | "cumpleanos" | "feriados";

function iconTipo(t: TipoEvento): string {
  if (t === "cumpleanos") return "cake";
  if (t === "feriado-nacional") return "calendar";
  if (t === "feriado-empresa") return "sedes";
  return "calendar";
}
function colorTipo(t: TipoEvento): string {
  if (t === "cumpleanos") return "#f59e0b";
  if (t === "feriado-nacional") return "#6366f1";
  if (t === "feriado-empresa") return "var(--brand)";
  return "#8b8fa8";
}
function labelTipo(t: TipoEvento): string {
  if (t === "cumpleanos") return "Cumpleaños";
  if (t === "feriado-nacional") return "Feriado nacional";
  if (t === "feriado-empresa") return "Feriado de empresa";
  return "Evento";
}

/* ================= MODAL DETALLE (solo lectura) ================= */
function ModalDetalleEvento({
  open, onClose, evento,
}: {
  open: boolean; onClose: () => void;
  evento: Evento | null;
}) {
  if (!evento) return null;
  const fechaFmt = new Date(evento.date + "T00:00:00").toLocaleDateString("es-PE", {
    day:"numeric", month:"long", year:"numeric",
  });

  return (
    <Modal open={open} onClose={onClose} title="Detalle de evento" width={420}>
      <div style={{ display:"flex", flexDirection:"column", gap: 14 }}>
        <div style={{
          display:"flex", alignItems:"center", gap: 12, padding: 14,
          borderRadius: 12, background: `${colorTipo(evento.tipo)}10`,
          borderLeft: `4px solid ${colorTipo(evento.tipo)}`,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: `${colorTipo(evento.tipo)}24`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0,
          }}>
            <Icon name={iconTipo(evento.tipo)} size={24} color={colorTipo(evento.tipo)} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: colorTipo(evento.tipo) }}>{evento.nombre}</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{labelTipo(evento.tipo)}</div>
          </div>
        </div>

        <div>
          <div className="section-label">Fecha</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{fechaFmt}</div>
        </div>

        {evento.tipo !== "cumpleanos" && (
          <div>
            <div className="section-label">Día pagado</div>
            <div style={{
              display:"inline-flex", alignItems:"center", gap: 6,
              padding:"4px 10px", borderRadius: 99,
              background: evento.pagado ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.18)",
              color: evento.pagado ? "#16a34a" : "var(--text-muted)",
              fontSize: 12, fontWeight: 700,
            }}>
              {evento.pagado ? "Sí, pagado" : "No pagado"}
            </div>
          </div>
        )}

        {evento.descripcion && (
          <div>
            <div className="section-label">Descripción</div>
            <div style={{ fontSize: 13, color:"var(--text)" }}>{evento.descripcion}</div>
          </div>
        )}
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop: 18 }}>
        <button className="btn-outline" onClick={onClose}>Cerrar</button>
      </div>
    </Modal>
  );
}

/* ================= PÁGINA TRABAJADOR ================= */
export default function MisEventosPage() {
  const d = useData();
  const today = useMemo(() => { const x = new Date(); x.setHours(0,0,0,0); return x; }, []);
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [filtro, setFiltro] = useState<FiltroTipo>("todos");
  const [selIso, setSelIso] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Evento | null>(null);

  /* Feriados oficiales sintetizados como eventos (solo lectura) */
  const feriadosOf: Evento[] = useMemo(() => {
    if (!d.mostrarFeriadosOficiales) return [];
    return feriadosParaAnio(year).map(f => ({
      id: `of_${f.date}`, nombre: f.nombre, date: f.date,
      tipo: "feriado-nacional" as TipoEvento, pagado: true,
    }));
  }, [year, d.mostrarFeriadosOficiales]);

  const todos: Evento[] = useMemo(() => [...d.eventos, ...feriadosOf], [d.eventos, feriadosOf]);

  const filtrados = useMemo(() => {
    return todos.filter(e => {
      if (filtro === "todos") return true;
      if (filtro === "cumpleanos") return e.tipo === "cumpleanos";
      return e.tipo === "feriado-nacional" || e.tipo === "feriado-empresa";
    });
  }, [todos, filtro]);

  /* Próximo evento */
  const proximo = useMemo(() => {
    const hoyIso = today.toISOString().slice(0,10);
    const futuros = filtrados.filter(e => e.date >= hoyIso).sort((a,b) => a.date.localeCompare(b.date));
    return futuros[0];
  }, [filtrados, today]);

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;

  function cambiarMes(dir: -1 | 1) {
    setMonth(m => {
      const nx = m + dir;
      if (nx < 0)  { setYear(y => y - 1); return 11; }
      if (nx > 11) { setYear(y => y + 1); return 0; }
      return nx;
    });
  }

  const eventosDia = selIso ? filtrados.filter(e => e.date === selIso) : [];

  return (
    <>
      <Topbar title="Eventos" subtitle={`${todos.length} eventos en ${year}`} />
      <main className="page-main">

        {/* Próximo evento */}
        {proximo && (
          <div className="card" style={{ marginBottom: 14, borderLeft: `4px solid ${colorTipo(proximo.tipo)}`, display:"flex", alignItems:"center", gap: 14, flexWrap:"wrap" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${colorTipo(proximo.tipo)}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
              <Icon name={iconTipo(proximo.tipo)} size={24} color={colorTipo(proximo.tipo)} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6 }}>Próximo evento</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: colorTipo(proximo.tipo) }}>{proximo.nombre}</div>
              <div style={{ fontSize: 12, color:"var(--text-muted)" }}>
                {new Date(proximo.date + "T00:00:00").toLocaleDateString("es-PE", { day:"numeric", month:"long", year:"numeric" })}
                {" · "}{labelTipo(proximo.tipo)}
              </div>
            </div>
            <button
              className="btn-outline"
              onClick={()=>setDetalle(proximo)}
              style={{ display:"inline-flex", alignItems:"center", gap: 6 }}
            >
              <Icon name="eye" size={12} /> Ver
            </button>
          </div>
        )}

        {/* Filtros + navegación */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12, gap: 10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap: 6, background:"var(--card)", border:"1px solid var(--border)", borderRadius: 10, padding: 3 }}>
            {([
              { id:"todos" as FiltroTipo, label:"Todos",      color:"var(--brand)", icon:"calendar" },
              { id:"cumpleanos" as FiltroTipo, label:"Cumpleaños", color:"#f59e0b", icon:"cake" },
              { id:"feriados" as FiltroTipo, label:"Feriados",  color:"#6366f1", icon:"calendar" },
            ]).map(f => (
              <button key={f.id} onClick={()=>setFiltro(f.id)}
                style={{
                  padding:"7px 14px", borderRadius: 8, border:"none", cursor:"pointer",
                  background: filtro===f.id ? f.color : "transparent",
                  color:      filtro===f.id ? "#fff" : "var(--text-muted)",
                  fontWeight: filtro===f.id ? 700 : 500, fontSize: 12,
                  display:"inline-flex", alignItems:"center", gap: 6,
                }}>
                <Icon name={f.icon} size={12} color={filtro===f.id ? "#fff" : "currentColor"} />
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", gap: 8, alignItems:"center" }}>
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
              {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select className="select-base" value={year} onChange={e=>setYear(Number(e.target.value))}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Calendario */}
        <div className="card" style={{ padding:"14px 18px", marginBottom: 14 }}>
          <div className="cal-grid" style={{ marginBottom: 6 }}>
            {WEEKDAYS.map(w => (
              <div key={w} style={{ textAlign:"center", fontSize: 10, fontWeight: 700, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .8, padding:"4px 0" }}>{w}</div>
            ))}
          </div>
          <div className="cal-grid">
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const evs = filtrados.filter(e => e.date === iso);
              const hasEv = evs.length > 0;
              const isToday = iso === today.toISOString().slice(0,10);
              const isSel = iso === selIso;
              const weekend = ((offset + day - 1) % 7) >= 5;
              return (
                <div key={iso} onClick={()=>setSelIso(iso)}
                  className="cal-cell"
                  style={{
                    background: hasEv ? `${colorTipo(evs[0].tipo)}10` : weekend ? "rgba(245,158,11,0.04)" : "var(--card)",
                    border: `1px solid ${isSel ? "var(--brand)" : isToday ? "#f59e0b" : hasEv ? `${colorTipo(evs[0].tipo)}40` : "var(--border)"}`,
                    outline: isSel ? "2px solid var(--brand)" : "none",
                    cursor:"pointer",
                  }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", minWidth: 0 }}>
                    <span className="cal-day-num" style={{
                      fontWeight: isToday ? 800 : 700,
                      color: isToday ? "#f59e0b" : weekend ? "#d97706" : "var(--text)",
                    }}>{String(day).padStart(2,"0")}</span>
                    {hasEv && <Icon name={iconTipo(evs[0].tipo)} size={12} color={colorTipo(evs[0].tipo)} />}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap: 2, minWidth: 0 }}>
                    {evs.slice(0, 2).map((e, i) => (
                      <div key={i} className="cal-chip" style={{
                        background: `${colorTipo(e.tipo)}1a`, color: colorTipo(e.tipo),
                      }}>
                        <Icon name={iconTipo(e.tipo)} size={9} color={colorTipo(e.tipo)} />
                        <span className="cal-btn-label" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.nombre}</span>
                      </div>
                    ))}
                    {evs.length > 2 && <span className="cal-tag-mini" style={{ fontSize: 9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>+{evs.length - 2}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda — lista cronológica sutil */}
        {(() => {
          const agenda = filtrados
            .filter(e => Number(e.date.slice(0,4)) === year && (Number(e.date.slice(5,7)) - 1) === month)
            .sort((a, b) => a.date.localeCompare(b.date));
          if (agenda.length === 0) return null;
          const hoyIso = today.toISOString().slice(0,10);
          return (
            <div className="card" style={{ marginBottom: 14, padding:"14px 18px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 10, gap: 8, flexWrap:"wrap" }}>
                <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                  <Icon name="calendar" size={14} color="var(--text-muted)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Agenda del mes</div>
                    <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
                      {agenda.length} evento{agenda.length === 1 ? "" : "s"} ordenado{agenda.length === 1 ? "" : "s"} por fecha
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column" }}>
                {agenda.map((e, i) => {
                  const dt = new Date(e.date + "T00:00:00");
                  const dia = String(dt.getDate()).padStart(2,"0");
                  const wkd = dt.toLocaleDateString("es-PE", { weekday:"short" });
                  const isPast   = e.date <  hoyIso;
                  const isToday  = e.date === hoyIso;
                  const sel      = e.date === selIso;
                  return (
                    <button
                      key={e.id}
                      onClick={()=>{ setSelIso(e.date); setDetalle(e); }}
                      style={{
                        display:"flex", alignItems:"center", gap: 12,
                        padding:"9px 6px",
                        borderTop: i === 0 ? "none" : "1px solid var(--border)",
                        background: sel ? "rgba(196,26,58,0.05)" : "transparent",
                        border: "none", cursor:"pointer", textAlign:"left",
                        opacity: isPast ? 0.55 : 1,
                        transition:"background .15s",
                      }}
                      onMouseEnter={ev => { if (!sel) (ev.currentTarget as HTMLElement).style.background = "var(--hover)"; }}
                      onMouseLeave={ev => { if (!sel) (ev.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div style={{
                        width: 42, textAlign:"center", flexShrink: 0,
                        borderRight: `1px solid ${isToday ? "#f59e0b" : "var(--border)"}`,
                        paddingRight: 10,
                      }}>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontWeight: 800, fontSize: 16, color: isToday ? "#f59e0b" : "var(--text)" }}>{dia}</div>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize: 9, color:"var(--text-muted)", textTransform:"uppercase" }}>{wkd.replace(".","")}</div>
                      </div>
                      <div style={{ width: 6, height: 6, borderRadius:"50%", background: colorTipo(e.tipo), flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {e.nombre}
                        </div>
                        <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", display:"flex", alignItems:"center", gap: 6, flexWrap:"wrap" }}>
                          <span style={{ color: colorTipo(e.tipo) }}>{labelTipo(e.tipo)}</span>
                          {isToday && <span style={{ color:"#f59e0b", fontWeight: 800 }}>· HOY</span>}
                        </div>
                      </div>
                      <Icon name={iconTipo(e.tipo)} size={14} color={colorTipo(e.tipo)} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Detalle día */}
        {selIso && (
          <div className="card">
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 12, flexWrap:"wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Eventos del {selIso.slice(8,10)} de {MESES[Number(selIso.slice(5,7))-1]}</div>
                <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{eventosDia.length} registros</div>
              </div>
            </div>

            {eventosDia.length === 0 ? (
              <div style={{ padding:"20px 0", textAlign:"center", color:"var(--text-muted)", fontSize: 13 }}>Sin eventos</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                {eventosDia.map(e => (
                  <button
                    key={e.id}
                    onClick={()=>setDetalle(e)}
                    style={{
                      display:"flex", alignItems:"center", gap: 10,
                      padding: 12, borderRadius: 10,
                      background: "var(--bg)",
                      border: `1px solid ${colorTipo(e.tipo)}33`,
                      borderLeft: `4px solid ${colorTipo(e.tipo)}`,
                      cursor:"pointer", textAlign:"left", width:"100%",
                    }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: `${colorTipo(e.tipo)}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
                      <Icon name={iconTipo(e.tipo)} size={20} color={colorTipo(e.tipo)} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{e.nombre}</div>
                      <div style={{ fontSize: 10, color:"var(--text-muted)" }}>{labelTipo(e.tipo)}</div>
                    </div>
                    <Icon name="chevron_right" size={12} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <ModalDetalleEvento
        open={!!detalle}
        onClose={()=>setDetalle(null)}
        evento={detalle}
      />
    </>
  );
}
