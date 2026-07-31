"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type WebsiteSettings = {
  theme: "dark" | "system";
  density: "comfortable" | "compact";
  reduceMotion: boolean;
};

const STORAGE_KEY = "lfg.website.settings";
const defaults: WebsiteSettings = {
  theme: "dark",
  density: "comfortable",
  reduceMotion: false
};

export function WebsiteSettingsPanel() {
  const [saved, setSaved] = useState(defaults);
  const [draft, setDraft] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        applySettings(defaults);
        return;
      }
      try {
        const parsed = { ...defaults, ...JSON.parse(stored) } as WebsiteSettings;
        setSaved(parsed);
        setDraft(parsed);
        applySettings(parsed);
      } catch {
        applySettings(defaults);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  function update<K extends keyof WebsiteSettings>(key: K, value: WebsiteSettings[K]) {
    setMessage("");
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function cancelChanges() {
    setDraft(saved);
    applySettings(saved);
    setMessage("Changes canceled.");
  }

  function saveChanges() {
    setSaving(true);
    setMessage("");
    window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setSaved(draft);
      applySettings(draft);
      setSaving(false);
      setMessage("Settings saved.");
    }, 650);
  }

  return (
    <div className="grid gap-4">
      <div className="grid-auto">
        <label className="field">
          <span>Color mode</span>
          <select className="input" value={draft.theme} onChange={(event) => update("theme", event.target.value as WebsiteSettings["theme"])}>
            <option value="dark">Dark</option>
            <option value="system">Use device setting</option>
          </select>
        </label>
        <label className="field">
          <span>Layout density</span>
          <select className="input" value={draft.density} onChange={(event) => update("density", event.target.value as WebsiteSettings["density"])}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2">
        <input checked={draft.reduceMotion} onChange={(event) => update("reduceMotion", event.target.checked)} type="checkbox" />
        Reduce interface motion
      </label>
      {dirty ? (
        <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
          <button aria-busy={saving} className="btn" disabled={saving} onClick={saveChanges} type="button">
            {saving ? <><LoaderCircle className="working-spinner" size={16} aria-hidden />Saving...</> : "Save changes"}
          </button>
          <button className="btn secondary" disabled={saving} onClick={cancelChanges} type="button">
            Cancel
          </button>
        </div>
      ) : null}
      {message ? <p className="text-sm font-bold text-[var(--accent)]">{message}</p> : null}
    </div>
  );
}

function applySettings(settings: WebsiteSettings) {
  document.body.dataset.density = settings.density;
  document.body.dataset.motion = settings.reduceMotion ? "reduced" : "full";
  document.body.dataset.theme = settings.theme;
}

