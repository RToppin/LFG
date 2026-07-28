import { Bell, Bookmark, Compass, Gamepad2, PlusCircle, Settings, Shield, Users } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { auth } from "@/auth";

const nav = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/groups", label: "My Groups", icon: Users },
  { href: "/lfg/new", label: "Create Post", icon: PlusCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/settings/profile", label: "Settings", icon: Settings }
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
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-[var(--muted)] hover:bg-[var(--panel)] hover:text-white"
            >
              <item.icon size={18} aria-hidden />
              {item.label}
            </Link>
          ))}
          {isStaff ? (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-[var(--muted)] hover:bg-[var(--panel)] hover:text-white"
            >
              <Shield size={18} aria-hidden />
              Admin
            </Link>
          ) : null}
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
      <main className="pb-20 md:pb-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[var(--line)] bg-[#0b1018] md:hidden">
        {nav.slice(0, 5).map((item) => (
          <Link key={item.href} href={item.href} className="grid place-items-center gap-1 py-2 text-[0.68rem] font-bold">
            <item.icon size={18} aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
