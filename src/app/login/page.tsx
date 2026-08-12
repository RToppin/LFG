export const dynamic = "force-dynamic";
import { Gamepad2 } from "lucide-react";
import { signInWithDevUser, signInWithDiscord } from "@/app/actions";
import { isTestAuthEnabled } from "@/lib/env";

export default function LoginPage() {
  return (
    <div className="container grid min-h-screen place-items-center py-10">
      <section className="panel grid w-full max-w-md gap-5 p-6">
        <div className="grid gap-2 text-center">
          <Gamepad2 className="mx-auto text-[var(--accent)]" size={36} aria-hidden />
          <h1 className="text-3xl font-black">Sign in to ReadyLobby</h1>
          <p className="muted">Use Discord for production or a test account during local development.</p>
        </div>
        {process.env.DISCORD_CLIENT_ID ? (
          <form action={signInWithDiscord}>
            <button className="btn w-full" type="submit">
              Sign in with Discord
            </button>
          </form>
        ) : (
          <p className="rounded-lg border border-[var(--line)] p-3 text-sm text-[var(--muted)]">
            Add Discord OAuth credentials to enable Discord sign-in.
          </p>
        )}
        {isTestAuthEnabled() ? (
          <form action={signInWithDevUser} className="grid gap-3">
            <label className="field">
              <span>Email</span>
              <input className="input" name="email" type="email" defaultValue="alex@example.com" required />
            </label>
            <label className="field">
              <span>Display name</span>
              <input className="input" name="name" defaultValue="Alex" required />
            </label>
            <button className="btn secondary" type="submit">
              Continue with test account
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
