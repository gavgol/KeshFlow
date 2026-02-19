import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { ContactAvatar } from "@/components/ContactAvatar";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LayoutDashboard,
  Plus,
  CalendarDays,
  Loader2,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type Stage = Tables<"pipeline_stages">;
type Deal = Tables<"deals"> & { contact_name?: string | null };

/* ─── Deal Card (pure display) ───────────────────────────────────── */
function DealCard({
  deal,
  onClick,
  isDragging = false,
}: {
  deal: Deal;
  onClick?: () => void;
  isDragging?: boolean;
}) {
  const isOverdue = deal.due_date ? isPast(parseISO(deal.due_date)) : false;

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-xl border border-border bg-card p-3.5 space-y-2 shadow-sm transition-all",
        "hover:shadow-md hover:border-primary/30",
        isDragging && "opacity-60 rotate-1 scale-105 shadow-xl"
      )}
    >
      <p className="text-sm font-semibold leading-snug">{deal.title}</p>

      <div className="flex flex-wrap gap-1.5">
        {deal.value != null && (
          <Badge variant="secondary" className="text-[11px] font-medium">
            {deal.value.toLocaleString()} ₪
          </Badge>
        )}
        {deal.due_date && (
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] gap-1",
              isOverdue
                ? "border-destructive/50 text-destructive bg-destructive/5"
                : "text-muted-foreground"
            )}
          >
            {isOverdue && <AlertCircle className="h-3 w-3" />}
            {format(parseISO(deal.due_date), "MMM d")}
          </Badge>
        )}
      </div>

      {deal.contact_name && (
        <div className="flex items-center gap-1.5">
          <ContactAvatar name={deal.contact_name} size="sm" />
          <span className="text-xs text-muted-foreground truncate">
            {deal.contact_name}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Sortable wrapper ────────────────────────────────────────────── */
function SortableDealCard({ deal, onClick }: { deal: Deal; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id, data: { type: "deal", stageId: deal.stage_id } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10")}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute start-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-10 touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
      </div>
      <div className="ps-5">
        <DealCard deal={deal} onClick={onClick} isDragging={isDragging} />
      </div>
    </div>
  );
}

/* ─── Droppable Column ────────────────────────────────────────────── */
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 p-3 min-h-[5rem] rounded-b-2xl transition-colors",
        isOver && "bg-primary/5"
      )}
    >
      {children}
    </div>
  );
}

/* ─── Kanban Column ───────────────────────────────────────────────── */
function KanbanColumn({
  stage,
  deals,
  onAddDeal,
  onDealClick,
}: {
  stage: Stage;
  deals: Deal[];
  onAddDeal: (stageId: string) => void;
  onDealClick: (deal: Deal) => void;
}) {
  return (
    <div className="flex flex-col w-[17rem] shrink-0 rounded-2xl bg-muted/50 border border-border/60">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border/60">
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: stage.color }}
        />
        <span className="font-semibold text-sm truncate flex-1">{stage.name}</span>
        <Badge variant="secondary" className="text-xs tabular-nums shrink-0">
          {deals.length}
        </Badge>
        <button
          onClick={() => onAddDeal(stage.id)}
          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Add deal"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cards area — droppable */}
      <SortableContext
        items={deals.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <DroppableColumn id={stage.id}>
          {deals.map((deal) => (
            <SortableDealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal)}
            />
          ))}
          {deals.length === 0 && (
            <button
              onClick={() => onAddDeal(stage.id)}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 py-4 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors w-full"
            >
              <Plus className="h-3.5 w-3.5" /> Add deal
            </button>
          )}
        </DroppableColumn>
      </SortableContext>
    </div>
  );
}

/* ─── New Deal Sheet ──────────────────────────────────────────────── */
const NO_CONTACT = "__none__";

function NewDealSheet({
  open,
  defaultStageId,
  stages,
  contacts,
  onClose,
  onSaved,
}: {
  open: boolean;
  defaultStageId: string | null;
  stages: Stage[];
  contacts: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stageId, setStageId] = useState(defaultStageId ?? "");
  const [contactId, setContactId] = useState(NO_CONTACT);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStageId(defaultStageId ?? stages[0]?.id ?? "");
      setTitle("");
      setValue("");
      setContactId(NO_CONTACT);
      setDueDate("");
    }
  }, [open, defaultStageId, stages]);

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("deals").insert({
        user_id: user.id,
        title: title.trim(),
        value: value ? parseFloat(value) : null,
        stage_id: stageId || null,
        contact_id: contactId === NO_CONTACT ? null : contactId,
        due_date: dueDate || null,
      });
      if (error) throw error;
      toast.success("Deal created!");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>New Deal</SheetTitle>
          <SheetDescription>Add a deal to your pipeline.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 pb-6">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              placeholder="e.g. Wedding catering"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Value (₪)</Label>
            <Input
              placeholder="5000"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger>
                <SelectValue placeholder="No contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CONTACT}>No contact</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || !title.trim()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Deal"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Main Kanban Page ────────────────────────────────────────────── */
function KanbanContent() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const isRTL = profile?.locale === "he" || profile?.locale === "ar";

  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [newDealSheet, setNewDealSheet] = useState<{
    open: boolean;
    stageId: string | null;
  }>({ open: false, stageId: null });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [stagesRes, dealsRes, contactsRes] = await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("*, pipelines!inner(user_id)")
        .order("display_order"),
      supabase
        .from("deals")
        .select("*, contacts(name)")
        .eq("user_id", user.id)
        .order("created_at"),
      supabase
        .from("contacts")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name"),
    ]);

    const myStages = (stagesRes.data ?? []).filter(
      (s: any) => s.pipelines?.user_id === user.id
    );
    setStages(myStages);

    const enrichedDeals: Deal[] = (dealsRes.data ?? []).map((d: any) => ({
      ...d,
      contact_name: d.contacts?.name ?? null,
    }));
    setDeals(enrichedDeals);
    setContacts(contactsRes.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dealsByStage = (stageId: string) =>
    deals.filter((d) => d.stage_id === stageId);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === String(event.active.id));
    setActiveDeal(deal ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    // Determine target stage: could be a stage column droppable or another deal
    const targetStageId = stages.find((s) => s.id === overId)?.id
      ?? deals.find((d) => d.id === overId)?.stage_id
      ?? null;

    if (!targetStageId) return;

    setDeals((prev) =>
      prev.map((d) =>
        d.id === activeId && d.stage_id !== targetStageId
          ? { ...d, stage_id: targetStageId }
          : d
      )
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // The local state was already updated optimistically in handleDragOver.
    // Find the current stage of the dragged deal.
    const draggedDeal = deals.find((d) => d.id === activeId);
    if (!draggedDeal) return;

    const targetStageId =
      stages.find((s) => s.id === overId)?.id ??
      deals.find((d) => d.id === overId)?.stage_id ??
      draggedDeal.stage_id;

    const { error } = await supabase
      .from("deals")
      .update({ stage_id: targetStageId })
      .eq("id", activeId);

    if (error) {
      toast.error("Failed to move deal");
      fetchData(); // revert to server state
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState
          icon={LayoutDashboard}
          title="No pipeline set up yet"
          description="Complete the onboarding to automatically generate your pipeline stages."
        />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 border-b border-border/60 bg-background">
        <h1 className="text-xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Drag cards between columns to update their stage.
        </p>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex gap-3 overflow-x-auto px-4 py-4 pb-24 md:px-6 md:pb-8"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {stages.map((stage) => (
            <div key={stage.id} style={{ scrollSnapAlign: "start" }}>
              <KanbanColumn
                stage={stage}
                deals={dealsByStage(stage.id)}
                onAddDeal={(stageId) => setNewDealSheet({ open: true, stageId })}
                onDealClick={() => {
                  /* TODO: open deal detail sheet */
                }}
              />
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeDeal && (
            <div className="w-[17rem] ps-5">
              <DealCard deal={activeDeal} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* FAB */}
      <button
        onClick={() =>
          setNewDealSheet({ open: true, stageId: stages[0]?.id ?? null })
        }
        className={cn(
          "fixed bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95 md:bottom-8",
          isRTL ? "left-4 md:left-6" : "right-4 md:right-6"
        )}
        aria-label="Add deal"
      >
        <Plus className="h-6 w-6" />
      </button>

      <NewDealSheet
        open={newDealSheet.open}
        defaultStageId={newDealSheet.stageId}
        stages={stages}
        contacts={contacts}
        onClose={() => setNewDealSheet({ open: false, stageId: null })}
        onSaved={fetchData}
      />
    </div>
  );
}

export default function KanbanPage() {
  return (
    <AppLayout>
      <KanbanContent />
    </AppLayout>
  );
}
