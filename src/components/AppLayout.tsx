import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomTabBar, DesktopSidebar } from "@/components/Navigation";
import { CommandPalette } from "@/components/CommandPalette";

export default function AppLayout() {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {!isMobile && (
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {isMobile && <BottomTabBar />}
      <CommandPalette />
    </div>
  );
}
