"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radar, Users, Settings, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Brand } from "@/components/brand";
import type { User } from "@supabase/supabase-js";

const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Radar },
  { label: "Leads", href: "/dashboard/leads", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      <div className="h-16 px-5 flex items-center border-b border-sidebar-border">
        <Brand href="/dashboard" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-muted">Workspace</p>
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                active ? "bg-ember-soft text-foreground" : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-ember" />}
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-ember" : "text-sidebar-muted group-hover:text-foreground"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-ember text-xs font-semibold text-ember-foreground">
            {user.email?.[0]?.toUpperCase()}
          </div>
          <span className="text-xs text-sidebar-foreground truncate flex-1">{user.email}</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4 text-sidebar-muted" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
