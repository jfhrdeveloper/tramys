"use client";
import { useEffect } from "react";

/* ================= COMPONENTE MODAL ================= */
interface ModalProps {
  open:      boolean;
  onClose:   () => void;
  title?:    string;
  children:  React.ReactNode;
  width?:    number;
}

export function Modal({ open, onClose, title, children, width = 420 }: ModalProps) {
  /* ==== Cerrar con Escape ==== */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position:       "fixed", inset: 0,
        background:     "rgba(0,0,0,0.55)",
        display:        "flex", alignItems: "center", justifyContent: "center",
        zIndex:         300, backdropFilter: "blur(3px)",
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        style={{
          background:   "var(--card)",
          border:       "1px solid var(--border)",
          borderRadius: 16, padding: "24px 26px",
          width, maxWidth: "calc(100vw - 32px)",
          maxHeight:    "90vh", overflowY: "auto",
          boxShadow:    "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
