import { createClient } from "@/lib/supabase/server";
import { User, Palette, Bell } from "lucide-react";
import { ProfileAvatarForm } from "./profile-avatar-form";
import { ProfileNameForm } from "./profile-name-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("name, avatar_url").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <div className="max-w-3xl space-y-4">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-border">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ember-soft text-ember">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-display text-lg font-semibold">Account</h2>
              <p className="text-xs text-muted-foreground">Your login details</p>
            </div>
          </div>
          <div className="space-y-4">
            <ProfileAvatarForm name={profile?.name ?? ""} avatarUrl={profile?.avatar_url ?? null} />
            <ProfileNameForm initialName={profile?.name ?? ""} />
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Email</label>
              <input type="email" value={user?.email ?? ""} readOnly className="w-full h-11 rounded-lg border border-border bg-surface px-3.5 text-sm text-muted-foreground" />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">User ID</label>
              <code className="block w-full h-11 rounded-lg border border-border bg-surface px-3.5 py-3 text-xs text-muted-foreground font-mono truncate">{user?.id}</code>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-border">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ember-soft text-ember">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-display text-lg font-semibold">Appearance</h2>
              <p className="text-xs text-muted-foreground">Toggle theme from the top bar</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            EchoLeads supports light and dark modes. Use the sun/moon button in the top-right to switch. Your preference is remembered on this device.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-border">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ember-soft text-ember">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-display text-lg font-semibold">Notifications</h2>
              <p className="text-xs text-muted-foreground">Coming soon — email alerts for new hot leads</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">You'll be able to configure Slack, email, and webhook alerts here.</p>
        </section>
      </div>
    </div>
  );
}
