import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <h1 className="text-3xl font-bold tracking-tight">
        Welcome to Chameleon
      </h1>
      <p className="text-muted-foreground">
        Signed in as {user?.email}
      </p>
      <Button variant="outline" onClick={signOut}>
        <LogOut />
        Sign Out
      </Button>
    </div>
  );
};

export default Index;
