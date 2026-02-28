import { useState } from "react";
import { useReminders, Reminder } from "@/hooks/useReminders";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Bell, Plus, Trash2, CalendarIcon, ChevronDown, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

/* ─── Reminder Row ─────────────────────────── */
function ReminderCard({
  reminder,
  onDone,
  onDelete,
  showDone = true,
}: {
  reminder: Reminder;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
  showDone?: boolean;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const isOverdue = reminder.due_date < today;
  const isToday = reminder.due_date === today;

  return (
    <div className="rounded-xl border border-border p-4 space-y-1.5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <p className="flex-1 font-semibold text-sm truncate">{reminder.title}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {isOverdue && <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">באיחור</Badge>}
          {isToday && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">היום</Badge>}
          {!isOverdue && !isToday && !reminder.is_done && (
            <Badge variant="secondary" className="text-[10px]">
              {format(parseISO(reminder.due_date), "d/M")}
            </Badge>
          )}
        </div>
      </div>
      {(reminder.contact_name || reminder.deal_title) && (
        <p className="text-sm text-muted-foreground truncate ps-11">
          {reminder.contact_name ?? reminder.deal_title}
        </p>
      )}
      <div className="flex items-center gap-2 ps-11">
        {reminder.repeat_days && (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px]">
            <RefreshCw className="h-3 w-3 me-1" />
            חוזרת כל {reminder.repeat_days} ימים
          </Badge>
        )}
        <div className="flex-1" />
        {showDone && (
          <Button size="sm" className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onDone(reminder.id)}>
            בוצע ✓
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(reminder.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Add Reminder Sheet ─────────────────────── */
function AddReminderSheet({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (data: {
    title: string;
    due_date: string;
    contact_id?: string | null;
    deal_id?: string | null;
    repeat_days?: number | null;
  }) => Promise<void>;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>();
  const [repeatOption, setRepeatOption] = useState("none");
  const [customDays, setCustomDays] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [dealId, setDealId] = useState<string | null>(null);
  const [dealSearch, setDealSearch] = useState("");
  const [deals, setDeals] = useState<{ id: string; title: string }[]>([]);
  const [contactOpen, setContactOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchContacts = async (q: string) => {
    if (!user) return;
    setContactSearch(q);
    const { data } = await supabase
      .from("contacts")
      .select("id, name")
      .eq("user_id", user.id)
      .ilike("name", `%${q}%`)
      .limit(10);
    setContacts(data ?? []);
  };

  const searchDeals = async (q: string) => {
    if (!user) return;
    setDealSearch(q);
    const { data } = await supabase
      .from("deals")
      .select("id, title")
      .eq("user_id", user.id)
      .ilike("title", `%${q}%`)
      .limit(10);
    setDeals(data ?? []);
  };

  const reset = () => {
    setTitle("");
    setDate(undefined);
    setRepeatOption("none");
    setCustomDays("");
    setContactId(null);
    setDealId(null);
    setContactSearch("");
    setDealSearch("");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date) return;
    setSubmitting(true);
    const repeatDays =
      repeatOption === "7" ? 7
      : repeatOption === "14" ? 14
      : repeatOption === "30" ? 30
      : repeatOption === "custom" ? parseInt(customDays) || null
      : null;

    try {
      await onCreate({
        title: title.trim(),
        due_date: format(date, "yyyy-MM-dd"),
        contact_id: contactId,
        deal_id: dealId,
        repeat_days: repeatDays,
      });
      toast.success("תזכורת נוצרה!");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("שגיאה ביצירת תזכורת");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl md:rounded-t-none md:max-h-full md:max-w-md md:rounded-s-2xl" dir="rtl">
        <SheetHeader>
          <SheetTitle>הוסף תזכורת</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>כותרת *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: להתקשר ללקוח" />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>תאריך *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-start", !date && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4 me-2" />
                  {date ? format(date, "dd/MM/yyyy") : "בחר תאריך"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Repeat */}
          <div className="space-y-1.5">
            <Label>חזרה אוטומטית</Label>
            <Select value={repeatOption} onValueChange={setRepeatOption}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא</SelectItem>
                <SelectItem value="7">כל 7 ימים</SelectItem>
                <SelectItem value="14">כל 14 ימים</SelectItem>
                <SelectItem value="30">כל 30 ימים</SelectItem>
                <SelectItem value="custom">מותאם אישית</SelectItem>
              </SelectContent>
            </Select>
            {repeatOption === "custom" && (
              <Input type="number" min={1} placeholder="מספר ימים" value={customDays} onChange={(e) => setCustomDays(e.target.value)} className="mt-1.5" />
            )}
          </div>

          {/* Contact */}
          <div className="space-y-1.5">
            <Label>איש קשר (אופציונלי)</Label>
            <Popover open={contactOpen} onOpenChange={setContactOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-start">
                  {contactId ? contacts.find(c => c.id === contactId)?.name ?? "נבחר" : "בחר איש קשר..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 pointer-events-auto" align="start">
                <Command>
                  <CommandInput placeholder="חפש..." value={contactSearch} onValueChange={searchContacts} />
                  <CommandList>
                    <CommandEmpty>לא נמצאו</CommandEmpty>
                    <CommandGroup>
                      {contacts.map((c) => (
                        <CommandItem key={c.id} value={c.name} onSelect={() => { setContactId(c.id); setContactOpen(false); }}>
                          <Check className={cn("h-4 w-4 me-2", contactId === c.id ? "opacity-100" : "opacity-0")} />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Deal */}
          <div className="space-y-1.5">
            <Label>עסקה (אופציונלי)</Label>
            <Popover open={dealOpen} onOpenChange={setDealOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-start">
                  {dealId ? deals.find(d => d.id === dealId)?.title ?? "נבחר" : "בחר עסקה..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 pointer-events-auto" align="start">
                <Command>
                  <CommandInput placeholder="חפש..." value={dealSearch} onValueChange={searchDeals} />
                  <CommandList>
                    <CommandEmpty>לא נמצאו</CommandEmpty>
                    <CommandGroup>
                      {deals.map((d) => (
                        <CommandItem key={d.id} value={d.title} onSelect={() => { setDealId(d.id); setDealOpen(false); }}>
                          <Check className={cn("h-4 w-4 me-2", dealId === d.id ? "opacity-100" : "opacity-0")} />
                          {d.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Button className="w-full" disabled={!title.trim() || !date || submitting} onClick={handleSubmit}>
            <Plus className="h-4 w-4 me-2" />
            הוסף תזכורת
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Page ────────────────────────────────────── */
export default function RemindersPage() {
  const { allReminders, completedReminders, overdueCount, loading, createReminder, markDone, deleteReminder } = useReminders();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);

  return (
    <div className="relative min-h-full p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-start">תזכורות</h1>
          <p className="mt-0.5 text-sm text-muted-foreground text-start">ניהול תזכורות ומשימות</p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="h-4 w-4 me-2" />
          הוסף תזכורת
        </Button>
      </div>

      {/* Pending */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          ממתינות
          {overdueCount > 0 && <Badge variant="destructive">{overdueCount}</Badge>}
        </h2>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : allReminders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">אין תזכורות ממתינות</p>
            <p className="text-xs text-muted-foreground">לחץ על "הוסף תזכורת" ליצירת תזכורת חדשה</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allReminders.map(rem => (
              <ReminderCard key={rem.id} reminder={rem} onDone={markDone} onDelete={deleteReminder} />
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedReminders.length > 0 && (
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={cn("h-4 w-4 transition-transform", completedOpen && "rotate-180")} />
            הושלמו ({completedReminders.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {completedReminders.map(rem => (
              <div key={rem.id} className="rounded-xl border border-border p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Check className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="flex-1 font-medium text-sm truncate line-through">{rem.title}</p>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteReminder(rem.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      <AddReminderSheet open={sheetOpen} onOpenChange={setSheetOpen} onCreate={createReminder} />
    </div>
  );
}
