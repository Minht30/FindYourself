import { useId, type CSSProperties } from "react";
import Image from "next/image";
import type { SpiritState } from "@/lib/focus/arc";

// The timer's companion: a faceless dandelion seed by day (drawn here, an original
// vector: 24 fine filaments with small tips round a pale core and a pale aqua halo)
// and the moon-moth at night. Both are in the markup and CSS shows the one that
// matches the theme (.for-*), so there is no wait for a script. What it does is set
// by `state` (see "The timer ring and its spirit" in globals.css).
export default function Spirit({ state, size = 62, inline = false }: { state: SpiritState; size?: number; inline?: boolean }) {
  return (
    <span className={`spirit${inline ? " spirit-inline" : ""}`} data-state={state} style={{ "--spirit": `${size}px` } as CSSProperties} aria-hidden>
      <span className="spirit-body">
        <span className="spirit-art for-nodkrai-night">
          <Image src="/assets/world/NodKrai_Night/nodkrai-moth-spirit.svg" alt="" width={260} height={260} />
        </span>
        <span className="spirit-art for-monstadt">
          <DandelionSeed />
        </span>
      </span>
      {state === "cheer" && !inline ? Array.from({ length: 8 }, (_, i) => <span key={i} className="spirit-spark" style={{ "--i": i } as CSSProperties} />) : null}
    </span>
  );
}

const FILAMENTS = 24;
const f2 = (n: number) => n.toFixed(2);

function DandelionSeed() {
  const id = useId();
  const halo = `${id}-halo`;
  const core = `${id}-core`;
  const lines = Array.from({ length: FILAMENTS }, (_, i) => {
    const rad = (i * 2 * Math.PI) / FILAMENTS;
    const [sin, cos] = [Math.sin(rad), Math.cos(rad)];
    // a little length variety, so it reads as a seed head and not a clock face
    const reach = i % 2 === 0 ? 27 : 24;
    return { x1: 32 + 7 * sin, y1: 32 - 7 * cos, x2: 32 + reach * sin, y2: 32 - reach * cos };
  });
  return (
    <svg viewBox="0 0 64 64" focusable="false">
      <defs>
        <radialGradient id={halo}>
          <stop offset="0" stopColor="#CBFEFE" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#B8FEFC" stopOpacity="0.28" />
          <stop offset="1" stopColor="#B8FEFC" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={core} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#FAFFFF" />
          <stop offset="1" stopColor="#BDEBEC" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${halo})`} />
      <g className="spirit-turn">
        {lines.map((l, i) => (
          <g key={i}>
            <line x1={f2(l.x1)} y1={f2(l.y1)} x2={f2(l.x2)} y2={f2(l.y2)} stroke="#8FD9CC" strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />
            <circle cx={f2(l.x2)} cy={f2(l.y2)} r="1.25" fill="#E6FFFF" stroke="#8FD9CC" strokeWidth="0.4" />
          </g>
        ))}
      </g>
      <circle cx="32" cy="32" r="9" fill="#9BE6D7" opacity="0.22" />
      <circle cx="32" cy="32" r="5.5" fill={`url(#${core})`} />
    </svg>
  );
}
