"use client";

import { CampaignDurationType, ExperienceLevel, HostingStatus, Platform } from "@prisma/client";
import { Gamepad2, Globe2, Monitor, Smartphone, Tv, Users } from "lucide-react";
import type { ComponentType } from "react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { createLfgPost } from "@/app/actions";
import { ActionForm } from "@/components/ActionForm";
import { ExperienceSelect, PlayStyleChecks } from "@/components/FormControls";
import { GameSelector } from "@/components/GameSelector";
import { DURATION_LABELS, HOSTING_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import type { CatalogGameForSelector } from "@/lib/game-catalog";

const platformIcons = {
  PC: Monitor,
  XBOX: Gamepad2,
  PLAYSTATION: Gamepad2,
  NINTENDO_SWITCH: Gamepad2,
  CROSS_PLATFORM: Globe2,
  OTHER: Smartphone
} satisfies Record<Platform, ComponentType<{ size?: number; "aria-hidden"?: boolean }>>;

const durationOptions = Object.values(CampaignDurationType).filter((duration) => duration !== "CUSTOM_RANGE");
const baseTimeZones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney"
];

const quickOptions = [
  ["flexibleTime", "Flexible time"],
  ["modded", "Modded"],
  ["microphoneRequired", "Microphone required"],
  ["existingWorld", "Existing world"],
  ["autoCloseWhenFull", "Mark full automatically"],
  ["waitlistEnabled", "Enable waitlist"]
] as const;

export function LfgPostForm({ games }: { games: CatalogGameForSelector[] }) {
  const initialGame = games[0];
  const [selectedGame, setSelectedGame] = useState<CatalogGameForSelector | undefined>(initialGame);
  const [title, setTitle] = useState(initialGame?.name ?? "");
  const [platforms, setPlatforms] = useState<Platform[]>(initialGame?.platforms[0]?.platform ? [initialGame.platforms[0].platform] : ["PC"]);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [modded, setModded] = useState(false);
  const deviceTimeZone = useSyncExternalStore(subscribeToNothing, browserTimeZone, defaultTimeZone);
  const timeZoneOptions = useMemo(() => Array.from(new Set([deviceTimeZone, ...baseTimeZones])), [deviceTimeZone]);


  const availablePlatforms = useMemo(() => {
    const values = selectedGame?.platforms.map((entry) => entry.platform) ?? [];
    return values.length ? values : Object.values(Platform);
  }, [selectedGame]);

  function handleGameSelect(game: CatalogGameForSelector) {
    setSelectedGame(game);
    setTitle(game.name);
    const preferred = game.platforms[0]?.platform ?? "PC";
    setPlatforms([preferred]);
  }

  function togglePlatform(platform: Platform) {
    setPlatforms((current) => {
      if (current.includes(platform)) {
        return current.length === 1 ? current : current.filter((value) => value !== platform);
      }
      return [...current, platform];
    });
  }

  return (
    <ActionForm action={createLfgPost} className="grid gap-5" submitLabel="Publish group">
      <GameSelector games={games} onSelect={handleGameSelect} />

      <fieldset className="grid gap-3">
        <legend className="label">Platforms</legend>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {availablePlatforms.map((platform) => {
            const Icon = platformIcons[platform] ?? Tv;
            const checked = platforms.includes(platform);
            return (
              <label
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm font-bold ${
                  checked
                    ? "border-[var(--accent)] bg-[rgba(45,212,191,0.14)] text-white"
                    : "border-[var(--line)] bg-[#0d131c] text-[var(--muted)]"
                }`}
                key={platform}
              >
                <input checked={checked} className="sr-only" name="platforms" onChange={() => togglePlatform(platform)} type="checkbox" value={platform} />
                <Icon size={18} aria-hidden />
                {PLATFORM_LABELS[platform]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid-auto">
        <label className="field">
          <span>Post title</span>
          <input className="input" name="title" onChange={(event) => setTitle(event.target.value)} value={title} />
        </label>
        <label className="field">
          <span>Timezone</span>
          <select className="input" key={deviceTimeZone} name="timeZone" defaultValue={deviceTimeZone}>
            {timeZoneOptions.map((timeZone) => (
              <option key={timeZone} value={timeZone}>
                {timeZone.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Description</span>
        <textarea className="input textarea" name="description" placeholder={`${selectedGame?.name ?? "Valheim"} gaming`} />
      </label>

      <div className="grid-auto">
        <label className="field">
          <span>Campaign duration</span>
          <select className="input" name="durationType" defaultValue={CampaignDurationType.TWO_WEEKS}>
            {durationOptions.map((value) => (
              <option key={value} value={value}>
                {DURATION_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Max players</span>
          <input
            className="input"
            name="maxPlayers"
            type="number"
            min="2"
            max="100"
            onChange={(event) => setMaxPlayers(Math.max(2, Number(event.target.value) || 2))}
            value={maxPlayers}
          />
        </label>
        <label className="field">
          <span>Minimum age</span>
          <input className="input" name="minimumAge" type="number" min="13" max="99" defaultValue="13" />
        </label>
        <label className="field">
          <span>Experience requested</span>
          <ExperienceSelect name="requestedExperience" defaultValue={ExperienceLevel.ANY} />
        </label>
      </div>

      <div className="grid-auto">
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
        <div className="card flex items-center gap-3 p-4">
          <Users size={18} aria-hidden />
          <div>
            <p className="font-black">1/{maxPlayers} players</p>
            <p className="muted text-sm">You are counted as the first member.</p>
          </div>
        </div>
      </div>

      <fieldset className="grid gap-3">
        <legend className="label">Play style</legend>
        <PlayStyleChecks />
      </fieldset>

      <div className="grid-auto">
        {quickOptions.map(([name, label]) => (
          <label className="option-check" key={name}>
            {name === "modded" ? (
              <input checked={modded} name={name} onChange={(event) => setModded(event.target.checked)} type="checkbox" />
            ) : (
              <input name={name} type="checkbox" />
            )}
            <span className="option-check-box" aria-hidden />
            <span>{label}</span>
          </label>
        ))}
      </div>

      {modded ? (
        <label className="field">
          <span>Modpack name</span>
          <input className="input" name="modpackName" />
        </label>
      ) : null}

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
function subscribeToNothing() {
  return () => {};
}

function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || defaultTimeZone();
}

function defaultTimeZone() {
  return "America/New_York";
}

