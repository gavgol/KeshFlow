import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CalendarDays,
  Columns3,
  Target,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BUSINESS_TYPES = [
  {
    id: "service" as const,
    title: "Service / Appointments",
    description: "Barber, Salon, Trainer, Therapist",
    icon: CalendarDays,
    defaultView: "calendar",
    stages: [
      { name: "Booked", color: "#6366f1", order: 0 },
      { name: "In Progress", color: "#f59e0b", order: 1 },
      { name: "Completed", color: "#10b981", order: 2 },
      { name: "Paid", color: "#22c55e", order: 3 },
    ],
  },
  {
    id: "project" as const,
    title: "Project / Pipeline",
    description: "Web Dev, Freelancer, Consultant",
    icon: Columns3,
    defaultView: "kanban",
    stages: [
      { name: "Lead", color: "#94a3b8", order: 0 },
      { name: "Proposal", color: "#6366f1", order: 1 },
      { name: "In Progress", color: "#f59e0b", order: 2 },
      { name: "Review", color: "#8b5cf6", order: 3 },
      { name: "Completed", color: "#22c55e", order: 4 },
    ],
  },
  {
    id: "sales" as const,
    title: "Sales / Leads",
    description: "Real Estate, Insurance, Retail",
    icon: Target,
    defaultView: "dashboard",
    stages: [
      { name: "New Lead", color: "#94a3b8", order: 0 },
      { name: "Contacted", color: "#6366f1", order: 1 },
      { name: "Qualified", color: "#8b5cf6", order: 2 },
      { name: "Negotiation", color: "#f59e0b", order: 3 },
      { name: "Closed Won", color: "#22c55e", order: 4 },
      { name: "Lost", color: "#ef4444", order: 5 },
    ],
  },
  {
    id: "other" as const,
    title: "Other / Custom",
    description: "Define your own workflow",
    icon: HelpCircle,
    defaultView: "kanban",
    stages: [
      { name: "Lead", color: "#94a3b8", order: 0 },
      { name: "Proposal", color: "#6366f1", order: 1 },
      { name: "In Progress", color: "#f59e0b", order: 2 },
      { name: "Review", color: "#8b5cf6", order: 3 },
      { name: "Completed", color: "#22c55e", order: 4 },
    ],
  },
];

const LOCALES = [
  { id: "en", label: "English", dir: "LTR", flag: "🇺🇸" },
  { id: "he", label: "עברית (Hebrew)", dir: "RTL", flag: "🇮🇱" },
  { id: "ar", label: "العربية (Arabic)", dir: "RTL", flag: "🇸🇦" },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [customWorkflow, setCustomWorkflow] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [locale, setLocale] = useState("en");
  const [saving, setSaving] = useState(false);

  const isRTL = locale === "he" || locale === "ar";
  const selectedType = BUSINESS_TYPES.find((t) => t.id === businessType);

  const handleComplete = async () => {
    if (!user || !selectedType) return;
    setSaving(true);

    const finalBusinessType =
      businessType === "other" && customWorkflow.trim()
        ? customWorkflow.trim()
        : selectedType.id;

    try {
      // 1. Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          business_type: finalBusinessType,
          business_name: businessName || null,
          display_name: displayName || null,
          locale,
          default_view: selectedType.defaultView,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // 2. Create default pipeline
      const { data: pipeline, error: pipelineError } = await supabase
        .from("pipelines")
        .insert({ user_id: user.id, name: "Default Pipeline" })
        .select("id")
        .single();

      if (pipelineError) throw pipelineError;

      // 3. Create pipeline stages
      const stages = selectedType.stages.map((s) => ({
        pipeline_id: pipeline.id,
        name: s.name,
        color: s.color,
        display_order: s.order,
      }));

      const { error: stagesError } = await supabase
        .from("pipeline_stages")
        .insert(stages);

      if (stagesError) throw stagesError;

      toast.success("You're all set! Welcome to Chameleon.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 3;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="flex min-h-screen items-center justify-center bg-background px-4 py-12 transition-all"
    >
      <div className="w-full max-w-lg space-y-6">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i + 1 <= step ? "bg-primary w-12" : "bg-muted w-8"
              )}
            />
          ))}
        </div>

        {/* Step 1: Language & Direction */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                Choose your language
              </h1>
              <p className="mt-1 text-muted-foreground">
                This sets the text direction for the entire app.
              </p>
            </div>

            <div className="grid gap-2">
              {LOCALES.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setLocale(loc.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-start transition-all",
                    locale === loc.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{loc.flag}</span>
                    <div>
                      <div className="font-medium">{loc.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {loc.dir}
                      </div>
                    </div>
                  </div>
                  {locale === loc.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>

            <Button className="w-full" onClick={() => setStep(2)}>
              Continue <ArrowRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
            </Button>
          </div>
        )}

        {/* Step 2: Business Type */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                What drives your business?
              </h1>
              <p className="mt-1 text-muted-foreground">
                We'll customize your CRM experience based on this.
              </p>
            </div>

            <div className="grid gap-3">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setBusinessType(type.id)}
                  className={cn(
                    "relative flex items-start gap-4 rounded-xl border-2 p-5 text-start transition-all",
                    businessType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                      businessType === type.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <type.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{type.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {type.description}
                    </div>
                    {/* Custom workflow input for "Other" */}
                    {type.id === "other" && businessType === "other" && (
                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        <Input
                          placeholder="e.g. Photography studio, Event planner..."
                          value={customWorkflow}
                          onChange={(e) => setCustomWorkflow(e.target.value)}
                          className="text-sm"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                  {businessType === type.id && (
                    <Check className="absolute end-4 top-4 h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} /> Back
              </Button>
              <Button
                className="flex-1"
                disabled={
                  !businessType ||
                  (businessType === "other" && !customWorkflow.trim())
                }
                onClick={() => setStep(3)}
              >
                Continue <ArrowRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Profile Info */}
        {step === 3 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Tell us about yourself</CardTitle>
              <CardDescription>
                This helps personalize your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Your Name</Label>
                <Input
                  id="displayName"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="John's Barbershop"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} /> Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      Get Started <ArrowRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
