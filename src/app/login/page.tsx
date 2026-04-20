"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/* ================= PÁGINA DE LOGIN ================= */
export default function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [dark,     setDark]     = useState(true);
  const router = useRouter();
  const supabase = createClient();

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

    /* ==== Obtener rol para redirigir ==== */
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles").select("rol").eq("id", user.id).single();
      router.push(profile?.rol === "trabajador" ? "/mi-panel" : "/dashboard");
    }
    setLoading(false);
  }

  /* ====== Demo rápido ====== */
  const DEMOS = [
    { rol:"Owner",      nombre:"Dueña del negocio",  sede:"Ambas sedes",   email:"owner@tramys.pe",   color:"#f59e0b", avatar:"DU", acceso:"Acceso total al sistema"         },
    { rol:"Encargado",  nombre:"Ricardo Palma",       sede:"Santa Anita",   email:"enc@tramys.pe",     color:"#6366f1", avatar:"RP", acceso:"Gestión de su sede únicamente"   },
    { rol:"Trabajador", nombre:"Ana Torres",          sede:"Santa Anita",   email:"trab@tramys.pe",    color:"#16a34a", avatar:"AT", acceso:"Solo su información personal"    },
  ];

  return (
    <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", background:t.bg, color:t.text, minHeight:"100vh", display:"flex", transition:"background 0.3s" }}>

      {/* ================= PANEL IZQUIERDO — MARCA ================= */}
      <div style={{
        width:"45%", flexShrink:0,
        background:`linear-gradient(145deg,${RED.dark} 0%,${RED.main} 50%,${RED.light} 100%)`,
        display:"flex", flexDirection:"column", justifyContent:"space-between",
        padding:"48px 52px", position:"relative", overflow:"hidden",
      }}>
        {/* ==== Círculos decorativos ==== */}
        {[{t:-80,r:-80,s:320},{b:-60,l:-60,s:260},{t:"40%",l:"60%",s:120}].map((c,i)=>(
          <div key={i} style={{ position:"absolute", top:c.t, right:c.r, bottom:c.b, left:c.l, width:c.s, height:c.s, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        ))}

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:14, position:"relative" }}>
          <div style={{ width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:20,color:"#fff" }}>T</div>
          <div>
            <div style={{ fontWeight:800,fontSize:20,color:"#fff",letterSpacing:-0.5 }}>TRAMYS</div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.65)",fontFamily:"'DM Mono',monospace",letterSpacing:1 }}>PANEL DE GESTIÓN</div>
          </div>
        </div>

        {/* Texto central */}
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:36,fontWeight:800,color:"#fff",lineHeight:1.15,marginBottom:16,letterSpacing:-1 }}>
            Gestión operativa<br />en un solo lugar.
          </div>
          <div style={{ fontSize:14,color:"rgba(255,255,255,0.7)",lineHeight:1.7,maxWidth:340 }}>
            Controla asistencia, planilla, jaladores y adelantos de tus dos sedes desde un panel unificado.
          </div>
          <div style={{ display:"flex",gap:12,marginTop:36 }}>
            {[["24","Trabajadores"],["2","Sedes"],["5","Jaladores"]].map(([val,lbl])=>(
              <div key={lbl} style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:12,padding:"12px 16px",flex:1 }}>
                <div style={{ fontWeight:800,fontSize:22,color:"#fff",lineHeight:1 }}>{val}</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.65)",marginTop:3 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize:11,color:"rgba(255,255,255,0.45)",fontFamily:"'DM Mono',monospace",position:"relative" }}>
          © 2026 TRAMYS · Santa Anita & Puente Piedra
        </div>
      </div>

      {/* ================= PANEL DERECHO — FORMULARIO ================= */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 40px",position:"relative" }}>

        {/* Toggle tema */}
        <div style={{ position:"absolute",top:24,right:24 }}>
          <div onClick={()=>setDark(!dark)} style={{ width:48,height:26,borderRadius:99,cursor:"pointer",background:dark?RED.main:t.border,position:"relative",transition:"background 0.3s" }}>
            <div style={{ position:"absolute",top:3,left:dark?25:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.3s",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10 }}>{dark?"🌙":"☀️"}</div>
          </div>
        </div>

        <div style={{ width:"100%",maxWidth:400 }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ fontWeight:800,fontSize:26,letterSpacing:-0.5,marginBottom:6 }}>Bienvenido de vuelta</div>
            <div style={{ fontSize:13,color:t.muted }}>Ingresa tus credenciales para acceder al panel</div>
          </div>

          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize:12,fontWeight:600,color:t.muted,display:"block",marginBottom:7,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:0.5 }}>Correo electrónico</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="tu@tramys.pe"
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                style={{ width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${t.border}`,background:t.bg,color:t.text,fontSize:14,fontFamily:"'Bricolage Grotesque',sans-serif",outline:"none",boxSizing:"border-box",transition:"border 0.2s" }}
                onFocus={e=>e.target.style.borderColor=RED.main}
                onBlur={e=>e.target.style.borderColor=t.border}
              />
            </div>

            {/* Contraseña */}
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
                <label style={{ fontSize:12,fontWeight:600,color:t.muted,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:0.5 }}>Contraseña</label>
                <button style={{ background:"transparent",border:"none",cursor:"pointer",fontSize:12,color:RED.main,fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:600 }}>¿Olvidaste tu contraseña?</button>
              </div>
              <div style={{ position:"relative" }}>
                <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                  style={{ width:"100%",padding:"11px 44px 11px 14px",borderRadius:10,border:`1.5px solid ${t.border}`,background:t.bg,color:t.text,fontSize:14,fontFamily:"'Bricolage Grotesque',sans-serif",outline:"none",boxSizing:"border-box",transition:"border 0.2s" }}
                  onFocus={e=>e.target.style.borderColor=RED.main}
                  onBlur={e=>e.target.style.borderColor=t.border}
                />
                <button onClick={()=>setShowPass(!showPass)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",cursor:"pointer",color:t.muted,fontSize:14 }}>
                  {showPass?"🙈":"👁️"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background:"rgba(196,26,58,0.08)",border:"1px solid rgba(196,26,58,0.25)",borderRadius:8,padding:"10px 14px",fontSize:12,color:RED.main,fontWeight:500 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Botón login */}
            <button onClick={handleLogin} disabled={loading} style={{
              width:"100%",padding:"13px 0",borderRadius:10,
              background:loading?t.border:RED.main,color:loading?t.muted:"#fff",
              border:"none",cursor:loading?"not-allowed":"pointer",
              fontWeight:700,fontSize:15,fontFamily:"'Bricolage Grotesque',sans-serif",
              transition:"all 0.2s",marginTop:4,
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            }}>
              {loading ? (
                <><div style={{ width:14,height:14,border:`2px solid ${t.muted}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite" }} />Verificando...</>
              ) : "Ingresar al panel"}
            </button>
          </div>

          {/* ==== Demo roles ==== */}
          <div style={{ marginTop:28,paddingTop:22,borderTop:`1px solid ${t.border}` }}>
            <div style={{ fontSize:11,color:t.muted,fontFamily:"'DM Mono',monospace",textAlign:"center",marginBottom:12,letterSpacing:0.5 }}>ACCESO RÁPIDO — DEMO</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {DEMOS.map(r=>(
                <button key={r.rol} onClick={()=>{ setEmail(r.email); setPass("demo1234"); }} style={{
                  width:"100%",padding:"10px 14px",borderRadius:10,cursor:"pointer",
                  background:`${r.color}08`,border:`1px solid ${r.color}25`,
                  fontFamily:"'Bricolage Grotesque',sans-serif",transition:"all 0.15s",
                  display:"flex",alignItems:"center",gap:12,textAlign:"left",
                }}
                  onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=`${r.color}16`; (e.currentTarget as HTMLElement).style.borderColor=`${r.color}50`; }}
                  onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background=`${r.color}08`; (e.currentTarget as HTMLElement).style.borderColor=`${r.color}25`; }}
                >
                  <div style={{ width:34,height:34,borderRadius:"50%",background:`${r.color}20`,border:`1px solid ${r.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:r.color,flexShrink:0 }}>{r.avatar}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:2 }}>
                      <span style={{ fontWeight:700,fontSize:13,color:r.color }}>{r.rol}</span>
                      <span style={{ fontSize:10,color:t.muted }}>·</span>
                      <span style={{ fontSize:12,fontWeight:600,color:t.text }}>{r.nombre}</span>
                    </div>
                    <div style={{ fontSize:10,color:t.muted }}>{r.sede} · {r.acceso}</div>
                  </div>
                  <span style={{ fontSize:12,color:r.color,opacity:0.7 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
