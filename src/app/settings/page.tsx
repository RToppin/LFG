export const dynamic = "force-dynamic";
import { Platform, ProfileVisibility } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { saveProfile } from "@/app/actions";
import { auth } from "@/auth";
import { ActionForm } from "@/components/ActionForm";
import { PlayStyleChecks } from "@/components/FormControls";
import { PLATFORM_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/db";

type ActionState = { ok: boolean; message: string };

const sections = [
  ["profile", "Profile & Personal Information"],
  ["account", "Account"],
  ["connections", "Login & Connected Accounts"],
  ["security", "Security & Devices"],
  ["notifications", "Notifications & Communications"],
  ["privacy", "Privacy & Permissions"],
  ["blocked", "Blocked Accounts"],
  ["appearance", "Appearance & Accessibility"],
  ["region", "Language & Region"],
  ["content", "Content Preferences"],
  ["billing", "Billing & Subscription"],
  ["activity", "Activity & Data"],
  ["cookies", "Cookie Preferences"],
  ["team", "Team & Organization"],
  ["developer", "Developer Settings"],
  ["support", "Help & Support"],
  ["policies", "Terms & Policies"],
  ["deletion", "Account Deactivation & Deletion"]
] as const;

const timeZones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney"
];

const notificationItems = [
  ["inApp", "In-app notifications"],
  ["email", "Email notifications"],
  ["recommendations", "Recommendations"],
  ["joinRequests", "Join requests"],
  ["groupUpdates", "Group updates"],
  ["expirationReminders", "Expiration reminders"],
  ["productAnnouncements", "Product announcements"]
] as const;

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  async function saveNotificationSettings(_: ActionState, formData: FormData): Promise<ActionState> {
    "use server";
    const current = await auth();
    if (!current?.user) return { ok: false, message: "Sign in to save settings." };
    await prisma.notificationPreference.upsert({
      where: { userId: current.user.id },
      create: {
        userId: current.user.id,
        inApp: formData.get("inApp") === "on",
        email: formData.get("email") === "on",
        recommendations: formData.get("recommendations") === "on",
        joinRequests: formData.get("joinRequests") === "on",
        groupUpdates: formData.get("groupUpdates") === "on",
        expirationReminders: formData.get("expirationReminders") === "on",
        productAnnouncements: formData.get("productAnnouncements") === "on"
      },
      update: {
        inApp: formData.get("inApp") === "on",
        email: formData.get("email") === "on",
        recommendations: formData.get("recommendations") === "on",
        joinRequests: formData.get("joinRequests") === "on",
        groupUpdates: formData.get("groupUpdates") === "on",
        expirationReminders: formData.get("expirationReminders") === "on",
        productAnnouncements: formData.get("productAnnouncements") === "on"
      }
    });
    return { ok: true, message: "Notification preferences saved." };
  }

  const [profile, accounts, blocks, preferences, activeSessions] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.account.findMany({ where: { userId: session.user.id }, orderBy: { provider: "asc" } }),
    prisma.block.count({ where: { blockerId: session.user.id } }),
    prisma.notificationPreference.upsert({ where: { userId: session.user.id }, create: { userId: session.user.id }, update: {} }),
    prisma.session.count({ where: { userId: session.user.id } })
  ]);
  const providers = accounts.map((account) => account.provider).join(", ") || "None connected";
  const languages = profile?.languages.length ? profile.languages : ["English"];

  return (
    <div className="container grid gap-6 py-8">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">ReadyLobby account</p>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="muted">Edit your profile, privacy, notifications, account access, and app preferences.</p>
      </div>

      <div className="settings-form-layout">
        <aside className="settings-rail" aria-label="Settings sections">
          {sections.map(([id, label]) => (
            <a href={`#${id}`} key={id}>
              {label}
            </a>
          ))}
        </aside>

        <div className="settings-form-stack">
          <section className="settings-form-panel" id="profile">
            <div>
              <h2>Profile & Personal Information</h2>
              <p className="muted text-sm">This information shapes how other players see you and how recommendations are matched.</p>
            </div>
            <ActionForm action={saveProfile} className="grid gap-4" submitLabel="Save profile">
              <div className="grid-auto">
                <label className="field">
                  <span>Username</span>
                  <input className="input" name="username" defaultValue={profile?.username ?? ""} required />
                </label>
                <label className="field">
                  <span>Display name</span>
                  <input className="input" name="displayName" defaultValue={profile?.displayName ?? session.user.name ?? ""} required />
                </label>
                <label className="field">
                  <span>Profile photo URL</span>
                  <input className="input" name="avatarPreview" defaultValue={profile?.avatarUrl ?? session.user.image ?? ""} placeholder="Coming soon" readOnly />
                </label>
              </div>
              <label className="field">
                <span>Bio</span>
                <textarea className="input textarea" name="bio" defaultValue={profile?.bio ?? ""} />
              </label>
              <div className="grid-auto">
                <label className="field">
                  <span>Region / Location</span>
                  <input className="input" name="region" defaultValue={profile?.region ?? "United States"} required />
                </label>
                <label className="field">
                  <span>Time zone</span>
                  <select className="input" name="timeZone" defaultValue={profile?.timeZone ?? "America/New_York"} required>
                    {timeZones.map((timeZone) => (
                      <option key={timeZone} value={timeZone}>
                        {timeZone.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Birthday</span>
                  <input className="input" name="birthdayPreview" type="date" readOnly />
                </label>
                <label className="field">
                  <span>Phone number</span>
                  <input className="input" name="phonePreview" placeholder="Add phone verification later" readOnly />
                </label>
              </div>
              <div className="grid-auto">
                <label className="field">
                  <span>Profile visibility</span>
                  <select className="input" name="visibility" defaultValue={profile?.visibility ?? "PUBLIC"}>
                    {Object.values(ProfileVisibility).map((visibility) => (
                      <option key={visibility} value={visibility}>
                        {visibility === "PUBLIC" ? "Public" : visibility === "SIGNED_IN" ? "Signed-in users" : "Group members only"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Typical availability</span>
                  <input className="input" name="availability" defaultValue={profile?.availability ?? ""} placeholder="Weeknights after 8 PM" />
                </label>
              </div>
              {languages.map((language) => (
                <input key={language} name="languages" type="hidden" value={language} />
              ))}
              <fieldset className="grid gap-3">
                <legend className="label">Platforms</legend>
                <div className="grid-auto">
                  {Object.values(Platform).map((platform) => (
                    <label className="option-check" key={platform}>
                      <input
                        defaultChecked={(profile?.platforms.length ? profile.platforms : ["PC"]).includes(platform)}
                        name="platforms"
                        type="checkbox"
                        value={platform}
                      />
                      <span className="option-check-box" aria-hidden />
                      <span>{PLATFORM_LABELS[platform]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="grid gap-3">
                <legend className="label">Play styles</legend>
                <PlayStyleChecks selected={profile?.playStyles ?? []} />
              </fieldset>
            </ActionForm>
          </section>

          <section className="settings-form-panel" id="account">
            <FormPanelHeader title="Account" description="Email address, account status, verification, and role details." />
            <div className="grid-auto">
              <label className="field">
                <span>Email address</span>
                <input className="input" defaultValue={session.user.email ?? ""} readOnly />
              </label>
              <label className="field">
                <span>Account role</span>
                <input className="input" defaultValue={session.user.role} readOnly />
              </label>
              <label className="field">
                <span>Account verification</span>
                <select className="input" defaultValue={session.user.email ? "EMAIL_PRESENT" : "NEEDS_EMAIL"} disabled>
                  <option value="EMAIL_PRESENT">Email on file</option>
                  <option value="NEEDS_EMAIL">Needs email</option>
                </select>
              </label>
            </div>
          </section>

          <section className="settings-form-panel" id="connections">
            <FormPanelHeader title="Login & Connected Accounts" description="Manage Discord and future sign-in providers." />
            <div className="grid-auto">
              <label className="field">
                <span>Connected providers</span>
                <input className="input" defaultValue={providers} readOnly />
              </label>
              <label className="field">
                <span>Discord connection</span>
                <select className="input" defaultValue={accounts.some((account) => account.provider === "discord") ? "connected" : "not-connected"} disabled>
                  <option value="connected">Connected</option>
                  <option value="not-connected">Not connected</option>
                </select>
              </label>
            </div>
            <Link className="btn secondary w-fit" href="/settings/connections">
              Manage connections
            </Link>
          </section>

          <section className="settings-form-panel" id="security">
            <FormPanelHeader title="Security & Devices" description="Two-factor authentication, active sessions, login history, and signed-in devices." />
            <div className="grid-auto">
              <label className="field">
                <span>Two-factor authentication</span>
                <select className="input" defaultValue="planned" disabled>
                  <option value="planned">Planned</option>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
              <label className="field">
                <span>Active sessions</span>
                <input className="input" defaultValue={activeSessions || "OAuth session"} readOnly />
              </label>
              <label className="field">
                <span>Login history</span>
                <input className="input" defaultValue="Audit logging planned" readOnly />
              </label>
            </div>
          </section>

          <section className="settings-form-panel" id="notifications">
            <FormPanelHeader title="Notifications & Communications" description="Email, in-app, recommendation, and product communication preferences." />
            <ActionForm action={saveNotificationSettings} className="grid gap-4" submitLabel="Save notification settings">
              <div className="grid-auto">
                {notificationItems.map(([name, label]) => (
                  <label className="option-check" key={name}>
                    <input defaultChecked={Boolean(preferences[name])} name={name} type="checkbox" />
                    <span className="option-check-box" aria-hidden />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </ActionForm>
          </section>

          <section className="settings-form-panel" id="privacy">
            <FormPanelHeader title="Privacy & Permissions" description="Profile visibility, data sharing, content visibility, and default permissions." />
            <div className="grid-auto">
              <label className="field">
                <span>Default Discord invite visibility</span>
                <select className="input" defaultValue="APPROVED_MEMBERS" disabled>
                  <option value="APPROVED_MEMBERS">Reveal after approval</option>
                  <option value="PUBLIC">Public on posts</option>
                </select>
              </label>
              <label className="field">
                <span>Data sharing</span>
                <select className="input" defaultValue="minimal" disabled>
                  <option value="minimal">Essential account data only</option>
                </select>
              </label>
            </div>
          </section>

          <section className="settings-form-panel" id="blocked">
            <FormPanelHeader title="Blocked Accounts" description="Review and manage blocked users or organizations." />
            <div className="grid-auto">
              <label className="field">
                <span>Blocked accounts</span>
                <input className="input" defaultValue={blocks} readOnly />
              </label>
            </div>
            <Link className="btn secondary w-fit" href="/settings/privacy">
              Manage blocked accounts
            </Link>
          </section>

          <section className="settings-form-panel" id="appearance">
            <FormPanelHeader title="Appearance & Accessibility" description="Light or dark mode, text size, contrast, reduced motion, and keyboard navigation." />
            <div className="grid-auto">
              <label className="field"><span>Theme</span><select className="input" defaultValue="dark" disabled><option>Dark</option><option>System</option><option>Light</option></select></label>
              <label className="field"><span>Text size</span><select className="input" defaultValue="default" disabled><option value="default">Default</option><option value="large">Large</option></select></label>
              <label className="field"><span>Reduced motion</span><select className="input" defaultValue="system" disabled><option value="system">Use system setting</option><option value="on">On</option><option value="off">Off</option></select></label>
            </div>
          </section>

          <section className="settings-form-panel" id="region">
            <FormPanelHeader title="Language & Region" description="Language, time zone, currency, and date or time formats." />
            <div className="grid-auto">
              <label className="field"><span>Language</span><input className="input" defaultValue={languages.join(", ")} readOnly /></label>
              <label className="field"><span>Currency</span><select className="input" defaultValue="USD" disabled><option value="USD">USD</option></select></label>
              <label className="field"><span>Date format</span><select className="input" defaultValue="US" disabled><option value="US">Month Day, Year</option></select></label>
            </div>
          </section>

          <SimpleSettingsPanel id="content" title="Content Preferences" description="Control recommendations, personalization, and displayed content." fields={["Recommendations: On", "Personalization: Based on games and play styles", "Displayed content: Approved games only"]} />
          <SimpleSettingsPanel id="billing" title="Billing & Subscription" description="Subscription plan, payment methods, billing information, and invoices." fields={["Plan: Free", "Payment method: Not required", "Invoices: None"]} />
          <SimpleSettingsPanel id="activity" title="Activity & Data" description="View account activity, searches, login history, and download your account data." fields={["Account activity: Audit export planned", "Search history: Not stored", "Data download: Planned"]} />
          <SimpleSettingsPanel id="cookies" title="Cookie Preferences" description="Manage analytics, advertising, personalization, and optional cookies." fields={["Required cookies: On", "Analytics cookies: Off", "Advertising cookies: Off"]} />
          <SimpleSettingsPanel id="team" title="Team & Organization" description="Manage team members, roles, invitations, and permissions." fields={["Organization: Personal account", "Team members: None", "Invitations: None"]} />
          <SimpleSettingsPanel id="developer" title="Developer Settings" description="Manage API keys, webhooks, integrations, and developer access." fields={["API keys: Not enabled", "Webhooks: Not enabled", "Developer access: Account owner only"]} />
          <SimpleSettingsPanel id="support" title="Help & Support" description="View FAQs, contact support, provide feedback, or report a problem." fields={["Support channel: Coming soon", "Feedback: In-app reporting", "Problem reports: Moderation queue"]} />
          <SimpleSettingsPanel id="policies" title="Terms & Policies" description="View the privacy policy, terms of service, and community guidelines." fields={["Privacy policy: Required before public launch", "Terms of service: Required before public launch", "Community guidelines: Required before public launch"]} />
          <section className="settings-form-panel danger" id="deletion">
            <FormPanelHeader title="Account Deactivation & Deletion" description="Temporarily deactivate or permanently delete the account." />
            <div className="grid-auto">
              <label className="field"><span>Deactivate account</span><select className="input" defaultValue="disabled" disabled><option value="disabled">Not requested</option></select></label>
              <label className="field"><span>Delete account</span><input className="input" defaultValue="Manual support flow required" readOnly /></label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FormPanelHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2>{title}</h2>
      <p className="muted text-sm">{description}</p>
    </div>
  );
}

function SimpleSettingsPanel({ id, title, description, fields }: { id: string; title: string; description: string; fields: string[] }) {
  return (
    <section className="settings-form-panel" id={id}>
      <FormPanelHeader title={title} description={description} />
      <div className="grid-auto">
        {fields.map((field) => {
          const [label, value] = field.split(": ");
          return (
            <label className="field" key={field}>
              <span>{label}</span>
              <input className="input" defaultValue={value} readOnly />
            </label>
          );
        })}
      </div>
    </section>
  );
}
