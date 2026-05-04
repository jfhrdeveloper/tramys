"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import { useData } from "@/components/providers/DataProvider";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { Icon } from "@/components/ui/Icons";
import { MiPerfilModal } from "@/components/ui/MiPerfilModal";

interface Props {
  collapsed: boolean;
  onCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/* ====== Modelo de navegación con grupos (espejo del Sidebar admin) ======
   Mismo patrón: el sidebar auto-expande el grupo cuyo path activo cae dentro,
   y un acordeón clásico mantiene un solo grupo abierto a la vez. */
type NavLink  = { kind: "link";  href: string; label: string; icon: string };
type NavGroup = { kind: "group"; key: string;  label: string; icon: string; children: NavLink[] };
type NavItem  = NavLink | NavGroup;

const NAV: NavItem[] = [
  { kind: "link",  href: "/mi-panel", label: "Mi Panel", icon: "home" },
  { kind: "group", key: "trabajo",   label: "Mi trabajo",  icon: "clock", children: [
    { kind: "link", href: "/mi-asistencia", label: "Asistencia", icon: "clock" },
    { kind: "link", href: "/mi-sueldo",     label: "Mi sueldo",  icon: "money_bill" },
  ]},
  { kind: "group", key: "solicitudes", label: "Solicitudes", icon: "file_check", children: [
    { kind: "link", href: "/mis-adelantos", label: "Adelantos", icon: "adelantos" },
    { kind: "link", href: "/mis-permisos",  label: "Permisos",  icon: "file_check" },
  ]},
  { kind: "link", href: "/mis-eventos", label: "Eventos", icon: "calendar" },
  { kind: "link", href: "/mis-alertas", label: "Alertas", icon: "bell" },
];

function isActiveHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
function groupHasActive(pathname: string, g: NavGroup): boolean {
  return g.children.some(c => isActiveHref(pathname, c.href));
}

export function SidebarWorker({ collapsed, onCollapse, mobileOpen, onMobileClose }: Props) {
  const { worker, sede, signOut } = useSession();
  const d = useData();
  const pathname = usePathname();
  const [perfilOpen, setPerfilOpen] = useState(false);

  function abrirPerfil() {
    setPerfilOpen(true);
    onMobileClose();
  }

  /* Cuántas alertas no leídas mostrar como badge dinámico */
  const alertasCount = worker
    ? d.adelantos.filter(a => a.workerId === worker.id && a.estado === "pendiente").length
      + d.permisos.filter(p => p.workerId === worker.id && p.estado === "pendiente").length
    : 0;

  /* Solo un grupo abierto a la vez (acordeón). Hidrata desde el path activo. */
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  useEffect(() => {
    const activeGroup = NAV.find(it => it.kind === "group" && groupHasActive(pathname, it)) as NavGroup | undefined;
    if (activeGroup) setOpenGroup(activeGroup.key);
  }, [pathname]);
  const toggleGroup = (k: string) => setOpenGroup(prev => (prev === k ? null : k));

  const Inner = ({ forceExpand = false }) => {
    const isCollapsed = forceExpand ? false : collapsed;
    const colSede = sede?.color ?? "#C41A3A";

    return (
      <div style={{ width: isCollapsed ? 64 : 220, background: "var(--card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", height: "100%", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)", overflow: "hidden" }}>

        {/* ====== LOGO & TOGGLE ====== */}
        <div style={{ height: 60, display: "flex", alignItems: "center", padding: isCollapsed ? "0 16px" : "0 20px", gap: 12, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0, cursor: "pointer" }} onClick={onCollapse}>T</div>
          {!isCollapsed && (
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>TRAMYS</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>PANEL TRABAJADOR</div>
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
              MI ESPACIO
            </div>
          )}

          {NAV.map(item => {
            if (item.kind === "link") {
              const isActive = isActiveHref(pathname, item.href);
              const badge = item.href === "/mis-alertas" && alertasCount > 0 ? alertasCount : undefined;
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
            const grpActive = groupHasActive(pathname, item);
            const grpOpen   = openGroup === item.key;
            /* Badge agregado del grupo (suma de hijos con badge). */
            const grpBadge  = item.children.reduce(
              (acc, c) => acc + (c.href === "/mis-alertas" ? alertasCount : 0), 0,
            );

            /* En modo colapsado: cada hijo se muestra como link suelto con su icono. */
            if (isCollapsed) {
              return item.children.map(child => {
                const childActive = isActiveHref(pathname, child.href);
                const childBadge  = child.href === "/mis-alertas" && alertasCount > 0 ? alertasCount : undefined;
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
                  <span style={{ display: "inline-flex", transition: "transform 0.2s", transform: grpOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>
                    <Icon name="chevron_down" size={14} />
                  </span>
                </button>

                {grpOpen && (
                  <div style={{ marginTop: 2, marginLeft: 14, paddingLeft: 10, borderLeft: "1px solid var(--border)" }}>
                    {item.children.map(child => {
                      const childActive = isActiveHref(pathname, child.href);
                      const childBadge  = child.href === "/mis-alertas" && alertasCount > 0 ? alertasCount : undefined;
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

        {/* ====== SEPARADOR + MI PERFIL + CERRAR SESIÓN ====== */}
        {!isCollapsed && (
          <>
            <div style={{ height: 1, background: "var(--border)", margin: "0 16px" }} />
            <button
              onClick={abrirPerfil}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: "12px 16px 6px", display: "flex", alignItems: "center", gap: 10, width: "100%", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, fontFamily: "'Bricolage Grotesque',sans-serif", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--brand)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            >
              <Icon name="user" size={16} />
              <span>Mi perfil</span>
            </button>
            <button
              onClick={signOut}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px 16px 16px", display: "flex", alignItems: "center", gap: 10, width: "100%", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, fontFamily: "'Bricolage Grotesque',sans-serif", transition: "color 0.15s" }}
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
            <button onClick={abrirPerfil} title="Mi perfil"
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              <Icon name="user" size={16} />
            </button>
            <button onClick={signOut} title="Cerrar sesión"
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: "12px 12px 14px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40, backdropFilter: "blur(2px)" }} onClick={onMobileClose} />
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
