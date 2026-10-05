import type { Grid, Palette } from "@/components/focus/pixel/sprites";
import type { LayerKey } from "@/lib/audio/layers";

// Mixer icons, 12x12 pixel art in the same language as the cafe cat: string
// grids, colours from --pix-* tokens (so both themes just work), no image
// files. Two frames each; a layer that is on shows them alternating (rain
// falls, the fire flickers, a key is pressed, notes wobble, voices take turns),
// and a layer that is off shows the first frame still. The art here is
// placeholder-grade on purpose: Stage 2 (Figma) redraws the whole set.
//
//   o outline  c cloud  d drop  f flame  y hot flame  r deep flame
//   w white / light key  k dark key  i gap  h highlight  m foam  e ink

export const ICON_SIZE = 12;

export const ICON_PALETTE: Palette = {
  o: "var(--pix-outline)",
  c: "var(--pix-cloud)",
  d: "var(--pix-water)",
  f: "var(--pix-flame)",
  y: "var(--pix-flame-hot)",
  r: "var(--pix-flame-deep)",
  w: "var(--pix-china)",
  k: "var(--pix-key-dark)",
  i: "var(--pix-china-inside)",
  h: "var(--pix-white)",
  m: "var(--pix-foam)",
  e: "var(--pix-eye)",
};

const RAIN: readonly Grid[] = [
  [
    "....oooo....",
    "..ooccccoo..",
    ".occccccccoo",
    "occcccccccco",
    "occcccccccco",
    ".oooooooooo.",
    "............",
    "..d....d..d.",
    "....d....d..",
    ".d....d.....",
    "...d....d.d.",
    "............",
  ],
  [
    "....oooo....",
    "..ooccccoo..",
    ".occccccccoo",
    "occcccccccco",
    "occcccccccco",
    ".oooooooooo.",
    "............",
    ".d....d....d",
    "..d....d.d..",
    "....d....d..",
    ".d....d.....",
    "...d....d.d.",
  ],
];

const FIRE: readonly Grid[] = [
  [
    ".....o......",
    ".....oo.....",
    "....oroo....",
    "...orffro...",
    "..orffyffro.",
    "..orfyyyfro.",
    ".orffyyyffro",
    ".orfyyyyyfro",
    ".orfyyyyyfro",
    ".orffyyyffro",
    "..orffffffo.",
    "...oooooooo.",
  ],
  [
    "......o.....",
    ".....oo.....",
    "....oroo....",
    "....orfro...",
    "..orffyffro.",
    "..orfyyyfro.",
    ".orffyyyffro",
    ".orfyyyyyfro",
    ".orfyyyyyfro",
    ".orffyyyffro",
    "..orffffffo.",
    "...oooooooo.",
  ],
];

const KEYBOARD: readonly Grid[] = [
  [
    "............",
    "............",
    "oooooooooooo",
    "occicciccico",
    "oiiiiiiiiiio",
    "occicciccico",
    "oiiiiiiiiiio",
    "oiccccccccio",
    "oooooooooooo",
    "............",
    "............",
    "............",
  ],
  [
    "............",
    "............",
    "oooooooooooo",
    "oyyicciccico",
    "oiiiiiiiiiio",
    "occicciccico",
    "oiiiiiiiiiio",
    "oiccccccccio",
    "oooooooooooo",
    "............",
    "............",
    "............",
  ],
];

const CAFE: readonly Grid[] = [
  [
    "............",
    ".oooooooo...",
    "occcccccco..",
    "ocecececeo..",
    "occcccccco..",
    ".ooocooooo..",
    "...oo.......",
    ".....oooooo.",
    "....occcccco",
    "....oceececo",
    "....occcccco",
    ".....oooooo.",
  ],
  [
    "............",
    ".oooooooo...",
    "occcccccco..",
    "oceceececo..",
    "occcccccco..",
    ".ooocooooo..",
    "...oo.......",
    ".....oooooo.",
    "....occcccco",
    "....ocecceco",
    "....occcccco",
    ".....oooooo.",
  ],
];

const PIANO: readonly Grid[] = [
  [
    "............",
    "............",
    "oooooooooooo",
    "owkkwwkkwwwo",
    "owkkwwkkwwwo",
    "owkkwwkkwwwo",
    "owwwowwwowwo",
    "owwwowwwowwo",
    "owwwowwwowwo",
    "oooooooooooo",
    "............",
    "............",
  ],
  [
    "............",
    "...e........",
    "oooooooooooo",
    "owkkwwkkwwwo",
    "owkkwwkkwwwo",
    "owkkwwkkwwwo",
    "owwwowwwowwo",
    "owwwowwwowwo",
    "owwwowwwowwo",
    "oooooooooooo",
    "............",
    "........e...",
  ],
];

export const LAYER_ICONS: Record<LayerKey, readonly Grid[]> = {
  rain: RAIN,
  fire: FIRE,
  keyboard: KEYBOARD,
  cafe: CAFE,
  piano: PIANO,
};
