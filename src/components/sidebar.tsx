"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Radar, Users, Settings, LogOut, Menu, X } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Brand } from "@/components/brand";

const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Radar },
  { label: "Leads", href: "/dashboard/leads", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const pathname = usePathname();
  const initial = name[0]?.toUpperCase() ?? "U";
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="fixed left-3 top-3.5 z-40 grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted-foreground shadow-soft transition-colors hover:text-foreground md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile scrim */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-[17rem] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 md:static md:z-auto md:w-64 md:max-w-none md:flex-shrink-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-sidebar-border">
          <Brand href="/" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="grid h-8 w-8 place-items-center rounded-md text-sidebar-muted transition-colors hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-muted">Workspace</p>
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ember bg-cover bg-center text-xs font-semibold text-ember-foreground"
              style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
              aria-hidden="true"
            >
              {avatarUrl ? null : initial}
            </div>
            <span className="text-xs text-sidebar-foreground truncate flex-1">{name}</span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4 text-sidebar-muted" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
