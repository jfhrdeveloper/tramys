"use client";
import { useState } from "react";
import { useClock } from "@/hooks/useClock";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { iniciales, hoy } from "@/lib/utils/formatters";

interface Props { open:boolean; onClose:()=>void; }

export function ModalAsistencia({ open, onClose }: Props) {
  const { hora, esTardanza } = useClock();
  const { profile } = useAuth();
  const [marcado, setMarcado] = useState<"entrada"|"salida"|null>(null);
  const [foto, setFoto]       = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (!open) return null;

  async function marcar(tipo: "entrada"|"salida") {
    if (!profile) return;
    setLoading(true);
    const ahora = new Date().toTimeString().slice(0,5);
    const estado = tipo==="entrada" ? (esTardanza?"tardanza":"presente") : "presente";
    if (tipo==="entrada") {
      await supabase.from("asistencia").upsert({ trabajador_id:profile.id, sede_id:profile.sede_id, fecha:hoy(), hora_entrada:ahora, estado }, { onConflict:"trabajador_id,fecha" });
    } else {
      await supabase.from("asistencia").upsert({ trabajador_id:profile.id, sede_id:profile.sede_id, fecha:hoy(), hora_salida:ahora }, { onConflict:"trabajador_id,fecha" });
    }
    setMarcado(tipo); setLoading(false);
  }

  if (marcado) return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,backdropFilter:"blur(3px)" }}>
      <div className="animate-bounce-in modal-inner" style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"24px",width:320,textAlign:"center",boxShadow:"0 16px 48px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize:40,marginBottom:12 }}>{marcado==="entrada"?"✅":"🏁"}</div>
        <div style={{ fontWeight:800,fontSize:18,marginBottom:4 }}>{marcado==="entrada"?"¡Entrada registrada!":"¡Salida registrada!"}</div>
        <div style={{ fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:22,color:"var(--brand)",margin:"8px 0 12px" }}>{hora}</div>
        {esTardanza && marcado==="entrada" && <div style={{ background:"rgba(196,26,58,0.08)",border:"1px solid rgba(196,26,58,0.2)",borderRadius:8,padding:"8px",marginBottom:12,fontSize:11,color:"var(--brand)" }}>⚠️ Se registrará como tardanza</div>}
        {foto && <div style={{ fontSize:11,color:"#16a34a",marginBottom:12 }}>📎 Evidencia adjunta</div>}
        <button onClick={()=>{ setMarcado(null); setFoto(null); onClose(); }} className="btn-primary" style={{ width:"100%",padding:"10px" }}>Continuar al panel</button>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,backdropFilter:"blur(3px)" }}>
      <div className="animate-fade-in modal-inner" style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"20px 22px",width:360,boxShadow:"0 16px 48px rgba(0,0,0,0.3)" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <Avatar initials={profile?iniciales(profile.nombre):"?"} size={34} color="#C41A3A" />
            <div>
              <div style={{ fontWeight:700,fontSize:13 }}>{profile?.nombre??"-"}</div>
              <div style={{ fontSize:10,color:"var(--text-muted)" }}>{profile?.sede?.nombre} · {profile?.turno}</div>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'DM Mono',monospace",fontWeight:800,fontSize:18,lineHeight:1 }}>{hora}</div>
            <div style={{ display:"inline-flex",alignItems:"center",gap:4,marginTop:4 }}>
              <div style={{ width:5,height:5,borderRadius:"50%",background:esTardanza?"var(--brand)":"#22c55e" }} />
              <span style={{ fontSize:9,fontWeight:600,color:esTardanza?"var(--brand)":"#16a34a" }}>{esTardanza?"Fuera de horario":"En horario"}</span>
            </div>
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
          <button onClick={()=>marcar("entrada")} disabled={loading} style={{ padding:"12px 0",borderRadius:10,cursor:"pointer",border:"none",background:"linear-gradient(135deg,#a01530,#C41A3A)",color:"#fff",fontWeight:700,fontSize:13,fontFamily:"'Bricolage Grotesque',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>🟢 Entrada</button>
          <button onClick={()=>marcar("salida")} disabled={loading} style={{ padding:"12px 0",borderRadius:10,cursor:"pointer",border:"1.5px solid var(--border)",background:"var(--bg)",color:"var(--text)",fontWeight:700,fontSize:13,fontFamily:"'Bricolage Grotesque',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>🔴 Salida</button>
        </div>
        <div style={{ borderTop:"1px solid var(--border)",paddingTop:14 }}>
          <div style={{ fontSize:10,fontWeight:600,color:"var(--text-muted)",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8 }}>Evidencia fotográfica</div>
          {!foto ? (
            <label style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 0",borderRadius:9,cursor:"pointer",border:"1.5px dashed var(--border)",background:"var(--bg)",color:"var(--text-muted)",fontSize:12,fontFamily:"'Bricolage Grotesque',sans-serif" }}>
              📷 Subir foto de evidencia
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{ if(e.target.files?.[0]) setFoto(e.target.files[0].name); }} />
            </label>
          ) : (
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:9,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)" }}>
              <span style={{ fontSize:11,fontWeight:600,color:"#16a34a" }}>🖼️ {foto}</span>
              <button onClick={()=>setFoto(null)} style={{ background:"transparent",border:"none",cursor:"pointer",color:"var(--text-muted)" }}>✕</button>
            </div>
          )}
          <div style={{ fontSize:10,color:"var(--text-muted)",marginTop:5 }}>Opcional · Foto de tu lugar de trabajo</div>
        </div>
        <button onClick={onClose} style={{ width:"100%",marginTop:12,padding:"8px 0",borderRadius:8,background:"transparent",border:"1px solid var(--border)",color:"var(--text-muted)",cursor:"pointer",fontSize:11,fontFamily:"'Bricolage Grotesque',sans-serif" }}>Saltar por ahora</button>
      </div>
    </div>
  );
}
