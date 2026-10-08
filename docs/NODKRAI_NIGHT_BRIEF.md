# Nod-Krai night: what I need, and how I will build it

Written 2026-10-07 for Minh. Nod-Krai is the first of the two night regions (the other is Natlan). This is the request I would make in a new chat, plus the plan.

**Honest note:** what I know about Nod-Krai comes from general knowledge, not from looking at it. Your references decide the look. Everything below is an original design (a snowy northern coast at night), not a copy of the game's art.

---

## Part 1. Copy-paste message for the chat with your image tool

> I am designing the **night** version of a calm, cosy productivity web app. The day version is a painted storybook valley (hill town, castle, river, windmill, banner, wildflowers). I need the **night region "Nod-Krai"**: a **snowy northern coast at night, quiet and still**, with a **moon and a soft aurora**, cold deep blues and teals, and **a few warm yellow window lights** as the through-line. Original design, **not copied from any game**.
>
> Please make these images, **each one in its own request**, in the **same painterly storybook style** as the day scene (soft gouache and watercolour, clean outlines). **No text, no UI, no characters, no logos, no watermark.**
>
> **1. Wallpaper (the main one).** Landscape **16:9**, as large as you can make it (**2560 x 1440 or more**). A snowy coastal hill town at night: a frozen bay with moonlight on the ice, pine trees with snow, a few small timber houses with **warm yellow lit windows**, a **distant lighthouse or tower with a small warm light**, a **stone bridge or pier**, a **pale moon**, a **gentle aurora** (green-teal, soft, low contrast) across the upper sky, scattered stars. **Composition rules, important:** keep the **centre calm and low-detail** (UI panels sit over it); put the strongest scenery along the **top edge and the left and right edges**; keep a **clear horizontal band near the bottom** (a wooden fence or a stone terrace) for a control bar; leave the **far right** open for a **banner or lamp post**, like the day scene.
>
> **2. Foreground plant (replaces the red fan flower at night).** Same idea as the day one: a **pinwheel-shaped flower head** with 5 swirled petals, **seen straight on and perfectly symmetric**, centred in a square image, on a **flat solid pure magenta background (#FF00FF)**, **no stem**. At night it is a **frost flower**: pale ice-blue petals with a faint warm yellow centre. Square 1:1, 2048 px.
>
> **3. Aurora layer.** A wide soft **aurora ribbon** (green-teal with a hint of violet), on a **flat solid magenta background (#FF00FF)**, no sky, no stars. Wide **4:1**, 2560 x 640.
>
> **4. Cloud layer.** One or two **dark blue night clouds with moonlit silver edges**, on a **flat solid magenta background (#FF00FF)**. Square 1:1, 1024 px.
>
> **5. Optional: lit windows.** Skip this one; I can add the warm glow in code.
>
> Run each one two or three times so I can pick the best.

---

## Part 2. What I need from you (in this order)

1. **Your references**, in `public/assets/world/nod-krai/` or pasted: the in-game Nod-Krai view, colour pulls, anything with the mood. Even one image of the mood you want helps more than my guessing.
2. **The five images above** (files named `nodkrai-night.png`, `nodkrai-frost-flower.png`, `nodkrai-aurora.png`, `nodkrai-cloud.png`). Original PNG or JPG, not a screenshot.
3. **Three decisions:**
   - Is the sky **clear with stars and an aurora**, or **snowing**? (I suggest clear with a little drifting snow in the foreground; both together get busy.)
   - Is the moon **full and bright**, or **a thin crescent**? (Affects how much light falls on the panels.)
   - Does the **windmill** appear at night? (I suggest no; a lit lighthouse is the landmark instead.)
   - **Answered 2026-10-08:** moon **full and bright**. Sky (clear or snowing) and landmark (lighthouse or windmill) are left open until Minh sends references.
4. **Sound, later:** a recording or two (snowy wind, a faint ice creak) as a mix called "Snowy night". I will use a synthesized stand-in until then, as with Monstadt.

---

## Part 3. How I will implement it

### A. The colour mode (Figma and CSS together)
New mode **"Nod-Krai Night"** in the Color, Pixel and Type collections, mirrored 1:1 into a `[data-theme="nodkrai-night"]` block in `app/globals.css`. Proposed palette (every text pair checked, all pass WCAG AA; the lowest ratio is 6.2:1):

| Token | Value | Token | Value |
|---|---|---|---|
| bg/base | `#0E1A2B` | ink/primary | `#E8F1FA` |
| bg/elevated | `#15243A` | ink/secondary | `#B4C6DA` |
| bg/overlay (panels) | `#122036` | ink/muted | `#9DB0C6` |
| bg/alt | `#0B1524` | accent (yellow thread) | `#F4D03F` |
| bg/window | `#1B2D47` | accent/soft | `#FFE9A0` |
| cat/deep, meeting, learn, rest, personal | `#7FB8E8`, `#F4D58A`, `#B7A6E6`, `#8FD8D0`, `#F0A8BE` | status success / danger | `#7FD6A8` / `#FF9C8A` |

These are my proposal; I will retune them to your wallpaper by sampling its real pixels (as I did for Monstadt). Panels become **deep-navy glass at 85 to 90 %** over the wallpaper, and I measure text contrast against the actual pixels behind each panel before calling it done.

### B. The scene (code)
- **Wallpaper** as a WebP (2560 x 1440 and a 1280 x 720 for phones), shown through the same "stage" that keeps anything attached to the painting glued to the right spot on every screen shape.
- **Aurora:** the transparent layer drifts slowly and its opacity breathes (transform and opacity only).
- **Snow:** at most 40 small flakes falling and swaying with the wind value (the same wind value that drives the Monstadt gusts).
- **Frost flowers:** same spinning head and bending stem as the fan flowers, with the frost-flower image.
- **Lit windows:** a faint flicker (opacity 0.85 to 1) on the warm window spots, positioned on the stage.
- **Seed spirit:** recoloured to an ice-blue and pale gold drift of motes; still faceless and soft.
- **Gusts:** kept, with snow streaking sideways during a gust instead of leaves.
- Everything off under `prefers-reduced-motion` (first frame shown still).

### C. Day and night switching
- The mode (day or night) follows the **clock by default**; the person can switch by hand, and switch back (your decision from Session 68).
- Region inside the mode: Day gives Monstadt or Liyue; Night gives Nod-Krai or Natlan. Stored on the profile like the time zone setting, so it follows the person to every device, and mirrored in a cookie so the server renders the right theme with no flash.
- The wallpaper **crossfades** over 1.2 s when the mode changes. The existing two-theme toggle becomes a mode toggle plus a region picker in Settings.
- Time of day uses the person's own time zone setting (already built).

### D. Order of work
1. You send references and images. 2. I sample the palette and add the Figma mode. 3. I build **Timetable and Focus Mode in Nod-Krai Night** in Figma first (one dense screen and one scenic screen) and you approve. 4. The Chill draft gets a night version (the live prototype). 5. Only then do I touch the app code (theme block, picker, clock default), in small steps, with the existing tests extended (contrast, theme registry, cookie).

### E. What I cannot do
- I cannot paint the scene myself; it has to come from your image tool.
- I cannot hear the sound; you judge it.
- I cannot guarantee the lit windows line up until I see your wallpaper; I place them by eye, then check in the browser at three screen shapes.

---

## Update 2026-10-08: references received, assets prepared

**Received** (in `public/assets/world/NodKrai_Night/`, originals kept): `Nodkrai theme.png` (wallpaper, 1673x940), `Nodkrai flower.png`, `Nodkrai_aurora.png`, `Cloud.png`, and `Combination.png` (a contact sheet with filenames baked in; ignored).

**Minh's answers:** keep the **crescent moon** and add a **moon animation** (code phase: slow glow pulse and a faint halo, transform and opacity only); upscale the wallpaper; cut out the three layers; the flower **sways** instead of spinning. The glowing **tower on the cliff is the landmark** (our "lighthouse"); no windmill at night. Sky stays clear with the aurora; light drifting snow in the foreground only.

**Findings:** the three layer files had the white/grey checkerboard painted into their pixels (RGB, no alpha). The flower is a leaning lily with leaves, not a pinwheel, so no spin. The wallpaper is saturated royal blue (sky top `#041762`, centre `#2D57CA`, bottom band `#1C349E`), not the navy first proposed.

**Produced** (same folder, PNG and WebP): `nodkrai-night.webp` (2560x1440, Lanczos upscale plus light sharpen; not true detail) and `nodkrai-night-1280.webp` for phones; `nodkrai-frost-flower` (flood-filled from the border, so inner highlights stay solid); `nodkrai-aurora` (colour-to-alpha against white, then regraded brighter and more saturated; use with `mix-blend-mode: screen` at about 50 to 80 % opacity); `nodkrai-cloud-sheet` plus `nodkrai-cloud-1..8` (single clouds; some neighbours merged, and `-3` has a sliver of its neighbour at the right edge). Script is not in the repo; rerunnable on request.

**Retuned palette (proposal, replaces the table in Part 3A):** panels `#0A1450` at **90 %**; ink `#EAF2FF`, ink/secondary `#C2D2F2`, ink/muted `#A8BAE0`; accent `#F4D03F`; categories deep `#8CC0FF`, meeting `#F4D58A`, learn `#C3B2F5`, rest `#8FE0D8`, personal `#F5AFC6`; success `#7FE0B0`, danger `#FF9E8C`. Measured against the **worst case** (the brightest 0.5 % of wallpaper pixels under an 85 % panel) the lowest ratio is **5.8:1** (danger); at 90 % it is 6.7:1. All pass AA. Base/elevated/alt/window surface tokens still to be derived from the final panel colour.

**Next:** Figma "Nod-Krai Night" colour mode (ask Minh first), then Timetable and Focus Mode screens.

## Update 2026-10-08 (b): Figma colour mode built

New mode **"Nod-Krai Night"** added to the Figma `Color` (28 tokens), `Pixel` (20) and `Type` (4) collections in file `cfavJs3bXchFO6b9kSVhxw`, so each now has five modes. Colour values are the retuned palette above, plus: `bg/base #0A1450`, `bg/elevated #101C5E`, `bg/overlay #0D1856`, `bg/alt #081043`, `bg/window #1A2A72`, `cat/ink #0A1450`, borders `#EAF2FF` at 14 % and 26 %, `accent/line` `#F4D03F` at 60 %. Pixel kit (cat, cups, digits) keeps its Netcafe Night colours, shifted to the indigo outline and ink; `pix/track-lit` aliases the accent as before. Type uses Lora (display and body), Inter (UI), JetBrains Mono, the same as Monstadt Painted. Contrast measured for every text colour on every surface: **lowest 6.5:1** (danger on `bg/window`); category ink on category fills 9.0:1 or better. Existing modes untouched. Not yet in `globals.css` (code waits for the screens).

## Update 2026-10-08 (c): Timetable, Nod-Krai Night, built in Figma

Frame **`Timetable · Nod-Krai Night`** (node `68:2`, Screens page, x 3280, y 1240, 1440 x 900), cloned from the Monstadt Timetable (`29:7157`) with the frame's Color, Pixel and Type modes switched to Nod-Krai Night, so the colours follow the variables. What changed beyond the mode: the wallpaper is `nodkrai-night` (uploaded as a JPEG, because Figma did not render the 2560 WebP; the files in the repo stay WebP); the top bar is a darkened sky-and-aurora band (`nodkrai-topbar.png`); the quote medallion shows the tower on the cliff (`nodkrai-medallion.png`); sidebar and week grid glass 90 %, cards and header 92 %; theme chip reads "Nod-Krai". Three contrast fixes for the dark mode: the mini-month's current week is a lighter indigo band (`bg/window`) with a yellow line (pale numerals on the day theme's pale yellow were unreadable); the two today discs use dark category ink; the today column tint dropped to 16 % in the header and 10 % in the column (the day theme's 50 % and 30 % gave 2.3:1; now 5.0:1 measured on the render).

**Limits:** the dense screen hides most of the scene behind the panels (you see the left foliage, the crescent and the right edge); the lake, aurora and tower show on the scenic screens (Focus Mode next). The panels are measured against the brightest wallpaper pixels (5.8:1 worst case), not yet against every pixel behind each panel. Aurora, clouds, frost flower and moon animation are not placed on this frame (they are motion layers for the code and the Chill draft). Sample data, as in the other frames.

## Update 2026-10-08 (d): the Nod-Krai symbol, a moon-moth spirit (draft 2)

Minh sent two references (the in-game moth-like spirit and a fan chibi of it) and asked for a chibi redraw as **the symbol of the night theme**, to be the runner on the Pomodoro circle (the role the dandelion-seed spirit has in Monstadt). Drawn as an **original** vector, not traced from either picture (the fan art belongs to its artist, the creature to the game): a big round pale head with a gold crescent on the forehead, closed sleepy eyes, soft blush, two curved feathered antennae, two long wing-cloaks with a tiny moon mark near each tip, a narrow body over a flared scalloped navy skirt with stars, a gold crescent halo and a few sparkles. File: `public/assets/world/NodKrai_Night/nodkrai-moth-spirit.svg` (viewBox 240 x 260, about 3 KB, all gradients and masks, no raster). Checked at 480, 68 and 40 px on the night indigo: it still reads at ring size (the face is tiny at 68 px, the silhouette, ears, wings and halo carry it). Draft 1 looked like a rabbit (plain ears, boxy hem); draft 2 fixed that. **Plan for the code:** rides the progress arc like the dandelion spirit (waits at the top when idle; running = drifts with a gentle bob; paused = hovers; break = curls asleep with the wings folded; finished = a sparkle burst), wings flutter slowly through a small scale or skew on two wing groups, the halo breathes; everything off under `prefers-reduced-motion`. Not placed in Figma yet (the Focus Mode night frame comes next).

**Draft 3 (same day):** Minh said draft 2 was too far from the reference and asked to follow the **second picture (the chibi)** more closely. Redrawn by hand (own linework, thin lavender outlines, not traced): wide soft dome head with a lit gold crescent, big curved feather ears plus a broad tuft on each side of the head, a wing-petal cape in front, a starry scalloped navy hem, long side wings with a tiny moon near each tip and a lighter inner wing, a pale crescent halo with a thin orbit ring and two beads (viewBox 260 x 260). Same file name. Still to judge by Minh at full size; the 68 px ring size reads by silhouette.

## Update 2026-10-08 (e): Focus Mode, Nod-Krai Night, built in Figma

Frame **`Focus Mode · Nod-Krai Night`** (node `72:2`, Screens page, x 4920, y 1240, 1440 x 900), cloned from `Focus Mode · Monstadt` (`41:7157`) and switched to the Nod-Krai Night modes. Same layout (clock chip, Leave, left rail "Focusing on / Up next", centre timer card, right rail Sound, flowers for finished and coming sessions). Changes: the **wallpaper shows whole** (lake, tower, aurora, crescent, foliage; JPEG copy of `nodkrai-night`); an **aurora layer** (`nodkrai-aurora`) sits above it in **screen blend at 60 %**; the day art is gone (windmill body and sails, both clouds, three birds); the **moth spirit** rides the end of the progress arc (88 px, `nodkrai-moth-spirit.png`, a transparent render of the SVG, also saved in the assets folder) in place of the dandelion spirit; three faint gold dust dots trail it (too small to read in the render; may need to be larger or dropped); the four session icons are the **frost flower** (bloomed for finished, dimmed and desaturated for coming); all glass panels are 90 %. Colours follow the mode, so the timer ring is the yellow accent on an indigo card. Measured text contrast on the render at text-free points inside the panels: muted ink 7.5 to 8.3:1, so AA with room.

**Limits:** the wallpaper's cliff tower sits between the timer card and the right rail, as the lighthouse landmark; the frost flower is a leaning lily, so at 32 px the icons read as small shards (they may need 40 px or a simplified bloom); no moon animation, aurora drift or snow is shown (Figma cannot play motion; they are for the code and the Chill draft).

## Update 2026-10-08 (f): Diary and Focus page, Nod-Krai Night, built in Figma

Two more frames on the Screens page, both cloned from their Monstadt versions, switched to the Nod-Krai Night modes, with the same fixes as the Timetable (current week = lighter indigo band with a yellow line; today disc with dark ink; theme chip "Nod-Krai"; top bar = darkened aurora sky band; glass 90 % and cards 92 %).

- **`Diary · Nod-Krai Night`** (node `75:2`, x 3280, y 2220, below the night Timetable). The wallpaper is scaled to 1920 x 1080 and shifted left (x -130, y -90) so the **cliff tower, waterfall and lake fill the open right side**, the way the castle and banner did in Monstadt. "Your year in pages" got a **night ramp** (the day blues were hard-coded): level 1 to 4 = `#4466B0`, `#6C93D8`, `#8CC0FF`, `#FFE9A0` (dim to moon yellow; level 1 is about 3:1 against the panel so it stays distinct from the empty cells); 44 cells and legend swatches recoloured. The **sample entry was rewritten for the night** ("A slow, quiet evening. The aurora over the bay finally came out...", "Walk to the pier under the aurora, no phone"); the day text mentioned a windmill. Not modelled, as in the day frame: the empty state, the unsaved-words banner, the future-day view.
- **`Focus · Nod-Krai Night`** (node `75:700`, x 4920, y 2220): the Focus **page** (not Focus Mode), three columns (timer settings, timer card, This week and Recent sessions). Wallpaper 1920 x 1080 at x -200, y -100 so the lake shows below the cards and the aurora crosses the top. The **moth spirit** (64 px) waits just inside the top of the timer ring (idle state), clear of the Focus / Short break / Long break tabs; the session icons are the frost flower (bloomed for done, dimmed for coming).

**Row layout now:** day row (y 260) Timetable, Diary, Focus, Focus Mode; night row (y 1240) Timetable at x 3280, Focus Mode at x 4920; second night row (y 2220) Diary at x 3280, Focus at x 4920. The day Chill frames sit at y 1240, x 0 and 1640.

**Mistake caught:** my first rewrite of the Diary sample text replaced the whole three-bullet node with one line; restored to three bullets.

**Still to do:** Chill (the live HTML night draft), Settings and other screens, the Moodboard page scaffolds, wiring the colour mode into `globals.css`.

## Update 2026-10-08 (g): Chill, Nod-Krai night, first draft as a live prototype

Files: `docs/prototypes/chill-nodkrai-night.html` (loads art from `public/assets/world/NodKrai_Night/` by relative path; open it through a local static server from the repo root, for example `python -m http.server`, because browsers often block local images from `file://`) and `docs/prototypes/chill-nodkrai-night-standalone.html` (about 1 MB, every picture embedded, opens by double-click). Built from the Monstadt Chill draft (same stage, gusts, parallax, Chill mode with idle fade, bottom bar, sound settings), with the night art and the pieces from the plan:

- **Stage** (the painting's own 1673 x 940 space, scaled and cropped like `cover`; pinned to the right of centre on landscape and further right on portrait so the tower and moon stay in view). Everything attached to the painting stays on the same painted spot on every screen shape.
- **Aurora**: the cut-out ribbon, two copies (one mirrored, blurred), drifting 38 to 52 s and breathing, screen-blended at low opacity so it adds to the painted aurora instead of covering it.
- **Moon (the animation Minh asked for)**: a breathing halo (7 s) and a thin orbit ring with two glowing beads turning once a minute, echoing the spirit's halo.
- **Stars** (70, twinkling) and a **shooting star** every 14 to 26 s; **24 shore lights** flickering on the far shore; the **tower beacon** pulsing with a small cross glint; the **lamp** on the right flickering; **water shimmer** streaks on the bay, a few warm ones under the lamp.
- **Clouds**: three of the cut-out night clouds, darkened and screen-blended into faint moonlit bands, drifting 110 to 170 s per crossing.
- **Snow**: at most 40 flakes on one canvas (default 28; a Snow slider sets 0 to 40), swaying, bent by the same wind value as the flowers, drawn as sideways streaks during a gust.
- **Frost flowers**: four lilies along the bottom corners with a pulsing glow, swaying with the wind and leaning further in a gust.
- **The moth spirit** (the symbol): 120 px, drifts across the bay in an 80 s loop (back and forth), bobs and tilts, narrows its wings slightly 1.7 s per beat (a whole-picture squeeze; separate wing groups would need the SVG split), has a breathing glow, and drops gold dust that fades as it goes.
- **Gusts** every 9 to 15 s for about 5.4 s: wind eases up, flowers lean, snow streaks, sound swells.
- **Sound**: synthesized colder wind (thinner low end, brighter hiss) plus a rare faint ice creak every 16 s; named "Snowy night"; a stand-in until recordings exist. **Reduced motion**: everything animated stops (aurora held at 45 %, spirit parked).

**Checked** at 1440 x 900 (desktop, gust running, settings open) and 430 x 860 (portrait crop); only console message is the missing favicon. **Not done / to judge:** the ghost-like edge of the second aurora copy is still faintly visible; the spirit squeeze is a stand-in for real wing flutter; no real sound; no mixer, music or playlist sections (scene and controls only, like the Monstadt draft); the wallpaper is an upscale, so it is soft on large screens.

## Update 2026-10-08 (h): closed for the first code pass

The landing page (day and night) is built in Figma, `border/input` was added to every colour mode, and the tracker is current. Everything the code needs, including the palette tables and the order of work, is in `docs/THEME_HANDOFF.md`; start there tomorrow.
