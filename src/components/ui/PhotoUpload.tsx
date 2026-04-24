"use client";

/* ================= PHOTO UPLOAD 1:1 ================= */
/* Permite subir una imagen, recortarla a cuadrado y devolverla */
/* como base64 PNG 400x400.                                     */

import { useRef, useState } from "react";
import { Icon } from "./Icons";

interface PhotoUploadProps {
  value: string | null;
  onChange: (base64: string | null) => void;
  size?: number;
  initials?: string;
  color?: string;
}

export function PhotoUpload({
  value, onChange,
  size = 96,
  initials = "?",
  color = "#C41A3A",
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  function procesar(file: File) {
    setProcessing(true);
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        if (!ctx) { setProcessing(false); return; }
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);
        onChange(canvas.toDataURL("image/png", 0.92));
        setProcessing(false);
      };
      img.onerror = () => setProcessing(false);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => setProcessing(false);
    reader.readAsDataURL(file);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) procesar(f);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) procesar(f);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          width: size, height: size,
          borderRadius: "50%",
          background: value ? "transparent" : `linear-gradient(135deg, #a01530, ${color})`,
          border: value ? "2px solid var(--border)" : "none",
          overflow: "hidden",
          position: "relative",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {value ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={value} alt="Foto" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <span style={{ color:"#fff", fontWeight:800, fontSize: size * 0.34, userSelect:"none" }}>
            {initials}
          </span>
        )}

        {/* Overlay al hover */}
        <div
          className="photo-overlay"
          style={{
            position:"absolute", inset:0,
            background:"rgba(0,0,0,0.45)",
            display:"flex", alignItems:"center", justifyContent:"center",
            opacity: 0, transition:"opacity 0.15s",
          }}
        >
          <Icon name="camera" size={Math.round(size * 0.28)} color="#fff" />
        </div>

        {processing && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div className="animate-spin" style={{ width:20, height:20, border:"2px solid #fff", borderTopColor:"transparent", borderRadius:"50%" }} />
          </div>
        )}

        <style jsx>{`
          div:hover > .photo-overlay { opacity: 1; }
        `}</style>
      </div>

      <div style={{ display:"flex", gap:6 }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-outline"
          style={{ fontSize:11, padding:"5px 10px", display:"inline-flex", alignItems:"center", gap:5 }}
        >
          <Icon name="upload" size={11} /> Subir foto
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="btn-ghost"
            style={{ fontSize:11, padding:"5px 10px", color:"var(--brand)", border:"1px solid var(--border)" }}
          >
            Quitar
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        style={{ display:"none" }}
      />
    </div>
  );
}

/* ================= AVATAR con foto ================= */
export function PhotoAvatar({
  src, initials, size = 32, color = "#C41A3A",
}: { src: string | null; initials: string; size?: number; color?: string }) {
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: src ? "transparent" : `linear-gradient(135deg, #a01530, ${color})`,
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.34,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
      ) : initials}
    </div>
  );
}
