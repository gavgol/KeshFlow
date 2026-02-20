import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/useProfile";
import { BottomTabBar, DesktopSidebar } from "@/components/Navigation";
import { motion } from "framer-motion";

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

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </main>

      {isMobile && <BottomTabBar />}
    </div>
  );
}

