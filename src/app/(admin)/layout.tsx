"use client";
import { useState } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PrivacyProvider } from "@/components/providers/PrivacyProvider";
import { DataProvider } from "@/components/providers/DataProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  return (
    <ThemeProvider>
      <PrivacyProvider>
        <DataProvider>
        <div className="app-shell">
          <Sidebar
            collapsed={collapsed}    onCollapse={()=>setCollapsed(!collapsed)}
            mobileOpen={mobileOpen}  onMobileClose={()=>setMobileOpen(false)}
          />
          <div className="app-content">
            {children}
          </div>
          <BottomNav />
        </div>
        </DataProvider>
      </PrivacyProvider>
    </ThemeProvider>
  );
}
