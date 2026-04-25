"use client";

/* ================= MI PERFIL MODAL ================= */
/* Modal global de edición del usuario activo. Disponible para */
/* Owner / Encargado / Trabajador desde sidebar y bottom-nav.  */
/* Persiste vía DataProvider.updateWorker → se refleja en toda */
/* la app (topbar, sidebars, listados, asistencia, etc.).      */

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { Icon } from "@/components/ui/Icons";
import { useSession } from "@/components/providers/SessionProvider";
import { useData } from "@/components/providers/DataProvider";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MiPerfilModal({ open, onClose }: Props) {
  const { worker, sede } = useSession();
  const d = useData();

  /* ====== Estado local del formulario ====== */
  const [nombres,      setNombres]      = useState("");
  const [apellidos,    setApellidos]    = useState("");
  const [apodo,        setApodo]        = useState("");
  const [email,        setEmail]        = useState("");
  const [telefono,     setTelefono]     = useState("");
  const [dni,          setDni]          = useState("");
  const [avatar,       setAvatar]       = useState<string | null>(null);
  const [password,     setPassword]     = useState("");
  const [password2,    setPassword2]    = useState("");
  const [mostrarPwd,   setMostrarPwd]   = useState(false);
  const [savedFlash,   setSavedFlash]   = useState(false);
  const [errorFlash,   setErrorFlash]   = useState<string | null>(null);

  /* ====== Sincronizar con worker activo al abrir ====== */
  useEffect(() => {
    if (!open || !worker) return;
    /* Heurística: split por la mitad — primera mitad = nombres, resto = apellidos */
    const partes = (worker.nombre ?? "").trim().split(/\s+/).filter(Boolean);
    const corte  = partes.length >= 4 ? 2 : partes.length >= 2 ? 1 : partes.length;
    setNombres(partes.slice(0, corte).join(" "));
    setApellidos(partes.slice(corte).join(" "));
    setApodo(worker.apodo ?? "");
    setEmail(worker.email ?? "");
    setTelefono(worker.telefono ?? "");
    setDni(worker.dni ?? "");
    setAvatar(worker.avatarBase64 ?? null);
    setPassword("");
    setPassword2("");
    setMostrarPwd(false);
    setSavedFlash(false);
    setErrorFlash(null);
  }, [open, worker]);

  if (!worker) return null;

  function guardar() {
    setErrorFlash(null);
    const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`.trim();
    if (!nombres.trim())   { setErrorFlash("Los nombres no pueden estar vacíos"); return; }
    if (!apellidos.trim()) { setErrorFlash("Los apellidos no pueden estar vacíos"); return; }
    if (mostrarPwd && password && password !== password2) {
      setErrorFlash("Las contraseñas no coinciden");
      return;
    }

    d.updateWorker(worker!.id, {
      nombre:       nombreCompleto,
      apodo:        apodo.trim(),
      email:        email.trim(),
      telefono:     telefono.trim() || undefined,
      dni:          dni.trim() || undefined,
      avatarBase64: avatar,
    });

    setSavedFlash(true);
    setTimeout(() => {
      setSavedFlash(false);
      onClose();
    }, 700);
  }

  const colSede = sede?.color ?? "#C41A3A";

  return (
    <Modal open={open} onClose={onClose} title="Mi perfil" width={480}>
      {/* ====== Cabecera con foto ====== */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <PhotoUpload
          value={avatar}
          onChange={setAvatar}
          size={108}
          initials={(apodo || nombres || "?")[0]?.toUpperCase() ?? "?"}
          color={colSede}
        />
      </div>

      {/* ====== Datos personales ====== */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Nombres">
            <input className="input-base" value={nombres} onChange={e => setNombres(e.target.value)} placeholder="Ej. Juan Carlos" />
          </Field>
          <Field label="Apellidos">
            <input className="input-base" value={apellidos} onChange={e => setApellidos(e.target.value)} placeholder="Ej. Pérez Gómez" />
          </Field>
        </div>

        <Field label="Apodo">
          <input className="input-base" value={apodo} onChange={e => setApodo(e.target.value)} placeholder="Cómo prefieres que te llamen" />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Email">
            <input className="input-base" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Teléfono">
            <input className="input-base input-mono" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+51 …" />
          </Field>
        </div>

        <Field label="DNI">
          <input className="input-base input-mono" value={dni} onChange={e => setDni(e.target.value)} maxLength={8} placeholder="8 dígitos" />
        </Field>

        {/* ====== Contraseña (opcional) ====== */}
        <div style={{
          marginTop: 6, padding: "12px 14px",
          border: "1px dashed var(--border)", borderRadius: 10,
          background: "var(--bg)",
        }}>
          <button
            type="button"
            onClick={() => setMostrarPwd(v => !v)}
            className="btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: 0, color: "var(--text)", fontWeight: 600, fontSize: 13 }}
          >
            <Icon name={mostrarPwd ? "chevron_down" : "chevron_right"} size={14} />
            Cambiar contraseña
          </button>

          {mostrarPwd && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <Field label="Nueva contraseña">
                <input className="input-base" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
              </Field>
              <Field label="Repetir">
                <input className="input-base" type="password" value={password2} onChange={e => setPassword2(e.target.value)} autoComplete="new-password" />
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* ====== Mensajes ====== */}
      {errorFlash && (
        <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(196,26,58,0.08)", border: "1px solid rgba(196,26,58,0.25)", color: "var(--brand)", fontSize: 12, fontWeight: 600 }}>
          {errorFlash}
        </div>
      )}
      {savedFlash && (
        <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#16a34a", fontSize: 12, fontWeight: 600 }}>
          Cambios guardados
        </div>
      )}

      {/* ====== Acciones ====== */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={guardar}>Guardar cambios</button>
      </div>
    </Modal>
  );
}

/* ====== Campo etiquetado ====== */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'DM Mono',monospace", letterSpacing: 0.8, textTransform: "uppercase" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
