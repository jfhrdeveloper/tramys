"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icons";
import { Preloader } from "@/components/ui/Preloader";

const REMEMBER_KEY    = "tramys_remember_email";
const IMPERSONATE_KEY = "tramys_impersonate_id";
const THEME_KEY       = "tramys-theme";  // misma clave que ThemeProvider — login y panel comparten preferencia

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

  /* ====== Al montar: limpiar impersonacion residual y autorrellenar email ====== */
  useEffect(() => {
    try {
      /* La sesion de Supabase se mantiene (cookies); solo limpiamos impersonacion. */
      localStorage.removeItem(IMPERSONATE_KEY);
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
      setLoading(false);
      setWelcome({ nombre, apodo, rol });
      setTimeout(() => {
        router.push(rol === "trabajador" ? "/mi-panel" : "/dashboard");
      }, 1700);
      return;
    }
    setLoading(false);
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
            Controla asistencia, planilla, jaladores y adelantos de tus sedes desde un panel unificado.
          </div>
        </div>

        <div className="relative text-[11px] text-white/45" style={{ fontFamily:"'DM Mono',monospace" }}>
          © 2026 TRAMYS
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

            {/* ==== Recuérdame el email ==== */}
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
              <span>Recordar mi email en este dispositivo</span>
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
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=DM+Mono&display=swap');
      `}</style>
    </div>
  );
}
