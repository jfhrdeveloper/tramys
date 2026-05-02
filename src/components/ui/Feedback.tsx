"use client";

/* ================= IMPORTS ================= */
import {
  createContext, useCallback, useContext, useRef, useState,
} from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icons";

/* ================= TIPOS ================= */
type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id:      number;
  variant: ToastVariant;
  message: string;
}

interface ConfirmOpts {
  title?:        string;
  message:       string;
  confirmLabel?: string;
  cancelLabel?:  string;
  /* "danger" → CTA rojo (eliminar); "primary" → marca; "success" → verde. */
  tone?:         "danger" | "primary" | "success";
}

interface FeedbackCtx {
  toast:   (message: string, variant?: ToastVariant) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
}

const Ctx = createContext<FeedbackCtx | null>(null);

/* ================= ESTILOS POR VARIANTE ================= */
const TOAST_STYLE: Record<ToastVariant, { bg: string; fg: string; border: string; icon: string }> = {
  success: { bg: "rgba(34,197,94,0.12)",  fg: "#16a34a", border: "rgba(34,197,94,0.35)",  icon: "check" },
  error:   { bg: "rgba(196,26,58,0.12)",  fg: "#C41A3A", border: "rgba(196,26,58,0.35)",  icon: "x" },
  warning: { bg: "rgba(217,119,6,0.12)",  fg: "#d97706", border: "rgba(217,119,6,0.35)",  icon: "info" },
  info:    { bg: "rgba(99,102,241,0.12)", fg: "#6366f1", border: "rgba(99,102,241,0.35)", icon: "info" },
};

/* ================= PROVIDER ================= */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  /* Confirm dialog modal state. La promesa se resuelve al pulsar Aceptar/Cancelar. */
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOpts | null>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, variant, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const confirm = useCallback((opts: ConfirmOpts) => {
    setConfirmOpts(opts);
    return new Promise<boolean>(resolve => { resolverRef.current = resolve; });
  }, []);

  const closeConfirm = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setConfirmOpts(null);
  }, []);

  /* Cierre del confirm al pulsar Esc del Modal (Escape → onClose → cancela). */
  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}

      {/* ====== Toast stack ====== */}
      <div
        aria-live="polite"
        style={{
          position: "fixed", top: 16, right: 16, zIndex: 400,
          display: "flex", flexDirection: "column", gap: 8,
          pointerEvents: "none",
          maxWidth: "calc(100vw - 32px)",
        }}
      >
        {toasts.map(t => {
          const s = TOAST_STYLE[t.variant];
          return (
            <div
              key={t.id}
              className="animate-fade-in"
              style={{
                pointerEvents: "auto",
                background: "var(--card)",
                border: `1px solid ${s.border}`,
                borderLeft: `4px solid ${s.fg}`,
                borderRadius: 10,
                padding: "10px 14px",
                minWidth: 240,
                maxWidth: 380,
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: 99, background: s.bg,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: s.fg, flexShrink: 0,
              }}>
                <Icon name={s.icon} size={14} strokeWidth={2.5} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", flex: 1, lineHeight: 1.35 }}>
                {t.message}
              </span>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                aria-label="Cerrar"
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", padding: 2, display: "inline-flex",
                }}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ====== Confirm modal ====== */}
      <Modal
        open={confirmOpts !== null}
        onClose={() => closeConfirm(false)}
        title={confirmOpts?.title ?? "Confirmar"}
        width={420}
      >
        <div style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.5, marginBottom: 18 }}>
          {confirmOpts?.message}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn-outline" onClick={() => closeConfirm(false)}>
            {confirmOpts?.cancelLabel ?? "Cancelar"}
          </button>
          <button
            className="btn-primary"
            style={
              confirmOpts?.tone === "success"
                ? { background: "#16a34a" }
                : confirmOpts?.tone === "danger"
                ? { background: "#C41A3A" }
                : undefined
            }
            onClick={() => closeConfirm(true)}
          >
            {confirmOpts?.confirmLabel ?? "Aceptar"}
          </button>
        </div>
      </Modal>
    </Ctx.Provider>
  );
}

/* ================= HOOKS ================= */
export function useFeedback(): FeedbackCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFeedback debe usarse dentro de FeedbackProvider");
  return v;
}

export function useToast() {
  return useFeedback().toast;
}

export function useConfirm() {
  return useFeedback().confirm;
}
