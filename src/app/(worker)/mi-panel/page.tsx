"use client";

import { useMemo } from "react";
import Link from "next/link";
import { TopbarWorker } from "@/components/layout/TopbarWorker";
import { Icon } from "@/components/ui/Icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { money } from "@/lib/utils/formatters";
import { useWorkerSession } from "@/hooks/useWorkerSession";
import { useData, ingresoDia, isWeekendISO } from "@/components/providers/DataProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";

export default function MiPanelPage() {
  const worker = useWorkerSession();
  const d = useData();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const { sueldoMes, diasTrabMes, tardanzasMes } = useMemo(() => {
    if (!worker) return { sueldoMes: 0, diasTrabMes: 0, tardanzasMes: 0 };
    let total = 0, diasT = 0, tard = 0;
    for (const a of d.asistencia) {
      if (a.workerId !== worker.id) continue;
      const [y, m] = a.fecha.split("-").map(Number);
      if (y !== year || m - 1 !== month) continue;
      total += ingresoDia(a, worker.tarifas, isWeekendISO(a.fecha), esFeriadoOficial(a.fecha).es);
      if (a.estado === "presente" || a.estado === "tardanza") diasT++;
      if (a.estado === "tardanza") tard++;
    }
    return { sueldoMes: total, diasTrabMes: diasT, tardanzasMes: tard };
  }, [worker, d.asistencia, year, month]);

  if (!worker) {
    return (
      <>
        <TopbarWorker title="Mi panel" subtitle="Cargando..." onMenuToggle={()=>{}} />
        <main className="page-main"><div className="card">No se encontró un trabajador activo.</div></main>
      </>
    );
  }

  const sede = d.sedes.find(s => s.id === worker.sedeId);
  const diasTranscurridos = now.getDate();
  const pct = Math.min(100, Math.round((diasTrabMes / Math.max(diasTranscurridos, 1)) * 100));

  const misAdelantos = d.adelantos.filter(a => a.workerId === worker.id);
  const misPermisos  = d.permisos.filter(p => p.workerId === worker.id);
  const pendAdel = misAdelantos.filter(a => a.estado === "pendiente").length;
  const pendPerm = misPermisos.filter(p => p.estado === "pendiente").length;

  const ACCESOS = [
    { label:"Ver mi asistencia", icon:"asistencia", color:"var(--brand)",  href:"/mi-asistencia" },
    { label:"Revisar mi sueldo", icon:"money_bill", color:"#16a34a",       href:"/mi-sueldo" },
    { label:"Solicitar adelanto",icon:"adelantos",  color:"#f59e0b",       href:"/mis-adelantos" },
    { label:"Solicitar permiso", icon:"file_check", color:"#6366f1",       href:"/mis-permisos" },
  ];

  return (
    <>
      <TopbarWorker title="Mi panel" subtitle={`${worker.cargo} · ${sede?.nombre}`} onMenuToggle={()=>{}} />
      <main className="page-main animate-fade-in">

        {/* Hero */}
        <div
          className="card"
          style={{
            background: `linear-gradient(135deg, ${sede?.color ?? "#C41A3A"}, #a01530)`,
            borderRadius: 16, padding: "22px 24px",
            display:"flex", alignItems:"center", gap: 18, marginBottom: 16,
            color:"#fff", border:"none",
            flexWrap:"wrap",
          }}
        >
          <PhotoAvatar src={worker.avatarBase64} initials={(worker.apodo||worker.nombre)[0]} size={60} color="rgba(255,255,255,0.2)" />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily:"'DM Mono',monospace", letterSpacing: 1, marginBottom: 4 }}>HOLA</div>
            <div style={{ fontWeight: 800, fontSize: 22, display:"flex", alignItems:"center", gap: 8, flexWrap:"wrap" }}>
              <span>{worker.apodo || worker.nombre.split(" ")[0]}</span>
              <span style={{ fontSize: 13, background:"rgba(255,255,255,0.22)", padding:"2px 10px", borderRadius: 99 }}>{worker.nombre}</span>
            </div>
            <div style={{ fontSize: 12, color:"rgba(255,255,255,0.8)", marginTop: 4 }}>
              {worker.cargo} · {sede?.nombre} · Turno {worker.turno.entrada}–{worker.turno.salida}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize: 10, color:"rgba(255,255,255,0.65)", fontFamily:"'DM Mono',monospace" }}>HOY</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{now.toLocaleDateString("es-PE", { weekday:"short", day:"numeric", month:"short" })}</div>
          </div>
        </div>

        {/* KPIs del mes (sin banner adicional) */}
        <div className="grid-stats" style={{ marginBottom: 16 }}>
          <div className="card" style={{ padding: "14px 16px", borderLeft: "4px solid var(--brand)" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Sueldo {MESES[month]}</div>
            <HideableAmount value={money(sueldoMes)} size={22} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" />
          </div>
          <div className="card" style={{ padding: "14px 16px", borderLeft: "4px solid #16a34a" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Días trabajados</div>
            <div style={{ fontSize: 22, fontWeight: 800, color:"#16a34a", fontFamily:"'DM Mono',monospace" }}>{diasTrabMes}</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>de {diasTranscurridos} días del mes</div>
          </div>
          <div className="card" style={{ padding: "14px 16px", borderLeft: "4px solid #f59e0b" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Tardanzas</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: tardanzasMes>0 ? "#f59e0b":"#16a34a", fontFamily:"'DM Mono',monospace" }}>{tardanzasMes}</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{MESES[month]}</div>
          </div>
          <div className="card" style={{ padding: "14px 16px", borderLeft: "4px solid #6366f1" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Pendientes</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#6366f1" }}>{pendAdel + pendPerm}</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{pendAdel} adel · {pendPerm} perm</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Progreso */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Tu mes</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom: 14 }}>Progreso de asistencia</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>{diasTrabMes} de {diasTranscurridos} días</span>
              <span style={{ fontWeight: 700, color:"var(--brand)", fontFamily:"'DM Mono',monospace" }}>{pct}%</span>
            </div>
            <ProgressBar value={pct} height={10} showPct={false} />
          </div>

          {/* Accesos rápidos */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Acciones</div>
            <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
              {ACCESOS.map(a => (
                <Link key={a.href} href={a.href} style={{ textDecoration:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap: 12, padding:"11px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9, cursor:"pointer" }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=`${a.color}08`; (e.currentTarget as HTMLElement).style.borderColor=`${a.color}30`; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="var(--bg)"; (e.currentTarget as HTMLElement).style.borderColor="var(--border)"; }}
                  >
                    <Icon name={a.icon} size={18} color={a.color} />
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{a.label}</span>
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
