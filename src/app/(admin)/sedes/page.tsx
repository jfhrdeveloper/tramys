"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { Icon } from "@/components/ui/Icons";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { money, formatFecha } from "@/lib/utils/formatters";
import {
  useData, ingresoDia, isWeekendISO, isoToday, agregadoCaja, ingresosJaladoresEnRango,
  type Sede, type MovimientoCaja, type TipoMovimiento, type CategoriaFijo,
} from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { ModalMovimiento } from "@/components/sedes/ModalMovimiento";
import { useConfirm } from "@/components/ui/Feedback";
import { rangoPeriodo, PERIODOS, PERIODO_LABEL, type Periodo } from "@/lib/utils/periodos";

const COLORES_SUG = ["#C41A3A","#1d6fa4","#16a34a","#f59e0b","#6366f1","#8b5cf6","#ec4899","#0ea5e9"];

const CAT_LABEL: Record<CategoriaFijo, string> = {
  luz:      "Luz",
  agua:     "Agua",
  internet: "Internet",
  local:    "Local / Alquiler",
  otro:     "Otro",
};
const TIPO_LABEL: Record<TipoMovimiento, string> = {
  "ingreso":        "Ingreso",
  "gasto-personal": "Gasto personal",
  "gasto-fijo":     "Consumo fijo",
  "gasto-manual":   "Gasto manual",
};
const TIPO_COLOR: Record<TipoMovimiento, string> = {
  "ingreso":        "#16a34a",
  "gasto-personal": "#C41A3A",
  "gasto-fijo":     "#d97706",
  "gasto-manual":   "#6366f1",
};

/* ====== Sueldos calculados desde asistencia × tarifas (no incluye gastos manuales). ====== */
function sueldosSede(
  workers: ReturnType<typeof useData>["workers"],
  asistencia: ReturnType<typeof useData>["asistencia"],
  sedeId: string,
  desde: Date,
  hasta: Date
): number {
  const ws = workers.filter(w => w.sedeId === sedeId && w.activo && w.rol !== "owner");
  let total = 0;
  for (const w of ws) {
    for (const a of asistencia) {
      if (a.workerId !== w.id) continue;
      const dt = new Date(a.fecha);
      if (dt < desde || dt > hasta) continue;
      total += ingresoDia(a, w.tarifas, isWeekendISO(a.fecha), esFeriadoOficial(a.fecha).es);
    }
  }
  return total;
}

/* ================= BLOQUE DE CAJA ================= */
function CajaBlock({ sede, periodo }: { sede: Sede; periodo: Periodo }) {
  const d = useData();
  const rango = useMemo(() => rangoPeriodo(periodo), [periodo]);
  const ag = useMemo(
    () => agregadoCaja({ movimientosCaja: d.movimientosCaja }, sede.id, rango.desdeISO, rango.hastaISO),
    [d.movimientosCaja, sede.id, rango.desdeISO, rango.hastaISO]
  );
  const ingJal = useMemo(
    () => ingresosJaladoresEnRango(
      { ingresosJaladores: d.ingresosJaladores, jaladores: d.jaladores },
      sede.id, rango.desdeISO, rango.hastaISO,
    ),
    [d.ingresosJaladores, d.jaladores, sede.id, rango.desdeISO, rango.hastaISO]
  );
  const sueldos = useMemo(
    () => sueldosSede(d.workers, d.asistencia, sede.id, rango.desde, rango.hasta),
    [d.workers, d.asistencia, sede.id, rango.desde, rango.hasta]
  );
  const ingresosTotal = ag.ingresos + ingJal.total;
  const totalPersonal = sueldos + ag.gastoPersonal;
  const neta = ingresosTotal - totalPersonal - ag.gastoFijo - ag.gastoManual;
  const margen = ingresosTotal > 0 ? Math.round((neta / ingresosTotal) * 100) : 0;

  return (
    <div style={{
      background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10,
      padding: 14, display:"flex", flexDirection:"column", gap: 10,
    }}>
      {/* Filas compactas con pill */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
        <div style={{ padding:"10px 12px", background:"rgba(34,197,94,0.08)", borderRadius: 8, textAlign:"center" }}>
          <div style={{ fontSize: 9, color:"#16a34a", fontWeight:700, fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:.6, marginBottom: 4 }}>Ingresos</div>
          <HideableAmount value={money(ingresosTotal)} size={15} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" align="center" />
          {ingJal.total > 0 && (
            <div style={{ fontSize: 9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginTop: 2 }}>
              caja {money(ag.ingresos)} · jaladores {money(ingJal.total)}
            </div>
          )}
        </div>
        <div style={{ padding:"10px 12px", background:"rgba(196,26,58,0.08)", borderRadius: 8, textAlign:"center" }}>
          <div style={{ fontSize: 9, color:"var(--brand)", fontWeight:700, fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:.6, marginBottom: 4 }}>− Personal</div>
          <HideableAmount value={money(totalPersonal)} size={15} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" align="center" />
          <div style={{ fontSize: 9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginTop: 2 }}>
            sueldos {money(sueldos)}{ag.gastoPersonal > 0 ? ` · extra ${money(ag.gastoPersonal)}` : ""}
          </div>
        </div>
        <div style={{ padding:"10px 12px", background:"rgba(217,119,6,0.08)", borderRadius: 8, textAlign:"center" }}>
          <div style={{ fontSize: 9, color:"#d97706", fontWeight:700, fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:.6, marginBottom: 4 }}>− Fijos</div>
          <HideableAmount value={money(ag.gastoFijo)} size={15} color="#d97706" weight={800} fontFamily="'DM Mono',monospace" align="center" />
          <div style={{ fontSize: 9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginTop: 2 }}>
            luz, agua, internet, local…
          </div>
        </div>
        <div style={{ padding:"10px 12px", background:"rgba(99,102,241,0.08)", borderRadius: 8, textAlign:"center" }}>
          <div style={{ fontSize: 9, color:"#6366f1", fontWeight:700, fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:.6, marginBottom: 4 }}>− Manuales</div>
          <HideableAmount value={money(ag.gastoManual)} size={15} color="#6366f1" weight={800} fontFamily="'DM Mono',monospace" align="center" />
        </div>
      </div>

      {/* Ganancia neta */}
      <div style={{
        padding:"14px 16px", borderRadius: 10,
        background: neta >= 0 ? "rgba(34,197,94,0.10)" : "rgba(196,26,58,0.10)",
        border: `1px solid ${neta >= 0 ? "rgba(34,197,94,0.30)" : "rgba(196,26,58,0.30)"}`,
        display:"flex", alignItems:"center", gap: 12,
      }}>
        <Icon name={neta>=0?"trending_up":"alert_circle"} size={22} color={neta>=0?"#16a34a":"var(--brand)"} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6 }}>
            Ganancia neta · {periodo}
          </div>
          <HideableAmount value={money(neta)} size={22} color={neta>=0?"#16a34a":"var(--brand)"} weight={800} fontFamily="'DM Mono',monospace" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, background: neta>=0?"rgba(34,197,94,0.18)":"rgba(196,26,58,0.18)", color: neta>=0?"#16a34a":"var(--brand)", padding:"4px 10px", borderRadius: 99, fontFamily:"'DM Mono',monospace" }}>
          {margen}%
        </span>
      </div>
    </div>
  );
}

/* ================= LISTA DE MOVIMIENTOS DEL PERIODO ================= */
function MovimientosLista({ sede, periodo, color }: { sede: Sede; periodo: Periodo; color: string }) {
  const d = useData();
  const confirm = useConfirm();
  const rango = useMemo(() => rangoPeriodo(periodo), [periodo]);
  const ag = useMemo(
    () => agregadoCaja({ movimientosCaja: d.movimientosCaja }, sede.id, rango.desdeISO, rango.hastaISO),
    [d.movimientosCaja, sede.id, rango.desdeISO, rango.hastaISO]
  );
  const [filtro, setFiltro] = useState<TipoMovimiento | "todos">("todos");
  const [editar, setEditar] = useState<MovimientoCaja | null>(null);
  const [abrirNuevo, setAbrirNuevo] = useState(false);

  const filtrados = filtro === "todos" ? ag.movimientos : ag.movimientos.filter(m => m.tipo === filtro);
  const pag = usePagination(filtrados, 8);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "14px 18px", borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Movimientos del periodo</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>
            {ag.movimientos.length} registros · {formatFecha(rango.desdeISO)} → {formatFecha(rango.hastaISO)}
          </div>
        </div>
        <button className="btn-primary hide-mobile" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => setAbrirNuevo(true)}>
          <Icon name="plus" size={14} /> Registrar movimiento
        </button>
      </div>

      {/* Filtros por tipo */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {([
          { k: "todos",          label: `Todos (${ag.movimientos.length})`,                                              col: color },
          { k: "ingreso",        label: `Ingresos (${ag.movimientos.filter(m => m.tipo==="ingreso").length})`,           col: TIPO_COLOR.ingreso },
          { k: "gasto-personal", label: `Personal (${ag.movimientos.filter(m => m.tipo==="gasto-personal").length})`,    col: TIPO_COLOR["gasto-personal"] },
          { k: "gasto-fijo",     label: `Fijos (${ag.movimientos.filter(m => m.tipo==="gasto-fijo").length})`,            col: TIPO_COLOR["gasto-fijo"] },
          { k: "gasto-manual",   label: `Manuales (${ag.movimientos.filter(m => m.tipo==="gasto-manual").length})`,       col: TIPO_COLOR["gasto-manual"] },
        ] as const).map(b => {
          const active = filtro === b.k;
          return (
            <button key={b.k} onClick={() => { setFiltro(b.k as typeof filtro); pag.setPage(1); }}
              style={{
                padding: "5px 10px", borderRadius: 99,
                border: active ? `1px solid ${b.col}` : "1px solid var(--border)",
                background: active ? `${b.col}14` : "transparent",
                color: active ? b.col : "var(--text-muted)",
                fontWeight: active ? 700 : 500, fontSize: 11, cursor: "pointer",
                fontFamily: "'DM Mono',monospace",
              }}>
              {b.label}
            </button>
          );
        })}
      </div>

      <div className="table-wrap">
        <table className="tramys-table">
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th style={{ textAlign:"right" }}>Monto</th><th></th></tr></thead>
          <tbody>
            {pag.pageItems.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign:"center", padding: "26px 12px", color: "var(--text-muted)", fontSize: 13 }}>
                No hay movimientos en este periodo.
              </td></tr>
            ) : pag.pageItems.map(m => (
              <tr key={m.id}>
                <td style={{ fontFamily:"'DM Mono',monospace", fontSize: 12 }}>{formatFecha(m.fecha)}</td>
                <td>
                  <span style={{
                    fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono',monospace",
                    color: TIPO_COLOR[m.tipo],
                    background: `${TIPO_COLOR[m.tipo]}18`,
                    padding: "3px 8px", borderRadius: 99,
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: TIPO_COLOR[m.tipo] }} />
                    {TIPO_LABEL[m.tipo]}
                    {m.tipo === "gasto-fijo" && m.categoria ? ` · ${CAT_LABEL[m.categoria]}` : ""}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.concepto}</div>
                  {m.cantidad != null && m.unitario != null && (
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>
                      {m.cantidad} × {money(m.unitario)}
                    </div>
                  )}
                </td>
                <td style={{ textAlign:"right", fontFamily:"'DM Mono',monospace", fontWeight: 700, color: TIPO_COLOR[m.tipo] }}>
                  {m.tipo === "ingreso" ? "+" : "−"}{money(m.monto)}
                </td>
                <td style={{ width: 80, whiteSpace:"nowrap" }}>
                  <button onClick={() => setEditar(m)}
                    style={{ background:"transparent", border:"1px solid var(--border)", borderRadius: 6, cursor:"pointer", padding:"4px 8px", marginRight: 4 }}
                    title="Editar"><Icon name="edit" size={12} /></button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Eliminar movimiento",
                        message: "¿Seguro que deseas eliminar este movimiento? Esta acción no se puede deshacer.",
                        confirmLabel: "Eliminar",
                        tone: "danger",
                      });
                      if (ok) d.deleteMovimientoCaja(m.id);
                    }}
                    style={{ background:"transparent", border:"1px solid var(--border)", borderRadius: 6, cursor:"pointer", padding:"4px 8px", color:"var(--brand)" }}
                    title="Eliminar"><Icon name="trash" size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pag.needsPagination && (
        <Pagination page={pag.page} totalPages={pag.totalPages} total={pag.total}
          rangeStart={pag.rangeStart} rangeEnd={pag.rangeEnd} onChange={pag.setPage} label="movimientos" />
      )}

      {/* Botón mobile */}
      <div className="show-mobile" style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
        <button className="btn-primary" style={{ width: "100%", minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          onClick={() => setAbrirNuevo(true)}>
          <Icon name="plus" size={14} /> Registrar movimiento
        </button>
      </div>

      <ModalMovimiento open={abrirNuevo || editar !== null} sede={sede} edit={editar}
        onClose={() => { setAbrirNuevo(false); setEditar(null); }} />
    </div>
  );
}

/* ================= MODAL EDITAR SEDE ================= */
function ModalEditarSede({
  open, sede, onClose,
}: { open: boolean; sede: Sede | null; onClose: () => void }) {
  const d = useData();
  const [nombre, setNombre]       = useState("");
  const [color, setColor]         = useState("#C41A3A");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono]   = useState("");
  const [horario, setHorario]     = useState("");
  const [encargadoId, setEncargadoId] = useState<string>("");
  const [activa, setActiva]       = useState(true);

  useMemo(() => {
    if (sede) {
      setNombre(sede.nombre);
      setColor(sede.color);
      setDireccion(sede.direccion);
      setTelefono(sede.telefono);
      setHorario(sede.horario);
      setEncargadoId(sede.encargadoId ?? "");
      setActiva(sede.activa);
    }
  }, [sede?.id]); // eslint-disable-line

  if (!sede) return null;

  const candidatos = d.workers.filter(w => w.activo && (w.rol === "encargado" || w.rol === "owner"));
  const actual = sede.encargadoId ? d.workers.find(w => w.id === sede.encargadoId) : null;
  if (actual && !candidatos.some(c => c.id === actual.id)) candidatos.unshift(actual);

  function guardar() {
    d.updateSede(sede!.id, {
      nombre, color, direccion, telefono, horario, activa,
      encargadoId: encargadoId || undefined,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar sede" width={460}>
      <div style={{ display:"flex", flexDirection:"column", gap: 14, marginBottom: 18 }}>
        <div>
          <div className="section-label">Nombre</div>
          <input className="input-base" value={nombre} onChange={e=>setNombre(e.target.value)} />
        </div>
        <div>
          <div className="section-label">Color identificador</div>
          <div style={{ display:"flex", gap: 8, flexWrap:"wrap" }}>
            {COLORES_SUG.map(c => (
              <button key={c} type="button" onClick={()=>setColor(c)}
                style={{
                  width: 34, height: 34, borderRadius: 8, cursor: "pointer",
                  background: c, border: color===c ? "3px solid var(--text)" : "3px solid transparent",
                }}
              />
            ))}
            <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{ width: 50, height: 34, borderRadius: 8, border:"1px solid var(--border)", cursor:"pointer", background:"transparent" }} />
          </div>
        </div>

        <div>
          <div className="section-label">Encargado</div>
          <select className="select-base" style={{ width:"100%" }} value={encargadoId} onChange={e => setEncargadoId(e.target.value)}>
            <option value="">— Sin encargado asignado —</option>
            {candidatos.map(w => (
              <option key={w.id} value={w.id}>
                {w.nombre} {w.apodo ? `“${w.apodo}”` : ""} · {w.rol}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 10, color:"var(--text-muted)", marginTop: 4, fontFamily:"'DM Mono',monospace" }}>
            Solo se listan owners y encargados activos.
          </div>
        </div>

        <div>
          <div className="section-label">Dirección</div>
          <input className="input-base" value={direccion} onChange={e=>setDireccion(e.target.value)} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
          <div>
            <div className="section-label">Teléfono</div>
            <input className="input-base" value={telefono} onChange={e=>setTelefono(e.target.value)} />
          </div>
          <div>
            <div className="section-label">Horario</div>
            <input className="input-base" value={horario} onChange={e=>setHorario(e.target.value)} />
          </div>
        </div>

        <label style={{ display:"flex", alignItems:"center", gap: 8, cursor:"pointer" }}>
          <input type="checkbox" checked={activa} onChange={e=>setActiva(e.target.checked)} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Sede activa</span>
        </label>
      </div>
      <div style={{ display:"flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={guardar}>Guardar</button>
      </div>
    </Modal>
  );
}

/* ================= DETALLE DE SEDE ================= */
function DetalleSede({ sede, onBack, onEditar, mostrarVolver, puedeEditarSede }:
  { sede: Sede; onBack: () => void; onEditar: () => void; mostrarVolver: boolean; puedeEditarSede: boolean }
) {
  const d = useData();
  const [periodo, setPeriodo] = useState<Periodo>("diario");

  const workersSede = d.workers.filter(w => w.sedeId === sede.id && w.activo);
  const hoy = isoToday();
  const asistHoy = d.asistencia.filter(a => a.fecha === hoy && workersSede.some(w => w.id === a.workerId));
  const presentes = asistHoy.filter(a => a.estado === "presente").length;
  const tardanzas = asistHoy.filter(a => a.estado === "tardanza").length;
  const encargado = d.workers.find(w => w.id === sede.encargadoId);

  const pag = usePagination(workersSede);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap: 16 }}>
      {mostrarVolver && (
        <button onClick={onBack} className="btn-outline" style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap: 6 }}>
          <Icon name="arrow_left" size={14} /> Volver a sedes
        </button>
      )}

      {/* Header */}
      <div className="card" style={{ padding: 0, overflow:"hidden" }}>
        <div style={{ height: 6, background: `linear-gradient(90deg, ${sede.color}88, ${sede.color})` }} />
        <div style={{ padding: "18px 20px", display: "flex", gap: 16, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: `${sede.color}18`, border: `1px solid ${sede.color}33`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
            <Icon name="sedes" size={32} color={sede.color} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display:"flex", alignItems:"center", gap: 10, flexWrap:"wrap", marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 22 }}>{sede.nombre}</div>
              <Badge variant={sede.activa ? "activo" : "inactivo"} />
            </div>
            <div style={{ fontSize: 12, color:"var(--text-muted)", display:"flex", gap: 14, flexWrap:"wrap" }}>
              <span><Icon name="map_pin" size={11} /> {sede.direccion}</span>
              <span><Icon name="phone" size={11} /> {sede.telefono}</span>
              <span><Icon name="clock" size={11} /> {sede.horario}</span>
            </div>
          </div>
          {puedeEditarSede && (
            <button className="btn-outline" onClick={onEditar} style={{ display:"flex", alignItems:"center", gap: 6 }}>
              <Icon name="edit" size={13} /> Editar
            </button>
          )}
        </div>

        {/* Resumen rápido */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap: 0, borderTop:"1px solid var(--border)" }}>
          {[
            { icon:"trabajadores", label:"Trabajadores", value: workersSede.filter(w=>w.rol==="trabajador").length, color: sede.color },
            { icon:"check_circle", label:"Presentes hoy", value: presentes, color:"#16a34a" },
            { icon:"alert_circle", label:"Tardanzas hoy", value: tardanzas, color:"#f59e0b" },
            { icon:"user_check", label:"Encargado", value: encargado?.apodo || encargado?.nombre.split(" ")[0] || "—", color:"#6366f1", small:true },
          ].map((k, i, arr) => (
            <div key={k.label} style={{ padding: "12px 16px", borderRight: i<arr.length-1 ? "1px solid var(--border)" : "none", display:"flex", alignItems:"center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: `${k.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
                <Icon name={k.icon} size={14} color={k.color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .5 }}>{k.label}</div>
                <div style={{ fontWeight: 800, fontSize: k.small ? 13 : 18, color: k.color }}>{k.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Caja con toggle */}
      <div className="card">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12, flexWrap:"wrap", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Caja</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
              Ingresos − Personal − Fijos − Manuales = Neta
            </div>
          </div>
          <div style={{ display:"flex", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 8, padding: 3, flexWrap:"wrap" }}>
            {PERIODOS.map(p => (
              <button key={p} onClick={()=>setPeriodo(p)}
                style={{
                  padding: "6px 14px", borderRadius: 6, border: "none", cursor:"pointer",
                  background: periodo===p ? sede.color : "transparent",
                  color: periodo===p ? "#fff" : "var(--text-muted)",
                  fontWeight: periodo===p ? 700 : 500, fontSize: 12,
                  fontFamily:"'Bricolage Grotesque',sans-serif",
                  minHeight: 30,
                }}
              >{PERIODO_LABEL[p]}</button>
            ))}
          </div>
        </div>
        <CajaBlock sede={sede} periodo={periodo} />
      </div>

      {/* Movimientos del periodo */}
      <MovimientosLista sede={sede} periodo={periodo} color={sede.color} />

      {/* Tabla de trabajadores */}
      <div className="card" style={{ padding: 0, overflow:"hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>
          Trabajadores de {sede.nombre} ({workersSede.length})
        </div>
        <div className="table-wrap">
          <table className="tramys-table">
            <thead><tr><th>Trabajador</th><th>Apodo</th><th>Cargo</th><th>Turno</th><th>Estado</th></tr></thead>
            <tbody>
              {pag.pageItems.map(w => {
                const rec = d.asistencia.find(a => a.workerId === w.id && a.fecha === hoy);
                return (
                  <tr key={w.id}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                        <PhotoAvatar src={w.avatarBase64} initials={(w.apodo || w.nombre)[0]} size={28} color={sede.color} />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{w.nombre}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: sede.color, fontWeight: 600 }}>{w.apodo}</td>
                    <td style={{ fontSize: 12, color:"var(--text-muted)" }}>{w.cargo}</td>
                    <td style={{ fontFamily:"'DM Mono',monospace", fontSize: 11, color:"var(--text-muted)" }}>
                      {w.turno.entrada}–{w.turno.salida}
                    </td>
                    <td><Badge variant={(rec?.estado ?? "ausente") as "presente" | "tardanza" | "ausente" | "permiso" | "feriado"} small /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pag.needsPagination && (
          <Pagination
            page={pag.page}
            totalPages={pag.totalPages}
            total={pag.total}
            rangeStart={pag.rangeStart}
            rangeEnd={pag.rangeEnd}
            onChange={pag.setPage}
            label="trabajadores"
          />
        )}
      </div>
    </div>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function SedesPage() {
  const d = useData();
  const { worker: actor, sede: sedeActor } = useSession();
  const isEnc = actor?.rol === "encargado";

  const [selId, setSelId]   = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  /* Encargado: forzar siempre el detalle de su sede asignada. */
  useEffect(() => {
    if (isEnc && sedeActor && selId !== sedeActor.id) setSelId(sedeActor.id);
  }, [isEnc, sedeActor, selId]);

  const pagSedes = usePagination(d.sedes);

  const seleccionada = selId ? d.sedes.find(s => s.id === selId) ?? null : null;

  if (seleccionada) {
    /* Encargado: solo puede ver y registrar movimientos en su propia sede.
       No edita los datos maestros de la sede (eso es del owner). */
    const puedeEditarSede = !isEnc;
    return (
      <>
        <Topbar
          title={isEnc ? "Mi sede" : seleccionada.nombre}
          subtitle={isEnc ? seleccionada.nombre : "Detalle de sede"}
        />
        <main className="page-main">
          <DetalleSede
            sede={seleccionada}
            onBack={()=>setSelId(null)}
            onEditar={()=>setEditId(seleccionada.id)}
            mostrarVolver={!isEnc}
            puedeEditarSede={puedeEditarSede}
          />
        </main>
        {puedeEditarSede && (
          <ModalEditarSede
            open={editId !== null}
            sede={editId ? d.sedes.find(s => s.id === editId) ?? null : null}
            onClose={()=>setEditId(null)}
          />
        )}
      </>
    );
  }

  /* Encargado sin sede asignada → mensaje guía. La grilla solo la ve owner. */
  if (isEnc) {
    return (
      <>
        <Topbar title="Mi sede" subtitle="Sin sede asignada" />
        <main className="page-main">
          <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            No tienes una sede asignada. Pide al owner que te asocie a una sede para ver y registrar movimientos.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Sedes" subtitle={`${d.sedes.filter(s=>s.activa).length} activas`} />
      <main className="page-main">

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {pagSedes.pageItems.map(sede => {
            const workers = d.workers.filter(w => w.sedeId === sede.id && w.activo);
            const hoy = isoToday();
            const asistHoy = d.asistencia.filter(a => a.fecha === hoy && workers.some(w => w.id === a.workerId));
            const presentes = asistHoy.filter(a => a.estado === "presente").length;
            const tardanzas = asistHoy.filter(a => a.estado === "tardanza").length;
            const pct = workers.length ? Math.round(((presentes+tardanzas) / workers.filter(w=>w.rol==="trabajador").length) * 100) : 0;
            const encargado = d.workers.find(w => w.id === sede.encargadoId);

            return (
              <div
                key={sede.id}
                onClick={()=>setSelId(sede.id)}
                className="card"
                style={{
                  padding: 0, overflow:"hidden",
                  cursor:"pointer", transition:"transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div style={{ height: 6, background: `linear-gradient(90deg, ${sede.color}88, ${sede.color})` }} />
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display:"flex", gap: 12, alignItems:"center", marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: `${sede.color}18`, border: `1px solid ${sede.color}33`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon name="sedes" size={22} color={sede.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sede.nombre}</div>
                      <div style={{ fontSize: 11, color:"var(--text-muted)" }}>
                        {encargado ? `Enc. ${encargado.apodo || encargado.nombre}` : "Sin encargado"}
                      </div>
                    </div>
                    <Badge variant={sede.activa ? "activo" : "inactivo"} small />
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                    {[
                      { icon:"trabajadores", color: sede.color, value: workers.filter(w=>w.rol==="trabajador").length, label:"Personas" },
                      { icon:"check_circle", color:"#16a34a",   value: presentes, label:"Presentes" },
                      { icon:"alert_circle", color:"#f59e0b",   value: tardanzas, label:"Tardes" },
                    ].map(k => (
                      <div key={k.label} style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 8, padding: "8px 6px", textAlign:"center" }}>
                        <Icon name={k.icon} size={13} color={k.color} />
                        <div style={{ fontSize: 16, fontWeight: 800, color: k.color, marginTop: 2 }}>{k.value}</div>
                        <div style={{ fontSize: 9, color:"var(--text-muted)" }}>{k.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 11, color:"var(--text-muted)", display:"flex", justifyContent:"space-between", marginBottom: 4 }}>
                    <span>Asistencia hoy</span>
                    <span style={{ fontWeight: 700, color: sede.color, fontFamily:"'DM Mono',monospace" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background:"var(--border)", borderRadius: 99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width: `${pct}%`, background: `linear-gradient(90deg, ${sede.color}88, ${sede.color})`, borderRadius: 99 }} />
                  </div>

                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: sede.color, fontWeight: 700, display:"inline-flex", alignItems:"center", gap: 4 }}>
                      Abrir detalle <Icon name="chevron_right" size={12} color={sede.color} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {pagSedes.needsPagination && (
          <div className="card" style={{ marginTop: 14, padding: 0, overflow:"hidden" }}>
            <Pagination
              page={pagSedes.page}
              totalPages={pagSedes.totalPages}
              total={pagSedes.total}
              rangeStart={pagSedes.rangeStart}
              rangeEnd={pagSedes.rangeEnd}
              onChange={pagSedes.setPage}
              label="sedes"
            />
          </div>
        )}
      </main>

      <ModalEditarSede
        open={editId !== null}
        sede={editId ? d.sedes.find(s => s.id === editId) ?? null : null}
        onClose={()=>setEditId(null)}
      />
    </>
  );
}
