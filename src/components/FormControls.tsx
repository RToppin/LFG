import {
  CampaignDurationType,
  ExperienceLevel,
  HostingStatus,
  JoinMode,
  Platform,
  ProfileVisibility
} from "@prisma/client";
import { DURATION_LABELS, EXPERIENCE_LABELS, HOSTING_LABELS, PLATFORM_LABELS, PLAY_STYLE_TAGS } from "@/lib/constants";

export function PlatformSelect({ name = "platform", defaultValue }: { name?: string; defaultValue?: string }) {
  return (
    <select className="input" name={name} defaultValue={defaultValue}>
      {Object.values(Platform).map((platform) => (
        <option key={platform} value={platform}>
          {PLATFORM_LABELS[platform]}
        </option>
      ))}
    </select>
  );
}

export function ExperienceSelect({ name = "experience", defaultValue = "ANY" }: { name?: string; defaultValue?: string }) {
  return (
    <select className="input" name={name} defaultValue={defaultValue}>
      {Object.values(ExperienceLevel).map((level) => (
        <option key={level} value={level}>
          {EXPERIENCE_LABELS[level]}
        </option>
      ))}
    </select>
  );
}

export function PlayStyleChecks({ selected = [] }: { selected?: string[] }) {
  return (
    <div className="grid-auto">
      {PLAY_STYLE_TAGS.map((tag) => (
        <label className="option-check text-sm" key={tag}>
          <input defaultChecked={selected.includes(tag)} name="playStyles" type="checkbox" value={tag} />
          <span className="option-check-box" aria-hidden />
          {tag}
        </label>
      ))}
    </div>
  );
}

export function LfgOptionSelects() {
  return (
    <>
      <label className="field">
        <span>Hosting</span>
        <select className="input" name="hostingStatus" defaultValue={HostingStatus.OWNER_HOSTING}>
          {Object.values(HostingStatus).map((value) => (
            <option key={value} value={value}>
              {HOSTING_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Campaign duration</span>
        <select className="input" name="durationType" defaultValue={CampaignDurationType.TWO_WEEKS}>
          {Object.values(CampaignDurationType).map((value) => (
            <option key={value} value={value}>
              {DURATION_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Join mode</span>
        <select className="input" name="joinMode" defaultValue={JoinMode.APPROVAL_REQUIRED}>
          <option value={JoinMode.APPROVAL_REQUIRED}>Approval required</option>
          <option value={JoinMode.OPEN}>Open join</option>
        </select>
      </label>
      <label className="field">
        <span>Experience requested</span>
        <ExperienceSelect name="requestedExperience" />
      </label>
    </>
  );
}

export function VisibilitySelect({ defaultValue = "PUBLIC" }: { defaultValue?: string }) {
  return (
    <select className="input" name="visibility" defaultValue={defaultValue}>
      {Object.values(ProfileVisibility).map((visibility) => (
        <option key={visibility} value={visibility}>
          {visibility === "PUBLIC"
            ? "Public"
            : visibility === "SIGNED_IN"
              ? "Signed-in users"
              : "Group members only"}
        </option>
      ))}
    </select>
  );
}
