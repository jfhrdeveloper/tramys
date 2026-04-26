import Link from "next/link";

/* ================= LANDING TRAMYS ================= */
/* Cara pública. Presenta los servicios de trámites por      */
/* entidad estatal y deriva al panel privado por /login.     */

export const metadata = {
  title: "TRAMYS — Trámites para Reniec, Sunarp, Sunat, MTC, Antecedentes, Migraciones y RR.EE.",
  description:
    "Gestionamos tus trámites con las principales entidades del Estado peruano. Rápido, transparente y con seguimiento en tiempo real.",
};

const SERVICIOS: { nombre: string; entidad: string; descripcion: string; color: string; iconPath: React.ReactNode }[] = [
  {
    nombre:      "DNI y certificados",
    entidad:     "Reniec",
    descripcion: "Duplicados, rectificaciones, actas de nacimiento, matrimonio y defunción.",
    color:       "#C41A3A",
    iconPath: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="12" r="2.5" />
        <path d="M14 10h4M14 13h4M14 16h2" strokeLinecap="round" />
      </>
    ),
  },
  {
    nombre:      "Inscripción y partidas",
    entidad:     "Sunarp",
    descripcion: "Vehicular, registral, propiedad inmueble, búsqueda de partidas y CRI.",
    color:       "#1d6fa4",
    iconPath: (
      <>
        <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
        <path d="M16 16l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    nombre:      "RUC y declaraciones",
    entidad:     "Sunat",
    descripcion: "Inscripción de RUC, clave SOL, baja, modificación de datos y guía de remisión.",
    color:       "#16a34a",
    iconPath: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
      </>
    ),
  },
  {
    nombre:      "Brevetes y récord",
    entidad:     "MTC",
    descripcion: "Licencias de conducir, duplicados, canjes, récord del conductor y SOAT.",
    color:       "#f59e0b",
    iconPath: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="8.5" cy="12" r="2" />
        <path d="M13 10h5M13 13h4" strokeLinecap="round" />
      </>
    ),
  },
  {
    nombre:      "Antecedentes",
    entidad:     "Penales · Policiales · Judiciales",
    descripcion: "Tramitamos los tres certificados a nivel nacional con entrega en tu correo.",
    color:       "#6366f1",
    iconPath: (
      <>
        <path d="M12 3l8 4v6c0 4.5-3.5 7.5-8 8-4.5-.5-8-3.5-8-8V7l8-4z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    nombre:      "Pasaportes y movimiento",
    entidad:     "Migraciones",
    descripcion: "Pasaporte electrónico, prórrogas, carnés de extranjería y movimiento migratorio.",
    color:       "#0891b2",
    iconPath: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <circle cx="12" cy="11" r="3" />
        <path d="M9 18h6" strokeLinecap="round" />
      </>
    ),
  },
  {
    nombre:      "Apostilla y legalización",
    entidad:     "Relaciones Exteriores",
    descripcion: "Apostilla de La Haya, legalización de documentos para uso en el extranjero.",
    color:       "#a01530",
    iconPath: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" strokeLinecap="round" />
      </>
    ),
  },
];

const PASOS = [
  { n: "01", titulo: "Solicita el trámite",  texto: "Elige la entidad y el documento que necesitas. Te respondemos por WhatsApp en minutos." },
  { n: "02", titulo: "Envía tus datos",      texto: "Te indicamos exactamente qué necesitamos. Sin colas, sin formularios complicados." },
  { n: "03", titulo: "Nosotros gestionamos", texto: "Vamos a la entidad por ti, pagamos las tasas y hacemos el seguimiento." },
  { n: "04", titulo: "Recibe tu documento",  texto: "Te entregamos físico en sede o digital al correo. Tú decides." },
];

const VENTAJAS = [
  { icon: "⚡", titulo: "Rápido",      texto: "Trámites desde 24 horas según la entidad." },
  { icon: "🔒", titulo: "Confiable",   texto: "+5 años gestionando documentos oficiales." },
  { icon: "📍", titulo: "Presencial",  texto: "Sedes en Santa Anita, Puente Piedra y Lima Centro." },
  { icon: "💬", titulo: "Seguimiento", texto: "Te avisamos en cada paso por WhatsApp." },
];

export default function LandingPage() {
  return (
    <div style={{
      background:  "var(--bg, #f8f7f4)",
      color:       "var(--text, #1a1917)",
      minHeight:   "100vh",
      fontFamily:  "'Bricolage Grotesque', sans-serif",
    }}>

      {/* ================= NAVBAR ================= */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(248,247,244,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border, #e5e2dc)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "14px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #a01530, #C41A3A)",
              color: "#fff", fontWeight: 800, fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>T</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.4, color: "var(--text)" }}>TRAMYS</div>
              <div style={{ fontSize: 9, color: "var(--text-muted, #6b6966)", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                TRÁMITES OFICIALES · PERÚ
              </div>
            </div>
          </Link>

          <nav style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <a href="#servicios" className="nav-hide" style={navLink}>Servicios</a>
            <a href="#proceso"   className="nav-hide" style={navLink}>Cómo trabajamos</a>
            <a href="#contacto"  className="nav-hide" style={navLink}>Contacto</a>
            <Link href="/login" style={ctaBtnSmall}>Acceso interno</Link>
          </nav>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section style={{
        position: "relative",
        background: "linear-gradient(180deg, rgba(196,26,58,0.08) 0%, rgba(196,26,58,0) 70%)",
        padding: "72px 22px 56px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", borderRadius: 999,
            background: "rgba(196,26,58,0.1)", color: "#C41A3A",
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
            marginBottom: 22,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C41A3A" }} />
            Servicio activo en 3 sedes
          </div>

          <h1 style={{
            fontSize: "clamp(34px, 6vw, 64px)",
            fontWeight: 800, lineHeight: 1.05,
            letterSpacing: -1.5, margin: 0,
          }}>
            Trámites del Estado, <br />
            <span style={{
              background: "linear-gradient(90deg, #a01530, #C41A3A, #e8304d)",
              WebkitBackgroundClip: "text", backgroundClip: "text",
              color: "transparent",
            }}>
              hechos por nosotros.
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2vw, 19px)",
            color: "var(--text-muted, #6b6966)",
            maxWidth: 680, margin: "22px auto 0",
            lineHeight: 1.55,
          }}>
            Gestionamos tus documentos en <b>Reniec, Sunarp, Sunat, MTC, Antecedentes, Migraciones</b> y <b>RR.EE.</b>
            Sin colas, sin perder el día. Te entregamos el documento listo.
          </p>

          <div style={{
            marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
          }}>
            <a href="#servicios" style={ctaBtn}>Ver servicios</a>
            <a
              href="https://wa.me/51999999999"
              target="_blank" rel="noreferrer"
              style={ctaBtnGhost}
            >
              💬 Escríbenos por WhatsApp
            </a>
          </div>

          <div style={{
            marginTop: 44, display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap",
            color: "var(--text-muted, #6b6966)", fontSize: 12,
            fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
          }}>
            <span>+5 AÑOS DE EXPERIENCIA</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>+8.000 TRÁMITES GESTIONADOS</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>3 SEDES EN LIMA</span>
          </div>
        </div>
      </section>

      {/* ================= SERVICIOS ================= */}
      <section id="servicios" style={{ padding: "56px 22px 64px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={sectionLabel}>NUESTROS SERVICIOS</div>
            <h2 style={sectionTitle}>Cobertura completa de entidades</h2>
            <p style={sectionSubtitle}>
              Selecciona la entidad y te indicamos los documentos disponibles, requisitos y plazos.
            </p>
          </div>

          <div className="serv-grid" style={{
            display: "grid", gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}>
            {SERVICIOS.map(s => (
              <article
                key={s.entidad}
                style={{
                  background: "var(--card, #fff)",
                  border: "1px solid var(--border, #e5e2dc)",
                  borderRadius: 16,
                  padding: 22,
                  borderLeft: `4px solid ${s.color}`,
                  display: "flex", flexDirection: "column", gap: 10,
                  transition: "transform .18s ease, box-shadow .18s ease",
                }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: `${s.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth={1.8} strokeLinecap="round">
                    {s.iconPath}
                  </svg>
                </div>
                <div style={{
                  fontSize: 10, color: s.color, fontWeight: 800,
                  fontFamily: "'DM Mono', monospace", letterSpacing: 1, textTransform: "uppercase",
                }}>
                  {s.entidad}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                  {s.nombre}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted, #6b6966)", lineHeight: 1.5 }}>
                  {s.descripcion}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROCESO ================= */}
      <section id="proceso" style={{
        padding: "64px 22px",
        background: "var(--card, #fff)",
        borderTop: "1px solid var(--border, #e5e2dc)",
        borderBottom: "1px solid var(--border, #e5e2dc)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={sectionLabel}>CÓMO TRABAJAMOS</div>
            <h2 style={sectionTitle}>4 pasos. Tú no haces nada.</h2>
          </div>

          <div style={{
            display: "grid", gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}>
            {PASOS.map(p => (
              <div key={p.n} style={{
                padding: 22, borderRadius: 14,
                border: "1px solid var(--border, #e5e2dc)",
                background: "var(--bg, #f8f7f4)",
              }}>
                <div style={{
                  fontSize: 11, color: "#C41A3A", fontWeight: 800,
                  fontFamily: "'DM Mono', monospace", letterSpacing: 1.5,
                }}>
                  PASO {p.n}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, marginTop: 6 }}>{p.titulo}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted, #6b6966)", marginTop: 6, lineHeight: 1.5 }}>
                  {p.texto}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VENTAJAS ================= */}
      <section style={{ padding: "64px 22px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={sectionLabel}>POR QUÉ ELEGIRNOS</div>
            <h2 style={sectionTitle}>Confianza, seguimiento y rapidez</h2>
          </div>

          <div style={{
            display: "grid", gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}>
            {VENTAJAS.map(v => (
              <div key={v.titulo} style={{
                padding: 22, borderRadius: 14,
                border: "1px solid var(--border, #e5e2dc)",
                background: "var(--card, #fff)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{v.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{v.titulo}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted, #6b6966)", marginTop: 6, lineHeight: 1.5 }}>
                  {v.texto}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section id="contacto" style={{
        padding: "64px 22px",
        background: "linear-gradient(135deg, #a01530 0%, #C41A3A 50%, #e8304d 100%)",
        color: "#fff",
      }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 800, lineHeight: 1.1,
            margin: 0, letterSpacing: -1,
          }}>
            ¿Listo para resolver tu trámite?
          </h2>
          <p style={{ fontSize: 16, opacity: 0.9, marginTop: 14, maxWidth: 580, marginInline: "auto" }}>
            Contáctanos por WhatsApp y te respondemos al instante. Cotización gratuita.
          </p>

          <div style={{
            marginTop: 30, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
          }}>
            <a
              href="https://wa.me/51999999999"
              target="_blank" rel="noreferrer"
              style={{
                background: "#fff", color: "#C41A3A",
                padding: "14px 26px", borderRadius: 10,
                fontWeight: 800, fontSize: 15, textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              💬 Iniciar conversación
            </a>
            <a
              href="tel:+51999999999"
              style={{
                background: "rgba(255,255,255,0.12)", color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.45)",
                padding: "14px 26px", borderRadius: 10,
                fontWeight: 700, fontSize: 15, textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              📞 Llamar ahora
            </a>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={{
        padding: "32px 22px",
        background: "var(--card, #fff)",
        borderTop: "1px solid var(--border, #e5e2dc)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 16,
          fontSize: 12, color: "var(--text-muted, #6b6966)",
          fontFamily: "'DM Mono', monospace",
        }}>
          <div>© {new Date().getFullYear()} TRAMYS · Todos los derechos reservados</div>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <a href="#servicios" style={footerLink}>Servicios</a>
            <a href="#proceso"   style={footerLink}>Proceso</a>
            <Link href="/login"  style={footerLink}>Acceso interno</Link>
          </div>
        </div>
      </footer>

      {/* ====== Estilos responsivos extra ====== */}
      <style>{`
        @media (max-width: 720px) {
          .nav-hide { display: none !important; }
        }
        article:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.06); }
      `}</style>
    </div>
  );
}

/* ====== Estilos compartidos ====== */
const navLink: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: "var(--text-muted, #6b6966)",
  textDecoration: "none",
};
const ctaBtnSmall: React.CSSProperties = {
  background: "var(--text, #1a1917)", color: "#fff",
  padding: "8px 16px", borderRadius: 8,
  fontSize: 12, fontWeight: 700, textDecoration: "none",
};
const ctaBtn: React.CSSProperties = {
  background: "#C41A3A", color: "#fff",
  padding: "14px 26px", borderRadius: 10,
  fontWeight: 800, fontSize: 15, textDecoration: "none",
  boxShadow: "0 8px 22px rgba(196,26,58,0.28)",
};
const ctaBtnGhost: React.CSSProperties = {
  background: "transparent", color: "var(--text, #1a1917)",
  border: "1.5px solid var(--border, #e5e2dc)",
  padding: "14px 26px", borderRadius: 10,
  fontWeight: 700, fontSize: 15, textDecoration: "none",
  display: "inline-flex", alignItems: "center", gap: 8,
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, color: "#C41A3A", fontWeight: 800,
  fontFamily: "'DM Mono', monospace", letterSpacing: 1.5,
  textTransform: "uppercase", marginBottom: 10,
};
const sectionTitle: React.CSSProperties = {
  fontSize: "clamp(26px, 3.5vw, 38px)",
  fontWeight: 800, lineHeight: 1.1, letterSpacing: -1,
  margin: 0,
};
const sectionSubtitle: React.CSSProperties = {
  fontSize: 15, color: "var(--text-muted, #6b6966)",
  marginTop: 12, maxWidth: 600, marginInline: "auto",
  lineHeight: 1.5,
};
const footerLink: React.CSSProperties = {
  color: "var(--text-muted, #6b6966)", textDecoration: "none",
};
