"use client";

import { useMemo } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Icon } from "@/components/ui/Icons";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { money } from "@/lib/utils/formatters";
import { useData, ingresoDia, isoToday, isWeekendISO } from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";
import Link from "next/link";
import { Pagination, usePagination } from "@/components/ui/Pagination";

export default function DashboardPage() {
  const d = useData();
  const { worker: actor, sede: sedeActor } = useSession();
  const isEnc = actor?.rol === "encargado";
  const hoy = isoToday();

  /* ==== Asistencia de hoy (scoped por sede si es encargado) ==== */
  const hoyRecords = useMemo(() => {
    return d.workers
      .filter(w => w.activo && w.rol === "trabajador" && (!isEnc || !sedeActor || w.sedeId === sedeActor.id))
      .map(w => {
        const rec = d.asistencia.find(a => a.workerId === w.id && a.fecha === hoy);
        return { worker: w, rec };
      });
  }, [d.workers, d.asistencia, hoy, isEnc, sedeActor]);

  const presentes = hoyRecords.filter(x => x.rec?.estado === "presente").length;
  const tardanzas = hoyRecords.filter(x => x.rec?.estado === "tardanza").length;
  const ausentes  = hoyRecords.filter(x => !x.rec || x.rec.estado === "ausente").length;
  const pctAsist  = hoyRecords.length ? Math.round(((presentes + tardanzas) / hoyRecords.length) * 100) : 0;

  /* ==== Comisiones jaladores del mes ==== */
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const ingresosMes = d.ingresosJaladores.filter(i => {
    const dt = new Date(i.fecha);
    return dt.getFullYear() === year && dt.getMonth() === month;
  });
  const comisionesMes = ingresosMes.reduce((a, i) => {
    const j = d.jaladores.find(x => x.id === i.jaladorId);
    if (!j) return a;
    return a + (i.monto * j.porcentajeComision / 100);
  }, 0);

  /* ==== Planilla del mes (aproximada con tarifas × asistencia del mes) ==== */
  const planillaMes = useMemo(() => {
    let total = 0;
    for (const w of d.workers) {
      if (!w.activo || w.rol === "owner") continue;
      const recs = d.asistencia.filter(a => {
        if (a.workerId !== w.id) return false;
        const [y, m] = a.fecha.split("-").map(Number);
        return y === year && m - 1 === month;
      });
      for (const r of recs) {
        const feriado = esFeriadoOficial(r.fecha).es;
        total += ingresoDia(r, w.tarifas, isWeekendISO(r.fecha), feriado);
      }
    }
    return total;
  }, [d.workers, d.asistencia, year, month]);

  /* ==== Cumpleaños hoy ==== */
  const hoyMMDD = hoy.slice(5);
  const cumpleHoy = d.eventos.filter(e => e.tipo === "cumpleanos" && e.date.slice(5) === hoyMMDD);

  /* ==== Ranking jaladores por comisión del mes ==== */
  const rankingJaladores = useMemo(() => {
    return d.jaladores
      .filter(j => j.activo)
      .map(j => {
        const ing = ingresosMes.filter(i => i.jaladorId === j.id).reduce((a, i) => a + i.monto, 0);
        const com = ing * j.porcentajeComision / 100;
        return { j, ingresos: ing, comisiones: com };
      })
      .sort((a, b) => b.comisiones - a.comisiones);
  }, [d.jaladores, ingresosMes]);
  const totalIngresoJal = rankingJaladores.reduce((a, r) => a + r.ingresos, 0);

  /* ==== Actividad reciente ==== */
  const actividad = useMemo(() => {
    const items: { text: string; hora: string; color: string; icon: string }[] = [];
    for (const r of d.asistencia.filter(a => a.fecha === hoy).slice(0, 6)) {
      const w = d.workers.find(x => x.id === r.workerId);
      if (!w) continue;
      if (r.estado === "tardanza") items.push({ text:`${w.apodo || w.nombre.split(" ")[0]} llegó tarde`, hora:r.entrada ?? "—", color:"#f59e0b", icon:"alert_circle" });
      else if (r.estado === "presente") items.push({ text:`${w.apodo || w.nombre.split(" ")[0]} registró entrada`, hora:r.entrada ?? "—", color:"#22c55e", icon:"check_circle" });
    }
    return items.slice(0, 6);
  }, [d.asistencia, d.workers, hoy]);

  const pagPresencia = usePagination(hoyRecords);

  return (
    <>
      <Topbar title="Dashboard" subtitle="Vista general operativa" />
      <main className="page-main">

        {/* ====== HERO: Resumen del día ====== */}
        <div
          className="card"
          style={{
            marginBottom: 16,
            background: "linear-gradient(135deg, rgba(196,26,58,0.08) 0%, rgba(196,26,58,0.02) 100%)",
            borderLeft: "4px solid var(--brand)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 0.8 }}>
              Operación de hoy
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginTop: 4 }}>
              {new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              {d.sedes.filter(s => s.activa).length} sedes · {d.workers.filter(w => w.activo && w.rol === "trabajador").length} trabajadores
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Asistencia</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--brand)", fontFamily: "'DM Mono',monospace" }}>{pctAsist}%</span>
            </div>
            <ProgressBar value={pctAsist} height={8} showPct={false} />
            <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", marginTop: 4 }}>
              <span><span style={{ color: "#16a34a", fontWeight: 700 }}>●</span> {presentes}</span>
              <span><span style={{ color: "#f59e0b", fontWeight: 700 }}>●</span> {tardanzas}</span>
              <span><span style={{ color: "#8b8fa8", fontWeight: 700 }}>●</span> {ausentes}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Planilla del mes</span>
            <HideableAmount value={money(planillaMes)} size={22} color="var(--text)" weight={800} fontFamily="'DM Mono',monospace" />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Acumulado a hoy</span>
          </div>

          {!isEnc && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Comisiones jaladores</span>
            <HideableAmount value={money(comisionesMes)} size={22} color="#16a34a" weight={800} fontFamily="'DM Mono',monospace" />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Abril · a pagar</span>
          </div>
          )}
        </div>

        {/* ====== Alertas ====== */}
        {cumpleHoy.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="card" style={{ borderLeft: "4px solid #f59e0b", background: "rgba(245,158,11,0.04)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="cake" size={22} color="#d97706" />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#d97706" }}>
                    {cumpleHoy.length === 1 ? "¡Cumpleaños hoy!" : `${cumpleHoy.length} cumpleaños hoy`}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {cumpleHoy.map(c => c.nombre).join(", ")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== Columna A: Sedes + Asistencia | Columna B: Jaladores + Actividad ====== */}
        <div className="grid-2" style={{ marginBottom: 16 }}>

          {/* Presencia por sede (encargado solo ve su propia sede) */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
              {isEnc ? "Presencia de mi sede" : "Presencia por sede"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {d.sedes.filter(s => s.activa && (!isEnc || !sedeActor || s.id === sedeActor.id)).map(s => {
                const recs = hoyRecords.filter(r => r.worker.sedeId === s.id);
                const p = recs.filter(r => r.rec?.estado === "presente").length;
                const t = recs.filter(r => r.rec?.estado === "tardanza").length;
                const a = recs.filter(r => !r.rec || r.rec.estado === "ausente").length;
                const pct = recs.length ? Math.round(((p + t) / recs.length) * 100) : 0;
                return (
                  <Link key={s.id} href="/asistencia" style={{ textDecoration: "none" }}>
                    <div style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderLeft: `4px solid ${s.color}`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      display: "flex", alignItems: "center", gap: 12,
                      transition: "all 0.15s", cursor: "pointer",
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--hover)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg)"}
                    >
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="sedes" size={20} color={s.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{s.nombre}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>
                          {p} pres · {t} tard · {a} aus
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{pct}%</div>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase" }}>asistencia</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Ranking jaladores (oculto para encargado) */}
          {!isEnc && (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Ranking jaladores</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>Por comisión del mes</div>
              </div>
              <Link href="/jaladores" style={{ fontSize: 11, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>Ver todos →</Link>
            </div>
            {rankingJaladores.slice(0, 5).map((r, i) => {
              const sede = d.sedes.find(s => s.id === r.j.sedeId);
              const max = rankingJaladores[0]?.ingresos || 1;
              const pct = Math.round((r.ingresos / max) * 100);
              const MEDAL = ["#f59e0b", "#94a3b8", "#b45309"];
              return (
                <div key={r.j.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {i < 3 ? <Icon name="trophy" size={14} color={MEDAL[i]} />
                        : <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>{i + 1}</span>}
                    </span>
                    <PhotoAvatar src={r.j.avatarBase64} initials={(r.j.apodo || r.j.nombre)[0]} size={22} color={sede?.color ?? "#C41A3A"} />
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.j.apodo || r.j.nombre}
                    </span>
                    <HideableAmount value={money(r.comisiones)} size={11} color="#16a34a" weight={700} fontFamily="'DM Mono',monospace" />
                  </div>
                  <div style={{ paddingLeft: 28 }}><ProgressBar value={pct} showPct={false} /></div>
                </div>
              );
            })}
            <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(196,26,58,0.06)", border: "1px solid rgba(196,26,58,0.15)", borderRadius: 9, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Ingreso total</span>
              <HideableAmount value={money(totalIngresoJal)} size={15} color="var(--brand)" weight={800} fontFamily="'DM Mono',monospace" />
            </div>
          </div>
          )}
        </div>

        {/* ====== Actividad reciente ====== */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Actividad reciente</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>Eventos de hoy</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} className="animate-pulse-dot" />
              <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>LIVE</span>
            </div>
          </div>
          {actividad.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Sin actividad registrada hoy
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {actividad.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={f.icon} size={14} color={f.color} />
                  </div>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{f.text}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace" }}>{f.hora}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabla rápida de últimos registros */}
        <div className="card" style={{ marginTop: 16, padding: 0, overflow:"hidden" }}>
          <div style={{ fontWeight: 700, fontSize: 15, padding:"16px 18px 12px" }}>Presencia en vivo</div>
          <div className="table-wrap">
            <table className="tramys-table">
              <thead>
                <tr><th>Trabajador</th><th>Sede</th><th>Entrada</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {pagPresencia.pageItems.map(r => {
                  const s = d.sedes.find(s => s.id === r.worker.sedeId);
                  const est = r.rec?.estado ?? "ausente";
                  return (
                    <tr key={r.worker.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <PhotoAvatar src={r.worker.avatarBase64} initials={(r.worker.apodo || r.worker.nombre)[0]} size={26} color={s?.color ?? "#C41A3A"} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.worker.apodo || r.worker.nombre.split(" ")[0]}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.worker.nombre}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 11, fontWeight: 600, color: s?.color ?? "var(--text-muted)" }}>{s?.nombre}</span></td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{r.rec?.entrada ?? "—"}</td>
                      <td><Badge variant={est as "presente" | "tardanza" | "ausente" | "permiso" | "feriado"} small /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagPresencia.needsPagination && (
            <Pagination
              page={pagPresencia.page}
              totalPages={pagPresencia.totalPages}
              total={pagPresencia.total}
              rangeStart={pagPresencia.rangeStart}
              rangeEnd={pagPresencia.rangeEnd}
              onChange={pagPresencia.setPage}
              label="trabajadores"
            />
          )}
        </div>

      </main>
    </>
  );
}
