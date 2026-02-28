import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { ContactAvatar } from "@/components/ContactAvatar";
import { EmptyState } from "@/components/EmptyState";
import { SwipeableContactRow } from "@/components/SwipeableContactRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Phone,
  MessageCircle,
  Pencil,
  Search,
  Plus,
  Users,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { differenceInDays, parseISO, format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type Contact = Tables<"contacts">;

function getFollowUpStatus(contact: Contact): "overdue" | "soon" | "ok" | "none" {
  if (!contact.last_contact_date || !contact.contact_frequency_days) return "none";
  const last = parseISO(contact.last_contact_date);
  const daysSince = differenceInDays(new Date(), last);
  const freq = contact.contact_frequency_days;
  if (daysSince >= freq) return "overdue";
  if (daysSince >= freq * 0.8) return "soon";
  return "ok";
}

function ContactRow({ contact, onEdit, winRate }: { contact: Contact; onEdit: (c: Contact) => void; winRate?: { won: number; total: number } }) {
  const status = getFollowUpStatus(contact);
  const phone = contact.phone?.replace(/\D/g, "") ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/40"
    >
      <ContactAvatar name={contact.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-sm">{contact.name}</span>
          {winRate && winRate.total > 0 && (
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-[10px] px-1.5 py-0 gap-0.5",
                winRate.won / winRate.total > 0.5
                  ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30"
                  : "text-muted-foreground bg-muted border-border"
              )}
            >
              {winRate.won}/{winRate.total} ✓
            </Badge>
          )}
          {status === "overdue" && (
            <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">
              פג תוקף
            </Badge>
          )}
          {status === "soon" && (
            <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 border-warning/50 text-warning">
              בקרוב
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          {contact.company && <span className="truncate">{contact.company}</span>}
          {contact.company && contact.last_contact_date && <span>·</span>}
          {contact.last_contact_date && (
            <span>קשר אחרון: {format(parseISO(contact.last_contact_date), "d/M")}</span>
          )}
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Call"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-3.5 w-3.5" />
          </a>
        )}
        {phone && (
          <a
            href={buildWhatsAppUrl(contact.phone!, contact.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-success/10 text-muted-foreground hover:text-success transition-colors"
            title="WhatsApp"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          onClick={() => onEdit(contact)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  company: string;
  frequency: number;
}

function ContactSheet({
  open,
  contact,
  onClose,
  onSaved,
}: {
  open: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState<ContactFormData>({
    name: "",
    phone: "",
    email: "",
    company: "",
    frequency: 30,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name,
        phone: contact.phone ?? "",
        email: contact.email ?? "",
        company: contact.company ?? "",
        frequency: contact.contact_frequency_days ?? 30,
      });
    } else {
      setForm({ name: "", phone: "", email: "", company: "", frequency: 30 });
    }
  }, [contact, open]);

  const handleSave = async () => {
    if (!user || !form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      company: form.company.trim() || null,
      contact_frequency_days: form.frequency,
    };
    try {
      if (contact) {
        const { error } = await supabase.from("contacts").update(payload).eq("id", contact.id);
        if (error) throw error;
        toast.success("Contact updated!");
      } else {
        const { error } = await supabase.from("contacts").insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success("Contact added!");
      }
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof ContactFormData) => ({
    value: String(form[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
        <SheetTitle>{contact ? "עריכת איש קשר" : "איש קשר חדש"}</SheetTitle>
          <SheetDescription>
            {contact ? "עדכן את פרטי איש הקשר." : "הוסף לקוח או ליד לרשימה."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">שם *</Label>
            <Input id="c-name" placeholder="ישראל ישראלי" {...field("name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-phone">טלפון</Label>
            <Input id="c-phone" placeholder="050-000-0000" type="tel" {...field("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-email">אימייל</Label>
            <Input id="c-email" placeholder="israel@example.com" type="email" {...field("email")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-company">חברה</Label>
            <Input id="c-company" placeholder="חברה בע״מ" {...field("company")} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>תדירות מעקב</Label>
              <span className="text-sm font-medium text-primary">כל {form.frequency} ימים</span>
            </div>
            <Slider
              min={1}
              max={180}
              step={1}
              value={[form.frequency]}
              onValueChange={([v]) => setForm((f) => ({ ...f, frequency: v }))}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>יומי</span>
              <span>חודשי</span>
              <span>חצי שנה</span>
            </div>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : contact ? "שמור שינויים" : "הוסף איש קשר"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ContactsContent() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const isRTL = profile?.locale === "he" || profile?.locale === "ar";
  const [searchParams, setSearchParams] = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dealCountsMap, setDealCountsMap] = useState<Map<string, { won: number; total: number }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  const fetchContacts = async () => {
    if (!user) return;
    setLoading(true);
    const [contactsRes, dealCountsRes] = await Promise.all([
      supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("name"),
      supabase
        .from("deals")
        .select("contact_id, status")
        .eq("user_id", user.id)
        .not("contact_id", "is", null),
    ]);
    setContacts(contactsRes.data ?? []);

    // Build win-rate map
    const map = new Map<string, { won: number; total: number }>();
    for (const d of (dealCountsRes.data ?? []) as any[]) {
      if (!d.contact_id) continue;
      const entry = map.get(d.contact_id) ?? { won: 0, total: 0 };
      entry.total++;
      if (d.status === 'won') entry.won++;
      map.set(d.contact_id, entry);
    }
    setDealCountsMap(map);
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, [user]);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q) ||
      (c.company ?? "").toLowerCase().includes(q)
    );
  });

  const openNew = () => { setEditContact(null); setSheetOpen(true); };
  const openEdit = (c: Contact) => { setEditContact(c); setSheetOpen(true); };

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    openNew();
    const params = new URLSearchParams(searchParams);
    params.delete("new");
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <div className="relative min-h-full p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-2xl font-bold tracking-tight">אנשי קשר</h1>
          <p className="text-sm text-muted-foreground">לקוחות ולידים שלך.</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> הוסף
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חפש לפי שם, טלפון, חברה..."
          className="ps-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute end-3 top-1/2 -translate-y-1/2"
            onClick={() => setSearch("")}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="אין אנשי קשר עדיין"
            description="התחל לבנות את רשימת הלקוחות שלך. הוסף לקוחות, לידים ושותפים."
            actionLabel="הוסף את איש הקשר הראשון"
            onAction={openNew}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="אין תוצאות"
            description={`לא נמצאו אנשי קשר עבור "${search}". נסה חיפוש אחר.`}
          />
        )
      ) : (
        <div className="divide-y divide-border/50">
          {filtered.map((contact) => (
            <SwipeableContactRow key={contact.id} contact={contact}>
              <ContactRow contact={contact} onEdit={openEdit} winRate={dealCountsMap.get(contact.id)} />
            </SwipeableContactRow>
          ))}
        </div>
      )}

      {/* FAB — sticky within content */}
      <button
        onClick={openNew}
        className="sticky bottom-4 start-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95 ms-4 mb-4"
        aria-label="Add contact"
      >
        <Plus className="h-6 w-6" />
      </button>

      <ContactSheet
        open={sheetOpen}
        contact={editContact}
        onClose={() => setSheetOpen(false)}
        onSaved={fetchContacts}
      />
    </div>
  );
}

export default function ContactsPage() {
  return <ContactsContent />;
}
