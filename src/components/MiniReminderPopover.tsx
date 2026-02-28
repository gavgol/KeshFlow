import { useState } from "react";
import { useReminders } from "@/hooks/useReminders";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bell, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MiniReminderPopoverProps {
  defaultTitle: string;
  contactId?: string | null;
  dealId?: string | null;
  /** Render custom trigger, or use default Bell button */
  children?: React.ReactNode;
}

export function MiniReminderPopover({
  defaultTitle,
  contactId,
  dealId,
  children,
}: MiniReminderPopoverProps) {
  const { createReminder } = useReminders();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [date, setDate] = useState<Date>(addDays(new Date(), 1));
  const [repeat, setRepeat] = useState("none");
  const [submitting, setSubmitting] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const handleOpen = (v: boolean) => {
    if (v) {
      setTitle(defaultTitle);
      setDate(addDays(new Date(), 1));
      setRepeat("none");
    }
    setOpen(v);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date) return;
    setSubmitting(true);
    const repeatDays = repeat === "7" ? 7 : repeat === "30" ? 30 : null;
    try {
      await createReminder({
        title: title.trim(),
        due_date: format(date, "yyyy-MM-dd"),
        contact_id: contactId ?? null,
        deal_id: dealId ?? null,
        repeat_days: repeatDays,
      });
      toast.success("תזכורת נוספה!");
      setOpen(false);
    } catch {
      toast.error("שגיאה");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            {children ?? (
              <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors">
                <Bell className="h-4 w-4" />
              </button>
            )}
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>הוסף תזכורת</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-72 p-3 pointer-events-auto" align="start" dir="rtl">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">כותרת</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">תאריך</Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start h-8 text-sm text-start")}>
                  <CalendarIcon className="h-3.5 w-3.5 me-1.5" />
                  {format(date, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { if (d) setDate(d); setCalOpen(false); }}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">חזרה</Label>
            <Select value={repeat} onValueChange={setRepeat}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא</SelectItem>
                <SelectItem value="7">כל 7 ימים</SelectItem>
                <SelectItem value="30">כל 30 ימים</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="w-full" disabled={!title.trim() || submitting} onClick={handleSubmit}>
            הוסף
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
