"use client";

/* ================= IMPORTS ================= */
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { money } from "@/lib/utils/formatters";
import {
  useData, isoToday,
  type Sede, type MovimientoCaja, type TipoMovimiento, type CategoriaFijo,
} from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";

/* ================= CONSTANTES ================= */
const CAT_LABEL: Record<CategoriaFijo, string> = {
  luz:      "Luz",
  agua:     "Agua",
  internet: "Internet",
  local:    "Local / Alquiler",
  otro:     "Otro",
};
/* Etiquetas. Para gastos usamos solo el subtipo (Personal / Fijo / Manual)
   porque ya estamos dentro del bloque "gastos" — repetir "Gasto" en cada uno
   es redundante. */
const TIPO_LABEL: Record<TipoMovimiento, string> = {
  "ingreso":        "Ingreso",
  "gasto-personal": "Personal",
  "gasto-fijo":     "Fijo",
  "gasto-manual":   "Manual",
};
const TIPO_HINT: Record<TipoMovimiento, string> = {
  "ingreso":        "Venta del día",
  "gasto-personal": "Pagos extra al personal",
  "gasto-fijo":     "Luz, agua, internet, local",
  "gasto-manual":   "Otros gastos puntuales",
};
const TIPO_COLOR: Record<TipoMovimiento, string> = {
  "ingreso":        "#16a34a",
  "gasto-personal": "#C41A3A",
  "gasto-fijo":     "#d97706",
  "gasto-manual":   "#6366f1",
};

/* ================= PROPS ================= */
type Modo = "todos" | "gastos" | "ingresos";

interface Props {
  open: boolean;
  sede: Sede;
  edit: MovimientoCaja | null;
  onClose: () => void;
  /* Tipo por defecto al crear (cuando no hay edit). Útil para abrir desde
     "Mis gastos" con el tipo `gasto-personal` ya seleccionado. */
  tipoInicial?: TipoMovimiento;
  /* Filtro de tipos a mostrar en el selector:
     - "todos"     (default): los 4 tipos.
     - "gastos":   solo personal / fijo / manual.
     - "ingresos": solo ingreso. */
  modo?: Modo;
}

/* ================= MODAL REGISTRAR / EDITAR MOVIMIENTO ================= */
export function ModalMovimiento({ open, sede, edit, onClose, tipoInicial, modo = "todos" }: Props) {
  const d = useData();
  const { worker: actor } = useSession();

  /* Tipos visibles en el selector según `modo`. */
  const tiposVisibles: TipoMovimiento[] =
    modo === "ingresos" ? ["ingreso"]
    : modo === "gastos" ? ["gasto-personal", "gasto-fijo", "gasto-manual"]
    : ["ingreso", "gasto-personal", "gasto-fijo", "gasto-manual"];

  const tituloModo =
    modo === "ingresos" ? "ganancia"
    : modo === "gastos" ? "gasto"
    : "movimiento";

  const [tipo, setTipo]                 = useState<TipoMovimiento>(tipoInicial ?? "ingreso");
  const [fecha, setFecha]               = useState<string>(isoToday());
  const [cantidad, setCantidad]         = useState<string>("");
  const [unitario, setUnitario]         = useState<string>("");
  const [monto, setMonto]               = useState<string>("");
  const [montoTouched, setMontoTouched] = useState(false);
  const [categoria, setCategoria]       = useState<CategoriaFijo>("luz");
  const [concepto, setConcepto]         = useState<string>("");

  /* Hidrata estado al abrir / cambiar el item a editar */
  useEffect(() => {
    if (!open) return;
    if (edit) {
      setTipo(edit.tipo);
      setFecha(edit.fecha);
      setCantidad(edit.cantidad != null ? String(edit.cantidad) : "");
      setUnitario(edit.unitario != null ? String(edit.unitario) : "");
      setMonto(String(edit.monto));
      setCategoria(edit.categoria ?? "luz");
      setConcepto(edit.concepto);
      setMontoTouched(true);
    } else {
      setTipo(tipoInicial ?? "ingreso");
      setFecha(isoToday());
      setCantidad("");
      setUnitario("");
      setMonto("");
      setCategoria("luz");
      setConcepto("");
      setMontoTouched(false);
    }
  }, [open, edit, tipoInicial]);

  /* Auto-cálculo monto = cantidad × unitario para ingreso, salvo que el usuario lo edite. */
  const montoAuto = (() => {
    const c = Number(cantidad), u = Number(unitario);
    if (tipo !== "ingreso" || !c || !u) return null;
    return c * u;
  })();
  const montoEfectivo = (() => {
    if (tipo === "ingreso" && !montoTouched && montoAuto != null) return montoAuto;
    return Number(monto) || 0;
  })();

  function guardar() {
    if (!concepto.trim())   { window.alert("Falta describir el concepto."); return; }
    if (montoEfectivo <= 0) { window.alert("El monto debe ser mayor que 0."); return; }
    const base: Omit<MovimientoCaja, "id" | "createdAt"> = {
      sedeId: sede.id,
      fecha,
      tipo,
      monto: montoEfectivo,
      concepto: concepto.trim(),
      registradoPor: actor?.id,
      cantidad:  tipo === "ingreso"     && cantidad ? Number(cantidad) : undefined,
      unitario:  tipo === "ingreso"     && unitario ? Number(unitario) : undefined,
      categoria: tipo === "gasto-fijo"  ? categoria : undefined,
    };
    if (edit) d.updateMovimientoCaja(edit.id, base);
    else      d.addMovimientoCaja(base);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={edit ? `Editar ${tituloModo}` : `Registrar ${tituloModo}`} width={500}>
      <div style={{ display:"flex", flexDirection:"column", gap: 14, marginBottom: 18 }}>

        {/* Selector de tipo: solo se muestra si hay más de un tipo a elegir. */}
        {tiposVisibles.length > 1 && (
          <div>
            <div className="section-label">{modo === "gastos" ? "Tipo de gasto" : "Tipo"}</div>
            <div style={{
              display: "grid",
              gridTemplateColumns: tiposVisibles.length === 3 ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
              gap: 8,
            }}>
              {tiposVisibles.map(t => (
                <button key={t} type="button" onClick={() => setTipo(t)}
                  style={{
                    padding: "10px 12px", borderRadius: 10,
                    border: tipo === t ? `2px solid ${TIPO_COLOR[t]}` : "1px solid var(--border)",
                    background: tipo === t ? `${TIPO_COLOR[t]}14` : "var(--card)",
                    color: tipo === t ? TIPO_COLOR[t] : "var(--text)",
                    fontWeight: tipo === t ? 700 : 500, fontSize: 12, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4, justifyContent: "center",
                    minHeight: 56,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: TIPO_COLOR[t] }} />
                    {TIPO_LABEL[t]}
                  </div>
                  <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textAlign: "center", lineHeight: 1.2 }}>
                    {TIPO_HINT[t]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div className="section-label">Fecha</div>
            <input type="date" className="input-base" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          {tipo === "gasto-fijo" && (
            <div>
              <div className="section-label">Categoría</div>
              <select className="select-base" value={categoria} onChange={e => setCategoria(e.target.value as CategoriaFijo)}>
                {(Object.keys(CAT_LABEL) as CategoriaFijo[]).map(c => (
                  <option key={c} value={c}>{CAT_LABEL[c]}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {tipo === "ingreso" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div className="section-label">Cantidad (clientes / unidades)</div>
              <input type="number" min={0} className="input-base" value={cantidad}
                onChange={e => setCantidad(e.target.value)} placeholder="ej. 30" />
            </div>
            <div>
              <div className="section-label">Unitario (S/.)</div>
              <input type="number" min={0} step="0.01" className="input-base" value={unitario}
                onChange={e => setUnitario(e.target.value)} placeholder="ej. 60" />
            </div>
          </div>
        )}

        <div>
          <div className="section-label">
            Monto (S/.)
            {tipo === "ingreso" && montoAuto != null && !montoTouched && (
              <span style={{ marginLeft: 6, fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#16a34a" }}>
                = {money(montoAuto)} (auto)
              </span>
            )}
          </div>
          <input type="number" min={0} step="0.01" className="input-base"
            value={tipo === "ingreso" && !montoTouched && montoAuto != null ? String(montoAuto) : monto}
            onChange={e => { setMonto(e.target.value); setMontoTouched(true); }} />
        </div>

        <div>
          <div className="section-label">Concepto</div>
          <input className="input-base" value={concepto} onChange={e => setConcepto(e.target.value)}
            placeholder={
              tipo === "ingreso"          ? "Ventas del día"
              : tipo === "gasto-fijo"     ? "Recibo de luz"
              : tipo === "gasto-personal" ? "Pago extra al personal"
              :                             "Detalle del gasto"
            }
          />
        </div>

      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={guardar}>
          {edit ? "Guardar cambios" : `Registrar ${tituloModo}`}
        </button>
      </div>
    </Modal>
  );
}
