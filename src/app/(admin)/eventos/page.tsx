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

/* ================= MODAL CREAR/EDITAR ================= */
function ModalEvento({
  open, onClose, evento, fechaDefault,
}: {
  open: boolean; onClose: () => void;
  evento: Evento | null;
  fechaDefault?: string;
}) {
  const d = useData();
  const esNuevo = !evento;
  const [nombre, setNombre]   = useState(evento?.nombre ?? "");
  const [fecha, setFecha]     = useState(evento?.date ?? fechaDefault ?? new Date().toISOString().slice(0,10));
  const [tipo, setTipo]       = useState<TipoEvento>(evento?.tipo ?? "otro");
  const [pagado, setPagado]   = useState(evento?.pagado ?? true);
  const [desc, setDesc]       = useState(evento?.descripcion ?? "");

  useMemo(() => {
    setNombre(evento?.nombre ?? "");
    setFecha(evento?.date ?? fechaDefault ?? new Date().toISOString().slice(0,10));
    setTipo(evento?.tipo ?? "otro");
    setPagado(evento?.pagado ?? true);
    setDesc(evento?.descripcion ?? "");
  }, [evento?.id, fechaDefault, open]); // eslint-disable-line

  function guardar() {
    if (!nombre.trim() || !fecha) return;
    const data = {
      nombre: nombre.trim(), date: fecha, tipo,
      ...(tipo === "cumpleanos" ? { } : { pagado }),
      descripcion: desc.trim() || undefined,
    };
    if (evento) d.updateEvento(evento.id, data);
    else d.addEvento(data);
    onClose();
  }

  const TIPOS: TipoEvento[] = ["cumpleanos","feriado-nacional","feriado-empresa","otro"];

  return (
    <Modal open={open} onClose={onClose} title={esNuevo ? "Nuevo evento" : "Editar evento"} width={460}>
      <div style={{ display:"flex", flexDirection:"column", gap: 14, marginBottom: 18 }}>
        <div>
          <div className="section-label">Tipo</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
            {TIPOS.map(t => (
              <button key={t} type="button" onClick={()=>setTipo(t)}
                style={{
                  padding:"9px 8px", borderRadius: 9, cursor:"pointer",
                  border: `2px solid ${tipo===t ? colorTipo(t) : "var(--border)"}`,
                  background: tipo===t ? `${colorTipo(t)}14` : "var(--bg)",
                  color:      tipo===t ? colorTipo(t) : "var(--text-muted)",
                  fontWeight: tipo===t ? 700 : 500, fontSize: 12,
                  display:"inline-flex", alignItems:"center", justifyContent:"center", gap: 6,
                }}>
                <Icon name={iconTipo(t)} size={13} color={tipo===t ? colorTipo(t) : "currentColor"} />
                {labelTipo(t)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="section-label">Nombre</div>
          <input className="input-base" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder={tipo==="cumpleanos"?"Ej: Ana Torres":"Ej: Día del Trabajo"} />
        </div>
        <div>
          <div className="section-label">Fecha</div>
          <input type="date" className="input-base" value={fecha} onChange={e=>setFecha(e.target.value)} />
        </div>
        {tipo !== "cumpleanos" && (
          <div>
            <div className="section-label">¿Es día pagado?</div>
            <div style={{ display:"flex", gap: 8 }}>
              {[true, false].map(v => (
                <button key={String(v)} type="button" onClick={()=>setPagado(v)}
                  style={{
                    flex: 1, padding:"9px 0", borderRadius: 9, cursor:"pointer",
                    border: `2px solid ${pagado===v ? "var(--brand)" : "var(--border)"}`,
                    background: pagado===v ? "rgba(196,26,58,0.08)" : "var(--bg)",
                    color: pagado===v ? "var(--brand)" : "var(--text-muted)",
                    fontWeight: pagado===v ? 700 : 500, fontSize: 12,
                  }}>{v ? "Sí, pagado" : "No pagado"}</button>
              ))}
            </div>
          </div>
        )}
        <div><div className="section-label">Descripción (opcional)</div><textarea className="input-base" rows={2} value={desc} onChange={e=>setDesc(e.target.value)} /></div>
      </div>
      <div style={{ display:"flex", gap: 10 }}>
        {!esNuevo && (
          <button className="btn-ghost" style={{ color:"var(--brand)", border:"1px solid rgba(196,26,58,0.25)" }}
            onClick={()=>{ if (evento) { d.deleteEvento(evento.id); onClose(); } }}>
            Eliminar
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={guardar} disabled={!nombre.trim() || !fecha}>
          {esNuevo ? "Crear" : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}

/* ================= PÁGINA ================= */
export default function EventosPage() {
  const d = useData();
  const today = useMemo(() => { const x = new Date(); x.setHours(0,0,0,0); return x; }, []);
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [filtro, setFiltro] = useState<FiltroTipo>("todos");
  const [selIso, setSelIso] = useState<string | null>(null);
  const [modal, setModal] = useState<{ evento: Evento | null; fecha?: string } | null>(null);

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

  function abrirCrear(iso?: string) { setModal({ evento: null, fecha: iso }); }
  function abrirEditar(id: string) {
    if (id.startsWith("of_")) return;
    const ev = d.eventos.find(e => e.id === id);
    if (ev) setModal({ evento: ev });
  }

  const eventosDia = selIso ? filtrados.filter(e => e.date === selIso) : [];

  return (
    <>
      <Topbar title="Eventos" subtitle={`${todos.length} eventos en ${year}`} />
      <main className="page-main">

        {/* Próximo evento card */}
        {proximo && (
          <div className="card" style={{ marginBottom: 14, borderLeft: `4px solid ${colorTipo(proximo.tipo)}`, display:"flex", alignItems:"center", gap: 14, flexWrap:"wrap" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${colorTipo(proximo.tipo)}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
              <Icon name={iconTipo(proximo.tipo)} size={24} color={colorTipo(proximo.tipo)} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6 }}>Próximo evento</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: colorTipo(proximo.tipo) }}>{proximo.nombre}</div>
              <div style={{ fontSize: 12, color:"var(--text-muted)" }}>
                {new Date(proximo.date + "T00:00:00").toLocaleDateString("es-PE", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
                {" · "}{labelTipo(proximo.tipo)}
              </div>
            </div>
          </div>
        )}

        {/* Filtros + acciones */}
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

          <label style={{ display:"flex", alignItems:"center", gap: 8, cursor:"pointer", fontSize: 12, fontWeight: 600, color:"var(--text-muted)" }}>
            <input type="checkbox" checked={d.mostrarFeriadosOficiales} onChange={e => d.toggleFeriadosOficiales(e.target.checked)} />
            Mostrar feriados oficiales Perú
          </label>

          <div style={{ display:"flex", gap: 8 }}>
            <select className="select-base" value={month} onChange={e=>setMonth(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select className="select-base" value={year} onChange={e=>setYear(Number(e.target.value))}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn-primary" style={{ display:"inline-flex", alignItems:"center", gap: 6 }} onClick={()=>abrirCrear()}>
              <Icon name="plus" size={13} color="#fff" /> Agregar
            </button>
          </div>
        </div>

        {/* Calendario */}
        <div className="card" style={{ padding:"14px 18px", marginBottom: 14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap: 6, marginBottom: 6 }}>
            {WEEKDAYS.map(w => (
              <div key={w} style={{ textAlign:"center", fontSize: 10, fontWeight: 700, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .8, padding:"4px 0" }}>{w}</div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap: 6 }}>
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
                  style={{
                    background: hasEv ? `${colorTipo(evs[0].tipo)}10` : weekend ? "rgba(245,158,11,0.04)" : "var(--card)",
                    border: `1px solid ${isSel ? "var(--brand)" : isToday ? "#f59e0b" : hasEv ? `${colorTipo(evs[0].tipo)}40` : "var(--border)"}`,
                    outline: isSel ? "2px solid var(--brand)" : "none",
                    borderRadius: 10, padding: 7, minHeight: 92,
                    display:"flex", flexDirection:"column", gap: 4,
                    cursor:"pointer",
                  }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{
                      fontFamily:"'DM Mono',monospace", fontWeight: isToday ? 800 : 700, fontSize: 13,
                      color: isToday ? "#f59e0b" : weekend ? "#d97706" : "var(--text)",
                    }}>{String(day).padStart(2,"0")}</span>
                    {hasEv && <Icon name={iconTipo(evs[0].tipo)} size={12} color={colorTipo(evs[0].tipo)} />}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap: 2 }}>
                    {evs.slice(0, 2).map((e, i) => (
                      <div key={i} style={{
                        fontSize: 10, fontWeight: 600,
                        background: `${colorTipo(e.tipo)}1a`, color: colorTipo(e.tipo),
                        padding:"1px 6px", borderRadius: 99,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        display:"flex", alignItems:"center", gap: 3,
                      }}>
                        <Icon name={iconTipo(e.tipo)} size={9} color={colorTipo(e.tipo)} />
                        {e.nombre}
                      </div>
                    ))}
                    {evs.length > 2 && <span style={{ fontSize: 9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>+{evs.length - 2}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalle día */}
        {selIso && (
          <div className="card">
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 12, flexWrap:"wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Eventos del {selIso.slice(8,10)} de {MESES[Number(selIso.slice(5,7))-1]}</div>
                <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{eventosDia.length} registros</div>
              </div>
              <button className="btn-outline" style={{ display:"inline-flex", alignItems:"center", gap: 6 }} onClick={()=>abrirCrear(selIso)}>
                <Icon name="plus" size={12} /> Agregar aquí
              </button>
            </div>

            {eventosDia.length === 0 ? (
              <div style={{ padding:"20px 0", textAlign:"center", color:"var(--text-muted)", fontSize: 13 }}>Sin eventos</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                {eventosDia.map(e => (
                  <div key={e.id} style={{
                    display:"flex", alignItems:"center", gap: 10,
                    padding: 12, borderRadius: 10,
                    background: "var(--bg)",
                    border: `1px solid ${colorTipo(e.tipo)}33`,
                    borderLeft: `4px solid ${colorTipo(e.tipo)}`,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: `${colorTipo(e.tipo)}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
                      <Icon name={iconTipo(e.tipo)} size={20} color={colorTipo(e.tipo)} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{e.nombre}</div>
                      <div style={{ fontSize: 10, color:"var(--text-muted)" }}>{labelTipo(e.tipo)}</div>
                    </div>
                    {!e.id.startsWith("of_") && (
                      <button className="btn-ghost" onClick={()=>abrirEditar(e.id)} style={{ display:"inline-flex", alignItems:"center", gap: 4, fontSize: 11 }}>
                        <Icon name="edit" size={11} /> Editar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {modal && (
        <ModalEvento
          open={true}
          onClose={()=>setModal(null)}
          evento={modal.evento}
          fechaDefault={modal.fecha}
        />
      )}
    </>
  );
}
