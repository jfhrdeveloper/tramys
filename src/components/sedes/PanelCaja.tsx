"use client";

/* ================= IMPORTS ================= */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icons";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { money, formatFecha } from "@/lib/utils/formatters";
import {
  useData, agregadoCaja, ingresosJaladoresEnRango, derivadosCaja,
  type Sede, type CategoriaFijo, type MovimientoCaja, type TipoMovimiento,
} from "@/components/providers/DataProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";
import { ModalMovimiento } from "@/components/sedes/ModalMovimiento";
import { useConfirm } from "@/components/ui/Feedback";
import { rangoPeriodo, type Periodo } from "@/lib/utils/periodos";

/* ================= TIPOS ================= */
type TipoGasto = "gasto-personal" | "gasto-fijo" | "gasto-manual";
type FiltroGasto = TipoGasto | "todos";

/* Fila virtual derivada (no es un MovimientoCaja real): se inyecta en la tabla
   con badge AUTO + botón "Editar" que redirige al panel donde se origina el
   dato (planilla / jaladores). */
interface RowAuto {
  kind:     "auto";
  id:       string;
  fecha:    string;        // ISO — usamos hastaISO del rango para que ordene al final del periodo
  tipo:     TipoGasto;     // siempre gasto-personal
  monto:    number;
  concepto: string;
  href:     string;        // ruta a la que redirige "Editar"
}
interface RowReal {
  kind: "real";
  m:    MovimientoCaja;
}
type Row = RowAuto | RowReal;

interface Props {
  sede: Sede;
  periodo: Periodo;
}

/* ================= CONSTANTES ================= */
const TIPO_LABEL: Record<TipoGasto, string> = {
  "gasto-personal": "Personal",
  "gasto-fijo":     "Fijos",
  "gasto-manual":   "Manuales",
};
const TIPO_COLOR: Record<TipoGasto, string> = {
  "gasto-personal": "#C41A3A",
  "gasto-fijo":     "#d97706",
  "gasto-manual":   "#6366f1",
};
const TIPO_BG: Record<TipoGasto, string> = {
  "gasto-personal": "rgba(196,26,58,0.08)",
  "gasto-fijo":     "rgba(217,119,6,0.08)",
  "gasto-manual":   "rgba(99,102,241,0.08)",
};
const CAT_LABEL: Record<CategoriaFijo, string> = {
  luz:      "Luz",
  agua:     "Agua",
  internet: "Internet",
  local:    "Local / Alquiler",
  otro:     "Otro",
};

/* ================= COMPONENTE ================= */
export function PanelCaja({ sede, periodo }: Props) {
  const d = useData();
  const router  = useRouter();
  const confirm = useConfirm();
  const [filtro, setFiltro]               = useState<FiltroGasto>("todos");
  const [busqueda, setBusqueda]           = useState<string>("");
  const [editar, setEditar]               = useState<MovimientoCaja | null>(null);
  const [abrirNuevo, setAbrirNuevo]       = useState(false);
  const [tipoNuevo, setTipoNuevo]         = useState<TipoMovimiento>("gasto-personal");

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
  const ingresosTotal = ag.ingresos + ingJal.total;

  /* ====== Auto-derivados: sueldos y comisiones (helper compartido) ======
     `derivadosCaja` también lo consume `CajaBlock` en /sedes para que ambos
     paneles muestren los mismos totales del periodo. */
  const deriv = useMemo(
    () => derivadosCaja(
      { asistencia: d.asistencia, workers: d.workers, jaladores: d.jaladores, ingresosJaladores: d.ingresosJaladores },
      sede.id, rango.desdeISO, rango.hastaISO,
      (iso) => esFeriadoOficial(iso).es,
    ),
    [d.asistencia, d.workers, d.jaladores, d.ingresosJaladores, sede.id, rango.desdeISO, rango.hastaISO],
  );
  const sueldosAuto    = deriv.sueldos;
  const comisionesAuto = deriv.comisiones;

  /* Filas virtuales para la tabla. Solo aparecen si hay monto > 0.
     Labels enfocadas al lenguaje del dueño:
     - "Sueldos por pagar" (trabajadores: cobro quincenal/mensual).
     - "Comisiones del periodo" (jaladores: cobro diario, ya pagado o por pagar). */
  const filasAuto = useMemo<RowAuto[]>(() => {
    const out: RowAuto[] = [];
    if (sueldosAuto > 0) out.push({
      kind: "auto", id: "auto-sueldos", fecha: rango.hastaISO,
      tipo: "gasto-personal", monto: sueldosAuto,
      concepto: "Sueldos por pagar (planilla)",
      href: `/planilla?sede=${sede.id}`,
    });
    if (comisionesAuto > 0) out.push({
      kind: "auto", id: "auto-comisiones", fecha: rango.hastaISO,
      tipo: "gasto-personal", monto: comisionesAuto,
      concepto: "Comisiones del periodo (jaladores)",
      href: `/jaladores?sede=${sede.id}`,
    });
    return out;
  }, [sueldosAuto, comisionesAuto, rango.hastaISO, sede.id]);

  /* Solo gastos: excluye ingresos. */
  const gastosReales: MovimientoCaja[] = useMemo(
    () => ag.movimientos.filter(m => m.tipo !== "ingreso"),
    [ag.movimientos]
  );

  /* Totales: incluyen las filas automáticas dentro de gasto-personal. */
  const personalAuto  = sueldosAuto + comisionesAuto;
  const totalGastos   = ag.gastoPersonal + personalAuto + ag.gastoFijo + ag.gastoManual;
  const balance       = ingresosTotal - totalGastos;

  /* Filas combinadas (auto + reales) ordenadas por fecha desc. Las auto van al
     final del periodo (`rango.hastaISO`) — quedan arriba si la búsqueda y el
     filtro las incluyen. */
  const rowsAll = useMemo<Row[]>(() => {
    const reales: Row[] = gastosReales.map(m => ({ kind: "real", m }));
    const autos:  Row[] = filasAuto.map(a => ({ ...a }));
    return [...autos, ...reales].sort((x, y) => {
      const fx = x.kind === "real" ? x.m.fecha : x.fecha;
      const fy = y.kind === "real" ? y.m.fecha : y.fecha;
      return fy.localeCompare(fx);
    });
  }, [gastosReales, filasAuto]);

  const filtrados = useMemo(() => {
    const base = filtro === "todos" ? rowsAll : rowsAll.filter(r => {
      const t = r.kind === "real" ? r.m.tipo : r.tipo;
      return t === filtro;
    });
    const q = busqueda.trim().toLowerCase();
    if (!q) return base;
    return base.filter(r => {
      const c = r.kind === "real" ? r.m.concepto : r.concepto;
      return c.toLowerCase().includes(q);
    });
  }, [rowsAll, filtro, busqueda]);
  const pag = usePagination(filtrados, 6);

  const countTipo = (t: TipoGasto) =>
    rowsAll.filter(r => (r.kind === "real" ? r.m.tipo : r.tipo) === t).length;
  const counts: Record<TipoGasto, number> = {
    "gasto-personal": countTipo("gasto-personal"),
    "gasto-fijo":     countTipo("gasto-fijo"),
    "gasto-manual":   countTipo("gasto-manual"),
  };
  const totals: Record<TipoGasto, number> = {
    "gasto-personal": ag.gastoPersonal + personalAuto,
    "gasto-fijo":     ag.gastoFijo,
    "gasto-manual":   ag.gastoManual,
  };

  function abrirRegistro(tipo: TipoMovimiento) {
    setTipoNuevo(tipo);
    setAbrirNuevo(true);
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* ====== Header ====== */}
      <div style={{
        padding: "14px 18px", borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="money_bill" size={15} color={sede.color} />
            Caja · {sede.nombre}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>
            {formatFecha(rango.desdeISO)} → {formatFecha(rango.hastaISO)}
          </div>
        </div>

        <div className="hide-mobile" style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-primary"
            style={{ background: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 170 }}
            onClick={() => abrirRegistro("ingreso")}
          >
            <Icon name="plus" size={14} /> Registrar ganancia
          </button>
          <button
            className="btn-primary"
            style={{ background: "#C41A3A", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 170 }}
            onClick={() => abrirRegistro("gasto-personal")}
          >
            <Icon name="plus" size={14} /> Registrar gasto
          </button>
        </div>
      </div>

      {/* ====== Cuadre del periodo: Ganancias − Gastos = Balance ====== */}
      <div style={{
        padding: 14,
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10,
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ padding: "10px 12px", background: "rgba(34,197,94,0.08)", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#16a34a", fontWeight: 700, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: .6, marginBottom: 4 }}>
            Ganancias
          </div>
          <HideableAmount value={money(ingresosTotal)} size={15} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" align="center" />
          {ingJal.total > 0 && (
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", marginTop: 2 }}>
              caja {money(ag.ingresos)} · jaladores {money(ingJal.total)}
            </div>
          )}
        </div>

        <div style={{ padding: "10px 12px", background: "rgba(196,26,58,0.08)", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--brand)", fontWeight: 700, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: .6, marginBottom: 4 }}>
            − Gastos
          </div>
          <HideableAmount value={money(totalGastos)} size={15} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" align="center" />
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", marginTop: 2 }}>
            {rowsAll.length} {rowsAll.length === 1 ? "registro" : "registros"}
            {personalAuto > 0 && ` · auto ${money(personalAuto)}`}
          </div>
        </div>

        <div style={{
          padding: "10px 12px",
          background: balance >= 0 ? "rgba(34,197,94,0.10)" : "rgba(196,26,58,0.10)",
          border: `1px solid ${balance >= 0 ? "rgba(34,197,94,0.25)" : "rgba(196,26,58,0.25)"}`,
          borderRadius: 8, textAlign: "center",
        }}>
          <div style={{
            fontSize: 9, color: balance >= 0 ? "#16a34a" : "var(--brand)", fontWeight: 700,
            fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: .6, marginBottom: 4,
          }}>
            Balance
          </div>
          <HideableAmount
            value={money(balance)} size={15}
            color={balance >= 0 ? "#16a34a" : "var(--brand)"} weight={800}
            fontFamily="'DM Mono',monospace" align="center"
          />
        </div>
      </div>

      {/* ====== Visualización: dona de gastos + barras Ganancia vs Gasto ====== */}
      <div style={{
        padding: 14, borderBottom: "1px solid var(--border)",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16,
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <MiniDona
              total={totalGastos}
              segments={(Object.keys(TIPO_LABEL) as TipoGasto[]).map(t => ({
                color: TIPO_COLOR[t], value: totals[t], label: TIPO_LABEL[t],
              }))}
            />
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
              fontFamily: "'DM Mono',monospace", pointerEvents: "none",
            }}>
              <span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Total</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>
                {moneyShort(totalGastos)}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11, fontFamily: "'DM Mono',monospace" }}>
            {(Object.keys(TIPO_LABEL) as TipoGasto[]).map(t => {
              const pct = totalGastos > 0 ? Math.round((totals[t] / totalGastos) * 100) : 0;
              return (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: TIPO_COLOR[t] }} />
                  <span style={{ color: "var(--text)", fontWeight: 600, minWidth: 60 }}>{TIPO_LABEL[t]}</span>
                  <span style={{ color: TIPO_COLOR[t], fontWeight: 700 }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <MiniBarras ganancia={ingresosTotal} gasto={totalGastos} />
      </div>

      {/* ====== Resumen por tipo de gasto ====== */}
      <div style={{
        padding: 14,
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10,
        borderBottom: "1px solid var(--border)",
      }}>
        {(Object.keys(TIPO_LABEL) as TipoGasto[]).map(t => (
          <div key={t} style={{ padding: "10px 12px", background: TIPO_BG[t], borderRadius: 8, textAlign: "center" }}>
            <div style={{
              fontSize: 9, color: TIPO_COLOR[t], fontWeight: 700,
              fontFamily: "'DM Mono',monospace", textTransform: "uppercase",
              letterSpacing: .6, marginBottom: 4,
            }}>
              − {TIPO_LABEL[t]}
            </div>
            <HideableAmount
              value={money(totals[t])}
              size={15}
              color={TIPO_COLOR[t]}
              weight={800}
              fontFamily="'DM Mono',monospace"
              align="center"
            />
            <div style={{
              fontSize: 9, color: "var(--text-muted)",
              fontFamily: "'DM Mono',monospace", marginTop: 2,
            }}>
              {counts[t]} {counts[t] === 1 ? "registro" : "registros"}
            </div>
          </div>
        ))}
      </div>

      {/* ====== Filtros + buscador ====== */}
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid var(--border)",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {([
            { k: "todos" as const,           label: `Todos (${rowsAll.length})`,               col: sede.color },
            { k: "gasto-personal" as const,  label: `Personal (${counts["gasto-personal"]})`,  col: TIPO_COLOR["gasto-personal"] },
            { k: "gasto-fijo" as const,      label: `Fijos (${counts["gasto-fijo"]})`,         col: TIPO_COLOR["gasto-fijo"] },
            { k: "gasto-manual" as const,    label: `Manuales (${counts["gasto-manual"]})`,    col: TIPO_COLOR["gasto-manual"] },
          ]).map(b => {
            const active = filtro === b.k;
            return (
              <button key={b.k} onClick={() => { setFiltro(b.k); pag.setPage(1); }}
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
        <div style={{ position: "relative", maxWidth: 360 }}>
          <span style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", display: "inline-flex",
          }}>
            <Icon name="search" size={14} />
          </span>
          <input
            type="text"
            placeholder="Buscar por concepto…"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); pag.setPage(1); }}
            className="input-base"
            style={{ paddingLeft: 32, paddingRight: busqueda ? 32 : 10, height: 34 }}
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => { setBusqueda(""); pag.setPage(1); }}
              aria-label="Limpiar búsqueda"
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none", color: "var(--text-muted)",
                cursor: "pointer", padding: 2, display: "inline-flex",
              }}
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ====== Tabla ====== */}
      <div className="table-wrap">
        <table className="tramys-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th style={{ textAlign: "right" }}>Monto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pag.pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "26px 12px", color: "var(--text-muted)", fontSize: 13 }}>
                  {busqueda.trim()
                    ? `Sin coincidencias para "${busqueda.trim()}".`
                    : "No hay gastos en este periodo."}
                </td>
              </tr>
            ) : pag.pageItems.map(row => {
              if (row.kind === "auto") {
                const t = row.tipo;
                return (
                  <tr key={row.id} style={{ background: "rgba(99,102,241,0.04)" }}>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "var(--text-muted)" }}>
                      {formatFecha(row.fecha)}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono',monospace",
                        color: TIPO_COLOR[t], background: `${TIPO_COLOR[t]}18`,
                        padding: "3px 8px", borderRadius: 99,
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: TIPO_COLOR[t] }} />
                        {TIPO_LABEL[t]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{row.concepto}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 800, fontFamily: "'DM Mono',monospace",
                          color: "#6366f1", background: "rgba(99,102,241,0.12)",
                          border: "1px solid rgba(99,102,241,0.3)",
                          padding: "1px 6px", borderRadius: 99, letterSpacing: 0.5,
                        }} title="Costo del personal acumulado en el periodo. El pago real se registra desde Planilla / Jaladores cuando se ejecuta.">
                          AUTO
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "'DM Mono',monospace", fontWeight: 700, color: TIPO_COLOR[t] }}>
                      −{money(row.monto)}
                    </td>
                    <td style={{ width: 80, whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => router.push(row.href)}
                        style={{
                          background: "transparent", border: "1px solid var(--border)",
                          borderRadius: 6, cursor: "pointer", padding: "4px 8px",
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                        }}
                        title="Editar en su panel original"
                      >
                        <Icon name="edit" size={12} /> Editar
                      </button>
                    </td>
                  </tr>
                );
              }

              const m = row.m;
              const t = m.tipo as TipoGasto;
              return (
                <tr key={m.id}>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{formatFecha(m.fecha)}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono',monospace",
                      color: TIPO_COLOR[t], background: `${TIPO_COLOR[t]}18`,
                      padding: "3px 8px", borderRadius: 99,
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: TIPO_COLOR[t] }} />
                      {TIPO_LABEL[t]}
                      {t === "gasto-fijo" && m.categoria ? ` · ${CAT_LABEL[m.categoria]}` : ""}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.concepto}</div>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "'DM Mono',monospace", fontWeight: 700, color: TIPO_COLOR[t] }}>
                    −{money(m.monto)}
                  </td>
                  <td style={{ width: 80, whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => setEditar(m)}
                      style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", padding: "4px 8px", marginRight: 4 }}
                      title="Editar"
                    >
                      <Icon name="edit" size={12} />
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Eliminar gasto",
                          message: "¿Seguro que deseas eliminar este gasto? Esta acción no se puede deshacer.",
                          confirmLabel: "Eliminar",
                          tone: "danger",
                        });
                        if (ok) d.deleteMovimientoCaja(m.id);
                      }}
                      style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", padding: "4px 8px", color: "var(--brand)" }}
                      title="Eliminar"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </td>
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
          label="gastos"
        />
      )}

      {/* ====== Botones mobile ====== */}
      <div className="show-mobile" style={{ padding: 12, borderTop: "1px solid var(--border)", flexDirection: "column", gap: 8 }}>
        <button
          className="btn-primary"
          style={{ background: "#16a34a", width: "100%", minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          onClick={() => abrirRegistro("ingreso")}
        >
          <Icon name="plus" size={14} /> Registrar ganancia
        </button>
        <button
          className="btn-primary"
          style={{ background: "#C41A3A", width: "100%", minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          onClick={() => abrirRegistro("gasto-personal")}
        >
          <Icon name="plus" size={14} /> Registrar gasto
        </button>
      </div>

      {/* ====== Modal de registro / edición ======
           - Editar: respeta el tipo del item (modo "todos" para no esconder
             el botón si el usuario corrige).
           - Crear: limita las opciones del selector según el botón pulsado. */}
      <ModalMovimiento
        open={abrirNuevo || editar !== null}
        sede={sede}
        edit={editar}
        tipoInicial={tipoNuevo}
        modo={editar ? "todos" : (tipoNuevo === "ingreso" ? "ingresos" : "gastos")}
        onClose={() => { setAbrirNuevo(false); setEditar(null); }}
      />
    </div>
  );
}

/* ================= GRÁFICO DONA (gastos por subtipo) ================= */
/* SVG nativo. Cada segmento es un `<circle>` con stroke-dasharray.
   Si todo es 0, mostramos un anillo gris para indicar "sin datos". */
interface MiniDonaProps {
  segments: { color: string; value: number; label: string }[];
  total:    number;
  size?:    number;
}
function MiniDona({ segments, total, size = 96 }: MiniDonaProps) {
  const radius   = size / 2 - 8;
  const circ     = 2 * Math.PI * radius;
  const cx       = size / 2;
  const cy       = size / 2;
  const stroke   = 10;
  let acumulado  = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribución de gastos">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      {total > 0 && segments.map((s, i) => {
        const frac    = s.value / total;
        const dash    = frac * circ;
        const offset  = -acumulado * circ;
        acumulado    += frac;
        return (
          <circle
            key={i} cx={cx} cy={cy} r={radius}
            fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

/* ================= MINI BARRAS (Ganancia vs Gasto) ================= */
function MiniBarras({ ganancia, gasto }: { ganancia: number; gasto: number }) {
  const max = Math.max(ganancia, gasto, 1);
  const filaStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
  const labelStyle: React.CSSProperties = {
    width: 70, fontSize: 10, color: "var(--text-muted)",
    fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 0.5,
  };
  const trackStyle: React.CSSProperties = {
    flex: 1, height: 12, background: "var(--hover)", borderRadius: 99, position: "relative", overflow: "hidden",
  };
  const valStyle: React.CSSProperties = {
    width: 80, textAlign: "right", fontSize: 11, fontFamily: "'DM Mono',monospace", fontWeight: 700,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
      <div style={filaStyle}>
        <span style={labelStyle}>Ganancia</span>
        <div style={trackStyle}>
          <div style={{
            position: "absolute", inset: 0, width: `${(ganancia / max) * 100}%`,
            background: "#16a34a", borderRadius: 99, transition: "width 0.4s ease",
          }} />
        </div>
        <span style={{ ...valStyle, color: "#16a34a" }}>{moneyShort(ganancia)}</span>
      </div>
      <div style={filaStyle}>
        <span style={labelStyle}>Gasto</span>
        <div style={trackStyle}>
          <div style={{
            position: "absolute", inset: 0, width: `${(gasto / max) * 100}%`,
            background: "#C41A3A", borderRadius: 99, transition: "width 0.4s ease",
          }} />
        </div>
        <span style={{ ...valStyle, color: "#C41A3A" }}>{moneyShort(gasto)}</span>
      </div>
    </div>
  );
}

/* Versión compacta del monto para cabezas de barra (S/ 1.2k). */
function moneyShort(n: number): string {
  if (n >= 1000) return `S/ ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `S/ ${n.toFixed(0)}`;
}
