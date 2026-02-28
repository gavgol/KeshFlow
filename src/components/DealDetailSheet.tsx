import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ContactAvatar } from "@/components/ContactAvatar";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarDays,
  Loader2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  Check,
  Bell,
} from "lucide-react";
import { MiniReminderPopover } from "@/components/MiniReminderPopover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type Deal = Tables<"deals"> & {
  contact_name?: string | null;
  contact_phone?: string | null;
};
type Stage = Tables<"pipeline_stages">;

interface DealDetailSheetProps {
  deal: Deal | null;
  stages: Stage[];
  open: boolean;
  onClose: () => void;
  onDealUpdated: () => void;
}

const dealStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "פעילה", className: "bg-primary/10 text-primary border-primary/30" },
  won: { label: "נסגרה ✓", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  lost: { label: "אבדה", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export function DealDetailSheet({ deal, stages, open, onClose, onDealUpdated }: DealDetailSheetProps) {
  const { user } = useAuth();

  // Editable fields
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [editingValue, setEditingValue] = useState(false);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [localStatus, setLocalStatus] = useState(deal?.status ?? "active");
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [updating, setUpdating] = useState(false);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when deal changes
  useEffect(() => {
    if (deal) {
      setTitle(deal.title);
      setValue(deal.value != null ? String(deal.value) : "");
      setNotes(deal.notes ?? "");
      setLocalStatus(deal.status);
      setEditingTitle(false);
      setEditingValue(false);
    }
  }, [deal?.id, deal?.status]);

  const updateField = useCallback(
    async (fields: Record<string, unknown>) => {
      if (!deal) return;
      const { error } = await supabase
        .from("deals")
        .update(fields)
        .eq("id", deal.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      onDealUpdated();
    },
    [deal, onDealUpdated]
  );

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (title.trim() && title !== deal?.title) {
      updateField({ title: title.trim() });
    }
  };

  const handleValueBlur = () => {
    setEditingValue(false);
    const numVal = value ? parseFloat(value) : null;
    if (numVal !== deal?.value) {
      updateField({ value: numVal });
    }
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(async () => {
      await updateField({ notes: val || null });
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 2000);
    }, 2000);
  };

  const handleNotesBlur = () => {
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    if (notes !== (deal?.notes ?? "")) {
      updateField({ notes: notes || null });
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 2000);
    }
  };

  const handleStatusChange = async (status: "active" | "won" | "lost") => {
    setUpdating(true);
    setLocalStatus(status);
    await updateField({ status });
    if (status === "won") toast.success("העסקה נסגרה בהצלחה! 🎉");
    else if (status === "lost") toast.error("העסקה סומנה כאבודה");
    else toast.success("העסקה הוחזרה לפעילה");
    setUpdating(false);
  };

  const handleDateChange = (field: "due_date" | "event_date", date: Date | undefined) => {
    updateField({ [field]: date ? format(date, "yyyy-MM-dd") : null });
  };

  const handleStageChange = (stageId: string) => {
    updateField({ stage_id: stageId });
  };

  if (!deal) return null;

  const statusConfig = dealStatusConfig[localStatus] ?? dealStatusConfig.active;
  const currentStage = stages.find((s) => s.id === deal.stage_id);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>{deal.title}</SheetTitle>
          <SheetDescription>פרטי עסקה</SheetDescription>
        </SheetHeader>

        {/* SECTION 1 — Header */}
        <div className="p-6 pb-4 border-b border-border space-y-3">
          {/* Title — inline editable */}
          {editingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
              autoFocus
              className="text-xl font-bold h-auto py-1"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h2
                className="text-xl font-bold cursor-pointer hover:text-primary/80 transition-colors truncate flex-1"
                onClick={() => setEditingTitle(true)}
                title="לחץ לעריכה"
              >
                {deal.title}
              </h2>
              <MiniReminderPopover defaultTitle={`מעקב על ${deal.title}`} dealId={deal.id} contactId={deal.contact_id} />
            </div>
          )}

          {/* Stage + Status + Value row */}
          <div className="flex flex-wrap items-center gap-2">
            {currentStage && (
              <Badge variant="outline" className="text-xs gap-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: currentStage.color }}
                />
                {currentStage.name}
              </Badge>
            )}
            <Badge variant="outline" className={cn("text-xs", statusConfig.className)}>
              {statusConfig.label}
            </Badge>
            {/* Value — inline editable */}
            {editingValue ? (
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleValueBlur}
                onKeyDown={(e) => e.key === "Enter" && handleValueBlur()}
                autoFocus
                className="h-7 w-28 text-sm"
                placeholder="שווי"
              />
            ) : (
              <span
                className="text-sm font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors ms-auto"
                onClick={() => setEditingValue(true)}
                title="לחץ לעריכה"
              >
                {deal.value != null ? `₪${deal.value.toLocaleString()}` : "₪ —"}
              </span>
            )}
          </div>
        </div>

        {/* SECTION 2 — Details grid */}
        <div className="p-6 pb-4 border-b border-border">
          <div className="grid grid-cols-2 gap-4">
            {/* Due date */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">תאריך יעד</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-right font-normal h-9 text-sm", !deal.due_date && "text-muted-foreground")}
                  >
                    <CalendarDays className="h-3.5 w-3.5 me-1.5" />
                    {deal.due_date ? format(parseISO(deal.due_date), "d/M/yyyy") : "בחר"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deal.due_date ? parseISO(deal.due_date) : undefined}
                    onSelect={(d) => handleDateChange("due_date", d)}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Event date */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">תאריך אירוע</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-right font-normal h-9 text-sm", !deal.event_date && "text-muted-foreground")}
                  >
                    <CalendarDays className="h-3.5 w-3.5 me-1.5" />
                    {deal.event_date ? format(parseISO(deal.event_date), "d/M/yyyy") : "בחר"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deal.event_date ? parseISO(deal.event_date) : undefined}
                    onSelect={(d) => handleDateChange("event_date", d)}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Contact */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">איש קשר</Label>
              {deal.contact_name ? (
                <div className="flex items-center gap-2 h-9 px-2 rounded-md border border-input bg-background">
                  <ContactAvatar name={deal.contact_name} size="sm" className="h-5 w-5 text-[9px]" />
                  <span className="text-sm truncate">{deal.contact_name}</span>
                </div>
              ) : (
                <div className="flex items-center h-9 px-2 rounded-md border border-input bg-background text-sm text-muted-foreground">
                  ללא
                </div>
              )}
            </div>

            {/* Stage select */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">שלב</Label>
              <Select value={deal.stage_id ?? ""} onValueChange={handleStageChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="בחר שלב" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* SECTION 3 — Notes */}
        <div className="p-6 pb-4 border-b border-border space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">הערות</Label>
            {savedIndicator && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> נשמר ✓
              </span>
            )}
          </div>
          <Textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="הוסף הערות לגבי העסקה..."
            className="min-h-[80px] text-sm resize-none"
          />
        </div>

        {/* SECTION 4 — Activity Timeline */}
        <div className="flex-1">
          <Tabs defaultValue="timeline">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-11">
              <TabsTrigger
                value="timeline"
                className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                ציר זמן
              </TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="p-4 mt-0">
              {deal.contact_id ? (
                <ActivityTimeline contactId={deal.contact_id} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  אין איש קשר משויך — לא ניתן להציג ציר זמן.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="sticky bottom-0 border-t border-border bg-background p-4 z-20">
          {localStatus === "active" && (
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleStatusChange("won")}
                disabled={updating}
              >
                <CheckCircle className="h-4 w-4" /> סגור כהצלחה
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleStatusChange("lost")}
                disabled={updating}
              >
                <XCircle className="h-4 w-4" /> סמן כאבוד
              </Button>
            </div>
          )}
          {localStatus === "won" && (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center justify-center gap-2 text-emerald-600 font-medium">
                <Trophy className="h-5 w-5" /> עסקה נסגרה
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => handleStatusChange("active")}
                disabled={updating}
              >
                <RotateCcw className="h-3.5 w-3.5" /> בטל
              </Button>
            </div>
          )}
          {localStatus === "lost" && (
            <Button
              variant="outline"
              className="w-full gap-1.5"
              onClick={() => handleStatusChange("active")}
              disabled={updating}
            >
              <RotateCcw className="h-4 w-4" /> החזר לפעיל
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
