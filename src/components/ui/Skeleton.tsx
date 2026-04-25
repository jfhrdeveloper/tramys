"use client";

/* ================= SKELETON LOADERS ================= */
/* Placeholders animados con shimmer (.skeleton en globals.css). */
/* Úsalos durante la hidratación inicial o cargas asíncronas.    */

import type { CSSProperties } from "react";

/* ====== Skeleton primitivo (línea / bloque) ====== */
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  circle?: boolean;
  style?: CSSProperties;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = 14,
  radius = 6,
  circle = false,
  style,
  className,
}: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className ?? ""}`}
      style={{
        display: "inline-block",
        width,
        height: circle ? width : height,
        borderRadius: circle ? "50%" : radius,
        verticalAlign: "middle",
        ...style,
      }}
    />
  );
}

/* ====== Skeleton de texto multilínea ====== */
interface SkeletonTextProps {
  lines?: number;
  size?: number;
  gap?: number;
  lastWidth?: string | number;
}

export function SkeletonText({
  lines = 3,
  size = 12,
  gap = 8,
  lastWidth = "60%",
}: SkeletonTextProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={size}
          width={i === lines - 1 ? lastWidth : "100%"}
        />
      ))}
    </div>
  );
}

/* ====== Skeleton de card (encabezado + texto) ====== */
interface SkeletonCardProps {
  height?: number;
  showAvatar?: boolean;
  lines?: number;
}

export function SkeletonCard({
  height,
  showAvatar = false,
  lines = 3,
}: SkeletonCardProps) {
  return (
    <div className="card" style={{ minHeight: height, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        {showAvatar && <Skeleton width={42} circle />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Skeleton width="40%" height={14} />
          <div style={{ height: 6 }} />
          <Skeleton width="60%" height={10} />
        </div>
      </div>
      <SkeletonText lines={lines} size={11} gap={8} />
    </div>
  );
}

/* ====== Skeleton de tabla ====== */
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
        <Skeleton width="30%" height={14} />
      </div>
      <div style={{ padding: "14px 18px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 12,
            marginBottom: 14,
          }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`h_${i}`} height={10} width="70%" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={`r_${r}`}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: 12,
              padding: "10px 0",
              borderTop: "1px solid var(--border)",
            }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={`c_${r}_${c}`}
                height={12}
                width={c === 0 ? "80%" : `${50 + ((r * c * 7) % 40)}%`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====== Skeleton de KPI/Stats ====== */
interface SkeletonStatsProps {
  cards?: number;
}

export function SkeletonStats({ cards = 4 }: SkeletonStatsProps) {
  return (
    <div className="grid-stats">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="card"
          style={{
            padding: "14px 18px",
            borderLeft: "4px solid var(--border)",
          }}
        >
          <Skeleton width="50%" height={10} />
          <div style={{ height: 8 }} />
          <Skeleton width="70%" height={22} />
          <div style={{ height: 6 }} />
          <Skeleton width="40%" height={9} />
        </div>
      ))}
    </div>
  );
}
