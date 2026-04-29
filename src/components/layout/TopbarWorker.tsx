"use client";

/* ================= IMPORTS ================= */
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClock } from "@/hooks/useClock";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useSession } from "@/components/providers/SessionProvider";
import { useData } from "@/components/providers/DataProvider";
import { ModalAsistencia } from "@/components/worker/ModalAsistencia";
import { Icon } from "@/components/ui/Icons";

/* ================= TIPOS ================= */
interface Props {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

/* ================= COMPONENTE TOPBAR WORKER ================= */
export function TopbarWorker({ title, subtitle, onMenuToggle }: Props) {

  /* ====== Estados y hooks ====== */
  const { horaCorta, fechaCorta } = useClock();
  const { theme, toggleTheme }    = useTheme();
  const { worker }                = useSession();
  const d                         = useData();
  const pathname                  = usePathname();
  const [showAsist, setShowAsist] = useState(false);

  /* Contador de notificaciones: solicitudes pendientes del propio trabajador. */
  const alertasCount = worker
    ? d.adelantos.filter(a => a.workerId === worker.id && a.estado === "pendiente").length
      + d.permisos.filter(p => p.workerId === worker.id && p.estado === "pendiente").length
    : 0;
  const enAlertas = pathname === "/mis-alertas";

  return (
    <>
      <header
        style={{
          minHeight: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "10px 14px",
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 10,
          gap: 8,
          width: "100%",
          maxWidth: "100%",
        }}
      >

        {/* ====== Reloj — extremo izquierdo ====== */}
        <div
          className="topbar-clock"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 99,
            padding: "6px 12px",
            flexShrink: 0,
          }}
        >
          <div
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }}
            className="animate-pulse-dot"
          />
          <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {fechaCorta}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1, opacity: 0.5 }}>·</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {horaCorta}
          </span>
        </div>

        {/* ====== 1) Botón marcar asistencia (extremo derecho) ====== */}
        <button
          onClick={() => setShowAsist(true)}
          aria-label="Marcar asistencia"
          className="topbar-marcar-btn"
          style={{
            background: "linear-gradient(135deg,#a01530,#C41A3A)",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Bricolage Grotesque',sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 2px 10px rgba(196,26,58,0.3)",
            whiteSpace: "nowrap",
            minHeight: 38,
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <Icon name="timer" size={14} color="#fff" />
          <span className="marcar-label">Marcar</span>
        </button>

        {/* ====== 2) Notificaciones / alertas ====== */}
        <Link
          href="/mis-alertas"
          aria-label={alertasCount > 0 ? `${alertasCount} notificaciones nuevas` : "Ver notificaciones"}
          style={{
            background: enAlertas ? "rgba(196,26,58,0.1)" : "transparent",
            border: "1px solid var(--border)",
            borderRadius: 8,
            width: 38,
            height: 38,
            cursor: "pointer",
            color: enAlertas ? "var(--brand)" : "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            padding: 0,
            flexShrink: 0,
            textDecoration: "none",
          }}
        >
          <Icon name="bell" size={16} color={enAlertas ? "var(--brand)" : "var(--text-muted)"} />
          {alertasCount > 0 && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--brand)",
                border: "2px solid var(--card)",
              }}
            />
          )}
        </Link>

        {/* ====== 3) Toggle tema (día / noche) ====== */}
        <div
          onClick={toggleTheme}
          role="button"
          aria-label="Cambiar tema"
          style={{
            width: 48,
            height: 26,
            borderRadius: 99,
            cursor: "pointer",
            background: theme === "dark" ? "var(--brand)" : "var(--border)",
            position: "relative",
            transition: "background 0.3s",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 3,
              left: theme === "dark" ? 25 : 3,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {theme === "dark"
              ? <Icon name="moon" size={12} color="var(--brand)" />
              : <Icon name="sun"  size={13} color="#f59e0b" />}
          </div>
        </div>

        {/* ====== Estilos responsivos inline ====== */}
        <style jsx>{`
          @media (max-width: 767px) {
            :global(.topbar-marcar-btn .marcar-label) {
              display: none !important;
            }
          }
        `}</style>
      </header>
      <ModalAsistencia open={showAsist} onClose={() => setShowAsist(false)} />
    </>
  );
}
