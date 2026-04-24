/* ================= FERIADOS OFICIALES PERÚ ================= */
/* Solo los fijos. Los movibles (Jueves/Viernes Santo) se omiten.  */

export interface FeriadoOficial {
  nombre: string;
  month: number;  // 1-12
  day:    number;
}

export const FERIADOS_PE_FIJOS: FeriadoOficial[] = [
  { nombre:"Año Nuevo",                    month: 1,  day: 1 },
  { nombre:"Día del Trabajo",              month: 5,  day: 1 },
  { nombre:"San Pedro y San Pablo",        month: 6,  day: 29 },
  { nombre:"Día de la Independencia",      month: 7,  day: 28 },
  { nombre:"Día de las Fuerzas Armadas",   month: 7,  day: 29 },
  { nombre:"Batalla de Junín",             month: 8,  day: 6 },
  { nombre:"Santa Rosa de Lima",           month: 8,  day: 30 },
  { nombre:"Combate de Angamos",           month: 10, day: 8 },
  { nombre:"Todos los Santos",             month: 11, day: 1 },
  { nombre:"Batalla de Ayacucho",          month: 12, day: 9 },
  { nombre:"Inmaculada Concepción",        month: 12, day: 8 },
  { nombre:"Navidad",                      month: 12, day: 25 },
];

export function feriadosParaAnio(anio: number): { date: string; nombre: string }[] {
  return FERIADOS_PE_FIJOS.map(f => ({
    date: `${anio}-${String(f.month).padStart(2,"0")}-${String(f.day).padStart(2,"0")}`,
    nombre: f.nombre,
  }));
}

export function esFeriadoOficial(iso: string): { es: boolean; nombre?: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const hit = FERIADOS_PE_FIJOS.find(f => f.month === m && f.day === d);
  return hit ? { es: true, nombre: hit.nombre } : { es: false };
}
