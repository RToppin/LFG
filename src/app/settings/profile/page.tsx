export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { saveProfile } from "@/app/actions";
import { saveNotificationSettings, savePrivacyDisplaySettings, saveSocialLinks } from "@/app/settings/settings-actions";
import { auth } from "@/auth";
import { ActionForm } from "@/components/ActionForm";
import { PlatformSelect, PlayStyleChecks, VisibilitySelect } from "@/components/FormControls";
import { prisma } from "@/lib/db";
import { SOCIAL_LINK_LABELS, SOCIAL_LINK_OPTIONS } from "@/lib/social-links";

const notificationItems = [
  ["inApp", "In-app notifications"],
  ["email", "Email notifications"],
  ["recommendations", "Recommendation notifications"],
  ["joinRequests", "Join requests"],
  ["groupUpdates", "Group updates"],
  ["expirationReminders", "Expiration reminders"],
  ["productAnnouncements", "Product announcements"]
] as const;

const accountLinks = [
  ["/settings/privacy", "Blocked users"],
  ["/settings/connections", "Connected accounts"],
  ["/settings/games", "Game library"],
  ["/settings/availability", "Availability"]
] as const;

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [profile, preferences, socialLinks] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.notificationPreference.upsert({ where: { userId: session.user.id }, create: { userId: session.user.id }, update: {} }),
    prisma.socialLink.findMany({ where: { userId: session.user.id }, orderBy: { sortOrder: "asc" } })
  ]);

  return (
    <div className="container grid gap-6 py-8">
      <div>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="muted">Profile, notifications, privacy, display, and account preferences.</p>
      </div>

      <section className="panel grid gap-5 p-6">
        <h2 className="text-2xl font-black">Profile</h2>
        <ActionForm action={saveProfile} submitLabel="Save profile">
          <div className="grid-auto">
            <label className="field">
              <span>Username</span>
              <input className="input" name="username" defaultValue={profile?.username ?? ""} required />
            </label>
            <label className="field">
              <span>Display name</span>
              <input className="input" name="displayName" defaultValue={profile?.displayName ?? session.user.name ?? ""} required />
            </label>
          </div>
          <label className="field">
            <span>Bio</span>
            <textarea className="input textarea" name="bio" defaultValue={profile?.bio ?? ""} />
          </label>
          <div className="grid-auto">
            <label className="field">
              <span>Time zone</span>
              <input className="input" name="timeZone" defaultValue={profile?.timeZone ?? "America/New_York"} required />
            </label>
            <label className="field">
              <span>Region</span>
              <input className="input" name="region" defaultValue={profile?.region ?? "United States"} required />
            </label>
            <label className="field">
              <span>Visibility</span>
              <VisibilitySelect defaultValue={profile?.visibility ?? "PUBLIC"} />
            </label>
          </div>
          {(profile?.languages ?? ["English"]).map((language) => (
            <input key={language} name="languages" type="hidden" value={language} />
          ))}
          <fieldset className="grid gap-3">
            <legend className="label">Platforms</legend>
            <PlatformSelect name="platforms" defaultValue={profile?.platforms[0] ?? "PC"} />
          </fieldset>
          <fieldset className="grid gap-3">
            <legend className="label">Play styles</legend>
            <PlayStyleChecks selected={profile?.playStyles ?? []} />
          </fieldset>
          <label className="field">
            <span>Typical availability</span>
            <input className="input" name="availability" defaultValue={profile?.availability ?? ""} />
          </label>
        </ActionForm>
      </section>

      <section className="panel grid gap-5 p-6">
        <h2 className="text-2xl font-black">Notifications</h2>
        <ActionForm action={saveNotificationSettings} submitLabel="Save notifications">
          <div className="grid-auto">
            {notificationItems.map(([name, label]) => (
              <label className="flex items-center gap-2" key={name}>
                <input defaultChecked={Boolean(preferences[name])} name={name} type="checkbox" />
                {label}
              </label>
            ))}
          </div>
        </ActionForm>
      </section>

      <section className="panel grid gap-5 p-6">
        <h2 className="text-2xl font-black">Privacy and display</h2>
        <ActionForm action={savePrivacyDisplaySettings} submitLabel="Save privacy and display">
          <div className="grid-auto">
            <label className="field">
              <span>Profile visibility</span>
              <VisibilitySelect defaultValue={profile?.visibility ?? "PUBLIC"} />
            </label>
            <label className="field">
              <span>Time zone</span>
              <input className="input" name="timeZone" defaultValue={profile?.timeZone ?? "America/New_York"} />
            </label>
            <label className="field">
              <span>Region</span>
              <input className="input" name="region" defaultValue={profile?.region ?? "United States"} />
            </label>
          </div>
          <label className="field">
            <span>Availability summary</span>
            <input className="input" name="availability" defaultValue={profile?.availability ?? ""} />
          </label>
          <label className="flex items-center gap-2">
            <input defaultChecked={profile?.showPastGroups ?? false} name="showPastGroups" type="checkbox" />
            Show past groups on my public profile
          </label>
        </ActionForm>
      </section>

      <section className="panel grid gap-5 p-6">
        <h2 className="text-2xl font-black">Social links</h2>
        <ActionForm action={saveSocialLinks} submitLabel="Save social links">
          <div className="grid gap-3">
            {SOCIAL_LINK_OPTIONS.map((kind) => {
              const saved = socialLinks.find((link) => link.kind === kind);
              return (
                <label className="field" key={kind}>
                  <span>{SOCIAL_LINK_LABELS[kind]}</span>
                  <input name="kind" type="hidden" value={kind} />
                  <input className="input" name="url" defaultValue={saved?.url ?? ""} placeholder="https://" type="url" />
                </label>
              );
            })}
          </div>
        </ActionForm>
      </section>

      <section className="panel grid gap-5 p-6">
        <h2 className="text-2xl font-black">Account controls</h2>
        <div className="grid-auto">
          {accountLinks.map(([href, label]) => (
            <Link className="card p-4 font-black hover:border-[var(--accent)]" href={href} key={href}>
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}