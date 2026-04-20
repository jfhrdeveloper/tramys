/* ================= TRAMYS — ICONS.TSX ================= */
/* Uso: import { Icon } from "@/components/ui/Icons"      */
/*      <Icon name="dashboard" size={18} color="#C41A3A" /> */

interface IconProps {
    name: string;
    size?: number;
    color?: string;
    className?: string;
    strokeWidth?: number;
    style?: React.CSSProperties;
}

/* ====== SVGs base — todos 24x24 viewBox ====== */
const ICONS: Record<string, (props: React.SVGProps<SVGSVGElement>) => React.ReactElement> = {

    /* ================= SIDEBAR ADMIN ================= */

    /* ==== Dashboard ==== */
    dashboard: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={p.strokeWidth} />
            <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={p.strokeWidth} />
            <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={p.strokeWidth} />
            <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={p.strokeWidth} />
        </svg>
    ),

    /* ==== Sedes ==== */
    sedes: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M3 21h18M6 21V7l6-4 6 4v14" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 21v-5h4v5" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 10h4" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M10 14h4" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Trabajadores ==== */
    trabajadores: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="9" cy="7" r="3" strokeWidth={p.strokeWidth} />
            <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M21 21v-2a4 4 0 0 0-3-3.85" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Jaladores ==== */
    jaladores: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="12" cy="12" r="9" strokeWidth={p.strokeWidth} />
            <circle cx="12" cy="12" r="3" strokeWidth={p.strokeWidth} />
            <line x1="12" y1="3" x2="12" y2="9" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <line x1="12" y1="15" x2="12" y2="21" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <line x1="3" y1="12" x2="9" y2="12" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <line x1="15" y1="12" x2="21" y2="12" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Asistencia ==== */
    asistencia: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={p.strokeWidth} />
            <path d="M16 2v4M8 2v4M3 10h18" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M9 16l2 2 4-4" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Planilla ==== */
    planilla: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <rect x="2" y="3" width="20" height="18" rx="2" strokeWidth={p.strokeWidth} />
            <path d="M7 8h10M7 12h10M7 16h6" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <circle cx="19" cy="16" r="3" strokeWidth={p.strokeWidth} />
            <path d="M19 14.5v1.5l1 1" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Adelantos ==== */
    adelantos: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={p.strokeWidth} />
            <path d="M2 10h20" strokeWidth={p.strokeWidth} />
            <circle cx="12" cy="15" r="2" strokeWidth={p.strokeWidth} />
            <path d="M6 15h2M16 15h2" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Feriados ==== */
    feriados: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={p.strokeWidth} />
            <path d="M16 2v4M8 2v4M3 10h18" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M15 18l1.5-1.5" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Cumpleaños ==== */
    cumpleanos: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M3 14c0-2 2-3 3-3s3-1 3-3" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M9 8V5" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M7 5c0-1.1.9-2 2-2s2 .9 2 2" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M9 14h6M12 14v7" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Reportes ==== */
    reportes: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M3 3v18h18" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 16l4-4 4 4 4-6" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Accesos ==== */
    accesos: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ================= SIDEBAR TRABAJADOR ================= */

    /* ==== Mi Panel ==== */
    home: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 21V12h6v9" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Mi Asistencia (clock) ==== */
    clock: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="12" cy="12" r="9" strokeWidth={p.strokeWidth} />
            <path d="M12 7v5l3 3" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Mi Sueldo ==== */
    sueldo: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M12 2v2M12 20v2M6 12H4M20 12h-2" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <circle cx="12" cy="12" r="5" strokeWidth={p.strokeWidth} />
            <path d="M10 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0" strokeWidth={p.strokeWidth} />
        </svg>
    ),

    /* ==== Mis Adelantos ==== */
    hand_coin: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M5 11h14l-1 9H6l-1-9z" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 15v2" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Mis Permisos ==== */
    file_check: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2v6h6" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 15l2 2 4-4" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Mis Alertas ==== */
    bell: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ================= ACCIONES COMUNES ================= */

    /* ==== Plus ==== */
    plus: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M12 5v14M5 12h14" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Edit / Pencil ==== */
    edit: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Check ==== */
    check: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M20 6L9 17l-5-5" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== X / Close ==== */
    x: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M18 6L6 18M6 6l12 12" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Chevron Down ==== */
    chevron_down: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M6 9l6 6 6-6" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Chevron Right ==== */
    chevron_right: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M9 18l6-6-6-6" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Arrow Left ==== */
    arrow_left: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M19 12H5M12 5l-7 7 7 7" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Menu / Hamburger ==== */
    menu: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M3 12h18M3 6h18M3 18h18" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Logout ==== */
    logout: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5M21 12H9" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Search ==== */
    search: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="11" cy="11" r="7" strokeWidth={p.strokeWidth} />
            <path d="M21 21l-4.35-4.35" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Filter ==== */
    filter: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Download ==== */
    download: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M7 10l5 5 5-5M12 15V3" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Upload / Foto evidencia ==== */
    upload: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M17 8l-5-5-5 5M12 3v12" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Camera ==== */
    camera: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="4" strokeWidth={p.strokeWidth} />
        </svg>
    ),

    /* ================= ESTADOS ================= */

    /* ==== Check circle (Presente / Aprobado) ==== */
    check_circle: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="12" cy="12" r="9" strokeWidth={p.strokeWidth} />
            <path d="M9 12l2 2 4-4" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== X circle (Ausente / Rechazado) ==== */
    x_circle: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="12" cy="12" r="9" strokeWidth={p.strokeWidth} />
            <path d="M15 9l-6 6M9 9l6 6" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Alert circle (Tardanza / Pendiente) ==== */
    alert_circle: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="12" cy="12" r="9" strokeWidth={p.strokeWidth} />
            <path d="M12 8v4M12 16h.01" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Minus circle (Permiso) ==== */
    minus_circle: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="12" cy="12" r="9" strokeWidth={p.strokeWidth} />
            <path d="M8 12h8" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ================= DASHBOARD / MÉTRICAS ================= */

    /* ==== Trending up ==== */
    trending_up: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M23 6l-9.5 9.5-5-5L1 18" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 6h6v6" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Activity / Live ==== */
    activity: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Flame / Racha ==== */
    flame: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Trophy ==== */
    trophy: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M6 4h12v9a6 6 0 0 1-12 0V4z" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M8 21h8M12 17v4" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ================= FINANZAS ================= */

    /* ==== Wallet ==== */
    wallet: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M16 3H8L6 7h12l-2-4z" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="17" cy="13" r="1" fill="currentColor" />
        </svg>
    ),

    /* ==== Receipt ==== */
    receipt: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M4 2v20l3-2 2 2 3-2 2 2 3-2 3 2V2l-3 2-2-2-3 2-2-2-3 2-2-2z" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 10h8M8 14h5" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ================= TIEMPO ================= */

    /* ==== Sunrise / Entrada ==== */
    sunrise: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M17 18a5 5 0 0 0-10 0" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M12 2v7M4.22 10.22l1.42 1.42M1 18h2M21 18h2M18.36 11.64l1.42-1.42M23 22H1M8 6l4-4 4 4" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Sunset / Salida ==== */
    sunset: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M17 18a5 5 0 0 0-10 0" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M12 9V2M4.22 10.22l1.42 1.42M1 18h2M21 18h2M18.36 11.64l1.42-1.42M23 22H1M16 5l-4 4-4-4" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Timer ==== */
    timer: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="12" cy="13" r="8" strokeWidth={p.strokeWidth} />
            <path d="M12 9v4l2 2M9 2h6M12 2v3" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ================= SEGURIDAD ================= */

    /* ==== Lock ==== */
    lock: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth={p.strokeWidth} />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Eye ==== */
    eye: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth={p.strokeWidth} />
            <circle cx="12" cy="12" r="3" strokeWidth={p.strokeWidth} />
        </svg>
    ),

    /* ==== Eye Off ==== */
    eye_off: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M1 1l22 22" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ================= MISC ================= */

    /* ==== Map Pin / Sede ==== */
    map_pin: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeWidth={p.strokeWidth} />
            <circle cx="12" cy="10" r="3" strokeWidth={p.strokeWidth} />
        </svg>
    ),

    /* ==== Phone ==== */
    phone: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.08 6.08l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeWidth={p.strokeWidth} />
        </svg>
    ),

    /* ==== Mail ==== */
    mail: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeWidth={p.strokeWidth} />
            <path d="M22 6l-10 7L2 6" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Sun / Light mode ==== */
    sun: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="12" cy="12" r="5" strokeWidth={p.strokeWidth} />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== Moon / Dark mode ==== */
    moon: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Refresh ==== */
    refresh: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M23 4v6h-6M1 20v-6h6" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== User ==== */
    user: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="12" cy="8" r="4" strokeWidth={p.strokeWidth} />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeWidth={p.strokeWidth} strokeLinecap="round" />
        </svg>
    ),

    /* ==== User Check (Encargado) ==== */
    user_check: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <circle cx="9" cy="8" r="4" strokeWidth={p.strokeWidth} />
            <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeWidth={p.strokeWidth} strokeLinecap="round" />
            <path d="M16 11l2 2 4-4" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Star / Logro ==== */
    star: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Collapse sidebar ==== */
    collapse: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),

    /* ==== Expand sidebar ==== */
    expand: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
            <path d="M13 17l5-5-5-5M6 17l5-5-5-5" strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};

/* ================= COMPONENTE PRINCIPAL ==== */
export function Icon({ name, size = 16, color = "currentColor", className = "", strokeWidth = 1.75, style }: IconProps) {
    const SvgIcon = ICONS[name];

    if (!SvgIcon) {
        /* ==== Fallback: dot si el icono no existe ==== */
        return (
            <div
                className={className}
                style={{ width: size, height: size, borderRadius: "50%", background: "var(--border)", flexShrink: 0 }}
            />
        );
    }

    return (
        <SvgIcon
            width={size} height={size} color={color}
            strokeWidth={strokeWidth} className={className}
            style={{ flexShrink: 0, ...style }}
        />
    );
}

/* ================= EXPORT DE NOMBRES DISPONIBLES ================= */
export const ICON_NAMES = Object.keys(ICONS);