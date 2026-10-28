"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HorseySvg } from "@/components/HorseySvg";
import { downloadPdf, downloadPng } from "@/lib/exportHorsey";
import {
  ACCENT_SWATCHES,
  ACCESSORIES,
  BODY_SWATCHES,
  decodeHorsey,
  DEFAULT_HORSEY,
  encodeHorsey,
  EYES,
  HAIR_SWATCHES,
  MANE_STYLES,
  MOUTHS,
  PATTERNS,
  randomHorsey,
  sanitizeHorsey,
  SLIDERS,
  TAIL_STYLES,
  type Horsey,
} from "@/lib/horsey";

const DRAFT_KEY = "horsey-maker:draft";
const STABLE_KEY = "horsey-maker:stable";

type Saved = { id: string; savedAt: number; horsey: Horsey };

const LABELS: Record<string, string> = {
  none: "None",
  stripes: "Stripes",
  spots: "Spots",
  patches: "Patches",
  checkers: "Checkers",
  flowy: "Flowy",
  mohawk: "Mohawk",
  poofy: "Poofy",
  bald: "Bald",
  long: "Long",
  fluffy: "Fluffy",
  stubby: "Stubby",
  normal: "Normal",
  googly: "Googly",
  happy: "Happy",
  sleepy: "Sleepy",
  angry: "Angry",
  smile: "Smile",
  toothy: "Toothy",
  tongue: "Tongue out",
  shocked: "Shocked",
  tophat: "Top hat",
  partyhat: "Party hat",
  crown: "Crown",
  shades: "Shades",
  bow: "Bow",
  right: "Right →",
  left: "← Left",
};

function readStorage<T>(key: string, parse: (raw: unknown) => T, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? parse(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage full: saving just won't stick.
  }
}

function initialHorsey(): Horsey {
  const match = window.location.hash.match(/[#&]h=([^&]+)/);
  const shared = match && decodeHorsey(match[1]);
  if (shared) return shared;
  return readStorage(DRAFT_KEY, sanitizeHorsey, DEFAULT_HORSEY);
}

function initialStable(): Saved[] {
  return readStorage(
    STABLE_KEY,
    (raw) =>
      Array.isArray(raw)
        ? raw
            .filter((s) => s && typeof s.id === "string")
            .map((s) => ({ id: s.id, savedAt: Number(s.savedAt) || 0, horsey: sanitizeHorsey(s.horsey) }))
        : [],
    [],
  );
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export default function HorseyMaker() {
  const [horsey, setHorsey] = useState<Horsey>(initialHorsey);
  const [stable, setStable] = useState<Saved[]>(initialStable);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => writeStorage(DRAFT_KEY, horsey), [horsey]);
  useEffect(() => writeStorage(STABLE_KEY, stable), [stable]);

  // A shared link has been loaded into the editor; drop the hash so edits don't look like the original.
  useEffect(() => {
    if (window.location.hash.includes("h=")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const set = <K extends keyof Horsey>(key: K, value: Horsey[K]) => setHorsey((h) => ({ ...h, [key]: value }));

  const flash = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const save = () => {
    const existing = editingId && stable.some((s) => s.id === editingId);
    if (existing) {
      setStable((list) => list.map((s) => (s.id === editingId ? { ...s, savedAt: Date.now(), horsey } : s)));
      flash(`Updated ${horsey.name || "your horsey"} in the stable`);
    } else {
      const id = newId();
      setStable((list) => [{ id, savedAt: Date.now(), horsey }, ...list]);
      setEditingId(id);
      flash(`${horsey.name || "Your horsey"} is in the stable!`);
    }
  };

  const load = (saved: Saved) => {
    setHorsey(saved.horsey);
    setEditingId(saved.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = (saved: Saved) => {
    if (!window.confirm(`Send ${saved.horsey.name || "this horsey"} to the glue factory? (Deletes it.)`)) return;
    setStable((list) => list.filter((s) => s.id !== saved.id));
    if (editingId === saved.id) setEditingId(null);
  };

  const startOver = () => {
    setHorsey(DEFAULT_HORSEY);
    setEditingId(null);
  };

  const exportAs = async (kind: "png" | "pdf") => {
    if (!svgRef.current || busy) return;
    setBusy(kind);
    try {
      if (kind === "png") await downloadPng(svgRef.current, horsey);
      else await downloadPdf(svgRef.current, horsey);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#h=${encodeHorsey(horsey)}`;
    try {
      await navigator.clipboard.writeText(url);
      flash("Link copied! Paste it anywhere to share this horsey.");
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <section className="card flex flex-col gap-4 p-4 sm:p-5 lg:sticky lg:top-4">
          <div className="stage relative flex h-72 items-center justify-center overflow-hidden rounded-2xl sm:h-96">
            <HorseySvg horsey={horsey} svgRef={svgRef} className="relative z-10 h-full w-full p-3" />
          </div>

          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <label className="field">
              <span>Name</span>
              <div className="flex gap-2">
                <input
                  className="input min-w-0 flex-1"
                  value={horsey.name}
                  maxLength={40}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Sir Gallops"
                />
                <button
                  type="button"
                  className="btn btn-ghost px-3"
                  title="Random name"
                  aria-label="Random name"
                  onClick={() => set("name", randomHorsey().name)}
                >
                  🎲
                </button>
              </div>
            </label>
            <label className="field">
              <span>Number</span>
              <input
                className="input"
                value={horsey.number}
                maxLength={3}
                onChange={(e) => set("number", e.target.value)}
                placeholder="7"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-yellow"
              onClick={() => setHorsey((h) => randomHorsey({ name: h.name, number: h.number }))}
            >
              🎲 Randomize
            </button>
            <button type="button" className="btn btn-green" onClick={save}>
              {editingId && stable.some((s) => s.id === editingId) ? "💾 Update in stable" : "💾 Save to stable"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={startOver}>
              ↺ Start over
            </button>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-ink/25 p-3">
            <p className="mb-2 text-sm font-semibold text-ink/70">Send it to the race organizer</p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn btn-pink" disabled={!!busy} onClick={() => exportAs("pdf")}>
                {busy === "pdf" ? "Making PDF…" : "📄 Download PDF"}
              </button>
              <button type="button" className="btn btn-blue" disabled={!!busy} onClick={() => exportAs("png")}>
                {busy === "png" ? "Making PNG…" : "🖼️ PNG"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={copyLink}>
                🔗 Copy link
              </button>
            </div>
          </div>
        </section>

        <section className="card flex flex-col gap-6 p-4 sm:p-5">
          <Group title="Body">
            <ColorField label="Coat color" value={horsey.bodyColor} swatches={BODY_SWATCHES} onChange={(v) => set("bodyColor", v)} />
            <Slider k="bodyLength" value={horsey.bodyLength} onChange={(v) => set("bodyLength", v)} />
            <Slider k="neckLength" value={horsey.neckLength} onChange={(v) => set("neckLength", v)} />
            <Slider k="headSize" value={horsey.headSize} onChange={(v) => set("headSize", v)} />
          </Group>

          <Group title="Legs & hooves">
            <Slider k="legLength" value={horsey.legLength} onChange={(v) => set("legLength", v)} />
            <Slider k="legCount" value={horsey.legCount} onChange={(v) => set("legCount", v)} />
            <ColorField label="Hoof color" value={horsey.hoofColor} swatches={ACCENT_SWATCHES} onChange={(v) => set("hoofColor", v)} />
          </Group>

          <Group title="Pattern">
            <Choice options={PATTERNS} value={horsey.pattern} onChange={(v) => set("pattern", v)} />
            {horsey.pattern !== "none" && (
              <ColorField label="Pattern color" value={horsey.patternColor} swatches={ACCENT_SWATCHES} onChange={(v) => set("patternColor", v)} />
            )}
          </Group>

          <Group title="Hair">
            <ColorField label="Hair color" value={horsey.hairColor} swatches={HAIR_SWATCHES} onChange={(v) => set("hairColor", v)} />
            <Choice label="Mane" options={MANE_STYLES} value={horsey.maneStyle} onChange={(v) => set("maneStyle", v)} />
            <Choice label="Tail" options={TAIL_STYLES} value={horsey.tailStyle} onChange={(v) => set("tailStyle", v)} />
          </Group>

          <Group title="Face">
            <Choice label="Eyes" options={EYES} value={horsey.eyes} onChange={(v) => set("eyes", v)} />
            <Choice label="Mouth" options={MOUTHS} value={horsey.mouth} onChange={(v) => set("mouth", v)} />
          </Group>

          <Group title="Race day">
            <ColorField label="Number cloth" value={horsey.saddleColor} swatches={ACCENT_SWATCHES} onChange={(v) => set("saddleColor", v)} />
            <Choice label="Headwear" options={ACCESSORIES} value={horsey.accessory} onChange={(v) => set("accessory", v)} />
            <Choice label="Facing" options={["right", "left"] as const} value={horsey.facing} onChange={(v) => set("facing", v)} />
          </Group>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-1 font-display text-2xl font-bold">Your stable</h2>
        <p className="mb-4 text-sm text-ink/70">
          Saved in this browser only. Use Download or Copy link to send a horsey to someone else.
        </p>
        {stable.length === 0 ? (
          <div className="card p-6 text-center text-ink/60">No horsies yet. Make one and hit “Save to stable”.</div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {stable.map((saved) => (
              <li key={saved.id} className={`card flex flex-col p-3 ${saved.id === editingId ? "ring-4 ring-sun" : ""}`}>
                <button
                  type="button"
                  className="stage mb-2 flex h-32 items-center justify-center rounded-xl"
                  onClick={() => load(saved)}
                  aria-label={`Edit ${saved.horsey.name}`}
                >
                  <HorseySvg horsey={saved.horsey} className="h-full w-full p-2" />
                </button>
                <p className="truncate font-semibold">
                  {saved.horsey.number && <span className="text-ink/50">#{saved.horsey.number} </span>}
                  {saved.horsey.name || "Unnamed horsey"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="btn btn-ghost flex-1 px-2 py-1 text-sm" onClick={() => load(saved)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost px-2 py-1 text-sm"
                    onClick={() => remove(saved)}
                    aria-label={`Delete ${saved.horsey.name}`}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-200 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="rounded-full border-2 border-ink bg-ink px-5 py-2.5 text-sm font-semibold text-cream shadow-lg">
          {toast}
        </div>
      </div>
    </>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 font-display text-lg font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Slider({ k, value, onChange }: { k: keyof typeof SLIDERS; value: number; onChange: (v: number) => void }) {
  const s = SLIDERS[k];
  const display = k === "legCount" ? String(value) : `${Math.round(value * 100)}%`;
  return (
    <label className="field">
      <span className="flex justify-between">
        {s.label}
        <span className="tabular-nums text-ink/60">{display}</span>
      </span>
      <input
        type="range"
        className="slider"
        min={s.min}
        max={s.max}
        step={s.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="field">
      {label && <span>{label}</span>}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            className={`chip ${value === option ? "chip-on" : ""}`}
            onClick={() => onChange(option)}
          >
            {LABELS[option] ?? option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  swatches,
  onChange,
}: {
  label: string;
  value: string;
  swatches: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {swatches.map((c) => (
          <button
            key={c}
            type="button"
            className={`swatch ${value.toLowerCase() === c ? "swatch-on" : ""}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
            aria-label={`${label} ${c}`}
          />
        ))}
        <label className="swatch swatch-custom" title="Pick any color">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`${label}: custom`}
          />
          <span style={{ background: value }} className="block h-full w-full rounded-full" />
        </label>
      </div>
    </div>
  );
}
