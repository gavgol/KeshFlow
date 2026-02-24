import { useState, useLayoutEffect } from "react";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/useProfile";
import { BottomTabBar, DesktopSidebar } from "@/components/Navigation";
import { CommandPalette } from "@/components/CommandPalette";

const DIR_STORAGE_KEY = "chameleon_dir";

function getStoredDir(): "rtl" | "ltr" {
  try {
    const v = localStorage.getItem(DIR_STORAGE_KEY);
    if (v === "rtl" || v === "ltr") return v;
  } catch {}
  return "ltr";
}

export function persistDir(dir: "rtl" | "ltr") {
  try { localStorage.setItem(DIR_STORAGE_KEY, dir); } catch {}
  document.documentElement.dir = dir;
  document.documentElement.lang = dir === "rtl" ? "he" : "en";
}

export default function AppLayout() {
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useLayoutEffect(() => {
    const stored = getStoredDir();
    document.documentElement.dir = stored;
    document.documentElement.lang = stored === "rtl" ? "he" : "en";
  }, []);

  useLayoutEffect(() => {
    if (!profile) return;
    const dir = profile.locale === "he" || profile.locale === "ar" ? "rtl" : "ltr";
    persistDir(dir);
  }, [profile?.locale]);

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
