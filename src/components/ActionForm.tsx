"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type ActionState = { ok: boolean; message: string };

export function ActionForm({
  action,
  children,
  className,
  submitLabel = "Save"
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: false, message: "" });
  return (
    <form action={formAction} className={className ?? "grid gap-4"}>
      {children}
      {state.message ? (
        <p className={state.ok ? "text-sm font-bold text-[var(--accent)]" : "text-sm font-bold text-[var(--danger)]"}>
          {state.message}
        </p>
      ) : null}
      <SubmitButton label={submitLabel} />
    </form>
  );
}

export function SubmitButton({ label }: { label: string }) {
  const status = useFormStatus();
  return (
    <button className="btn" disabled={status.pending} type="submit">
      {status.pending ? "Working..." : label}
    </button>
  );
}
