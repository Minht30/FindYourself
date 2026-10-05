# Design brief — Stage 2 (Figma design pass)

**Status:** prepared, **not started**. Minh's plan (2026-10-05): finish the core functions, test them by hand, *then* come back for a deep design pass with Figma. Nothing is created in Figma until Minh says so (see "Kickoff").

This file is the hand-over: everything a design session needs so we can start on day one without re-deriving context. Source of truth for tokens stays `docs/DESIGN_SYSTEM.md` and `app/globals.css`; this brief lists *what is open* and *how we work*.

---

## 1. Where design stands today

| Area | State |
|---|---|
| Tokens | Two themes, one token set (Sunny Cafe / Netcafe After Dark), WCAG 2.1 AA verified. `docs/DESIGN_SYSTEM.md`, `app/globals.css`. |
| Shell | Google-Calendar-style: top bar, 4-page rail, week grid, tasks drawer. Functional, deliberately plain. |
| Pixel language (new, Phase 5) | Original **cafe-cat**, coffee-cup tally, square pixel track, hand-made 5x7 digits, `--pix-*` tokens. Sprites are **string grids** rendered as SVG (`components/focus/pixel/`). |
| Focus Mode | Dimmed room, scoped tokens under `[data-focus-surface]`, margins deliberately empty. |
| Scenes | **None yet.** Phase 6 builds the mechanism with placeholder art; real art is Stage 2. |

## 2. Open design items (collected from the decision log)

Deferred on purpose, "after the core works" (Session numbers in `docs/DECISIONS.md`):

1. **Scenes: Monstadt (day) and Liyue (night)**: Minh's direction (S23). *Original* pixel interpretations inspired by the places, not copies of the game's art. See section 3.
2. **Block richness** on the timetable (S7.1): flat rectangles feel simple. Ideas: inner border refraction, category-tinted shadow, spring hover lift, small category glyph; paper feel in Sunny, soft neon inner glow in Netcafe.
3. **Netcafe category palette** (S7.1): current pastel neons are unimpressive; re-tune to richer jewel tones (deeper cyan / magenta / violet), keep the canary yellow thread, keep every chip pair at AA.
4. **Week-grid materiality** (S7.1): soft column dividers, inner shadow tinted to the bg, a tiny grain overlay in Sunny (reduced-motion safe).
5. **Decorated mini-month** (S11): the autumn bands from the v10 mockup (leaves, latte mug, pumpkin, gourd, wheat, berries, acorns). The functional day-picker is a separate, smaller task.
6. **Decoration zones** (S9 / ROADMAP Phase 9): wide empty areas (right of the diary, Focus margins, Chill) stay blank until this brainstorm. Candidates: pixel animations, scenes tied to theme, season or mood.
7. **"Darken the app slightly when a restriction is active"** (PRD 6.6, deferred in S21): needs care with scenes and both themes.
8. **Landing page**: final copy and screenshots (Phase 9); the `design-taste-frontend` skill applies to the landing page, not the product shell.
9. **Empty states** for every page; **reduced-motion** pass for anything new.
10. **Sound design**: the focus chime is synthesized; Minh may want a different voice. Music choice for focus sessions is on the Phase 7 list.

## 3. Scene briefs (starting points, to be shaped together)

**Monstadt (day, Sunny Cafe).** Windy green-blue meadow, dandelion seeds drifting, a windmill turning slowly, soft sky gradient, warm honey light. Mood: fresh, open, a little magical.
**Liyue (night, Netcafe After Dark).** Lantern-lit harbour, red and gold against deep navy, cliffs, water reflections, a few drifting lanterns. Mood: warm glow in the dark, still.

Constraints that carry over from the product:
- **Original art** (inspired by, not copied from, the game).
- Built from **pixel grids + CSS** like the cat so it follows the theme tokens, stays crisp (whole-number scale), and is versionable. A pixel-editor PNG route is also open (see section 5).
- Layered for **parallax** (sky, far, mid, near, small animated bits); every layer respects `prefers-reduced-motion` (static first frame).
- The cat and timer sit **in front**; Focus Mode margins and Chill are the main stages. Contrast of any text over a scene must still hit AA.
- Performance budget: SVG/CSS only, no video, small bundle.

**What already exists (Phase 6, Session 37):** the scene *mechanism* is built, with placeholder cafe-window art. A scene is a `SceneDef` (`components/scene/types.ts`): an ordered list of layers, each `{ id, depth 0..1, node }` where `node` is SVG in a **960 x 540** space (each layer is scaled to the stage with `slice`, with 3 % overscan so parallax never shows an edge). The engine reads the mixer for two numbers it exposes as CSS variables, `--rain` (0..1: the rain slider) and `--glow` (0.4..1: the fire slider), plus per-layer parallax by `depth`. Real art arrives by replacing the two entries in `SCENES` (`components/scene/scenes.tsx`); the rain streaks (`.sc-streak`, thickness and speed follow `--rain`), warm glow (`.sc-glow`) and the CSS keyframes in `globals.css` (`sc-*`) are reusable building blocks, and a layer that uses none of them is fine. Reduced motion: any `sc-*` animation is off and parallax is disabled; a new animated element should follow the same rule. Whatever is drawn must also make sense as a still picture.

## 4. Proposed Figma file structure (to create at kickoff, with Minh's OK)

One file, "FindYourself — Design Stage 2", pages:
1. **Moodboard**: references and the two scene moods (links / screenshots, no copied game art).
2. **Tokens**: both themes' palettes as variables, mirrored from `globals.css` incl. `--pix-*`; contrast table.
3. **Pixel kit**: cat (run / idle / sleep / cheer), cups, digits, tile blocks, at 1x and 2x; the grid conventions.
4. **Scenes**: Monstadt and Liyue: layer breakdown, then composed frames at Focus Mode and Chill sizes.
5. **Screens**: Timetable, Diary, Tasks drawer, Focus, Focus Mode, Chill, in both themes (screenshots from the live app as the baseline, then redesigns beside them).
6. **Decoration zones**: the brainstorm board.
7. **Review**: Minh's comments and decisions; each resolved item links to the commit that implements it.

## 5. How we collaborate (tools verified connected on 2026-10-05)

- **Figma** (signed in as Minh, Full seat on his student team): I can read frames, comments and variables, and write frames and variables back.
- **Canva** (connected): image generation for *reference only*; AI images do not hold a consistent pixel grid.
- **Live app review**: I screenshot the running app (built-in browser / Playwright, both themes, desktop and phone) into Figma frames for markup.
- **Artifacts**: quick interactive previews when a motion idea is easier to feel than to describe.
- **Pixel art route (Minh picks per asset):** (a) *code grids*, which I draw and Minh reviews in Figma and the browser; (b) *pixel editor* (Aseprite / Piskel / Pixelorama), where Minh draws and exports PNG sprite sheets that I import and wire.
- Loop: Minh comments in Figma, I implement, push, screenshot back into the frame, Minh approves or redirects. Decisions go in `docs/DECISIONS.md`.

## 6. Ready-to-go checklist (do before Stage 2 starts)

- [ ] Core phases built and Minh's manual test pass done; bugs triaged.
- [ ] Minh confirms Figma or pixel-editor route, and whether I create the file in his team or he shares one.
- [ ] Minh drops references (links or images; scenes, palette, mood) into the Moodboard page or a Drive folder.
- [ ] Decide the Phase 6 placeholder art is acceptable until then.
- [ ] Freeze the token names (`--pix-*`, `--bg-*`, `--ink-*`, `--accent*`) so Figma variables map 1:1.

## 7. Kickoff

When Minh says go, I will *first* tell him, then create the Figma file in his team (his OK needed: it is a new shared artifact), set up the Tokens and Pixel kit pages from the code, and open the Moodboard for his references. I will not create or write to Figma before that.
