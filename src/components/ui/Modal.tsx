"use client";
import { useEffect, useRef } from "react";

/* ================= COMPONENTE MODAL ================= */
interface ModalProps {
  open:      boolean;
  onClose:   () => void;
  title?:    string;
  children:  React.ReactNode;
  width?:    number;
}

export function Modal({ open, onClose, title, children, width = 420 }: ModalProps) {
  /* Cerrar con Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* Cerrar por click-fuera con guardia drag-safe: el cierre solo procede si
     tanto mousedown como mouseup ocurrieron sobre el overlay. Evita que un
     drag de selección iniciado dentro del modal y soltado fuera dispare el
     cierre accidental. */
  const downOnOverlay = useRef(false);

  if (!open) return null;

  return (
    <div
      style={{
        position:       "fixed", inset: 0,
        background:     "rgba(0,0,0,0.55)",
        display:        "flex", alignItems: "center", justifyContent: "center",
        zIndex:         300, backdropFilter: "blur(3px)",
      }}
      onMouseDown={e => { downOnOverlay.current = e.target === e.currentTarget; }}
      onMouseUp={e => {
        if (downOnOverlay.current && e.target === e.currentTarget) onClose();
        downOnOverlay.current = false;
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          position:     "relative",
          background:   "var(--card)",
          border:       "1px solid var(--border)",
          borderRadius: 16, padding: "24px 26px",
          width, maxWidth: "calc(100vw - 32px)",
          maxHeight:    "90vh", overflowY: "auto",
          boxShadow:    "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Botón X — siempre visible, top-right; cierra al click sin importar
            si hay título o no. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
          style={{
            position: "absolute", top: 10, right: 10,
            width: 32, height: 32, borderRadius: 8,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: 18, lineHeight: 1,
            fontFamily: "'Bricolage Grotesque',sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          ×
        </button>

        {title && (
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, paddingRight: 32 }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
