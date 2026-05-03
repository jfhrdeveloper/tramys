"use client";

/* ================= IMPORTS ================= */
import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Icon } from "@/components/ui/Icons";
import { PanelCaja } from "@/components/sedes/PanelCaja";
import { useData } from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";
import { PERIODOS, PERIODO_LABEL, rangoPeriodo, type Periodo } from "@/lib/utils/periodos";

/* ================= PÁGINA ================= */
export default function CajaPage() {
  const d = useData();
  const { worker: actor, sede: sedeActor } = useSession();
  const isEnc = actor?.rol === "encargado";

  const [periodo, setPeriodo] = useState<Periodo>("diario");
  const [offset, setOffset]   = useState(0);
  const [sedeId, setSedeId]   = useState<string | null>(null);

  /* Cambiar de periodo resetea el offset: el "anterior" significa cosas
     distintas según la unidad y arrastrar el offset confunde. */
  function cambiarPeriodo(p: Periodo) {
    setPeriodo(p);
    setOffset(0);
  }
  /* `esActual` se evalúa contra el rango del offset actual vs offset 0 para
     deshabilitar la flecha → cuando ya estás en el periodo en curso. */
  const esActual = useMemo(() => {
    const r = rangoPeriodo(periodo, offset);
    const a = rangoPeriodo(periodo, 0);
    return r.desdeISO === a.desdeISO && r.hastaISO === a.hastaISO;
  }, [periodo, offset]);

  /* Sedes que el usuario puede ver:
     - Owner → todas las sedes activas.
     - Encargado → solo la suya asignada. */
  const sedesVisibles = useMemo(() => {
    if (isEnc) return sedeActor ? [sedeActor] : [];
    return d.sedes.filter(s => s.activa);
  }, [isEnc, sedeActor, d.sedes]);

  /* Sede seleccionada por defecto: la del encargado o la primera del owner. */
  useEffect(() => {
    if (sedeId && sedesVisibles.some(s => s.id === sedeId)) return;
    if (sedesVisibles.length > 0) setSedeId(sedesVisibles[0].id);
  }, [sedesVisibles, sedeId]);

  const sedeSel = sedeId ? d.sedes.find(s => s.id === sedeId) ?? null : null;

  /* Encargado sin sede asignada → mensaje guía. */
  if (isEnc && !sedeActor) {
    return (
      <>
        <Topbar title="Caja" subtitle="Sin sede asignada" />
        <main className="page-main">
          <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            No tienes una sede asignada. Pide al owner que te asocie a una sede para ver la caja.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Caja"
        subtitle={sedeSel ? `${sedeSel.nombre} · gastos operativos` : "Gastos operativos"}
      />
      <main className="page-main">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ====== Controles: selector de sede + toggle de periodo ====== */}
          <div className="card" style={{
            padding: 14,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: 12, flexWrap: "wrap",
          }}>
            {/* Selector de sede (solo owner; encargado no necesita) */}
            {!isEnc && sedesVisibles.length > 1 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {sedesVisibles.map(s => {
                  const active = s.id === sedeId;
                  return (
                    <button key={s.id} onClick={() => setSedeId(s.id)}
                      style={{
                        padding: "6px 12px", borderRadius: 99,
                        border: active ? `1px solid ${s.color}` : "1px solid var(--border)",
                        background: active ? `${s.color}14` : "transparent",
                        color: active ? s.color : "var(--text-muted)",
                        fontWeight: active ? 700 : 500, fontSize: 12, cursor: "pointer",
                        display: "inline-flex", alignItems: "center", gap: 6,
                      }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color }} />
                      {s.nombre}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12 }}>
                <Icon name="sedes" size={14} color={sedeSel?.color ?? "var(--text-muted)"} />
                <span style={{ fontWeight: 600 }}>{sedeSel?.nombre ?? "—"}</span>
              </div>
            )}

            {/* Toggle de periodo + flechas de navegación. */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{
                display: "flex", background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: 8, padding: 3, flexWrap: "wrap",
              }}>
                {PERIODOS.map(p => {
                  const active = periodo === p;
                  const col = sedeSel?.color ?? "#C41A3A";
                  return (
                    <button key={p} onClick={() => cambiarPeriodo(p)}
                      style={{
                        padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                        background: active ? col : "transparent",
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

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => setOffset(o => o - 1)}
                  title="Periodo anterior"
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: "1px solid var(--border)", background: "var(--card)",
                    color: "var(--text)", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon name="arrow_left" size={14} />
                </button>
                {!esActual && (
                  <button
                    onClick={() => setOffset(0)}
                    title="Volver al periodo actual"
                    style={{
                      padding: "5px 10px", borderRadius: 6, fontSize: 11,
                      border: `1px solid ${sedeSel?.color ?? "#C41A3A"}`,
                      background: `${sedeSel?.color ?? "#C41A3A"}14`,
                      color: sedeSel?.color ?? "#C41A3A",
                      cursor: "pointer", fontWeight: 700,
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    Hoy
                  </button>
                )}
                <button
                  onClick={() => setOffset(o => o + 1)}
                  disabled={esActual}
                  title={esActual ? "Ya estás en el periodo actual" : "Periodo siguiente"}
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: esActual ? "var(--bg)" : "var(--card)",
                    color: esActual ? "var(--text-muted)" : "var(--text)",
                    cursor: esActual ? "not-allowed" : "pointer", opacity: esActual ? 0.5 : 1,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    transform: "rotate(180deg)",
                  }}
                >
                  <Icon name="arrow_left" size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* ====== Panel de caja ====== */}
          {sedeSel ? (
            <PanelCaja sede={sedeSel} periodo={periodo} offset={offset} />
          ) : (
            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              No hay sedes activas.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
