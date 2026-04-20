"use client";

/* ================= IMPORTS ================= */
import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { createClient } from "@/lib/supabase/client";
import { money, iniciales, colorSede, calcularNeto } from "@/lib/utils/formatters";
import type { Profile, Asistencia, Adelanto, Permiso } from "@/types";

/* ================= TIPOS LOCALES ================= */
type TabPerfil = "asistencia" | "sueldo" | "adelantos" | "permisos";

// Tipo local para mock: reemplaza 'sede' del Profile original con versión reducida
type WorkerWithSede = Omit<Profile, "sede"> & { sede: { nombre: string } };

/* ================= DATOS MOCK (reemplazar con Supabase) ================= */
const MOCK_TRABAJADORES: WorkerWithSede[] = [
  { id: "1", nombre: "Ana Torres", avatar_url: null, rol: "trabajador", sede_id: "sa", cargo: "Asistente", turno: "08:00–18:00", sueldo: 1400, fecha_ingreso: "2023-03-01", activo: true, sede: { nombre: "Santa Anita" } },
  { id: "2", nombre: "Luis Vera", avatar_url: null, rol: "trabajador", sede_id: "sa", cargo: "Asistente", turno: "08:00–18:00", sueldo: 1400, fecha_ingreso: "2022-06-01", activo: true, sede: { nombre: "Santa Anita" } },
  { id: "3", nombre: "Marco Díaz", avatar_url: null, rol: "trabajador", sede_id: "pp", cargo: "Asistente", turno: "08:00–18:00", sueldo: 1350, fecha_ingreso: "2024-01-01", activo: true, sede: { nombre: "Puente Piedra" } },
  { id: "4", nombre: "Sofía Ríos", avatar_url: null, rol: "trabajador", sede_id: "sa", cargo: "Asistente", turno: "08:00–18:00", sueldo: 1400, fecha_ingreso: "2023-09-01", activo: true, sede: { nombre: "Santa Anita" } },
  { id: "5", nombre: "Carmen Flores", avatar_url: null, rol: "trabajador", sede_id: "pp", cargo: "Operadora", turno: "08:00–18:00", sueldo: 1500, fecha_ingreso: "2022-02-01", activo: true, sede: { nombre: "Puente Piedra" } },
  { id: "6", nombre: "Pedro Chávez", avatar_url: null, rol: "trabajador", sede_id: "sa", cargo: "Operador", turno: "08:00–18:00", sueldo: 1500, fecha_ingreso: "2023-11-01", activo: false, sede: { nombre: "Santa Anita" } },
  { id: "7", nombre: "Rosa Huanca", avatar_url: null, rol: "trabajador", sede_id: "pp", cargo: "Operadora", turno: "08:00–18:00", sueldo: 1500, fecha_ingreso: "2021-04-01", activo: true, sede: { nombre: "Puente Piedra" } },
  { id: "8", nombre: "Jorge Quispe", avatar_url: null, rol: "trabajador", sede_id: "pp", cargo: "Asistente", turno: "08:00–18:00", sueldo: 1350, fecha_ingreso: "2023-07-01", activo: true, sede: { nombre: "Puente Piedra" } },
];

const MOCK_HISTORIAL = [
  { fecha: "Lun 14 Abr", entrada: "08:02", salida: "18:05", horas: "10h 03m", estado: "presente" as const },
  { fecha: "Mar 15 Abr", entrada: "08:15", salida: "18:00", horas: "9h 45m", estado: "tardanza" as const },
  { fecha: "Mié 16 Abr", entrada: "07:58", salida: "18:10", horas: "10h 12m", estado: "presente" as const },
  { fecha: "Jue 17 Abr", entrada: "08:01", salida: "18:00", horas: "9h 59m", estado: "presente" as const },
  { fecha: "Vie 18 Abr", entrada: "—", salida: "—", horas: "—", estado: "permiso" as const },
  { fecha: "Dom 19 Abr", entrada: "08:03", salida: "—", horas: "En curso", estado: "presente" as const },
];

/* ================= COMPONENTE PERFIL TRABAJADOR ================= */
function PerfilTrabajador({
  worker,
  onBack,
}: {
  worker: WorkerWithSede; // ← tipo corregido
  onBack: () => void;
}) {
  const [tab, setTab] = useState<TabPerfil>("asistencia");
  const [modalAdel, setModalAdel] = useState(false);
  const [modalPerm, setModalPerm] = useState(false);
  const [montoAdel, setMontoAdel] = useState("");
  const [motivoAdel, setMotivoAdel] = useState("");
  const [tipoPerm, setTipoPerm] = useState("personal");
  const [fechaPerm, setFechaPerm] = useState("");
  const [motivoPerm, setMotivoPerm] = useState("");

  /* ==== Cálculos ==== */
  const diasTrab = 18;
  const tardanzas = 1;
  const adelantosM = 0;
  const descTard = tardanzas * 22.5;
  const neto = calcularNeto(worker.sueldo, diasTrab, tardanzas, adelantosM);
  const pctMes = Math.round((diasTrab / 22) * 100);
  const colorS = colorSede(worker.sede.nombre);

  const TABS: { id: TabPerfil; label: string; icon: string }[] = [
    { id: "asistencia", label: "Asistencia", icon: "asistencia" },
    { id: "sueldo", label: "Mi Sueldo", icon: "sueldo" },
    { id: "adelantos", label: "Adelantos", icon: "adelantos" },
    { id: "permisos", label: "Permisos", icon: "file_check" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ====== Botón volver ====== */}
      <button
        onClick={onBack}
        style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, color: "var(--text-muted)", fontFamily: "'Bricolage Grotesque',sans-serif", display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}
      >
        <Icon name="arrow_left" size={14} /> Volver a Trabajadores
      </button>

      {/* ====== Header perfil ====== */}
      <div className="card" style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Avatar initials={iniciales(worker.nombre)} size={56} color={colorS} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{worker.nombre}</div>
            <Badge variant={worker.activo ? "activo" : "inactivo"} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
            {worker.cargo} ·{" "}
            <span style={{ color: colorS, fontWeight: 600 }}>{worker.sede.nombre}</span>
            {worker.fecha_ingreso && ` · Desde ${new Date(worker.fecha_ingreso).toLocaleDateString("es-PE", { month: "short", year: "numeric" })}`}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { icon: "clock", label: "Turno", value: worker.turno ?? "—" },
              { icon: "sueldo", label: "Sueldo base", value: money(worker.sueldo) },
              { icon: "asistencia", label: "Días trab.", value: `${diasTrab}/22` },
              { icon: "alert_circle", label: "Tardanzas", value: String(tardanzas) },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                  <Icon name={icon} size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Neto a pagar */}
        <div style={{ background: "rgba(196,26,58,0.06)", border: "1px solid rgba(196,26,58,0.18)", borderRadius: 12, padding: "16px 20px", textAlign: "center", minWidth: 140 }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>NETO A PAGAR</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--brand)" }}>{money(neto)}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
            {money(worker.sueldo)} − {money(descTard)}
          </div>
        </div>
      </div>

      {/* ====== Progreso del mes ====== */}
      <div className="card" style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Progreso del mes — Abril 2026</span>
          <span style={{ fontWeight: 700, color: "var(--brand)", fontFamily: "'DM Mono',monospace" }}>{diasTrab}/22 días ({pctMes}%)</span>
        </div>
        <ProgressBar value={pctMes} showPct={false} height={8} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
          <span>Días restantes: <strong style={{ color: "var(--text)" }}>4</strong></span>
          <span>Feriados: <strong style={{ color: "#6366f1" }}>3</strong></span>
          <span>Permisos: <strong style={{ color: "#f59e0b" }}>1</strong></span>
        </div>
      </div>

      {/* ====== Tabs ====== */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>

        {/* Tab nav */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px", overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "13px 16px", fontSize: 13,
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? "var(--brand)" : "var(--text-muted)",
              borderBottom: tab === t.id ? "2px solid var(--brand)" : "2px solid transparent",
              fontFamily: "'Bricolage Grotesque',sans-serif",
              display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}>
              <Icon name={t.icon} size={14} color={tab === t.id ? "var(--brand)" : "var(--text-muted)"} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ====== Tab: Asistencia ====== */}
        {tab === "asistencia" && (
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Historial reciente</div>
              <button className="btn-outline" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <Icon name="edit" size={13} /> Editar registro
              </button>
            </div>
            <div className="table-wrap">
              <table className="tramys-table">
                <thead>
                  <tr>
                    {["Fecha", "Entrada", "Salida", "Horas", "Estado"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_HISTORIAL.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{h.fecha}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace" }}>{h.entrada}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", color: "var(--text-muted)" }}>{h.salida}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", color: "var(--text-muted)" }}>{h.horas}</td>
                      <td><Badge variant={h.estado} small /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====== Tab: Sueldo ====== */}
        {tab === "sueldo" && (
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Desglose — Abril 2026</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Sueldo base", value: money(worker.sueldo), color: "var(--text)", bold: false, sub: "22 días hábiles" },
                { label: "Días trabajados", value: `${Math.round((worker.sueldo / 22) * diasTrab)}`, color: "#16a34a", bold: false, sub: `${diasTrab}/22 días` },
                { label: "Descuento tardanzas", value: `−${money(descTard)}`, color: "var(--brand)", bold: false, sub: `${tardanzas} tardanza × S/ 22.50` },
                { label: "Adelantos recibidos", value: `−${money(adelantosM)}`, color: "var(--text-muted)", bold: false, sub: "Sin adelantos este mes" },
                { label: "Neto a pagar", value: money(neto), color: "#16a34a", bold: true, sub: "Abril 2026" },
              ].map(({ label, value, color, bold, sub }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 10, background: bold ? "rgba(34,197,94,0.08)" : "var(--bg)", border: `1px solid ${bold ? "rgba(34,197,94,0.2)" : "var(--border)"}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: bold ? "#16a34a" : "var(--text)" }}>{label}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>
                  </div>
                  <span style={{ fontSize: bold ? 18 : 14, fontWeight: bold ? 800 : 600, color, fontFamily: "'DM Mono',monospace" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====== Tab: Adelantos ====== */}
        {tab === "adelantos" && (
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Adelantos de {worker.nombre.split(" ")[0]}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>Requieren aprobación del Owner</div>
              </div>
              <button onClick={() => setModalAdel(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="plus" size={13} color="#fff" /> Solicitar adelanto
              </button>
            </div>

            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
              <Icon name="check_circle" size={32} color="var(--border)" />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginTop: 10, marginBottom: 4 }}>Sin adelantos este mes</div>
              <div style={{ fontSize: 12 }}>No hay adelantos registrados en Abril 2026</div>
            </div>
          </div>
        )}

        {/* ====== Tab: Permisos ====== */}
        {tab === "permisos" && (
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Permisos y justificaciones</div>
              <button onClick={() => setModalPerm(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="plus" size={13} color="#fff" /> Registrar permiso
              </button>
            </div>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Permiso personal</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", marginTop: 2 }}>
                  Vie 18 Abr 2026 · Aprobado por Owner · Sin descuento
                </div>
              </div>
              <Badge variant="permiso" />
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL SOLICITAR ADELANTO ================= */}
      <Modal open={modalAdel} onClose={() => setModalAdel(false)} title="Solicitar Adelanto" width={400}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
          Para {worker.nombre} · Será enviado al Owner para aprobación
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          <div>
            <div className="section-label">Monto solicitado</div>
            <input className="input-base input-mono" placeholder="S/ 0.00" value={montoAdel} onChange={e => setMontoAdel(e.target.value)} />
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>Se descontará automáticamente de la planilla del mes</div>
          </div>
          <div>
            <div className="section-label">Motivo</div>
            <textarea className="input-base" rows={3} placeholder="Describe el motivo..." value={motivoAdel} onChange={e => setMotivoAdel(e.target.value)} style={{ resize: "none" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-outline" style={{ flex: 1 }} onClick={() => setModalAdel(false)}>Cancelar</button>
          <button className="btn-primary" style={{ flex: 2 }}>Enviar solicitud</button>
        </div>
      </Modal>

      {/* ================= MODAL REGISTRAR PERMISO ================= */}
      <Modal open={modalPerm} onClose={() => setModalPerm(false)} title="Registrar Permiso" width={400}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          <div>
            <div className="section-label">Tipo de permiso</div>
            <select className="select-base" style={{ width: "100%" }} value={tipoPerm} onChange={e => setTipoPerm(e.target.value)}>
              <option value="personal">Permiso personal</option>
              <option value="medico">Descanso médico</option>
              <option value="vacaciones">Vacaciones</option>
            </select>
          </div>
          <div>
            <div className="section-label">Fecha</div>
            <input type="date" className="input-base" value={fechaPerm} onChange={e => setFechaPerm(e.target.value)} />
          </div>
          <div>
            <div className="section-label">Motivo</div>
            <textarea className="input-base" rows={3} placeholder="Describe el motivo..." value={motivoPerm} onChange={e => setMotivoPerm(e.target.value)} style={{ resize: "none" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-outline" style={{ flex: 1 }} onClick={() => setModalPerm(false)}>Cancelar</button>
          <button className="btn-primary" style={{ flex: 2 }}>Guardar permiso</button>
        </div>
      </Modal>
    </div>
  );
}

/* ================= PÁGINA PRINCIPAL TRABAJADORES ================= */
export default function TrabajadoresPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [perfil, setPerfil] = useState<WorkerWithSede | null>(null); // ← tipo corregido
  const [busqueda, setBusqueda] = useState("");
  const [filtroSede, setFiltroSede] = useState("todas");
  const [filtroEst, setFiltroEst] = useState("todos");

  /* ====== En producción reemplazar con useEffect + Supabase ====== */
  const trabajadores = MOCK_TRABAJADORES;

  /* ==== Filtros ==== */
  const filtrados = trabajadores.filter(w => {
    const matchSede = filtroSede === "todas" || w.sede.nombre === filtroSede;
    const matchEst = filtroEst === "todos" || (filtroEst === "activo" ? w.activo : !w.activo);
    const matchBusq = w.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchSede && matchEst && matchBusq;
  });

  /* ==== Stats ==== */
  const activos = trabajadores.filter(w => w.activo).length;
  const inactivos = trabajadores.filter(w => !w.activo).length;
  const porSA = trabajadores.filter(w => w.sede.nombre === "Santa Anita").length;
  const porPP = trabajadores.filter(w => w.sede.nombre === "Puente Piedra").length;

  /* ==== Vista perfil ==== */
  if (perfil) {
    return (
      <>
        <Topbar
          title={perfil.nombre}
          subtitle={`${perfil.cargo} · ${perfil.sede.nombre}`}
          onMenuToggle={() => setMobileMenu(true)}
        />
        <main className="page-main">
          <PerfilTrabajador worker={perfil} onBack={() => setPerfil(null)} />
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Trabajadores"
        subtitle={`${activos} activos · ${filtrados.length} visibles`}
        onMenuToggle={() => setMobileMenu(true)}
      />
      <main className="page-main">

        {/* ================= STATS ================= */}
        <div className="grid-stats" style={{ marginBottom: 16 }}>
          <StatCard label="Total" value={trabajadores.length} color="var(--text)" />
          <StatCard label="Activos" value={activos} color="#16a34a" />
          <StatCard label="Santa Anita" value={porSA} color="var(--brand)" />
          <StatCard label="Puente Piedra" value={porPP} color="#1d6fa4" />
        </div>

        {/* ================= FILTROS ================= */}
        <div className="card" style={{ padding: "14px 18px", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

            {/* Búsqueda */}
            <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
              // DESPUÉS
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
                <Icon name="search" size={14} color="var(--text-muted)" />
              </span>
              <input
                className="input-base"
                placeholder="Buscar trabajador..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
            </div>

            {/* Sede */}
            <select className="select-base" value={filtroSede} onChange={e => setFiltroSede(e.target.value)}>
              <option value="todas">Todas las sedes</option>
              <option value="Santa Anita">Santa Anita</option>
              <option value="Puente Piedra">Puente Piedra</option>
            </select>

            {/* Estado */}
            <select className="select-base" value={filtroEst} onChange={e => setFiltroEst(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>

            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>
              {filtrados.length} resultados
            </span>

            <button className="btn-primary" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="plus" size={13} color="#fff" /> Nuevo trabajador
            </button>
          </div>
        </div>

        {/* ================= TABLA ================= */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
            <table className="tramys-table">
              <thead>
                <tr>
                  {["Trabajador", "Cargo", "Sede", "Turno", "Días", "Tardanzas", "Estado", ""].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(w => {
                  const col = colorSede(w.sede.nombre);
                  return (
                    <tr key={w.id} onClick={() => setPerfil(w)}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar initials={iniciales(w.nombre)} size={30} color={col} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{w.nombre}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                              {w.fecha_ingreso
                                ? `Desde ${new Date(w.fecha_ingreso).toLocaleDateString("es-PE", { month: "short", year: "numeric" })}`
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{w.cargo}</td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: col }}>{w.sede.nombre}</span>
                      </td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--text-muted)" }}>{w.turno}</td>
                      <td style={{ fontWeight: 600 }}>18/22</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 1 > 0 ? "var(--brand)" : "#16a34a" }}>1</span>
                      </td>
                      <td><Badge variant={w.activo ? "activo" : "inactivo"} small /></td>
                      <td onClick={e => { e.stopPropagation(); setPerfil(w); }}>
                        <button className="btn-outline" style={{ fontSize: 11, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                          Ver perfil <Icon name="chevron_right" size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No se encontraron trabajadores con esos filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </>
  );
}