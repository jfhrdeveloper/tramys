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
   - diario     → solo hoy.
   - semanal    → últimos 7 días (hoy y los 6 anteriores).
   - quincenal  → quincena calendario en curso (1–15 si hoy ≤ 15, sino 16–fin de mes,
                  hasta hoy).
   - mensual    → del día 1 del mes en curso hasta hoy. */
export function rangoPeriodo(periodo: Periodo): RangoPeriodo {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  let desde = hoy;

  if (periodo === "semanal") {
    const d = new Date(hoy); d.setDate(hoy.getDate() - 6);
    desde = d;
  } else if (periodo === "quincenal") {
    const dia = hoy.getDate();
    if (dia <= 15) desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    else           desde = new Date(hoy.getFullYear(), hoy.getMonth(), 16);
  } else if (periodo === "mensual") {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  const isoOf = (d: Date) => d.toISOString().slice(0, 10);
  return { desde, hasta: hoy, desdeISO: isoOf(desde), hastaISO: isoOf(hoy) };
}
