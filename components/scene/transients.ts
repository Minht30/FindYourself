import { LEAF_COLOURS } from "@/lib/scene/layout";
import { between, type Rng } from "@/lib/scene/wind";

// The short-lived things in the scenes: a bird crossing, a leaf blown across in a
// gust, a shooting star, a trail of dust behind the moth. Each is a small element
// that animates once (Web Animations) and removes itself, so nothing piles up.
// All of them are skipped where the browser cannot animate (and under reduced motion
// the scene never calls them).
const canAnimate = (el: Element) => typeof el.animate === "function";

function fly(container: HTMLElement, el: HTMLElement, frames: Keyframe[], opts: KeyframeAnimationOptions) {
  container.appendChild(el);
  if (!canAnimate(el)) return el.remove();
  const a = el.animate(frames, opts);
  a.onfinish = () => el.remove();
}

export function spawnBird(container: HTMLElement, rng: Rng, colour: string) {
  const b = document.createElement("div");
  b.className = "ps-fly";
  const sz = between(rng, 26, 40);
  b.innerHTML = `<svg width="${sz}" height="${sz * 0.42}" viewBox="0 0 24 10" fill="none" stroke="${colour}" stroke-width="1.5" stroke-linecap="round"><path d="M1 8 Q6 0 12 6 Q18 0 23 8"/></svg>`;
  const y = between(rng, 8, 40);
  fly(container, b, [{ transform: `translate(-6vw, ${y}vh)` }, { transform: `translate(110vw, ${y - between(rng, 4, 14)}vh)` }], { duration: between(rng, 10, 18) * 1000, easing: "linear" });
  // the wings: a quick flap
  const svg = b.firstElementChild as SVGElement | null;
  if (svg && canAnimate(svg)) svg.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(0.35)" }], { duration: 360, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
}

export function spawnLeaf(container: HTMLElement, rng: Rng) {
  const l = document.createElement("div");
  l.className = "ps-fly";
  const sz = between(rng, 12, 26);
  const col = LEAF_COLOURS[Math.floor(rng() * LEAF_COLOURS.length)];
  l.innerHTML = `<svg width="${sz}" height="${sz * 0.6}" viewBox="0 0 16 10"><path d="M0 5 C4 -2 12 -2 16 5 C12 12 4 12 0 5Z" fill="${col}"/><path d="M1 5 L15 5" stroke="rgba(0,0,0,.25)" stroke-width=".6"/></svg>`;
  const y = between(rng, 15, 85);
  fly(
    container,
    l,
    [
      { transform: `translate(-6vw, ${y}vh) rotate(0deg)`, opacity: 0 },
      { opacity: 1, offset: 0.08 },
      { transform: `translate(112vw, ${y - between(rng, 8, 34)}vh) rotate(${between(rng, 700, 1200)}deg)`, opacity: 1 },
    ],
    { duration: between(rng, 2000, 3800), easing: "cubic-bezier(.3,.1,.7,.9)" },
  );
}

// A shooting star in the painting's own space (appended to the stage).
export function spawnShootingStar(stage: HTMLElement, rng: Rng) {
  const s = document.createElement("i");
  s.className = "ps-abs";
  s.style.cssText = `left:${between(rng, 200, 1100).toFixed(0)}px;top:${between(rng, 30, 200).toFixed(0)}px;width:120px;height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(255,255,255,0),#fff);transform-origin:100% 50%`;
  fly(
    stage,
    s,
    [{ transform: "translate(0,0) rotate(24deg)", opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: "translate(300px,134px) rotate(24deg)", opacity: 0 }],
    { duration: 1100, easing: "ease-in" },
  );
}

// A speck of gold dust falling from the moth, placed where the moth is on the screen.
export function spawnDust(root: HTMLElement, moth: HTMLElement, rng: Rng) {
  const r = moth.getBoundingClientRect();
  const box = root.getBoundingClientRect();
  if (!r.width) return;
  const d = document.createElement("i");
  d.className = "ps-dust";
  const sz = between(rng, 2.5, 5);
  d.style.cssText = `left:${(r.left - box.left + r.width / 2 + between(rng, -14, 14)).toFixed(0)}px;top:${(r.top - box.top + r.height * 0.8 + between(rng, -6, 8)).toFixed(0)}px;width:${sz}px;height:${sz}px`;
  fly(root, d, [{ opacity: 0.9, transform: "translate(0,0)" }, { opacity: 0, transform: `translate(${between(rng, -14, 14)}px,${between(rng, 24, 50)}px)` }], { duration: between(rng, 1800, 2800), easing: "ease-out" });
}
