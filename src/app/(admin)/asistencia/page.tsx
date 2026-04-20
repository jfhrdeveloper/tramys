"use client";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { iniciales, colorSede } from "@/lib/utils/formatters";

/* ================= MOCK DATA ================= */
const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

const ESTADOS_DIA: Record<number, string> = {
  1: "presente", 2: "presente", 3: "presente", 4: "feriado", 5: "feriado",
  6: "presente", 7: "presente", 8: "presente", 9: "presente", 10: "presente",
  11: "feriado", 12: "feriado", 13: "presente", 14: "presente", 15: "tardanza",
  16: "presente", 17: "presente", 18: "permiso", 19: "presente",
};

const MOCK_ASISTENCIA = [
  { nombre: "Ana Torres", avatar: "AT", sede: "Santa Anita", sedeColor: "#C41A3A", entrada: "08:02", salida: "18:05", horas: "10h 03m", estado: "presente" as const },
  { nombre: "Luis Vera", avatar: "LV", sede: "Santa Anita", sedeColor: "#C41A3A", entrada: "07:58", salida: "18:00", horas: "10h 02m", estado: "presente" as const },
  { nombre: "Marco Díaz", avatar: "MD", sede: "Puente Piedra", sedeColor: "#1d6fa4", entrada: "08:47", salida: "18:10", horas: "9h 23m", estado: "tardanza" as const },
  { nombre: "Sofía Ríos", avatar: "SR", sede: "Santa Anita", sedeColor: "#C41A3A", entrada: "09:02", salida: "—", horas: "En curso", estado: "tardanza" as const },
  { nombre: "Carmen Flores", avatar: "CF", sede: "Puente Piedra", sedeColor: "#1d6fa4", entrada: "08:11", salida: "18:00", horas: "9h 49m", estado: "presente" as const },
  { nombre: "Pedro Chávez", avatar: "PC", sede: "Santa Anita", sedeColor: "#C41A3A", entrada: "—", salida: "—", horas: "—", estado: "ausente" as const },
  { nombre: "Rosa Huanca", avatar: "RH", sede: "Puente Piedra", sedeColor: "#1d6fa4", entrada: "07:55", salida: "18:00", horas: "10h 05m", estado: "presente" as const },
  { nombre: "Jorge Quispe", avatar: "JQ", sede: "Puente Piedra", sedeColor: "#1d6fa4", entrada: "08:05", salida: "—", horas: "En curso", estado: "presente" as const },
];

type EstadoAsist = "presente" | "tardanza" | "ausente" | "permiso";

/* ================= COMPONENTE CALENDARIO ================= */
function CalendarioMes({
  diaSeleccionado,
  onSelectDia,
  trabajadorFiltro,
}: {
  diaSeleccionado: number;
  onSelectDia: (d: number) => void;
  trabajadorFiltro: string;
}) {
  const dias: (number | null)[] = [];
  for (let i = 0; i < 2; i++) dias.push(null);
  for (let d = 1; d <= 30; d++) dias.push(d);

  function bgDia(d: number | null): string {
    if (!d) return "transparent";
    if (d === diaSeleccionado) return "var(--brand)";
    const e = ESTADOS_DIA[d];
    const map: Record<string, string> = {
      presente: "rgba(34,197,94,0.15)",
      tardanza: "rgba(196,26,58,0.15)",
      permiso: "rgba(245,158,11,0.15)",
      feriado: "rgba(99,102,241,0.15)",
    };
    return map[e] ?? "var(--bg)";
  }

  function colorTexto(d: number | null): string {
    if (!d) return "transparent";
    if (d === diaSeleccionado) return "#fff";
    if (d === 19) return "var(--brand)";
    return "var(--text)";
  }

  const LEYENDA = [
    { bg: "rgba(34,197,94,0.15)", color: "#16a34a", label: "Presente" },
    { bg: "rgba(196,26,58,0.15)", color: "var(--brand)", label: "Tardanza" },
    { bg: "rgba(245,158,11,0.15)", color: "#d97706", label: "Permiso" },
    { bg: "rgba(99,102,241,0.15)", color: "#6366f1", label: "Feriado" },
  ];

  return (
    <div className="card">
      {/* Header mes */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button className="btn-ghost" style={{ padding: "4px 8px" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}>
            <Icon name="chevron_right" size={14} />
          </span>
        </button>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Abril 2026</div>
        <button className="btn-ghost" style={{ padding: "4px 8px" }}><Icon name="chevron_right" size={14} /></button>
      </div>

      {/* Días semana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", padding: "3px 0" }}>{d}</div>
        ))}
      </div>

      {/* Días */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {dias.map((d, i) => (
          <div key={i} onClick={() => d && onSelectDia(d)} style={{
            aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 6, fontSize: 11, fontWeight: d === diaSeleccionado || d === 19 ? 700 : 500,
            background: bgDia(d), color: colorTexto(d),
            cursor: d ? "pointer" : "default",
            border: d === 19 && d !== diaSeleccionado ? "1px solid var(--brand)" : "1px solid transparent",
            transition: "all 0.15s",
          }}>{d || ""}</div>
        ))}
      </div>

      {/* Leyenda */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
        {LEYENDA.map(({ bg, color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: bg, border: `1px solid ${color}30`, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Selector trabajador */}
      {trabajadorFiltro !== "todos" && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, color: "var(--brand)", fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>
            Mostrando: {trabajadorFiltro}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= MODAL EDITAR REGISTRO ================= */
function ModalEditar({
  open, onClose, trabajador,
}: {
  open: boolean; onClose: () => void;
  trabajador: (typeof MOCK_ASISTENCIA)[0] | null;
}) {
  const [entrada, setEntrada] = useState(trabajador?.entrada !== "—" ? trabajador?.entrada ?? "" : "");
  const [salida, setSalida] = useState(trabajador?.salida !== "—" ? trabajador?.salida ?? "" : "");
  const [estado, setEstado] = useState<EstadoAsist>(trabajador?.estado ?? "presente");
  const [motivo, setMotivo] = useState("");

  if (!trabajador) return null;

  const ESTADOS: EstadoAsist[] = ["presente", "tardanza", "ausente", "permiso"];
  const colorEstado: Record<EstadoAsist, string> = {
    presente: "#16a34a", tardanza: "var(--brand)", ausente: "#8b8fa8", permiso: "#d97706"
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar Registro de Asistencia" width={420}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
        {trabajador.nombre} · Dom 19 Abr 2026
      </div>

      {/* Horas */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        {[["Hora de entrada", entrada, setEntrada], ["Hora de salida", salida, setSalida]].map(([lbl, val, set]) => (
          <div key={String(lbl)} style={{ flex: 1 }}>
            <div className="section-label">{String(lbl)}</div>
            <input type="time" className="input-base input-mono"
              value={String(val)}
              onChange={e => (set as (v: string) => void)(e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Estado */}
      <div style={{ marginBottom: 14 }}>
        <div className="section-label">Estado</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setEstado(e)} style={{
              padding: "6px 14px", borderRadius: 99, cursor: "pointer",
              border: `1px solid ${estado === e ? colorEstado[e] : "var(--border)"}`,
              background: estado === e ? `${colorEstado[e]}15` : "var(--bg)",
              color: estado === e ? colorEstado[e] : "var(--text-muted)",
              fontWeight: estado === e ? 700 : 500, fontSize: 12,
              fontFamily: "'Bricolage Grotesque',sans-serif",
              textTransform: "capitalize", transition: "all 0.15s",
            }}>{e}</button>
          ))}
        </div>
      </div>

      {/* Motivo */}
      <div style={{ marginBottom: 20 }}>
        <div className="section-label">Motivo de edición <span style={{ color: "var(--brand)" }}>*</span></div>
        <textarea className="input-base" rows={3} placeholder="Ej: Corrección de hora por error del sistema..." value={motivo} onChange={e => setMotivo(e.target.value)} style={{ resize: "none" }} />
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="lock" size={10} color="var(--text-muted)" /> Este cambio quedará registrado en el audit log
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex: 2 }} disabled={!motivo.trim()}>Guardar cambios</button>
      </div>
    </Modal>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function AsistenciaPage() {
  const [diaSelec, setDiaSelec] = useState(19);
  const [tabActiva, setTabActiva] = useState<"hoy" | "semana" | "mes">("hoy");
  const [filtroSede, setFiltroSede] = useState("todas");
  const [filtroWorker, setFiltroWorker] = useState("todos");
  const [modalEditar, setModalEditar] = useState(false);
  const [workerEditando, setWorkerEditando] = useState<(typeof MOCK_ASISTENCIA)[0] | null>(null);

  const presentes = MOCK_ASISTENCIA.filter(w => w.estado === "presente").length;
  const tardanzas = MOCK_ASISTENCIA.filter(w => w.estado === "tardanza").length;
  const ausentes = MOCK_ASISTENCIA.filter(w => w.estado === "ausente").length;
  const pct = Math.round((presentes / MOCK_ASISTENCIA.length) * 100);

  const filtrados = MOCK_ASISTENCIA.filter(w => {
    const matchSede = filtroSede === "todas" || w.sede === filtroSede;
    const matchWorker = filtroWorker === "todos" || w.nombre === filtroWorker;
    return matchSede && matchWorker;
  });

  function abrirEditar(w: typeof MOCK_ASISTENCIA[0]) {
    setWorkerEditando(w); setModalEditar(true);
  }

  return (
    <>
      <Topbar
        title="Asistencia y Sueldos"
        subtitle={`Abril 2026 · ${presentes} presentes · ${tardanzas} tardanzas · ${ausentes} ausentes`}
        onMenuToggle={() => { }}
      />
      <main className="page-main">

        {/* Stats */}
        <div className="grid-stats" style={{ marginBottom: 16 }}>
          <StatCard label="Total" value={MOCK_ASISTENCIA.length} color="var(--text)" />
          <StatCard label="Presentes" value={presentes} color="#16a34a" />
          <StatCard label="Tardanzas" value={tardanzas} color="var(--brand)" />
          <StatCard label="Asistencia" value={`${pct}%`} color="var(--brand)" />
        </div>

        {/* Calendario + Tabla */}
        <div className="grid-cal" style={{ alignItems: "start" }}>

          {/* Calendario */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CalendarioMes
              diaSeleccionado={diaSelec}
              onSelectDia={setDiaSelec}
              trabajadorFiltro={filtroWorker}
            />

            {/* Filtro por trabajador */}
            <div className="card" style={{ padding: "14px 16px" }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Filtrar por trabajador</div>
              <select className="select-base" style={{ width: "100%" }} value={filtroWorker} onChange={e => setFiltroWorker(e.target.value)}>
                <option value="todos">Todos los trabajadores</option>
                {MOCK_ASISTENCIA.map(w => <option key={w.nombre} value={w.nombre}>{w.nombre}</option>)}
              </select>
              {filtroWorker !== "todos" && (
                <button className="btn-ghost" style={{ marginTop: 8, width: "100%", fontSize: 11 }} onClick={() => setFiltroWorker("todos")}>
                  <Icon name="x" size={11} /> Quitar filtro
                </button>
              )}
            </div>
          </div>

          {/* Panel derecho */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>

            {/* Tabs + filtro */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", padding: "0 20px", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex" }}>
                {(["hoy", "semana", "mes"] as const).map(tab => (
                  <button key={tab} onClick={() => setTabActiva(tab)} style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    padding: "13px 14px", fontSize: 13,
                    fontWeight: tabActiva === tab ? 700 : 500,
                    color: tabActiva === tab ? "var(--brand)" : "var(--text-muted)",
                    borderBottom: tabActiva === tab ? "2px solid var(--brand)" : "2px solid transparent",
                    fontFamily: "'Bricolage Grotesque',sans-serif", transition: "all 0.15s",
                  }}>{tab === "hoy" ? "Hoy" : tab === "semana" ? "Esta semana" : "Este mes"}</button>
                ))}
              </div>
              <select className="select-base" value={filtroSede} onChange={e => setFiltroSede(e.target.value)}>
                <option value="todas">Todas las sedes</option>
                <option value="Santa Anita">Santa Anita</option>
                <option value="Puente Piedra">Puente Piedra</option>
              </select>
            </div>

            {/* Tabla */}
            <div className="table-wrap">
              <table className="tramys-table">
                <thead>
                  <tr>
                    {["Trabajador", "Sede", "Entrada", "Salida", "Horas", "Estado", "Acciones"].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((w, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar initials={w.avatar} size={28} color={w.sedeColor} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{w.nombre}</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 11, fontWeight: 600, color: w.sedeColor }}>{w.sede}</span></td>
                      <td style={{ fontFamily: "'DM Mono',monospace" }}>{w.entrada}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", color: "var(--text-muted)" }}>{w.salida}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", color: "var(--text-muted)", fontSize: 12 }}>{w.horas}</td>
                      <td><Badge variant={w.estado} small /></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn-outline" style={{ fontSize: 11, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }} onClick={() => abrirEditar(w)}>
                            <Icon name="edit" size={11} /> Editar
                          </button>
                          <button className="btn-ghost" style={{ fontSize: 11, padding: "4px 8px" }}>
                            Justificar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer turnos */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", background: "var(--bg)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>TURNOS:</span>
              {["Turno A: 08:00–18:00", "Turno B: 14:00–22:00"].map(t => (
                <span key={t} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 99, padding: "3px 12px", fontSize: 11 }}>⏰ {t}</span>
              ))}
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                Tolerancia: <strong>15 min</strong> · Descuento: <strong>S/ 22.50/tardanza</strong>
              </span>
            </div>
          </div>
        </div>
      </main>

      <ModalEditar open={modalEditar} onClose={() => setModalEditar(false)} trabajador={workerEditando} />
    </>
  );
}