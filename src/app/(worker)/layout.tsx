"use client";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PrivacyProvider } from "@/components/providers/PrivacyProvider";
import { DataProvider } from "@/components/providers/DataProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SidebarWorker } from "@/components/layout/SidebarWorker";
import { BottomNavWorker } from "@/components/layout/BottomNavWorker";
import { useState } from "react";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ThemeProvider>
      <PrivacyProvider>
        <DataProvider>
          <SessionProvider>
            <div className="app-shell">
              <SidebarWorker
                collapsed={collapsed}    onCollapse={()=>setCollapsed(!collapsed)}
                mobileOpen={mobileOpen}  onMobileClose={()=>setMobileOpen(false)}
              />
              <div className="app-content">
                {children}
              </div>
              <BottomNavWorker />
            </div>
          </SessionProvider>
        </DataProvider>
      </PrivacyProvider>
    </ThemeProvider>
  );
}
