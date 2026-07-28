import { createLfgPost } from "@/app/actions";
import { ActionForm } from "@/components/ActionForm";
import { LfgOptionSelects, PlatformSelect, PlayStyleChecks } from "@/components/FormControls";
import { GameSelector } from "@/components/GameSelector";
import type { CatalogGameForSelector } from "@/lib/game-catalog";

export function LfgPostForm({ games }: { games: CatalogGameForSelector[] }) {
  return (
    <ActionForm action={createLfgPost} className="grid gap-5" submitLabel="Preview and publish">
      <div className="grid-auto">
        <GameSelector games={games} />
        <label className="field">
          <span>Platform</span>
          <PlatformSelect />
        </label>
      </div>
      <label className="field">
        <span>Post title</span>
        <input className="input" name="title" required placeholder="Two-week Minecraft realm, relaxed evenings" />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea className="input textarea" name="description" required placeholder="Describe the vibe, goals, rules, and who will fit well." />
      </label>
      <div className="grid-auto">
        <label className="field">
          <span>Time zone</span>
          <input className="input" name="timeZone" defaultValue="America/New_York" required />
        </label>
        <label className="field">
          <span>Planned start</span>
          <input className="input" name="campaignStartsAt" type="datetime-local" required />
        </label>
        <label className="field">
          <span>Campaign end</span>
          <input className="input" name="campaignEndsAt" type="datetime-local" />
        </label>
      </div>
      <div className="grid-auto">
        <label className="field">
          <span>Players needed</span>
          <input className="input" name="playersNeeded" type="number" min="1" defaultValue="3" required />
        </label>
        <label className="field">
          <span>Current group size</span>
          <input className="input" name="currentGroupSize" type="number" min="1" defaultValue="1" required />
        </label>
        <label className="field">
          <span>Max players</span>
          <input className="input" name="maxPlayers" type="number" min="2" defaultValue="4" required />
        </label>
      </div>
      <LfgOptionSelects />
      <fieldset className="grid gap-3">
        <legend className="label">Play style</legend>
        <PlayStyleChecks />
      </fieldset>
      <div className="grid-auto">
        <label className="field">
          <span>Edition or version</span>
          <input className="input" name="edition" />
        </label>
        <label className="field">
          <span>Server region</span>
          <input className="input" name="serverRegion" />
        </label>
        <label className="field">
          <span>Session length</span>
          <input className="input" name="sessionLength" placeholder="2-3 hours" />
        </label>
      </div>
      <div className="grid-auto">
        <label className="flex items-center gap-2">
          <input name="flexibleTime" type="checkbox" /> Flexible time
        </label>
        <label className="flex items-center gap-2">
          <input name="modded" type="checkbox" /> Modded
        </label>
        <label className="flex items-center gap-2">
          <input name="microphoneRequired" type="checkbox" /> Microphone required
        </label>
        <label className="flex items-center gap-2">
          <input name="existingWorld" type="checkbox" /> Existing world
        </label>
        <label className="flex items-center gap-2">
          <input name="autoCloseWhenFull" type="checkbox" /> Mark full automatically
        </label>
        <label className="flex items-center gap-2">
          <input name="waitlistEnabled" type="checkbox" /> Enable waitlist
        </label>
      </div>
      <div className="grid-auto">
        <label className="field">
          <span>Modpack name</span>
          <input className="input" name="modpackName" />
        </label>
        <label className="field">
          <span>Preferred language</span>
          <input className="input" name="preferredLanguage" defaultValue="English" />
        </label>
        <label className="field">
          <span>Minimum age</span>
          <input className="input" name="minimumAge" type="number" min="13" max="99" />
        </label>
      </div>
      <label className="field">
        <span>Discord invitation URL</span>
        <input className="input" name="discordInvite" placeholder="https://discord.gg/example" />
      </label>
      <label className="field">
        <span>Discord invitation behavior</span>
        <select className="input" name="discordInviteVisibility" defaultValue="APPROVED_MEMBERS">
          <option value="APPROVED_MEMBERS">Reveal after approval</option>
          <option value="PUBLIC">Public on the post</option>
        </select>
      </label>
      <label className="field">
        <span>Server rules</span>
        <textarea className="input textarea" name="serverRules" />
      </label>
      <div className="flex flex-wrap gap-3">
        <button className="btn secondary" name="intent" value="draft" type="submit">
          Save draft
        </button>
      </div>
    </ActionForm>
  );
}
