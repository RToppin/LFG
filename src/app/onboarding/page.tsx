export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { saveProfile } from "@/app/actions";
import { auth } from "@/auth";
import { ActionForm } from "@/components/ActionForm";
import { PlatformSelect, PlayStyleChecks, VisibilitySelect } from "@/components/FormControls";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.onboarded) redirect("/dashboard");
  return (
    <div className="container py-8">
      <section className="panel grid gap-5 p-6">
        <div>
          <h1 className="text-3xl font-black">Build your player profile</h1>
          <p className="muted">Required fields get recommendations working; optional fields can be edited later.</p>
        </div>
        <ActionForm action={saveProfile} submitLabel="Finish onboarding">
          <input name="redirectTo" type="hidden" value="/dashboard" />
          <div className="grid-auto">
            <label className="field">
              <span>Username</span>
              <input className="input" name="username" defaultValue={session.user.name?.replace(/\W/g, "") ?? ""} required />
            </label>
            <label className="field">
              <span>Display name</span>
              <input className="input" name="displayName" defaultValue={session.user.name ?? ""} required />
            </label>
          </div>
          <label className="field">
            <span>Bio</span>
            <textarea className="input textarea" name="bio" />
          </label>
          <div className="grid-auto">
            <label className="field">
              <span>Time zone</span>
              <input className="input" name="timeZone" defaultValue="America/New_York" required />
            </label>
            <label className="field">
              <span>Region</span>
              <input className="input" name="region" defaultValue="United States" required />
            </label>
            <label className="field">
              <span>Profile visibility</span>
              <VisibilitySelect />
            </label>
          </div>
          <input name="languages" type="hidden" value="English" />
          <fieldset className="grid gap-3">
            <legend className="label">Primary platform</legend>
            <PlatformSelect name="platforms" />
          </fieldset>
          <fieldset className="grid gap-3">
            <legend className="label">Play styles</legend>
            <PlayStyleChecks />
          </fieldset>
          <label className="field">
            <span>Typical availability</span>
            <input className="input" name="availability" placeholder="Weeknights after 8 PM, Sunday afternoons" />
          </label>
        </ActionForm>
      </section>
    </div>
  );
}
