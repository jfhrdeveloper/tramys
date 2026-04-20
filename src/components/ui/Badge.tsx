/* ================= COMPONENTE BADGE ================= */
type BadgeVariant = "presente" | "tardanza" | "ausente" | "permiso" | "feriado"
                  | "pendiente" | "aprobado" | "rechazado" | "pagado"
                  | "owner" | "encargado" | "trabajador"
                  | "activo" | "inactivo";

interface BadgeProps {
  variant:   BadgeVariant;
  small?:    boolean;
  children?: React.ReactNode;
}

/* ==== Mapa de estilos por variante ==== */
const VARIANTS: Record<BadgeVariant, { bg: string; color: string; label: string }> = {
  presente:   { bg: "rgba(34,197,94,0.12)",   color: "#16a34a", label: "Presente"   },
  tardanza:   { bg: "rgba(196,26,58,0.12)",   color: "#C41A3A", label: "Tardanza"   },
  ausente:    { bg: "rgba(139,139,168,0.12)", color: "#8b8fa8", label: "Ausente"    },
  permiso:    { bg: "rgba(245,158,11,0.12)",  color: "#d97706", label: "Permiso"    },
  feriado:    { bg: "rgba(99,102,241,0.12)",  color: "#6366f1", label: "Feriado"    },
  pendiente:  { bg: "rgba(245,158,11,0.12)",  color: "#d97706", label: "Pendiente"  },
  aprobado:   { bg: "rgba(34,197,94,0.12)",   color: "#16a34a", label: "Aprobado"   },
  rechazado:  { bg: "rgba(139,139,168,0.12)", color: "#8b8fa8", label: "Rechazado"  },
  pagado:     { bg: "rgba(34,197,94,0.12)",   color: "#16a34a", label: "Pagado"     },
  owner:      { bg: "rgba(245,158,11,0.12)",  color: "#d97706", label: "Owner"      },
  encargado:  { bg: "rgba(99,102,241,0.12)",  color: "#6366f1", label: "Encargado"  },
  trabajador: { bg: "rgba(34,197,94,0.12)",   color: "#16a34a", label: "Trabajador" },
  activo:     { bg: "rgba(34,197,94,0.12)",   color: "#16a34a", label: "Activo"     },
  inactivo:   { bg: "rgba(139,139,168,0.12)", color: "#8b8fa8", label: "Inactivo"   },
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
