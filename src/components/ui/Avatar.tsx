/* ================= COMPONENTE AVATAR ================= */
interface AvatarProps {
  initials: string;
  size?:    number;
  color?:   string;
  className?: string;
}

export function Avatar({ initials, size = 32, color = "#C41A3A", className = "" }: AvatarProps) {
  return (
    <div
      className={className}
      style={{
        width:           size,
        height:          size,
        borderRadius:    "50%",
        background:      `linear-gradient(135deg, #a01530, ${color})`,
        color:           "#fff",
        fontWeight:      700,
        fontSize:        size * 0.34,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        flexShrink:      0,
        fontFamily:      "'Bricolage Grotesque', sans-serif",
        userSelect:      "none",
      }}
    >
      {initials}
    </div>
  );
}
