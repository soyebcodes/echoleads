"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfileName } from "@/app/actions/profile";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-lg bg-ember px-4 text-sm font-semibold text-ember-foreground shadow-ember transition-colors hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save name"}
    </button>
  );
}

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const [state, formAction] = useActionState(updateProfileName, {});

  return (
    <form action={formAction} className="space-y-2">
      <label htmlFor="name" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Display name
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={initialName}
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <SaveButton />
      </div>
      <p aria-live="polite" className={`text-xs ${state.error ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
        {state.error ?? state.success}
      </p>
    </form>
  );
}
