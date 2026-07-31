"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function PendingActionButton({
  children,
  className = "btn",
  pendingLabel = "Working...",
  type = "submit"
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  type?: "submit" | "button";
}) {
  const { pending } = useFormStatus();
  return (
    <button aria-busy={pending} className={className} disabled={pending} type={type}>
      {pending ? (
        <>
          <LoaderCircle className="working-spinner" size={16} aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
