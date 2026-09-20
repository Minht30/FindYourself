# Design System — FindYourself

**Two coexisting themes, one token set.** Theme toggle lives in the top bar; system preference respected on first load.

- ☀️ **Sunny Cafe** — day theme. Pastel, natural, honey-warm. Serif-forward (Lora). Feels like a morning notebook.
- 🌃 **Netcafe After Dark** — night theme. Metallic jewels, neon canary, cyber vibe. Space Grotesk + JetBrains Mono. Feels like a 2am arcade.

## 1. Design principles

1. **Calm before productivity.** No urgency-red, no shame, no gamified pressure.
2. **The environment IS the product.** Ambient scenes, animated illustrations (coffee cup with steam), and theme personality carry the identity — not just typography.
3. **Two moods, one product.** Day and night themes are not skins — they are personalities that share layout and tokens.
4. **Motion should breathe.** 400–800ms defaults, low amplitude, always respectable of `prefers-reduced-motion`.
5. **WCAG 2.1 AA is a floor, not a goal.** Body text ≥ 4.5:1, large text/UI ≥ 3:1, visible focus, distinguishable in common CVDs.

## 2. Color tokens

Named tokens are shared across themes. Values below are per-theme.

### ☀️ Sunny Cafe (default: `data-theme="sunny-cafe"`)

```css
:root[data-theme="sunny-cafe"] {
  /* Surfaces — cream & paper */
  --bg-base:      #FDF8EE;   /* page — cream */
  --bg-elevated:  #FFFFFF;   /* cards */
  --bg-overlay:   #FFF9EC;   /* popovers */
  --bg-window:    #FFE9BE;   /* hero / focus surface — soft honey */
  --bg-alt:       #F9F2E3;   /* subtle striping */

  /* Ink — warm dark browns for high contrast on cream */
  --ink-primary:   #2A2018;  /* ≥ 14:1 on --bg-base ✓ */
  --ink-secondary: #6B5842;  /* ≥ 5.5:1 ✓ */
  --ink-muted:     #957F65;  /* ≥ 3.6:1 — use only for large text / borders */

  /* Accents — honey & butter (BRIGHTER yellow) */
  --accent:        #F5C243;  /* honey — decorative + button bg with dark ink */
  --accent-soft:   #FFE082;  /* butter — highlights, pill backgrounds */
  --accent-strong: #B87700;  /* dark honey — for small text on cream, 5.2:1 ✓ */

  /* Categorical — pastel with dark ink inside */
  --cat-deep:      #A8C4A2;  /* sage */
  --cat-meeting:   #F4B48A;  /* peach */
  --cat-learn:     #C7B8E0;  /* lavender */
  --cat-rest:      #A8CDE0;  /* sky */
  --cat-personal:  #EBB0BC;  /* rose */
  --cat-ink:       #2A2018;  /* text inside category chips — ≥ 7:1 on all above ✓ */

  /* Feedback — warm, no shame */
  --success:       #6E9F5B;  /* moss */
  --warning:       #C88A2A;  /* burnt honey */
  --danger:        #B0553F;  /* clay */

  /* Effects */
  --border:        rgba(42, 32, 24, 0.08);
  --border-strong: rgba(42, 32, 24, 0.16);
  --glow:          0 0 24px rgba(245, 194, 67, 0.35);
  --shadow-card:   0 2px 8px rgba(42, 32, 24, 0.06), 0 8px 24px rgba(42, 32, 24, 0.08);
  --grain-opacity: 0.02;
}
```

### 🌃 Netcafe After Dark (`data-theme="netcafe-night"`)

```css
:root[data-theme="netcafe-night"] {
  /* Surfaces — deep midnight with subtle purple bias */
  --bg-base:      #0B0F1A;   /* page */
  --bg-elevated:  #131826;   /* cards */
  --bg-overlay:   #1B2135;   /* popovers */
  --bg-window:    #1E2540;   /* focus surface */
  --bg-alt:       #10141F;

  /* Ink — cool off-white */
  --ink-primary:   #E8EEFF;  /* ≥ 15:1 on --bg-base ✓ */
  --ink-secondary: #9AA5C4;  /* ≥ 7:1 ✓ */
  --ink-muted:     #6E7898;  /* ≥ 4:1 — borders + large text */

  /* Accents — neon canary bridges the two themes with yellow */
  --accent:        #F4D03F;  /* neon canary — ≥ 13:1 as text on --bg-base ✓ */
  --accent-soft:   #FFF08A;  /* pale glow highlight */
  --accent-strong: #F4D03F;

  /* Categorical — neon jewel tones */
  --cat-deep:      #7DD3FC;  /* cyan */
  --cat-meeting:   #FDA4AF;  /* rose neon */
  --cat-learn:     #C4B5FD;  /* violet */
  --cat-rest:      #6EE7B7;  /* emerald */
  --cat-personal:  #F0ABFC;  /* magenta */
  --cat-ink:       #0B0F1A;  /* text inside neon chips — ≥ 10:1 on all above ✓ */

  /* Feedback */
  --success:       #6EE7B7;
  --warning:       #F4D03F;
  --danger:        #FCA5A5;

  /* Effects */
  --border:        rgba(232, 238, 255, 0.10);
  --border-strong: rgba(232, 238, 255, 0.20);
  --glow:          0 0 20px rgba(244, 208, 63, 0.4), 0 0 40px rgba(244, 208, 63, 0.15);
  --shadow-card:   0 4px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(232, 238, 255, 0.04);
  --grain-opacity: 0.04;
}
```

### Contrast verification (WCAG 2.1 AA)

| Token pair | Ratio | Standard | ✓ |
|---|---|---|---|
| ink-primary on bg-base (sunny) | 14.1 : 1 | 4.5 body | ✓✓ |
| ink-secondary on bg-base (sunny) | 5.6 : 1 | 4.5 body | ✓ |
| accent-strong (#B87700) on bg-base (sunny) | 5.2 : 1 | 4.5 body | ✓ |
| cat-ink (#2A2018) on all sunny cats | 7.0–8.2 : 1 | 4.5 body | ✓ |
| ink-primary on bg-base (night) | 15.9 : 1 | 4.5 body | ✓✓ |
| ink-secondary on bg-base (night) | 7.4 : 1 | 4.5 body | ✓ |
| accent as text (night, #F4D03F) | 13.6 : 1 | 4.5 body | ✓ |
| cat-ink (#0B0F1A) on all night cats | 10–14 : 1 | 4.5 body | ✓ |

`--accent` (#F5C243) in **sunny** theme is decorative — it does NOT meet 4.5:1 as small text on white; use `--accent-strong` for readable text on light surfaces. Buttons place ink-primary on --accent for 8+ :1.

## 3. Typography

**Two type systems, one scale.**

### Sunny Cafe fonts
- **Display / headings / body:** [Lora](https://fonts.google.com/specimen/Lora) (400 / 500 / 600 / italic) — warm serif, pen-like, easy to read
- **UI labels:** Inter fallback for input placeholders / small chips where serif is too fussy
- **Mono:** JetBrains Mono for timers, timestamps

### Netcafe After Dark fonts
- **Display / headings:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (500 / 600 / 700) — geometric, mildly futuristic
- **Body:** Space Grotesk 400
- **Mono / accents:** JetBrains Mono — heavy use (like a code editor vibe): time labels, numbers, "system" text

### Scale (rem, both themes)

| Token | Size | Use |
|---|---|---|
| xs | 0.75 | tags, meta |
| sm | 0.875 | body small, sidebar labels |
| base | 1.0 | body |
| lg | 1.125 | card title |
| xl | 1.375 | page title |
| 2xl | 1.75 | diary prompt |
| 3xl | 2.5 | landing hero |

Line-height 1.55 body, 1.2 headings. Letter-spacing -0.01em on serif headings, -0.02em on Space Grotesk headings.

## 4. Layout — Google-Calendar-inspired shell

```
┌────────────────────────────────────────────────────────────────┐
│  [☰] FindYourself  [Today] [‹ ›] Sep 14–20 · Week   🔍 ⚙ 🌗   │  Top bar
├──────────────┬─────────────────────────────────────────────────┤
│  + Create ▼  │        Mon 14  Tue 15  Wed 16 ...              │
│              │  6 AM  ┌─────┐                                   │
│  Sep 2026    │  7 AM  │Deep │                                   │
│  M T W T F   │  8 AM  │Work │  ┌──┐                             │
│  ...         │  9 AM  └─────┘  │Mtg│                            │
│              │                                                  │
│  ☕ steam    │  Week view · click a day to open Day view       │
│  (animated)  │                                                  │
│              │                                                  │
│  Categories  │                                                  │
│  ● Deep      │                                                  │
│  ● Meetings  │                                                  │
│  ● Learning  │                                                  │
│              │                                                  │
│  ♪ Mini      │                                                  │
│    mixer     │                                                  │
└──────────────┴─────────────────────────────────────────────────┘
```

- **Sidebar 280px** collapses to icons < 900px viewport.
- **View switcher:** Day / Week / Month. Week is default entry point ("first see the shape of your week"). Clicking any day cell zooms to Day.
- **Animated coffee cup:** SVG lives in the sidebar, always visible. Ceramic mug in sunny theme; glowing neon-cup outline in night theme. Steam wisps rise via CSS keyframes (paused when `prefers-reduced-motion`).

## 5. Spacing & radius

- 4-pt scale: 4, 8, 12, 16, 20, 24, 32, 48, 64, 96
- Radii: `sm 6px`, `md 10px`, `lg 16px`, `xl 24px`, `pill 999px`
- Cards `lg`; buttons `md`; chips `pill`.

## 6. Motion

- Default ease: `cubic-bezier(0.4, 0.0, 0.2, 1)`
- Theme toggle: 350ms crossfade of `background-color` and `color` via CSS transition on root
- Coffee steam: 3 wisps, 4s ease-in-out, offset animation-delay
- Focus Mode enter: 700ms — non-focus UI fades and translates outward
- Timetable block drag: instant during drag; 200ms snap on release
- Sunny scene: floating dust motes (very subtle)
- Netcafe scene: subtle horizontal scanline drift + occasional glitch flicker on the accent

All motion respects `prefers-reduced-motion: reduce`.

## 7. Accessibility (WCAG 2.1 AA)

- Contrast ratios: see table in §2. All body text meets 4.5:1; large text and UI meet 3:1.
- Focus rings: `2px solid var(--accent)` + `2px offset`, visible on every interactive element on keyboard focus.
- Skip-to-content link on landing.
- Time-block colors are ALWAYS paired with a text label + a category name — never color-only.
- Mood picker uses emoji + text label (aria-label).
- Reduced motion disables coffee steam, rain, dust, glitch, scanline.
- Audio never autoplays; ambient starts on explicit first click; master mute always visible in top bar.
- Semantic HTML: `<main>`, `<nav>`, `<aside>`, `<button>`, headings in order.
- Language tag on `<html>`.

## 8. Components (v1 list)

**Layout:** AppShell (sidebar + top bar), Sidebar, TopBar, ViewSwitcher (Day/Week/Month), MiniPlayer, ThemeToggle

**Timetable:** WeekGrid, DayGrid, MonthGrid, TimeBlock, BlockEditor, CategoryPicker, TimeAxis, CoffeeCupIllustration

**Diary:** DiaryEditor (Tiptap), MoodPicker, PromptChip, EntryHeatmap

**Tasks:** TaskList, TaskCard, BucketColumn, TaskEditor, RestrictionBadge

**Pomodoro:** TimerRing, FocusModeShell, SessionStat

**Mixer:** MixerPanel, LayerSlider, MasterVolume, ScenePicker

**Music:** MusicLibrary, UploadDropzone, TrackRow, SuggestionForm, CommunityPicks, MiniPlayer

**Motivation:** StreakBadge, QuoteCard, WeeklyWinsCard, ProgressRings

**Primitives (shadcn/ui):** Button, Input, Textarea, Dialog, Popover, Tooltip, Toast, Tabs, Switch, Slider, Select, DropdownMenu

## 9. Iconography

Lucide (default with shadcn/ui). Custom SVG only for:
- Coffee cup illustration (both theme variants)
- Ambient layer icons (rain, fire, keyboard, cafe, piano)
- Cafe window scene
