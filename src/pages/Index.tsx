
import { useDashboardData } from "@/hooks/useDashboardData";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Briefcase,
  DollarSign,
  MessageCircle,
  CalendarDays,
  Smile,
  Plus,
  Contact,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

function StatCard({
  title,
  value,
  icon: Icon,
  prefix,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  prefix?: string;
}) {
  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">
          {prefix}
          {typeof value === "number" && title.includes("הכנסות")
            ? value.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
            : value}
        </p>
      </CardContent>
    </Card>
  );
}

function FabMenu({
  open,
  onClose,
  isRTL,
}: {
  open: boolean;
  onClose: () => void;
  isRTL: boolean;
}) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Menu */}
      <div
        className={cn(
          "fixed bottom-24 z-50 flex flex-col gap-2 md:bottom-8",
          isRTL ? "left-4 md:left-6 items-start" : "right-4 md:right-6 items-end"
        )}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-3 rounded-full bg-background px-4 py-2.5 text-sm font-medium shadow-lg border border-border hover:bg-muted transition-colors"
        >
          <Contact className="h-4 w-4 text-primary" />
          איש קשר חדש
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-3 rounded-full bg-background px-4 py-2.5 text-sm font-medium shadow-lg border border-border hover:bg-muted transition-colors"
        >
          <Briefcase className="h-4 w-4 text-primary" />
          עסקה חדשה
        </button>
      </div>
    </>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { stats, dueContacts, upcomingDeals, loading, refetch } =
    useDashboardData();
  const [fabOpen, setFabOpen] = useState(false);
  const isRTL = profile?.locale === "he" || profile?.locale === "ar";

  const markContacted = async (contactId: string) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("contacts")
      .update({ last_contact_date: today })
      .eq("id", contactId);
    await supabase.from("interactions").insert({
      user_id: user.id,
      contact_id: contactId,
      type: "note",
      content: "סומן כ-פנוי",
    });
    toast.success("סומן כ-נוצר קשר!");
    refetch();
  };

  const snoozeContact = async (contactId: string) => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + 7);
    const snoozeStr = snoozeDate.toISOString().split("T")[0];
    await supabase
      .from("contacts")
      .update({ last_contact_date: snoozeStr })
      .eq("id", contactId);
    toast.success("נדחה לשבוע!");
    refetch();
  };

  return (
    <div className="relative min-h-full p-4 md:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {profile?.display_name
            ? `ברוכים הבאים, ${profile.display_name}`
            : "מבט כולל על היום שלך"}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          title="אנשי קשר"
          value={stats.totalContacts}
          icon={Users}
        />
        <StatCard
          title="עסקאות פעילות"
          value={stats.activeDeals}
          icon={Briefcase}
        />
        <StatCard
          title="הכנסות החודש"
          value={stats.revenueThisMonth}
          icon={DollarSign}
          prefix="₪"
        />
      </div>

      {/* Who to contact today */}
      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-primary" />
            מי ליצור קשר היום
            {dueContacts.length > 0 && (
              <Badge variant="destructive" className="ms-auto">
                {dueContacts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : dueContacts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Smile className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">הכל מסודר!</p>
              <p className="text-xs text-muted-foreground">
                אין מעקבים לביצוע היום.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {dueContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {contact.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contact.phone ?? "אין טלפון"}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {contact.phone && (
                      <a
                        href={buildWhatsAppUrl(contact.phone, contact.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => snoozeContact(contact.id)}
                    >
                      דחה
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => markContacted(contact.id)}
                    >
                      בוצע
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Jobs */}
      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" />
            עבודות קרובות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : upcomingDeals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">אין עבודות קרובות</p>
              <p className="text-xs text-muted-foreground">
                עסקאות עם תאריכי יעד יופיעו כאן.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {deal.contact_name ?? "אין איש קשר"} ·{" "}
                      {deal.due_date
                        ? format(parseISO(deal.due_date), "d/M")
                        : "אין תאריך"}
                    </p>
                  </div>
                  {deal.value != null && (
                    <span className="text-sm font-semibold text-primary">
                      ₪{deal.value.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAB */}
      <button
        onClick={() => setFabOpen(true)}
        className={cn(
          "fixed bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95 md:bottom-8",
          isRTL ? "left-4 md:left-6" : "right-4 md:right-6"
        )}
        aria-label="הוספה מהירה"
      >
        <Plus className="h-6 w-6" />
      </button>

      <FabMenu
        open={fabOpen}
        onClose={() => setFabOpen(false)}
        isRTL={isRTL}
      />
    </div>
  );
}

export default function Index() {
  return <Dashboard />;
}
