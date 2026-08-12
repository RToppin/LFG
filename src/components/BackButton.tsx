"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const hiddenPaths = new Set(["/", "/dashboard", "/discover", "/groups", "/lfg/new", "/login", "/onboarding", "/notifications", "/saved"]);

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  if (hiddenPaths.has(pathname)) return null;

  function goBack() {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    if (referrer?.origin === window.location.origin && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(parentPath(pathname));
  }

  return (
    <div className="container pt-4 md:pt-5">
      <button aria-label="Back" className="back-button btn secondary" onClick={goBack} title="Back" type="button">
        <ArrowLeft size={24} aria-hidden />
        <span className="sr-only">Back</span>
      </button>
    </div>
  );
}

function parentPath(pathname: string) {
  if (pathname.startsWith("/admin/")) return "/admin";
  if (pathname.startsWith("/groups/")) return "/groups";
  if (pathname.startsWith("/settings/")) return "/settings";
  if (pathname.startsWith("/games/")) return "/games";
  if (pathname.startsWith("/lfg/")) return "/groups";
  if (pathname.startsWith("/profile/")) return "/discover";
  return "/dashboard";
}
