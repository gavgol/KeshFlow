import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Sparkles, Calendar, User, Phone, FileText } from "lucide-react";
import { toast } from "sonner";

interface BusinessInfo {
  userId: string;
  businessName: string;
  firstStageId: string | null;
}

export default function BookingPage() {
  const { business_slug } = useParams<{ business_slug: string }>();
  const [biz, setBiz] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    notes: "",
  });

  useEffect(() => {
    if (!business_slug) return;
    (async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, business_name")
        .not("business_name", "is", null);

      const match = (profiles ?? []).find((p) => {
        const slug = (p.business_name ?? "")
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        return slug === business_slug;
      });

      if (!match) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: stagesData } = await supabase
        .from("pipeline_stages")
        .select("id, pipeline_id, display_order, pipelines!inner(user_id)")
        .order("display_order")
        .limit(10);

      const myStages = (stagesData ?? []).filter(
        (s: any) => s.pipelines?.user_id === match.user_id
      );

      setBiz({
        userId: match.user_id,
        businessName: match.business_name!,
        firstStageId: myStages[0]?.id ?? null,
      });
      setLoading(false);
    })();
  }, [business_slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biz || !form.name.trim() || !form.phone.trim()) return;
    setSaving(true);

    try {
      const { data: contactData, error: contactError } = await supabase
        .from("contacts")
        .insert({
          user_id: biz.userId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          notes: form.notes.trim() || null,
          last_contact_date: new Date().toISOString().split("T")[0],
          contact_frequency_days: 30,
        })
        .select("id")
        .single();

      if (contactError) throw contactError;

      const { error: dealError } = await supabase.from("deals").insert({
        user_id: biz.userId,
        title: `ליד: ${form.name.trim()}`,
        contact_id: contactData.id,
        stage_id: biz.firstStageId,
        due_date: form.date || null,
        notes: form.notes.trim() || null,
      });

      if (dealError) throw dealError;

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message ?? "אירעה שגיאה. אנא נסה שוב.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-background text-center px-6">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2">הדף לא נמצא</h1>
        <p className="text-muted-foreground">
          קישור ההזמנה אינו קיים או שהושבת.
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center px-4 py-12">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/20">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {biz!.businessName}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  מלאו את הטופס ונחזור אליכם בהקדם.
                </p>
              </div>

              {/* Glassmorphism card */}
              <div className="rounded-3xl border border-white/30 bg-background/70 backdrop-blur-xl shadow-2xl p-7 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="b-name" className="flex items-center gap-1.5 text-sm font-medium">
                      <User className="h-3.5 w-3.5 text-primary" /> שם מלא *
                    </Label>
                    <Input
                      id="b-name"
                      placeholder="ישראל ישראלי"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="bg-background/80 border-border/60 focus-visible:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="b-phone" className="flex items-center gap-1.5 text-sm font-medium">
                      <Phone className="h-3.5 w-3.5 text-primary" /> טלפון *
                    </Label>
                    <Input
                      id="b-phone"
                      placeholder="050-000-0000"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="bg-background/80 border-border/60 focus-visible:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="b-date" className="flex items-center gap-1.5 text-sm font-medium">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> תאריך מועדף
                    </Label>
                    <Input
                      id="b-date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="bg-background/80 border-border/60 focus-visible:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="b-notes" className="flex items-center gap-1.5 text-sm font-medium">
                      <FileText className="h-3.5 w-3.5 text-primary" /> הערות (אופציונלי)
                    </Label>
                    <Textarea
                      id="b-notes"
                      placeholder="ספרו לנו במה אתם צריכים עזרה..."
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="bg-background/80 border-border/60 focus-visible:border-primary min-h-[90px] resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold rounded-xl"
                    disabled={saving || !form.name.trim() || !form.phone.trim()}
                  >
                    {saving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>שלח פנייה ✨</>
                    )}
                  </Button>
                </form>

                <p className="text-center text-[11px] text-muted-foreground/70">
                  מופעל על ידי Chameleon CRM
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center"
            >
              <div className="rounded-3xl border border-white/30 bg-background/70 backdrop-blur-xl shadow-2xl p-10 space-y-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                  className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-success/15 mx-auto"
                >
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">הפנייה נשלחה!</h2>
                  <p className="mt-2 text-muted-foreground">
                    קיבלנו את הפרטים שלך ונחזור אליך בהקדם.
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/50 px-5 py-4 text-sm text-muted-foreground">
                  <strong className="text-foreground">{form.name}</strong> — ניצור קשר בטלפון{" "}
                  <strong className="text-foreground">{form.phone}</strong>.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
