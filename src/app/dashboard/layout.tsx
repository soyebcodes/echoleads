import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen md:h-screen bg-background text-foreground md:overflow-hidden">
      <Sidebar name={profile?.name || "there"} avatarUrl={profile?.avatar_url ?? null} />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-end gap-2 border-b border-border bg-background/80 pl-16 pr-4 backdrop-blur md:static md:pl-6 md:pr-6">
          <ThemeToggle />
        </header>
        <main className="flex-1 md:overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
