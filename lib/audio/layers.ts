// The built-in layer catalogue. The database table `ambient_layers` is the
// source of truth for labels, order and default levels (see `mergeCatalogue`);
// this list is what the app falls back to when the table cannot be read, and
// the only place that knows which keys actually have a generator.
//
// `trim` evens out loudness. Every layer was rendered offline at full level
// (dev tool: lib/audio/measure.ts) and scaled so its peaks sit near 0.8 and the
// steady layers land around 0.15-0.2 RMS; sparse layers (keyboard, piano) are
// peak-limited, so they have a lower RMS but sound as present. A slider at 50
// percent therefore means "about as loud as any other layer at 50 percent".

export type LayerKey = "rain" | "fire" | "keyboard" | "cafe" | "piano";

export type LayerMeta = {
  key: LayerKey;
  label: string;
  defaultLevel: number;
  sortOrder: number;
  trim: number;
};

export const LAYERS: readonly LayerMeta[] = [
  { key: "rain", label: "Rain", defaultLevel: 0.6, sortOrder: 1, trim: 1.5 },
  { key: "fire", label: "Fireplace", defaultLevel: 0, sortOrder: 2, trim: 1 },
  { key: "keyboard", label: "Keyboard", defaultLevel: 0.2, sortOrder: 3, trim: 1.4 },
  { key: "cafe", label: "Cafe chatter", defaultLevel: 0.3, sortOrder: 4, trim: 1.45 },
  { key: "piano", label: "Piano", defaultLevel: 0.3, sortOrder: 5, trim: 1.8 },
];

export const LAYER_KEYS: readonly LayerKey[] = LAYERS.map((l) => l.key);

export function isLayerKey(k: unknown): k is LayerKey {
  return typeof k === "string" && (LAYER_KEYS as readonly string[]).includes(k);
}

// A row of `ambient_layers` as the database returns it.
export type LayerRow = {
  key: string;
  label: string;
  kind: string;
  default_level: number | string | null;
  sort_order: number | null;
};

// Rows win for label / order / default level, but only for keys that have a
// generator here: a layer this build cannot play (a future `file` layer, say)
// must not show up as a dead slider. Anything missing or malformed falls back
// to the built-in entry, so a bad row can never empty the mixer.
export function mergeCatalogue(rows: readonly LayerRow[] | null | undefined): LayerMeta[] {
  const byKey = new Map((rows ?? []).filter((r) => r && typeof r.key === "string").map((r) => [r.key, r]));
  const merged = LAYERS.map((base) => {
    const row = byKey.get(base.key);
    if (!row || row.kind !== "synth") return base;
    const level = Number(row.default_level);
    return {
      ...base,
      label: typeof row.label === "string" && row.label.trim() ? row.label.trim().slice(0, 40) : base.label,
      defaultLevel: Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : base.defaultLevel,
      sortOrder: Number.isFinite(row.sort_order) ? (row.sort_order as number) : base.sortOrder,
    };
  });
  return merged.sort((a, b) => a.sortOrder - b.sortOrder);
}
