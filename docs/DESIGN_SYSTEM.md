# Design System — FindYourself

Two **modes**, two **regions** each, one token set. Rewritten 2026-10-08 when the painted themes shipped (the old Sunny Cafe and Netcafe After Dark themes are gone). The code is the source of truth; this page says where to look and why things are the way they are.

| | Day | Night |
|---|---|---|
| Region shipped | **Monstadt**: a bright meadow town by the water, cream paper and slate-blue ink | **Nod-Krai**: a frozen bay under an aurora, deep blue glass and a moon-moth |
| Region coming | Liyue (card shown, disabled) | Natlan (card shown, disabled) |
| `<html data-theme>` | `monstadt` | `nodkrai-night` |
| The spirit | a faceless dandelion seed | the moon-moth |
| Session flower | the red fan flower | the frost flower |

**Which one shows.** A person chooses a *mode* (`Day`, `Night`, `Auto`) and, per mode, a *region* (Settings → Appearance; the top bar chip flips day and night). `Auto` follows the clock: night from 18:00 to 06:00 in the person's own time zone. The choice lives on the profile (`theme_mode`, `day_region`, `night_region`) and in two cookies (`fy-theme-pref`, `fy-theme`) so the **server paints the right theme on the first byte**; a small script in the `<head>` corrects a first visit (the server may not know the zone yet) before the first paint. Pure logic: `lib/theme.ts` (the resolver), `lib/themeCookies.ts`, `lib/themeScript.ts` (the head script, tested by running it against the resolver across daylight-saving days). The record of how it was built is in [`THEME_HANDOFF.md`](THEME_HANDOFF.md).

## 1. Design principles

1. **Calm before productivity.** No urgency-red, no shame, no gamified pressure. A missed streak says "Welcome back".
2. **The environment is the product.** A painted scene sits behind every page; the Chill page and Focus Mode bring it to life.
3. **Two moods, one product.** Day and night share layout, tokens and type; they differ in art, colour and spirit.
4. **Motion should breathe.** Slow, low-amplitude, transform and opacity only, and always off when the person asks for less motion.
5. **WCAG 2.1 AA is a floor, not a goal**, and it is *measured*, not assumed (section 8).
6. **Original art, honestly sourced.** The scenes are game-inspired place names with original compositions and a creature drawn from scratch; credits and naming are still an open question (section 11).

## 2. Colour tokens

All tokens live in `app/globals.css`: the **Monstadt** block (also plain `:root`, the default) and the **Nod-Krai** block (`:root[data-theme="nodkrai-night"]`). Component classes read them through Tailwind (`bg-bg-elevated`, `text-ink-secondary`, `border-input`, …), never as raw hex.

| Token | Monstadt (day) | Nod-Krai (night) |
|---|---|---|
| `--bg-base` / `-elevated` / `-overlay` / `-window` / `-alt` | `#F9F4E8` / `#FCF9F0` / `#F7F2E5` / `#F9E3AB` / `#F2F1E7` | `#0A1450` / `#101C5E` / `#0D1856` / `#1A2A72` / `#081043` |
| `--ink-primary` / `-secondary` / `-muted` | `#1E384F` / `#3A5368` / `#42586B` | `#EAF2FF` / `#C2D2F2` / `#A8BAE0` |
| `--accent` / `-soft` / `-strong` | `#F7CF78` / `#F9E3AB` / `#8C5A00` | `#F4D03F` / `#FFE9A0` / `#F4D03F` |
| `--cat-deep` `-meeting` `-learn` `-rest` `-personal` | `#CCDFBD #FDE6B2 #E1D1ED #C3DDF2 #FED6DB` | `#8CC0FF #F4D58A #C3B2F5 #8FE0D8 #F5AFC6` |
| `--cat-ink` (text on those fills and on the accent) | `#1E384F` | `#0A1450` |
| `--success` / `--warning` / `--danger` | `#3A6E2C` / `#855209` / `#A8402C` | `#7FE0B0` / `#F4D03F` / `#FF9E8C` |
| `--border` / `--border-strong` | `rgba(122,98,56,.22)` / `.38` | `rgba(234,242,255,.14)` / `.26` |
| `--border-input` (opaque, form fields) | `#857052` | `#7088CC` |

Also: `--accent-line` (the accent at 60 %), `--cat-dot-*` (the saturated twin of each category for dots and small marks), `--heat-1..3` and `--heat-max` (the diary year map), `--glow`, `--shadow-card`.

Two rules that are easy to forget:

- **The day accent is decorative.** `#F7CF78` is 1.4:1 on the cream, so anything that carries meaning (the timer's arc, the week tile's lit blocks, the focus ring, links) uses `--accent-strong` (`#8C5A00`, 5.3:1) by day. At night they are the same yellow.
- **Text on the accent or a category fill is `--cat-ink`**, never the page ink: at night the page ink is light and so are the fills.

## 3. Typography

One pairing for both themes: **Lora** (display and body; 400 to 700, italic) for words, **Inter** (400 to 600) for the interface, **JetBrains Mono** (400 to 600) for numbers: the timer's digits, timestamps, counters.

| Token | Size | Use |
|---|---|---|
| xs | 0.75 rem | tags, meta |
| sm | 0.875 | small body, sidebar labels |
| base | 1.0 | body |
| lg | 1.125 | card title |
| xl | 1.375 | page section title |
| 2xl / 3xl | 1.75 / 2.5 | diary prompt, page title; the landing hero goes to 3.75 |

Line height 1.55 for body, 1.2 for headings.

## 4. Layout: floating glass over a painting

- **Shell:** a floating top bar, a 280 px sidebar and the page, each a rounded panel inset 12 px from the screen edge, with the painting visible in the gaps (the Figma layout). On a phone the sidebar is a drawer (opaque) and the page is one column.
- **Glass:** panels are see-through over the painting: `bg-glass-panel` (sidebar, week grid, settings card) at **90 %** and `bg-glass-card` (top bar, cards) at **92 %** of `--bg-elevated`, as `color-mix`, never `opacity`, so the text stays solid. Popovers, modals, inputs and the phone drawer stay opaque.
- **Plates:** a title or a line of loose text that would sit straight on the painting gets `.plate` (a glass card), so nothing reads straight off the art.
- **Focus page:** three columns from 1400 px (timer settings | the round timer | this week and recent sessions), two from 1024 px, one on a phone.
- **Chill page:** an open scene. The living painting is the page's backdrop, the header plate carries a **Chill mode** button (full screen), and a spacer shows the scene before the glass sections begin.
- **Public pages** (landing, login, privacy) sit on the flat theme colour; the landing hero has its own light scene.

## 5. The painting and the scenes

- **Wallpaper stage** (`components/scene/WallpaperStage.tsx`, mounted in the app layout): one fixed layer per theme. The server-painted theme's picture loads at once; the other is requested the first time it is shown. A change of theme **crossfades the picture over 1.2 s** (the new one fades in over the old, which is removed afterwards, so there is no dip) while the panels recolour over 300 ms (a temporary `html.theme-fade`; skipped under reduced motion).
- **Painted scenes** (`components/scene/PaintedScene.tsx`): the live version, used by the Chill page (backdrop), Chill mode (full-screen overlay), Focus Mode (under a veil) and, lightly, the landing hero.
  - They are drawn on a **stage**: the painting's own coordinate space, fitted like `background-size: cover` (`lib/scene/stage.ts`), so the moon, beacon, shore lights and aurora stay on their painted spots on every screen shape.
  - **Night:** a drifting aurora, a breathing moon with an orbit ring, 70 twinkling stars and a shooting star every 14 to 26 s, flickering shore lights, a pulsing beacon, water glints, cloud bands, up to 28 snowflakes, four swaying frost flowers, the moon-moth with a dust trail (Chill only).
  - **Day:** clouds, a warm haze and light rays, 11 dandelion seeds, birds, five fan flowers (a stem in two parts that bends, leaves that flutter, heads that spin like pinwheels), leaves blown across in a gust (Chill only).
  - **Wind:** a gust every 8 to 15 s eases the wind up and back (`lib/scene/wind.ts`): sway, spin, snow and rain follow it. Rain streaks follow the mixer's rain level.
  - `variant="focus"` drops the creatures (the timer's spirit is the one that moves); `variant="hero"` is the CSS-only light version; `active={false}` pauses every loop.
- **The Focus-first veil:** while a Focus-first restriction is active, the painting (never the panels) darkens slightly and desaturates (`.wp-veil`, 600 ms), keyed on the header chip, so no panel contrast changes.
- **Focus Mode:** the same scene under a veil of **82 % by day, 70 % at night** (`--fm-veil`), strong enough that its small text keeps 4.5:1 over the brightest part of the painting.
- **Assets:** only WebP (pictures) and SVG (the moth) in `public/assets`, each under 600 KB, the whole folder under 2.5 MB, and every file used by the code (`lib/assets.test.ts`). Originals, sheets and stand-ins live in `design-sources/` (git-ignored). The Monstadt wallpaper is still a 1623 x 640 **stand-in** (soft on large screens).

## 6. The spirit and the flowers

- **Timer ring** (`components/focus/TimerRing.tsx`): a round track, an arc that fills clockwise from 12 o'clock (`--accent-strong`, or `--success` on a break), and the spirit riding the end of the arc, kept upright. The arc and spirit glide with a 1 s linear transition between ticks and jump on a big step (reset, a new phase, a page opened part-way through). Geometry and states are pure (`lib/focus/arc.ts`).
- **Spirit states:** idle (waits at the top, bobs), run (drifts along the arc; the seed turns slowly), pause (hovers, dimmer), sleep (any break: settled, dim, breathing), cheer (a hop and eight sparks when a session ends).
- **Digits:** JetBrains Mono, sized from the ring with container query units.
- **Session flowers:** one per focus session in the round; bloomed for the ones done, a bud (day) or a dimmed bloom (night) for the ones to come.
- **The dandelion seed** is an original vector (24 filaments with tips, a pale core, an aqua halo, a soft shadow so it reads on cream), a stand-in for painted art.

## 7. Motion

| What | How long |
|---|---|
| Theme change: the picture / the panels | 1.2 s crossfade / 300 ms recolour |
| Timer arc and spirit between ticks | 1 s linear |
| Spirit bob / breathe / hop | 2.8 to 6.5 s loops / a 0.9 s hop |
| Scene loops (aurora, clouds, seeds, flowers, snow) | 8 s to 170 s, transform and opacity only |
| Restriction veil | 600 ms |
| Interface (hover, popovers) | 120 to 260 ms |
| Focus Mode enter | 700 ms |

**Reduced motion** is handled three ways, all tested (`lib/reducedMotion.test.ts`): a global net at the end of `globals.css` (no looping, near-zero durations, no smooth scrolling); explicit `animation: none` for the spirit and every `ps-*` scene class (the test fails if a new animated class is not listed, and demands the specificity that makes the rule win); and the scene's loops never start (the first frame is the picture, the canvas and flyers are hidden, the moth is parked).

## 8. Accessibility (WCAG 2.1 AA), and how it is measured

- **Theme tokens:** `lib/contrast.test.ts` reads the real tokens and fails if any text colour is under 4.5:1 on any surface, graphics under 3:1, text on any category or accent fill under 4.5:1, or a form-field border under 3:1 (`--border-input`).
- **Glass over the painting:** `lib/glass.test.ts` composites every text colour over each wallpaper's darkest and brightest parts (measured as displayed at three screen shapes) for panels and cards, and Focus Mode's inks over the veiled painting. Re-measure when a wallpaper changes.
- **Reduced motion:** section 7.
- **Focus ring:** `2px solid var(--accent-strong)` (5.3:1 on the day cream, the bright yellow at night), 2 px offset.
- **Never colour alone:** a category is always a colour **and** a name; a restriction is the chip **and** its countdown; the timer's progress is the ring **and** the digits **and** its label.
- **Decoration is hidden:** the scenes, the spirit and the flower pictures are `aria-hidden`; the flower tally and the ring carry a text label.
- **Semantics:** one `h1` per page, headings in order, landmarks, real links and buttons, a live region for the Appearance changes and for save problems.
- **Audio never starts on its own;** the ambient sound begins on an explicit press.
- **Lighthouse** is run on every page at three screen shapes in both themes (`npm run lighthouse`); the latest scores are in `THEME_HANDOFF.md` (step 9).

## 9. Components

**Shell:** TopBar (clock, Today, timer chip, Focus-first chip, sound, theme chip), Sidebar (pages, month, categories, mini mixer), MiniPlayer, WallpaperStage, ThemeClock, ThemeSync.

**Timetable:** WeekGrid, TimeBlock, BlockPopover, MiniMonth. **Tasks:** TaskBoard, TasksShell, FocusFirstChip. **Diary:** DiaryEditor (Tiptap), MoodPicker, EntryHeatmap.

**Focus:** TimerCard, TimerRing, Spirit, ClockDigits, SessionFlowers, TimerSettings, WeekTile, TimerChip, FocusMode.

**Chill:** ChillStage, PaintedScene (NightScene, DayScene), Immersive, MixerPanel, LayerSlider (line icons), MusicLibrary, Playlists, Picks, Suggestions.

**Settings:** AppearanceCard (mode radio group, region cards), TimeZoneSetting, CategoriesEditor, DeleteAccount. **Motivation:** StreakChip, QuoteCard, WeeklyWinsCard, ProgressRings. **Landing:** the page itself, HeroSpirit.

## 10. Iconography

Lucide for every interface icon (the mixer layers are CloudRain, Flame, Keyboard, Coffee and Piano). Custom art only for: the dandelion seed (vector), the moon-moth (SVG), the two flowers and the painted scenes. The pixel-art sprites (cat, cups, digits, track, mixer icons) were retired on 2026-10-08.

## 11. Open

Higher-resolution wallpapers (both themes; Monstadt is a stand-in) · Liyue and Natlan art · real wind recordings ("Windy meadow", "Snowy night") and a sound settings panel · a second look at the frost flower at icon size · the moth's wings as separate parts for a real flutter · a seed trail behind the spirit in Focus Mode · public names and image credits (the region names are game place names and the moth is inspired by a game creature, drawn from scratch: decide whether to keep or rename them, and list the image sources on the Privacy or a Credits page) · a screen-reader pass over the Appearance card's disabled regions.
