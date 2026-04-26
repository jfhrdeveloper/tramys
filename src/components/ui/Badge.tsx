/* ================= COMPONENTE BADGE ================= */
/* Estados de asistencia leen la paleta canónica de         */
/* `lib/constants/estados.ts`. El resto (solicitudes, roles, */
/* activo/inactivo, pagado) tiene su propio set local.       */

import { ESTADO_COLOR } from "@/lib/constants/estados";

type BadgeVariant = "presente" | "tardanza" | "ausente" | "permiso" | "feriado"
                  | "pendiente" | "aprobado" | "rechazado" | "pagado"
                  | "owner" | "encargado" | "trabajador"
                  | "activo" | "inactivo";

interface BadgeProps {
  variant:   BadgeVariant;
  small?:    boolean;
  children?: React.ReactNode;
}

interface Style { bg: string; color: string; label: string }

/* ==== Mapa de estilos por variante ==== */
const VARIANTS: Record<BadgeVariant, Style> = {
  /* Estados de asistencia: paleta canónica compartida */
  presente:   { bg: ESTADO_COLOR.presente.bg, color: ESTADO_COLOR.presente.fg, label: ESTADO_COLOR.presente.label },
  tardanza:   { bg: ESTADO_COLOR.tardanza.bg, color: ESTADO_COLOR.tardanza.fg, label: ESTADO_COLOR.tardanza.label },
  ausente:    { bg: ESTADO_COLOR.ausente.bg,  color: ESTADO_COLOR.ausente.fg,  label: ESTADO_COLOR.ausente.label  },
  permiso:    { bg: ESTADO_COLOR.permiso.bg,  color: ESTADO_COLOR.permiso.fg,  label: ESTADO_COLOR.permiso.label  },
  feriado:    { bg: ESTADO_COLOR.feriado.bg,  color: ESTADO_COLOR.feriado.fg,  label: ESTADO_COLOR.feriado.label  },
  /* Solicitudes (adelantos / permisos) */
  pendiente:  { bg: "rgba(245,158,11,0.12)",  color: "#d97706", label: "Pendiente"  },
  aprobado:   { bg: "rgba(34,197,94,0.12)",   color: "#16a34a", label: "Aprobado"   },
  rechazado:  { bg: "rgba(196,26,58,0.10)",   color: "#C41A3A", label: "Rechazado"  },
  pagado:     { bg: "rgba(99,102,241,0.12)",  color: "#6366f1", label: "Pagado"     },
  /* Roles */
  owner:      { bg: "rgba(245,158,11,0.12)",  color: "#d97706", label: "Owner"      },
  encargado:  { bg: "rgba(99,102,241,0.12)",  color: "#6366f1", label: "Encargado"  },
  trabajador: { bg: "rgba(34,197,94,0.12)",   color: "#16a34a", label: "Trabajador" },
  /* Estado de cuenta */
  activo:     { bg: "rgba(34,197,94,0.12)",   color: "#16a34a", label: "Activo"     },
  inactivo:   { bg: "rgba(139,143,168,0.15)", color: "#6b6966", label: "Inactivo"   },
};

export function Badge({ variant, small = false, children }: BadgeProps) {
  const s = VARIANTS[variant];
  return (
    <span
      style={{
        background:  s.bg,
        color:       s.color,
        padding:     small ? "2px 7px" : "3px 9px",
        borderRadius: 99,
        fontSize:    small ? 9 : 10,
        fontWeight:  600,
        whiteSpace:  "nowrap",
      }}
    >
      {children ?? s.label}
    </span>
  );
}
