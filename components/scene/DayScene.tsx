"use client";

import { useEffect, useId, useMemo, useRef, type CSSProperties, type RefObject } from "react";
import { mulberry32 } from "@/lib/audio/rng";
import { useMixerStore } from "@/lib/audio/store";
import { CLOUD_RATIO, DAY_CLOUDS, DAY_PICTURE, DAY_PLANTS, dayLayout } from "@/lib/scene/layout";
import { DAY_CALM, calmWind, dropsShown, easeSpeed, fanBend, leafFlutter, makeDrops, makeFlakes, spinTarget, stepAngle, stepWind } from "@/lib/scene/wind";
import { drawPrecip } from "./drawPrecip";
import { useFrameLoop, useGusts, useParallax, useStageFit } from "./sceneHooks";
import type { SceneVariant } from "./PaintedScene";
import { spawnBird, spawnLeaf } from "./transients";

const GUST_STRENGTH = 0.6;

type PlantEls = { lower: HTMLDivElement | null; upper: HTMLDivElement | null; head: HTMLDivElement | null; leafA: HTMLDivElement | null; leafB: HTMLDivElement | null };

// Monstadt by day: the painted valley with clouds crossing, a warm haze and light rays,
// dandelion seeds drifting up and across, birds, and fan flowers in the foreground whose
// stems bend with the wind and whose heads spin like pinwheels; a gust speeds all of it
// up and blows leaves across. `chill` is false in Focus Mode, where the timer's spirit
// is the one that moves, so there are no seeds, birds or leaves.
export default function DayScene({ root, variant, active, reduced }: { root: RefObject<HTMLDivElement | null>; variant: SceneVariant; active: boolean; reduced: boolean }) {
  const chill = variant === "chill";
  const hero = variant === "hero"; // the light version: CSS motion only, no foreground, no loops
  const id = useId();
  const layout = useMemo(() => dayLayout(), []);
  const stage = useRef<HTMLDivElement>(null);
  const flyers = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const els = useRef<PlantEls[]>([]);
  const wind = useRef(calmWind(DAY_CALM));
  const angles = useRef(layout.plants.map((p) => p.angle));
  const speeds = useRef(layout.plants.map(() => 70));
  const flakes = useRef(makeFlakes(mulberry32(31), 1));
  const drops = useRef(makeDrops(mulberry32(32)));
  const size = useRef({ W: 1, H: 1, dpr: 1 });
  const rain = useMixerStore((s) => s.settings.levels.rain);
  const rainRef = useRef(rain);
  rainRef.current = rain;
  const moving = active && !reduced && !hero;

  useStageFit("monstadt", root, stage);
  useParallax(root, moving);
  useGusts(moving, false, wind, DAY_CALM, GUST_STRENGTH, () => {
    const box = flyers.current;
    if (!chill || !box) return;
    const n = Math.round(8 + 14 * GUST_STRENGTH);
    for (let i = 0; i < n; i++) window.setTimeout(() => (!document.hidden ? spawnLeaf(box, Math.random) : undefined), i * (4200 / n));
  });

  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size.current = { W: r.width, H: r.height, dpr };
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [root]);

  // a bird every 6 s
  useEffect(() => {
    if (!moving || !chill) return;
    const box = flyers.current;
    if (!box) return;
    const go = () => (!document.hidden ? spawnBird(box, Math.random, "#1E384F") : undefined);
    const first = window.setTimeout(go, 1000);
    const every = window.setInterval(go, 6000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [moving, chill]);

  useFrameLoop(moving, (t, dt) => {
    wind.current = stepWind(wind.current, dt);
    const w = wind.current;
    layout.plants.forEach((m, i) => {
      const e = els.current[i];
      if (!e) return;
      const { lower, upper } = fanBend(t, DAY_PLANTS[i].a, w.value);
      if (e.lower) e.lower.style.transform = `rotate(${lower.toFixed(2)}deg)`;
      if (e.upper) e.upper.style.transform = `rotate(${upper.toFixed(2)}deg)`;
      const sides = i % 2 ? ["left", "right"] : ["right", "left"];
      if (e.leafA) e.leafA.style.transform = `rotate(${leafFlutter(t, sides[0] === "right" ? -32 : 32, w.value, m.leafPhase[0]).toFixed(2)}deg)`;
      if (e.leafB) e.leafB.style.transform = `rotate(${leafFlutter(t, sides[1] === "right" ? -26 : 26, w.value, m.leafPhase[1]).toFixed(2)}deg)`;
      speeds.current[i] = easeSpeed(speeds.current[i], spinTarget(w.gusting, GUST_STRENGTH, m.k, false), dt);
      angles.current[i] = stepAngle(angles.current[i], speeds.current[i], DAY_PLANTS[i].dir, dt);
      if (e.head) e.head.style.transform = `rotate(${angles.current[i].toFixed(1)}deg)`;
    });
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const { W, H, dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPrecip(ctx, { flakes: flakes.current, drops: drops.current, snow: 0, rain: dropsShown(rainRef.current), wind: w.value, gusting: w.gusting, dt, W, H, rng: Math.random, rainColour: "rgba(255,255,255,0.55)" });
  });

  const stem = `url(#${id}-stem)`;
  const leafFill = `url(#${id}-leaf)`;
  const stemSvg = (
    <svg className="ps-stem" viewBox="0 0 14 100" preserveAspectRatio="none">
      <path d="M2 100 C3.5 70 5.2 30 5.6 0 L8.4 0 C8.8 30 10.5 70 12 100 Z" fill={stem} stroke="rgba(40,70,30,.35)" strokeWidth=".6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
  const leaf = (side: "left" | "right", pos: number, ref: (el: HTMLDivElement | null) => void) => (
    <div ref={ref} className={`ps-leaf ps-leaf-${side}`} style={{ bottom: `${pos}%` }}>
      <svg viewBox="0 0 64 22" width="64" height="22" style={{ transform: side === "left" ? "scaleX(-1)" : undefined }}>
        <path d="M0 11 C12 1 40 0 64 11 C40 21 12 21 0 11Z" fill={leafFill} stroke="rgba(40,70,30,.3)" strokeWidth=".6" />
        <path d="M2 11 C20 9 44 9.5 60 11" stroke="rgba(255,255,255,.35)" strokeWidth=".8" fill="none" />
      </svg>
    </div>
  );

  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <linearGradient id={`${id}-stem`} x1="0" x2="1">
            <stop offset="0" stopColor="#4F7A3A" />
            <stop offset=".5" stopColor="#8DB35B" />
            <stop offset="1" stopColor="#58823F" />
          </linearGradient>
          <linearGradient id={`${id}-leaf`} x1="0" x2="1">
            <stop offset="0" stopColor="#4F7A3A" />
            <stop offset="1" stopColor="#A5CC6A" />
          </linearGradient>
          <radialGradient id={`${id}-ph`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#F2FDFD" stopOpacity=".55" />
            <stop offset=".5" stopColor="#C9F1F2" stopOpacity=".32" />
            <stop offset="1" stopColor="#9BE6D7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-pb`} cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor="#FAFFFF" />
            <stop offset=".6" stopColor="#E2F8F8" />
            <stop offset="1" stopColor="#BDEBEC" />
          </radialGradient>
          <symbol id={`${id}-puff`} viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="23" fill={`url(#${id}-ph)`} />
            {Array.from({ length: 24 }, (_, i) => {
              const a = (i * 15 * Math.PI) / 180;
              const r2 = i % 2 ? 16.5 : 20;
              const [c, s] = [Math.cos(a), Math.sin(a)];
              const p = { x1: (24 + 8 * c).toFixed(1), y1: (24 + 8 * s).toFixed(1), x2: (24 + r2 * c).toFixed(1), y2: (24 + r2 * s).toFixed(1) };
              return (
                <g key={i}>
                  <line {...p} stroke="#8FD6D8" strokeOpacity=".35" strokeWidth="1.9" strokeLinecap="round" />
                  <line {...p} stroke="#F1FCFC" strokeOpacity=".9" strokeWidth=".9" strokeLinecap="round" />
                  <circle cx={p.x2} cy={p.y2} r="1.15" fill="#F1FCFC" fillOpacity=".9" />
                </g>
              );
            })}
            <circle cx="24" cy="24" r="8.6" fill={`url(#${id}-pb)`} stroke="#9FDDE0" strokeOpacity=".7" strokeWidth=".8" />
          </symbol>
        </defs>
      </svg>

      <div className="ps-layer" data-depth="8">
        <div ref={stage} className="ps-stage" style={{ width: DAY_PICTURE.w, height: DAY_PICTURE.h }}>
          <div className="ps-wall" />
        </div>
      </div>

      <div className="ps-layer" data-depth="10">
        {DAY_CLOUDS.map((c, i) => (
          <div key={i} className="ps-cloud" style={{ top: `${c.top}vh`, width: c.w, height: Math.round(c.w / CLOUD_RATIO), animationDuration: `${c.dur}s`, animationDelay: `${-((i * 0.37) % 1) * c.dur}s`, "--co": 0.9 - i * 0.05 } as CSSProperties} />
        ))}
      </div>

      <div className="ps-layer ps-haze" />
      <div className="ps-layer ps-rays" />

      {chill ? (
        <div className="ps-layer" data-depth="22">
          {layout.seeds.map((s, i) => (
            <div key={i} className="ps-seed" style={{ "--y0": `${s.y0}vh`, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s`, opacity: s.opacity } as CSSProperties}>
              <svg width={s.size} height={s.size} style={{ animationDuration: `${s.bobDur}s`, animationDelay: `${s.bobDelay}s` }}>
                <use href={`#${id}-puff`} />
              </svg>
            </div>
          ))}
        </div>
      ) : null}

      <div ref={flyers} className="ps-flyers" />

      {hero ? null : (
      <div className="ps-layer">
        {DAY_PLANTS.map((p, i) => {
          const sides = i % 2 ? (["left", "right"] as const) : (["right", "left"] as const);
          const e = (els.current[i] ??= { lower: null, upper: null, head: null, leafA: null, leafB: null });
          return (
            <div key={i} className="ps-plant" style={{ left: `${p.x}vw`, "--h": `${p.h}vh`, "--s": `${p.s}px` } as CSSProperties}>
              <div ref={(el) => void (e.lower = el)} className="ps-seg ps-seg1">
                {stemSvg}
                {leaf(sides[0], 34, (el) => void (e.leafA = el))}
                <div ref={(el) => void (e.upper = el)} className="ps-seg ps-seg2">
                  {stemSvg}
                  {leaf(sides[1], 40, (el) => void (e.leafB = el))}
                  <div ref={(el) => void (e.head = el)} className="ps-head" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      )}

      {hero ? null : <canvas ref={canvas} className="ps-canvas" />}
      <div className="ps-vignette" />
    </>
  );
}
