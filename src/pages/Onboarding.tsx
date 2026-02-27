import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
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
    title: "שירות / תורים",
    description: "מספרה, סלון, מאמן, מטפל",
    icon: CalendarDays,
    defaultView: "calendar",
    stages: [
      { name: "הוזמן", color: "#6366f1", order: 0 },
      { name: "בתהליך", color: "#f59e0b", order: 1 },
      { name: "הושלם", color: "#10b981", order: 2 },
      { name: "שולם", color: "#22c55e", order: 3 },
    ],
  },
  {
    id: "project" as const,
    title: "פרויקט / צינור",
    description: "פיתוח אתרים, פרילנסר, יועץ",
    icon: Columns3,
    defaultView: "kanban",
    stages: [
      { name: "ליד חדש", color: "#94a3b8", order: 0 },
      { name: "הצעת מחיר", color: "#6366f1", order: 1 },
      { name: "בתהליך", color: "#f59e0b", order: 2 },
      { name: "בבדיקה", color: "#8b5cf6", order: 3 },
      { name: "הושלם", color: "#22c55e", order: 4 },
    ],
  },
  {
    id: "sales" as const,
    title: "מכירות / לידים",
    description: "נדל״ן, ביטוח, קמעונאות",
    icon: Target,
    defaultView: "dashboard",
    stages: [
      { name: "ליד חדש", color: "#94a3b8", order: 0 },
      { name: "נוצר קשר", color: "#6366f1", order: 1 },
      { name: "מתאים", color: "#8b5cf6", order: 2 },
      { name: "משא ומתן", color: "#f59e0b", order: 3 },
      { name: "נסגר בהצלחה", color: "#22c55e", order: 4 },
      { name: "אבד", color: "#ef4444", order: 5 },
    ],
  },
  {
    id: "other" as const,
    title: "אחר / מותאם אישית",
    description: "הגדר את תהליך העבודה שלך",
    icon: HelpCircle,
    defaultView: "kanban",
    stages: [
      { name: "ליד חדש", color: "#94a3b8", order: 0 },
      { name: "הצעת מחיר", color: "#6366f1", order: 1 },
      { name: "בתהליך", color: "#f59e0b", order: 2 },
      { name: "בבדיקה", color: "#8b5cf6", order: 3 },
      { name: "הושלם", color: "#22c55e", order: 4 },
    ],
  },
];

export default function Onboarding() {
  const { user } = useAuth();
  const { refetch: refetchProfile } = useProfile();
  const navigate = useNavigate();
  // Only 2 steps now: business type + profile info
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [customWorkflow, setCustomWorkflow] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

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
          locale: "he",
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

      // 4. Invalidate profile cache so ProtectedRoute sees onboarding_completed = true
      await refetchProfile();

      toast.success("הכל מוכן! ברוכים הבאים.");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "משהו השתבש.");
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 2;

  return (
    <div
      dir="rtl"
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

        {/* Step 1: Business Type */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                מה מניע את העסק שלך?
              </h1>
              <p className="mt-1 text-muted-foreground">
                נתאים את חווית ה-CRM בהתאם.
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
                    {type.id === "other" && businessType === "other" && (
                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        <Input
                          placeholder="למשל: סטודיו לצילום, מפיק אירועים..."
                          value={customWorkflow}
                          onChange={(e) => setCustomWorkflow(e.target.value)}
                          className="text-sm"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                  {businessType === type.id && (
                    <Check className="absolute start-4 top-4 h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>

            <Button
              className="w-full"
              disabled={
                !businessType ||
                (businessType === "other" && !customWorkflow.trim())
              }
              onClick={() => setStep(2)}
            >
              המשך <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Profile Info */}
        {step === 2 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>ספר לנו על עצמך</CardTitle>
              <CardDescription>
                זה עוזר להתאים אישית את סביבת העבודה שלך.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">השם שלך</Label>
                <Input
                  id="displayName"
                  placeholder="ישראל ישראלי"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">שם העסק</Label>
                <Input
                  id="businessName"
                  placeholder="המספרה של ישראל"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ArrowRight className="h-4 w-4" /> חזרה
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
                      בואו נתחיל <ArrowLeft className="h-4 w-4" />
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
