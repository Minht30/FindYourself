import type { CSSProperties, ReactNode } from "react";
import { mulberry32 } from "@/lib/audio/rng";
import { makeStreaks } from "@/lib/scene/streaks";
import type { ThemeName } from "./hooks";
import { SCENE_H, SCENE_W, type SceneDef } from "./types";

// PLACEHOLDER ART. Two small cafe-window scenes that prove the mechanism:
// layers, parallax, rain and glow that follow the mixer, a different layer set
// per theme, still when motion is reduced. The real Monstadt (day) and Liyue
// (night) scenes are designed with Minh in Figma (Stage 2) and arrive as new
// SceneDefs in SCENES below; nothing in Scene.tsx has to change.

const css = (v: Record<string, string | number>) => v as CSSProperties;

// ── the window every placeholder shares ────────────────────────────────────
const WIN = { x: 120, y: 40, w: 720, h: 360 } as const; // the opening in the wall
const MULLION = 10;

type Palette = {
  wall: string;
  wallShade: string;
  wood: string;
  woodLight: string;
  table: string;
  tableEdge: string;
  cup: string;
  cupInside: string;
  steam: string;
  candle: string;
  flame: string;
  lampShade: string;
  lampGlow: string; // rgb triplet, "255, 190, 90"
  glowAlpha: number;
  leaf: string;
  leafDark: string;
  pot: string;
  book1: string;
  book2: string;
  book3: string;
  rain: string;
  vignette: string;
};

// ── rain on the glass: a streak count and speed that follow --rain ──────────
const STREAKS = makeStreaks();
function RainGlass({ colour }: { colour: string }) {
  return (
    <g clipPath="url(#sc-win-clip)">
      {STREAKS.map((s) => (
        <rect
          key={s.i}
          x={Math.round((WIN.x + 14 + s.x * (WIN.w - 28)) * 10) / 10}
          y={WIN.y - s.len}
          width={1.8}
          height={s.len}
          rx={0.9}
          fill={colour}
          className="sc-streak"
          style={css({
            "--i": s.i,
            "--d": s.fall,
            "--delay": s.delay,
            "--travel": `${WIN.h + s.len}px`,
            "--rest": `${Math.round(s.rest * (WIN.h + s.len))}px`,
          })}
        />
      ))}
    </g>
  );
}

function WindowClip() {
  return (
    <defs>
      <clipPath id="sc-win-clip">
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} />
      </clipPath>
    </defs>
  );
}

// The wall with a window cut out of it, the mullions and the sill.
function Frame({ p }: { p: Palette }) {
  const { x, y, w, h } = WIN;
  return (
    <g>
      <path
        fillRule="evenodd"
        fill={p.wall}
        d={`M0 0H${SCENE_W}V${SCENE_H}H0Z M${x} ${y}H${x + w}V${y + h}H${x}Z`}
      />
      {/* a little depth on the inside edge of the opening */}
      <rect x={x} y={y} width={w} height={6} fill={p.wallShade} opacity={0.6} />
      <rect x={x} y={y} width={6} height={h} fill={p.wallShade} opacity={0.45} />
      <rect x={x + w / 2 - MULLION / 2} y={y} width={MULLION} height={h} fill={p.wood} />
      <rect x={x} y={y + h / 2 - MULLION / 2} width={w} height={MULLION} fill={p.wood} />
      <rect x={x - 6} y={y - 6} width={w + 12} height={8} fill={p.woodLight} />
      <rect x={x - 6} y={y + h - 2} width={w + 12} height={10} fill={p.woodLight} />
      <rect x={x - 6} y={y - 6} width={8} height={h + 16} fill={p.woodLight} />
      <rect x={x + w - 2} y={y - 6} width={8} height={h + 16} fill={p.woodLight} />
      {/* the sill */}
      <rect x={x - 30} y={y + h + 8} width={w + 60} height={16} fill={p.wood} />
      <rect x={x - 30} y={y + h + 8} width={w + 60} height={4} fill={p.woodLight} />
    </g>
  );
}

// Table, cup with steam, candle, lamp, plant, books: the foreground.
function Interior({ p }: { p: Palette }) {
  return (
    <g>
      <rect x={0} y={462} width={SCENE_W} height={SCENE_H - 462} fill={p.table} />
      <rect x={0} y={462} width={SCENE_W} height={5} fill={p.tableEdge} />

      {/* books */}
      <rect x={280} y={446} width={74} height={16} fill={p.book1} />
      <rect x={286} y={432} width={62} height={14} fill={p.book2} />
      <rect x={292} y={420} width={52} height={12} fill={p.book3} />

      {/* candle */}
      <rect x={420} y={438} width={13} height={24} fill={p.candle} />
      <ellipse cx={426.5} cy={432} rx={4} ry={8} fill={p.flame} className="sc-flicker" />

      {/* cup and saucer */}
      <ellipse cx={618} cy={462} rx={40} ry={7} fill={p.cup} opacity={0.9} />
      <rect x={596} y={430} width={44} height={32} rx={5} fill={p.cup} />
      <rect x={599} y={433} width={38} height={7} rx={3} fill={p.cupInside} />
      <path d="M640 438 q18 0 14 14 q-3 8 -14 6" fill="none" stroke={p.cup} strokeWidth={5} />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${607 + i * 11} 424 q-6 -10 0 -18 q6 -8 0 -16`}
          fill="none"
          stroke={p.steam}
          strokeWidth={3}
          strokeLinecap="round"
          className="sc-steam"
          style={css({ "--d": i * 1.3 })}
        />
      ))}

      {/* lamp */}
      <rect x={186} y={420} width={8} height={42} fill={p.wood} />
      <rect x={168} y={456} width={44} height={8} rx={2} fill={p.wood} />
      <path d="M160 424 L178 376 H202 L220 424 Z" fill={p.lampShade} />

      {/* plant */}
      <rect x={780} y={430} width={40} height={32} rx={3} fill={p.pot} />
      <ellipse cx={800} cy={414} rx={11} ry={26} fill={p.leaf} transform="rotate(-24 800 430)" />
      <ellipse cx={800} cy={410} rx={10} ry={28} fill={p.leafDark} />
      <ellipse cx={800} cy={414} rx={11} ry={26} fill={p.leaf} transform="rotate(26 800 430)" />
    </g>
  );
}

// Warm light from the lamp and the candle. --glow (0..1) is the fire slider.
function Glow({ p }: { p: Palette }) {
  const rgb = p.lampGlow;
  return (
    <g className="sc-glow">
      <defs>
        <radialGradient id="sc-glow-lamp" cx="190" cy="400" r="320" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={`rgb(${rgb})`} stopOpacity={p.glowAlpha} />
          <stop offset="1" stopColor={`rgb(${rgb})`} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="sc-glow-candle" cx="426" cy="436" r="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={`rgb(${rgb})`} stopOpacity={p.glowAlpha * 0.9} />
          <stop offset="1" stopColor={`rgb(${rgb})`} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g className="sc-glow-flicker">
        <rect width={SCENE_W} height={SCENE_H} fill="url(#sc-glow-lamp)" />
        <rect width={SCENE_W} height={SCENE_H} fill="url(#sc-glow-candle)" />
      </g>
    </g>
  );
}

function Vignette({ colour }: { colour: string }) {
  return (
    <g>
      <defs>
        <radialGradient id="sc-vignette" cx="480" cy="270" r="620" gradientUnits="userSpaceOnUse">
          <stop offset="0.55" stopColor={colour} stopOpacity={0} />
          <stop offset="1" stopColor={colour} stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <rect width={SCENE_W} height={SCENE_H} fill="url(#sc-vignette)" />
    </g>
  );
}

// ── night: the Netcafe After Dark window ───────────────────────────────────
const NIGHT: Palette = {
  wall: "#1a1410",
  wallShade: "#0d0a08",
  wood: "#2c1f16",
  woodLight: "#4a3526",
  table: "#241913",
  tableEdge: "#3b2a1e",
  cup: "#e8eeff",
  cupInside: "#9aa5c4",
  steam: "#cdd8ff",
  candle: "#e7dcc3",
  flame: "#ffd25a",
  lampShade: "#e9b44c",
  lampGlow: "255, 186, 84",
  glowAlpha: 0.5,
  leaf: "#3f7d5a",
  leafDark: "#2c5b42",
  pot: "#7a3f2c",
  book1: "#7b3b55",
  book2: "#2f5f8f",
  book3: "#b5832f",
  rain: "#bcd4ff",
  vignette: "#04060c",
};

function skyline(seed: number, base: number, minH: number, maxH: number, fill: string, lit: number, litColour: string) {
  const rng = mulberry32(seed);
  const out: ReactNode[] = [];
  let x = WIN.x - 20;
  let n = 0;
  while (x < WIN.x + WIN.w + 20) {
    const w = 36 + Math.round(rng() * 46);
    const h = minH + Math.round(rng() * (maxH - minH));
    out.push(<rect key={`b${n}`} x={x} y={base - h} width={w} height={h + 2} fill={fill} />);
    for (let wy = base - h + 10; wy < base - 8; wy += 14) {
      for (let wx = x + 6; wx < x + w - 8; wx += 12) {
        if (rng() < lit) {
          out.push(<rect key={`w${n}-${wx}-${wy}`} x={wx} y={wy} width={5} height={7} fill={litColour} opacity={0.85} />);
        }
      }
    }
    x += w + Math.round(rng() * 6);
    n++;
  }
  return out;
}

const STARS = (() => {
  const rng = mulberry32(5);
  return Array.from({ length: 34 }, (_, i) => ({
    i,
    x: Math.round(WIN.x + 10 + rng() * (WIN.w - 20)),
    y: Math.round(WIN.y + 8 + rng() * 170),
    s: rng() < 0.2 ? 3 : 2,
    d: Math.round(rng() * 34) / 10,
  }));
})();

const NIGHT_SCENE: SceneDef = {
  id: "cafe-night",
  label: "Night study cafe (placeholder)",
  layers: [
    {
      id: "sky",
      depth: 0.02,
      node: (
        <g>
          <defs>
            <linearGradient id="sc-sky-night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#070a14" />
              <stop offset="1" stopColor="#222c52" />
            </linearGradient>
          </defs>
          <rect width={SCENE_W} height={SCENE_H} fill="url(#sc-sky-night)" />
          {STARS.map((s) => (
            <rect
              key={s.i}
              x={s.x}
              y={s.y}
              width={s.s}
              height={s.s}
              fill="#e8eeff"
              className="sc-twinkle"
              style={css({ "--d": s.d })}
            />
          ))}
        </g>
      ),
    },
    { id: "far", depth: 0.1, node: <g>{skyline(21, WIN.y + WIN.h, 50, 120, "#111a36", 0.1, "#f4d03f")}</g> },
    {
      id: "near",
      depth: 0.22,
      node: (
        <g>
          {skyline(33, WIN.y + WIN.h + 4, 80, 170, "#0a1024", 0.22, "#ffd966")}
          {/* a neon sign, because it is Netcafe */}
          <rect x={WIN.x + 470} y={WIN.y + 214} width={46} height={10} rx={3} fill="#f0abfc" className="sc-twinkle" style={css({ "--d": 0.6 })} />
        </g>
      ),
    },
    {
      id: "rain",
      depth: 0.32,
      node: (
        <g>
          <WindowClip />
          <RainGlass colour={NIGHT.rain} />
        </g>
      ),
    },
    { id: "frame", depth: 0.45, node: <Frame p={NIGHT} /> },
    { id: "glow", depth: 0.55, node: <Glow p={NIGHT} /> },
    { id: "interior", depth: 0.75, node: <Interior p={NIGHT} /> },
    { id: "vignette", depth: 0, node: <Vignette colour={NIGHT.vignette} /> },
  ],
};

// ── day: the Sunny Cafe window ─────────────────────────────────────────────
const DAY: Palette = {
  wall: "#e6cfa6",
  wallShade: "#b99a6b",
  wood: "#a97c50",
  woodLight: "#d1a771",
  table: "#c79a66",
  tableEdge: "#e2bd8b",
  cup: "#fff6e5",
  cupInside: "#d9c19a",
  steam: "#ffffff",
  candle: "#f6ead0",
  flame: "#ffc247",
  lampShade: "#f5c243",
  lampGlow: "255, 214, 120",
  glowAlpha: 0.38,
  leaf: "#6e9f5b",
  leafDark: "#4f7d40",
  pot: "#b0553f",
  book1: "#c06a6a",
  book2: "#5f8fb8",
  book3: "#e0b34a",
  rain: "#6f93b8",
  vignette: "#6b4a2a",
};

const MOTES = (() => {
  const rng = mulberry32(8);
  return Array.from({ length: 16 }, (_, i) => ({
    i,
    x: Math.round(rng() * SCENE_W),
    y: Math.round(180 + rng() * 280),
    r: 1.5 + Math.round(rng() * 20) / 10,
    d: Math.round(rng() * 90) / 10,
  }));
})();

const DAY_SCENE: SceneDef = {
  id: "cafe-day",
  label: "Sunny cafe (placeholder)",
  layers: [
    {
      id: "sky",
      depth: 0.02,
      node: (
        <g>
          <defs>
            <linearGradient id="sc-sky-day" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a9d8ee" />
              <stop offset="1" stopColor="#fff1cf" />
            </linearGradient>
            <radialGradient id="sc-sun" cx="650" cy="120" r="110" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff7c2" stopOpacity={0.95} />
              <stop offset="1" stopColor="#fff7c2" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect width={SCENE_W} height={SCENE_H} fill="url(#sc-sky-day)" />
          <circle cx={650} cy={120} r={110} fill="url(#sc-sun)" />
          <circle cx={650} cy={120} r={30} fill="#fff4b0" />
          {[
            { x: 230, y: 110, d: 0 },
            { x: 420, y: 70, d: -14 },
            { x: 560, y: 160, d: -26 },
          ].map((c, i) => (
            <g key={i} className="sc-cloud" style={css({ "--d": c.d })}>
              <ellipse cx={c.x} cy={c.y} rx={56} ry={16} fill="#ffffff" opacity={0.85} />
              <ellipse cx={c.x - 26} cy={c.y + 4} rx={30} ry={12} fill="#ffffff" opacity={0.85} />
              <ellipse cx={c.x + 28} cy={c.y + 3} rx={34} ry={12} fill="#ffffff" opacity={0.85} />
            </g>
          ))}
          {/* overcast: the rain slider greys the sky */}
          <rect width={SCENE_W} height={SCENE_H} fill="#52667a" style={css({ opacity: "calc(var(--rain) * 0.3)" })} />
        </g>
      ),
    },
    {
      id: "far",
      depth: 0.1,
      node: (
        <path
          fill="#cfe3c4"
          d={`M${WIN.x - 20} ${WIN.y + WIN.h} V${WIN.y + 250} Q${WIN.x + 160} ${WIN.y + 180} ${WIN.x + 330} ${WIN.y + 240} T${WIN.x + 700} ${WIN.y + 220} T${WIN.x + WIN.w + 20} ${WIN.y + 250} V${WIN.y + WIN.h} Z`}
        />
      ),
    },
    {
      id: "near",
      depth: 0.22,
      node: (
        <g>
          <path
            fill="#a9c9a0"
            d={`M${WIN.x - 20} ${WIN.y + WIN.h} V${WIN.y + 290} Q${WIN.x + 200} ${WIN.y + 230} ${WIN.x + 380} ${WIN.y + 285} T${WIN.x + WIN.w + 20} ${WIN.y + 270} V${WIN.y + WIN.h} Z`}
          />
          {/* a small windmill on the hill: a placeholder wink at the real scene to come */}
          <g transform={`translate(${WIN.x + 540} ${WIN.y + 214})`}>
            <path d="M-9 70 L-5 12 H5 L9 70 Z" fill="#8c7458" />
            <g className="sc-blades">
              <rect x={-3} y={-34} width={6} height={92} fill="#f3ead4" />
              <rect x={-46} y={9} width={92} height={6} fill="#f3ead4" />
            </g>
            <circle cx={0} cy={12} r={5} fill="#6b563f" />
          </g>
        </g>
      ),
    },
    {
      id: "rain",
      depth: 0.32,
      node: (
        <g>
          <WindowClip />
          <RainGlass colour={DAY.rain} />
        </g>
      ),
    },
    { id: "frame", depth: 0.45, node: <Frame p={DAY} /> },
    { id: "glow", depth: 0.55, node: <Glow p={DAY} /> },
    {
      id: "motes",
      depth: 0.6,
      node: (
        <g>
          {MOTES.map((m) => (
            <circle key={m.i} cx={m.x} cy={m.y} r={m.r} fill="#fff6d8" opacity={0.7} className="sc-mote" style={css({ "--d": m.d })} />
          ))}
        </g>
      ),
    },
    { id: "interior", depth: 0.75, node: <Interior p={DAY} /> },
    { id: "vignette", depth: 0, node: <Vignette colour={DAY.vignette} /> },
  ],
};

// One scene per theme. Stage 2 replaces these two entries (Monstadt by day,
// Liyue by night) and the engine does not change; v1.5 adds more scenes.
export const SCENES: Record<ThemeName, SceneDef> = {
  "sunny-cafe": DAY_SCENE,
  "netcafe-night": NIGHT_SCENE,
};
