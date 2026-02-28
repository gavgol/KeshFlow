import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
  required?: boolean;
}

const FIELD_TYPE_HINTS: Record<string, string> = {
  text: 'לדוגמה: "כתובת האירוע"',
  number: 'לדוגמה: "מספר אורחים"',
  select: 'לדוגמה: "סוג תספורת"',
};

interface Props {
  fields: CustomField[];
  onSaved: () => void;
}

export default function CustomFieldsEditor({ fields: initialFields, onSaved }: Props) {
  const { user } = useAuth();
  const [fields, setFields] = useState<CustomField[]>(initialFields);
  const [saving, setSaving] = useState(false);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", type: "text", options: [], required: false },
    ]);
  };

  const updateField = (id: string, patch: Partial<CustomField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSave = async () => {
    if (!user) return;
    for (const f of fields) {
      if (!f.label.trim()) { toast.error("כל שדה חייב לכלול שם"); return; }
      if (f.type === "select" && (!f.options || f.options.filter(Boolean).length < 2)) {
        toast.error(`שדה "${f.label}" מסוג בחירה חייב לכלול לפחות 2 אפשרויות`);
        return;
      }
    }
    setSaving(true);
    const cleaned = fields.map((f) => ({
      id: f.id,
      label: f.label.trim(),
      type: f.type,
      required: f.required ?? false,
      ...(f.type === "select" ? { options: (f.options ?? []).filter(Boolean) } : {}),
    }));

    const { error } = await supabase
      .from("profiles")
      .update({ custom_fields_schema: cleaned as unknown as import("@/integrations/supabase/types").Json })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) { toast.error(error.message); }
    else { toast.success("שדות מותאמים נשמרו!"); onSaved(); }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          שדות מותאמים אישית
        </CardTitle>
        <CardDescription>
          הוסף שדות ייחודיים לעסק שלך — הם יופיעו בטופס ההזמנה ובעסקאות חדשות.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            לחץ "הוסף שדה" כדי להתחיל.
          </p>
        )}

        {fields.map((field, idx) => (
          <div key={field.id} className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <span className="text-xs text-muted-foreground font-medium">שדה {idx + 1}</span>
              <div className="flex-1" />
              <button onClick={() => removeField(field.id)} className="text-destructive/70 hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">שם השדה</Label>
                <Input
                  placeholder="לדוגמה: סוג תספורת"
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">סוג</Label>
                <Select
                  value={field.type}
                  onValueChange={(v) =>
                    updateField(field.id, {
                      type: v as CustomField["type"],
                      options: v === "select" ? (field.options?.length ? field.options : ["", ""]) : [],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">טקסט</SelectItem>
                    <SelectItem value="number">מספר</SelectItem>
                    <SelectItem value="select">בחירה מרשימה</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {FIELD_TYPE_HINTS[field.type]}
                </p>
              </div>
            </div>

            {field.type === "select" && (
              <div className="space-y-2">
                <Label className="text-xs">אפשרויות (אחת בכל שורה)</Label>
                {(field.options ?? []).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <Input
                      placeholder={`אפשרות ${oi + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...(field.options ?? [])];
                        newOpts[oi] = e.target.value;
                        updateField(field.id, { options: newOpts });
                      }}
                      className="flex-1"
                    />
                    {(field.options ?? []).length > 2 && (
                      <button
                        onClick={() => {
                          const newOpts = (field.options ?? []).filter((_, i) => i !== oi);
                          updateField(field.id, { options: newOpts });
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateField(field.id, { options: [...(field.options ?? []), ""] })}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 me-1" /> הוסף אפשרות
                </Button>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={field.required ?? false}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                className="rounded"
              />
              שדה חובה
            </label>
          </div>
        ))}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={addField} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> הוסף שדה
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "שומר..." : "שמור שדות"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
