/* ================= COMPONENTE PROGRESS BAR ================= */
interface ProgressBarProps {
  value:   number;       // 0-100
  height?: number;
  showPct?: boolean;
}

export function ProgressBar({ value, height = 7, showPct = false }: ProgressBarProps) {
  /* ==== Color dinámico según progreso ==== */
  const barColor =
    value >= 80 ? "#22c55e" :
    value >= 50 ? "#C41A3A" :
                  "#f59e0b";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
      <div style={{
        flex: 1, height, background: "var(--border)",
        borderRadius: 99, overflow: "hidden",
      }}>
        <div style={{
          height:       "100%",
          width:        `${Math.min(value, 100)}%`,
          background:   `linear-gradient(90deg, #a01530, ${barColor})`,
          borderRadius: 99,
          transition:   "width 0.6s ease",
        }} />
      </div>
      {showPct && (
        <span style={{
          fontSize:   11, fontWeight: 700, color: barColor,
          fontFamily: "'DM Mono', monospace", minWidth: 34,
        }}>
          {value}%
        </span>
      )}
    </div>
  );
}
