"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { PhotoUpload, PhotoAvatar } from "@/components/ui/PhotoUpload";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { money, formatFecha } from "@/lib/utils/formatters";
import { useData, type Jalador, type IngresoJalador, isoToday } from "@/components/providers/DataProvider";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { rangoPeriodo, PERIODOS, PERIODO_LABEL, type Periodo } from "@/lib/utils/periodos";

/* ================= MODAL NUEVO/EDITAR JALADOR ================= */
function ModalJalador({
  open, onClose, jalador,
}: { open: boolean; onClose: () => void; jalador: Jalador | null }) {
  const d = useData();
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
        {!esNuevo && <button className="btn-ghost" style={{ color:"var(--brand)", border:"1px solid rgba(196,26,58,0.25)" }} onClick={() => { if(jalador && confirm("¿Eliminar?")) { d.deleteJalador(jalador.id); onClose(); } }}>Eliminar</button>}
        <div style={{ flex: 1 }} />
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={guardar} disabled={!nombre.trim()}>{esNuevo ? "Crear" : "Guardar"}</button>
      </div>
    </Modal>
  );
}

/* ================= MODAL REGISTRAR INGRESO ================= */
function ModalIngreso({
  open, onClose, jalador, ingreso,
}: { open: boolean; onClose: () => void; jalador: Jalador; ingreso: IngresoJalador | null }) {
  const d = useData();
  const [fecha, setFecha] = useState(ingreso?.fecha ?? isoToday());
  const [monto, setMonto] = useState(ingreso?.monto ?? 0);
  const [nota, setNota]   = useState(ingreso?.nota ?? "");

  useMemo(() => {
    setFecha(ingreso?.fecha ?? isoToday());
    setMonto(ingreso?.monto ?? 0);
    setNota(ingreso?.nota ?? "");
  }, [ingreso?.id, open]); // eslint-disable-line

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

/* ================= CUADRE CAJA ================= */
function CuadreCaja({ jaladores, ingresos }: {
  jaladores: Jalador[];
  ingresos: IngresoJalador[];
}) {
  const [periodo, setPeriodo] = useState<Periodo>("semanal");
  const [modalIng, setModalIng] = useState<{ jal: Jalador; ingreso: IngresoJalador | null } | null>(null);

  const rango = useMemo(() => rangoPeriodo(periodo), [periodo]);

  const desglose = useMemo(() => {
    return jaladores.map(j => {
      const suyos = ingresos.filter(i => {
        if (i.jaladorId !== j.id) return false;
        const dt = new Date(i.fecha); dt.setHours(0,0,0,0);
        return dt >= rango.desde && dt <= rango.hasta;
      });
      const ing = suyos.reduce((a, i) => a + i.monto, 0);
      const com = ing * j.porcentajeComision / 100;
      return { j, ingresos: suyos, ingreso: ing, comision: com, balance: ing - com };
    });
  }, [jaladores, ingresos, rango]);

  const totalIng = desglose.reduce((a, r) => a + r.ingreso, 0);
  const totalCom = desglose.reduce((a, r) => a + r.comision, 0);
  const balance  = totalIng - totalCom;

  const pagDesglose = usePagination(desglose);

  return (
    <div className="card">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14, flexWrap:"wrap", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Cuadre de caja</div>
          <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>Ingresos vs. comisiones</div>
        </div>
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
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
        <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding:"12px 14px" }}>
          <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6, marginBottom: 6 }}>Ingresado</div>
          <HideableAmount value={money(totalIng)} size={19} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" />
        </div>
        <div style={{ background:"rgba(196,26,58,0.08)", border:"1px solid rgba(196,26,58,0.25)", borderRadius: 10, padding:"12px 14px" }}>
          <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6, marginBottom: 6 }}>Comisiones</div>
          <HideableAmount value={money(totalCom)} size={19} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" />
        </div>
        <div style={{ background: balance>=0 ? "rgba(99,102,241,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${balance>=0 ? "rgba(99,102,241,0.25)" : "rgba(245,158,11,0.25)"}`, borderRadius: 10, padding:"12px 14px" }}>
          <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6, marginBottom: 6 }}>Balance</div>
          <HideableAmount value={money(balance)} size={19} color={balance>=0?"#6366f1":"#d97706"} weight={800} fontFamily="'DM Mono',monospace" />
        </div>
      </div>

      {/* Tabla */}
      <div className="table-wrap">
        <table className="tramys-table">
          <thead><tr><th>Jalador</th><th>Ingresos</th><th>Comisión</th><th>Balance</th><th></th></tr></thead>
          <tbody>
            {pagDesglose.pageItems.map(r => (
              <tr key={r.j.id}>
                <td>
                  <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                    <PhotoAvatar src={r.j.avatarBase64} initials={(r.j.apodo||r.j.nombre)[0]} size={26} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{r.j.apodo || r.j.nombre}</span>
                  </div>
                </td>
                <td><HideableAmount value={money(r.ingreso)} size={13} color="#16a34a" weight={700} fontFamily="'DM Mono',monospace" /></td>
                <td><HideableAmount value={money(r.comision)} size={13} color="var(--brand)" weight={700} fontFamily="'DM Mono',monospace" /></td>
                <td><HideableAmount value={money(r.balance)} size={13} color={r.balance>=0?"#6366f1":"#d97706"} weight={700} fontFamily="'DM Mono',monospace" /></td>
                <td>
                  <button className="btn-primary" style={{ fontSize: 11, padding:"4px 10px", display:"inline-flex", alignItems:"center", gap: 4 }}
                    onClick={()=>setModalIng({ jal: r.j, ingreso: null })}>
                    <Icon name="plus" size={11} color="#fff" /> Registrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagDesglose.needsPagination && (
        <Pagination
          page={pagDesglose.page}
          totalPages={pagDesglose.totalPages}
          total={pagDesglose.total}
          rangeStart={pagDesglose.rangeStart}
          rangeEnd={pagDesglose.rangeEnd}
          onChange={pagDesglose.setPage}
          label="jaladores"
        />
      )}

      {modalIng && (
        <ModalIngreso
          open={true}
          onClose={()=>setModalIng(null)}
          jalador={modalIng.jal}
          ingreso={modalIng.ingreso}
        />
      )}
    </div>
  );
}

/* ================= PERFIL JALADOR ================= */
function PerfilJalador({ jalador, onBack }: { jalador: Jalador; onBack: () => void }) {
  const d = useData();
  const sede = d.sedes.find(s => s.id === jalador.sedeId);
  const [modalIng, setModalIng] = useState<IngresoJalador | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditJal, setModalEditJal] = useState(false);

  const ingresos = useMemo(
    () => d.ingresosJaladores.filter(i => i.jaladorId === jalador.id).sort((a,b)=>b.fecha.localeCompare(a.fecha)),
    [d.ingresosJaladores, jalador.id]
  );

  /* Dashboard rendimiento */
  const hoyD = new Date(); hoyD.setHours(0,0,0,0);
  const sem = new Date(hoyD); sem.setDate(hoyD.getDate() - 6);
  const mes = new Date(hoyD.getFullYear(), hoyD.getMonth(), 1);

  const ingSem = ingresos.filter(i => new Date(i.fecha) >= sem).reduce((a,i)=>a+i.monto, 0);
  const ingMes = ingresos.filter(i => new Date(i.fecha) >= mes).reduce((a,i)=>a+i.monto, 0);
  const ingHoy = ingresos.filter(i => i.fecha === isoToday()).reduce((a,i)=>a+i.monto, 0);

  const comSem = ingSem * jalador.porcentajeComision / 100;
  const comMes = ingMes * jalador.porcentajeComision / 100;

  const promedioDiario = ingresos.length ? ingMes / Math.max(1, new Set(ingresos.filter(i => new Date(i.fecha) >= mes).map(i=>i.fecha)).size) : 0;
  const mejorDia = ingresos.slice().sort((a,b)=>b.monto-a.monto)[0];

  /* Barras 14 días */
  const barras = useMemo(() => {
    const arr: { date: string; label: string; monto: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(hoyD); dt.setDate(hoyD.getDate() - i);
      const iso = dt.toISOString().slice(0, 10);
      const monto = ingresos.filter(x => x.fecha === iso).reduce((a, x) => a + x.monto, 0);
      arr.push({ date: iso, label: String(dt.getDate()), monto });
    }
    return arr;
  }, [ingresos]); // eslint-disable-line

  const max = Math.max(...barras.map(b => b.monto), 1);

  const pagIng = usePagination(ingresos);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap: 14 }}>
      <button onClick={onBack} className="btn-outline" style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap: 6 }}>
        <Icon name="arrow_left" size={13} /> Volver a jaladores
      </button>

      {/* Header */}
      <div className="card" style={{ display:"flex", gap: 18, alignItems:"center", flexWrap:"wrap" }}>
        <PhotoAvatar src={jalador.avatarBase64} initials={(jalador.apodo || jalador.nombre)[0]} size={60} color={sede?.color ?? "#C41A3A"} />
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
        <button className="btn-outline" onClick={()=>setModalEditJal(true)} style={{ display:"flex", alignItems:"center", gap: 6 }}>
          <Icon name="edit" size={13} /> Editar
        </button>
        <button className="btn-primary" onClick={()=>setModalNuevo(true)} style={{ display:"flex", alignItems:"center", gap: 6 }}>
          <Icon name="plus" size={13} color="#fff" /> Registrar ingreso
        </button>
      </div>

      {/* Dashboard rendimiento */}
      <div className="grid-2">
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Rendimiento</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
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
            <div style={{ padding: 12, background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.25)", borderRadius: 9 }}>
              <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>Comisión mes</div>
              <HideableAmount value={money(comMes)} size={18} color="#d97706" weight={800} fontFamily="'DM Mono',monospace" />
            </div>
          </div>

          <div style={{ marginTop: 14, padding: 12, background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color:"var(--text-muted)" }}>Promedio diario</span>
              <HideableAmount value={money(promedioDiario)} size={12} color="var(--text)" weight={700} fontFamily="'DM Mono',monospace" />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize: 12 }}>
              <span style={{ color:"var(--text-muted)" }}>Mejor día {mejorDia ? `(${mejorDia.fecha})` : ""}</span>
              <HideableAmount value={money(mejorDia?.monto ?? 0)} size={12} color="#16a34a" weight={700} fontFamily="'DM Mono',monospace" />
            </div>
          </div>
        </div>

        {/* Barras 14 días */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Ingresos — 14 días</div>
          <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", marginBottom: 14 }}>Tendencia reciente</div>
          <div style={{ display:"flex", gap: 4, alignItems:"flex-end", height: 120 }}>
            {barras.map(b => (
              <div key={b.date} style={{ flex: 1, display:"flex", flexDirection:"column", alignItems:"center", gap: 4 }}>
                <div style={{ width:"100%", borderRadius:"4px 4px 0 0", height: `${(b.monto/max)*100}px`, minHeight: b.monto>0 ? 3 : 0, background:"linear-gradient(180deg, var(--brand), #a01530)" }} />
                <span style={{ fontSize: 9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historial de ingresos */}
      <div className="card" style={{ padding: 0, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Historial de ingresos</div>
          <span style={{ fontSize: 11, color:"var(--text-muted)" }}>{ingresos.length} registros</span>
        </div>
        <div className="table-wrap">
          <table className="tramys-table">
            <thead><tr><th>Fecha</th><th>Monto</th><th>Comisión</th><th>Nota</th><th></th></tr></thead>
            <tbody>
              {ingresos.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:"center", padding: 30, color:"var(--text-muted)" }}>Sin ingresos registrados</td></tr>
              )}
              {pagIng.pageItems.map(i => (
                <tr key={i.id}>
                  <td style={{ fontFamily:"'DM Mono',monospace" }}>{formatFecha(i.fecha)}</td>
                  <td><HideableAmount value={money(i.monto)} size={13} color="#16a34a" weight={700} fontFamily="'DM Mono',monospace" /></td>
                  <td><HideableAmount value={money(i.monto * jalador.porcentajeComision / 100)} size={13} color="var(--brand)" weight={700} fontFamily="'DM Mono',monospace" /></td>
                  <td style={{ fontSize: 12, color:"var(--text-muted)" }}>{i.nota || "—"}</td>
                  <td>
                    <button className="btn-outline" style={{ fontSize: 11, padding:"3px 8px" }} onClick={()=>setModalIng(i)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagIng.needsPagination && (
          <Pagination
            page={pagIng.page}
            totalPages={pagIng.totalPages}
            total={pagIng.total}
            rangeStart={pagIng.rangeStart}
            rangeEnd={pagIng.rangeEnd}
            onChange={pagIng.setPage}
            label="ingresos"
          />
        )}
      </div>

      <ModalIngreso open={modalNuevo} onClose={()=>setModalNuevo(false)} jalador={jalador} ingreso={null} />
      {modalIng && <ModalIngreso open={true} onClose={()=>setModalIng(null)} jalador={jalador} ingreso={modalIng} />}
      <ModalJalador open={modalEditJal} onClose={()=>setModalEditJal(false)} jalador={jalador} />
    </div>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function JaladoresPage() {
  const d = useData();
  const [selId, setSelId] = useState<string | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [editJal, setEditJal] = useState<Jalador | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroSede, setFiltroSede] = useState("todas");

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
          <PerfilJalador jalador={sel} onBack={()=>setSelId(null)} />
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
                      <td onClick={e=>{ e.stopPropagation(); setEditJal(j); setModalNuevo(true); }}>
                        <button className="btn-outline" style={{ fontSize: 11, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap: 4 }}>
                          <Icon name="edit" size={11} /> Editar
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

        <CuadreCaja jaladores={d.jaladores.filter(j => j.activo)} ingresos={d.ingresosJaladores} />
      </main>

      <ModalJalador open={modalNuevo} onClose={()=>setModalNuevo(false)} jalador={editJal} />
    </>
  );
}
