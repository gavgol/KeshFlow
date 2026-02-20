import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogOut, Link2, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function SettingsPage() {
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [businessName, setBusinessName] = useState(profile?.business_name ?? "");
  const [saving, setSaving] = useState(false);

  const slug = (profile?.business_name ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const bookingUrl = slug
    ? `${window.location.origin}/book/${slug}`
    : null;

  const copyLink = () => {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
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
    else toast.success("Profile saved!");
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account and preferences.
          </p>
        </div>

        {/* Profile */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Your name and business details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Your Name</Label>
              <Input
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Business Name</Label>
              <Input
                placeholder="John's Barbershop"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <Button onClick={saveProfile} disabled={saving} size="sm">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Public Booking Link */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Your Public Booking Link
            </CardTitle>
            <CardDescription>
              Share this link with clients so they can book a service. New requests land directly in your pipeline!
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
                  Open preview <ExternalLink className="h-3 w-3" />
                </a>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Set a business name above to generate your booking link.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sign out */}
        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}
