import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Columns3,
  Users,
  Settings,
  Moon,
  Sun,
  Search,
  LogOut,
  Bell,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { openCommandPalette } from "@/components/CommandPalette";
import { useReminders } from "@/hooks/useReminders";

const navItems = [
  { to: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard },
  { to: "/calendar", label: "יומן", icon: CalendarDays },
  { to: "/kanban", label: "לידים", icon: Columns3 },
  { to: "/contacts", label: "אנשי קשר", icon: Users },
  { to: "/reminders", label: "תזכורות", icon: Bell },
  { to: "/settings", label: "הגדרות", icon: Settings },
];

export function BottomTabBar() {
  const location = useLocation();
  const { overdueCount } = useReminders();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            item.to === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.to);
          const isReminders = item.to === "/reminders";
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {isReminders && overdueCount > 0 && (
                  <span className="absolute -top-1.5 -end-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium px-1">
                    {overdueCount}
                  </span>
                )}
              </div>
              <span className="font-medium">{item.label}</span>
            </RouterNavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { overdueCount } = useReminders();
  const isDark = theme === "dark";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-e border-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            KeshFlow
          </span>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed ? "mx-auto" : "ms-auto"
          )}
        >
          <Columns3 className="h-4 w-4" />
        </button>
      </div>

      {/* Search trigger */}
      <div className="px-2 mb-1">
        <button
          onClick={openCommandPalette}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <Search className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="flex-1 text-start">חיפוש...</span>}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive =
            item.to === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.to);
          const isReminders = item.to === "/reminders";
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <div className="relative shrink-0">
                <item.icon className="h-4 w-4" />
                {isReminders && overdueCount > 0 && (
                  <span className="absolute -top-1.5 -end-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium px-1">
                    {overdueCount}
                  </span>
                )}
              </div>
              {!collapsed && <span>{item.label}</span>}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border p-2 space-y-1">
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>{isDark ? "מצב בהיר" : "מצב כהה"}</span>}
        </button>
        <button
          onClick={() => signOut()}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>התנתק</span>}
        </button>
      </div>
    </aside>
  );
}
