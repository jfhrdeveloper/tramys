/* ================= UTILIDADES TRAMYS ================= */

/* ====== Formateo de moneda PEN ====== */
export function money(n: number): string {
  return `S/ ${Number(n).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ====== Formateo de fechas ======
   Orden canónico del proyecto: día → mes → año.
   Nota: `toLocaleDateString` con estas opciones siempre respeta ese orden,
   independientemente del locale. */
export function formatFecha(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-PE", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function formatFechaLarga(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function fechaCorta(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export function hoy(): string {
  return new Date().toISOString().split("T")[0];
}

export function mesActual(): { mes: number; anio: number } {
  const d = new Date();
  return { mes: d.getMonth() + 1, anio: d.getFullYear() };
}

/* ====== Cálculos de planilla ====== */
export function calcularNeto(
  sueldoBase: number,
  diasTrabajados: number,
  tardanzas: number,
  adelantos: number,
  diasHabiles = 22
): number {
  const sueldoProporcional = (sueldoBase / diasHabiles) * diasTrabajados;
  const descTardanzas      = tardanzas * 22.5;
  return Math.max(0, sueldoProporcional - descTardanzas - adelantos);
}

export function calcularComision(captaciones: number, comisionUnit: number): number {
  return captaciones * comisionUnit;
}

/* ====== Estado de asistencia ====== */
export function estadoAsistencia(horaEntrada: string | null, limite = "08:15"): "presente" | "tardanza" | "ausente" {
  if (!horaEntrada) return "ausente";
  return horaEntrada > limite ? "tardanza" : "presente";
}

/* ====== Iniciales para avatar ====== */
export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map(n => n[0])
    .join("")
    .toUpperCase();
}

/* ====== Color por sede ====== */
export function colorSede(sedeName: string): string {
  return sedeName.toLowerCase().includes("santa") ? "#C41A3A" : "#1d6fa4";
}

/* ====== Color por estado ====== */
export function colorEstado(estado: string): string {
  const map: Record<string, string> = {
    presente: "#22c55e",
    tardanza: "#C41A3A",
    ausente:  "#8b8fa8",
    permiso:  "#f59e0b",
    feriado:  "#6366f1",
  };
  return map[estado] ?? "#8b8fa8";
}
