"use client";
import { Topbar } from "@/components/layout/Topbar";
export default function Page() {
  return (
    <>
      <Topbar title="Reportes" subtitle="Exportación y análisis" onMenuToggle={()=>{}} />
      <main className="page-main">
        <div className="card" style={{ textAlign:"center",padding:"60px 24px" }}>
          <div style={{ fontSize:36,marginBottom:12 }}>🚧</div>
          <div style={{ fontWeight:700,fontSize:18,marginBottom:8 }}>Reportes</div>
          <div style={{ fontSize:13,color:"var(--text-muted)" }}>Módulo en implementación</div>
        </div>
      </main>
    </>
  );
}
