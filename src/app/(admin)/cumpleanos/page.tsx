"use client";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Avatar } from "@/components/ui/Avatar";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { iniciales } from "@/lib/utils/formatters";

/* ================= DATOS ================= */
const FERIADOS_DATA = [
  { mes:"Abril",     num:4,  items:[{ nombre:"Jueves Santo",  fecha:"Jue 17 Abr", tipo:"nacional" as const, pagado:true  },{ nombre:"Viernes Santo",    fecha:"Vie 18 Abr", tipo:"nacional" as const, pagado:true  }] },
  { mes:"Mayo",      num:5,  items:[{ nombre:"Día del Trabajo",fecha:"Jue 01 May", tipo:"nacional" as const, pagado:true  },{ nombre:"Día de la Madre",  fecha:"Sáb 10 May", tipo:"nacional" as const, pagado:false }] },
  { mes:"Julio",     num:7,  items:[{ nombre:"Fiestas Patrias",fecha:"Mar 28 Jul", tipo:"nacional" as const, pagado:true  },{ nombre:"Fiestas Patrias",   fecha:"Mié 29 Jul", tipo:"nacional" as const, pagado:true  }] },
  { mes:"Diciembre", num:12, items:[{ nombre:"Navidad",        fecha:"Jue 25 Dic", tipo:"nacional" as const, pagado:true  },{ nombre:"Día no laborable", fecha:"Mié 31 Dic", tipo:"empresa"  as const, pagado:false }] },
];

const CUMPLEANOS_DATA = [
  { mes:"Abril",    num:4,  items:[{ nombre:"Marco Díaz",    avatar:"MD", color:"#1d6fa4", fecha:"19 Abr", sede:"Puente Piedra", cargo:"Asistente", hoy:true  },{ nombre:"Rosa Huanca",   avatar:"RH", color:"#1d6fa4", fecha:"25 Abr", sede:"Puente Piedra", cargo:"Operadora",  hoy:false }] },
  { mes:"Mayo",     num:5,  items:[{ nombre:"Ana Torres",    avatar:"AT", color:"#C41A3A", fecha:"03 May", sede:"Santa Anita",   cargo:"Asistente", hoy:false },{ nombre:"Carlos Ramos",  avatar:"CR", color:"#C41A3A", fecha:"14 May", sede:"Santa Anita",   cargo:"Asistente",  hoy:false }] },
  { mes:"Junio",    num:6,  items:[{ nombre:"Carmen Flores", avatar:"CF", color:"#1d6fa4", fecha:"11 Jun", sede:"Puente Piedra", cargo:"Operadora", hoy:false },{ nombre:"Luis Vera",     avatar:"LV", color:"#C41A3A", fecha:"22 Jun", sede:"Santa Anita",   cargo:"Asistente",  hoy:false }] },
  { mes:"Octubre",  num:10, items:[{ nombre:"Pedro Chávez",  avatar:"PC", color:"#C41A3A", fecha:"30 Oct", sede:"Santa Anita",   cargo:"Operador",  hoy:false }] },
];

/* ================= ÁRBOL GENÉRICO ================= */
function ArbolMeses<T>({
  grupos,
  colorNodo,
  renderItem,
}: {
  grupos: { mes:string; num:number; items:T[] }[];
  colorNodo: string;
  renderItem: (item:T, i:number) => React.ReactNode;
}) {
  const [abiertos, setAbiertos] = useState<Record<string,boolean>>(
    () => Object.fromEntries(grupos.map(g=>[g.mes, true]))
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {grupos.map((g, gi) => (
        <div key={g.mes}>
          {/* Nodo mes */}
          <div
            onClick={() => setAbiertos(p=>({...p,[g.mes]:!p[g.mes]}))}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, cursor:"pointer", background: abiertos[g.mes] ? `${colorNodo}10` : "var(--bg)", border:`1px solid ${abiertos[g.mes]?`${colorNodo}30`:"var(--border)"}`, marginBottom:abiertos[g.mes]?6:0, transition:"all 0.15s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=`${colorNodo}10`}
            onMouseLeave={e=>{ if(!abiertos[g.mes])(e.currentTarget as HTMLElement).style.background="var(--bg)"; }}
          >
            <span style={{ fontSize:11, color:colorNodo, display:"inline-block", transform:abiertos[g.mes]?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.2s", fontFamily:"'DM Mono',monospace" }}>▶</span>
            <div style={{ width:16, height:1, background:"var(--border)" }} />
            <div style={{ width:28, height:28, borderRadius:8, background:colorNodo, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:12, flexShrink:0 }}>{g.num}</div>
            <span style={{ fontWeight:700, fontSize:15 }}>{g.mes}</span>
            <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{g.items.length} {g.items.length===1?"registro":"registros"}</span>
          </div>

          {/* Hijos */}
          {abiertos[g.mes] && (
            <div style={{ paddingLeft:42, display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
              {g.items.map((item, ii) => (
                <div key={ii} style={{ display:"flex", alignItems:"stretch", gap:0 }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:20, flexShrink:0 }}>
                    <div style={{ width:1, flex:1, background:"var(--border)" }} />
                    {ii===g.items.length-1 && <div style={{ width:1, flex:1, background:"transparent" }} />}
                  </div>
                  <div style={{ width:14, height:1, background:"var(--border)", marginTop:20, flexShrink:0 }} />
                  <div style={{ flex:1 }}>{renderItem(item, ii)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================= MODAL NUEVO FERIADO ================= */
function ModalFeriado({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const [nombre, setNombre] = useState("");
  const [fecha,  setFecha]  = useState("");
  const [tipo,   setTipo]   = useState<"nacional"|"empresa">("nacional");
  const [pagado, setPagado] = useState(true);

  return (
    <Modal open={open} onClose={onClose} title="Agregar Feriado / Día No Laborable" width={400}>
      <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
        <div>
          <div className="section-label">Nombre del feriado</div>
          <input className="input-base" placeholder="Ej: Día del Trabajo" value={nombre} onChange={e=>setNombre(e.target.value)} />
        </div>
        <div>
          <div className="section-label">Fecha</div>
          <input type="date" className="input-base" value={fecha} onChange={e=>setFecha(e.target.value)} />
        </div>
        <div>
          <div className="section-label">Tipo</div>
          <div style={{ display:"flex", gap:8 }}>
            {(["nacional","empresa"] as const).map(t=>(
              <button key={t} onClick={()=>setTipo(t)} style={{ flex:1, padding:"9px 0", borderRadius:9, cursor:"pointer", border:`2px solid ${tipo===t?"var(--brand)":"var(--border)"}`, background:tipo===t?"rgba(196,26,58,0.08)":"var(--bg)", color:tipo===t?"var(--brand)":"var(--text-muted)", fontWeight:tipo===t?700:500, fontSize:12, fontFamily:"'Bricolage Grotesque',sans-serif", textTransform:"capitalize", transition:"all 0.15s" }}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="section-label">¿Es día pagado?</div>
          <div style={{ display:"flex", gap:8 }}>
            {[true,false].map(v=>(
              <button key={String(v)} onClick={()=>setPagado(v)} style={{ flex:1, padding:"9px 0", borderRadius:9, cursor:"pointer", border:`2px solid ${pagado===v?"var(--brand)":"var(--border)"}`, background:pagado===v?"rgba(196,26,58,0.08)":"var(--bg)", color:pagado===v?"var(--brand)":"var(--text-muted)", fontWeight:pagado===v?700:500, fontSize:12, fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.15s" }}>{v?"Sí, pagado":"No pagado"}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button className="btn-outline" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex:2 }}>Guardar feriado</button>
      </div>
    </Modal>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function FeriadosCumplePage() {
  const [tab,          setTab]          = useState<"feriados"|"cumpleanos">("feriados");
  const [modalFeriado, setModalFeriado] = useState(false);

  const totalFeriados  = FERIADOS_DATA.reduce((a,g)=>a+g.items.length,0);
  const feriadosPagados= FERIADOS_DATA.reduce((a,g)=>a+g.items.filter(i=>i.pagado).length,0);
  const cumpleHoy      = CUMPLEANOS_DATA.flatMap(g=>g.items).filter(c=>c.hoy);

  const TABS = [
    { id:"feriados"   as const, label:"🗓️ Feriados"   },
    { id:"cumpleanos" as const, label:"🎂 Cumpleaños" },
  ];

  return (
    <>
      <Topbar
        title={tab==="feriados"?"Feriados y Días No Laborables":"Cumpleaños"}
        subtitle={tab==="feriados"?`${totalFeriados} fechas registradas · 2026`:`${CUMPLEANOS_DATA.reduce((a,g)=>a+g.items.length,0)} trabajadores`}
        onMenuToggle={()=>{}}
      />
      <main className="page-main">

        {/* Alerta cumpleaños hoy */}
        {tab==="cumpleanos" && cumpleHoy.length>0 && (
          <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <span style={{ fontSize:26 }}>🎂</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#d97706" }}>¡Cumpleaños hoy!</div>
              <div style={{ fontSize:12, color:"var(--text-muted)" }}>{cumpleHoy.map(c=>c.nombre).join(", ")} celebra hoy.</div>
            </div>
            <button style={{ background:"#d97706", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Bricolage Grotesque',sans-serif" }}>🎉 Felicitar</button>
          </div>
        )}

        {/* Tabs + acciones */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", gap:0, background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, padding:3 }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                padding:"7px 18px", borderRadius:8, border:"none", cursor:"pointer",
                background:tab===t.id?"var(--brand)":"transparent",
                color:tab===t.id?"#fff":"var(--text-muted)",
                fontWeight:tab===t.id?700:500, fontSize:12,
                fontFamily:"'Bricolage Grotesque',sans-serif", transition:"all 0.2s",
              }}>{t.label}</button>
            ))}
          </div>
          {tab==="feriados" && (
            <button className="btn-primary" style={{ display:"flex", alignItems:"center", gap:6 }} onClick={()=>setModalFeriado(true)}>
              <Icon name="plus" size={13} color="#fff" /> Agregar feriado
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom:16 }}>
          {tab==="feriados"
            ? [
                { label:"Total feriados 2026",  value:totalFeriados,       color:"#6366f1" },
                { label:"Feriados pagados",      value:feriadosPagados,     color:"#16a34a" },
                { label:"Días no pagados",       value:totalFeriados-feriadosPagados, color:"var(--brand)" },
              ].map(s=><StatCard key={s.label} label={s.label} value={s.value} color={s.color} accent="left" />)
            : [
                { label:"Total trabajadores",  value:CUMPLEANOS_DATA.reduce((a,g)=>a+g.items.length,0), color:"var(--brand)" },
                { label:"Próximo cumpleaños",  value:"25 Abr",   color:"#f59e0b" },
                { label:"Este mes (Abril)",    value:CUMPLEANOS_DATA.find(g=>g.mes==="Abril")?.items.length??0, color:"#16a34a" },
              ].map(s=><StatCard key={s.label} label={s.label} value={s.value} color={s.color} accent="left" />)
          }
        </div>

        {/* Árbol */}
        <div className="card">
          <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>
            {tab==="feriados"?"Árbol de Feriados — 2026":"Árbol de Cumpleaños — Por mes"}
          </div>
          <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom:20 }}>
            {tab==="feriados"?"Todos los feriados del año · Haz clic en el mes para expandir":"Trabajadores ordenados por mes de cumpleaños"}
          </div>

          {tab==="feriados" ? (
            <ArbolMeses
              grupos={FERIADOS_DATA}
              colorNodo="#6366f1"
              renderItem={(item, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:10, background:"var(--card)", border:"1px solid var(--border)", transition:"box-shadow 0.15s" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow="0 2px 12px rgba(0,0,0,0.08)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow="none"}
                >
                  <span style={{ fontSize:20 }}>🗓️</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{item.nombre}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginTop:2 }}>{item.fecha}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontWeight:600, background:item.tipo==="nacional"?"rgba(99,102,241,0.12)":"rgba(196,26,58,0.12)", color:item.tipo==="nacional"?"#6366f1":"var(--brand)", borderRadius:99, padding:"3px 9px" }}>{item.tipo==="nacional"?"Nacional":"Empresa"}</span>
                    <span style={{ fontSize:10, fontWeight:600, background:item.pagado?"rgba(34,197,94,0.12)":"rgba(139,139,168,0.12)", color:item.pagado?"#16a34a":"#8b8fa8", borderRadius:99, padding:"3px 9px" }}>{item.pagado?"💰 Pagado":"No pagado"}</span>
                    <button className="btn-ghost" style={{ fontSize:10, padding:"3px 10px", display:"flex", alignItems:"center", gap:4 }}>
                      <Icon name="edit" size={11} /> Editar
                    </button>
                  </div>
                </div>
              )}
            />
          ) : (
            <ArbolMeses
              grupos={CUMPLEANOS_DATA}
              colorNodo="#f59e0b"
              renderItem={(item, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:10, background:item.hoy?"rgba(245,158,11,0.06)":"var(--card)", border:`1px solid ${item.hoy?"rgba(245,158,11,0.35)":"var(--border)"}`, transition:"box-shadow 0.15s" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow="0 2px 12px rgba(0,0,0,0.08)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow="none"}
                >
                  <Avatar initials={item.avatar} size={36} color={item.color} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontWeight:700, fontSize:14 }}>{item.nombre}</span>
                      {item.hoy && <span style={{ fontSize:11, fontWeight:700, color:"#d97706", background:"rgba(245,158,11,0.12)", borderRadius:99, padding:"2px 8px" }}>🎂 ¡Hoy!</span>}
                    </div>
                    <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>
                      {item.cargo} · <span style={{ color:item.color, fontWeight:600 }}>{item.sede}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontWeight:700, fontSize:14, fontFamily:"'DM Mono',monospace" }}>{item.fecha}</div>
                    {item.hoy && (
                      <button style={{ marginTop:4, background:"#d97706", color:"#fff", border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:10, fontWeight:600, fontFamily:"'Bricolage Grotesque',sans-serif" }}>
                        Felicitar 🎉
                      </button>
                    )}
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </main>

      <ModalFeriado open={modalFeriado} onClose={()=>setModalFeriado(false)} />
    </>
  );
}