"use client";
import { TopbarWorker } from "@/components/layout/TopbarWorker";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Icon } from "@/components/ui/Icons";
import { money } from "@/lib/utils/formatters";
import Link from "next/link";

/* ================= DATOS MOCK ================= */
const WORKER = {
  nombre:"Ana Torres", cargo:"Asistente", sede:"Santa Anita",
  turno:"08:00 – 18:00", sueldo:1400, diasTrab:18,
  tardanzas:1, adelantos:0,
};

export default function MiPanelPage() {
  const descTard  = WORKER.tardanzas * 22.5;
  const neto      = WORKER.sueldo - descTard - WORKER.adelantos;
  const pct       = Math.round((WORKER.diasTrab / 22) * 100);

  const ACCESOS = [
    { label:"Ver mi historial de asistencia", icon:"asistencia", color:"var(--brand)",  href:"/mi-asistencia" },
    { label:"Revisar mi sueldo del mes",       icon:"sueldo",     color:"#16a34a",       href:"/mi-sueldo"     },
    { label:"Solicitar adelanto de sueldo",    icon:"adelantos",  color:"#f59e0b",       href:"/mis-adelantos" },
    { label:"Solicitar permiso o justificar",  icon:"file_check", color:"#6366f1",       href:"/mis-permisos"  },
  ];

  return (
    <>
      <TopbarWorker title="Mi Panel" subtitle={`${WORKER.sede} · Dom 19 Abr 2026`} onMenuToggle={()=>{}} />
      <main className="page-main">

        {/* Hero bienvenida */}
        <div style={{ background:"linear-gradient(135deg,#a01530,#C41A3A)", borderRadius:16, padding:"24px 28px", display:"flex", alignItems:"center", gap:20, marginBottom:16, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", right:-30, top:-30, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
          <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:20, color:"#fff", flexShrink:0 }}>
            {WORKER.nombre.split(" ").map(n=>n[0]).join("")}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", fontFamily:"'DM Mono',monospace", marginBottom:4 }}>BIENVENIDA DE VUELTA</div>
            <div style={{ fontWeight:800, fontSize:22, color:"#fff", marginBottom:4 }}>{WORKER.nombre} 👋</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{WORKER.cargo} · {WORKER.sede} · Turno {WORKER.turno}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontFamily:"'DM Mono',monospace", marginBottom:4 }}>HOY</div>
            <div style={{ fontWeight:800, fontSize:16, color:"#fff" }}>Dom 19 Abr</div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6, justifyContent:"flex-end" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e" }} />
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.8)", fontWeight:600 }}>En turno</span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid-stats" style={{ marginBottom:16 }}>
          <StatCard label="Sueldo base"    value={money(WORKER.sueldo)}  color="var(--brand)"  sub="Abril 2026"          accent="top" />
          <StatCard label="Días trabajados"value={`${WORKER.diasTrab}/22`} color="#16a34a"     sub={`${pct}% del mes`}   accent="top" />
          <StatCard label="Tardanzas"      value={WORKER.tardanzas}       color={WORKER.tardanzas>0?"var(--brand)":"#16a34a"} sub="Este mes" accent="top" />
          <StatCard label="Neto estimado"  value={money(neto)}            color="#16a34a"       sub="Descuentos aplicados" accent="top" />
        </div>

        {/* Progreso + accesos */}
        <div className="grid-2">

          {/* Progreso del mes */}
          <div className="card">
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>Progreso del mes</div>
            <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom:16 }}>Días trabajados vs días hábiles</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:500 }}>{WORKER.diasTrab} de 22 días</span>
              <span style={{ fontWeight:700, color:"var(--brand)", fontFamily:"'DM Mono',monospace" }}>{pct}%</span>
            </div>
            <ProgressBar value={pct} height={10} showPct={false} />
            <div className="grid-3" style={{ marginTop:16, gap:8 }}>
              {[["Días restantes","4","var(--text)"],["Feriados","3","#6366f1"],["Permisos","1","#d97706"]].map(([l,v,c])=>(
                <div key={String(l)} style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, padding:"10px", textAlign:"center" }}>
                  <div style={{ fontSize:18, fontWeight:800, color:String(c) }}>{v}</div>
                  <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Accesos rápidos */}
          <div className="card">
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>Acciones rápidas</div>
            <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom:14 }}>Lo que puedes hacer desde tu panel</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {ACCESOS.map(a => (
                <Link key={a.href} href={a.href} style={{ textDecoration:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:9, cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=`${a.color}08`; (e.currentTarget as HTMLElement).style.borderColor=`${a.color}30`; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="var(--bg)"; (e.currentTarget as HTMLElement).style.borderColor="var(--border)"; }}
                  >
                    <Icon name={a.icon} size={18} color={a.color} />
                    <span style={{ fontSize:13, fontWeight:500, flex:1, color:"var(--text)" }}>{a.label}</span>
                    <Icon name="chevron_right" size={14} color="var(--text-muted)" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}