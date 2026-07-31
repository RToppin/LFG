import { Gamepad2 } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { auth } from "@/auth";
import { BackButton } from "@/components/BackButton";
import { NavLinks, type NavItem } from "@/components/NavLinks";

const nav: NavItem[] = [
  { href: "/discover", label: "Discover", icon: "compass" },
  { href: "/groups", label: "My Groups", icon: "users" },
  { href: "/social", label: "Social", icon: "message" },
  { href: "/lfg/new", label: "Create Post", icon: "plus" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/saved", label: "Saved", icon: "bookmark" },
  { href: "/settings", label: "Settings", icon: "settings" }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="desktop-only border-r border-[var(--line)] bg-[#0b1018]/90 p-5">
        <Link href="/" className="mb-8 flex items-center gap-3 text-xl font-black">
          <span className="grid size-10 place-items-center rounded-lg bg-[var(--accent)] text-[#071014]">
            <Gamepad2 size={24} aria-hidden />
          </span>
          LFG
        </Link>
        <nav className="grid gap-1">
          <NavLinks items={isStaff ? nav.concat({ href: "/admin", label: "Admin", icon: "shield" }) : nav} />
        </nav>
        <div className="mt-8 grid gap-3 text-sm">
          {session ? (
            <>
              <Link href={`/profile/${session.user.username ?? session.user.id}`} className="muted">
                {session.user.name ?? "Player"}
              </Link>
              <form action={signOutAction}>
                <button className="btn secondary w-full" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link className="btn" href="/login">
              Sign in
            </Link>
          )}
        </div>
      </aside>
      <main className="pb-20 md:pb-0">
        <BackButton />
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[var(--line)] bg-[#0b1018] md:hidden">
        <NavLinks items={nav.slice(0, 5)} variant="mobile" />
      </nav>
    </div>
  );
}


