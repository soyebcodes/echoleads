import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="h-16 flex items-center justify-end gap-2 px-6 border-b border-border bg-background/80 backdrop-blur">
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
