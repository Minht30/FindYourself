"use client";

import { createContext, useContext, useEffect } from "react";
import { saveMixerState } from "@/app/(app)/chill/actions";
import { createEngine } from "@/lib/audio/engine";
import { LAYERS, type LayerMeta } from "@/lib/audio/layers";
import { resolveInitial } from "@/lib/audio/resolve";
import { classify, createSaver } from "@/lib/audio/saver";
import { defaultSettings, type MixerSettings } from "@/lib/audio/state";
import { useMixerStore } from "@/lib/audio/store";
import { safeStorage } from "@/lib/safeStorage";

// One engine for the whole app, created lazily on the client.
let engine: ReturnType<typeof createEngine> | null = null;
const getEngine = () => (engine ??= createEngine());

// The layers to show, in order. The layout reads `ambient_layers` on the server
// and passes the merged list down, so the server HTML and the first client
// render agree; it falls back to the built-in list.
const CatalogueContext = createContext<readonly LayerMeta[]>(LAYERS);
export const useCatalogue = () => useContext(CatalogueContext);

// Owns the mixer's side effects: restoring the saved mix (on the client only,
// after mount: the server HTML always shows the defaults, so there is nothing
// to mismatch), saving edits to the account, and turning the store's
// `playing` / levels into real audio. Mounted once in the app layout, so
// ambient sound keeps playing while you move between pages.
//
// `initial` is the mix saved in the account (read on the server), or null.
export default function MixerProvider({
  catalogue = LAYERS,
  initial = null,
  children,
}: {
  catalogue?: readonly LayerMeta[];
  initial?: MixerSettings | null;
  children: React.ReactNode;
}) {
  const playing = useMixerStore((s) => s.playing);
  const settings = useMixerStore((s) => s.settings);

  useEffect(() => {
    const store = useMixerStore;
    // Browsers keep audio locked until a gesture, but remembering levels needs
    // none: nothing here makes a sound.
    const hadLocal = safeStorage.getItem("fy-mixer") !== null;

    const saver = createSaver({
      send: async (s) => classify(await saveMixerState(s)),
      onSaved: (rev) => store.getState().markSaved(rev),
      onStatus: (s) => store.getState().setSaveStatus(s),
    });

    let stopped = false;
    let unsubscribe = () => {};
    void Promise.resolve(store.persist.rehydrate()).then(() => {
      if (stopped) return;
      const s = store.getState();
      const res = resolveInitial({
        local: hadLocal ? { settings: s.settings, pending: s.pending } : null,
        server: initial,
        defaults: defaultSettings(catalogue),
      });
      store.getState().applyResolved(res.settings, res.pending);
      // Edits made on this device that the account does not have yet go up now.
      if (res.pending) saver.queue(res.settings, store.getState().rev);
      // From here on every user edit (a rev bump) is saved after a quiet moment.
      unsubscribe = store.subscribe((next, prev) => {
        if (next.rev !== prev.rev) saver.queue(next.settings, next.rev);
      });
    });

    // Do not wait out the debounce when the tab is hidden or closing, and do
    // not wait out the backoff when the connection is back.
    const onVisibility = () => {
      if (document.hidden) void saver.flush();
      else saver.retryNow();
    };
    const onPageHide = () => void saver.flush();
    const onOnline = () => saver.retryNow();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onOnline);

    // Dev only: offline renders that prove each layer makes sound (see
    // lib/audio/measure.ts). Compiled out of production builds.
    if (process.env.NODE_ENV !== "production") {
      void import("@/lib/audio/measure").then((m) => {
        (window as unknown as { __fyAudioTools?: unknown }).__fyAudioTools = {
          measureLayer: m.measureLayer,
          store: useMixerStore,
          saver,
        };
      });
    }

    return () => {
      stopped = true;
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("online", onOnline);
      void saver.flush();
      getEngine().halt();
    };
    // Mount once: `initial` and `catalogue` describe the page load, and an
    // already-running provider must not re-resolve over the user's edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
