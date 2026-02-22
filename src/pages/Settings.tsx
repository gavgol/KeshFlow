
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, Link2, Copy, Check, ExternalLink, Upload, ImageIcon, Loader2, Trash2, Code2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function SettingsPage() {
  const { signOut, user } = useAuth();
  const { profile, refetch } = useProfile();
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [businessName, setBusinessName] = useState(profile?.business_name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const logoUrl = (profile as any)?.business_logo_url as string | null;

  const slug = (profile?.business_name ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const bookingUrl = slug
    ? `${window.location.origin}/book/${slug}`
    : null;

  const embedCode = bookingUrl
    ? `<iframe src="${bookingUrl}" width="100%" height="600" frameborder="0" style="border:none;border-radius:12px;"></iframe>`
    : null;

  const copyLink = () => {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success("הקישור הועתק!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyEmbed = () => {
    if (!embedCode) return;
    navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    toast.success("קוד ההטמעה הועתק!");
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        business_name: businessName.trim() || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("הפרופיל נשמר!");
      refetch();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("אנא בחר קובץ תמונה");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי (מקסימום 2MB)");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("deal-photos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("deal-photos")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ business_logo_url: urlData.publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("הלוגו הועלה בהצלחה!");
      refetch();
    } catch (err: any) {
      toast.error(err.message ?? "שגיאה בהעלאת הלוגו");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeLogo = async () => {
    if (!user) return;
    setUploading(true);
    try {
      await supabase
        .from("profiles")
        .update({ business_logo_url: null })
        .eq("user_id", user.id);
      toast.success("הלוגו הוסר");
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">הגדרות</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ניהול החשבון וההעדפות שלך.
          </p>
        </div>

        {/* Profile */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">פרופיל</CardTitle>
            <CardDescription>השם שלך ופרטי העסק.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>השם שלך</Label>
              <Input
                placeholder="ישראל ישראלי"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>שם העסק</Label>
              <Input
                placeholder="הספרייה של ישראל"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <Button onClick={saveProfile} disabled={saving} size="sm">
              {saving ? "שומר..." : "שמור שינויים"}
            </Button>
          </CardContent>
        </Card>

        {/* Business Logo */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              לוגו העסק
            </CardTitle>
            <CardDescription>
              הלוגו יוצג בדף ההזמנה הציבורי שלך.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {logoUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={logoUrl}
                  alt="לוגו העסק"
                  className="h-16 w-16 rounded-xl object-cover border border-border"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "החלף"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={removeLogo}
                    disabled={uploading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-border/60 py-6 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    העלה לוגו
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </CardContent>
        </Card>

        {/* Public Booking Link */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              קישור ההזמנה הציבורי שלך
            </CardTitle>
            <CardDescription>
              שתפו את הקישור עם לקוחות כדי שיוכלו לשלוח פנייה.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookingUrl ? (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                  <span className="flex-1 truncate text-sm font-mono text-primary">
                    {bookingUrl}
                  </span>
                  <button
                    onClick={copyLink}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  פתח תצוגה מקדימה <ExternalLink className="h-3 w-3" />
                </a>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                הגדר שם עסק למעלה כדי ליצור את קישור ההזמנה שלך.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Website Embed */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              שילוב באתר הקיים
            </CardTitle>
            <CardDescription>
              הטמע את טופס ההזמנה שלך באתר WordPress, Wix או כל אתר אחר.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {embedCode ? (
              <>
                <div className="relative rounded-xl border border-border bg-muted/50 p-3">
                  <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-all leading-relaxed">
                    {embedCode}
                  </pre>
                  <button
                    onClick={copyEmbed}
                    className="absolute top-2 end-2 flex h-8 items-center gap-1.5 rounded-lg bg-background border border-border px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
                  >
                    {embedCopied ? (
                      <>
                        <Check className="h-3 w-3 text-success" />
                        הועתק!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        העתק קוד
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  הדבק את הקוד בעורך ה-HTML של האתר שלך כדי להציג את טופס ההזמנה.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                הגדר שם עסק למעלה כדי ליצור את קוד ההטמעה.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sign out */}
        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          התנתק
        </Button>
    </div>
  );
}
