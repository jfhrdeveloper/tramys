"use client";

/* ================= IMPORTS ================= */
import { memo, useMemo, useState } from "react";
import { useClock } from "@/hooks/useClock";
import { useTheme } from "@/components/providers/ThemeProvider";
import { usePrivacy } from "@/components/providers/PrivacyProvider";
import { useData } from "@/components/providers/DataProvider";
import { Icon } from "@/components/ui/Icons";

/* ================= TIPOS ================= */
interface TopbarProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

interface NotifItem {
  text:  string;
  icon:  string;
  color: string;
  leido: boolean;
}

/* ================= RELOJ AISLADO ================= */
/* Consume `useClock` (tick cada 1 s) en un sub-componente dedicado:
   solo este nodo se re-renderiza, no todo el Topbar (theme, notif, privacy).
   `memo` lo aísla de re-renders del padre cuando cambian sus props. */
const TopbarClock = memo(function TopbarClock() {
  const { horaCorta, fechaCorta } = useClock();
  return (
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
  );
});

/* ================= COMPONENTE TOPBAR ================= */
export function Topbar({ title, subtitle }: TopbarProps) {

  /* ====== Estados y hooks ====== */
  const { theme, toggleTheme }    = useTheme();
  const { hidden: privacyHidden, toggle: togglePrivacy } = usePrivacy();
  const [notifOpen, setNotifOpen] = useState(false);
  const d = useData();

  /* Notificaciones derivadas del store. RLS ya filtra por scope (encargado
     ve solo su sede; owner ve todo) — el conteo se respeta automáticamente. */
  const notifs: NotifItem[] = useMemo(() => {
    const out: NotifItem[] = [];

    /* Cumpleaños hoy: eventos tipo "cumpleanos" cuyo mm-dd coincide. */
    const hoy = new Date();
    const mmdd = `${String(hoy.getMonth() + 1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;
    const cumpleHoy = d.eventos.filter(e => e.tipo === "cumpleanos" && e.date.slice(5) === mmdd);
    for (const e of cumpleHoy) {
      out.push({ text: `${e.nombre} cumple años hoy`, icon: "cumpleanos", color: "#f59e0b", leido: false });
    }

    /* Adelantos pendientes de aprobación. */
    const adelPend = d.adelantos.filter(a => a.estado === "pendiente").length;
    if (adelPend > 0) {
      out.push({
        text: `${adelPend} adelanto${adelPend === 1 ? "" : "s"} pendiente${adelPend === 1 ? "" : "s"} de aprobación`,
        icon: "alert_circle", color: "#C41A3A", leido: false,
      });
    }

    /* Permisos pendientes de aprobación. */
    const permPend = d.permisos.filter(p => p.estado === "pendiente").length;
    if (permPend > 0) {
      out.push({
        text: `${permPend} permiso${permPend === 1 ? "" : "s"} pendiente${permPend === 1 ? "" : "s"} de revisar`,
        icon: "calendar", color: "#d97706", leido: false,
      });
    }

    return out;
  }, [d.eventos, d.adelantos, d.permisos]);

  const unread = notifs.filter(n => !n.leido).length;

  return (
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

      {/* ================= LADO IZQUIERDO: reloj + (desktop) título ================= */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>

        {/* ==== Chip fecha + hora (siempre visible) ==== */}
        <TopbarClock />

        {/* ==== Título + subtítulo (solo desktop) ==== */}
        <div className="topbar-left" style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
          <div
            className="topbar-title"
            style={{
              fontWeight: 700,
              fontSize: "clamp(14px, 2.2vw, 17px)",
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
              className="topbar-subtitle"
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

      {/* ================= LADO DERECHO: privacidad + notificaciones + tema ================= */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>

        {/* ==== Botón global de privacidad (ocultar/mostrar montos) ==== */}
        <button
          onClick={togglePrivacy}
          aria-label={privacyHidden ? "Mostrar montos" : "Ocultar montos"}
          title={privacyHidden ? "Mostrar montos" : "Ocultar montos"}
          style={{
            background: privacyHidden ? "rgba(196,26,58,0.1)" : "transparent",
            border: "1px solid var(--border)",
            borderRadius: 8,
            width: 38,
            height: 38,
            cursor: "pointer",
            color: privacyHidden ? "var(--brand)" : "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <Icon name={privacyHidden ? "eye_off" : "eye"} size={16} />
        </button>

        {/* ==== Botón notificaciones + dropdown ==== */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Ver notificaciones"
            style={{
              background: notifOpen ? "rgba(196,26,58,0.1)" : "transparent",
              border: "1px solid var(--border)",
              borderRadius: 8,
              width: 38,
              height: 38,
              cursor: "pointer",
              color: notifOpen ? "var(--brand)" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <Icon name="bell" size={16} />
            {unread > 0 && (
              <span
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
          </button>

          {/* ==== Dropdown alertas ==== */}
          {notifOpen && (
            <div
              className="animate-fade-in"
              style={{
                position: "absolute",
                top: 44,
                right: 0,
                width: "min(88vw, 320px)",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                zIndex: 200,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Alertas · <span style={{ color: "var(--brand)" }}>{unread} nuevas</span>
              </div>
              {notifs.length === 0 ? (
                <div style={{ padding: "20px 16px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                  Sin alertas nuevas
                </div>
              ) : notifs.map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: "11px 16px",
                    borderBottom: i < notifs.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--hover)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  {/* Icono de la notificación */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: n.leido ? "var(--bg)" : `${n.color}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={n.icon} size={14} color={n.leido ? "var(--text-muted)" : n.color} />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: n.leido ? 400 : 600,
                      color: "var(--text)",
                      lineHeight: 1.4,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {n.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ==== Toggle tema claro / oscuro ==== */}
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
        /* En mobile (<768px) ocultamos título/subtítulo; el chip de fecha queda solo a la izquierda */
        @media (max-width: 767px) {
          :global(.topbar-left) {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
