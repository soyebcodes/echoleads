"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "How it works", href: "#how-it-works" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
];

export function Navbar({ user }: { user?: any }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-border bg-background/85 backdrop-blur-md py-3" : "py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6 md:px-10">
        <Brand />

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((l) => (
            <Link key={l.name} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Link
              href="/dashboard"
              className="hidden lg:inline-flex items-center rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-ember-foreground shadow-ember transition-transform hover:-translate-y-0.5"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden lg:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="hidden lg:inline-flex items-center rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-ember-foreground shadow-ember transition-transform hover:-translate-y-0.5"
              >
                Get started
              </Link>
            </>
          )}
          <button onClick={() => setOpen((v) => !v)} className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="px-6 py-5 flex flex-col gap-3">
            {navLinks.map((l) => (
              <Link key={l.name} href={l.href} onClick={() => setOpen(false)} className="text-base font-medium text-foreground py-2 border-b border-border">
                {l.name}
              </Link>
            ))}
            {user ? (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center justify-center rounded-lg bg-ember px-4 py-3 text-sm font-semibold text-ember-foreground shadow-ember">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="text-base font-medium text-foreground py-2">Sign in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center justify-center rounded-lg bg-ember px-4 py-3 text-sm font-semibold text-ember-foreground shadow-ember">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
