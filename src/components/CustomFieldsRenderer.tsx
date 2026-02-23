import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomField } from "@/components/CustomFieldsEditor";

interface Props {
  schema: CustomField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export default function CustomFieldsRenderer({ schema, values, onChange }: Props) {
  if (!schema || schema.length === 0) return null;

  const set = (id: string, val: string) => {
    onChange({ ...values, [id]: val });
  };

  return (
    <>
      {schema.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label className="text-sm">
            {field.label}
            {field.required && " *"}
          </Label>

          {field.type === "text" && (
            <Input
              placeholder={field.label}
              value={values[field.id] ?? ""}
              onChange={(e) => set(field.id, e.target.value)}
              required={field.required}
              className="bg-background/80 border-border/60 focus-visible:border-primary"
            />
          )}

          {field.type === "number" && (
            <Input
              type="number"
              placeholder={field.label}
              value={values[field.id] ?? ""}
              onChange={(e) => set(field.id, e.target.value)}
              required={field.required}
              className="bg-background/80 border-border/60 focus-visible:border-primary"
            />
          )}

          {field.type === "select" && (
            <Select
              value={values[field.id] ?? ""}
              onValueChange={(v) => set(field.id, v)}
            >
              <SelectTrigger className="bg-background/80 border-border/60">
                <SelectValue placeholder={`בחר ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </>
  );
}
