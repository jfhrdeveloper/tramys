"use client";

/* ================= MIS ALERTAS (TRABAJADOR) ================= */
/* Centraliza notificaciones útiles para el trabajador:        */
/*  - solicitudes resueltas (adelantos / permisos)             */
/*  - tardanzas del mes                                        */
/*  - eventos próximos (cumpleaños propio + feriados)          */

import { useMemo, useState } from "react";
import { TopbarWorker } from "@/components/layout/TopbarWorker";
import { Icon } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { money } from "@/lib/utils/formatters";
import { useWorkerSession } from "@/hooks/useWorkerSession";
import { useData } from "@/components/providers/DataProvider";
import { feriadosParaAnio } from "@/lib/utils/peruHolidays";

type Filtro = "todos" | "solicitudes" | "asistencia" | "eventos";

interface Alerta {
  id: string;
  fechaOrden: string;          // ISO yyyy-mm-dd usado para sort
  fechaLabel: string;          // texto humano
  titulo: string;
  detalle: string;
  icon: string;
  color: string;
  badge?: { variant: "presente"|"tardanza"|"ausente"|"permiso"|"feriado"|"pendiente"|"aprobado"|"rechazado"|"pagado"; text?: string };
  monto?: number;
  categoria: "solicitudes" | "asistencia" | "eventos";
  prioridad: number;           // mayor = más arriba si misma fecha
}

const FILTROS: { id: Filtro; label: string; color: string; icon: string }[] = [
  { id:"todos",       label:"Todas",       color:"var(--brand)", icon:"bell"        },
  { id:"solicitudes", label:"Solicitudes", color:"#16a34a",      icon:"file_check"  },
  { id:"asistencia",  label:"Asistencia",  color:"#f59e0b",      icon:"asistencia"  },
  { id:"eventos",     label:"Eventos",     color:"#6366f1",      icon:"calendar"    },
];

function diffDays(isoFuturo: string, isoHoy: string): number {
  const a = new Date(isoFuturo + "T00:00:00").getTime();
  const b = new Date(isoHoy + "T00:00:00").getTime();
  return Math.round((a - b) / 86400000);
}
function fechaHumana(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-PE", { day:"numeric", month:"short" });
}

export default function MisAlertasPage() {
  const worker = useWorkerSession();
  const d = useData();
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const alertas: Alerta[] = useMemo(() => {
    if (!worker) return [];
    const hoyISO = new Date().toISOString().slice(0, 10);
    const arr: Alerta[] = [];

    /* ====== Adelantos resueltos ====== */
    for (const a of d.adelantos) {
      if (a.workerId !== worker.id) continue;
      if (a.estado === "pendiente") continue;
      arr.push({
        id: `adel_${a.id}`,
        fechaOrden: a.fecha,
        fechaLabel: fechaHumana(a.fecha),
        titulo: a.estado === "aprobado" ? "Adelanto aprobado" : "Adelanto rechazado",
        detalle: a.motivo,
        icon: "hand_coin",
        color: a.estado === "aprobado" ? "#16a34a" : "#8b8fa8",
        badge: { variant: a.estado as "aprobado"|"rechazado" },
        monto: a.monto,
        categoria: "solicitudes",
        prioridad: 5,
      });
    }
    /* ====== Adelantos pendientes (informativo) ====== */
    for (const a of d.adelantos) {
      if (a.workerId !== worker.id || a.estado !== "pendiente") continue;
      arr.push({
        id: `adelp_${a.id}`,
        fechaOrden: a.fecha,
        fechaLabel: fechaHumana(a.fecha),
        titulo: "Adelanto en revisión",
        detalle: a.motivo,
        icon: "hand_coin",
        color: "#d97706",
        badge: { variant: "pendiente" },
        monto: a.monto,
        categoria: "solicitudes",
        prioridad: 6,
      });
    }

    /* ====== Permisos resueltos + pendientes ====== */
    for (const p of d.permisos) {
      if (p.workerId !== worker.id) continue;
      const esPend = p.estado === "pendiente";
      arr.push({
        id: `perm_${p.id}`,
        fechaOrden: p.fecha,
        fechaLabel: fechaHumana(p.fecha),
        titulo: esPend
          ? "Permiso en revisión"
          : p.estado === "aprobado" ? "Permiso aprobado" : "Permiso rechazado",
        detalle: `${p.tipo.charAt(0).toUpperCase()}${p.tipo.slice(1)} · ${p.motivo}`,
        icon: "file_check",
        color: esPend ? "#d97706" : p.estado === "aprobado" ? "#16a34a" : "#8b8fa8",
        badge: { variant: p.estado as "pendiente"|"aprobado"|"rechazado" },
        categoria: "solicitudes",
        prioridad: esPend ? 6 : 5,
      });
    }

    /* ====== Tardanzas del mes ====== */
    const now = new Date();
    for (const a of d.asistencia) {
      if (a.workerId !== worker.id) continue;
      if (a.estado !== "tardanza") continue;
      const [y, m] = a.fecha.split("-").map(Number);
      if (y !== now.getFullYear() || m - 1 !== now.getMonth()) continue;
      arr.push({
        id: `tard_${a.id}`,
        fechaOrden: a.fecha,
        fechaLabel: fechaHumana(a.fecha),
        titulo: "Llegaste tarde",
        detalle: `Marcaste entrada ${a.entrada ?? "—"}`,
        icon: "alert_circle",
        color: "#f59e0b",
        badge: { variant: "tardanza" },
        categoria: "asistencia",
        prioridad: 4,
      });
    }

    /* ====== Cumpleaños propio (próximo) ====== */
    const cumpleProp = d.eventos.find(e => e.tipo === "cumpleanos" && e.workerId === worker.id);
    if (cumpleProp) {
      const yearAct = now.getFullYear();
      const mmdd = cumpleProp.date.slice(5);
      const isoEsteAnio = `${yearAct}-${mmdd}`;
      const candidato = isoEsteAnio >= hoyISO ? isoEsteAnio : `${yearAct + 1}-${mmdd}`;
      const dias = diffDays(candidato, hoyISO);
      if (dias <= 30) {
        arr.push({
          id: `cumple_${cumpleProp.id}`,
          fechaOrden: candidato,
          fechaLabel: fechaHumana(candidato),
          titulo: dias === 0 ? "¡Hoy es tu cumpleaños!" : `Tu cumpleaños · en ${dias} día${dias === 1 ? "" : "s"}`,
          detalle: cumpleProp.nombre,
          icon: "cake",
          color: "#f59e0b",
          categoria: "eventos",
          prioridad: dias === 0 ? 10 : 8,
        });
      }
    }

    /* ====== Feriados oficiales próximos (30 días) ====== */
    if (d.mostrarFeriadosOficiales) {
      const yearAct = now.getFullYear();
      for (const f of feriadosParaAnio(yearAct).concat(feriadosParaAnio(yearAct + 1))) {
        if (f.date < hoyISO) continue;
        const dias = diffDays(f.date, hoyISO);
        if (dias > 30) continue;
        arr.push({
          id: `fer_${f.date}`,
          fechaOrden: f.date,
          fechaLabel: fechaHumana(f.date),
          titulo: dias === 0 ? "Feriado · hoy" : `Feriado · en ${dias} día${dias === 1 ? "" : "s"}`,
          detalle: f.nombre,
          icon: "calendar",
          color: "#6366f1",
          badge: { variant: "feriado" },
          categoria: "eventos",
          prioridad: dias <= 3 ? 7 : 3,
        });
      }
    }

    /* ====== Eventos de empresa / otros próximos ====== */
    for (const e of d.eventos) {
      if (e.tipo === "cumpleanos") continue;
      if (e.date < hoyISO) continue;
      const dias = diffDays(e.date, hoyISO);
      if (dias > 30) continue;
      arr.push({
        id: `evt_${e.id}`,
        fechaOrden: e.date,
        fechaLabel: fechaHumana(e.date),
        titulo: dias === 0 ? `${e.nombre} · hoy` : `${e.nombre} · en ${dias} día${dias === 1 ? "" : "s"}`,
        detalle: e.descripcion ?? (e.tipo === "feriado-empresa" ? "Feriado de empresa" : "Evento"),
        icon: "calendar",
        color: e.tipo === "feriado-empresa" ? "var(--brand)" : "#8b8fa8",
        categoria: "eventos",
        prioridad: dias <= 3 ? 7 : 3,
      });
    }

    /* ====== Sort: pendientes/altos primero, luego por fecha desc ====== */
    arr.sort((a, b) => {
      if (b.prioridad !== a.prioridad) return b.prioridad - a.prioridad;
      return b.fechaOrden.localeCompare(a.fechaOrden);
    });

    return arr;
  }, [worker, d.adelantos, d.permisos, d.asistencia, d.eventos, d.mostrarFeriadosOficiales]);

  const filtradas = filtro === "todos" ? alertas : alertas.filter(a => a.categoria === filtro);

  const counts = {
    solicitudes: alertas.filter(a => a.categoria === "solicitudes").length,
    asistencia:  alertas.filter(a => a.categoria === "asistencia").length,
    eventos:     alertas.filter(a => a.categoria === "eventos").length,
  };

  if (!worker) {
    return (
      <>
        <TopbarWorker title="Alertas" subtitle="—" onMenuToggle={()=>{}} />
        <main className="page-main"><div className="card">Cargando...</div></main>
      </>
    );
  }

  return (
    <>
      <TopbarWorker title="Alertas" subtitle={`${alertas.length} notificación${alertas.length === 1 ? "" : "es"}`} onMenuToggle={()=>{}} />
      <main className="page-main animate-fade-in">

        {/* ====== KPIs ====== */}
        <div className="grid-stats" style={{ marginBottom: 14 }}>
          <div className="card" style={{ padding:"14px 16px", borderLeft:"4px solid #16a34a" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Solicitudes</div>
            <div style={{ fontSize: 22, fontWeight: 800, color:"#16a34a", fontFamily:"'DM Mono',monospace" }}>{counts.solicitudes}</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>Adelantos y permisos</div>
          </div>
          <div className="card" style={{ padding:"14px 16px", borderLeft:"4px solid #f59e0b" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Asistencia</div>
            <div style={{ fontSize: 22, fontWeight: 800, color:"#f59e0b", fontFamily:"'DM Mono',monospace" }}>{counts.asistencia}</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>Tardanzas del mes</div>
          </div>
          <div className="card" style={{ padding:"14px 16px", borderLeft:"4px solid #6366f1" }}>
            <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Eventos próximos</div>
            <div style={{ fontSize: 22, fontWeight: 800, color:"#6366f1", fontFamily:"'DM Mono',monospace" }}>{counts.eventos}</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)" }}>Próximos 30 días</div>
          </div>
        </div>

        {/* ====== Filtros ====== */}
        <div style={{ display:"flex", gap: 6, background:"var(--card)", border:"1px solid var(--border)", borderRadius: 10, padding: 3, marginBottom: 12, width:"fit-content", flexWrap:"wrap" }}>
          {FILTROS.map(f => (
            <button key={f.id} onClick={()=>setFiltro(f.id)}
              style={{
                padding:"7px 14px", borderRadius: 8, border:"none", cursor:"pointer",
                background: filtro===f.id ? f.color : "transparent",
                color:      filtro===f.id ? "#fff" : "var(--text-muted)",
                fontWeight: filtro===f.id ? 700 : 500, fontSize: 12,
                display:"inline-flex", alignItems:"center", gap: 6,
              }}>
              <Icon name={f.icon} size={12} color={filtro===f.id ? "#fff" : "currentColor"} />
              {f.label}
            </button>
          ))}
        </div>

        {/* ====== Lista ====== */}
        <div className="card" style={{ padding: 0, overflow:"hidden" }}>
          {filtradas.length === 0 ? (
            <div style={{ padding:"60px 24px", textAlign:"center" }}>
              <div style={{ width: 56, height: 56, borderRadius:"50%", background:"rgba(99,102,241,0.08)", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom: 12 }}>
                <Icon name="bell" size={26} color="#6366f1" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Sin notificaciones</div>
              <div style={{ fontSize: 12, color:"var(--text-muted)" }}>
                Aquí verás novedades sobre tus solicitudes, asistencia y eventos.
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column" }}>
              {filtradas.map((a, i) => (
                <div key={a.id} style={{
                  display:"flex", alignItems:"center", gap: 12,
                  padding:"14px 18px",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  borderLeft: `4px solid ${a.color}`,
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: `${a.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
                    <Icon name={a.icon} size={18} color={a.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap: 8, marginBottom: 2, flexWrap:"wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: a.color }}>{a.titulo}</span>
                      {a.badge && <Badge variant={a.badge.variant} small>{a.badge.text}</Badge>}
                    </div>
                    <div style={{ fontSize: 12, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis" }}>{a.detalle}</div>
                    <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginTop: 2 }}>{a.fechaLabel}</div>
                  </div>
                  {typeof a.monto === "number" && (
                    <HideableAmount value={money(a.monto)} size={14} color={a.color} weight={800} fontFamily="'DM Mono',monospace" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
