import AppLayout from "@/components/AppLayout";

const Dashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
    <p className="mt-1 text-muted-foreground">Your day at a glance.</p>
  </div>
);

export default function Index() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}
