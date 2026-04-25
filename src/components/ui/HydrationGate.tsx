"use client";

/* ================= HYDRATION GATE ================= */
/* Renderiza un esqueleto genérico mientras el DataProvider y       */
/* SessionProvider están hidratando desde localStorage. Evita un    */
/* "flash" de contenido vacío y unifica el estado de carga inicial. */

import { useData } from "@/components/providers/DataProvider";
import { useSession } from "@/components/providers/SessionProvider";
import { SkeletonStats, SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export function HydrationGate({ children }: { children: React.ReactNode }) {
  const d = useData();
  const s = useSession();
  const ready = d.ready && s.ready;

  if (ready) return <>{children}</>;

  return (
    <main className="page-main">
      {/* Topbar fake */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Skeleton width={180} height={20} />
          <div style={{ height: 6 }} />
          <Skeleton width={260} height={11} />
        </div>
        <Skeleton width={42} height={42} circle />
      </div>

      <SkeletonStats cards={4} />
      <div style={{ height: 16 }} />

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <SkeletonCard lines={4} showAvatar />
        <SkeletonCard lines={4} showAvatar />
      </div>

      <SkeletonTable rows={6} columns={5} />
    </main>
  );
}
