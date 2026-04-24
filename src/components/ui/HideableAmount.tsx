"use client";
import { useState } from "react";
import { usePrivacy } from "@/components/providers/PrivacyProvider";

/* ================= HIDEABLE AMOUNT ================= */
/* Muestra un monto. Si el toggle global de privacidad está activo,   */
/* se reemplaza por una máscara. Sin botones individuales.            */

interface HideableAmountProps {
  value: string;
  mask?: string;
  size?: number;
  color?: string;
  weight?: number;
  align?: "left" | "right" | "center";
  fontFamily?: string;
  inline?: boolean;
}

export function HideableAmount({
  value,
  mask = "S/ ••••",
  size = 14,
  color = "var(--text)",
  weight = 700,
  align = "left",
  fontFamily,
  inline = true,
}: HideableAmountProps) {
  const { hidden } = usePrivacy();

  return (
    <span
      style={{
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        justifyContent:
          align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
        color,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.1,
        fontFamily: fontFamily ?? "inherit",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: hidden ? "1px" : "normal",
        userSelect: hidden ? "none" : "text",
      }}
    >
      {hidden ? mask : value}
    </span>
  );
}

/* ================= STAT CARD SENSIBLE ================= */
/* Igual que StatCard pero su valor responde al toggle global. */

interface StatCardHiddenProps {
  label: string;
  value: string;
  color: string;
  sub?: string;
  accent?: "top" | "left";
  mask?: string;
}

export function StatCardHidden({
  label,
  value,
  color,
  sub,
  accent = "left",
  mask = "S/ ••••",
}: StatCardHiddenProps) {
  const [hover, setHover] = useState(false);
  const borderStyle =
    accent === "left" ? { borderLeft: `4px solid ${color}` } : { borderTop: `3px solid ${color}` };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 18px",
        cursor: "default",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hover ? "0 8px 24px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.2s",
        ...borderStyle,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          fontFamily: "'DM Mono', monospace",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <HideableAmount value={value} mask={mask} size={22} color={color} weight={800} />
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
