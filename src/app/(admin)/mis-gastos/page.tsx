"use client";

/* ================= IMPORTS ================= */
import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Icon } from "@/components/ui/Icons";
import { PanelMisGastos } from "@/components/sedes/PanelMisGastos";
import { useData } from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";
import { PERIODOS, PERIODO_LABEL, type Periodo } from "@/lib/utils/periodos";

/* ================= PÁGINA ================= */
export default function MisGastosPage() {
  const d = useData();
  const { worker: actor, sede: sedeActor } = useSession();
  const isEnc = actor?.rol === "encargado";

  const [periodo, setPeriodo] = useState<Periodo>("diario");
  const [sedeId, setSedeId]   = useState<string | null>(null);

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
        <Topbar title="Mis gastos" subtitle="Sin sede asignada" />
        <main className="page-main">
          <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            No tienes una sede asignada. Pide al owner que te asocie a una sede para ver los gastos.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Mis gastos"
        subtitle={sedeSel ? `${sedeSel.nombre} · solo gastos` : "Solo gastos"}
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

            {/* Toggle de periodo */}
            <div style={{
              display: "flex", background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 8, padding: 3, flexWrap: "wrap",
            }}>
              {PERIODOS.map(p => {
                const active = periodo === p;
                const col = sedeSel?.color ?? "#C41A3A";
                return (
                  <button key={p} onClick={() => setPeriodo(p)}
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
          </div>

          {/* ====== Panel de gastos ====== */}
          {sedeSel ? (
            <PanelMisGastos sede={sedeSel} periodo={periodo} />
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
