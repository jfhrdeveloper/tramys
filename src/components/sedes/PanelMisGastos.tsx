"use client";

/* ================= IMPORTS ================= */
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { money, formatFecha } from "@/lib/utils/formatters";
import {
  useData, agregadoCaja, ingresosJaladoresEnRango,
  type Sede, type CategoriaFijo, type MovimientoCaja, type TipoMovimiento,
} from "@/components/providers/DataProvider";
import { ModalMovimiento } from "@/components/sedes/ModalMovimiento";
import { rangoPeriodo, type Periodo } from "@/lib/utils/periodos";

/* ================= TIPOS ================= */
type TipoGasto = "gasto-personal" | "gasto-fijo" | "gasto-manual";
type FiltroGasto = TipoGasto | "todos";

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
export function PanelMisGastos({ sede, periodo }: Props) {
  const d = useData();
  const [filtro, setFiltro]               = useState<FiltroGasto>("todos");
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

  /* Solo gastos: excluye ingresos. */
  const gastos: MovimientoCaja[] = useMemo(
    () => ag.movimientos.filter(m => m.tipo !== "ingreso"),
    [ag.movimientos]
  );
  const totalGastos = ag.gastoPersonal + ag.gastoFijo + ag.gastoManual;
  const balance     = ingresosTotal - totalGastos;

  const filtrados = filtro === "todos" ? gastos : gastos.filter(m => m.tipo === filtro);
  const pag = usePagination(filtrados, 6);

  const counts: Record<TipoGasto, number> = {
    "gasto-personal": gastos.filter(m => m.tipo === "gasto-personal").length,
    "gasto-fijo":     gastos.filter(m => m.tipo === "gasto-fijo").length,
    "gasto-manual":   gastos.filter(m => m.tipo === "gasto-manual").length,
  };
  const totals: Record<TipoGasto, number> = {
    "gasto-personal": ag.gastoPersonal,
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
            Mis gastos · {sede.nombre}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>
            {formatFecha(rango.desdeISO)} → {formatFecha(rango.hastaISO)}
          </div>
        </div>

        <div className="hide-mobile" style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#16a34a", borderColor: "rgba(34,197,94,0.4)" }}
            onClick={() => abrirRegistro("ingreso")}
          >
            <Icon name="plus" size={14} color="#16a34a" /> Registrar ganancia
          </button>
          <button
            className="btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
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
            {gastos.length} {gastos.length === 1 ? "registro" : "registros"}
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

      {/* ====== Filtros ====== */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {([
          { k: "todos" as const,           label: `Todos (${gastos.length})`,                col: sede.color },
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
                  No hay gastos en este periodo.
                </td>
              </tr>
            ) : pag.pageItems.map(m => {
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
                      onClick={() => { if (window.confirm("¿Eliminar este gasto?")) d.deleteMovimientoCaja(m.id); }}
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
      <div className="show-mobile" style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          className="btn-outline"
          style={{ width: "100%", minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#16a34a", borderColor: "rgba(34,197,94,0.4)" }}
          onClick={() => abrirRegistro("ingreso")}
        >
          <Icon name="plus" size={14} color="#16a34a" /> Registrar ganancia
        </button>
        <button
          className="btn-primary"
          style={{ width: "100%", minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
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
