export const PATTERNS = ["none", "stripes", "spots", "patches", "checkers"] as const;
export const MANE_STYLES = ["flowy", "mohawk", "poofy", "bald"] as const;
export const TAIL_STYLES = ["long", "fluffy", "stubby", "none"] as const;
export const EYES = ["normal", "googly", "happy", "sleepy", "angry"] as const;
export const MOUTHS = ["smile", "toothy", "tongue", "shocked"] as const;
export const ACCESSORIES = ["none", "tophat", "partyhat", "crown", "shades", "bow"] as const;

export type Pattern = (typeof PATTERNS)[number];
export type ManeStyle = (typeof MANE_STYLES)[number];
export type TailStyle = (typeof TAIL_STYLES)[number];
export type Eyes = (typeof EYES)[number];
export type Mouth = (typeof MOUTHS)[number];
export type Accessory = (typeof ACCESSORIES)[number];

export type Horsey = {
  name: string;
  number: string;
  bodyColor: string;
  pattern: Pattern;
  patternColor: string;
  hairColor: string;
  maneStyle: ManeStyle;
  tailStyle: TailStyle;
  hoofColor: string;
  saddleColor: string;
  legLength: number;
  legCount: number;
  neckLength: number;
  bodyLength: number;
  headSize: number;
  eyes: Eyes;
  mouth: Mouth;
  accessory: Accessory;
  facing: "right" | "left";
};

export const SLIDERS = {
  legLength: { min: 0.3, max: 3, step: 0.05, label: "Leg length" },
  neckLength: { min: 0.2, max: 3.5, step: 0.05, label: "Neck length" },
  bodyLength: { min: 0.6, max: 2, step: 0.05, label: "Body length" },
  headSize: { min: 0.6, max: 1.8, step: 0.05, label: "Head size" },
  legCount: { min: 1, max: 8, step: 1, label: "Number of legs" },
} as const;

export const DEFAULT_HORSEY: Horsey = {
  name: "Sir Gallops",
  number: "7",
  bodyColor: "#c98a4b",
  pattern: "none",
  patternColor: "#ffffff",
  hairColor: "#3b2516",
  maneStyle: "flowy",
  tailStyle: "long",
  hoofColor: "#2f2f2f",
  saddleColor: "#e63946",
  legLength: 1,
  legCount: 4,
  neckLength: 1,
  bodyLength: 1,
  headSize: 1,
  eyes: "normal",
  mouth: "smile",
  accessory: "none",
  facing: "right",
};

export const BODY_SWATCHES = [
  "#c98a4b", "#8b5a2b", "#3d2b1f", "#f5f0e6", "#9e9e9e", "#1f1f1f",
  "#f4a261", "#ff8fab", "#7bdff2", "#b9fbc0", "#cdb4db", "#ffe66d",
];
export const HAIR_SWATCHES = [
  "#3b2516", "#1f1f1f", "#f5f0e6", "#e9c46a", "#d62828", "#ff70a6",
  "#3a86ff", "#06d6a0", "#8338ec", "#fb5607",
];
export const ACCENT_SWATCHES = [
  "#ffffff", "#1f1f1f", "#e63946", "#f4a261", "#ffd166", "#06d6a0",
  "#118ab2", "#8338ec", "#ff70a6", "#c0c0c0",
];

const FIRST = ["Sir", "Lady", "Captain", "Doctor", "Big", "Lil", "Professor", "Agent", "Baron", "Turbo"];
const LAST = [
  "Gallops", "Neighbourhood", "Hoofington", "Trots-a-Lot", "Clip-Clop", "Mane Event",
  "Haybale", "Spaghetti Legs", "Zoomies", "Sugarcube", "Thunderhooves", "Ponyboy",
];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function between(min: number, max: number, step: number) {
  const steps = Math.round((max - min) / step);
  return Number((min + Math.floor(Math.random() * (steps + 1)) * step).toFixed(2));
}

function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  const sat = 40 + Math.floor(Math.random() * 50);
  const light = 35 + Math.floor(Math.random() * 45);
  return hslToHex(hue, sat, light);
}

function hslToHex(h: number, s: number, l: number) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export function randomHorsey(keep?: Pick<Horsey, "name" | "number">): Horsey {
  const mostlyNormal = Math.random() < 0.6;
  return {
    name: keep?.name ?? `${pick(FIRST)} ${pick(LAST)}`,
    number: keep?.number ?? String(1 + Math.floor(Math.random() * 99)),
    bodyColor: Math.random() < 0.5 ? pick(BODY_SWATCHES) : randomColor(),
    pattern: pick(PATTERNS),
    patternColor: Math.random() < 0.5 ? pick(ACCENT_SWATCHES) : randomColor(),
    hairColor: Math.random() < 0.5 ? pick(HAIR_SWATCHES) : randomColor(),
    maneStyle: pick(MANE_STYLES),
    tailStyle: pick(TAIL_STYLES),
    hoofColor: pick(ACCENT_SWATCHES),
    saddleColor: pick(ACCENT_SWATCHES.slice(2)),
    legLength: between(SLIDERS.legLength.min, SLIDERS.legLength.max, SLIDERS.legLength.step),
    legCount: mostlyNormal ? 4 : between(1, 8, 1),
    neckLength: between(SLIDERS.neckLength.min, SLIDERS.neckLength.max, SLIDERS.neckLength.step),
    bodyLength: between(SLIDERS.bodyLength.min, SLIDERS.bodyLength.max, SLIDERS.bodyLength.step),
    headSize: between(SLIDERS.headSize.min, SLIDERS.headSize.max, SLIDERS.headSize.step),
    eyes: pick(EYES),
    mouth: pick(MOUTHS),
    accessory: pick(ACCESSORIES),
    facing: "right",
  };
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Fills in anything missing or invalid, so old saves and hand-edited links still load. */
export function sanitizeHorsey(input: unknown): Horsey {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const out: Horsey = { ...DEFAULT_HORSEY };

  const str = (key: "name" | "number", max: number) => {
    if (typeof raw[key] === "string") out[key] = (raw[key] as string).slice(0, max);
  };
  const color = (key: "bodyColor" | "patternColor" | "hairColor" | "hoofColor" | "saddleColor") => {
    if (typeof raw[key] === "string" && HEX.test(raw[key] as string)) out[key] = raw[key] as string;
  };
  const choice = <K extends keyof Horsey>(key: K, options: readonly Horsey[K][]) => {
    if (options.includes(raw[key] as Horsey[K])) out[key] = raw[key] as Horsey[K];
  };
  const num = (key: keyof typeof SLIDERS) => {
    const value = Number(raw[key]);
    if (Number.isFinite(value)) {
      out[key] = Math.min(SLIDERS[key].max, Math.max(SLIDERS[key].min, value));
    }
  };

  str("name", 40);
  str("number", 3);
  color("bodyColor");
  color("patternColor");
  color("hairColor");
  color("hoofColor");
  color("saddleColor");
  choice("pattern", PATTERNS);
  choice("maneStyle", MANE_STYLES);
  choice("tailStyle", TAIL_STYLES);
  choice("eyes", EYES);
  choice("mouth", MOUTHS);
  choice("accessory", ACCESSORIES);
  choice("facing", ["right", "left"]);
  num("legLength");
  num("neckLength");
  num("bodyLength");
  num("headSize");
  num("legCount");
  out.legCount = Math.round(out.legCount);
  return out;
}

export function encodeHorsey(horsey: Horsey): string {
  const bytes = new TextEncoder().encode(JSON.stringify(horsey));
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeHorsey(code: string): Horsey | null {
  try {
    const binary = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return sanitizeHorsey(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export function fileSafeName(horsey: Horsey) {
  const base = horsey.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return base || "horsey";
}

/** Black or white, whichever reads better on the given background. */
export function contrastText(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#1f1f1f" : "#ffffff";
}
