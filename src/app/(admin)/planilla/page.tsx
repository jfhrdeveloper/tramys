"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";
import { HideableAmount, StatCardHidden } from "@/components/ui/HideableAmount";
import { StatCard } from "@/components/ui/StatCard";
import { money } from "@/lib/utils/formatters";
import { useData, ingresoDia, isWeekendISO } from "@/components/providers/DataProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";
import Link from "next/link";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

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
}

export default function PlanillaPage() {
  const d = useData();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filtroSede, setFiltroSede] = useState("todas");
  const [pagados, setPagados] = useState<string[]>([]);
  const [modalW, setModalW] = useState<Row | null>(null);

  const rows: Row[] = useMemo(() => {
    return d.workers
      .filter(w => w.rol === "trabajador")
      .filter(w => filtroSede === "todas" || w.sedeId === filtroSede)
      .map(w => {
        const sede = d.sedes.find(s => s.id === w.sedeId);
        let normal = 0, tardanza = 0, finSem = 0, feriado = 0, bruto = 0;
        for (const a of d.asistencia) {
          if (a.workerId !== w.id) continue;
          const [y,m] = a.fecha.split("-").map(Number);
          if (y !== year || m-1 !== month) continue;
          const esFer = esFeriadoOficial(a.fecha).es;
          const esFds = isWeekendISO(a.fecha);
          bruto += ingresoDia(a, w.tarifas, esFds, esFer);
          if (a.overrideIngreso !== null) { normal += 1; continue; }
          if (a.estado === "ausente" || a.estado === "permiso") continue;
          if (a.estado === "feriado" || esFer) feriado += 1;
          else if (esFds) finSem += 1;
          else if (a.estado === "tardanza") tardanza += 1;
          else normal += 1;
        }
        const adelantos = d.adelantos
          .filter(x => x.workerId === w.id && x.estado === "aprobado")
          .filter(x => {
            const [y,m] = x.fecha.split("-").map(Number);
            return y === year && m-1 === month;
          })
          .reduce((a, x) => a + x.monto, 0);
        return {
          workerId: w.id,
          nombre: w.nombre, apodo: w.apodo, avatar: w.avatarBase64,
          sedeNombre: sede?.nombre ?? "—", sedeColor: sede?.color ?? "#C41A3A",
          diasNormal: normal, diasTardanza: tardanza, diasFinSem: finSem, diasFeriado: feriado,
          totalBruto: bruto, adelantos, neto: Math.max(0, bruto - adelantos),
        };
      });
  }, [d.workers, d.sedes, d.asistencia, d.adelantos, year, month, filtroSede]);

  const totalBruto = rows.reduce((a, r) => a + r.totalBruto, 0);
  const totalAdel  = rows.reduce((a, r) => a + r.adelantos, 0);
  const totalNeto  = rows.reduce((a, r) => a + r.neto, 0);
  const ganaCompania = totalBruto - totalNeto; // (conservador)

  /* Para mostrar "Ganancia de la compañía" como "Ingresos − Neto pagado" usamos los ingresos de caja del mes */
  const ingresosMesSedes = d.sedes.reduce((a, s) => a + s.cajaMes.ingresos, 0);
  const gananciaEmpresa = ingresosMesSedes - totalNeto;

  const togglePagado = (id: string) => setPagados(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <>
      <Topbar title="Planilla" subtitle={`${MESES[month]} ${year} · ${rows.length} trabajadores`} />
      <main className="page-main">

        <div style={{ display:"flex", gap: 10, marginBottom: 14, flexWrap:"wrap" }}>
          <select className="select-base" value={month} onChange={e=>setMonth(Number(e.target.value))}>
            {MESES.map((m,i)=><option key={m} value={i}>{m}</option>)}
          </select>
          <select className="select-base" value={year} onChange={e=>setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
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
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const pag = pagados.includes(r.workerId);
                  return (
                    <tr key={r.workerId} style={{ opacity: pag ? 0.7 : 1 }}>
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
                      <td><Badge variant={pag ? "pagado" : "pendiente"} small /></td>
                      <td>
                        <div style={{ display:"flex", gap: 4 }}>
                          <button className="btn-outline" style={{ fontSize: 11, padding:"3px 10px" }} onClick={()=>setModalW(r)}>Desglose</button>
                          <button onClick={()=>togglePagado(r.workerId)}
                            style={{
                              background: pag ? "rgba(34,197,94,0.1)" : "transparent",
                              border: `1px solid ${pag ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                              borderRadius: 6, padding:"3px 10px", fontSize: 11,
                              color: pag ? "#16a34a" : "var(--text-muted)",
                              cursor:"pointer", fontWeight: 600,
                            }}>
                            {pag ? "✓ Pagado" : "Marcar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr><td colSpan={11} style={{ textAlign:"center", padding: 36, color:"var(--text-muted)" }}>Sin registros</td></tr>}
              </tbody>
              <tfoot>
                <tr style={{ background:"var(--bg)" }}>
                  <td colSpan={6} style={{ padding:"12px 14px", fontWeight: 700, borderTop:"2px solid var(--border)" }}>Totales</td>
                  <td style={{ borderTop:"2px solid var(--border)" }}><HideableAmount value={money(totalBruto)} size={14} color="var(--text)" weight={800} fontFamily="'DM Mono',monospace" /></td>
                  <td style={{ borderTop:"2px solid var(--border)" }}><HideableAmount value={`−${money(totalAdel)}`} size={14} color="#f59e0b" weight={800} fontFamily="'DM Mono',monospace" /></td>
                  <td style={{ borderTop:"2px solid var(--border)" }}><HideableAmount value={money(totalNeto)} size={14} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" /></td>
                  <td colSpan={2} style={{ borderTop:"2px solid var(--border)" }} />
                </tr>
              </tfoot>
            </table>
          </div>
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
    </>
  );
}
