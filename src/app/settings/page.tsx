export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PendingLink } from "@/components/PendingLink";
import { WebsiteSettingsPanel } from "@/components/WebsiteSettingsPanel";

const sections = [
  { href: "/settings/profile", label: "Profile", blurb: "Update username, display name, region, platform, and profile visibility." },
  { href: "/settings/games", label: "Game library", blurb: "Maintain games, platforms, styles, and matching preferences." },
  { href: "/settings/availability", label: "Availability", blurb: "Add recurring play windows for better recommendations." },
  { href: "/settings/notifications", label: "Notifications", blurb: "Choose which alerts and reminders you want to receive." },
  { href: "/settings/privacy", label: "Privacy", blurb: "Block users and control who can interact with your account." },
  { href: "/settings/connections", label: "Connections", blurb: "Connect or reconnect Discord for group coordination." }
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <div className="container grid gap-6 py-8">
      <div>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="muted mt-2">Tune the website, your profile, notifications, privacy, and connected accounts.</p>
      </div>
      <details className="expand-row" open>
        <summary className="expand-summary">
          <span>
            <span className="block text-lg font-black">General website settings</span>
            <span className="mt-1 block text-sm text-[var(--muted)]">Adjust the local interface preferences for this browser.</span>
          </span>
          <span className="expand-toggle" aria-hidden>
            <span className="expand-plus">+</span>
            <span className="expand-minus">-</span>
          </span>
        </summary>
        <div className="expand-body">
          <WebsiteSettingsPanel />
        </div>
      </details>
      <div className="grid gap-3">
        {sections.map((section) => (
          <details className="expand-row" key={section.href}>
            <summary className="expand-summary">
              <span>
                <span className="block text-lg font-black">{section.label}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">{section.blurb}</span>
              </span>
              <span className="expand-toggle" aria-hidden>
                <span className="expand-plus">+</span>
                <span className="expand-minus">-</span>
              </span>
            </summary>
            <div className="expand-body flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-2xl text-sm text-[var(--muted)]">Open this settings section to make account-level changes.</p>
              <PendingLink className="btn" href={section.href} pendingLabel="Opening settings...">
                Open settings
              </PendingLink>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
