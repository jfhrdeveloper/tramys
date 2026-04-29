"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icons";
import { Preloader } from "@/components/ui/Preloader";

const REMEMBER_KEY = "tramys_remember_email";
const SESSION_KEY  = "tramys_session_id";
const REAL_KEY     = "tramys_session_real_id";
const THEME_KEY    = "tramys-theme";  // misma clave que ThemeProvider — login y panel comparten preferencia

/* Persiste el id de sesión según preferencia del usuario.
   Recuérdame ON  → localStorage (sobrevive al cierre de pestaña).
   Recuérdame OFF → sessionStorage (muere al cerrar la pestaña). */
function persistirSesion(workerId: string, recordar: boolean) {
  try {
    if (recordar) {
      localStorage.setItem(SESSION_KEY, workerId);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, workerId);
      localStorage.removeItem(SESSION_KEY);
    }
    localStorage.removeItem(REAL_KEY);
  } catch {}
}

/* ================= PÁGINA DE LOGIN ================= */
export default function LoginPage() {

  /* ====== Estados y hooks ====== */
  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [dark,     setDark]     = useState(true);
  const [themeUserSet, setThemeUserSet] = useState(false);
  const [welcome,  setWelcome]  = useState<{ nombre:string; apodo?:string; rol:string } | null>(null);

  /* ====== Al montar: limpiar sesión efectiva (siempre comenzar deslogueado en /login)
            y autorrellenar email si el usuario marcó "recuérdame" antes. ====== */
  useEffect(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(REAL_KEY);
      const recordado = localStorage.getItem(REMEMBER_KEY);
      if (recordado) setEmail(recordado);

      /* ==== Tema: prioriza preferencia guardada por el usuario, si no, sigue al sistema ==== */
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") {
        setDark(saved === "dark");
        setThemeUserSet(true);
      } else {
        const systemPrefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
        setDark(!systemPrefersLight);
        setThemeUserSet(false);
      }
    } catch {}
  }, []);

  /* ====== Aplicar la clase .dark al <html> para que toda la app respete el tema actual ====== */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    if (themeUserSet) {
      try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch {}
    }
  }, [dark, themeUserSet]);

  /* ====== Si el usuario NO ha elegido manualmente, seguir cambios del sistema ====== */
  useEffect(() => {
    if (themeUserSet) return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => setDark(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeUserSet]);

  /* ====== Toggle manual: marca la preferencia como del usuario y la persiste ====== */
  function toggleTheme() {
    setThemeUserSet(true);
    setDark(d => !d);
  }

  const router   = useRouter();
  const supabase = createClient();

  /* ==== Paleta dinámica por tema ==== */
  const t = dark
    ? { bg:"#0e1117", card:"#161b22", text:"#e8eaf0", muted:"#8b8fa8", border:"#21262d" }
    : { bg:"#f8f7f4", card:"#ffffff", text:"#1a1917", muted:"#6b6966", border:"#e5e2dc" };
  const RED = { main:"#C41A3A", light:"#e8304d", dark:"#a01530" };

  /* ====== Login con Supabase ====== */
  async function handleLogin() {
    if (!email || !pass) { setError("Completa todos los campos."); return; }
    setError(""); setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password: pass });

    if (authError) {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      setLoading(false);
      return;
    }

    /* ==== Persistir preferencia de "recuérdame" para el email ==== */
    try {
      if (recordar) localStorage.setItem(REMEMBER_KEY, email);
      else          localStorage.removeItem(REMEMBER_KEY);
    } catch {}

    /* ==== Obtener rol y nombre para saludar + redirigir ==== */
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles").select("rol, nombre, apodo").eq("id", user.id).single();
      const nombre = (profile?.nombre as string | undefined) ?? "Usuario";
      const apodo  = (profile?.apodo  as string | undefined) ?? undefined;
      const rol    = (profile?.rol    as string | undefined) ?? "trabajador";
      persistirSesion(user.id, recordar);
      setLoading(false);
      setWelcome({ nombre, apodo, rol });
      setTimeout(() => {
        router.push(rol === "trabajador" ? "/mi-panel" : "/dashboard");
      }, 1700);
      return;
    }
    setLoading(false);
  }

  /* ====== Demo rápido por rol ======
     workerId mapea exactamente al seed del DataProvider (modo demo). */
  const DEMOS: { rol: string; nombre: string; apodo: string; sede: string; email: string; color: string; avatar: string; acceso: string; workerId: string; route: string }[] = [
    { rol:"Owner",      nombre:"Dueña del Negocio", apodo:"Owner",    sede:"Todas las sedes", email:"owner@tramys.pe",   color:"#f59e0b", avatar:"DU", acceso:"Acceso total al sistema",       workerId:"w_du", route:"/dashboard" },
    { rol:"Encargado",  nombre:"Ricardo Palma",     apodo:"Ricky",    sede:"Santa Anita",     email:"rpalma@tramys.pe",  color:"#6366f1", avatar:"RP", acceso:"Gestión solo de su sede",       workerId:"w_rp", route:"/dashboard" },
    { rol:"Trabajador", nombre:"Ana Torres",        apodo:"Ani",      sede:"Santa Anita",     email:"atorres@tramys.pe", color:"#16a34a", avatar:"AT", acceso:"Solo su información personal",  workerId:"w_at", route:"/mi-panel"  },
  ];

  /* En modo demo (sin Supabase) no hacemos auth real: escribimos la sesión y navegamos. */
  function entrarComoDemo(d: typeof DEMOS[number]) {
    persistirSesion(d.workerId, recordar);
    try {
      if (recordar) localStorage.setItem(REMEMBER_KEY, d.email);
      else          localStorage.removeItem(REMEMBER_KEY);
    } catch {}
    setWelcome({ nombre: d.nombre, apodo: d.apodo, rol: d.rol.toLowerCase() });
    setTimeout(() => { window.location.href = d.route; }, 1700);
  }

  if (welcome) return <Preloader nombre={welcome.nombre} apodo={welcome.apodo} durationMs={1800} />;

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ fontFamily:"'Bricolage Grotesque',sans-serif", background:t.bg, color:t.text, transition:"background 0.3s" }}
    >

      {/* ================= HEADER MÓVIL — MARCA (solo < md) ================= */}
      <div
        className="flex md:hidden items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ background:`linear-gradient(135deg,${RED.dark} 0%,${RED.main} 60%,${RED.light} 100%)` }}
      >
        {/* Logo + nombre */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl font-extrabold text-white text-lg"
            style={{ width:40, height:40, background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)", flexShrink:0 }}
          >T</div>
          <div>
            <div className="font-extrabold text-white text-base leading-none tracking-tight">TRAMYS</div>
            <div className="text-white/60 text-[9px] mt-0.5" style={{ fontFamily:"'DM Mono',monospace", letterSpacing:1 }}>
              PANEL DE GESTIÓN
            </div>
          </div>
        </div>

        {/* Stats compactos en móvil */}
        <div className="flex gap-2">
          {[["24","Trabajadores"],["2","Sedes"]].map(([val,lbl])=>(
            <div
              key={lbl}
              className="rounded-lg px-3 py-1.5 text-center"
              style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)" }}
            >
              <div className="font-extrabold text-white text-sm leading-none">{val}</div>
              <div className="text-white/60 text-[9px] mt-0.5">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= PANEL IZQUIERDO — MARCA (solo ≥ md) ================= */}
      <div
        className="hidden md:flex flex-col justify-between md:w-[42%] lg:w-[45%] flex-shrink-0 relative overflow-hidden"
        style={{
          background:`linear-gradient(145deg,${RED.dark} 0%,${RED.main} 50%,${RED.light} 100%)`,
          padding:"clamp(32px,4vw,52px) clamp(28px,4vw,52px)",
        }}
      >
        {/* ==== Círculos decorativos ==== */}
        {[
          { top:-80,  right:-80, size:320 },
          { bottom:-60, left:-60, size:260 },
          { top:"40%", left:"60%", size:120 },
        ].map((c,i)=>(
          <div
            key={i}
            style={{
              position:"absolute",
              top: "top" in c ? c.top : undefined,
              right:"right" in c ? c.right : undefined,
              bottom:"bottom" in c ? c.bottom : undefined,
              left: "left" in c ? c.left : undefined,
              width:c.size, height:c.size,
              borderRadius:"50%", background:"rgba(255,255,255,0.05)",
            }}
          />
        ))}

        {/* Logo */}
        <div className="flex items-center gap-3.5 relative">
          <div
            className="flex items-center justify-center rounded-xl font-extrabold text-white text-xl"
            style={{ width:44, height:44, background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)" }}
          >T</div>
          <div>
            <div className="font-extrabold text-white text-xl tracking-tight">TRAMYS</div>
            <div className="text-white/65 text-[10px]" style={{ fontFamily:"'DM Mono',monospace", letterSpacing:1 }}>
              PANEL DE GESTIÓN
            </div>
          </div>
        </div>

        {/* Texto central */}
        <div className="relative">
          <div
            className="font-extrabold text-white leading-tight mb-4"
            style={{ fontSize:"clamp(26px,2.5vw,36px)", letterSpacing:-1 }}
          >
            Gestión operativa<br />en un solo lugar.
          </div>
          <div className="text-white/70 text-sm leading-relaxed" style={{ maxWidth:340 }}>
            Controla asistencia, planilla, jaladores y adelantos de tus dos sedes desde un panel unificado.
          </div>
          <div className="flex gap-3 mt-9">
            {[["24","Trabajadores"],["2","Sedes"],["5","Jaladores"]].map(([val,lbl])=>(
              <div
                key={lbl}
                className="flex-1 rounded-xl"
                style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", padding:"12px 16px" }}
              >
                <div className="font-extrabold text-white text-[22px] leading-none">{val}</div>
                <div className="text-white/65 text-[11px] mt-1">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[11px] text-white/45" style={{ fontFamily:"'DM Mono',monospace" }}>
          © 2026 TRAMYS · Santa Anita &amp; Puente Piedra
        </div>
      </div>

      {/* ================= PANEL DERECHO — FORMULARIO ================= */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative
                   px-5 py-8
                   sm:px-10 sm:py-10
                   md:px-10 md:py-12
                   lg:px-14"
      >

        {/* Toggle tema */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <div
            onClick={toggleTheme}
            className="relative cursor-pointer rounded-full transition-all"
            style={{ width:48, height:26, background:dark?RED.main:t.border }}
          >
            <div
              className="absolute top-[3px] w-5 h-5 rounded-full bg-white flex items-center justify-center transition-all duration-300"
              style={{ left: dark ? 25 : 3 }}
            >
              <Icon name={dark ? "moon" : "sun"} size={12} color={dark ? RED.main : "#f59e0b"} />
            </div>
          </div>
        </div>

        {/* ==== Contenedor del formulario ==== */}
        <div className="w-full max-w-sm sm:max-w-md">

          {/* Encabezado del form */}
          <div className="mb-7 sm:mb-8">
            <div className="font-extrabold text-2xl sm:text-[26px] tracking-tight mb-1.5">
              Bienvenido de vuelta
            </div>
            <div className="text-[13px]" style={{ color:t.muted }}>
              Ingresa tus credenciales para acceder al panel
            </div>
          </div>

          <div className="flex flex-col gap-4">

            {/* Email */}
            <div>
              <label
                className="block text-xs font-semibold uppercase mb-1.5 tracking-wide"
                style={{ color:t.muted, fontFamily:"'DM Mono',monospace", letterSpacing:"0.05em" }}
              >
                Correo electrónico
              </label>
              <input
                type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="tu@tramys.pe"
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                className="w-full rounded-xl text-sm outline-none transition-all"
                style={{
                  padding:"11px 14px", border:`1.5px solid ${t.border}`,
                  background:t.bg, color:t.text,
                  fontFamily:"'Bricolage Grotesque',sans-serif", boxSizing:"border-box",
                }}
                onFocus={e=>e.target.style.borderColor=RED.main}
                onBlur={e=>e.target.style.borderColor=t.border}
              />
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color:t.muted, fontFamily:"'DM Mono',monospace", letterSpacing:"0.05em" }}
                >
                  Contraseña
                </label>
                <button
                  className="text-xs font-semibold bg-transparent border-none cursor-pointer"
                  style={{ color:RED.main, fontFamily:"'Bricolage Grotesque',sans-serif" }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                  className="w-full rounded-xl text-sm outline-none transition-all"
                  style={{
                    padding:"11px 44px 11px 14px", border:`1.5px solid ${t.border}`,
                    background:t.bg, color:t.text,
                    fontFamily:"'Bricolage Grotesque',sans-serif", boxSizing:"border-box",
                  }}
                  onFocus={e=>e.target.style.borderColor=RED.main}
                  onBlur={e=>e.target.style.borderColor=t.border}
                />
                <button
                  onClick={()=>setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-sm"
                  style={{ color:t.muted }}
                >
                  <Icon name={showPass ? "eye_off" : "eye"} size={16} color={t.muted} />
                </button>
              </div>
            </div>

            {/* ==== Recuérdame ==== */}
            <label
              className="flex items-center gap-2.5 cursor-pointer select-none"
              style={{ fontSize: 13, color: t.text, fontFamily: "'Bricolage Grotesque',sans-serif" }}
            >
              <span
                onClick={() => setRecordar(v => !v)}
                style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: `1.5px solid ${recordar ? RED.main : t.border}`,
                  background: recordar ? RED.main : "transparent",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  transition: "all .15s",
                }}
              >
                {recordar && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </span>
              <input
                type="checkbox" checked={recordar}
                onChange={e => setRecordar(e.target.checked)}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              />
              <span>Recuérdame en este dispositivo</span>
            </label>

            {/* ==== Mensaje de error ==== */}
            {error && (
              <div
                className="rounded-lg text-xs font-medium flex items-center gap-2"
                style={{
                  padding:"10px 14px",
                  background:"rgba(196,26,58,0.08)", border:"1px solid rgba(196,26,58,0.25)",
                  color:RED.main,
                }}
              >
                <Icon name="alert_circle" size={14} color={RED.main} />
                <span style={{ flex:1, minWidth:0 }}>{error}</span>
              </div>
            )}

            {/* Botón login */}
            <button
              onClick={handleLogin} disabled={loading}
              className="w-full rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 mt-1 transition-all"
              style={{
                padding:"13px 0",
                background:loading?t.border:RED.main,
                color:loading?t.muted:"#fff",
                border:"none", cursor:loading?"not-allowed":"pointer",
                fontFamily:"'Bricolage Grotesque',sans-serif",
              }}
            >
              {loading ? (
                <>
                  <div
                    className="rounded-full border-2 border-t-transparent"
                    style={{ width:14, height:14, borderColor:`${t.muted} transparent transparent transparent`, animation:"spin 0.8s linear infinite" }}
                  />
                  Verificando...
                </>
              ) : "Ingresar al panel"}
            </button>
          </div>

          {/* ====== Demo roles ====== */}
          <div className="mt-6 sm:mt-7 pt-5 sm:pt-6" style={{ borderTop:`1px solid ${t.border}` }}>
            <div
              className="text-[11px] text-center mb-3 tracking-wider"
              style={{ color:t.muted, fontFamily:"'DM Mono',monospace" }}
            >
              ACCESO RÁPIDO — DEMO
            </div>
            <div className="flex flex-col gap-3">
              {DEMOS.map(r=>(
                <button
                  key={r.rol}
                  onClick={()=>entrarComoDemo(r)}
                  className="w-full rounded-xl cursor-pointer transition-all flex items-center gap-4 text-left"
                  style={{
                    padding:"12px 16px",
                    background:`${r.color}08`, border:`1px solid ${r.color}25`,
                    fontFamily:"'Bricolage Grotesque',sans-serif",
                  }}
                  onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=`${r.color}16`; (e.currentTarget as HTMLElement).style.borderColor=`${r.color}50`; }}
                  onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background=`${r.color}08`; (e.currentTarget as HTMLElement).style.borderColor=`${r.color}25`; }}
                >
                  {/* Avatar */}
                  <div
                    className="rounded-full flex items-center justify-center font-extrabold text-[12px] flex-shrink-0"
                    style={{ width:40, height:40, background:`${r.color}20`, border:`1.5px solid ${r.color}40`, color:r.color }}
                  >
                    {r.avatar}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[13px]" style={{ color:r.color }}>{r.rol}</span>
                      <span className="text-[11px]" style={{ color:t.muted }}>·</span>
                      <span className="font-semibold text-[13px] truncate" style={{ color:t.text }}>{r.nombre}</span>
                    </div>
                    <div className="text-[11px] truncate" style={{ color:t.muted }}>{r.sede} · {r.acceso}</div>
                  </div>
                  <span className="flex-shrink-0 flex items-center" style={{ color:r.color }}>
                    <Icon name="chevron_right" size={16} color={r.color} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=DM+Mono&display=swap');
      `}</style>
    </div>
  );
}