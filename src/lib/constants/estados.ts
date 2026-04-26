/* ================= PALETA CANÓNICA DE ESTADOS ================= */
/* Fuente única de verdad para los colores de estado de asistencia. */
/* Cualquier vista (Badge, calendarios, listados, modales) debe     */
/* importar de aquí en lugar de redefinir su propio mapa.            */

import type { EstadoAsist } from "@/components/providers/DataProvider";

export interface EstadoStyle {
  bg:    string;  /* fondo translúcido */
  fg:    string;  /* texto / chevron */
  dot:   string;  /* dot puro (timeline, calendarios) */
  label: string;
}

export const ESTADO_COLOR: Record<EstadoAsist, EstadoStyle> = {
  presente: { bg: "rgba(34,197,94,0.12)",   fg: "#16a34a", dot: "#16a34a", label: "Presente" },
  tardanza: { bg: "rgba(245,158,11,0.12)",  fg: "#d97706", dot: "#f59e0b", label: "Tardanza" },
  ausente:  { bg: "rgba(139,143,168,0.15)", fg: "#6b6966", dot: "#8b8fa8", label: "Ausente"  },
  permiso:  { bg: "rgba(217,119,6,0.12)",   fg: "#d97706", dot: "#d97706", label: "Permiso"  },
  feriado:  { bg: "rgba(99,102,241,0.12)",  fg: "#6366f1", dot: "#6366f1", label: "Feriado"  },
};
