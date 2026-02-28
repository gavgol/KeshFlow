export interface DefaultStage {
  name: string;
  color: string;
  order: number;
}

export interface BusinessTypeConfig {
  id: string;
  stages: DefaultStage[];
}

export const PIPELINE_STAGE_DEFAULTS: Record<string, DefaultStage[]> = {
  service: [
    { name: "הוזמן", color: "#6366f1", order: 0 },
    { name: "בתהליך", color: "#f59e0b", order: 1 },
    { name: "הושלם", color: "#10b981", order: 2 },
    { name: "שולם", color: "#22c55e", order: 3 },
  ],
  project: [
    { name: "ליד חדש", color: "#94a3b8", order: 0 },
    { name: "הצעת מחיר", color: "#6366f1", order: 1 },
    { name: "בתהליך", color: "#f59e0b", order: 2 },
    { name: "בבדיקה", color: "#8b5cf6", order: 3 },
    { name: "הושלם", color: "#22c55e", order: 4 },
  ],
  sales: [
    { name: "ליד חדש", color: "#94a3b8", order: 0 },
    { name: "נוצר קשר", color: "#6366f1", order: 1 },
    { name: "מתאים", color: "#8b5cf6", order: 2 },
    { name: "משא ומתן", color: "#f59e0b", order: 3 },
    { name: "נסגר בהצלחה", color: "#22c55e", order: 4 },
    { name: "אבד", color: "#ef4444", order: 5 },
  ],
  other: [
    { name: "ליד חדש", color: "#94a3b8", order: 0 },
    { name: "הצעת מחיר", color: "#6366f1", order: 1 },
    { name: "בתהליך", color: "#f59e0b", order: 2 },
    { name: "בבדיקה", color: "#8b5cf6", order: 3 },
    { name: "הושלם", color: "#22c55e", order: 4 },
  ],
};

export function getDefaultStages(businessType: string | null | undefined): DefaultStage[] {
  if (!businessType) return PIPELINE_STAGE_DEFAULTS.other;
  return PIPELINE_STAGE_DEFAULTS[businessType] ?? PIPELINE_STAGE_DEFAULTS.other;
}
