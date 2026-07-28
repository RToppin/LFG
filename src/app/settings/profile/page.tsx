export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { saveProfile } from "@/app/actions";
import { auth } from "@/auth";
import { ActionForm } from "@/components/ActionForm";
import { PlatformSelect, PlayStyleChecks, VisibilitySelect } from "@/components/FormControls";
import { prisma } from "@/lib/db";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  return (
    <div className="container py-8">
      <section className="panel grid gap-5 p-6">
        <h1 className="text-3xl font-black">Profile settings</h1>
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
    </div>
  );
}
