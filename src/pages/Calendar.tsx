import AppLayout from "@/components/AppLayout";

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="mt-1 text-muted-foreground">View your appointments and deals by date.</p>
      </div>
    </AppLayout>
  );
}
