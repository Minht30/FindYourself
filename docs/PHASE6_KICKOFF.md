# Phase 6 kickoff — Cozy environment: ambient mixer

**For the next chat.** Read this, then `docs/DECISIONS.md` (tail: Sessions 23-30), `docs/ROADMAP.md` (Phase 6 + Stage 2) and `docs/DESIGN_BRIEF.md`. Exit criterion: *open the app, rain plays after one click, sliders adjust, the scene animates.*

---

## 0. Where things stand (end of 2026-10-05)

- Phases 1-5 are built and pushed (latest `f6e1bcc`). Phase 5 (Pomodoro + Focus Mode + `focus_sessions` + weekly tile) is verified; Minh confirmed fullscreen Focus Mode works.
- **Still unverified by a human:** how the focus chime *sounds*, a real browser notification, and that the latest Vercel deploy is green (no `gh` CLI here; check the Vercel dashboard).
- **Order of work (Minh):** core functions first -> Minh tests by hand -> **Stage 2 Figma design pass** (`docs/DESIGN_BRIEF.md`). So Phase 6's scene is a **placeholder mechanism**; the real Monstadt / Liyue art waits. **Never create or write to Figma without telling Minh first.**
- Test account: a `+fytest` alias, credentials in the gitignored `.env.test.local` (localhost only; never prod; never echo the password). Its test rows were cleaned up; the account and profile remain.

## 1. Decide first (ask Minh, 2 minutes)

**A. Where does the ambient sound come from?** (recommend the hybrid)

| Option | What | For | Against |
|---|---|---|---|
| **1. Synthesized (recommended)** | Web Audio generates every layer: rain = filtered noise + droplets, fire = brown noise + random crackles, keyboard = soft click bursts, cafe = formant-filtered murmur, piano = sparse generative pentatonic notes. | Original, zero licensing, ~0 KB, no downloads, same approach as the chime, loops forever without a seam | Cafe chatter and piano are the hardest to make convincing |
| 2. CC0 audio files | Download royalty-free loops into the `ambient` bucket | Most realistic | Needs Minh's OK for each download (source, license, size), seamless-loop work, bundle/storage cost |
| 3. Hybrid | Synthesize rain / fire / keyboard, use CC0 files only for cafe + piano | Best sound for the effort | Two code paths |

Either way `ambient_layers` becomes metadata with a `kind` (`synth` or `file`), so the design supports both. I'd start with option 1 for all five, listen, and swap individual layers for files only if Minh dislikes one.

**B. Where does the mixer live?** PRD: a **mini-mixer in the sidebar** (Timetable) plus the full mixer on **/chill**, **master mute always visible in the top bar** (DESIGN_SYSTEM section 7). Confirm, and confirm /chill keeps hiding tasks and timers (already true for the chips).

## 2. Plan: five boxes, one commit each (same protocol as Phase 5)

Each box: build, test, commit, log in `DECISIONS.md`, tick the ROADMAP, push. One chat can do all five (Minh was away for Phase 5; ask whether he is around).

1. **`ambient_layers` seeded.** Migration: `key text pk`, `label`, `kind ('synth'|'file')`, `storage_path` nullable, `default_level`, `sort_order`; RLS select for authenticated (global read-only, no write policy); seed rain / fire / keyboard / cafe / piano; update `docs/ERD.md` (the ERD says file-only). `get_advisors` after.
2. **MixerContext with Web Audio.** `lib/audio/`: one shared `AudioContext` (refactor `lib/focus/chime.ts` onto it so there is a single unlock), per-layer graph `source -> gain -> master -> destination`, levels via `setTargetAtTime` (no clicks), master mute, a pure `levelToGain` curve (perceptual, not linear) + clamps + state sanitizer (all unit-tested), synth generators in their own modules, a zustand `useMixerStore` with `persist` + `skipHydration` exactly like `lib/focus/store.ts`. Audio never autoplays: it starts on the first explicit click.
3. **Mixer panel UI.** `LayerSlider` (native range, `aria-valuetext` "Rain, 60 percent"), `MasterVolume`, always-visible mute in the TopBar, sidebar mini-mixer, a visible **"tap to begin"** state on /chill, layer icons as pixel sprites in the existing `--pix-*` language. Build /chill (currently a stub): mixer + the scene, nothing productivity-related.
4. **`mixer_state` persistence.** Table per the ERD (`user_id pk`, `levels jsonb`, `master_volume`, `current_track_id` stays null until Phase 7, `updated_at`), RLS own-row, a debounced `saveMixerState` server action (upsert, last write wins), restored on load without a hydration mismatch (render defaults first, apply after mount), localStorage as the offline fallback. Reuse the Phase 5 lessons: validate on the server, return specific failure reasons, signed-out means keep local state.
5. **Scene mechanism (placeholder art).** A layered, theme-aware SVG + CSS `Scene`: sky / far / mid / near / small animated bits, subtle parallax, rain animation intensity tied to the rain level, warm window glow, `prefers-reduced-motion` = static first frame. Placeholder = simple Night Study Cafe shapes (PRD 6.7). It must accept a different layer set per theme so Stage 2 can drop Monstadt (day) and Liyue (night) in without touching the engine.

## 3. How to test it (headless-friendly)

- Unit tests (vitest, `npm test`): gain curve, clamps, sanitizers, store rehydrate from corrupt storage, debounce / save-queue logic.
- **Prove each synth layer makes sound without ears:** in Playwright, render 1-2 s of each generator into an `OfflineAudioContext` and assert RMS > threshold and a sensible spectral centroid (rain bright, fire low, keyboard transient-heavy). Also assert the live graph from a debug hook like `window.__fyFocusDebug` (context state, layer count, gain values after a ramp).
- Autoplay: assert nothing plays before the first click, and "tap to begin" is visible.
- Signed in as the test account (localhost): move a slider, reload, state restored; signed out -> the save reports `unauthenticated` (assert the request was sent *and* the reason; remember that signed out the middleware turns the action's POST into a redirect, so a missing result means "not signed in", see Session 26).
- Hydration: load /chill 2-3 times on the same server with a saved mixer state; no console errors.
- Reduced motion (`emulateMedia`), phone width (390), both themes.
- RLS: SQL `begin ... rollback` as `authenticated` with real claims: own row only, `ambient_layers` read-only.
- **Minh's ears (cannot be automated):** does each layer sound right, is the master loud enough, do the layers blend. Collect this once, near the end.

## 4. Gotchas to remember

- After editing `tailwind.config.ts`, **restart `next dev`** and `rm -rf .next`; deleting or adding routes while dev runs can leave a stale webpack cache (`__webpack_modules__ ... is not a function`). The first navigation after a cold start often fails once: just retry.
- Do not run `next build` with dev running; clear `.next` first. A transient Google Fonts fetch failure can fail one build; rerun.
- **Windows shell:** multi-line text with backticks or quotes in `bash` heredocs breaks (a backtick gets executed). Use the Write / Edit tools for docs and code. LF -> CRLF git warnings are normal here.
- File names that differ only by case (`FocusMode.tsx` vs `focusMode.ts`) break TypeScript on Windows.
- Memory rules to keep applying: assert the *actual* failure reason in expected-failure tests; check hydration after 2-3 loads; prefix test data (`FYTEST`) and delete it at the end; commit message ends with the co-author line.
- The TopBar title still shows a hard-coded "Sep 14 – 20, 2026" (pre-existing, unfixed).

## 5. Open items to carry (not blockers)

Phase 4 end-of-day roll and task deadlines are still unexercised on prod. Music choice for focus sessions is a Phase 7 box. Timer settings are per-device (localStorage). Stage 2 design checklist lives in `docs/DESIGN_BRIEF.md`.

## 6. First message for the new chat (paste this)

> Start Phase 6 (cozy environment: ambient mixer) for FindYourself. Read `docs/PHASE6_KICKOFF.md` first, then the tail of `docs/DECISIONS.md` (Sessions 23-30) and `docs/ROADMAP.md`. Repo `Minht30/FindYourself`, prod https://findyourself-mu.vercel.app. Test account credentials are in the gitignored `.env.test.local` (localhost only).
>
> My answers: (A) ambient sound: **[1 synthesized / 2 CC0 files / 3 hybrid]**; (B) mixer location: **[as in the PRD / change: ...]**; I am **[around / away]** for this phase (if away: do all five boxes, one commit each, like Phase 5).
>
> Remember: scene art is a placeholder (real Monstadt / Liyue is the later Figma design stage; do not touch Figma without telling me). Test every function signed in, assert failure reasons, check hydration after 2-3 loads.
