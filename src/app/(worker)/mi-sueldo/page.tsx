"use client";
import { TopbarWorker } from "@/components/layout/TopbarWorker";
export default function Page() {
  return (
    <>
      <TopbarWorker title="Mi Sueldo" subtitle="Abril 2026" onMenuToggle={()=>{}} />
      <main className="page-main">
        <div className="card" style={{ textAlign:"center",padding:"60px 24px" }}>
          <div style={{ fontWeight:700,fontSize:18,marginBottom:8 }}>Mi Sueldo</div>
          <div style={{ fontSize:13,color:"var(--text-muted)" }}>En implementación</div>
        </div>
      </main>
    </>
  );
}
