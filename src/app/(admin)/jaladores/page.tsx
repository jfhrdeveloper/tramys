"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { PhotoUpload, PhotoAvatar } from "@/components/ui/PhotoUpload";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { MultiverseCalendar } from "@/components/ui/MultiverseCalendar";
import { money, formatFecha } from "@/lib/utils/formatters";
import { useData, type Jalador, type IngresoJalador, isoToday } from "@/components/providers/DataProvider";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { useConfirm } from "@/components/ui/Feedback";
import { rangoPeriodo, PERIODOS, PERIODO_LABEL, type Periodo } from "@/lib/utils/periodos";

type TabPerfilJal = "asistencia" | "comisiones" | "perfil";

/* ================= MODAL NUEVO/EDITAR JALADOR ================= */
function ModalJalador({
  open, onClose, jalador,
}: { open: boolean; onClose: () => void; jalador: Jalador | null }) {
  const d = useData();
  const confirm = useConfirm();
  const esNuevo = !jalador;
  const [nombre, setNombre] = useState(jalador?.nombre ?? "");
  const [apodo, setApodo]   = useState(jalador?.apodo ?? "");
  const [foto, setFoto]     = useState<string | null>(jalador?.avatarBase64 ?? null);
  const [sedeId, setSedeId] = useState(jalador?.sedeId ?? d.sedes[0]?.id ?? "sa");
  const [com, setCom]       = useState(jalador?.porcentajeComision ?? 10);
  const [activo, setActivo] = useState(jalador?.activo ?? true);

  useMemo(() => {
    if (jalador) {
      setNombre(jalador.nombre); setApodo(jalador.apodo); setFoto(jalador.avatarBase64);
      setSedeId(jalador.sedeId); setCom(jalador.porcentajeComision); setActivo(jalador.activo);
    } else {
      setNombre(""); setApodo(""); setFoto(null);
      setSedeId(d.sedes[0]?.id ?? "sa"); setCom(10); setActivo(true);
    }
  }, [jalador?.id]); // eslint-disable-line

  function guardar() {
    if (!nombre.trim()) return;
    const data = {
      nombre: nombre.trim(),
      apodo: apodo.trim() || nombre.trim().split(" ")[0],
      avatarBase64: foto, sedeId, porcentajeComision: com, activo,
      fechaIngreso: jalador?.fechaIngreso ?? new Date().toISOString().slice(0,10),
    };
    if (jalador) d.updateJalador(jalador.id, data);
    else d.addJalador(data);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={esNuevo ? "Nuevo jalador" : "Editar jalador"} width={480}>
      <div style={{ display:"flex", gap: 18, marginBottom: 18, flexWrap:"wrap" }}>
        <PhotoUpload
          value={foto} onChange={setFoto} size={88}
          initials={(apodo || nombre || "?")[0]?.toUpperCase() ?? "?"}
          color={d.sedes.find(s=>s.id===sedeId)?.color ?? "#C41A3A"}
        />
        <div style={{ flex: 1, minWidth: 200, display:"flex", flexDirection:"column", gap: 10 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
            <div><div className="section-label">Nombre</div><input className="input-base" value={nombre} onChange={e=>setNombre(e.target.value)} /></div>
            <div><div className="section-label">Apodo</div><input className="input-base" value={apodo} onChange={e=>setApodo(e.target.value)} /></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
            <div>
              <div className="section-label">Sede</div>
              <select className="select-base" style={{ width:"100%" }} value={sedeId} onChange={e=>setSedeId(e.target.value)}>
                {d.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div>
              <div className="section-label">Comisión (%)</div>
              <input type="number" className="input-base input-mono" value={com} onChange={e=>setCom(Number(e.target.value))} />
            </div>
          </div>
          <label style={{ display:"flex", alignItems:"center", gap: 8, cursor:"pointer" }}>
            <input type="checkbox" checked={activo} onChange={e=>setActivo(e.target.checked)} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Activo</span>
          </label>
        </div>
      </div>
      <div style={{ display:"flex", gap: 10 }}>
        {!esNuevo && <button className="btn-ghost" style={{ color:"var(--brand)", border:"1px solid rgba(196,26,58,0.25)" }} onClick={async () => {
          if (!jalador) return;
          const ok = await confirm({
            title: "Eliminar jalador",
            message: `¿Eliminar a ${jalador.nombre}? Se perderán sus ingresos asociados. Esta acción no se puede deshacer.`,
            confirmLabel: "Eliminar",
            tone: "danger",
          });
          if (ok) { d.deleteJalador(jalador.id); onClose(); }
        }}>Eliminar</button>}
        <div style={{ flex: 1 }} />
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={guardar} disabled={!nombre.trim()}>{esNuevo ? "Crear" : "Guardar"}</button>
      </div>
    </Modal>
  );
}

/* ================= MODAL REGISTRAR INGRESO ================= */
function ModalIngreso({
  open, onClose, jalador, ingreso, fechaInicial,
}: {
  open: boolean; onClose: () => void; jalador: Jalador;
  ingreso: IngresoJalador | null;
  /* Cuando se crea un ingreso nuevo (ingreso=null) y se quiere prefijar una
     fecha distinta a hoy (p.ej. tras click en un día del calendario). */
  fechaInicial?: string;
}) {
  const d = useData();
  const [fecha, setFecha] = useState(ingreso?.fecha ?? fechaInicial ?? isoToday());
  const [monto, setMonto] = useState(ingreso?.monto ?? 0);
  const [nota, setNota]   = useState(ingreso?.nota ?? "");

  useMemo(() => {
    setFecha(ingreso?.fecha ?? fechaInicial ?? isoToday());
    setMonto(ingreso?.monto ?? 0);
    setNota(ingreso?.nota ?? "");
  }, [ingreso?.id, fechaInicial, open]); // eslint-disable-line

  function guardar() {
    if (!monto || monto <= 0) return;
    if (ingreso) d.updateIngreso(ingreso.id, { monto, fecha, nota });
    else d.addIngreso({ jaladorId: jalador.id, monto, fecha, nota });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={ingreso ? "Editar ingreso" : "Registrar ingreso"} width={400}>
      <div style={{ fontSize: 12, color:"var(--text-muted)", marginBottom: 14 }}>
        Para <strong>{jalador.apodo || jalador.nombre}</strong>. Comisión automática: {jalador.porcentajeComision}%
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap: 12, marginBottom: 18 }}>
        <div><div className="section-label">Fecha</div><input type="date" className="input-base" value={fecha} onChange={e=>setFecha(e.target.value)} /></div>
        <div>
          <div className="section-label">Monto ingresado (S/)</div>
          <input type="number" className="input-base input-mono" value={monto || ""} onChange={e=>setMonto(Number(e.target.value))} placeholder="0.00" />
          <div style={{ fontSize: 11, color:"#16a34a", marginTop: 4, fontFamily:"'DM Mono',monospace" }}>
            Comisión: {money((monto || 0) * jalador.porcentajeComision / 100)}
          </div>
        </div>
        <div><div className="section-label">Nota (opcional)</div><textarea className="input-base" rows={2} value={nota} onChange={e=>setNota(e.target.value)} /></div>
      </div>
      <div style={{ display:"flex", gap: 10 }}>
        {ingreso && <button className="btn-ghost" style={{ color:"var(--brand)", border:"1px solid rgba(196,26,58,0.25)" }} onClick={()=>{ d.deleteIngreso(ingreso.id); onClose(); }}>Eliminar</button>}
        <div style={{ flex: 1 }} />
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={guardar} disabled={!monto || monto <= 0}>Guardar</button>
      </div>
    </Modal>
  );
}

/* ================= PERFIL JALADOR ================= */
function PerfilJalador({
  jalador, onBack, fechaInicial,
}: {
  jalador: Jalador;
  onBack: () => void;
  /* Cuando se entra al perfil desde /asistencia con ?fecha=YYYY-MM-DD,
     abrimos automáticamente el modal de registrar ingreso con esa fecha. */
  fechaInicial?: string;
}) {
  const d = useData();
  const sede = d.sedes.find(s => s.id === jalador.sedeId);
  const [tab, setTab] = useState<TabPerfilJal>("asistencia");
  const [modalIng, setModalIng] = useState<IngresoJalador | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoFecha, setNuevoFecha] = useState<string>(isoToday());
  const [modalEditJal, setModalEditJal] = useState(false);

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [periodo, setPeriodo] = useState<Periodo>("semanal");

  /* Auto-apertura del modal de ingreso cuando se llega con ?fecha= */
  useEffect(() => {
    if (fechaInicial) {
      setNuevoFecha(fechaInicial);
      setModalNuevo(true);
      const [y, m] = fechaInicial.split("-").map(Number);
      if (y && m) { setYear(y); setMonth(m - 1); }
    }
  }, [fechaInicial]);

  const ingresos = useMemo(
    () => d.ingresosJaladores.filter(i => i.jaladorId === jalador.id).sort((a,b)=>b.fecha.localeCompare(a.fecha)),
    [d.ingresosJaladores, jalador.id]
  );

  /* Días con ingreso en el mes visible — base del "calendario de asistencia" */
  const ingresosPorFecha = useMemo(() => {
    const map = new Map<string, { count: number; monto: number }>();
    for (const i of ingresos) {
      const prev = map.get(i.fecha) ?? { count: 0, monto: 0 };
      map.set(i.fecha, { count: prev.count + 1, monto: prev.monto + i.monto });
    }
    return map;
  }, [ingresos]);

  function getDayData(day: number) {
    const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const info = ingresosPorFecha.get(iso);
    return { worked: !!info && info.count > 0, late: false, override: null, vacaciones: false };
  }

  function abrirIngresoDia(day: number) {
    const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setNuevoFecha(iso);
    setModalNuevo(true);
  }

  /* Dashboard rendimiento (reutilizado en tab asistencia) */
  const hoyD = new Date(); hoyD.setHours(0,0,0,0);
  const sem = new Date(hoyD); sem.setDate(hoyD.getDate() - 6);
  const mes = new Date(hoyD.getFullYear(), hoyD.getMonth(), 1);

  const ingSem = ingresos.filter(i => new Date(i.fecha) >= sem).reduce((a,i)=>a+i.monto, 0);
  const ingMes = ingresos.filter(i => new Date(i.fecha) >= mes).reduce((a,i)=>a+i.monto, 0);
  const ingHoy = ingresos.filter(i => i.fecha === isoToday()).reduce((a,i)=>a+i.monto, 0);
  const comMes = ingMes * jalador.porcentajeComision / 100;
  const promedioDiario = ingresos.length ? ingMes / Math.max(1, new Set(ingresos.filter(i => new Date(i.fecha) >= mes).map(i=>i.fecha)).size) : 0;
  const mejorDia = ingresos.slice().sort((a,b)=>b.monto-a.monto)[0];

  /* Historial de días con actividad (uno por fecha) — alimenta tabla del tab asistencia */
  const historialDias = useMemo(() => {
    const arr: { fecha: string; count: number; monto: number; comision: number }[] = [];
    for (const [fecha, info] of ingresosPorFecha) {
      arr.push({
        fecha,
        count: info.count,
        monto: info.monto,
        comision: info.monto * jalador.porcentajeComision / 100,
      });
    }
    arr.sort((a,b) => b.fecha.localeCompare(a.fecha));
    return arr;
  }, [ingresosPorFecha, jalador.porcentajeComision]);

  /* Cuadre de caja personal (tab comisiones) */
  const rango = useMemo(() => rangoPeriodo(periodo), [periodo]);
  const ingresosPeriodo = useMemo(() => {
    return ingresos.filter(i => {
      const dt = new Date(i.fecha); dt.setHours(0,0,0,0);
      return dt >= rango.desde && dt <= rango.hasta;
    });
  }, [ingresos, rango]);

  const totIngPer = ingresosPeriodo.reduce((a,i) => a + i.monto, 0);
  const totComPer = totIngPer * jalador.porcentajeComision / 100;
  const balancePer = totIngPer - totComPer;

  const pagHistDias = usePagination(historialDias);
  const pagIngPer   = usePagination(ingresosPeriodo);

  function cambiarMes(dir: -1 | 1) {
    setMonth(m => {
      const nx = m + dir;
      if (nx < 0)  { setYear(y => y - 1); return 11; }
      if (nx > 11) { setYear(y => y + 1); return 0; }
      return nx;
    });
  }

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const TABS: { id: TabPerfilJal; label: string; icon: string }[] = [
    { id:"asistencia", label:"Asistencia", icon:"asistencia"  },
    { id:"comisiones", label:"Comisiones", icon:"money_bill"  },
    { id:"perfil",     label:"Perfil",     icon:"user"        },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap: 14 }}>
      <button onClick={onBack} className="btn-outline" style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap: 6 }}>
        <Icon name="arrow_left" size={13} /> Volver a jaladores
      </button>

      {/* Header */}
      <div className="card" style={{ display:"flex", gap: 18, alignItems:"center", flexWrap:"wrap" }}>
        <PhotoAvatar src={jalador.avatarBase64} initials={(jalador.apodo || jalador.nombre)[0]} size={62} color={sede?.color ?? "#C41A3A"} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display:"flex", alignItems:"center", gap: 10, flexWrap:"wrap", marginBottom: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{jalador.nombre}</div>
            <span style={{ fontSize: 12, color: sede?.color, fontWeight: 700 }}>“{jalador.apodo}”</span>
            <Badge variant={jalador.activo ? "activo" : "inactivo"} small />
          </div>
          <div style={{ fontSize: 12, color:"var(--text-muted)" }}>
            Jalador · <span style={{ color: sede?.color, fontWeight: 600 }}>{sede?.nombre}</span> · Comisión {jalador.porcentajeComision}%
          </div>
        </div>
        <div style={{ textAlign:"right", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6, marginBottom: 4 }}>Comisión mes</div>
          <HideableAmount value={money(comMes)} size={20} color="#d97706" weight={800} fontFamily="'DM Mono',monospace" />
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
            {/* Cards rendimiento */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 12, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.25)", borderRadius: 9 }}>
                <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Ingreso hoy</div>
                <HideableAmount value={money(ingHoy)} size={18} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" />
              </div>
              <div style={{ padding: 12, background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.25)", borderRadius: 9 }}>
                <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Ingreso semana</div>
                <HideableAmount value={money(ingSem)} size={18} color="#6366f1" weight={800} fontFamily="'DM Mono',monospace" />
              </div>
              <div style={{ padding: 12, background:"rgba(196,26,58,0.06)", border:"1px solid rgba(196,26,58,0.25)", borderRadius: 9 }}>
                <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Ingreso mes</div>
                <HideableAmount value={money(ingMes)} size={18} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" />
              </div>
              <div style={{ padding: 12, background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9 }}>
                <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Promedio diario</div>
                <HideableAmount value={money(promedioDiario)} size={18} color="var(--text)" weight={800} fontFamily="'DM Mono',monospace" />
                {mejorDia && (
                  <div style={{ fontSize: 9.5, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginTop: 4 }}>
                    Mejor: {money(mejorDia.monto)} ({mejorDia.fecha})
                  </div>
                )}
              </div>
            </div>

            {/* Header mes + botón añadir ingreso */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14, flexWrap:"wrap", gap: 8 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6, fontWeight: 700 }}>
                Días con ingreso · click sobre un día para registrar
              </div>
              <div style={{ display:"flex", gap: 6, alignItems:"center", flexWrap:"wrap" }}>
                <div style={{ display:"inline-flex", gap: 4 }}>
                  <button
                    className="btn-outline"
                    onClick={()=>cambiarMes(-1)}
                    title="Mes anterior" aria-label="Mes anterior"
                    style={{ width: 40, height: 40, minHeight: 40, padding: 0, display:"inline-flex", alignItems:"center", justifyContent:"center" }}
                  >
                    <span style={{ transform:"rotate(180deg)", display:"inline-flex", lineHeight: 0 }}><Icon name="chevron_right" size={12} /></span>
                  </button>
                  <button
                    className="btn-outline"
                    onClick={()=>cambiarMes(1)}
                    title="Mes siguiente" aria-label="Mes siguiente"
                    style={{ width: 40, height: 40, minHeight: 40, padding: 0, display:"inline-flex", alignItems:"center", justifyContent:"center" }}
                  >
                    <span style={{ display:"inline-flex", lineHeight: 0 }}><Icon name="chevron_right" size={12} /></span>
                  </button>
                </div>
                <select className="select-base" value={month} onChange={e=>setMonth(Number(e.target.value))}>
                  {MESES.map((m,i)=><option key={m} value={i}>{m}</option>)}
                </select>
                <select className="select-base" value={year} onChange={e=>setYear(Number(e.target.value))}>
                  {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Calendario read-only: jaladores no tienen marca diaria, sólo
                "tuvo ingreso ese día" (worked = sí, late = no). Click registra. */}
            <MultiverseCalendar
              year={year}
              month={month}
              getDayData={getDayData}
              onToggleWorked={() => {}}
              onToggleLate={() => {}}
              onDayClick={abrirIngresoDia}
              readonly
            />

            {/* Historial reciente de días con actividad */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Historial de actividad</div>
              <div className="table-wrap">
                <table className="tramys-table">
                  <thead>
                    <tr><th>Fecha</th><th>Ingresos</th><th>Monto total</th><th>Comisión</th><th></th></tr>
                  </thead>
                  <tbody>
                    {historialDias.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign:"center", padding: 30, color:"var(--text-muted)" }}>Sin actividad registrada</td></tr>
                    )}
                    {pagHistDias.pageItems.map(h => (
                      <tr key={h.fecha}>
                        <td style={{ fontFamily:"'DM Mono',monospace" }}>{formatFecha(h.fecha)}</td>
                        <td style={{ fontFamily:"'DM Mono',monospace", fontSize: 12 }}>{h.count}</td>
                        <td><HideableAmount value={money(h.monto)} size={13} color="#16a34a" weight={700} fontFamily="'DM Mono',monospace" /></td>
                        <td><HideableAmount value={money(h.comision)} size={13} color="var(--brand)" weight={700} fontFamily="'DM Mono',monospace" /></td>
                        <td>
                          <button className="btn-outline" style={{ fontSize: 11, padding:"3px 8px", display:"inline-flex", alignItems:"center", gap: 4 }}
                            onClick={()=>{ setNuevoFecha(h.fecha); setModalNuevo(true); }}>
                            <Icon name="plus" size={11} /> Añadir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagHistDias.needsPagination && (
                <Pagination
                  page={pagHistDias.page}
                  totalPages={pagHistDias.totalPages}
                  total={pagHistDias.total}
                  rangeStart={pagHistDias.rangeStart}
                  rangeEnd={pagHistDias.rangeEnd}
                  onChange={pagHistDias.setPage}
                  label="días"
                />
              )}
            </div>
          </div>
        )}

        {/* ==== Tab: Comisiones (cuadre de caja personal) ==== */}
        {tab === "comisiones" && (
          <div style={{ padding: 18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14, flexWrap:"wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Cuadre de caja</div>
                <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>Ingresos vs. comisiones</div>
              </div>
              <div style={{ display:"flex", gap: 8, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ display:"flex", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 8, padding: 3, flexWrap:"wrap" }}>
                  {PERIODOS.map(p => (
                    <button key={p} onClick={()=>setPeriodo(p)}
                      style={{
                        padding:"6px 14px", borderRadius: 6, border:"none", cursor:"pointer",
                        background: periodo===p ? "var(--brand)" : "transparent",
                        color:      periodo===p ? "#fff" : "var(--text-muted)",
                        fontWeight: periodo===p ? 700 : 500, fontSize: 12,
                        minHeight: 30,
                      }}>{PERIODO_LABEL[p]}</button>
                  ))}
                </div>
                <button className="btn-primary" onClick={()=>{ setNuevoFecha(isoToday()); setModalNuevo(true); }} style={{ display:"inline-flex", alignItems:"center", gap: 6 }}>
                  <Icon name="plus" size={13} color="#fff" /> Registrar ingreso
                </button>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
              <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding:"12px 14px" }}>
                <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6, marginBottom: 6 }}>Ingresado</div>
                <HideableAmount value={money(totIngPer)} size={19} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" />
              </div>
              <div style={{ background:"rgba(196,26,58,0.08)", border:"1px solid rgba(196,26,58,0.25)", borderRadius: 10, padding:"12px 14px" }}>
                <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6, marginBottom: 6 }}>Comisión</div>
                <HideableAmount value={money(totComPer)} size={19} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" />
              </div>
              <div style={{ background: balancePer>=0 ? "rgba(99,102,241,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${balancePer>=0 ? "rgba(99,102,241,0.25)" : "rgba(245,158,11,0.25)"}`, borderRadius: 10, padding:"12px 14px" }}>
                <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6, marginBottom: 6 }}>Balance</div>
                <HideableAmount value={money(balancePer)} size={19} color={balancePer>=0?"#6366f1":"#d97706"} weight={800} fontFamily="'DM Mono',monospace" />
              </div>
            </div>

            <div className="table-wrap">
              <table className="tramys-table">
                <thead><tr><th>Fecha</th><th>Monto</th><th>Comisión</th><th>Nota</th><th></th></tr></thead>
                <tbody>
                  {ingresosPeriodo.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign:"center", padding: 30, color:"var(--text-muted)" }}>Sin ingresos en el periodo</td></tr>
                  )}
                  {pagIngPer.pageItems.map(i => (
                    <tr key={i.id}>
                      <td style={{ fontFamily:"'DM Mono',monospace" }}>{formatFecha(i.fecha)}</td>
                      <td><HideableAmount value={money(i.monto)} size={13} color="#16a34a" weight={700} fontFamily="'DM Mono',monospace" /></td>
                      <td><HideableAmount value={money(i.monto * jalador.porcentajeComision / 100)} size={13} color="var(--brand)" weight={700} fontFamily="'DM Mono',monospace" /></td>
                      <td style={{ fontSize: 12, color:"var(--text-muted)" }}>{i.nota || "—"}</td>
                      <td>
                        <button className="btn-outline" style={{ fontSize: 11, padding:"3px 8px", display:"inline-flex", alignItems:"center", gap: 4 }} onClick={()=>setModalIng(i)}>
                          <Icon name="edit" size={11} /> Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagIngPer.needsPagination && (
              <Pagination
                page={pagIngPer.page}
                totalPages={pagIngPer.totalPages}
                total={pagIngPer.total}
                rangeStart={pagIngPer.rangeStart}
                rangeEnd={pagIngPer.rangeEnd}
                onChange={pagIngPer.setPage}
                label="ingresos"
              />
            )}
          </div>
        )}

        {/* ==== Tab: Perfil ==== */}
        {tab === "perfil" && (
          <div style={{ padding: 18 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div>
                <div className="section-label">Nombre</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{jalador.nombre}</div>
              </div>
              <div>
                <div className="section-label">Apodo</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: sede?.color }}>{jalador.apodo || "—"}</div>
              </div>
              <div>
                <div className="section-label">Sede</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: sede?.color }}>{sede?.nombre ?? "—"}</div>
              </div>
              <div>
                <div className="section-label">Comisión</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily:"'DM Mono',monospace", color:"#16a34a" }}>{jalador.porcentajeComision}%</div>
              </div>
              <div>
                <div className="section-label">Estado</div>
                <Badge variant={jalador.activo ? "activo" : "inactivo"} small />
              </div>
              <div>
                <div className="section-label">Fecha de ingreso</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{jalador.fechaIngreso ? formatFecha(jalador.fechaIngreso) : "—"}</div>
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn-primary" onClick={()=>setModalEditJal(true)} style={{ display:"inline-flex", alignItems:"center", gap: 6 }}>
                <Icon name="edit" size={13} color="#fff" /> Editar jalador
              </button>
            </div>
          </div>
        )}
      </div>

      <ModalIngreso open={modalNuevo} onClose={()=>setModalNuevo(false)} jalador={jalador} ingreso={null} fechaInicial={nuevoFecha} />
      {modalIng && <ModalIngreso open={true} onClose={()=>setModalIng(null)} jalador={jalador} ingreso={modalIng} />}
      <ModalJalador open={modalEditJal} onClose={()=>setModalEditJal(false)} jalador={jalador} />
    </div>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function JaladoresPage() {
  const d = useData();
  const params = useSearchParams();
  const [selId, setSelId] = useState<string | null>(null);
  const [fechaInicial, setFechaInicial] = useState<string | undefined>(undefined);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [editJal, setEditJal] = useState<Jalador | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroSede, setFiltroSede] = useState("todas");

  /* Deep-link desde /asistencia con ?jalador=...&fecha=...&sede=...
     Aplica una sola vez al montar; consumimos los params y luego se limpian. */
  useEffect(() => {
    const qSede   = params.get("sede");
    const qJal    = params.get("jalador");
    const qFecha  = params.get("fecha");
    if (qSede && d.sedes.some(s => s.id === qSede)) setFiltroSede(qSede);
    if (qJal && d.jaladores.some(j => j.id === qJal)) {
      setSelId(qJal);
      if (qFecha) setFechaInicial(qFecha);
    }
  }, [params, d.sedes, d.jaladores]);

  const filtrados = d.jaladores.filter(j => {
    const t = busqueda.toLowerCase();
    const matchB = !t || j.nombre.toLowerCase().includes(t) || j.apodo.toLowerCase().includes(t);
    const matchS = filtroSede === "todas" || j.sedeId === filtroSede;
    return matchB && matchS;
  });

  const pag = usePagination(filtrados);

  const sel = selId ? d.jaladores.find(j => j.id === selId) ?? null : null;

  if (sel) {
    return (
      <>
        <Topbar title={sel.nombre} subtitle={`${d.sedes.find(s=>s.id===sel.sedeId)?.nombre ?? ""} · Jalador`} />
        <main className="page-main">
          <PerfilJalador
            jalador={sel}
            onBack={()=>{ setSelId(null); setFechaInicial(undefined); }}
            fechaInicial={fechaInicial}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Jaladores" subtitle={`${d.jaladores.filter(j=>j.activo).length} activos`} />
      <main className="page-main">

        {/* Lista de jaladores */}
        <div className="card" style={{ padding:"14px 18px", marginBottom: 14 }}>
          <div style={{ display:"flex", gap: 10, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ position:"relative", flex: 1, minWidth: 180 }}>
              <span style={{ position:"absolute", left: 10, top:"50%", transform:"translateY(-50%)", display:"flex", alignItems:"center" }}>
                <Icon name="search" size={14} color="var(--text-muted)" />
              </span>
              <input className="input-base" placeholder="Buscar jalador..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{ paddingLeft: 32 }} />
            </div>
            <select className="select-base" value={filtroSede} onChange={e=>setFiltroSede(e.target.value)}>
              <option value="todas">Todas las sedes</option>
              {d.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            <button className="btn-primary" style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap: 6 }} onClick={()=>{ setEditJal(null); setModalNuevo(true); }}>
              <Icon name="plus" size={13} color="#fff" /> Nuevo jalador
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow:"hidden", marginBottom: 16 }}>
          <div className="table-wrap">
            <table className="tramys-table">
              <thead>
                <tr><th>Jalador</th><th>Apodo</th><th>Sede</th><th>Comisión</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {pag.pageItems.map(j => {
                  const sede = d.sedes.find(s => s.id === j.sedeId);
                  return (
                    <tr key={j.id} onClick={()=>setSelId(j.id)}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
                          <PhotoAvatar src={j.avatarBase64} initials={(j.apodo || j.nombre)[0]} size={30} color={sede?.color ?? "#C41A3A"} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{j.nombre}</span>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 700, fontSize: 12, color: sede?.color }}>{j.apodo}</span></td>
                      <td><span style={{ fontSize: 12, fontWeight: 600, color: sede?.color }}>{sede?.nombre}</span></td>
                      <td style={{ fontFamily:"'DM Mono',monospace", fontWeight: 700, color:"#16a34a" }}>{j.porcentajeComision}%</td>
                      <td><Badge variant={j.activo ? "activo" : "inactivo"} small /></td>
                      <td>
                        <button
                          className="btn-outline"
                          style={{ fontSize: 11, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap: 4 }}
                          onClick={e=>{ e.stopPropagation(); setSelId(j.id); }}
                        >
                          <Icon name="eye" size={11} /> Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtrados.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center", padding: 30, color:"var(--text-muted)" }}>Sin resultados</td></tr>}
              </tbody>
            </table>
          </div>
          {pag.needsPagination && (
            <Pagination
              page={pag.page}
              totalPages={pag.totalPages}
              total={pag.total}
              rangeStart={pag.rangeStart}
              rangeEnd={pag.rangeEnd}
              onChange={pag.setPage}
              label="jaladores"
            />
          )}
        </div>

      </main>

      <ModalJalador open={modalNuevo} onClose={()=>setModalNuevo(false)} jalador={editJal} />
    </>
  );
}
