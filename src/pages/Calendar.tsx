import { useState, useEffect, useCallback } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
  setMonth,
  setYear,
} from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type Stage = Tables<"pipeline_stages">;
type Deal = Tables<"deals"> & { contact_name?: string | null; stage_color?: string };

const NO_CONTACT = "__none__";

const MONTH_NAMES_HE = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function NewDealSheet({
  open,
  defaultDate,
  stages,
  contacts,
  onClose,
  onSaved,
}: {
  open: boolean;
  defaultDate: string;
  stages: Stage[];
  contacts: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stageId, setStageId] = useState("");
  const [contactId, setContactId] = useState(NO_CONTACT);
  const [dueDate, setDueDate] = useState(defaultDate);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setValue("");
      setStageId(stages[0]?.id ?? "");
      setContactId(NO_CONTACT);
      setDueDate(defaultDate);
    }
  }, [open, defaultDate, stages]);

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("deals").insert({
        user_id: user.id,
        title: title.trim(),
        value: value ? parseFloat(value) : null,
        stage_id: stageId || null,
        contact_id: contactId === NO_CONTACT ? null : contactId,
        due_date: dueDate || null,
      });
      if (error) throw error;
      toast.success("Deal created!");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>עסקה חדשה</SheetTitle>
          <SheetDescription>הוסף עסקה לצינור שלך.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 pb-6">
          <div className="space-y-1.5">
            <Label>כותרת *</Label>
            <Input placeholder="לדוגמה: קייטרינג לחתונה" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>שווי (₪)</Label>
            <Input placeholder="5000" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>שלב</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger><SelectValue placeholder="בחר שלב" /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>איש קשר</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger><SelectValue placeholder="ללא איש קשר" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CONTACT}>ללא איש קשר</SelectItem>
                {contacts.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>תאריך</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "צור עסקה"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CalendarContent() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const isRTL = profile?.locale === "he" || profile?.locale === "ar";
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [sheetState, setSheetState] = useState<{ open: boolean; date: string }>({
    open: false,
    date: "",
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [stagesRes, dealsRes, contactsRes] = await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("*, pipelines!inner(user_id)")
        .order("display_order"),
      supabase
        .from("deals")
        .select("*, contacts(name)")
        .eq("user_id", user.id),
      supabase
        .from("contacts")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name"),
    ]);

    const myStages = (stagesRes.data ?? []).filter(
      (s: any) => s.pipelines?.user_id === user.id
    );
    setStages(myStages);

    const stageMap = new Map(myStages.map((s: Stage) => [s.id, s.color]));

    const enriched: Deal[] = (dealsRes.data ?? []).map((d: any) => ({
      ...d,
      contact_name: d.contacts?.name ?? null,
      stage_color: d.stage_id ? (stageMap.get(d.stage_id) ?? "#6366f1") : "#6366f1",
    }));
    setDeals(enriched);
    setContacts(contactsRes.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const dealsOnDay = (day: Date) =>
    deals.filter((d) => {
      const dateStr = d.due_date || d.event_date;
      if (!dateStr) return false;
      return isSameDay(parseISO(dateStr), day);
    });

  const handleDayClick = (day: Date) => {
    setSheetState({ open: true, date: format(day, "yyyy-MM-dd") });
  };

  const weekDays = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

  const currentYear = currentMonth.getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  // In RTL: "next" arrow should visually point left, "prev" should point right
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="relative flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 flex items-center justify-between border-b border-border/60 bg-background">
        <div>
          <h1 className="text-xl font-bold tracking-tight">יומן</h1>
          {/* Month & Year selectors */}
          <div className="flex items-center gap-2 mt-1">
            <Select
              value={String(currentMonth.getMonth())}
              onValueChange={(v) => setCurrentMonth((m) => setMonth(m, parseInt(v)))}
            >
              <SelectTrigger className="h-7 w-auto gap-1 border-none bg-transparent px-1 text-sm font-medium shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES_HE.map((name, i) => (
                  <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(currentYear)}
              onValueChange={(v) => setCurrentMonth((m) => setYear(m, parseInt(v)))}
            >
              <SelectTrigger className="h-7 w-auto gap-1 border-none bg-transparent px-1 text-sm font-medium shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="h-8 w-8">
            <PrevIcon className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[5rem] text-center">
            {MONTH_NAMES_HE[currentMonth.getMonth()]} {currentYear}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="h-8 w-8">
            <NextIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} className="h-8 px-3 text-xs ms-2">
            היום
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-2 md:p-4 pb-24 md:pb-8">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map((d) => (
              <div key={d} className="py-1 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMonth.toISOString()}
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-7 gap-px bg-border/40 rounded-xl overflow-hidden border border-border/40"
            >
              {days.map((day) => {
                const dayDeals = dealsOnDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "min-h-[5rem] md:min-h-[7rem] bg-background p-1.5 text-start transition-colors hover:bg-muted/40",
                      !isCurrentMonth && "bg-muted/20"
                    )}
                  >
                    <div
                      className={cn(
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isCurrentDay
                          ? "bg-primary text-primary-foreground"
                          : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {format(day, "d")}
                    </div>

                    <div className="space-y-0.5">
                      {dayDeals.slice(0, 3).map((deal) => (
                        <div
                          key={deal.id}
                          className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white leading-tight"
                          style={{ backgroundColor: deal.stage_color ?? "#6366f1" }}
                        >
                          {deal.title}
                        </div>
                      ))}
                      {dayDeals.length > 3 && (
                        <div className="text-[10px] text-muted-foreground ps-1">
                          +{dayDeals.length - 3}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Legend — deduplicated */}
          {stages.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {stages
                .filter((s, i, arr) => arr.findIndex((x) => x.name === s.name) === i)
                .map((s) => (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-muted-foreground">{s.name}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {deals.length === 0 && !loading && (
        <div className="flex flex-col items-center gap-3 py-12 text-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <CalendarDays className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium">אין עסקאות ביומן עדיין</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            הוסף תאריכי יעד לעסקאות שלך והן יופיעו כאן כבלוקים צבעוניים.
          </p>
          <Button size="sm" onClick={() => setSheetState({ open: true, date: format(new Date(), "yyyy-MM-dd") })}>
            <Plus className="h-4 w-4 me-1" /> צור עסקה ראשונה
          </Button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setSheetState({ open: true, date: format(new Date(), "yyyy-MM-dd") })}
        className={cn(
          "fixed bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95 md:bottom-8",
          isRTL ? "left-4 md:left-6" : "right-4 md:right-6"
        )}
        aria-label="Add deal"
      >
        <Plus className="h-6 w-6" />
      </button>

      <NewDealSheet
        open={sheetState.open}
        defaultDate={sheetState.date}
        stages={stages}
        contacts={contacts}
        onClose={() => setSheetState((s) => ({ ...s, open: false }))}
        onSaved={fetchData}
      />
    </div>
  );
}

export default function CalendarPage() {
  return <CalendarContent />;
}
