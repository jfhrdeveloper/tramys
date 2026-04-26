"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { PhotoUpload, PhotoAvatar } from "@/components/ui/PhotoUpload";
import { MultiverseCalendar } from "@/components/ui/MultiverseCalendar";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { money } from "@/lib/utils/formatters";
import {
  useData, ingresoDia, isWeekendISO,
  type Worker, type TarifasWorker, type Turno,
  type AsistenciaRec, type EstadoAsist, type TipoPerm,
} from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";

type TabPerfil = "asistencia" | "sueldo" | "adelantos" | "permisos" | "perfil";

/* ================= MODAL EDITAR REGISTRO ASISTENCIA ================= */
const ESTADOS_ASIST: { id: EstadoAsist; label: string; color: string }[] = [
  { id:"presente", label:"Presente", color:"#16a34a" },
  { id:"tardanza", label:"Tardanza", color:"#f59e0b" },
  { id:"ausente",  label:"Ausente",  color:"#8b8fa8" },
  { id:"permiso",  label:"Permiso",  color:"#d97706" },
  { id:"feriado",  label:"Feriado",  color:"#6366f1" },
];

function ModalEditAsistencia({
  open, onClose, worker, fechaISO,
}: {
  open: boolean; onClose: () => void;
  worker: Worker; fechaISO: string;
}) {
  const d = useData();
  const rec: AsistenciaRec | undefined = d.getAsistencia(worker.id, fechaISO);

  const [estado, setEstado]       = useState<EstadoAsist>(rec?.estado ?? "presente");
  const [entrada, setEntrada]     = useState<string>(rec?.entrada ?? worker.turno.entrada);
  const [salida, setSalida]       = useState<string>(rec?.salida ?? worker.turno.salida);
  const [usaOverride, setUsaOver] = useState<boolean>(rec?.overrideIngreso !== null && rec?.overrideIngreso !== undefined);
  const [override, setOverride]   = useState<number>(rec?.overrideIngreso ?? 0);
  const [motivo, setMotivo]       = useState<string>(rec?.motivoEdit ?? "");

  useMemo(() => {
    setEstado(rec?.estado ?? "presente");
    setEntrada(rec?.entrada ?? worker.turno.entrada);
    setSalida(rec?.salida ?? worker.turno.salida);
    setUsaOver(rec?.overrideIngreso !== null && rec?.overrideIngreso !== undefined);
    setOverride(rec?.overrideIngreso ?? 0);
    setMotivo(rec?.motivoEdit ?? "");
  }, [rec?.id, fechaISO, open]); // eslint-disable-line

  const sinHoras = estado === "ausente" || estado === "permiso";

  function guardar() {
    d.setAsistencia(worker.id, fechaISO, {
      estado,
      entrada: sinHoras ? null : (entrada || null),
      salida:  sinHoras ? null : (salida  || null),
      overrideIngreso: usaOverride ? override : null,
      motivoEdit: motivo.trim() || undefined,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Editar asistencia · ${fechaISO}`} width={460}>
      <div style={{ fontSize: 12, color:"var(--text-muted)", marginBottom: 14 }}>
        {worker.nombre} · {worker.cargo}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap: 14, marginBottom: 18 }}>
        {/* Estado */}
        <div>
          <div className="section-label">Estado</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(110px, 1fr))", gap: 6 }}>
            {ESTADOS_ASIST.map(e => (
              <button key={e.id} type="button" onClick={()=>setEstado(e.id)}
                style={{
                  padding:"9px 6px", borderRadius: 8, cursor:"pointer",
                  border: `2px solid ${estado===e.id ? e.color : "var(--border)"}`,
                  background: estado===e.id ? `${e.color}14` : "var(--bg)",
                  color:      estado===e.id ? e.color : "var(--text-muted)",
                  fontWeight: estado===e.id ? 700 : 500, fontSize: 12,
                }}>{e.label}</button>
            ))}
          </div>
        </div>

        {/* Horas */}
        {!sinHoras && (
          <div>
            <div className="section-label">Horario</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
              <input type="time" className="input-base input-mono" value={entrada} onChange={e=>setEntrada(e.target.value)} />
              <input type="time" className="input-base input-mono" value={salida}  onChange={e=>setSalida(e.target.value)}  />
            </div>
          </div>
        )}

        {/* Override de ingreso */}
        <div>
          <label style={{ display:"flex", alignItems:"center", gap: 8, cursor:"pointer", marginBottom: 6 }}>
            <input type="checkbox" checked={usaOverride} onChange={e=>setUsaOver(e.target.checked)} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Override manual del ingreso del día</span>
          </label>
          {usaOverride && (
            <input type="number" className="input-base input-mono"
              value={override || ""}
              onChange={e=>setOverride(Number(e.target.value))}
              placeholder="Monto fijo (S/)"
            />
          )}
          {!usaOverride && (
            <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
              Usa la tarifa correspondiente del trabajador.
            </div>
          )}
        </div>

        {/* Motivo de edición */}
        <div>
          <div className="section-label">Motivo de edición (opcional)</div>
          <input className="input-base" value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej: corrección manual, justificación..." />
        </div>
      </div>

      <div style={{ display:"flex", gap: 10 }}>
        {rec && (
          <button className="btn-ghost"
            style={{ color:"var(--brand)", border:"1px solid rgba(196,26,58,0.25)" }}
            onClick={()=>{
              if (confirm("¿Borrar el registro de este día?")) {
                d.setAsistencia(worker.id, fechaISO, {
                  estado:"ausente", entrada:null, salida:null, overrideIngreso:null, motivoEdit:undefined,
                });
                onClose();
              }
            }}>
            Limpiar día
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={guardar}>Guardar</button>
      </div>
    </Modal>
  );
}

/* ================= MODAL NUEVO ADELANTO ================= */
function ModalAdelanto({
  open, onClose, workerId,
}: { open: boolean; onClose: () => void; workerId: string }) {
  const d = useData();
  const [monto, setMonto]   = useState<number>(0);
  const [motivo, setMotivo] = useState("");

  useMemo(() => { setMonto(0); setMotivo(""); }, [open]); // eslint-disable-line

  function guardar() {
    if (!monto || monto <= 0) return;
    d.addAdelanto({
      workerId, monto, motivo: motivo.trim() || "—",
      fecha: new Date().toISOString().slice(0,10),
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo adelanto" width={400}>
      <div style={{ display:"flex", flexDirection:"column", gap: 12, marginBottom: 18 }}>
        <div>
          <div className="section-label">Monto (S/)</div>
          <input type="number" className="input-base input-mono" value={monto || ""} onChange={e=>setMonto(Number(e.target.value))} placeholder="0.00" />
        </div>
        <div>
          <div className="section-label">Motivo</div>
          <textarea className="input-base" rows={3} value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej: emergencia familiar..." style={{ resize:"none" }} />
        </div>
      </div>
      <div style={{ display:"flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={guardar} disabled={!monto || monto <= 0}>Crear</button>
      </div>
    </Modal>
  );
}

/* ================= MODAL NUEVO PERMISO ================= */
const TIPOS_PERM: { id: TipoPerm; label: string; icon: string; color: string }[] = [
  { id:"personal",   label:"Personal",   icon:"user",       color:"#6366f1" },
  { id:"medico",     label:"Médico",     icon:"file_check", color:"#16a34a" },
  { id:"vacaciones", label:"Vacaciones", icon:"calendar",   color:"#f59e0b" },
];

function ModalPermiso({
  open, onClose, workerId,
}: { open: boolean; onClose: () => void; workerId: string }) {
  const d = useData();
  const [fecha, setFecha]   = useState(new Date().toISOString().slice(0,10));
  const [tipo, setTipo]     = useState<TipoPerm>("personal");
  const [motivo, setMotivo] = useState("");

  useMemo(() => {
    setFecha(new Date().toISOString().slice(0,10));
    setTipo("personal");
    setMotivo("");
  }, [open]); // eslint-disable-line

  function guardar() {
    if (!fecha) return;
    d.addPermiso({ workerId, fecha, tipo, motivo: motivo.trim() || "—" });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo permiso" width={420}>
      <div style={{ display:"flex", flexDirection:"column", gap: 14, marginBottom: 18 }}>
        <div>
          <div className="section-label">Tipo</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 8 }}>
            {TIPOS_PERM.map(t => (
              <button key={t.id} type="button" onClick={()=>setTipo(t.id)}
                style={{
                  padding:"10px 6px", borderRadius: 9, cursor:"pointer",
                  border: `2px solid ${tipo===t.id ? t.color : "var(--border)"}`,
                  background: tipo===t.id ? `${t.color}14` : "var(--bg)",
                  color:      tipo===t.id ? t.color : "var(--text-muted)",
                  fontWeight: tipo===t.id ? 700 : 500, fontSize: 12,
                  display:"flex", flexDirection:"column", alignItems:"center", gap: 4,
                }}>
                <Icon name={t.icon} size={16} color={tipo===t.id ? t.color : "currentColor"} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="section-label">Fecha</div>
          <input type="date" className="input-base" value={fecha} onChange={e=>setFecha(e.target.value)} />
        </div>
        <div>
          <div className="section-label">Motivo</div>
          <textarea className="input-base" rows={3} value={motivo} onChange={e=>setMotivo(e.target.value)} style={{ resize:"none" }} />
        </div>
      </div>
      <div style={{ display:"flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={guardar} disabled={!fecha}>Crear</button>
      </div>
    </Modal>
  );
}

/* ================= MODAL NUEVO/EDITAR TRABAJADOR ================= */
function ModalWorker({
  open, onClose, worker,
}: { open: boolean; onClose: () => void; worker: Worker | null }) {
  const d = useData();
  const esNuevo = !worker;

  const [nombre, setNombre] = useState(worker?.nombre ?? "");
  const [apodo, setApodo]   = useState(worker?.apodo ?? "");
  const [foto, setFoto]     = useState<string | null>(worker?.avatarBase64 ?? null);
  const [sedeId, setSedeId] = useState(worker?.sedeId ?? d.sedes[0]?.id ?? "sa");
  const [cargo, setCargo]   = useState(worker?.cargo ?? "Asistente");
  const [email, setEmail]   = useState(worker?.email ?? "");
  const [dni, setDni]       = useState(worker?.dni ?? "");
  const [tel, setTel]       = useState(worker?.telefono ?? "");
  const [turno, setTurno]   = useState<Turno>(worker?.turno ?? { entrada:"08:00", salida:"18:00" });
  const [tarifas, setTarifas] = useState<TarifasWorker>(worker?.tarifas ?? { diaNormal: 60, tardanza: 45, finSemana: 75, feriado: 90 });
  const [activo, setActivo] = useState(worker?.activo ?? true);

  useMemo(() => {
    if (worker) {
      setNombre(worker.nombre);
      setApodo(worker.apodo);
      setFoto(worker.avatarBase64);
      setSedeId(worker.sedeId);
      setCargo(worker.cargo);
      setEmail(worker.email);
      setDni(worker.dni ?? "");
      setTel(worker.telefono ?? "");
      setTurno(worker.turno);
      setTarifas(worker.tarifas);
      setActivo(worker.activo);
    } else {
      setNombre(""); setApodo(""); setFoto(null);
      setSedeId(d.sedes[0]?.id ?? "sa"); setCargo("Asistente");
      setEmail(""); setDni(""); setTel("");
      setTurno({ entrada:"08:00", salida:"18:00" });
      setTarifas({ diaNormal: 60, tardanza: 45, finSemana: 75, feriado: 90 });
      setActivo(true);
    }
  }, [worker?.id]); // eslint-disable-line

  function guardar() {
    if (!nombre.trim()) return;
    const data = {
      nombre: nombre.trim(),
      apodo: apodo.trim() || nombre.trim().split(" ")[0],
      avatarBase64: foto,
      sedeId,
      cargo: cargo.trim() || "Asistente",
      email: email.trim(),
      dni: dni.trim() || undefined,
      telefono: tel.trim() || undefined,
      turno,
      tarifas,
      activo,
      rol: (worker?.rol ?? "trabajador") as Worker["rol"],
      fechaIngreso: worker?.fechaIngreso ?? new Date().toISOString().slice(0,10),
    };
    if (worker) d.updateWorker(worker.id, data);
    else d.addWorker(data);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={esNuevo ? "Nuevo trabajador" : "Editar trabajador"} width={560}>
      <div style={{ display:"flex", gap: 18, marginBottom: 18, flexWrap:"wrap" }}>
        <PhotoUpload
          value={foto}
          onChange={setFoto}
          size={96}
          initials={(apodo || nombre || "?")[0]?.toUpperCase() ?? "?"}
          color={d.sedes.find(s=>s.id===sedeId)?.color ?? "#C41A3A"}
        />
        <div style={{ flex: 1, minWidth: 220, display:"flex", flexDirection:"column", gap: 12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
            <div>
              <div className="section-label">Nombre completo *</div>
              <input className="input-base" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ana Torres" />
            </div>
            <div>
              <div className="section-label">Apodo</div>
              <input className="input-base" value={apodo} onChange={e=>setApodo(e.target.value)} placeholder="Ani" />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
            <div>
              <div className="section-label">Sede</div>
              <select className="select-base" style={{ width:"100%" }} value={sedeId} onChange={e=>setSedeId(e.target.value)}>
                {d.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div>
              <div className="section-label">Cargo</div>
              <input className="input-base" value={cargo} onChange={e=>setCargo(e.target.value)} />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
            <div>
              <div className="section-label">Email</div>
              <input className="input-base" value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@tramys.pe" />
            </div>
            <div>
              <div className="section-label">Teléfono</div>
              <input className="input-base" value={tel} onChange={e=>setTel(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="section-label">DNI</div>
            <input className="input-base" value={dni} onChange={e=>setDni(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Turno */}
      <div style={{ marginBottom: 14 }}>
        <div className="section-label">Turno</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
          <input type="time" className="input-base input-mono" value={turno.entrada} onChange={e=>setTurno({...turno, entrada:e.target.value})} />
          <input type="time" className="input-base input-mono" value={turno.salida}  onChange={e=>setTurno({...turno, salida:e.target.value})} />
        </div>
      </div>

      {/* Tarifas */}
      <div style={{ marginBottom: 14 }}>
        <div className="section-label">Tarifas por día (S/)</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap: 10 }}>
          {([
            ["diaNormal", "Día normal", "#16a34a"],
            ["tardanza",  "Tardanza",   "#f59e0b"],
            ["finSemana", "Fin semana", "#6366f1"],
            ["feriado",   "Feriado",    "var(--brand)"],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <div style={{ fontSize: 10, color:"var(--text-muted)", marginBottom: 4 }}>{label}</div>
              <input
                type="number"
                className="input-base input-mono"
                value={tarifas[key]}
                onChange={e=>setTarifas({ ...tarifas, [key]: Number(e.target.value) })}
                style={{ padding: "7px 10px", fontSize: 13 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Activo */}
      <div style={{ marginBottom: 18, display:"flex", alignItems:"center", gap: 10 }}>
        <label style={{ display:"flex", alignItems:"center", gap: 8, cursor:"pointer" }}>
          <input type="checkbox" checked={activo} onChange={e=>setActivo(e.target.checked)} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Activo</span>
        </label>
      </div>

      <div style={{ display:"flex", gap: 10 }}>
        {!esNuevo && (
          <button
            className="btn-ghost"
            style={{ color:"var(--brand)", border:"1px solid rgba(196,26,58,0.25)", display:"flex", alignItems:"center", gap: 5 }}
            onClick={() => {
              if (worker && confirm("¿Eliminar este trabajador?")) {
                d.deleteWorker(worker.id);
                onClose();
              }
            }}
          >
            <Icon name="trash" size={12} /> Eliminar
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={guardar} disabled={!nombre.trim()}>
          {esNuevo ? "Crear" : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}

/* ================= PERFIL TRABAJADOR ================= */
function PerfilTrabajador({ worker, onBack }: { worker: Worker; onBack: () => void }) {
  const d = useData();
  const sede = d.sedes.find(s => s.id === worker.sedeId);
  const [tab, setTab] = useState<TabPerfil>("asistencia");

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [editAsistFecha, setEditAsistFecha] = useState<string | null>(null);
  const [modalAdel, setModalAdel] = useState(false);
  const [modalPerm, setModalPerm] = useState(false);

  /* Asistencia del mes */
  function getDayData(day: number) {
    const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const rec = d.getAsistencia(worker.id, iso);
    return {
      worked: rec ? (rec.estado === "presente" || rec.estado === "tardanza") : false,
      late: rec?.estado === "tardanza",
    };
  }
  function toggleWorked(day: number) {
    const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const rec = d.getAsistencia(worker.id, iso);
    const workedNow = rec ? (rec.estado === "presente" || rec.estado === "tardanza") : false;
    if (workedNow) {
      d.setAsistencia(worker.id, iso, { estado:"ausente", entrada:null, salida:null });
    } else {
      d.setAsistencia(worker.id, iso, { estado:"presente", entrada: worker.turno.entrada, salida: worker.turno.salida });
    }
  }
  function toggleLate(day: number) {
    const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const rec = d.getAsistencia(worker.id, iso);
    if (!rec || (rec.estado !== "presente" && rec.estado !== "tardanza")) return;
    d.setAsistencia(worker.id, iso, { estado: rec.estado === "tardanza" ? "presente" : "tardanza" });
  }

  /* Historial reciente */
  const historial = useMemo(() => {
    return d.asistencia
      .filter(a => a.workerId === worker.id)
      .sort((a,b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 10);
  }, [d.asistencia, worker.id]);

  /* Sueldo del mes calculado */
  const sueldoMes = useMemo(() => {
    const mesRecs = d.asistencia.filter(a => {
      if (a.workerId !== worker.id) return false;
      const [y, m] = a.fecha.split("-").map(Number);
      return y === year && m-1 === month;
    });
    let totales = { normal: 0, tardanza: 0, finSem: 0, feriado: 0, override: 0 };
    let total = 0;
    for (const r of mesRecs) {
      const feriado = esFeriadoOficial(r.fecha).es;
      const ing = ingresoDia(r, worker.tarifas, isWeekendISO(r.fecha), feriado);
      total += ing;
      if (r.overrideIngreso !== null) totales.override += 1;
      else if (r.estado === "feriado" || feriado) totales.feriado += 1;
      else if (isWeekendISO(r.fecha)) totales.finSem += 1;
      else if (r.estado === "tardanza") totales.tardanza += 1;
      else if (r.estado === "presente") totales.normal += 1;
    }
    return { total, totales };
  }, [d.asistencia, worker, year, month]);

  /* Adelantos y permisos del trabajador */
  const adelantos = d.adelantos.filter(a => a.workerId === worker.id);
  const permisos  = d.permisos.filter(p => p.workerId === worker.id);

  function cambiarMes(dir: -1 | 1) {
    setMonth(m => {
      const nx = m + dir;
      if (nx < 0)  { setYear(y=>y-1); return 11; }
      if (nx > 11) { setYear(y=>y+1); return 0; }
      return nx;
    });
  }

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const TABS: { id: TabPerfil; label: string; icon: string }[] = [
    { id:"asistencia", label:"Asistencia", icon:"asistencia" },
    { id:"sueldo",     label:"Mi Sueldo",  icon:"money_bill" },
    { id:"adelantos",  label:"Adelantos",  icon:"adelantos" },
    { id:"permisos",   label:"Permisos",   icon:"file_check" },
    { id:"perfil",     label:"Perfil",     icon:"user" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap: 14 }}>
      <button onClick={onBack} className="btn-outline" style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap: 6 }}>
        <Icon name="arrow_left" size={13} /> Volver a Trabajadores
      </button>

      {/* Header perfil */}
      <div className="card" style={{ display:"flex", gap: 18, alignItems:"center", flexWrap:"wrap" }}>
        <PhotoAvatar src={worker.avatarBase64} initials={(worker.apodo || worker.nombre)[0]} size={62} color={sede?.color ?? "#C41A3A"} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 4, flexWrap:"wrap" }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{worker.nombre}</div>
            <span style={{ fontSize: 12, color: sede?.color, fontWeight: 700 }}>“{worker.apodo}”</span>
            <Badge variant={worker.activo ? "activo" : "inactivo"} small />
          </div>
          <div style={{ fontSize: 12, color:"var(--text-muted)" }}>
            {worker.cargo} · <span style={{ color: sede?.color, fontWeight: 600 }}>{sede?.nombre}</span>
            {worker.fechaIngreso && ` · Desde ${new Date(worker.fechaIngreso).toLocaleDateString("es-PE", { month: "short", year: "numeric" })}`}
          </div>
        </div>
        <div style={{ textAlign:"right", background:"rgba(196,26,58,0.06)", border:"1px solid rgba(196,26,58,0.2)", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6, marginBottom: 4 }}>Sueldo mes</div>
          <HideableAmount value={money(sueldoMes.total)} size={20} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" />
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display:"flex", borderBottom: "1px solid var(--border)", padding: "0 16px", overflowX:"auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background:"transparent", border: "none", cursor:"pointer",
                padding:"12px 14px", fontSize: 13,
                fontWeight: tab===t.id ? 700 : 500,
                color: tab===t.id ? "var(--brand)" : "var(--text-muted)",
                borderBottom: tab===t.id ? "2px solid var(--brand)" : "2px solid transparent",
                display:"inline-flex", alignItems:"center", gap: 6, whiteSpace:"nowrap",
              }}>
              <Icon name={t.icon} size={13} color={tab===t.id ? "var(--brand)" : "var(--text-muted)"} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ==== Tab: Asistencia ==== */}
        {tab === "asistencia" && (
          <div style={{ padding: 18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14, flexWrap:"wrap", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {MESES[month]} {year}
              </div>
              <div style={{ display:"flex", gap: 6 }}>
                <select className="select-base" value={month} onChange={e=>setMonth(Number(e.target.value))}>
                  {MESES.map((m,i)=><option key={m} value={i}>{m}</option>)}
                </select>
                <select className="select-base" value={year} onChange={e=>setYear(Number(e.target.value))}>
                  {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                <button className="btn-outline" onClick={()=>cambiarMes(-1)}><span style={{ transform:"rotate(180deg)", display:"inline-flex" }}><Icon name="chevron_right" size={12} /></span></button>
                <button className="btn-outline" onClick={()=>cambiarMes(1)}><Icon name="chevron_right" size={12} /></button>
              </div>
            </div>

            <MultiverseCalendar
              year={year}
              month={month}
              getDayData={getDayData}
              onToggleWorked={toggleWorked}
              onToggleLate={toggleLate}
              isHoliday={(day) => esFeriadoOficial(`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`).es}
            />

            {/* Historial reciente */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Historial reciente</div>
              <div className="table-wrap">
                <table className="tramys-table">
                  <thead>
                    <tr><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Estado</th><th>Editar</th></tr>
                  </thead>
                  <tbody>
                    {historial.map((h, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily:"'DM Mono',monospace" }}>{h.fecha}</td>
                        <td style={{ fontFamily:"'DM Mono',monospace" }}>{h.entrada ?? "—"}</td>
                        <td style={{ fontFamily:"'DM Mono',monospace", color:"var(--text-muted)" }}>{h.salida ?? "—"}</td>
                        <td><Badge variant={h.estado as "presente"|"tardanza"|"ausente"|"permiso"|"feriado"} small /></td>
                        <td>
                          <button className="btn-outline" style={{ fontSize: 11, padding: "3px 8px", display:"inline-flex", alignItems:"center", gap: 4 }}
                            onClick={()=>setEditAsistFecha(h.fecha)}>
                            <Icon name="edit" size={11} /> Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==== Tab: Sueldo ==== */}
        {tab === "sueldo" && (
          <div style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Desglose — {MESES[month]} {year}</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)", marginBottom: 16 }}>
              Nadie gana sueldo base. El total es la suma de días según tarifa. Puedes editar las tarifas desde &quot;Perfil&quot;.
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
              {[
                { label:"Día normal", dias: sueldoMes.totales.normal,  tarifa: worker.tarifas.diaNormal, color:"#16a34a" },
                { label:"Tardanza",   dias: sueldoMes.totales.tardanza,tarifa: worker.tarifas.tardanza, color:"#f59e0b" },
                { label:"Fin semana", dias: sueldoMes.totales.finSem,  tarifa: worker.tarifas.finSemana,color:"#6366f1" },
                { label:"Feriado",    dias: sueldoMes.totales.feriado, tarifa: worker.tarifas.feriado,  color:"var(--brand)" },
              ].map(r => (
                <div key={r.label} style={{ padding: 12, background:"var(--bg)", border:"1px solid var(--border)", borderLeft:`4px solid ${r.color}`, borderRadius: 9 }}>
                  <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>{r.label}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: r.color, fontFamily:"'DM Mono',monospace" }}>{r.dias} × {money(r.tarifa)}</div>
                  <HideableAmount value={money(r.dias * r.tarifa)} size={12} color="var(--text-muted)" weight={600} fontFamily="'DM Mono',monospace" />
                </div>
              ))}
            </div>

            <div style={{ padding: 16, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.3)", borderRadius: 10, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color:"#16a34a" }}>Neto a pagar</span>
              <HideableAmount value={money(sueldoMes.total)} size={22} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" />
            </div>
          </div>
        )}

        {/* ==== Tab: Adelantos ==== */}
        {tab === "adelantos" && (
          <div style={{ padding: 18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 14, flexWrap:"wrap", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Adelantos de {worker.apodo || worker.nombre.split(" ")[0]}</div>
              <button className="btn-primary" style={{ display:"flex", alignItems:"center", gap: 6 }}
                onClick={()=>setModalAdel(true)}>
                <Icon name="plus" size={12} color="#fff" /> Nuevo adelanto
              </button>
            </div>

            {adelantos.length === 0 ? (
              <div style={{ textAlign:"center", padding: "30px 0", color:"var(--text-muted)", fontSize: 13 }}>
                Sin adelantos registrados
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
                {adelantos.map(a => (
                  <div key={a.id} style={{ display:"flex", alignItems:"center", gap: 10, padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <HideableAmount value={money(a.monto)} size={14} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" />
                      <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{a.motivo} · {a.fecha}</div>
                    </div>
                    <Badge variant={a.estado as "pendiente"|"aprobado"|"rechazado"} small />
                    {a.estado === "pendiente" && (
                      <div style={{ display:"flex", gap: 4 }}>
                        <button className="btn-ghost" style={{ border:"1px solid var(--border)", padding:"4px 8px", fontSize: 11 }} onClick={()=>d.updateAdelanto(a.id, { estado:"rechazado" })}>Rechazar</button>
                        <button style={{ background:"#16a34a", color:"#fff", border:"none", borderRadius: 6, padding:"4px 10px", cursor:"pointer", fontSize: 11, fontWeight: 700 }} onClick={()=>d.updateAdelanto(a.id, { estado:"aprobado" })}>Aprobar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==== Tab: Permisos ==== */}
        {tab === "permisos" && (
          <div style={{ padding: 18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 14, flexWrap:"wrap", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Permisos</div>
              <button className="btn-primary" style={{ display:"flex", alignItems:"center", gap: 6 }}
                onClick={()=>setModalPerm(true)}>
                <Icon name="plus" size={12} color="#fff" /> Nuevo permiso
              </button>
            </div>

            {permisos.length === 0 ? (
              <div style={{ textAlign:"center", padding: "30px 0", color:"var(--text-muted)", fontSize: 13 }}>
                Sin permisos registrados
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
                {permisos.map(p => (
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap: 10, padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, textTransform:"capitalize" }}>{p.tipo} — {p.fecha}</div>
                      <div style={{ fontSize: 11, color:"var(--text-muted)" }}>{p.motivo}</div>
                    </div>
                    <Badge variant={p.estado as "pendiente"|"aprobado"|"rechazado"} small />
                    {p.estado === "pendiente" && (
                      <div style={{ display:"flex", gap: 4 }}>
                        <button className="btn-ghost" style={{ border:"1px solid var(--border)", padding:"4px 8px", fontSize: 11 }} onClick={()=>d.updatePermiso(p.id, { estado:"rechazado" })}>Rechazar</button>
                        <button style={{ background:"#16a34a", color:"#fff", border:"none", borderRadius: 6, padding:"4px 10px", cursor:"pointer", fontSize: 11, fontWeight: 700 }} onClick={()=>d.updatePermiso(p.id, { estado:"aprobado" })}>Aprobar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==== Tab: Perfil ==== */}
        {tab === "perfil" && (
          <div style={{ padding: 18 }}>
            <PerfilEditor worker={worker} />
          </div>
        )}
      </div>

      {/* ====== Modales del perfil ====== */}
      {editAsistFecha && (
        <ModalEditAsistencia
          open={true}
          onClose={() => setEditAsistFecha(null)}
          worker={worker}
          fechaISO={editAsistFecha}
        />
      )}
      <ModalAdelanto open={modalAdel} onClose={() => setModalAdel(false)} workerId={worker.id} />
      <ModalPermiso  open={modalPerm} onClose={() => setModalPerm(false)} workerId={worker.id} />
    </div>
  );
}

/* ================= EDITOR DE PERFIL ================= */
function PerfilEditor({ worker }: { worker: Worker }) {
  const d = useData();
  const [local, setLocal] = useState<Worker>(worker);

  function save(patch: Partial<Worker>) {
    const nuevo = { ...local, ...patch };
    setLocal(nuevo);
    d.updateWorker(worker.id, patch);
  }

  return (
    <div style={{ display:"flex", gap: 20, flexWrap:"wrap" }}>
      <PhotoUpload
        value={local.avatarBase64}
        onChange={v => save({ avatarBase64: v })}
        size={110}
        initials={(local.apodo || local.nombre)[0]}
        color={d.sedes.find(s=>s.id===local.sedeId)?.color ?? "#C41A3A"}
      />
      <div style={{ flex: 1, minWidth: 260, display:"flex", flexDirection:"column", gap: 12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
          <div><div className="section-label">Nombre</div><input className="input-base" value={local.nombre} onChange={e=>save({ nombre: e.target.value })} /></div>
          <div><div className="section-label">Apodo</div><input className="input-base" value={local.apodo} onChange={e=>save({ apodo: e.target.value })} /></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
          <div>
            <div className="section-label">Sede</div>
            <select className="select-base" style={{ width:"100%" }} value={local.sedeId} onChange={e=>save({ sedeId: e.target.value })}>
              {d.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div><div className="section-label">Cargo</div><input className="input-base" value={local.cargo} onChange={e=>save({ cargo: e.target.value })} /></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
          <div><div className="section-label">Email</div><input className="input-base" value={local.email} onChange={e=>save({ email: e.target.value })} /></div>
          <div><div className="section-label">Teléfono</div><input className="input-base" value={local.telefono ?? ""} onChange={e=>save({ telefono: e.target.value })} /></div>
        </div>

        <div>
          <div className="section-label">Turno</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
            <input type="time" className="input-base input-mono" value={local.turno.entrada} onChange={e=>save({ turno: { ...local.turno, entrada: e.target.value } })} />
            <input type="time" className="input-base input-mono" value={local.turno.salida}  onChange={e=>save({ turno: { ...local.turno, salida:  e.target.value } })} />
          </div>
        </div>

        <div>
          <div className="section-label">Tarifas por día (S/)</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap: 10 }}>
            {(["diaNormal","tardanza","finSemana","feriado"] as const).map(k => (
              <div key={k}>
                <div style={{ fontSize: 10, color:"var(--text-muted)", marginBottom: 4, textTransform:"capitalize" }}>{k}</div>
                <input type="number" className="input-base input-mono" value={local.tarifas[k]} onChange={e=>save({ tarifas: { ...local.tarifas, [k]: Number(e.target.value) } })} />
              </div>
            ))}
          </div>
        </div>

        <label style={{ display:"flex", alignItems:"center", gap: 8, cursor:"pointer" }}>
          <input type="checkbox" checked={local.activo} onChange={e=>save({ activo: e.target.checked })} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Activo</span>
        </label>
      </div>
    </div>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function TrabajadoresPage() {
  const d = useData();
  const { worker: actor, sede: sedeActor } = useSession();
  const isEnc = actor?.rol === "encargado";
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editW, setEditW] = useState<Worker | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroSede, setFiltroSede] = useState(isEnc && sedeActor ? sedeActor.id : "todas");
  const [filtroEst, setFiltroEst] = useState("todos");

  /* Si el actor es encargado, restringimos el universo a su sede asignada. */
  const workers = d.workers.filter(w =>
    w.rol === "trabajador" && (!isEnc || !sedeActor || w.sedeId === sedeActor.id)
  );

  const filtrados = workers.filter(w => {
    const matchSede = filtroSede === "todas" || w.sedeId === filtroSede;
    const matchEst  = filtroEst === "todos" || (filtroEst === "activo" ? w.activo : !w.activo);
    const t = busqueda.toLowerCase();
    const matchBusq = !t || w.nombre.toLowerCase().includes(t) || w.apodo.toLowerCase().includes(t);
    return matchSede && matchEst && matchBusq;
  });

  const perfil = perfilId ? d.workers.find(w => w.id === perfilId) : null;

  if (perfil) {
    return (
      <>
        <Topbar title={perfil.nombre} subtitle={`${perfil.cargo} · ${d.sedes.find(s=>s.id===perfil.sedeId)?.nombre ?? ""}`} />
        <main className="page-main">
          <PerfilTrabajador worker={perfil} onBack={()=>setPerfilId(null)} />
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Trabajadores" subtitle={`${workers.filter(w=>w.activo).length} activos · ${filtrados.length} visibles`} />
      <main className="page-main">
        <div className="card" style={{ padding: "14px 18px", marginBottom: 14 }}>
          <div style={{ display:"flex", gap: 10, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ position:"relative", flex: 1, minWidth: 180 }}>
              <span style={{ position:"absolute", left: 10, top:"50%", transform:"translateY(-50%)", display:"flex", alignItems:"center" }}>
                <Icon name="search" size={14} color="var(--text-muted)" />
              </span>
              <input className="input-base" placeholder="Buscar por nombre o apodo..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{ paddingLeft: 32 }} />
            </div>
            <select className="select-base" value={filtroSede} onChange={e=>setFiltroSede(e.target.value)}>
              <option value="todas">Todas las sedes</option>
              {d.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            <select className="select-base" value={filtroEst} onChange={e=>setFiltroEst(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            <button
              className="btn-primary"
              style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap: 6 }}
              onClick={()=>{ setEditW(null); setModalOpen(true); }}
            >
              <Icon name="plus" size={13} color="#fff" /> Nuevo trabajador
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow:"hidden" }}>
          <div className="table-wrap">
            <table className="tramys-table">
              <thead>
                <tr><th>Trabajador</th><th>Apodo</th><th>Sede</th><th>Cargo</th><th>Turno</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {filtrados.map(w => {
                  const sede = d.sedes.find(s => s.id === w.sedeId);
                  return (
                    <tr key={w.id} onClick={()=>setPerfilId(w.id)}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
                          <PhotoAvatar src={w.avatarBase64} initials={(w.apodo || w.nombre)[0]} size={30} color={sede?.color ?? "#C41A3A"} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{w.nombre}</div>
                            <div style={{ fontSize: 10, color:"var(--text-muted)" }}>{w.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 700, fontSize: 12, color: sede?.color ?? "var(--text)" }}>{w.apodo}</span></td>
                      <td><span style={{ fontSize: 12, fontWeight: 600, color: sede?.color ?? "var(--text-muted)" }}>{sede?.nombre}</span></td>
                      <td style={{ fontSize: 12, color:"var(--text-muted)" }}>{w.cargo}</td>
                      <td style={{ fontFamily:"'DM Mono',monospace", fontSize: 11, color:"var(--text-muted)" }}>{w.turno.entrada}–{w.turno.salida}</td>
                      <td><Badge variant={w.activo ? "activo" : "inactivo"} small /></td>
                      <td onClick={e=>{ e.stopPropagation(); setEditW(w); setModalOpen(true); }}>
                        <button className="btn-outline" style={{ fontSize: 11, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap: 4 }}>
                          <Icon name="edit" size={11} /> Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtrados.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding: 36, color:"var(--text-muted)" }}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ModalWorker open={modalOpen} onClose={()=>setModalOpen(false)} worker={editW} />
    </>
  );
}
