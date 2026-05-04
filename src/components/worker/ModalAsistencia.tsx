"use client";

/* ================= MODAL MARCAR ASISTENCIA ================= */
/* Permite al trabajador marcar entrada/salida del día. Escribe   */
/* en el DataProvider con marcadoPor: "trabajador" — Opción B:    */
/* el registro queda oficial al instante pero sin verificar       */
/* hasta que owner/encargado lo revise en /asistencia.            */

import { useEffect, useMemo, useState } from "react";
import { useClock } from "@/hooks/useClock";
import { useSession } from "@/components/providers/SessionProvider";
import { useData, isoToday } from "@/components/providers/DataProvider";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { Icon } from "@/components/ui/Icons";
import { useConfirm, useToast } from "@/components/ui/Feedback";

interface Props { open: boolean; onClose: () => void; }

type Tipo = "entrada" | "salida";

const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function fechaLarga(d: Date): string {
  const dia    = DIAS[d.getDay()];
  const dom    = String(d.getDate()).padStart(2, "0");
  const mes    = MESES[d.getMonth()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${dom} de ${mes}`;
}

export function ModalAsistencia({ open, onClose }: Props) {
  const { hora, esTardanza } = useClock();
  const { worker, sede } = useSession();
  const d = useData();
  const confirm = useConfirm();
  const toast = useToast();

  const fecha = isoToday();
  const recHoy = worker ? d.getAsistencia(worker.id, fecha) : undefined;

  /* Auto-selección de tipo:
     - sin registro hoy → Entrada
     - hay entrada pero no salida → Salida
     - hay entrada y salida → Salida (avisa que sobrescribe) */
  const tipoAuto: Tipo = useMemo(() => {
    if (!recHoy?.entrada) return "entrada";
    if (recHoy.entrada && !recHoy.salida) return "salida";
    return "salida";
  }, [recHoy?.entrada, recHoy?.salida]);

  const [tipo, setTipo]   = useState<Tipo>(tipoAuto);
  const [foto, setFoto]   = useState<string | null>(null);

  /* Cuando se abre el modal, recalcular tipo según estado actual. */
  useEffect(() => {
    if (open) {
      setTipo(tipoAuto);
      setFoto(null);
    }
  }, [open, tipoAuto]);

  if (!open) return null;

  const yaTieneEntrada = !!recHoy?.entrada;
  const yaTieneSalida  = !!recHoy?.salida;
  /* Mostrar aviso solo si el tipo seleccionado ya tiene valor previo. */
  const sobrescribe = (tipo === "entrada" && yaTieneEntrada) || (tipo === "salida" && yaTieneSalida);

  async function marcar() {
    if (!worker) return;
    /* Confirmación si vamos a pisar un valor existente. */
    if (sobrescribe) {
      const horaPrev = tipo === "entrada" ? recHoy?.entrada : recHoy?.salida;
      const ok = await confirm({
        title: tipo === "entrada" ? "Reemplazar entrada" : "Reemplazar salida",
        message: `Ya marcaste ${tipo} a las ${horaPrev} hoy. ¿Reemplazar por ${hora}?`,
        confirmLabel: "Reemplazar",
        tone: "danger",
      });
      if (!ok) return;
    }
    const hh = new Date().toTimeString().slice(0, 5);
    if (tipo === "entrada") {
      const estado = esTardanza ? "tardanza" : "presente";
      d.setAsistencia(worker.id, fecha, {
        entrada: hh,
        estado,
        marcadoPor: "trabajador",
        /* La marcación del trabajador entra como pendiente de verificación. */
        verificadoPor: null,
      });
    } else {
      d.setAsistencia(worker.id, fecha, {
        salida: hh,
        marcadoPor: "trabajador",
        verificadoPor: null,
      });
    }
    /* Toast simple, sin pantalla intermedia. */
    toast(`${tipo === "entrada" ? "Entrada" : "Salida"} registrada a las ${hh}`, "success");
    onClose();
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex: 400, backdropFilter:"blur(3px)", padding: 16 }}>
      <div className="animate-fade-in modal-inner" style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius: 16, padding:"20px 22px", width:"100%", maxWidth: 400, boxShadow:"0 16px 48px rgba(0,0,0,0.3)" }}>

        {/* ====== Header ====== */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 12, gap: 10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap: 10, minWidth: 0 }}>
            <PhotoAvatar src={worker?.avatarBase64 ?? null} initials={(worker?.apodo || worker?.nombre || "?")[0]?.toUpperCase() ?? "?"} size={34} color={sede?.color ?? "#C41A3A"} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{worker?.nombre ?? "—"}</div>
              <div style={{ fontSize: 10, color:"var(--text-muted)" }}>
                {sede?.nombre ?? "—"} · {worker?.turno?.entrada ?? "--"}–{worker?.turno?.salida ?? "--"}
              </div>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{hora}</div>
            <div style={{ display:"inline-flex", alignItems:"center", gap: 4, marginTop: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius:"50%", background: esTardanza ? "var(--brand)" : "#22c55e" }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: esTardanza ? "var(--brand)" : "#16a34a" }}>
                {esTardanza ? "Fuera de horario" : "En horario"}
              </span>
            </div>
          </div>
        </div>

        {/* ====== Fecha del día ====== */}
        <div style={{
          textAlign:"center", padding:"8px 12px", marginBottom: 14,
          background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 9,
          fontSize: 12, fontWeight: 600, color:"var(--text-muted)",
          fontFamily:"'DM Mono',monospace", letterSpacing: .3,
        }}>
          {fechaLarga(new Date())}
        </div>

        {/* ====== Toggle Entrada / Salida ====== */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6, marginBottom: 6 }}>
            ¿Qué vas a marcar?
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8 }}>
            <button onClick={()=>setTipo("entrada")}
              style={{
                padding:"10px 8px", borderRadius: 9, cursor:"pointer",
                border: `2px solid ${tipo==="entrada" ? "#16a34a" : "var(--border)"}`,
                background: tipo==="entrada" ? "rgba(34,197,94,0.10)" : "var(--bg)",
                color: tipo==="entrada" ? "#16a34a" : "var(--text-muted)",
                fontWeight: tipo==="entrada" ? 700 : 500, fontSize: 13,
                display:"inline-flex", alignItems:"center", justifyContent:"center", gap: 6,
                fontFamily:"'Bricolage Grotesque',sans-serif",
              }}>
              <Icon name="sunrise" size={15} color={tipo==="entrada" ? "#16a34a" : "var(--text-muted)"} />
              Entrada
              {yaTieneEntrada && <span title={`Ya marcada a las ${recHoy!.entrada}`} style={{ fontSize: 9, fontWeight: 800, color:"#16a34a", fontFamily:"'DM Mono',monospace" }}>✓</span>}
            </button>
            <button onClick={()=>setTipo("salida")}
              style={{
                padding:"10px 8px", borderRadius: 9, cursor:"pointer",
                border: `2px solid ${tipo==="salida" ? "var(--brand)" : "var(--border)"}`,
                background: tipo==="salida" ? "rgba(196,26,58,0.10)" : "var(--bg)",
                color: tipo==="salida" ? "var(--brand)" : "var(--text-muted)",
                fontWeight: tipo==="salida" ? 700 : 500, fontSize: 13,
                display:"inline-flex", alignItems:"center", justifyContent:"center", gap: 6,
                fontFamily:"'Bricolage Grotesque',sans-serif",
              }}>
              <Icon name="sunset" size={15} color={tipo==="salida" ? "var(--brand)" : "var(--text-muted)"} />
              Salida
              {yaTieneSalida && <span title={`Ya marcada a las ${recHoy!.salida}`} style={{ fontSize: 9, fontWeight: 800, color:"var(--brand)", fontFamily:"'DM Mono',monospace" }}>✓</span>}
            </button>
          </div>

          {/* Aviso de sobrescritura inline */}
          {sobrescribe && (
            <div style={{ marginTop: 8, fontSize: 10.5, color:"#d97706", fontFamily:"'DM Mono',monospace", display:"flex", alignItems:"center", gap: 5 }}>
              <Icon name="alert_circle" size={11} color="#d97706" />
              Ya marcaste {tipo} a las {tipo === "entrada" ? recHoy?.entrada : recHoy?.salida}. Se reemplazará.
            </div>
          )}

          {/* Aviso de tardanza inline (solo en entrada) */}
          {tipo === "entrada" && esTardanza && !sobrescribe && (
            <div style={{ marginTop: 8, fontSize: 10.5, color:"var(--brand)", fontFamily:"'DM Mono',monospace", display:"flex", alignItems:"center", gap: 5 }}>
              <Icon name="alert_circle" size={11} color="var(--brand)" />
              Esta marca quedará como tardanza ({hora} {">"} {worker?.turno?.entrada})
            </div>
          )}
        </div>

        {/* ====== Foto opcional (un solo click → abre selector) ====== */}
        <div style={{ marginBottom: 14 }}>
          {!foto ? (
            <label style={{ background:"transparent", border:"none", cursor:"pointer", padding: "4px 0",
              color:"var(--text-muted)", fontSize: 11, display:"inline-flex", alignItems:"center", gap: 5,
              fontFamily:"'Bricolage Grotesque',sans-serif",
            }}>
              <Icon name="camera" size={13} color="var(--text-muted)" />
              + Adjuntar foto (opcional)
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => { if (e.target.files?.[0]) setFoto(e.target.files[0].name); }} />
            </label>
          ) : (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius: 8, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color:"#16a34a", display:"flex", alignItems:"center", gap: 6, minWidth: 0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                <Icon name="check" size={12} color="#16a34a" />
                <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>{foto}</span>
              </span>
              <button onClick={() => setFoto(null)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"var(--text-muted)", display:"flex", alignItems:"center", justifyContent:"center", padding: 2 }}>
                <Icon name="x" size={13} color="currentColor" />
              </button>
            </div>
          )}
        </div>

        {/* ====== Footer: Marcar | Cerrar ====== */}
        <div style={{ display:"flex", gap: 10 }}>
          <button onClick={marcar} disabled={!worker}
            className="btn-primary"
            style={{
              flex: 1, padding:"11px 14px", minHeight: 44,
              display:"inline-flex", alignItems:"center", justifyContent:"center", gap: 6,
            }}>
            <Icon name="check" size={14} color="#fff" />
            Marcar {tipo}
          </button>
          <button onClick={onClose} className="btn-outline"
            style={{ padding:"11px 18px", minHeight: 44 }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
