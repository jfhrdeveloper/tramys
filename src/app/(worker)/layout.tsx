"use client";
import { Providers } from "@/components/providers/Providers";
import { SidebarWorker } from "@/components/layout/SidebarWorker";
import { BottomNavWorker } from "@/components/layout/BottomNavWorker";
import { HydrationGate } from "@/components/ui/HydrationGate";
import { ImpersonationBanner } from "@/components/ui/ImpersonationBanner";
import { useState } from "react";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Providers>
      <div className="app-shell">
        <SidebarWorker
          collapsed={collapsed}    onCollapse={()=>setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}  onMobileClose={()=>setMobileOpen(false)}
        />
        <div className="app-content">
          <ImpersonationBanner />
          <HydrationGate>{children}</HydrationGate>
        </div>
        <BottomNavWorker />
      </div>
    </Providers>
  );
}
