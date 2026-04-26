"use client";
import { useState } from "react";
import { Providers } from "@/components/providers/Providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { HydrationGate } from "@/components/ui/HydrationGate";
import { ImpersonationBanner } from "@/components/ui/ImpersonationBanner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  return (
    <Providers>
      <div className="app-shell">
        <Sidebar
          collapsed={collapsed}    onCollapse={()=>setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}  onMobileClose={()=>setMobileOpen(false)}
        />
        <div className="app-content">
          <ImpersonationBanner />
          <HydrationGate>{children}</HydrationGate>
        </div>
        <BottomNav />
      </div>
    </Providers>
  );
}
