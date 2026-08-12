"use client";

import { signIn } from "next-auth/react";

export function DiscordSignInButton({ label = "Sign in with Discord" }: { label?: string }) {
  return (
    <button className="btn w-full" onClick={() => signIn("discord", { redirectTo: "/dashboard" })} type="button">
      {label}
    </button>
  );
}
