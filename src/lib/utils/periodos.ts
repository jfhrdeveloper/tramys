/* ================= PERIODOS DE CUADRE ================= */
/* Centraliza la noción de "periodo" usada por el cuadre de caja, jaladores y
   `/caja`. Si necesitas otro periodo, agrégalo aquí y todos los toggles y
   cálculos lo verán automáticamente. */

export type Periodo = "diario" | "semanal" | "quincenal" | "mensual";

export const PERIODOS: Periodo[] = ["diario", "semanal", "quincenal", "mensual"];

export const PERIODO_LABEL: Record<Periodo, string> = {
  diario:    "Diario",
  semanal:   "Semanal",
  quincenal: "Quincenal",
  mensual:   "Mensual",
};

export interface RangoPeriodo {
  desde:    Date;
  hasta:    Date;
  desdeISO: string;
  hastaISO: string;
}

/* ================= RANGO POR PERIODO =================
   - diario     → un día completo (hoy si offset = 0, ayer si -1, etc.).
   - semanal    → 7 días terminando en hoy; offset retrocede 7 días por unidad.
   - quincenal  → quincena calendario completa (1–15 o 16–fin). Offset retrocede
                  quincenas. Si es la quincena en curso, cierra en `hoy` (no en
                  el último día, para no sumar el futuro).
   - mensual    → mes calendario completo. Offset retrocede meses. Cierra en
                  `hoy` solo cuando es el mes actual.

   `offset = 0` = periodo actual, `-1` = anterior, `+1` = siguiente, etc. */
export function rangoPeriodo(periodo: Periodo, offset: number = 0): RangoPeriodo {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  let desde: Date;
  let hasta: Date;

  if (periodo === "diario") {
    desde = new Date(hoy); desde.setDate(hoy.getDate() + offset);
    hasta = new Date(desde);
  } else if (periodo === "semanal") {
    hasta = new Date(hoy); hasta.setDate(hoy.getDate() + offset * 7);
    desde = new Date(hasta); desde.setDate(hasta.getDate() - 6);
  } else if (periodo === "quincenal") {
    const dia       = hoy.getDate();
    const esPrimera = dia <= 15;
    /* Índice global de quincena (year*24 + month*2 + half). */
    const idxActual = hoy.getFullYear() * 24 + hoy.getMonth() * 2 + (esPrimera ? 0 : 1);
    const idx       = idxActual + offset;
    const y         = Math.floor(idx / 24);
    const m         = Math.floor((idx % 24) / 2);
    const half      = idx % 2; // 0 = primera (1-15), 1 = segunda (16-fin)
    desde = new Date(y, m, half === 0 ? 1 : 16);
    hasta = half === 0 ? new Date(y, m, 15) : new Date(y, m + 1, 0);
    if (offset === 0 && hasta > hoy) hasta = hoy;
  } else /* mensual */ {
    const y = hoy.getFullYear();
    const m = hoy.getMonth() + offset;
    desde = new Date(y, m, 1);
    hasta = new Date(y, m + 1, 0);
    if (offset === 0 && hasta > hoy) hasta = hoy;
  }

  const isoOf = (d: Date) => d.toISOString().slice(0, 10);
  return { desde, hasta, desdeISO: isoOf(desde), hastaISO: isoOf(hasta) };
}
