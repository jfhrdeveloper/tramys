"use client";

/* ================= IMPORTS ================= */
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Feedback";
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
/* Subtipos de gasto-personal. No tocan DB: se prefijan al `concepto`
   con formato `"<Subtipo> · <descripción>"` y se detectan al editar.
   Mantener "Otro" como salida para descripciones libres. */
const SUBTIPO_PERSONAL = ["Bono", "Adelanto extra", "Propina", "Comida", "Otro"] as const;
type SubtipoPersonal = typeof SUBTIPO_PERSONAL[number];
const SUBTIPO_SEP = " · ";
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
     "Caja" con el tipo `gasto-personal` ya seleccionado. */
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
  const toast = useToast();

  /* Tipos visibles en el selector según `modo`. */
  const tiposVisibles: TipoMovimiento[] =
    modo === "ingresos" ? ["ingreso"]
    : modo === "gastos" ? ["gasto-personal", "gasto-fijo", "gasto-manual"]
    : ["ingreso", "gasto-personal", "gasto-fijo", "gasto-manual"];

  const tituloModo =
    modo === "ingresos" ? "ganancia"
    : modo === "gastos" ? "gasto"
    : "movimiento";

  const [tipo, setTipo]               = useState<TipoMovimiento>(tipoInicial ?? "ingreso");
  const [fecha, setFecha]             = useState<string>(isoToday());
  const [monto, setMonto]             = useState<string>("");
  const [categoria, setCategoria]     = useState<CategoriaFijo>("luz");
  const [subPersonal, setSubPersonal] = useState<SubtipoPersonal>("Bono");
  const [concepto, setConcepto]       = useState<string>("");

  /* Detecta el subtipo embebido en `concepto` al editar (formato "<Subtipo> · resto"). */
  function parseConceptoPersonal(c: string): { sub: SubtipoPersonal; rest: string } {
    const idx = c.indexOf(SUBTIPO_SEP);
    if (idx > 0) {
      const head = c.slice(0, idx) as SubtipoPersonal;
      if ((SUBTIPO_PERSONAL as readonly string[]).includes(head)) {
        return { sub: head, rest: c.slice(idx + SUBTIPO_SEP.length) };
      }
    }
    return { sub: "Otro", rest: c };
  }

  /* Hidrata estado al abrir / cambiar el item a editar */
  useEffect(() => {
    if (!open) return;
    if (edit) {
      setTipo(edit.tipo);
      setFecha(edit.fecha);
      setMonto(String(edit.monto));
      setCategoria(edit.categoria ?? "luz");
      if (edit.tipo === "gasto-personal") {
        const { sub, rest } = parseConceptoPersonal(edit.concepto);
        setSubPersonal(sub);
        setConcepto(rest);
      } else if (edit.tipo === "gasto-fijo" && edit.categoria && edit.categoria !== "otro"
                 && edit.concepto === CAT_LABEL[edit.categoria]) {
        /* Concepto canónico inferido de la categoría → no mostrarlo como texto. */
        setSubPersonal("Bono");
        setConcepto("");
      } else {
        setSubPersonal("Bono");
        setConcepto(edit.concepto);
      }
    } else {
      setTipo(tipoInicial ?? "ingreso");
      setFecha(isoToday());
      setMonto("");
      setCategoria("luz");
      setSubPersonal("Bono");
      setConcepto("");
    }
  }, [open, edit, tipoInicial]);

  /* gasto-fijo con categoría != "otro" no necesita concepto manual:
     usamos la etiqueta de la categoría como concepto canónico. */
  const conceptoOculto = tipo === "gasto-fijo" && categoria !== "otro";
  const montoEfectivo  = Number(monto) || 0;

  function guardar() {
    if (montoEfectivo <= 0) { toast("El monto debe ser mayor que 0.", "warning"); return; }
    if (!conceptoOculto && !concepto.trim()) {
      toast("Falta describir el concepto.", "warning"); return;
    }
    /* Concepto final según el caso:
       - gasto-fijo con categoría fija → label de la categoría.
       - gasto-personal → "<Subtipo> · <descripción>".
       - resto → texto libre. */
    const conceptoFinal =
      conceptoOculto
        ? CAT_LABEL[categoria]
        : tipo === "gasto-personal"
          ? `${subPersonal}${SUBTIPO_SEP}${concepto.trim()}`
          : concepto.trim();
    const base: Omit<MovimientoCaja, "id" | "createdAt"> = {
      sedeId: sede.id,
      fecha,
      tipo,
      monto: montoEfectivo,
      concepto: conceptoFinal,
      registradoPor: actor?.id,
      /* `cantidad` y `unitario` se omiten: el modal ya no los pide; los registros
         antiguos que los traían en DB siguen existiendo pero no se reescriben. */
      categoria: tipo === "gasto-fijo" ? categoria : undefined,
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
                  <span style={{ fontSize: 9, color: tipo === t ? TIPO_COLOR[t] : "var(--text)", opacity: tipo === t ? 0.85 : 0.62, fontFamily: "'DM Mono',monospace", textAlign: "center", lineHeight: 1.2 }}>
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
          {tipo === "gasto-personal" && (
            <div>
              <div className="section-label">Subtipo</div>
              <select className="select-base" value={subPersonal}
                onChange={e => setSubPersonal(e.target.value as SubtipoPersonal)}>
                {SUBTIPO_PERSONAL.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>

        <div>
          <div className="section-label">Monto (S/.)</div>
          <input type="number" min={0} step="0.01" className="input-base"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {!conceptoOculto && (
          <div>
            <div className="section-label">Concepto</div>
            <input className="input-base" value={concepto} onChange={e => setConcepto(e.target.value)}
              placeholder={
                tipo === "ingreso"          ? "Ventas del día"
                : tipo === "gasto-fijo"     ? "Detalle del gasto"
                : tipo === "gasto-personal" ? "Pago extra al personal"
                :                             "Detalle del gasto"
              }
            />
          </div>
        )}

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
