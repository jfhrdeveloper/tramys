"use client";
import { useState } from "react";
import { Icon, ICON_NAMES } from "@/components/ui/Icons";

/* ================= PÁGINA DE ICONOS — /icons ================= */
/* Solo para desarrollo. Muestra todos los iconos disponibles.   */

const GROUPS = [
    {
        label: "Sidebar Admin",
        color: "#C41A3A",
        icons: ["dashboard", "sedes", "trabajadores", "jaladores", "asistencia", "planilla", "adelantos", "feriados", "cumpleanos", "reportes", "accesos"],
    },
    {
        label: "Sidebar Trabajador",
        color: "#16a34a",
        icons: ["home", "clock", "sueldo", "hand_coin", "file_check", "bell"],
    },
    {
        label: "Acciones",
        color: "#6366f1",
        icons: ["plus", "edit", "check", "x", "chevron_down", "chevron_right", "arrow_left", "menu", "logout", "search", "filter", "download", "upload", "camera", "refresh"],
    },
    {
        label: "Estados",
        color: "#f59e0b",
        icons: ["check_circle", "x_circle", "alert_circle", "minus_circle"],
    },
    {
        label: "Dashboard / Métricas",
        color: "#8b5cf6",
        icons: ["trending_up", "activity", "flame", "trophy", "star"],
    },
    {
        label: "Finanzas",
        color: "#16a34a",
        icons: ["wallet", "receipt"],
    },
    {
        label: "Tiempo",
        color: "#0ea5e9",
        icons: ["sunrise", "sunset", "timer"],
    },
    {
        label: "Seguridad",
        color: "#ef4444",
        icons: ["lock", "eye", "eye_off"],
    },
    {
        label: "Usuarios",
        color: "#C41A3A",
        icons: ["user", "user_check"],
    },
    {
        label: "Misc",
        color: "#8b8fa8",
        icons: ["map_pin", "phone", "mail", "sun", "moon", "collapse", "expand"],
    },
];

export default function IconsPage() {
    const [size, setSize] = useState(20);
    const [copied, setCopied] = useState("");
    const [busqueda, setBusqueda] = useState("");

    const iconsFiltrados = busqueda
        ? ICON_NAMES.filter(n => n.includes(busqueda.toLowerCase()))
        : null;

    function copiar(name: string) {
        navigator.clipboard.writeText(`<Icon name="${name}" size={18} />`);
        setCopied(name);
        setTimeout(() => setCopied(""), 1500);
    }

    return (
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", background: "var(--bg)", color: "var(--text)", minHeight: "100vh", padding: "32px 28px" }}>

            {/* ====== Header ====== */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5, marginBottom: 6 }}>
                    Iconos TRAMYS
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                    {ICON_NAMES.length} iconos SVG · Sin dependencias externas · Haz clic para copiar el componente
                </div>

                {/* Controles */}
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Tamaño: {size}px</span>
                        <input type="range" min={12} max={48} value={size} onChange={e => setSize(Number(e.target.value))}
                            style={{ cursor: "pointer" }} />
                    </div>
                    <input
                        placeholder="Buscar icono..."
                        value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: 13, outline: "none", width: 200 }}
                    />
                </div>
            </div>

            {/* ====== Búsqueda libre ====== */}
            {iconsFiltrados && (
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
                        Resultados — {iconsFiltrados.length} iconos
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {iconsFiltrados.map(name => (
                            <IconCard key={name} name={name} size={size} copied={copied} onCopy={copiar} />
                        ))}
                    </div>
                </div>
            )}

            {/* ====== Grupos ====== */}
            {!iconsFiltrados && GROUPS.map(g => (
                <div key={g.label} style={{ marginBottom: 36 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: g.color, flexShrink: 0 }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>
                            {g.label}
                        </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {g.icons.map(name => (
                            <IconCard key={name} name={name} size={size} copied={copied} onCopy={copiar} accentColor={g.color} />
                        ))}
                    </div>
                </div>
            ))}

            {/* ====== Uso ====== */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, marginTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Cómo usar</div>
                <pre style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 9, padding: "14px 16px", fontSize: 12, fontFamily: "'DM Mono',monospace", color: "var(--text)", overflowX: "auto" }}>
                    {`// Importar
import { Icon } from "@/components/ui/Icons";

// Usar
<Icon name="dashboard"    size={18} />
<Icon name="check_circle" size={16} color="#16a34a" />
<Icon name="bell"         size={20} color="var(--brand)" strokeWidth={2} />

// En el sidebar
<Icon name="jaladores" size={16} color={isActive ? "var(--brand)" : "var(--text-muted)"} />`}
                </pre>
            </div>
        </div>
    );
}

/* ====== Card individual de icono ====== */
function IconCard({ name, size, copied, onCopy, accentColor }: {
    name: string; size: number; copied: string; onCopy: (n: string) => void; accentColor?: string;
}) {
    const isCopied = copied === name;
    return (
        <div
            onClick={() => onCopy(name)}
            title={`Copiar: <Icon name="${name}" size={18} />`}
            style={{
                background: isCopied ? "rgba(34,197,94,0.1)" : "var(--card)",
                border: `1px solid ${isCopied ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                borderRadius: 10,
                padding: "14px 16px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                minWidth: 80,
                transition: "all 0.15s",
                userSelect: "none",
            }}
            onMouseEnter={e => {
                if (!isCopied) {
                    (e.currentTarget as HTMLElement).style.background = "var(--hover)";
                    (e.currentTarget as HTMLElement).style.borderColor = accentColor ?? "var(--brand)";
                }
            }}
            onMouseLeave={e => {
                if (!isCopied) {
                    (e.currentTarget as HTMLElement).style.background = "var(--card)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                }
            }}
        >
            <Icon name={name} size={size} color={isCopied ? "#16a34a" : accentColor ?? "var(--text)"} />
            <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textAlign: "center", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display:"inline-flex", alignItems:"center", gap:3, justifyContent:"center" }}>
                {isCopied ? (<><Icon name="check" size={9} color="#16a34a" /> copiado</>) : name}
            </span>
        </div>
    );
}