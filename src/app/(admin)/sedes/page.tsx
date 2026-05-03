"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { Icon } from "@/components/ui/Icons";
import {
  useData, isoToday,
  type Sede,
} from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { PanelCaja } from "@/components/sedes/PanelCaja";
import { PERIODOS, PERIODO_LABEL, rangoPeriodo, type Periodo } from "@/lib/utils/periodos";
import { formatFecha } from "@/lib/utils/formatters";

const COLORES_SUG = ["#C41A3A","#1d6fa4","#16a34a","#f59e0b","#6366f1","#8b5cf6","#ec4899","#0ea5e9"];

/* ================= MODAL EDITAR SEDE ================= */
function ModalEditarSede({
  open, sede, onClose,
}: { open: boolean; sede: Sede | null; onClose: () => void }) {
  const d = useData();
  const [nombre, setNombre]       = useState("");
  const [color, setColor]         = useState("#C41A3A");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono]   = useState("");
  const [horario, setHorario]     = useState("");
  const [encargadoId, setEncargadoId] = useState<string>("");
  const [activa, setActiva]       = useState(true);

  useMemo(() => {
    if (sede) {
      setNombre(sede.nombre);
      setColor(sede.color);
      setDireccion(sede.direccion);
      setTelefono(sede.telefono);
      setHorario(sede.horario);
      setEncargadoId(sede.encargadoId ?? "");
      setActiva(sede.activa);
    }
  }, [sede?.id]); // eslint-disable-line

  if (!sede) return null;

  const candidatos = d.workers.filter(w => w.activo && (w.rol === "encargado" || w.rol === "owner"));
  const actual = sede.encargadoId ? d.workers.find(w => w.id === sede.encargadoId) : null;
  if (actual && !candidatos.some(c => c.id === actual.id)) candidatos.unshift(actual);

  function guardar() {
    d.updateSede(sede!.id, {
      nombre, color, direccion, telefono, horario, activa,
      encargadoId: encargadoId || undefined,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar sede" width={460}>
      <div style={{ display:"flex", flexDirection:"column", gap: 14, marginBottom: 18 }}>
        <div>
          <div className="section-label">Nombre</div>
          <input className="input-base" value={nombre} onChange={e=>setNombre(e.target.value)} />
        </div>
        <div>
          <div className="section-label">Color identificador</div>
          <div style={{ display:"flex", gap: 8, flexWrap:"wrap" }}>
            {COLORES_SUG.map(c => (
              <button key={c} type="button" onClick={()=>setColor(c)}
                style={{
                  width: 34, height: 34, borderRadius: 8, cursor: "pointer",
                  background: c, border: color===c ? "3px solid var(--text)" : "3px solid transparent",
                }}
              />
            ))}
            <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{ width: 50, height: 34, borderRadius: 8, border:"1px solid var(--border)", cursor:"pointer", background:"transparent" }} />
          </div>
        </div>

        <div>
          <div className="section-label">Encargado</div>
          <select className="select-base" style={{ width:"100%" }} value={encargadoId} onChange={e => setEncargadoId(e.target.value)}>
            <option value="">— Sin encargado asignado —</option>
            {candidatos.map(w => (
              <option key={w.id} value={w.id}>
                {w.nombre} {w.apodo ? `“${w.apodo}”` : ""} · {w.rol}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 10, color:"var(--text-muted)", marginTop: 4, fontFamily:"'DM Mono',monospace" }}>
            Solo se listan owners y encargados activos.
          </div>
        </div>

        <div>
          <div className="section-label">Dirección</div>
          <input className="input-base" value={direccion} onChange={e=>setDireccion(e.target.value)} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
          <div>
            <div className="section-label">Teléfono</div>
            <input className="input-base" value={telefono} onChange={e=>setTelefono(e.target.value)} />
          </div>
          <div>
            <div className="section-label">Horario</div>
            <input className="input-base" value={horario} onChange={e=>setHorario(e.target.value)} />
          </div>
        </div>

        <label style={{ display:"flex", alignItems:"center", gap: 8, cursor:"pointer" }}>
          <input type="checkbox" checked={activa} onChange={e=>setActiva(e.target.checked)} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Sede activa</span>
        </label>
      </div>
      <div style={{ display:"flex", gap: 10 }}>
        <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={guardar}>Guardar</button>
      </div>
    </Modal>
  );
}

/* ================= TABLA DE TRABAJADORES (tab) ================= */
function TablaTrabajadores({ sede }: { sede: Sede }) {
  const d = useData();
  const hoy = isoToday();
  const workersSede = d.workers.filter(w => w.sedeId === sede.id && w.activo);
  const pag = usePagination(workersSede);

  return (
    <div className="card" style={{ padding: 0, overflow:"hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>
        Trabajadores de {sede.nombre} ({workersSede.length})
      </div>
      <div className="table-wrap">
        <table className="tramys-table">
          <thead><tr><th>Trabajador</th><th>Apodo</th><th>Cargo</th><th>Turno</th><th>Estado</th></tr></thead>
          <tbody>
            {pag.pageItems.map(w => {
              const rec = d.asistencia.find(a => a.workerId === w.id && a.fecha === hoy);
              return (
                <tr key={w.id}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                      <PhotoAvatar src={w.avatarBase64} initials={(w.apodo || w.nombre)[0]} size={28} color={sede.color} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{w.nombre}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: sede.color, fontWeight: 600 }}>{w.apodo}</td>
                  <td style={{ fontSize: 12, color:"var(--text-muted)" }}>{w.cargo}</td>
                  <td style={{ fontFamily:"'DM Mono',monospace", fontSize: 11, color:"var(--text-muted)" }}>
                    {w.turno.entrada}–{w.turno.salida}
                  </td>
                  <td><Badge variant={(rec?.estado ?? "ausente") as "presente" | "tardanza" | "ausente" | "permiso" | "feriado"} small /></td>
                </tr>
              );
            })}
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
          label="trabajadores"
        />
      )}
    </div>
  );
}

/* ================= TAB CAJA ================= */
function TabCaja({ sede }: { sede: Sede }) {
  const [periodo, setPeriodo] = useState<Periodo>("diario");
  /* offset = 0 → periodo en curso; -1 → anterior; etc. Solo se navega hacia
     atrás (no tiene sentido ir al futuro cuando no hay datos). */
  const [offset, setOffset]   = useState(0);

  /* Al cambiar de periodo reseteamos offset: el "anterior" significa cosas
     distintas según la unidad y arrastrar el offset confunde. */
  function cambiarPeriodo(p: Periodo) {
    setPeriodo(p);
    setOffset(0);
  }

  const rango       = useMemo(() => rangoPeriodo(periodo, offset),     [periodo, offset]);
  const rangoActual = useMemo(() => rangoPeriodo(periodo, 0),          [periodo]);
  const esActual    = rango.desdeISO === rangoActual.desdeISO && rango.hastaISO === rangoActual.hastaISO;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toggle periodo + flechas de navegación */}
      <div className="card" style={{
        padding: 12,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, flexWrap: "wrap",
      }}>
        <div style={{
          display: "flex", background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 8, padding: 3, flexWrap: "wrap",
        }}>
          {PERIODOS.map(p => {
            const active = periodo === p;
            return (
              <button key={p} onClick={() => cambiarPeriodo(p)}
                style={{
                  padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: active ? sede.color : "transparent",
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

        {/* Navegación de periodo: ← anterior · ahora · → siguiente
            La flecha → solo se activa si NO estamos en el periodo actual. */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Mono',monospace" }}>
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
                border: `1px solid ${sede.color}`, background: `${sede.color}14`,
                color: sede.color, cursor: "pointer", fontWeight: 700,
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

      <PanelCaja sede={sede} periodo={periodo} offset={offset} />
    </div>
  );
}

/* ================= DETALLE DE SEDE (con tabs) ================= */
type TabKey = "caja" | "trabajadores";

function DetalleSede({ sede, onBack, onEditar, mostrarVolver, puedeEditarSede }:
  { sede: Sede; onBack: () => void; onEditar: () => void; mostrarVolver: boolean; puedeEditarSede: boolean }
) {
  const d = useData();
  const router = useRouter();
  const params = useSearchParams();

  const tabUrl = (params.get("tab") as TabKey | null) ?? "caja";
  const tabActiva: TabKey = tabUrl === "trabajadores" ? "trabajadores" : "caja";

  /* Deep-link: setear ?tab= sin recargar. */
  function setTab(t: TabKey) {
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", t);
    router.replace(`?${sp.toString()}`, { scroll: false });
  }

  const workersSede = d.workers.filter(w => w.sedeId === sede.id && w.activo);
  const hoy = isoToday();
  const asistHoy = d.asistencia.filter(a => a.fecha === hoy && workersSede.some(w => w.id === a.workerId));
  const presentes = asistHoy.filter(a => a.estado === "presente").length;
  const tardanzas = asistHoy.filter(a => a.estado === "tardanza").length;
  const encargado = d.workers.find(w => w.id === sede.encargadoId);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap: 16 }}>
      {mostrarVolver && (
        <button onClick={onBack} className="btn-outline" style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap: 6 }}>
          <Icon name="arrow_left" size={14} /> Volver a sedes
        </button>
      )}

      {/* ===== Header de la sede (siempre visible) ===== */}
      <div className="card" style={{ padding: 0, overflow:"hidden" }}>
        <div style={{ height: 6, background: `linear-gradient(90deg, ${sede.color}88, ${sede.color})` }} />
        <div style={{ padding: "18px 20px", display: "flex", gap: 16, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: `${sede.color}18`, border: `1px solid ${sede.color}33`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
            <Icon name="sedes" size={32} color={sede.color} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display:"flex", alignItems:"center", gap: 10, flexWrap:"wrap", marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 22 }}>{sede.nombre}</div>
              <Badge variant={sede.activa ? "activo" : "inactivo"} />
            </div>
            <div style={{ fontSize: 12, color:"var(--text-muted)", display:"flex", gap: 14, flexWrap:"wrap" }}>
              <span><Icon name="map_pin" size={11} /> {sede.direccion}</span>
              <span><Icon name="phone" size={11} /> {sede.telefono}</span>
              <span><Icon name="clock" size={11} /> {sede.horario}</span>
            </div>
          </div>
          {puedeEditarSede && (
            <button className="btn-outline" onClick={onEditar} style={{ display:"flex", alignItems:"center", gap: 6 }}>
              <Icon name="edit" size={13} /> Editar
            </button>
          )}
        </div>

        {/* Resumen rápido (KPIs del día) */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap: 0, borderTop:"1px solid var(--border)" }}>
          {[
            { icon:"trabajadores", label:"Trabajadores", value: workersSede.filter(w=>w.rol==="trabajador").length, color: sede.color },
            { icon:"check_circle", label:"Presentes hoy", value: presentes, color:"#16a34a" },
            { icon:"alert_circle", label:"Tardanzas hoy", value: tardanzas, color:"#f59e0b" },
            { icon:"user_check", label:"Encargado", value: encargado?.apodo || encargado?.nombre.split(" ")[0] || "—", color:"#6366f1", small:true },
          ].map((k, i, arr) => (
            <div key={k.label} style={{ padding: "12px 16px", borderRight: i<arr.length-1 ? "1px solid var(--border)" : "none", display:"flex", alignItems:"center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: `${k.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
                <Icon name={k.icon} size={14} color={k.color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .5 }}>{k.label}</div>
                <div style={{ fontWeight: 800, fontSize: k.small ? 13 : 18, color: k.color }}>{k.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div style={{
        display: "flex", gap: 4, padding: 4,
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 10, alignSelf: "flex-start",
      }}>
        {([
          { k: "caja",         label: "Caja",         icon: "money_bill"   },
          { k: "trabajadores", label: "Trabajadores", icon: "trabajadores" },
        ] as const).map(t => {
          const active = tabActiva === t.k;
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{
                padding: "8px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                background: active ? sede.color : "transparent",
                color: active ? "#fff" : "var(--text-muted)",
                fontWeight: active ? 700 : 600, fontSize: 13,
                fontFamily: "'Bricolage Grotesque',sans-serif",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
              <Icon name={t.icon} size={14} color={active ? "#fff" : "var(--text-muted)"} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ===== Cuerpo de la tab activa ===== */}
      {tabActiva === "caja"
        ? <TabCaja sede={sede} />
        : <TablaTrabajadores sede={sede} />}
    </div>
  );
}

/* ================= PÁGINA PRINCIPAL ================= */
export default function SedesPage() {
  const d = useData();
  const { worker: actor, sede: sedeActor } = useSession();
  const isEnc = actor?.rol === "encargado";

  const [selId, setSelId]   = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  /* Encargado: forzar siempre el detalle de su sede asignada. */
  useEffect(() => {
    if (isEnc && sedeActor && selId !== sedeActor.id) setSelId(sedeActor.id);
  }, [isEnc, sedeActor, selId]);

  const pagSedes = usePagination(d.sedes);

  const seleccionada = selId ? d.sedes.find(s => s.id === selId) ?? null : null;

  if (seleccionada) {
    /* Encargado: solo puede ver y registrar movimientos en su propia sede.
       No edita los datos maestros de la sede (eso es del owner). */
    const puedeEditarSede = !isEnc;
    return (
      <>
        <Topbar
          title={isEnc ? "Mi sede" : seleccionada.nombre}
          subtitle={isEnc ? seleccionada.nombre : "Detalle de sede"}
        />
        <main className="page-main">
          <DetalleSede
            sede={seleccionada}
            onBack={()=>setSelId(null)}
            onEditar={()=>setEditId(seleccionada.id)}
            mostrarVolver={!isEnc}
            puedeEditarSede={puedeEditarSede}
          />
        </main>
        {puedeEditarSede && (
          <ModalEditarSede
            open={editId !== null}
            sede={editId ? d.sedes.find(s => s.id === editId) ?? null : null}
            onClose={()=>setEditId(null)}
          />
        )}
      </>
    );
  }

  /* Encargado sin sede asignada → mensaje guía. La grilla solo la ve owner. */
  if (isEnc) {
    return (
      <>
        <Topbar title="Mi sede" subtitle="Sin sede asignada" />
        <main className="page-main">
          <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            No tienes una sede asignada. Pide al owner que te asocie a una sede para ver y registrar movimientos.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Sedes" subtitle={`${d.sedes.filter(s=>s.activa).length} activas`} />
      <main className="page-main">

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {pagSedes.pageItems.map(sede => {
            const workers = d.workers.filter(w => w.sedeId === sede.id && w.activo);
            const hoy = isoToday();
            const asistHoy = d.asistencia.filter(a => a.fecha === hoy && workers.some(w => w.id === a.workerId));
            const presentes = asistHoy.filter(a => a.estado === "presente").length;
            const tardanzas = asistHoy.filter(a => a.estado === "tardanza").length;
            const pct = workers.length ? Math.round(((presentes+tardanzas) / workers.filter(w=>w.rol==="trabajador").length) * 100) : 0;
            const encargado = d.workers.find(w => w.id === sede.encargadoId);

            return (
              <div
                key={sede.id}
                onClick={()=>setSelId(sede.id)}
                className="card"
                style={{
                  padding: 0, overflow:"hidden",
                  cursor:"pointer", transition:"transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div style={{ height: 6, background: `linear-gradient(90deg, ${sede.color}88, ${sede.color})` }} />
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display:"flex", gap: 12, alignItems:"center", marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: `${sede.color}18`, border: `1px solid ${sede.color}33`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon name="sedes" size={22} color={sede.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sede.nombre}</div>
                      <div style={{ fontSize: 11, color:"var(--text-muted)" }}>
                        {encargado ? `Enc. ${encargado.apodo || encargado.nombre}` : "Sin encargado"}
                      </div>
                    </div>
                    <Badge variant={sede.activa ? "activo" : "inactivo"} small />
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                    {[
                      { icon:"trabajadores", color: sede.color, value: workers.filter(w=>w.rol==="trabajador").length, label:"Personas" },
                      { icon:"check_circle", color:"#16a34a",   value: presentes, label:"Presentes" },
                      { icon:"alert_circle", color:"#f59e0b",   value: tardanzas, label:"Tardes" },
                    ].map(k => (
                      <div key={k.label} style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 8, padding: "8px 6px", textAlign:"center" }}>
                        <Icon name={k.icon} size={13} color={k.color} />
                        <div style={{ fontSize: 16, fontWeight: 800, color: k.color, marginTop: 2 }}>{k.value}</div>
                        <div style={{ fontSize: 9, color:"var(--text-muted)" }}>{k.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 11, color:"var(--text-muted)", display:"flex", justifyContent:"space-between", marginBottom: 4 }}>
                    <span>Asistencia hoy</span>
                    <span style={{ fontWeight: 700, color: sede.color, fontFamily:"'DM Mono',monospace" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background:"var(--border)", borderRadius: 99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width: `${pct}%`, background: `linear-gradient(90deg, ${sede.color}88, ${sede.color})`, borderRadius: 99 }} />
                  </div>

                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: sede.color, fontWeight: 700, display:"inline-flex", alignItems:"center", gap: 4 }}>
                      Abrir detalle <Icon name="chevron_right" size={12} color={sede.color} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {pagSedes.needsPagination && (
          <div className="card" style={{ marginTop: 14, padding: 0, overflow:"hidden" }}>
            <Pagination
              page={pagSedes.page}
              totalPages={pagSedes.totalPages}
              total={pagSedes.total}
              rangeStart={pagSedes.rangeStart}
              rangeEnd={pagSedes.rangeEnd}
              onChange={pagSedes.setPage}
              label="sedes"
            />
          </div>
        )}
      </main>

      <ModalEditarSede
        open={editId !== null}
        sede={editId ? d.sedes.find(s => s.id === editId) ?? null : null}
        onClose={()=>setEditId(null)}
      />
    </>
  );
}
