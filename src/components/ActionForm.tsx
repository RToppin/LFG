"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);
  const lastSubmittedData = useRef<FormData | null>(null);

  function captureSubmit(event: FormEvent<HTMLFormElement>) {
    lastSubmittedData.current = new FormData(event.currentTarget);
  }

  useEffect(() => {
    if (state.ok || !state.message || !formRef.current || !lastSubmittedData.current) return;
    restoreFormValues(formRef.current, lastSubmittedData.current);
  }, [state]);

  return (
    <form action={formAction} className={className ?? "grid gap-4"} onSubmit={captureSubmit} ref={formRef}>
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

function restoreFormValues(form: HTMLFormElement, formData: FormData) {
  const valuesByName = new Map<string, string[]>();
  for (const [name, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    valuesByName.set(name, [...(valuesByName.get(name) ?? []), value]);
  }

  for (const field of Array.from(form.elements)) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) continue;
    if (!field.name || (field instanceof HTMLInputElement && field.type === "file")) continue;
    const values = valuesByName.get(field.name) ?? [];

    if (field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio")) {
      field.checked = values.includes(field.value);
    } else if (field instanceof HTMLSelectElement && field.multiple) {
      for (const option of Array.from(field.options)) {
        option.selected = values.includes(option.value);
      }
    } else {
      field.value = values[0] ?? "";
    }

    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

export function SubmitButton({ label }: { label: string }) {
  const status = useFormStatus();
  return (
    <button className="btn" disabled={status.pending} type="submit">
      {status.pending ? "Working..." : label}
    </button>
  );
}
