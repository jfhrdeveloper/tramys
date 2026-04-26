"use client";

/* ================= IMPERSONATION BANNER ================= */
/* Cuando el owner está "viendo como" otro usuario, se muestra */
/* una franja superior que permite volver a la sesión real.    */

import { useSession } from "@/components/providers/SessionProvider";
import { Icon } from "@/components/ui/Icons";

export function ImpersonationBanner() {
  const { isImpersonating, worker, restoreSession } = useSession();
  if (!isImpersonating || !worker) return null;

  const display = worker.apodo?.trim() || worker.nombre.split(" ")[0];

  return (
    <div
      style={{
        background:  "linear-gradient(90deg, rgba(245,158,11,0.18), rgba(245,158,11,0.08))",
        borderBottom:"1px solid rgba(245,158,11,0.45)",
        padding:     "8px 16px",
        display:     "flex",
        alignItems:  "center",
        gap:         10,
        fontSize:    12,
        color:       "var(--text)",
        fontWeight:  600,
        flexShrink:  0,
      }}
    >
      <Icon name="alert_circle" size={14} color="#d97706" />
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        Estás viendo el panel como <b>{display}</b> ({worker.rol}).
      </span>
      <button
        onClick={restoreSession}
        style={{
          background:    "#d97706",
          color:         "#fff",
          border:        "none",
          padding:       "6px 12px",
          borderRadius:  8,
          fontWeight:    700,
          fontSize:      12,
          cursor:        "pointer",
          fontFamily:    "'Bricolage Grotesque',sans-serif",
          whiteSpace:    "nowrap",
        }}
      >
        Volver a mi sesión
      </button>
    </div>
  );
}
