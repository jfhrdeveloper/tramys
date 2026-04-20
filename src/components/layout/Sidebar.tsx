"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icons"; // <-- Importamos el componente Icon
import { iniciales } from "@/lib/utils/formatters";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// Agregamos la propiedad 'icon' a cada ruta
const NAV_OWNER = [
  { href: "/dashboard",    label: "Dashboard",    icon: "dashboard" },
  { href: "/sedes",        label: "Sedes",        icon: "sedes" },
  { href: "/trabajadores", label: "Trabajadores", icon: "trabajadores" },
  { href: "/jaladores",    label: "Jaladores",    icon: "jaladores" },
  { href: "/asistencia",   label: "Asistencia",   icon: "asistencia" },
  { href: "/planilla",     label: "Planilla",     icon: "planilla" },
  { href: "/adelantos",    label: "Adelantos",    icon: "adelantos", badge: 3 },
  { href: "/feriados",     label: "Feriados",     icon: "feriados" },
  { href: "/cumpleanos",   label: "Cumpleaños",   icon: "cumpleanos" },
  { href: "/reportes",     label: "Reportes",     icon: "reportes" },
  { href: "/accesos",      label: "Accesos",      icon: "accesos" },
];

const NAV_ENC = [
  { href: "/dashboard",    label: "Dashboard",    icon: "dashboard" },
  { href: "/trabajadores", label: "Trabajadores", icon: "trabajadores" },
  { href: "/asistencia",   label: "Asistencia",   icon: "asistencia" },
  { href: "/feriados",     label: "Feriados",     icon: "feriados" },
  { href: "/cumpleanos",   label: "Cumpleaños",   icon: "cumpleanos" },
];

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const nav = profile?.rol === "encargado" ? NAV_ENC : NAV_OWNER;
  const colSede = profile?.sede?.nombre?.toLowerCase().includes("santa") ? "#C41A3A" : "#1d6fa4";

  // Agregamos un prop forceExpand para que en mobile siempre se vea completo
  const Inner = ({ forceExpand = false }) => {
    const isCollapsed = forceExpand ? false : collapsed;
    
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
              <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>
                {profile?.rol === "encargado" ? "ENCARGADO" : "PANEL OWNER"}
              </div>
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
          {!isCollapsed && <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", letterSpacing: 1.5, textTransform: "uppercase", padding: "6px 10px 10px" }}>OPERACIONES</div>}
          
          {nav.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={onMobileClose} style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: isActive ? "rgba(196,26,58,0.1)" : "transparent", color: isActive ? "var(--brand)" : "var(--text-muted)", fontWeight: isActive ? 600 : 500, fontSize: 13, transition: "all 0.15s", whiteSpace: "nowrap", justifyContent: isCollapsed ? "center" : "flex-start" }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--hover)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  title={isCollapsed ? item.label : ""}
                >
                  {/* Reemplazamos el punto por el Icono dinámico */}
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

        {/* ====== USUARIO & LOGOUT ====== */}
        <div style={{ padding: isCollapsed ? "16px" : "16px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, justifyContent: isCollapsed ? "center" : "flex-start" }}>
          <Avatar initials={profile ? iniciales(profile.nombre) : "?"} size={32} color={colSede} />
          
          {!isCollapsed && profile && (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontWeight: 600, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.nombre}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textTransform: "capitalize" }}>{profile.rol}</div>
            </div>
          )}
          
          {!isCollapsed && (
            <button onClick={signOut} title="Cerrar sesión" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
              <Icon name="logout" size={16} />
            </button>
          )}
        </div>
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