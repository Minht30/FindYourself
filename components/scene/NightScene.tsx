"use client";

import { useEffect, useMemo, useRef, type CSSProperties, type RefObject } from "react";
import { mulberry32 } from "@/lib/audio/rng";
import { useMixerStore } from "@/lib/audio/store";
import { FROST_FLOWER_RATIO, NIGHT_CLOUDS, NIGHT_FIXTURES, NIGHT_PICTURE, NIGHT_PLANTS, nightLayout } from "@/lib/scene/layout";
import { MAX_FLAKES, NIGHT_CALM, calmWind, dropsShown, frostSway, makeDrops, makeFlakes, stepWind, between } from "@/lib/scene/wind";
import { drawPrecip } from "./drawPrecip";
import { useFrameLoop, useGusts, useParallax, useStageFit } from "./sceneHooks";
import type { SceneVariant } from "./PaintedScene";
import { spawnDust, spawnShootingStar } from "./transients";

const SNOW_FLAKES = Math.round(0.7 * MAX_FLAKES); // the draft's default: 28 of at most 40
const GUST_STRENGTH = 0.6;

// Nod-Krai at night: the painted bay with a drifting aurora, a breathing moon, twinkling
// stars and the odd shooting star, flickering shore lights, a pulsing beacon, shimmering
// water, snow, swaying frost flowers and (on the Chill page) the moon-moth drifting
// across the bay. `chill` is false in Focus Mode, where the timer's spirit is the one
// that moves and the moth would compete with it.
export default function NightScene({ root, variant, active, reduced }: { root: RefObject<HTMLDivElement | null>; variant: SceneVariant; active: boolean; reduced: boolean }) {
  const chill = variant === "chill";
  const hero = variant === "hero"; // the light version: CSS motion only, no foreground, no loops
  const layout = useMemo(() => nightLayout(), []);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const moth = useRef<HTMLDivElement>(null);
  const plants = useRef<(HTMLDivElement | null)[]>([]);
  const wind = useRef(calmWind(NIGHT_CALM));
  const flakes = useRef(makeFlakes(mulberry32(21)));
  const drops = useRef(makeDrops(mulberry32(22)));
  const size = useRef({ W: 1, H: 1, dpr: 1 });
  const rain = useMixerStore((s) => s.settings.levels.rain);
  const rainRef = useRef(rain);
  rainRef.current = rain;
  const moving = active && !reduced && !hero;

  useStageFit("nodkrai-night", root, stage);
  useParallax(root, moving);
  useGusts(moving, true, wind, NIGHT_CALM, GUST_STRENGTH);

  // the canvas follows the scene's box
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

  // a shooting star every 14 to 26 s (the first after 4 s); dust trailing the moth
  useEffect(() => {
    if (!moving) return;
    const st = stage.current;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };
    const shoot = () => {
      if (!document.hidden && st) spawnShootingStar(st, Math.random);
      later(shoot, between(Math.random, 14000, 26000));
    };
    later(shoot, 4000);
    let dust = 0;
    if (chill) {
      dust = window.setInterval(() => {
        const el = root.current;
        const m = moth.current;
        if (!document.hidden && el && m) spawnDust(el, m, Math.random);
      }, 260);
    }
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearInterval(dust);
    };
  }, [moving, chill, root]);

  useFrameLoop(moving, (t, dt) => {
    wind.current = stepWind(wind.current, dt);
    const w = wind.current;
    layout.plants.forEach((m, i) => {
      const el = plants.current[i];
      if (el) el.style.transform = `rotate(${frostSway(t, { ...m, dir: NIGHT_PLANTS[i].dir }, w.value).toFixed(2)}deg)`;
    });
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const { W, H, dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPrecip(ctx, { flakes: flakes.current, drops: drops.current, snow: SNOW_FLAKES, rain: dropsShown(rainRef.current), wind: w.value, gusting: w.gusting, dt, W, H, rng: Math.random, rainColour: "rgba(190,210,255,0.5)" });
  });

  return (
    <>
      <div className="ps-layer" data-depth="8">
        <div ref={stage} className="ps-stage" style={{ width: NIGHT_PICTURE.w, height: NIGHT_PICTURE.h }}>
          <div className="ps-wall" />
          <div>
            {layout.stars.map((s, i) => (
              <i key={i} className="ps-star" style={{ left: s.x, top: s.y, width: s.size, height: s.size, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }} />
            ))}
          </div>
          <div className="ps-abs ps-aurora" style={{ left: NIGHT_FIXTURES.auroraA.x, top: NIGHT_FIXTURES.auroraA.y, width: NIGHT_FIXTURES.auroraA.w, height: NIGHT_FIXTURES.auroraA.h }} />
          <div className="ps-abs ps-aurora ps-aurora-b" style={{ left: NIGHT_FIXTURES.auroraB.x, top: NIGHT_FIXTURES.auroraB.y, width: NIGHT_FIXTURES.auroraB.w, height: NIGHT_FIXTURES.auroraB.h, transform: "scaleX(-1)" }} />
          <div className="ps-abs ps-moonhalo" style={{ left: NIGHT_FIXTURES.moon.x, top: NIGHT_FIXTURES.moon.y }} />
          <div className="ps-abs ps-moonring" style={{ left: NIGHT_FIXTURES.moon.x, top: NIGHT_FIXTURES.moon.y }} />
          <div className="ps-abs ps-beacon" style={{ left: NIGHT_FIXTURES.beacon.x, top: NIGHT_FIXTURES.beacon.y }} />
          <div className="ps-abs ps-lamp" style={{ left: NIGHT_FIXTURES.lamp.x, top: NIGHT_FIXTURES.lamp.y }} />
          <div>
            {layout.shore.map((w, i) => (
              <i key={i} className="ps-win" style={{ left: w.x, top: w.y, animationDuration: `${w.dur}s`, animationDelay: `${w.delay}s` }} />
            ))}
          </div>
          <div>
            {layout.glints.map((g, i) => (
              <i key={i} className={`ps-glint${g.warm ? " ps-glint-warm" : ""}`} style={{ left: g.x, top: g.y, width: g.w, animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="ps-layer" data-depth="10">
        {NIGHT_CLOUDS.map((c, i) => (
          <div
            key={c.file}
            className="ps-cloud"
            style={{ top: `${c.top}vh`, width: c.w, height: Math.round(c.w / c.ratio), backgroundImage: `url(/assets/world/NodKrai_Night/${c.file})`, animationDuration: `${c.dur}s`, animationDelay: `${-((i * 0.37) % 1) * c.dur}s`, "--co": c.opacity } as CSSProperties}
          />
        ))}
      </div>

      {chill ? (
        <div className="ps-layer" data-depth="16" style={{ pointerEvents: "none" }}>
          <div ref={moth} className="ps-moth">
            <div className="ps-moth-glow" />
            <div className="ps-moth-img" />
          </div>
        </div>
      ) : null}

      {hero ? null : (
      <div className="ps-layer">
        {NIGHT_PLANTS.map((p, i) => (
          <div
            key={i}
            ref={(el) => void (plants.current[i] = el)}
            className="ps-ff"
            style={{ left: `${p.x}vw`, "--h": `${p.h}vh`, "--w": `${(p.h * FROST_FLOWER_RATIO).toFixed(1)}vh`, "--d": `${(-i * 1.1).toFixed(1)}s`, marginLeft: p.dir < 0 ? "-6vh" : undefined } as CSSProperties}
          >
            <div className="ps-ff-pic" style={{ transform: p.dir < 0 ? "scaleX(-1)" : undefined }} />
          </div>
        ))}
      </div>

      )}

      {hero ? null : <canvas ref={canvas} className="ps-canvas" />}
      <div className="ps-vignette" />
    </>
  );
}
