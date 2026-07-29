"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState, type ComponentProps } from "react";

type PendingLinkProps = ComponentProps<typeof Link> & {
  pendingLabel?: string;
};

export function PendingLink({ children, className, pendingLabel = "Opening...", onClick, ...props }: PendingLinkProps) {
  const [pending, setPending] = useState(false);

  return (
    <Link
      {...props}
      aria-busy={pending}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setPending(true);
      }}
    >
      {pending ? (
        <>
          <LoaderCircle className="working-spinner" size={16} aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Link>
  );
}
