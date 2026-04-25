"use client";

/* ================= MODAL MARCAR ASISTENCIA ================= */
/* Permite al trabajador marcar entrada/salida del día. Escribe   */
/* directamente en el DataProvider (modo demo, sin Supabase).     */

import { useState } from "react";
import { useClock } from "@/hooks/useClock";
import { useSession } from "@/components/providers/SessionProvider";
import { useData, isoToday } from "@/components/providers/DataProvider";
import { PhotoAvatar } from "@/components/ui/PhotoUpload";
import { Icon } from "@/components/ui/Icons";

interface Props { open: boolean; onClose: () => void; }

export function ModalAsistencia({ open, onClose }: Props) {
  const { hora, esTardanza } = useClock();
  const { worker, sede } = useSession();
  const d = useData();
  const [marcado, setMarcado] = useState<"entrada" | "salida" | null>(null);
  const [foto, setFoto] = useState<string | null>(null);

  if (!open) return null;

  /* ====== Marca entrada o salida en el store ====== */
  function marcar(tipo: "entrada" | "salida") {
    if (!worker) return;
    const hh = new Date().toTimeString().slice(0, 5);
    const fecha = isoToday();
    if (tipo === "entrada") {
      const estado = esTardanza ? "tardanza" : "presente";
      d.setAsistencia(worker.id, fecha, { entrada: hh, estado });
    } else {
      d.setAsistencia(worker.id, fecha, { salida: hh });
    }
    setMarcado(tipo);
  }

  /* ================= CONFIRMACIÓN ================= */
  if (marcado) return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex: 400, backdropFilter:"blur(3px)", padding: 16 }}>
      <div className="animate-bounce-in modal-inner" style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius: 16, padding: 24, width:"100%", maxWidth: 360, textAlign:"center", boxShadow:"0 16px 48px rgba(0,0,0,0.3)" }}>
        <div style={{ marginBottom: 12, display:"flex", justifyContent:"center" }}>
          <div style={{ width: 56, height: 56, borderRadius:"50%", background: marcado==="entrada" ? "rgba(34,197,94,0.12)" : "rgba(196,26,58,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name={marcado==="entrada" ? "check_circle" : "sunset"} size={32} color={marcado==="entrada" ? "#16a34a" : "var(--brand)"} />
          </div>
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
          {marcado==="entrada" ? "¡Entrada registrada!" : "¡Salida registrada!"}
        </div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontWeight: 700, fontSize: 22, color:"var(--brand)", margin:"8px 0 12px" }}>{hora}</div>

        {esTardanza && marcado==="entrada" && (
          <div style={{ background:"rgba(196,26,58,0.08)", border:"1px solid rgba(196,26,58,0.2)", borderRadius: 8, padding: 8, marginBottom: 12, fontSize: 11, color:"var(--brand)", display:"flex", alignItems:"center", justifyContent:"center", gap: 6 }}>
            <Icon name="alert_circle" size={14} color="var(--brand)" /> Se registró como tardanza
          </div>
        )}
        {foto && (
          <div style={{ fontSize: 11, color:"#16a34a", marginBottom: 12, display:"flex", alignItems:"center", justifyContent:"center", gap: 6 }}>
            <Icon name="camera" size={14} color="#16a34a" /> Evidencia adjunta
          </div>
        )}

        <button onClick={() => { setMarcado(null); setFoto(null); onClose(); }} className="btn-primary" style={{ width:"100%", padding: 10 }}>
          Continuar
        </button>
      </div>
    </div>
  );

  /* ================= MODAL PRINCIPAL ================= */
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex: 400, backdropFilter:"blur(3px)", padding: 16 }}>
      <div className="animate-fade-in modal-inner" style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius: 16, padding:"20px 22px", width:"100%", maxWidth: 400, boxShadow:"0 16px 48px rgba(0,0,0,0.3)" }}>

        {/* ====== Encabezado ====== */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 16, gap: 10, flexWrap:"wrap" }}>
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

        {/* ====== Botones entrada/salida ====== */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10, marginBottom: 14 }}>
          <button onClick={() => marcar("entrada")} disabled={!worker}
            style={{ padding:"12px 0", borderRadius: 10, cursor: worker ? "pointer" : "not-allowed", border:"none", background:"linear-gradient(135deg,#a01530,#C41A3A)", color:"#fff", fontWeight: 700, fontSize: 13, fontFamily:"'Bricolage Grotesque',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap: 6, minHeight: 44 }}>
            <Icon name="sunrise" size={16} color="#fff" /> Entrada
          </button>
          <button onClick={() => marcar("salida")} disabled={!worker}
            style={{ padding:"12px 0", borderRadius: 10, cursor: worker ? "pointer" : "not-allowed", border:"1.5px solid var(--border)", background:"var(--bg)", color:"var(--text)", fontWeight: 700, fontSize: 13, fontFamily:"'Bricolage Grotesque',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap: 6, minHeight: 44 }}>
            <Icon name="sunset" size={16} color="currentColor" /> Salida
          </button>
        </div>

        {/* ====== Evidencia fotográfica (opcional) ====== */}
        <div style={{ borderTop:"1px solid var(--border)", paddingTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .5, marginBottom: 8 }}>Evidencia fotográfica</div>
          {!foto ? (
            <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap: 8, padding:"12px 0", borderRadius: 9, cursor:"pointer", border:"1.5px dashed var(--border)", background:"var(--bg)", color:"var(--text-muted)", fontSize: 12, fontFamily:"'Bricolage Grotesque',sans-serif", minHeight: 44 }}>
              <Icon name="camera" size={16} color="currentColor" /> Subir foto de evidencia
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => { if (e.target.files?.[0]) setFoto(e.target.files[0].name); }} />
            </label>
          ) : (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderRadius: 9, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color:"#16a34a", display:"flex", alignItems:"center", gap: 6, minWidth: 0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                <Icon name="upload" size={14} color="#16a34a" />
                <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>{foto}</span>
              </span>
              <button onClick={() => setFoto(null)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"var(--text-muted)", display:"flex", alignItems:"center", justifyContent:"center", padding: 4 }}>
                <Icon name="x" size={14} color="currentColor" />
              </button>
            </div>
          )}
          <div style={{ fontSize: 10, color:"var(--text-muted)", marginTop: 5 }}>Opcional · Foto de tu lugar de trabajo</div>
        </div>

        <button onClick={onClose} style={{ width:"100%", marginTop: 12, padding:"10px 0", borderRadius: 8, background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", cursor:"pointer", fontSize: 11, fontFamily:"'Bricolage Grotesque',sans-serif", minHeight: 40 }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
