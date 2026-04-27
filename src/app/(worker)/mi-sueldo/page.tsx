"use client";

/* ================= MI SUELDO (TRABAJADOR) ================= */
/* Cálculo dinámico: Σ días × tarifa, descontando adelantos    */
/* aprobados del mes. Sin sueldo base.                         */

import { useMemo, useState } from "react";
import { TopbarWorker } from "@/components/layout/TopbarWorker";
import { Icon } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { money } from "@/lib/utils/formatters";
import { useWorkerSession } from "@/hooks/useWorkerSession";
import { useData, ingresoDia, isWeekendISO } from "@/components/providers/DataProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";
import { Pagination, usePagination } from "@/components/ui/Pagination";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function MiSueldoPage() {
  const worker = useWorkerSession();
  const d = useData();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  /* ====== Cálculo del mes ====== */
  const desglose = useMemo(() => {
    const base = {
      normal: 0, tardanza: 0, finSem: 0, feriado: 0, override: 0,
      brutoNormal: 0, brutoTardanza: 0, brutoFinSem: 0, brutoFeriado: 0, brutoOverride: 0,
      bruto: 0, registros: [] as typeof d.asistencia,
    };
    if (!worker) return base;
    for (const a of d.asistencia) {
      if (a.workerId !== worker.id) continue;
      const [y, m] = a.fecha.split("-").map(Number);
      if (y !== year || m - 1 !== month) continue;
      base.registros.push(a);
      const esFer = esFeriadoOficial(a.fecha).es;
      const esFds = isWeekendISO(a.fecha);
      const ing   = ingresoDia(a, worker.tarifas, esFds, esFer);
      base.bruto += ing;
      if (a.overrideIngreso !== null) {
        base.override     += 1;
        base.brutoOverride += ing;
        continue;
      }
      if (a.estado === "ausente" || a.estado === "permiso") continue;
      if (a.estado === "feriado" || esFer)   { base.feriado += 1;  base.brutoFeriado  += ing; }
      else if (esFds)                         { base.finSem  += 1;  base.brutoFinSem   += ing; }
      else if (a.estado === "tardanza")       { base.tardanza+= 1;  base.brutoTardanza += ing; }
      else                                    { base.normal  += 1;  base.brutoNormal   += ing; }
    }
    base.registros.sort((a,b) => b.fecha.localeCompare(a.fecha));
    return base;
  }, [worker, d.asistencia, year, month]);

  /* ====== Adelantos aprobados del mes ====== */
  const misAdelantos = useMemo(() => {
    if (!worker) return [];
    return d.adelantos
      .filter(a => a.workerId === worker.id && a.estado === "aprobado")
      .filter(a => {
        const [y, m] = a.fecha.split("-").map(Number);
        return y === year && m - 1 === month;
      })
      .sort((a,b) => b.fecha.localeCompare(a.fecha));
  }, [worker, d.adelantos, year, month]);

  const totalAdelantos = misAdelantos.reduce((a, x) => a + x.monto, 0);
  const neto = Math.max(0, desglose.bruto - totalAdelantos);

  const pagAdel = usePagination(misAdelantos);
  const pagDias = usePagination(desglose.registros);

  function cambiarMes(dir: -1 | 1) {
    setMonth(m => {
      const nx = m + dir;
      if (nx < 0)  { setYear(y => y - 1); return 11; }
      if (nx > 11) { setYear(y => y + 1); return 0;  }
      return nx;
    });
  }

  if (!worker) {
    return (
      <>
        <TopbarWorker title="Mi Sueldo" subtitle="—" onMenuToggle={()=>{}} />
        <main className="page-main"><div className="card">Cargando...</div></main>
      </>
    );
  }

  const sede = d.sedes.find(s => s.id === worker.sedeId);

  /* ====== Filas de desglose por tipo de día ====== */
  const filas = [
    { k:"Día normal",   n: desglose.normal,   t: worker.tarifas.diaNormal, total: desglose.brutoNormal,   color:"#16a34a" },
    { k:"Tardanza",     n: desglose.tardanza, t: worker.tarifas.tardanza,  total: desglose.brutoTardanza, color:"#f59e0b" },
    { k:"Fin de semana",n: desglose.finSem,   t: worker.tarifas.finSemana, total: desglose.brutoFinSem,   color:"#6366f1" },
    { k:"Feriado",      n: desglose.feriado,  t: worker.tarifas.feriado,   total: desglose.brutoFeriado,  color:"var(--brand)" },
  ];

  return (
    <>
      <TopbarWorker title="Mi Sueldo" subtitle={`${MESES[month]} ${year}`} onMenuToggle={()=>{}} />
      <main className="page-main animate-fade-in">

        {/* ====== Selector mes/año ====== */}
        <div style={{ display:"flex", gap: 8, alignItems:"center", marginBottom: 14, flexWrap:"wrap" }}>
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
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* ====== Hero neto ====== */}
        <div className="card" style={{
          marginBottom: 14,
          background: `linear-gradient(135deg, ${sede?.color ?? "#C41A3A"}18, ${sede?.color ?? "#C41A3A"}04)`,
          borderLeft: `4px solid ${sede?.color ?? "#C41A3A"}`,
          display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap: 14,
        }}>
          <div>
            <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .8 }}>
              Total bruto
            </div>
            <HideableAmount value={money(desglose.bruto)} size={22} color="var(--text)" weight={800} fontFamily="'DM Mono',monospace" />
            <div style={{ fontSize: 11, color:"var(--text-muted)", marginTop: 4 }}>
              {desglose.normal + desglose.tardanza + desglose.finSem + desglose.feriado + desglose.override} días registrados
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .8 }}>
              Adelantos
            </div>
            <HideableAmount value={`−${money(totalAdelantos)}`} size={22} color="#f59e0b" weight={800} fontFamily="'DM Mono',monospace" />
            <div style={{ fontSize: 11, color:"var(--text-muted)", marginTop: 4 }}>
              {misAdelantos.length} aprobado{misAdelantos.length === 1 ? "" : "s"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .8 }}>
              Neto a recibir
            </div>
            <HideableAmount value={money(neto)} size={26} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" />
            <div style={{ fontSize: 11, color:"var(--text-muted)", marginTop: 4 }}>Bruto − adelantos</div>
          </div>
        </div>

        <div className="grid-2" style={{ alignItems:"start" }}>

          {/* ====== Desglose por tipo de día ====== */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Desglose por tipo de día</div>
            <div style={{ fontSize: 11, color:"var(--text-muted)", marginBottom: 12 }}>
              Sueldo dinámico: cada día se calcula con su tarifa correspondiente.
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
              {filas.map(r => (
                <div key={r.k} style={{
                  display:"flex", alignItems:"center", gap: 12,
                  padding:"10px 14px", background:"var(--bg)",
                  border:"1px solid var(--border)", borderLeft:`4px solid ${r.color}`,
                  borderRadius: 9,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.k}</div>
                    <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
                      {r.n} día{r.n === 1 ? "" : "s"} × {money(r.t)}
                    </div>
                  </div>
                  <HideableAmount value={money(r.total)} size={14} color={r.color} weight={800} fontFamily="'DM Mono',monospace" />
                </div>
              ))}

              {desglose.override > 0 && (
                <div style={{
                  display:"flex", alignItems:"center", gap: 12,
                  padding:"10px 14px", background:"var(--bg)",
                  border:"1px solid var(--border)", borderLeft:"4px solid #8b8fa8",
                  borderRadius: 9,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Ajustes manuales</div>
                    <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
                      {desglose.override} día{desglose.override === 1 ? "" : "s"} con monto fijo
                    </div>
                  </div>
                  <HideableAmount value={money(desglose.brutoOverride)} size={14} color="#8b8fa8" weight={800} fontFamily="'DM Mono',monospace" />
                </div>
              )}
            </div>

            <div style={{
              marginTop: 12, padding:"12px 14px",
              background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.3)",
              borderRadius: 10,
              display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              <span style={{ fontWeight: 700, color:"#16a34a" }}>Subtotal bruto</span>
              <HideableAmount value={money(desglose.bruto)} size={18} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" />
            </div>
          </div>

          {/* ====== Mis tarifas + Adelantos del mes ====== */}
          <div style={{ display:"flex", flexDirection:"column", gap: 12 }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Mis tarifas</div>
              <div style={{ fontSize: 11, color:"var(--text-muted)", marginBottom: 12 }}>
                Definidas por administración. Si tienes alguna duda, conversa con tu encargado.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8 }}>
                {[
                  { k:"Día normal",   v: worker.tarifas.diaNormal, color:"#16a34a"     },
                  { k:"Tardanza",     v: worker.tarifas.tardanza,   color:"#f59e0b"     },
                  { k:"Fin de semana",v: worker.tarifas.finSemana,  color:"#6366f1"     },
                  { k:"Feriado",      v: worker.tarifas.feriado,    color:"var(--brand)"},
                ].map(r => (
                  <div key={r.k} style={{
                    padding: 10, background:"var(--bg)",
                    border:"1px solid var(--border)", borderLeft:`4px solid ${r.color}`,
                    borderRadius: 8,
                  }}>
                    <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>{r.k}</div>
                    <HideableAmount value={money(r.v)} size={15} color={r.color} weight={800} fontFamily="'DM Mono',monospace" />
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Adelantos del mes</div>
                <span style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>
                  {misAdelantos.length} aprobado{misAdelantos.length === 1 ? "" : "s"}
                </span>
              </div>
              <div style={{ fontSize: 11, color:"var(--text-muted)", marginBottom: 12 }}>
                Solo se descuentan los aprobados. Pendientes y rechazados no afectan el neto.
              </div>

              {misAdelantos.length === 0 ? (
                <div style={{ padding:"24px 0", textAlign:"center", color:"var(--text-muted)", fontSize: 12 }}>
                  Sin adelantos aprobados este mes
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
                  {pagAdel.pageItems.map(a => (
                    <div key={a.id} style={{
                      display:"flex", alignItems:"center", gap: 10,
                      padding:"9px 12px", background:"var(--bg)",
                      border:"1px solid var(--border)", borderRadius: 8,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <HideableAmount value={`−${money(a.monto)}`} size={13} color="#f59e0b" weight={800} fontFamily="'DM Mono',monospace" />
                        <div style={{ fontSize: 10, color:"var(--text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {a.fecha} · {a.motivo}
                        </div>
                      </div>
                      <Badge variant="aprobado" small />
                    </div>
                  ))}
                  {pagAdel.needsPagination && (
                    <Pagination
                      page={pagAdel.page}
                      totalPages={pagAdel.totalPages}
                      total={pagAdel.total}
                      rangeStart={pagAdel.rangeStart}
                      rangeEnd={pagAdel.rangeEnd}
                      onChange={pagAdel.setPage}
                      label="adelantos"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ====== Detalle por día (solo registros del mes) ====== */}
        <div className="card" style={{ marginTop: 14, padding: 0, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Días del mes</div>
            <span style={{ fontSize: 11, color:"var(--text-muted)" }}>
              {desglose.registros.length} registros
            </span>
          </div>
          <div className="table-wrap">
            <table className="tramys-table">
              <thead>
                <tr>
                  <th>Fecha</th><th>Estado</th><th>Entrada</th><th>Salida</th><th>Tipo</th><th>Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {desglose.registros.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign:"center", padding: 30, color:"var(--text-muted)" }}>Sin registros</td></tr>
                )}
                {pagDias.pageItems.map(r => {
                  const esFer = esFeriadoOficial(r.fecha).es;
                  const esFds = isWeekendISO(r.fecha);
                  const ing   = ingresoDia(r, worker.tarifas, esFds, esFer);
                  let tipo = "Normal", color = "#16a34a";
                  if (r.overrideIngreso !== null) { tipo = "Ajuste"; color = "#8b8fa8"; }
                  else if (r.estado === "feriado" || esFer) { tipo = "Feriado"; color = "var(--brand)"; }
                  else if (esFds) { tipo = "Fin de semana"; color = "#6366f1"; }
                  else if (r.estado === "tardanza") { tipo = "Tardanza"; color = "#f59e0b"; }
                  else if (r.estado === "ausente" || r.estado === "permiso") { tipo = "—"; color = "#8b8fa8"; }
                  return (
                    <tr key={r.id}>
                      <td style={{ fontFamily:"'DM Mono',monospace", fontSize: 12 }}>{r.fecha}</td>
                      <td><Badge variant={r.estado as "presente"|"tardanza"|"ausente"|"permiso"|"feriado"} small /></td>
                      <td style={{ fontFamily:"'DM Mono',monospace" }}>{r.entrada ?? "—"}</td>
                      <td style={{ fontFamily:"'DM Mono',monospace", color:"var(--text-muted)" }}>{r.salida ?? "—"}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 700, color }}>{tipo}</span></td>
                      <td><HideableAmount value={money(ing)} size={12} color={ing > 0 ? color : "var(--text-muted)"} weight={700} fontFamily="'DM Mono',monospace" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagDias.needsPagination && (
            <Pagination
              page={pagDias.page}
              totalPages={pagDias.totalPages}
              total={pagDias.total}
              rangeStart={pagDias.rangeStart}
              rangeEnd={pagDias.rangeEnd}
              onChange={pagDias.setPage}
              label="días"
            />
          )}
        </div>
      </main>
    </>
  );
}
