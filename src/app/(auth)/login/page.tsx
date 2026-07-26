import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login – EchoLeads",
  description: "Sign in to your EchoLeads account",
};

export default function Page() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-surface border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-ember/20 blur-3xl" aria-hidden />
        <div className="relative"><Brand /></div>
        <div className="relative space-y-3">
          <p className="text-display text-xs font-semibold uppercase tracking-[0.2em] text-ember">Trusted by 400+ founders</p>
          <p className="text-display text-2xl font-semibold tracking-tight leading-snug max-w-md">
            "We closed 3 deals in the first week — leads I never would have found scrolling Reddit myself."
          </p>
          <p className="text-sm text-muted-foreground">— Priya, indie SaaS founder</p>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:justify-end">
          <div className="lg:hidden"><Brand /></div>
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <h1 className="text-display text-2xl font-bold tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground mb-8">Sign in to continue to your dashboard</p>
            <LoginForm />
            <p className="text-center text-sm text-muted-foreground mt-6">
              New to EchoLeads?{" "}
              <Link href="/signup" className="text-ember hover:underline font-medium">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
