"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import { useData } from "@/components/providers/DataProvider";
import { Icon } from "@/components/ui/Icons";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { MiPerfilModal } from "@/components/ui/MiPerfilModal";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/* ====== Modelo de navegación con grupos =======
   `NavLink` = entrada simple. `NavGroup` = dropdown con hijos.
   El sidebar auto-expande el grupo cuyo path activo cae dentro. */
type NavLink  = { kind: "link";  href: string; label: string; icon: string };
type NavGroup = { kind: "group"; key: string;  label: string; icon: string; children: NavLink[] };
type NavItem  = NavLink | NavGroup;

const NAV_OWNER: NavItem[] = [
  { kind: "link",  href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { kind: "link",  href: "/sedes",     label: "Sedes",     icon: "sedes" },
  { kind: "group", key: "personal",    label: "Personal",  icon: "trabajadores", children: [
    { kind: "link", href: "/trabajadores", label: "Trabajadores", icon: "trabajadores" },
    { kind: "link", href: "/jaladores",    label: "Jaladores",    icon: "jaladores" },
    { kind: "link", href: "/asistencia",   label: "Asistencia",   icon: "asistencia" },
    { kind: "link", href: "/adelantos",    label: "Adelantos",    icon: "adelantos" },
  ]},
  { kind: "group", key: "finanzas",    label: "Finanzas",  icon: "money_bill", children: [
    { kind: "link", href: "/planilla",   label: "Planilla",   icon: "planilla" },
    { kind: "link", href: "/mis-gastos", label: "Mis gastos", icon: "money_bill" },
    { kind: "link", href: "/reportes",   label: "Reportes",   icon: "reportes" },
  ]},
  { kind: "link",  href: "/eventos", label: "Eventos", icon: "calendar" },
  { kind: "link",  href: "/accesos", label: "Accesos", icon: "accesos" },
];

const NAV_ENC: NavItem[] = [
  { kind: "link",  href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { kind: "link",  href: "/sedes",     label: "Mi sede",   icon: "sedes" },
  { kind: "group", key: "personal",    label: "Personal",  icon: "trabajadores", children: [
    { kind: "link", href: "/trabajadores", label: "Trabajadores", icon: "trabajadores" },
    { kind: "link", href: "/asistencia",   label: "Asistencia",   icon: "asistencia" },
    { kind: "link", href: "/adelantos",    label: "Adelantos",    icon: "adelantos" },
  ]},
  { kind: "link",  href: "/mis-gastos", label: "Mis gastos", icon: "money_bill" },
  { kind: "link",  href: "/eventos",    label: "Eventos",    icon: "calendar" },
];

/* Activo si el pathname coincide o cuelga del href. */
function isActiveHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
function groupHasActive(pathname: string, g: NavGroup): boolean {
  return g.children.some(c => isActiveHref(pathname, c.href));
}

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const { worker, sede, signOut } = useSession();
  const d = useData();
  const pathname = usePathname();
  const [perfilOpen, setPerfilOpen] = useState(false);

  function abrirPerfil() {
    setPerfilOpen(true);
    onMobileClose();
  }

  /* Pendientes en bandeja del owner. Badge se inyecta sobre /adelantos
     y también se eleva al grupo "Personal" cuando el dropdown está cerrado. */
  const adelantosPend = d.adelantos.filter(a => a.estado === "pendiente").length;

  const navBase = worker?.rol === "encargado" ? NAV_ENC : NAV_OWNER;
  const colSede = sede?.color ?? "#C41A3A";
  const titulo  = worker?.rol === "encargado" ? "PANEL ENCARGADO" : "PANEL OWNER";

  /* Estado de grupos abiertos. Se hidrata desde el path activo: si estamos
     en /trabajadores el grupo "personal" arranca abierto. */
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const next: Record<string, boolean> = {};
    navBase.forEach(it => {
      if (it.kind === "group" && groupHasActive(pathname, it)) next[it.key] = true;
    });
    setOpenGroups(prev => ({ ...next, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, worker?.rol]);
  const toggleGroup = (k: string) => setOpenGroups(prev => ({ ...prev, [k]: !prev[k] }));

  const Inner = ({ forceExpand = false }) => {
    const isCollapsed = forceExpand ? false : collapsed;

    return (
      <div style={{
        width: isCollapsed ? 64 : 240,
        background: "var(--card)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        height: "100%",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
      }}>

        {/* ====== LOGO & TOGGLE ====== */}
        <div style={{
          height: 60, display: "flex", alignItems: "center",
          padding: isCollapsed ? "0 16px" : "0 20px",
          gap: 12, borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          <div
            onClick={onCollapse}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "var(--brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 15,
              flexShrink: 0, cursor: "pointer",
            }}
          >T</div>

          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>TRAMYS</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>
                {titulo}
              </div>
            </div>
          )}

          {!isCollapsed && !forceExpand && (
            <button onClick={onCollapse} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="collapse" size={16} />
            </button>
          )}
        </div>

        {/* ====== NAVEGACIÓN ====== */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", overflowX: "hidden" }}>
          {!isCollapsed && (
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", letterSpacing: 1.5, textTransform: "uppercase", padding: "6px 10px 10px" }}>
              OPERACIONES
            </div>
          )}

          {navBase.map(item => {
            if (item.kind === "link") {
              const isActive = isActiveHref(pathname, item.href);
              const badge = item.href === "/adelantos" && adelantosPend > 0 ? adelantosPend : undefined;
              return (
                <Link key={item.href} href={item.href} onClick={onMobileClose} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                      marginBottom: 4,
                      background: isActive ? "rgba(196,26,58,0.1)" : "transparent",
                      color: isActive ? "var(--brand)" : "var(--text-muted)",
                      fontWeight: isActive ? 600 : 500, fontSize: 13,
                      transition: "all 0.15s", whiteSpace: "nowrap",
                      justifyContent: isCollapsed ? "center" : "flex-start",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--hover)"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    title={isCollapsed ? item.label : ""}
                  >
                    <Icon name={item.icon} size={18} color={isActive ? "var(--brand)" : "var(--text-muted)"} />
                    {!isCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                    {!isCollapsed && badge && (
                      <span style={{ background: "var(--brand)", color: "#fff", borderRadius: 99, fontSize: 9, fontWeight: 700, padding: "2px 6px" }}>
                        {badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            }

            /* ====== Grupo desplegable ====== */
            const grpActive  = groupHasActive(pathname, item);
            const grpOpen    = openGroups[item.key] ?? grpActive;
            /* Badge agregado del grupo (suma de hijos con badge). */
            const grpBadge   = item.children.reduce(
              (acc, c) => acc + (c.href === "/adelantos" ? adelantosPend : 0), 0,
            );

            /* En modo colapsado no hay dropdown: mostramos cada hijo como un
               link suelto (con su icono propio) — así sigue siendo navegable
               sin necesidad de expandir el sidebar. */
            if (isCollapsed) {
              return item.children.map(child => {
                const childActive = isActiveHref(pathname, child.href);
                const childBadge = child.href === "/adelantos" && adelantosPend > 0 ? adelantosPend : undefined;
                return (
                  <Link key={child.href} href={child.href} onClick={onMobileClose} style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                        marginBottom: 4,
                        background: childActive ? "rgba(196,26,58,0.1)" : "transparent",
                        color: childActive ? "var(--brand)" : "var(--text-muted)",
                        transition: "all 0.15s",
                      }}
                      title={child.label}
                      onMouseEnter={e => { if (!childActive) (e.currentTarget as HTMLElement).style.background = "var(--hover)"; }}
                      onMouseLeave={e => { if (!childActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <Icon name={child.icon} size={18} color={childActive ? "var(--brand)" : "var(--text-muted)"} />
                      {childBadge && (
                        <span style={{
                          position: "absolute", top: 4, right: 4,
                          background: "var(--brand)", color: "#fff", borderRadius: 99,
                          fontSize: 8, fontWeight: 700, padding: "1px 5px",
                        }}>
                          {childBadge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              });
            }

            return (
              <div key={item.key} style={{ marginBottom: 4 }}>
                <button
                  onClick={() => toggleGroup(item.key)}
                  aria-expanded={grpOpen}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                    background: grpActive && !grpOpen ? "rgba(196,26,58,0.06)" : "transparent",
                    color: grpActive ? "var(--brand)" : "var(--text-muted)",
                    fontWeight: grpActive ? 600 : 500, fontSize: 13,
                    border: "none", textAlign: "left",
                    fontFamily: "'Bricolage Grotesque',sans-serif",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!grpActive) (e.currentTarget as HTMLElement).style.background = "var(--hover)"; }}
                  onMouseLeave={e => { if (!grpActive) (e.currentTarget as HTMLElement).style.background = grpActive && !grpOpen ? "rgba(196,26,58,0.06)" : "transparent"; }}
                >
                  <Icon name={item.icon} size={18} color={grpActive ? "var(--brand)" : "var(--text-muted)"} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {!grpOpen && grpBadge > 0 && (
                    <span style={{ background: "var(--brand)", color: "#fff", borderRadius: 99, fontSize: 9, fontWeight: 700, padding: "2px 6px" }}>
                      {grpBadge}
                    </span>
                  )}
                  <span style={{
                    display: "inline-flex", transition: "transform 0.2s",
                    transform: grpOpen ? "rotate(0deg)" : "rotate(-90deg)",
                  }}>
                    <Icon name="chevron_down" size={14} />
                  </span>
                </button>

                {grpOpen && (
                  <div className="animate-fade-in" style={{
                    marginTop: 2, marginLeft: 14, paddingLeft: 10,
                    borderLeft: "1px solid var(--border)",
                  }}>
                    {item.children.map(child => {
                      const childActive = isActiveHref(pathname, child.href);
                      const childBadge = child.href === "/adelantos" && adelantosPend > 0 ? adelantosPend : undefined;
                      return (
                        <Link key={child.href} href={child.href} onClick={onMobileClose} style={{ textDecoration: "none" }}>
                          <div
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "8px 10px", borderRadius: 6, cursor: "pointer",
                              marginBottom: 2,
                              background: childActive ? "rgba(196,26,58,0.1)" : "transparent",
                              color: childActive ? "var(--brand)" : "var(--text-muted)",
                              fontWeight: childActive ? 600 : 500, fontSize: 12.5,
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={e => { if (!childActive) (e.currentTarget as HTMLElement).style.background = "var(--hover)"; }}
                            onMouseLeave={e => { if (!childActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <Icon name={child.icon} size={15} color={childActive ? "var(--brand)" : "var(--text-muted)"} />
                            <span style={{ flex: 1 }}>{child.label}</span>
                            {childBadge && (
                              <span style={{ background: "var(--brand)", color: "#fff", borderRadius: 99, fontSize: 9, fontWeight: 700, padding: "2px 6px" }}>
                                {childBadge}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ====== USUARIO ====== */}
        <div style={{
          padding: isCollapsed ? "14px" : "14px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 10,
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}>
          <PhotoAvatar
            src={worker?.avatarBase64 ?? null}
            initials={(worker?.apodo || worker?.nombre || "?")[0]?.toUpperCase() ?? "?"}
            size={32}
            color={colSede}
          />
          {!isCollapsed && worker && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {worker.nombre}
              </div>
              <div style={{
                fontSize: 10, color: "var(--text-muted)",
                fontFamily: "'DM Mono',monospace",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {worker.email || worker.rol}
              </div>
            </div>
          )}
        </div>

        {/* ====== SEPARADOR + MI PERFIL + CERRAR SESIÓN ====== */}
        {!isCollapsed && (
          <>
            <div style={{
              height: 1,
              background: "var(--border)",
              margin: "0 16px",
            }} />
            <button
              onClick={abrirPerfil}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "12px 16px 6px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                color: "var(--text-muted)",
                fontSize: 13, fontWeight: 600,
                fontFamily: "'Bricolage Grotesque',sans-serif",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--brand)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            >
              <Icon name="user" size={16} />
              <span>Mi perfil</span>
            </button>
            <button
              onClick={signOut}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 16px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                color: "var(--text-muted)",
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
          <div style={{ borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
            <button
              onClick={abrirPerfil}
              title="Mi perfil"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <Icon name="user" size={16} />
            </button>
            <button
              onClick={signOut}
              title="Cerrar sesión"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "12px 12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="sidebar-desktop" style={{ height: "100vh", position: "sticky", top: 0, flexShrink: 0 }}>
        <Inner />
      </div>

      {mobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40, backdropFilter: "blur(2px)" }}
          onClick={onMobileClose}
        />
      )}
      {mobileOpen && (
        <div className="animate-slide-left" style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50 }}>
          <Inner forceExpand={true} />
        </div>
      )}

      <MiPerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} />
    </>
  );
}
