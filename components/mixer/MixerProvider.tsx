"use client";

import { createContext, useContext, useEffect } from "react";
import { createEngine } from "@/lib/audio/engine";
import { LAYERS, type LayerMeta } from "@/lib/audio/layers";
import { useMixerStore } from "@/lib/audio/store";

// One engine for the whole app, created lazily on the client.
let engine: ReturnType<typeof createEngine> | null = null;
const getEngine = () => (engine ??= createEngine());

// The layers to show, in order. The layout reads `ambient_layers` on the server
// and passes the merged list down, so the server HTML and the first client
// render agree; it falls back to the built-in list.
const CatalogueContext = createContext<readonly LayerMeta[]>(LAYERS);
export const useCatalogue = () => useContext(CatalogueContext);

// Owns the mixer's side effects: restoring saved levels (on the client only,
// after mount), and turning the store's `playing` / levels into real audio.
// Mounted once in the app layout, so ambient sound keeps playing while you
// move between pages.
export default function MixerProvider({
  catalogue = LAYERS,
  children,
}: {
  catalogue?: readonly LayerMeta[];
  children: React.ReactNode;
}) {
  const playing = useMixerStore((s) => s.playing);
  const settings = useMixerStore((s) => s.settings);

  useEffect(() => {
    void Promise.resolve(useMixerStore.persist.rehydrate());
    // Dev only: offline renders that prove each layer makes sound (see
    // lib/audio/measure.ts). Compiled out of production builds.
    if (process.env.NODE_ENV !== "production") {
      void import("@/lib/audio/measure").then((m) => {
        (window as unknown as { __fyAudioTools?: unknown }).__fyAudioTools = {
          measureLayer: m.measureLayer,
          store: useMixerStore,
        };
      });
    }
    return () => getEngine().halt();
  }, []);

  // Start / stop. `begin` only ever runs after a click (the store's play()).
  useEffect(() => {
    const e = getEngine();
    if (!playing) {
      e.halt();
      return;
    }
    void e.begin(useMixerStore.getState().settings).then((result) => {
      if (result === "blocked" || result === "unsupported") useMixerStore.getState().setProblem(result);
    });
  }, [playing]);

  // Levels, master and mute: ramped smoothly inside the engine.
  useEffect(() => {
    getEngine().apply(settings);
  }, [settings]);

  return <CatalogueContext.Provider value={catalogue}>{children}</CatalogueContext.Provider>;
}
