"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { useData } from "@/components/providers/DataProvider";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { Icon } from "@/components/ui/Icons";

interface Props {
  collapsed: boolean;
  onCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV = [
  { href: "/mi-panel",     label: "Mi Panel",   icon: "home" },
  { href: "/mi-asistencia",label: "Asistencia", icon: "clock" },
  { href: "/mi-sueldo",    label: "Mi Sueldo",  icon: "sueldo" },
  { href: "/mis-adelantos",label: "Adelantos",  icon: "hand_coin" },
  { href: "/mis-permisos", label: "Permisos",   icon: "file_check" },
  { href: "/mis-alertas",  label: "Alertas",    icon: "bell" },
];

export function SidebarWorker({ collapsed, onCollapse, mobileOpen, onMobileClose }: Props) {
  const { worker, sede, signOut } = useSession();
  const d = useData();
  const pathname = usePathname();

  /* Cuántas alertas no leídas mostrar como badge dinámico */
  const alertasCount = worker
    ? d.adelantos.filter(a => a.workerId === worker.id && a.estado === "pendiente").length
      + d.permisos.filter(p => p.workerId === worker.id && p.estado === "pendiente").length
    : 0;
  const NAV_DYN = NAV.map(item =>
    item.href === "/mis-alertas" && alertasCount > 0
      ? { ...item, badge: alertasCount }
      : item
  );

  const Inner = ({ forceExpand = false }) => {
    const isCollapsed = forceExpand ? false : collapsed;
    const colSede = sede?.color ?? "#C41A3A";

    return (
      <div style={{ width: isCollapsed ? 64 : 220, background: "var(--card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", height: "100%", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)", overflow: "hidden" }}>
        
        {/* ====== LOGO & TOGGLE ====== */}
        <div style={{ height: 60, display: "flex", alignItems: "center", padding: isCollapsed ? "0 16px" : "0 20px", gap: 12, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0, cursor: "pointer" }} onClick={onCollapse}>
            T
          </div>
          
          {!isCollapsed && (
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>TRAMYS</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>PANEL TRABAJADOR</div>
            </div>
          )}
          
          {/* Botón colapsar (solo visible en desktop) */}
          {!isCollapsed && !forceExpand && (
            <button onClick={onCollapse} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="collapse" size={16} />
            </button>
          )}
        </div>

        {/* ====== NAVEGACIÓN ====== */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", overflowX: "hidden" }}>
          {!isCollapsed && <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", letterSpacing: 1.5, textTransform: "uppercase", padding: "6px 10px 10px" }}>MI ESPACIO</div>}
          
          {NAV_DYN.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onMobileClose} style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: isActive ? "rgba(196,26,58,0.1)" : "transparent", color: isActive ? "var(--brand)" : "var(--text-muted)", fontWeight: isActive ? 600 : 500, fontSize: 13, transition: "all 0.15s", whiteSpace: "nowrap", justifyContent: isCollapsed ? "center" : "flex-start" }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--hover)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  title={isCollapsed ? item.label : ""}
                >
                  <Icon name={item.icon} size={18} color={isActive ? "var(--brand)" : "var(--text-muted)"} />
                  
                  {!isCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  
                  {!isCollapsed && (item as { badge?: number }).badge && (
                    <span style={{ background: "var(--brand)", color: "#fff", borderRadius: 99, fontSize: 9, fontWeight: 700, padding: "2px 6px" }}>
                      {(item as { badge?: number }).badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ====== USUARIO ====== */}
        <div style={{ padding: isCollapsed ? "14px" : "14px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, justifyContent: isCollapsed ? "center" : "flex-start" }}>
          <PhotoAvatar
            src={worker?.avatarBase64 ?? null}
            initials={(worker?.apodo || worker?.nombre || "?")[0]?.toUpperCase() ?? "?"}
            size={32}
            color={colSede}
          />

          {!isCollapsed && worker && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{worker.nombre}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {sede?.nombre ?? worker.rol}
              </div>
            </div>
          )}
        </div>

        {/* ====== SEPARADOR + CERRAR SESIÓN ====== */}
        {!isCollapsed && (
          <>
            <div style={{ height: 1, background: "var(--border)", margin: "0 16px" }} />
            <button
              onClick={signOut}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "12px 16px 16px",
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", color: "var(--text-muted)",
                fontSize: 13, fontWeight: 600,
                fontFamily: "'Bricolage Grotesque',sans-serif",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--brand)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            >
              <Icon name="logout" size={16} />
              <span>Cerrar sesión</span>
            </button>
          </>
        )}
        {isCollapsed && (
          <button
            onClick={signOut}
            title="Cerrar sesión"
            style={{
              background: "transparent", border: "none",
              borderTop: "1px solid var(--border)", cursor: "pointer",
              padding: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-muted)",
            }}
          >
            <Icon name="logout" size={16} />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* VERSIÓN DESKTOP */}
      <div className="sidebar-desktop" style={{ height: "100vh", position: "sticky", top: 0, flexShrink: 0 }}>
        <Inner />
      </div>

      {/* VERSIÓN MOBILE (DRAWER) */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40, backdropFilter: "blur(2px)" }} onClick={onMobileClose} />
      )}
      {mobileOpen && (
        <div className="animate-slide-left" style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50 }}>
          <Inner forceExpand={true} />
        </div>
      )}
    </>
  );
}