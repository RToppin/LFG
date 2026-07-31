"use client";

import { Bell, Bookmark, Compass, MessageSquare, PlusCircle, Settings, Shield, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavIconName = "bell" | "bookmark" | "compass" | "message" | "plus" | "settings" | "shield" | "users";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
};

const icons = {
  bell: Bell,
  bookmark: Bookmark,
  compass: Compass,
  message: MessageSquare,
  plus: PlusCircle,
  settings: Settings,
  shield: Shield,
  users: Users
} satisfies Record<NavIconName, typeof Bell>;

export function NavLinks({ items, variant = "desktop" }: { items: NavItem[]; variant?: "desktop" | "mobile" }) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = icons[item.icon];
        const className =
          variant === "mobile"
            ? `grid place-items-center gap-1 py-2 text-[0.68rem] font-bold ${active ? "bg-[rgba(45,212,191,0.14)] text-[var(--accent)]" : "text-[var(--muted)]"}`
            : `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold ${
                active
                  ? "bg-[rgba(45,212,191,0.14)] text-white ring-1 ring-[rgba(45,212,191,0.28)]"
                  : "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-white"
              }`;
        return (
          <Link key={item.href} href={item.href} className={className} aria-current={active ? "page" : undefined}>
            <Icon size={18} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/lfg/new") return pathname === href;
  if (href === "/settings") return pathname.startsWith("/settings");
  if (href === "/admin") return pathname.startsWith("/admin");
  return pathname === href || pathname.startsWith(`${href}/`);
}
