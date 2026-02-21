import { useState, useEffect } from "react";
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

  const isRTL = profile?.locale === "he" || profile?.locale === "ar";

  // Apply dir globally to <html> so it persists across route changes without flickering
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = isRTL ? "he" : "en";
  }, [isRTL]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {!isMobile && (
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>

      {isMobile && <BottomTabBar />}
    </div>
  );
}
