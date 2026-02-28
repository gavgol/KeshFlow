import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ContactAvatar } from "@/components/ContactAvatar";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Phone,
  MessageCircle,
  Pencil,
  Loader2,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { differenceInDays, parseISO, format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type Contact = Tables<"contacts">;

interface ContactDetailSheetProps {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
  onContactUpdated: () => void;
}

function getFollowUpStatus(contact: Contact): "overdue" | "soon" | "ok" | "none" {
  if (!contact.last_contact_date || !contact.contact_frequency_days) return "none";
  const last = parseISO(contact.last_contact_date);
  const daysSince = differenceInDays(new Date(), last);
  const freq = contact.contact_frequency_days;
  if (daysSince >= freq) return "overdue";
  if (daysSince >= freq * 0.8) return "soon";
  return "ok";
}

const statusBadge: Record<string, { label: string; className: string }> = {
  overdue: { label: "פג תוקף", className: "bg-destructive/10 text-destructive border-destructive/30" },
  soon: { label: "בקרוב", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  ok: { label: "בסדר", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
};

interface DealRow {
  id: string;
  title: string;
  status: string;
  value: number | null;
  due_date: string | null;
}

function DealsTab({ contactId }: { contactId: string }) {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contactId) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("deals")
        .select("id, title, status, value, due_date")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });
      setDeals(data ?? []);
      setLoading(false);
    };
    load();
  }, [contactId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Briefcase className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">אין עסקאות</p>
        <p className="text-xs text-muted-foreground">עסקאות שמקושרות לאיש הקשר יופיעו כאן.</p>
      </div>
    );
  }

  const dealStatusConfig: Record<string, { label: string; className: string }> = {
    active: { label: "פעילה", className: "bg-primary/10 text-primary border-primary/30" },
    won: { label: "נסגרה ✓", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
    lost: { label: "אבדה", className: "bg-destructive/10 text-destructive border-destructive/30" },
  };

  return (
    <div className="space-y-2">
      {deals.map((deal) => {
        const config = dealStatusConfig[deal.status] ?? dealStatusConfig.active;
        return (
          <div key={deal.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{deal.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.className)}>
                  {config.label}
                </Badge>
                {deal.due_date && (
                  <span className="text-[11px] text-muted-foreground">
                    {format(parseISO(deal.due_date), "d/M/yyyy")}
                  </span>
                )}
              </div>
            </div>
            {deal.value != null && (
              <span className="text-sm font-semibold text-primary shrink-0">₪{deal.value.toLocaleString()}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ContactDetailSheet({ contact, open, onClose, onContactUpdated }: ContactDetailSheetProps) {
  const { user } = useAuth();
  const [marking, setMarking] = useState(false);

  if (!contact) return null;

  const status = getFollowUpStatus(contact);
  const phone = contact.phone?.replace(/\D/g, "") ?? "";
  const badge = statusBadge[status];

  const handleMarkContacted = async () => {
    if (!user) return;
    setMarking(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("contacts").update({ last_contact_date: today }).eq("id", contact.id);
      await supabase.from("interactions").insert({
        user_id: user.id,
        contact_id: contact.id,
        type: "note",
        content: "סומן כ-נוצר קשר",
      });
      toast.success("סומן כ-נוצר קשר!");
      onContactUpdated();
    } catch {
      toast.error("שגיאה בעדכון");
    } finally {
      setMarking(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{contact.name}</SheetTitle>
          <SheetDescription>פרטי איש קשר</SheetDescription>
        </SheetHeader>

        {/* Top Section — Contact Info */}
        <div className="p-6 pb-4 border-b border-border">
          <div className="flex items-start gap-4">
            <ContactAvatar name={contact.name} size="lg" className="h-14 w-14 text-base" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{contact.name}</h2>
              {contact.company && (
                <p className="text-sm text-muted-foreground truncate">{contact.company}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="text-xs text-primary hover:underline">
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="text-xs text-primary hover:underline">
                    {contact.email}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick actions + status */}
          <div className="flex items-center gap-2 mt-4">
            <TooltipProvider delayDuration={200}>
              {phone && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={buildWhatsAppUrl(contact.phone!, contact.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>WhatsApp</TooltipContent>
                </Tooltip>
              )}
              {contact.phone && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>התקשר</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>

            {badge && (
              <Badge variant="outline" className={cn("text-xs ms-auto", badge.className)}>
                {badge.label}
              </Badge>
            )}
          </div>

          {/* Mark as contacted */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 gap-2"
            onClick={handleMarkContacted}
            disabled={marking}
          >
            {marking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            סמן כנוצר קשר
          </Button>
        </div>

        {/* Bottom Section — Tabs */}
        <Tabs defaultValue="timeline" className="flex-1">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent h-11">
            <TabsTrigger value="timeline" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              ציר זמן
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              עסקאות
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="p-4 mt-0">
            <ActivityTimeline contactId={contact.id} />
          </TabsContent>
          <TabsContent value="deals" className="p-4 mt-0">
            <DealsTab contactId={contact.id} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
