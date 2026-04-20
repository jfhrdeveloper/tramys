"use client";
import { useState } from "react";

/* ================= COMPONENTE STAT CARD ================= */
interface StatCardProps {
  label:    string;
  value:    string | number;
  color:    string;
  sub?:     string;
  accent?:  "top" | "left";
}

export function StatCard({ label, value, color, sub, accent = "left" }: StatCardProps) {
  const [hover, setHover] = useState(false);

  const borderStyle = accent === "left"
    ? { borderLeft: `4px solid ${color}` }
    : { borderTop:  `3px solid ${color}` };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background:   "var(--card)",
        border:       "1px solid var(--border)",
        borderRadius: 12,
        padding:      "14px 18px",
        cursor:       "default",
        transform:    hover ? "translateY(-2px)" : "translateY(0)",
        boxShadow:    hover
          ? "0 8px 24px rgba(0,0,0,0.1)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        transition:   "all 0.2s",
        ...borderStyle,
      }}
    >
      <div style={{
        fontSize: 10, color: "var(--text-muted)",
        fontFamily: "'DM Mono', monospace",
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize:    typeof value === "string" && value.startsWith("S/") ? 20 : 26,
        fontWeight:  800, color, lineHeight: 1, marginBottom: 4,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>
      )}
    </div>
  );
}
