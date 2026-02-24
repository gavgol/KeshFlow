import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else navigate("/");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Account created! Signing you in...");
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full" dir="rtl">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-primary/60 items-center justify-center p-12">
        {/* Decorative circles */}
        <div className="absolute -top-24 -start-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -end-32 h-[30rem] w-[30rem] rounded-full bg-white/5" />
        <div className="absolute top-1/2 start-1/4 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-md space-y-6 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-primary-foreground leading-tight">
            ברוכים הבאים ל-
            <br />
            Chameleon CRM
          </h1>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            המערכת שמתאימה את עצמה לעסק שלך.
            <br />
            ניהול לקוחות, לידים ויומן — הכל במקום אחד.
          </p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <div className="h-2 w-2 rounded-full bg-primary-foreground/60" />
            <div className="h-2 w-8 rounded-full bg-primary-foreground" />
            <div className="h-2 w-2 rounded-full bg-primary-foreground/60" />
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile-only branding */}
          <div className="text-center lg:hidden space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Chameleon CRM
            </h1>
            <p className="text-sm text-muted-foreground">המערכת שמתאימה את עצמה לעסק שלך</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isLogin ? "כניסה לחשבון" : "יצירת חשבון"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin
                ? "הזן את פרטי ההתחברות שלך כדי להמשיך"
                : "מלא את הפרטים כדי ליצור חשבון חדש"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
                dir="ltr"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading && <Loader2 className="animate-spin me-2 h-4 w-4" />}
              {isLogin ? "התחבר" : "צור חשבון"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            {isLogin ? "אין לך חשבון?" : "כבר יש לך חשבון?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {isLogin ? "הרשמה" : "התחברות"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
