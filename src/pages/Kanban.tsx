import AppLayout from "@/components/AppLayout";

export default function KanbanPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">Kanban</h1>
        <p className="mt-1 text-muted-foreground">Manage your deals and pipeline.</p>
      </div>
    </AppLayout>
  );
}
