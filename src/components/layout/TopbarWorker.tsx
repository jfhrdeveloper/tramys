"use client";

/* ================= IMPORTS ================= */
import { useState } from "react";
import { useClock } from "@/hooks/useClock";
import { useTheme } from "@/components/providers/ThemeProvider";
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
  const [showAsist, setShowAsist] = useState(false);

  return (
    <>
      <header
        style={{
          minHeight: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 10,
          gap: 10,
          width: "100%",
          maxWidth: "100%",
        }}
      >

        {/* ====== Lado izquierdo: título (solo visible ≥ md) ====== */}
        <div
          className="topbar-left"
          style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}
        >
          {/* ==== Título + subtítulo — ocultos en mobile ==== */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "clamp(14px, 2.2vw, 16px)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.15,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontFamily: "'DM Mono',monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginTop: 2,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* ====== Lado derecho ====== */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>

          {/* ==== Reloj (fecha + hora juntas) ==== */}
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
            <span
              style={{
                fontFamily: "'DM Mono',monospace",
                fontWeight: 600,
                fontSize: 12,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {fechaCorta}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1, opacity: 0.5 }}>·</span>
            <span
              style={{
                fontFamily: "'DM Mono',monospace",
                fontWeight: 600,
                fontSize: 12,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {horaCorta}
            </span>
          </div>

          {/* ==== Botón marcar asistencia ==== */}
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
            }}
          >
            <Icon name="timer" size={14} color="#fff" />
            <span className="marcar-label">Marcar</span>
          </button>

          {/* ==== Toggle tema ==== */}
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
        </div>

        {/* ====== Estilos responsivos inline ====== */}
        <style jsx>{`
          /* En mobile ocultamos título y subtítulo */
          @media (max-width: 767px) {
            :global(.topbar-left) {
              display: none !important;
            }
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
