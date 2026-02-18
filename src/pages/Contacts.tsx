import AppLayout from "@/components/AppLayout";

export default function ContactsPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <p className="mt-1 text-muted-foreground">Your rolodex of clients and leads.</p>
      </div>
    </AppLayout>
  );
}
