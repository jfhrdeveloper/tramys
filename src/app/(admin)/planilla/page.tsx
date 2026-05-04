"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { HideableAmount, StatCardHidden } from "@/components/ui/HideableAmount";
import { money, formatFecha } from "@/lib/utils/formatters";
import { useData, ingresoDia, isWeekendISO, agregadoCaja, estaPagado, isoToday, type MetodoPago } from "@/components/providers/DataProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";
import Link from "next/link";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { rangoPeriodo, PERIODO_LABEL, type Periodo } from "@/lib/utils/periodos";
import { useConfirm } from "@/components/ui/Feedback";

/* Pago de planilla solo aplica a quincena/mes — diario y semanal son cuadres
   internos y no representan un ciclo real de pago. */
const PERIODOS_PLANILLA: Periodo[] = ["quincenal", "mensual"];

const METODOS: { id: MetodoPago; label: string; icon: string; color: string }[] = [
  { id: "efectivo",      label: "Efectivo",      icon: "money_bill",   color: "#16a34a" },
  { id: "yape",          label: "Yape",          icon: "smartphone",   color: "#7c3aed" },
  { id: "transferencia", label: "Transferencia", icon: "credit_card",  color: "#0891b2" },
];

interface Row {
  workerId: string;
  nombre: string;
  apodo: string;
  avatar: string | null;
  sedeNombre: string;
  sedeColor: string;
  diasNormal: number;
  diasTardanza: number;
  diasFinSem: number;
  diasFeriado: number;
  totalBruto: number;
  adelantos: number;
  neto: number;
  /* Verificación: del total de marcaciones del trabajador en el periodo,
     cuántas ya fueron auditadas. Se muestra como columna "verif." compacta. */
  marcadasTrab: number;
  verificadas:  number;
}

export default function PlanillaPage() {
  const d = useData();
  const confirm = useConfirm();
  const [periodo, setPeriodo] = useState<Periodo>("quincenal");
  const [filtroSede, setFiltroSede] = useState("todas");
  const [modalW, setModalW] = useState<Row | null>(null);
  const [modalPago, setModalPago] = useState<Row | null>(null);

  /* Rango activo. Centralizado en `periodos.ts` — quincenal y mensual coinciden
     con el cuadre que usa /sedes y /caja, así "Sueldos por pagar" cuadra. */
  const rango = useMemo(() => rangoPeriodo(periodo), [periodo]);

  const rows: Row[] = useMemo(() => {
    return d.workers
      .filter(w => w.rol === "trabajador")
      .filter(w => filtroSede === "todas" || w.sedeId === filtroSede)
      .map(w => {
        const sede = d.sedes.find(s => s.id === w.sedeId);
        let normal = 0, tardanza = 0, finSem = 0, feriado = 0, bruto = 0;
        let marcadasTrab = 0, verificadas = 0;
        for (const a of d.asistencia) {
          if (a.workerId !== w.id) continue;
          if (a.fecha < rango.desdeISO || a.fecha > rango.hastaISO) continue;
          const esFer = esFeriadoOficial(a.fecha).es;
          const esFds = isWeekendISO(a.fecha);
          bruto += ingresoDia(a, w.tarifas, esFds, esFer);
          if (a.marcadoPor === "trabajador") {
            marcadasTrab += 1;
            if (a.verificadoPor) verificadas += 1;
          }
          if (a.overrideIngreso !== null) { normal += 1; continue; }
          if (a.estado === "ausente" || a.estado === "permiso") continue;
          if (a.estado === "feriado" || esFer) feriado += 1;
          else if (esFds) finSem += 1;
          else if (a.estado === "tardanza") tardanza += 1;
          else normal += 1;
        }
        const adelantos = d.adelantos
          .filter(x => x.workerId === w.id && x.estado === "aprobado")
          .filter(x => x.fecha >= rango.desdeISO && x.fecha <= rango.hastaISO)
          .reduce((a, x) => a + x.monto, 0);
        return {
          workerId: w.id,
          nombre: w.nombre, apodo: w.apodo, avatar: w.avatarBase64,
          sedeNombre: sede?.nombre ?? "—", sedeColor: sede?.color ?? "#C41A3A",
          diasNormal: normal, diasTardanza: tardanza, diasFinSem: finSem, diasFeriado: feriado,
          totalBruto: bruto, adelantos, neto: Math.max(0, bruto - adelantos),
          marcadasTrab, verificadas,
        };
      });
  }, [d.workers, d.sedes, d.asistencia, d.adelantos, rango.desdeISO, rango.hastaISO, filtroSede]);

  const totalBruto = rows.reduce((a, r) => a + r.totalBruto, 0);
  const totalAdel  = rows.reduce((a, r) => a + r.adelantos, 0);
  const totalNeto  = rows.reduce((a, r) => a + r.neto, 0);

  /* Para mostrar "Ganancia de la compañía" como "Ingresos − Neto pagado" sumamos
     los ingresos de caja (MovimientoCaja tipo "ingreso") del rango activo, en
     todas las sedes del scope. */
  const ingresosRangoSedes = useMemo(() => {
    const sedesScope = filtroSede === "todas" ? d.sedes : d.sedes.filter(s => s.id === filtroSede);
    return sedesScope.reduce(
      (acc, s) => acc + agregadoCaja({ movimientosCaja: d.movimientosCaja }, s.id, rango.desdeISO, rango.hastaISO).ingresos,
      0,
    );
  }, [d.sedes, d.movimientosCaja, rango.desdeISO, rango.hastaISO, filtroSede]);
  const gananciaEmpresa = ingresosRangoSedes - totalNeto;

  /* ====== Estado real de pago por trabajador en el rango activo ====== */
  function pagoDe(workerId: string) {
    return estaPagado(d.pagosPlanilla, workerId, rango.desdeISO, rango.hastaISO);
  }

  async function togglePagado(r: Row) {
    const yaPagado = pagoDe(r.workerId);
    if (yaPagado) {
      const ok = await confirm({
        title: "Anular pago",
        message: `¿Anular el pago de ${r.nombre} del ${formatFecha(yaPagado.desdeISO)} al ${formatFecha(yaPagado.hastaISO)}? El registro se eliminará.`,
        confirmLabel: "Anular pago",
        tone: "danger",
      });
      if (ok) d.deletePagoPlanilla(yaPagado.id);
      return;
    }
    setModalPago(r);
  }

  const pag = usePagination(rows);

  return (
    <>
      <Topbar
        title="Planilla"
        subtitle={`${PERIODO_LABEL[periodo]} · ${formatFecha(rango.desdeISO)} → ${formatFecha(rango.hastaISO)} · ${rows.length} trabajadores`}
      />
      <main className="page-main">

        <div style={{ display:"flex", gap: 10, marginBottom: 14, flexWrap:"wrap", alignItems:"center" }}>
          {/* Toggle de periodo (mismo patrón que /sedes y /caja). */}
          <div style={{
            display: "flex", background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: 8, padding: 3, flexWrap: "wrap",
          }}>
            {PERIODOS_PLANILLA.map(p => {
              const active = periodo === p;
              return (
                <button key={p} onClick={() => setPeriodo(p)}
                  style={{
                    padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: active ? "var(--brand)" : "transparent",
                    color: active ? "#fff" : "var(--text-muted)",
                    fontWeight: active ? 700 : 500, fontSize: 12,
                    fontFamily: "'Bricolage Grotesque',sans-serif",
                    minHeight: 30,
                  }}>
                  {PERIODO_LABEL[p]}
                </button>
              );
            })}
          </div>
          <select className="select-base" value={filtroSede} onChange={e=>setFiltroSede(e.target.value)}>
            <option value="todas">Todas las sedes</option>
            {d.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <button className="btn-outline" style={{ display:"flex", alignItems:"center", gap: 6 }}><Icon name="download" size={13} /> Excel</button>
          <button className="btn-outline" style={{ display:"flex", alignItems:"center", gap: 6 }}><Icon name="download" size={13} /> PDF</button>
        </div>

        <div className="grid-stats" style={{ marginBottom: 16 }}>
          <StatCardHidden label="Total bruto"  value={money(totalBruto)} color="var(--text)"   sub={`${rows.length} trabajadores`} />
          <StatCardHidden label="Adelantos"    value={money(totalAdel)}  color="#f59e0b"       sub="Descontados del neto" />
          <StatCardHidden label="Neto a pagar" value={money(totalNeto)}  color="#16a34a"       sub="Planilla final" />
          <StatCardHidden label="Queda empresa" value={money(gananciaEmpresa)} color="var(--brand)" sub="Ingresos − Neto" />
        </div>

        <div className="card" style={{ padding: 0, overflow:"hidden" }}>
          <div className="table-wrap">
            <table className="tramys-table">
              <thead>
                <tr>
                  <th>Trabajador</th>
                  <th>Sede</th>
                  <th>Normal</th>
                  <th>Tarde</th>
                  <th>FdS</th>
                  <th>Feriado</th>
                  <th>Bruto</th>
                  <th>Adelantos</th>
                  <th>Neto</th>
                  <th>Verif.</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pag.pageItems.map(r => {
                  const pago = pagoDe(r.workerId);
                  const pagado = !!pago;
                  return (
                    <tr key={r.workerId} style={{ opacity: pagado ? 0.7 : 1 }}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
                          <PhotoAvatar src={r.avatar} initials={(r.apodo||r.nombre)[0]} size={28} color={r.sedeColor} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.nombre}</div>
                            <div style={{ fontSize: 10, color:"var(--text-muted)" }}>&quot;{r.apodo}&quot;</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 11, fontWeight: 600, color: r.sedeColor }}>{r.sedeNombre}</span></td>
                      <td style={{ fontFamily:"'DM Mono',monospace", fontWeight: 700, color:"#16a34a" }}>{r.diasNormal}</td>
                      <td style={{ fontFamily:"'DM Mono',monospace", fontWeight: 700, color:"#f59e0b" }}>{r.diasTardanza}</td>
                      <td style={{ fontFamily:"'DM Mono',monospace", fontWeight: 700, color:"#6366f1" }}>{r.diasFinSem}</td>
                      <td style={{ fontFamily:"'DM Mono',monospace", fontWeight: 700, color:"var(--brand)" }}>{r.diasFeriado}</td>
                      <td><HideableAmount value={money(r.totalBruto)} size={13} color="var(--text)" weight={700} fontFamily="'DM Mono',monospace" /></td>
                      <td>
                        {r.adelantos > 0
                          ? <HideableAmount value={`−${money(r.adelantos)}`} size={13} color="#f59e0b" weight={700} fontFamily="'DM Mono',monospace" />
                          : <span style={{ color:"var(--text-muted)" }}>—</span>}
                      </td>
                      <td><HideableAmount value={money(r.neto)} size={14} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" /></td>
                      <td>
                        {r.marcadasTrab === 0 ? (
                          <span style={{ fontSize: 10, color:"var(--text-muted)" }}>—</span>
                        ) : (
                          <span title={`${r.verificadas} de ${r.marcadasTrab} marcaciones del trabajador verificadas`}
                            style={{
                              fontSize: 10.5, fontWeight: 700, padding:"3px 7px", borderRadius: 99,
                              fontFamily:"'DM Mono',monospace",
                              background: r.verificadas === r.marcadasTrab ? "rgba(34,197,94,0.14)" : "rgba(245,158,11,0.14)",
                              color:      r.verificadas === r.marcadasTrab ? "#16a34a" : "#d97706",
                            }}>
                            {r.verificadas}/{r.marcadasTrab}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display:"flex", flexDirection:"column", gap: 2 }}>
                          <Badge variant={pagado ? "pagado" : "pendiente"} small />
                          {pago && (
                            <span style={{ fontSize: 9, color:"#16a34a", fontFamily:"'DM Mono',monospace", fontWeight: 600 }}>
                              {formatFecha(pago.fechaPago)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display:"flex", gap: 4 }}>
                          <button className="btn-outline" style={{ fontSize: 11, padding:"3px 10px" }} onClick={()=>setModalW(r)}>Desglose</button>
                          <button onClick={()=>togglePagado(r)}
                            title={pago
                              ? `Pagado el ${formatFecha(pago.fechaPago)} (${formatFecha(pago.desdeISO)} → ${formatFecha(pago.hastaISO)}). Click para anular.`
                              : `Marcar como pagado del ${formatFecha(rango.desdeISO)} al ${formatFecha(rango.hastaISO)}`}
                            style={{
                              background: pagado ? "rgba(34,197,94,0.1)" : "transparent",
                              border: `1px solid ${pagado ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                              borderRadius: 6, padding:"3px 10px", fontSize: 11,
                              color: pagado ? "#16a34a" : "var(--text-muted)",
                              cursor:"pointer", fontWeight: 600,
                            }}>
                            {pagado ? "✓ Pagado" : "Marcar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr><td colSpan={12} style={{ textAlign:"center", padding: 36, color:"var(--text-muted)" }}>Sin registros</td></tr>}
              </tbody>
              <tfoot>
                <tr style={{ background:"var(--bg)" }}>
                  <td colSpan={6} style={{ padding:"12px 14px", fontWeight: 700, borderTop:"2px solid var(--border)" }}>Totales</td>
                  <td style={{ borderTop:"2px solid var(--border)" }}><HideableAmount value={money(totalBruto)} size={14} color="var(--text)" weight={800} fontFamily="'DM Mono',monospace" /></td>
                  <td style={{ borderTop:"2px solid var(--border)" }}><HideableAmount value={`−${money(totalAdel)}`} size={14} color="#f59e0b" weight={800} fontFamily="'DM Mono',monospace" /></td>
                  <td style={{ borderTop:"2px solid var(--border)" }}><HideableAmount value={money(totalNeto)} size={14} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" /></td>
                  <td colSpan={3} style={{ borderTop:"2px solid var(--border)" }} />
                </tr>
              </tfoot>
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
              label="trabajadores"
            />
          )}
        </div>
      </main>

      {/* Modal desglose */}
      <Modal open={!!modalW} onClose={()=>setModalW(null)} title="Desglose de planilla" width={460}>
        {modalW && (
          <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
            <div style={{ display:"flex", alignItems:"center", gap: 10, padding: 12, background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 10 }}>
              <PhotoAvatar src={modalW.avatar} initials={(modalW.apodo||modalW.nombre)[0]} size={40} color={modalW.sedeColor} />
              <div>
                <div style={{ fontWeight: 700 }}>{modalW.nombre}</div>
                <div style={{ fontSize: 12, color:"var(--text-muted)" }}>{modalW.sedeNombre}</div>
              </div>
            </div>

            {/* Rango de pago: muestra el periodo activo y los días que cubre. */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: 9,
            }}>
              <Icon name="calendar" size={16} color="#6366f1" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 9, color:"#6366f1", fontWeight: 700,
                  fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6,
                }}>
                  Pagando · {PERIODO_LABEL[periodo]}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color:"var(--text)", fontFamily:"'DM Mono',monospace" }}>
                  {formatFecha(rango.desdeISO)} → {formatFecha(rango.hastaISO)}
                </div>
              </div>
            </div>

            {[
              ["Día normal",   modalW.diasNormal,   modalW.totalBruto === 0 ? 0 : undefined, "#16a34a"],
              ["Tardanza",     modalW.diasTardanza, undefined, "#f59e0b"],
              ["Fin de semana",modalW.diasFinSem,   undefined, "#6366f1"],
              ["Feriado",      modalW.diasFeriado,  undefined, "var(--brand)"],
            ].map(([lbl, dias, _, color]) => (
              <div key={String(lbl)} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9 }}>
                <span style={{ fontSize: 13 }}>{String(lbl)}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontWeight: 700, color: String(color) }}>{Number(dias)} días</span>
              </div>
            ))}

            <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9 }}>
              <span>Total bruto</span>
              <HideableAmount value={money(modalW.totalBruto)} size={14} color="var(--text)" weight={700} fontFamily="'DM Mono',monospace" />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9 }}>
              <span>Adelantos</span>
              <HideableAmount value={`−${money(modalW.adelantos)}`} size={14} color="#f59e0b" weight={700} fontFamily="'DM Mono',monospace" />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"14px 16px", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.3)", borderRadius: 10 }}>
              <span style={{ fontWeight: 700, color:"#16a34a" }}>Neto a pagar</span>
              <HideableAmount value={money(modalW.neto)} size={18} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" />
            </div>

            {/* ====== Acciones ====== */}
            <Link
              href={`/trabajadores?perfil=${modalW.workerId}&tab=asistencia`}
              onClick={() => setModalW(null)}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: 4,
                background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: 9, padding: "10px 14px",
                color: "var(--text)", textDecoration: "none",
                fontSize: 13, fontWeight: 600,
                fontFamily: "'Bricolage Grotesque',sans-serif",
              }}
            >
              <Icon name="calendar" size={14} />
              Ver en calendario de {modalW.apodo || modalW.nombre.split(" ")[0]}
            </Link>
          </div>
        )}
      </Modal>

      {/* Modal registrar pago — pide fecha real, método y monto */}
      <ModalRegistrarPago
        row={modalPago}
        rango={rango}
        periodo={periodo}
        onClose={()=>setModalPago(null)}
      />
    </>
  );
}

/* ================= MODAL: REGISTRAR PAGO ================= */
function ModalRegistrarPago({
  row, rango, periodo, onClose,
}: {
  row: Row | null;
  rango: { desdeISO: string; hastaISO: string };
  periodo: Periodo;
  onClose: () => void;
}) {
  const d = useData();
  const [fechaPago, setFechaPago] = useState(isoToday());
  const [metodo,    setMetodo]    = useState<MetodoPago>("efectivo");
  const [monto,     setMonto]     = useState(0);
  const [nota,      setNota]      = useState("");

  /* Reset cada vez que cambia la fila objetivo. */
  useMemo(() => {
    if (row) {
      setFechaPago(isoToday());
      setMetodo("efectivo");
      setMonto(row.neto);
      setNota("");
    }
  }, [row?.workerId]); // eslint-disable-line

  if (!row) return null;

  /* Aviso de "fuera de fecha" cuando el pago se hace después del fin del periodo. */
  const fueraDeFecha = fechaPago > rango.hastaISO;
  const diasFuera = fueraDeFecha
    ? Math.ceil((new Date(fechaPago).getTime() - new Date(rango.hastaISO).getTime()) / (1000*60*60*24))
    : 0;

  function guardar() {
    if (!monto || monto <= 0) return;
    d.addPagoPlanilla({
      workerId:  row!.workerId,
      desdeISO:  rango.desdeISO,
      hastaISO:  rango.hastaISO,
      fechaPago,
      montoNeto: monto,
      metodoPago: metodo,
      periodo: periodo === "quincenal" || periodo === "mensual" ? periodo : undefined,
      nota: nota.trim() || undefined,
    });
    onClose();
  }

  return (
    <Modal open={!!row} onClose={onClose} title="Registrar pago de planilla" width={460}>
      {/* Cabecera con info del trabajador y rango */}
      <div style={{ display:"flex", alignItems:"center", gap: 12, padding: 12, background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 10, marginBottom: 14 }}>
        <PhotoAvatar src={row.avatar} initials={(row.apodo || row.nombre)[0]} size={40} color={row.sedeColor} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{row.nombre}</div>
          <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
            {formatFecha(rango.desdeISO)} → {formatFecha(rango.hastaISO)} · {PERIODO_LABEL[periodo]}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap: 12, marginBottom: 16 }}>
        <div>
          <div className="section-label">Fecha de pago</div>
          <input
            type="date"
            className="input-base input-mono"
            value={fechaPago}
            onChange={e=>setFechaPago(e.target.value)}
          />
          {fueraDeFecha && (
            <div style={{ fontSize: 11, color:"#d97706", marginTop: 5, fontFamily:"'DM Mono',monospace", display:"flex", alignItems:"center", gap: 5 }}>
              <Icon name="alert_circle" size={12} color="#d97706" />
              Pago fuera de fecha — {diasFuera} día{diasFuera === 1 ? "" : "s"} después del cierre del periodo
            </div>
          )}
        </div>

        <div>
          <div className="section-label">Método de pago</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 6 }}>
            {METODOS.map(m => (
              <button key={m.id} type="button" onClick={()=>setMetodo(m.id)}
                style={{
                  padding:"10px 6px", borderRadius: 8, cursor:"pointer",
                  border: `2px solid ${metodo===m.id ? m.color : "var(--border)"}`,
                  background: metodo===m.id ? `${m.color}14` : "var(--bg)",
                  color:      metodo===m.id ? m.color : "var(--text-muted)",
                  fontWeight: metodo===m.id ? 700 : 500, fontSize: 12,
                  display:"inline-flex", flexDirection:"column", alignItems:"center", gap: 4,
                }}>
                <Icon name={m.icon} size={16} color={metodo===m.id ? m.color : "var(--text-muted)"} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="section-label">Monto pagado (S/)</div>
          <input
            type="number"
            className="input-base input-mono"
            value={monto || ""}
            onChange={e=>setMonto(Number(e.target.value))}
            placeholder="0.00"
          />
          {monto !== row.neto && monto > 0 && (
            <div style={{ fontSize: 10.5, color:"var(--text-muted)", marginTop: 4, fontFamily:"'DM Mono',monospace" }}>
              Neto calculado: {money(row.neto)} · Diferencia: {money(monto - row.neto)}
            </div>
          )}
        </div>

        <div>
          <div className="section-label">Nota (opcional)</div>
          <textarea className="input-base" rows={2} value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ej: pago retrasado por viaje, parcial, etc." />
        </div>
      </div>

      <div style={{ display:"flex", gap: 10, justifyContent:"flex-end" }}>
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={guardar} disabled={!monto || monto <= 0}>
          Registrar pago
        </button>
      </div>
    </Modal>
  );
}
