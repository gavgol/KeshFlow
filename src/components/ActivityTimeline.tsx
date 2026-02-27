import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { MessageCircle, Plus, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type: "created" | "note" | "call" | "email" | "stage_change" | string;
  content: string | null;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof MessageCircle; color: string; label: string }> = {
  created: { icon: Plus, color: "bg-emerald-500", label: "נוצר" },
  note: { icon: MessageCircle, color: "bg-primary", label: "הערה" },
  call: { icon: MessageCircle, color: "bg-blue-500", label: "שיחה" },
  email: { icon: MessageCircle, color: "bg-amber-500", label: "אימייל" },
  stage_change: { icon: RefreshCw, color: "bg-purple-500", label: "שינוי שלב" },
};

export function ActivityTimeline({ contactId }: { contactId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contactId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("interactions")
        .select("id, type, content, created_at")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });
      setEvents(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [contactId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <MessageCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">אין פעילות עדיין</p>
        <p className="text-xs text-muted-foreground">אינטראקציות עם איש הקשר יופיעו כאן.</p>
      </div>
    );
  }

  return (
    <div className="relative pe-6">
      {/* Vertical line */}
      <div className="absolute end-[11px] top-2 bottom-2 w-0.5 bg-border" />

      <div className="space-y-4">
        {events.map((event, i) => {
          const config = typeConfig[event.type] || typeConfig.note;
          const Icon = config.icon;

          return (
            <div key={event.id} className="relative flex items-start gap-3">
              {/* Dot */}
              <div
                className={cn(
                  "absolute end-0 top-1 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full ring-4 ring-background",
                  config.color
                )}
              >
                <Icon className="h-3 w-3 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 me-8 rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">{config.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {format(parseISO(event.created_at), "d/M/yyyy HH:mm")}
                  </span>
                </div>
                {event.content && (
                  <p className="text-sm text-foreground leading-relaxed">{event.content}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
