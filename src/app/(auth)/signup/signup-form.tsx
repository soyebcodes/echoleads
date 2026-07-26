"use client";

import { useState } from "react";
import { signup } from "@/app/actions/auth";

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
        <input
          id="email" name="email" type="email" required autoComplete="email"
          placeholder="you@example.com"
          className="w-full h-11 rounded-lg border border-border bg-surface px-3.5 text-sm outline-none ring-ember/40 transition-all placeholder:text-muted-foreground focus:border-ember focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
        <input
          id="password" name="password" type="password" required minLength={6} autoComplete="new-password"
          placeholder="Min. 6 characters"
          className="w-full h-11 rounded-lg border border-border bg-surface px-3.5 text-sm outline-none ring-ember/40 transition-all placeholder:text-muted-foreground focus:border-ember focus:ring-2"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full h-11 rounded-lg bg-ember text-ember-foreground font-semibold text-sm shadow-ember transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
