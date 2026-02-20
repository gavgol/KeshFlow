import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/useProfile";
import { BottomTabBar, DesktopSidebar } from "@/components/Navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const dir = profile?.locale === "he" || profile?.locale === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} className="flex min-h-screen w-full bg-background">
      {!isMobile && (
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Page content — no animation here so sidebar never unmounts */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>

      {isMobile && <BottomTabBar />}
    </div>
  );
}
