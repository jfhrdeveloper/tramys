"use client";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { iniciales, colorSede } from "@/lib/utils/formatters";

/* ================= DATOS ================= */
const PERMISOS_SISTEMA = [
  "Ver Dashboard General",
  "Ver ambas sedes",
  "Gestionar trabajadores",
  "Editar registros de asistencia",
  "Aprobar adelantos",
  "Ver y cerrar planilla",
  "Gestionar jaladores",
  "Agregar feriados",
  "Exportar reportes",
  "Gestionar roles y accesos",
];

const PERMISOS_ROL: Record<string, boolean[]> = {
  owner:      PERMISOS_SISTEMA.map(() => true),
  encargado:  [false, false, true, true, false, false, false, false, false, false],
  trabajador: PERMISOS_SISTEMA.map(() => false),
};

const ROLES_INFO = {
  owner:      { nombre:"Owner",      color:"#f59e0b", desc:"Acceso total. Única con permisos de pagos y aprobaciones."          },
  encargado:  { nombre:"Encargado",  color:"#6366f1", desc:"Gestiona asistencia de su sede. Sin acceso a planilla ni pagos."    },
  trabajador: { nombre:"Trabajador", color:"#16a34a", desc:"Solo accede a su propia información personal."                      },
};

const MOCK_USUARIOS = [
  { id:"1", nombre:"Dueña (Owner)",   avatar:"DU", rol:"owner"      as const, sede:"Ambas sedes",   sedeColor:"#f59e0b", email:"owner@tramys.pe",  activo:true,  ultimoAcceso:"Hoy 09:41" },
  { id:"2", nombre:"Ricardo Palma",   avatar:"RP", rol:"encargado"  as const, sede:"Santa Anita",   sedeColor:"#C41A3A", email:"rpalma@tramys.pe", activo:true,  ultimoAcceso:"Hoy 08:15" },
  { id:"3", nombre:"Ana Torres",      avatar:"AT", rol:"trabajador" as const, sede:"Santa Anita",   sedeColor:"#C41A3A", email:"atorres@tramys.pe",activo:true,  ultimoAcceso:"Hoy 08:03" },
  { id:"4", nombre:"Marco Díaz",      avatar:"MD", rol:"trabajador" as const, sede:"Puente Piedra", sedeColor:"#1d6fa4", email:"mdiaz@tramys.pe",  activo:true,  ultimoAcceso:"Hoy 08:47" },
  { id:"5", nombre:"Pedro Chávez",    avatar:"PC", rol:"trabajador" as const, sede:"Santa Anita",   sedeColor:"#C41A3A", email:"pchavez@tramys.pe",activo:false, ultimoAcceso:"Vie 18 Abr"},
];

const AUDIT_LOG = [
  { accion:"Cambio de rol",      usuario:"Ricardo Palma",  detalle:"Ascendido a Encargado",   quien:"Owner",      cuando:"Hoy 07:00",    color:"#6366f1" },
  { accion:"Adelanto aprobado",  usuario:"Ana Torres",     detalle:"S/ 300 aprobado",          quien:"Owner",      cuando:"10 Abr 09:15", color:"#16a34a" },
  { accion:"Registro editado",   usuario:"Marco Díaz",     detalle:"Hora entrada corregida",   quien:"Ricardo P.", cuando:"15 Abr 10:20", color:"#C41A3A" },
  { accion:"Permiso registrado", usuario:"Sofía Ríos",     detalle:"Permiso Vie 18 Abr",       quien:"Owner",      cuando:"17 Abr 16:00", color:"#f59e0b" },
  { accion:"Planilla cerrada",   usuario:"Sistema",        detalle:"Planilla Marzo 2026",      quien:"Owner",      cuando:"31 Mar 18:00", color:"#8b8fa8" },
];

type RolType = "owner"|"encargado"|"trabajador";
type Usuario = typeof MOCK_USUARIOS[0];

/* ================= MODAL EDITAR ROL ================= */
function ModalEditarRol({ open, onClose, usuario }: { open:boolean; onClose:()=>void; usuario:Usuario|null }) {
  const [rolSel,  setRolSel]  = useState<RolType>(usuario?.rol ?? "trabajador");
  const [sedeSel, setSedeSel] = useState(usuario?.sede ?? "Santa Anita");
  if (!usuario) return null;

  return (
    <Modal open={open} onClose={onClose} title="Editar Acceso" width={440}>
      <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:20 }}>
        Modificar rol y permisos de {usuario.nombre}
      </div>

      {/* ====== Info usuario ====== */}
      <div style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10, marginBottom:20 }}>
        <Avatar initials={iniciales(usuario.nombre)} size={40} color={ROLES_INFO[usuario.rol].color} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:14 }}>{usuario.nombre}</div>
          <div style={{ fontSize:11, color:"var(--text-muted)" }}>{usuario.email}</div>
        </div>
        <Badge variant={usuario.rol} />
      </div>

      {/* ====== Selector rol ====== */}
      <div style={{ marginBottom:16 }}>
        <div className="section-label">Rol</div>
        <div style={{ display:"flex", gap:8 }}>
          {(Object.entries(ROLES_INFO) as [RolType, typeof ROLES_INFO.owner][]).map(([key, info]) => (
            <button key={key} onClick={() => setRolSel(key)} style={{
              flex:1, padding:"10px 8px", borderRadius:9, cursor:"pointer",
              border:`2px solid ${rolSel===key?info.color:"var(--border)"}`,
              background:rolSel===key?`${info.color}12`:"var(--bg)",
              fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.15s",
            }}>
              <div style={{ fontWeight:700, fontSize:12, color:rolSel===key?info.color:"var(--text-muted)" }}>{info.nombre}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:8 }}>{ROLES_INFO[rolSel].desc}</div>
      </div>

      {/* ====== Sede asignada ====== */}
      {rolSel !== "owner" && (
        <div style={{ marginBottom:20 }}>
          <div className="section-label">Sede asignada</div>
          <div style={{ display:"flex", gap:8 }}>
            {["Santa Anita","Puente Piedra"].map(s => (
              <button key={s} onClick={() => setSedeSel(s)} style={{
                flex:1, padding:"9px 0", borderRadius:9, cursor:"pointer",
                border:`2px solid ${sedeSel===s?"var(--brand)":"var(--border)"}`,
                background:sedeSel===s?"rgba(196,26,58,0.08)":"var(--bg)",
                color:sedeSel===s?"var(--brand)":"var(--text-muted)",
                fontWeight:sedeSel===s?700:500, fontSize:12,
                fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.15s",
              }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"10px 14px", marginBottom:20, fontSize:11, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:6 }}>
        <Icon name="lock" size={12} color="var(--text-muted)" />
        Este cambio quedará registrado en el audit log con fecha y hora.
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button className="btn-outline" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex:2 }}>Guardar cambios</button>
      </div>
    </Modal>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function AccesosPage() {
  const [tab,       setTab]       = useState<"usuarios"|"permisos"|"auditlog">("usuarios");
  const [rolVista,  setRolVista]  = useState<RolType>("owner");
  const [filtroRol, setFiltroRol] = useState<"todos"|RolType>("todos");
  const [editando,  setEditando]  = useState<Usuario|null>(null);

  const usuariosFiltrados = MOCK_USUARIOS.filter(u => filtroRol==="todos" || u.rol===filtroRol);

  /* ==== Definición de tabs con iconos ==== */
  const TABS = [
    { id:"usuarios"  as const, label:"Usuarios",         icon:"trabajadores" as const },
    { id:"permisos"  as const, label:"Permisos por rol", icon:"lock"         as const },
    { id:"auditlog"  as const, label:"Audit Log",        icon:"reportes"     as const },
  ];

  return (
    <>
      <Topbar
        title="Accesos y Roles"
        subtitle={`${MOCK_USUARIOS.length} usuarios · ${MOCK_USUARIOS.filter(u=>u.activo).length} activos · Solo Owner puede editar`}
        onMenuToggle={()=>{}}
      />
      <main className="page-main">

        {/* ====== Tabs de navegación ====== */}
        <div style={{ display:"flex", gap:0, background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, padding:3, alignSelf:"flex-start", marginBottom:16, flexWrap:"wrap" }}>
          {TABS.map(t=>(
            <button
              key={t.id}
              onClick={()=>setTab(t.id)}
              style={{
                padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer",
                background:tab===t.id?"var(--brand)":"transparent",
                color:tab===t.id?"#fff":"var(--text-muted)",
                fontWeight:tab===t.id?700:500, fontSize:12,
                fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.2s",
                display:"inline-flex", alignItems:"center", gap:6, minHeight:36,
              }}
            >
              <Icon name={t.icon} size={13} color={tab===t.id?"#fff":"var(--text-muted)"} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ====== TAB USUARIOS ====== */}
        {tab==="usuarios" && (
          <>
            <div className="grid-stats" style={{ marginBottom:16 }}>
              <StatCard label="Total usuarios"  value={MOCK_USUARIOS.length}                              color="var(--text)"  />
              <StatCard label="Owner"           value={MOCK_USUARIOS.filter(u=>u.rol==="owner").length}   color="#f59e0b"       />
              <StatCard label="Encargados"      value={MOCK_USUARIOS.filter(u=>u.rol==="encargado").length} color="#6366f1"    />
              <StatCard label="Trabajadores"    value={MOCK_USUARIOS.filter(u=>u.rol==="trabajador").length} color="#16a34a"   />
            </div>

            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)" }}>Filtrar:</span>
                {(["todos","owner","encargado","trabajador"] as const).map(r=>(
                  <button key={r} onClick={()=>setFiltroRol(r)} style={{ padding:"5px 14px", borderRadius:99, cursor:"pointer", fontSize:12, fontWeight:600, background:filtroRol===r?"var(--brand)":"var(--bg)", color:filtroRol===r?"#fff":"var(--text-muted)", border:`1px solid ${filtroRol===r?"var(--brand)":"var(--border)"}`, fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.15s", textTransform:"capitalize" }}>
                    {r==="todos"?"Todos":ROLES_INFO[r as RolType]?.nombre??r}
                  </button>
                ))}
                <button className="btn-primary" style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
                  <Icon name="plus" size={13} color="#fff" /> Nuevo usuario
                </button>
              </div>

              <div className="table-wrap">
                <table className="tramys-table">
                  <thead>
                    <tr>{["Usuario","Email","Rol","Sede","Último acceso","Estado","Acciones"].map(h=><th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map(u => (
                      <tr key={u.id} style={{ opacity:u.activo?1:0.6 }}>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <Avatar initials={iniciales(u.nombre)} size={30} color={ROLES_INFO[u.rol].color} />
                            <span style={{ fontWeight:600, fontSize:13 }}>{u.nombre}</span>
                          </div>
                        </td>
                        <td style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{u.email}</td>
                        <td><Badge variant={u.rol} small /></td>
                        <td><span style={{ fontSize:11, fontWeight:600, color:u.sedeColor }}>{u.sede}</span></td>
                        <td style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{u.ultimoAcceso}</td>
                        <td><Badge variant={u.activo?"activo":"inactivo"} small /></td>
                        <td>
                          <div style={{ display:"flex", gap:6 }}>
                            <button className="btn-outline" style={{ fontSize:11, padding:"4px 10px" }} onClick={()=>setEditando(u)}>Editar rol</button>
                            {u.rol!=="owner" && (
                              <button className="btn-ghost" style={{ fontSize:11, padding:"4px 8px", border:"1px solid var(--border)" }}>
                                {u.activo?"Desactivar":"Activar"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ====== TAB PERMISOS ====== */}
        {tab==="permisos" && (
          <>
            {/* ==== Selector rol ==== */}
            <div style={{ display:"flex", gap:10, marginBottom:14 }}>
              {(Object.entries(ROLES_INFO) as [RolType, typeof ROLES_INFO.owner][]).map(([key, info]) => (
                <button key={key} onClick={()=>setRolVista(key)} style={{ flex:1, padding:"10px 14px", borderRadius:10, cursor:"pointer", border:`2px solid ${rolVista===key?info.color:"var(--border)"}`, background:rolVista===key?`${info.color}12`:"var(--card)", fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.15s" }}>
                  <div style={{ fontWeight:700, fontSize:14, color:rolVista===key?info.color:"var(--text)" }}>{info.nombre}</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{MOCK_USUARIOS.filter(u=>u.rol===key).length} usuarios</div>
                </button>
              ))}
            </div>

            {/* ==== Descripción ==== */}
            <div className="card" style={{ borderLeft:`4px solid ${ROLES_INFO[rolVista].color}`, marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:15, color:ROLES_INFO[rolVista].color, marginBottom:4 }}>{ROLES_INFO[rolVista].nombre}</div>
              <div style={{ fontSize:13, color:"var(--text-muted)" }}>{ROLES_INFO[rolVista].desc}</div>
            </div>

            {/* ==== Tabla permisos ==== */}
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", fontWeight:700, fontSize:14 }}>
                Permisos del rol: {ROLES_INFO[rolVista].nombre}
              </div>
              {PERMISOS_SISTEMA.map((permiso, i) => {
                const tiene = PERMISOS_ROL[rolVista][i];
                return (
                  <div key={permiso} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 20px", borderBottom:"1px solid var(--border)", background:i%2===0?"var(--bg)":"var(--card)", transition:"background 0.15s" }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--hover)"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=i%2===0?"var(--bg)":"var(--card)"}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Icon name={tiene?"check_circle":"x_circle"} size={18} color={tiene?"#16a34a":"#8b8fa8"} />
                      <span style={{ fontSize:13, fontWeight:500, color:tiene?"var(--text)":"var(--text-muted)" }}>{permiso}</span>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:tiene?"#16a34a":"#8b8fa8", background:tiene?"rgba(34,197,94,0.1)":"rgba(139,139,168,0.1)", borderRadius:99, padding:"3px 10px" }}>
                      {tiene?"Permitido":"Restringido"}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ====== TAB AUDIT LOG ====== */}
        {tab==="auditlog" && (
          <>
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>Historial de movimientos</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>Registro automático e inalterable</div>
                </div>
                <button className="btn-outline" style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Icon name="download" size={13} /> Exportar log
                </button>
              </div>

              <div style={{ padding:"0 20px" }}>
                {AUDIT_LOG.map((entry, i) => (
                  <div key={i} style={{ display:"flex", gap:14, padding:"14px 0", borderBottom:i<AUDIT_LOG.length-1?"1px solid var(--border)":"none" }}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:entry.color, marginTop:3 }} />
                      {i<AUDIT_LOG.length-1 && <div style={{ width:1, flex:1, background:"var(--border)", marginTop:4, minHeight:24 }} />}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:3, flexWrap:"wrap" }}>
                        <span style={{ fontWeight:700, fontSize:13, color:entry.color }}>{entry.accion}</span>
                        <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"var(--text-muted)" }}>{entry.cuando}</span>
                      </div>
                      <div style={{ fontSize:12, marginBottom:2 }}>
                        <span style={{ fontWeight:600 }}>{entry.usuario}</span> — {entry.detalle}
                      </div>
                      <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                        Realizado por: <span style={{ fontWeight:600, color:"var(--text)" }}>{entry.quien}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 18px", marginTop:12, fontSize:12, color:"var(--text-muted)", display:"flex", gap:8, alignItems:"center" }}>
              <Icon name="lock" size={14} color="var(--text-muted)" />
              El audit log es de solo lectura y no puede ser modificado por ningún usuario, incluyendo el Owner.
            </div>
          </>
        )}
      </main>

      <ModalEditarRol open={!!editando} onClose={()=>setEditando(null)} usuario={editando} />
    </>
  );
}