"use client";

import type { CSSProperties, ReactNode } from "react";
import { litCells, trackCells } from "@/lib/focus/ring";
import type { Phase, Status } from "@/lib/focus/timer";
import PixelSprite from "./PixelSprite";
import {
  CAT_CHEER,
  CAT_H,
  CAT_IDLE,
  CAT_PALETTE,
  CAT_RUN,
  CAT_SLEEP,
  CAT_W,
  SLEEP_H,
  SLEEP_W,
} from "./sprites";

// Geometry, in CSS px (the SVG renders at 1:1, so every sprite pixel is a whole
// number of screen pixels and stays crisp).
const N = 22; // cells per side
const U = 10; // cell pitch
const BEAD = 8; // drawn cell size (the rest is the gap)
const M = 50; // room around the track for the cat, which runs on the outside
const PX = 3; // screen px per sprite pixel
const SIDE = (N - 1) * U; // distance between first and last cell centres
const SIZE = N * U + 2 * M;
const CELLS = trackCells(N);
const LAP_SECONDS = 14;

const X0 = M + U / 2;
const X1 = X0 + SIDE;
const Y0 = X0;
const Y1 = X1;

// A tiny 4x4 "z" that floats up from the sleeping cat.
const Z_GRID = ["####", "..#.", ".#..", "####"];

// The square pixel track with the cat on it.
//   focus + running  the cat runs laps round the outside
//   focus + paused   it sits down where it stopped
//   focus + idle     it waits at the start
//   any break        it curls up asleep (z z z while the break runs)
//   just finished    a little cheer hop
// Cells light up clockwise as the phase progresses; `children` is the clock,
// centred inside the loop.
export default function TimerRing({
  phase,
  status,
  progress,
  cheer = false,
  scale = 1,
  children,
}: {
  phase: Phase;
  status: Status;
  progress: number;
  cheer?: boolean;
  // Whole numbers only, so every sprite pixel stays a whole number of screen pixels.
  scale?: 1 | 2;
  children?: ReactNode;
}) {
  const isBreak = phase !== "focus";
  const lit = litCells(progress, CELLS.length, status !== "idle");
  const running = status === "running";

  const lapStyle = {
    "--x0": `${X0}px`,
    "--x1": `${X1}px`,
    "--y0": `${Y0}px`,
    "--y1": `${Y1}px`,
    animationDuration: `${LAP_SECONDS}s`,
    animationPlayState: running && !isBreak ? "running" : "paused",
  } as CSSProperties;

  // Where the sleeping / cheering cat sits: centred on the top edge.
  const topMid = `translate(${M + (N * U) / 2}px, ${Y0}px)`;

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: SIZE * scale, containerType: "inline-size" }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        shapeRendering="crispEdges"
        className="block w-full h-auto overflow-visible"
        role="img"
        aria-label={`${isBreak ? "Break" : "Focus"} track, ${Math.round(progress * 100)} percent complete`}
      >
        {CELLS.map((c, i) => {
          const on = i < lit;
          const head = on && i === lit - 1;
          return (
            <rect
              key={i}
              x={M + c.col * U + (U - BEAD) / 2}
              y={M + c.row * U + (U - BEAD) / 2}
              width={BEAD}
              height={BEAD}
              style={{ fill: on ? (isBreak ? "var(--pix-break)" : "var(--pix-track-lit)") : "var(--pix-track)" }}
              opacity={head && running ? undefined : 1}
              className={head && running ? "pix-head" : undefined}
            />
          );
        })}

        {cheer ? (
          <g style={{ transform: topMid }}>
            <g transform={`translate(${-(CAT_W * PX) / 2} ${-(CAT_H * PX)})`} className="pix-cat">
              <PixelSprite frames={CAT_CHEER} palette={CAT_PALETTE} px={PX} fps={4} />
            </g>
          </g>
        ) : isBreak ? (
          <g style={{ transform: topMid }}>
            <g transform={`translate(${-(SLEEP_W * PX) / 2} ${-(SLEEP_H * PX)})`} className="pix-cat">
              <PixelSprite frames={CAT_SLEEP} palette={CAT_PALETTE} px={PX} fps={0.7} />
            </g>
            {running &&
              [0, 1, 2].map((i) => (
                <g key={i} className="pix-z" style={{ animationDelay: `${i * 1.05}s` } as CSSProperties}>
                  <g transform={`translate(${14 + i * 3} ${-(SLEEP_H * PX) - 4})`}>
                    {Z_GRID.map((row, y) =>
                      [...row].map((ch, x) =>
                        ch === "#" ? (
                          <rect key={`${x}-${y}`} x={x * 2} y={y * 2} width={2} height={2} style={{ fill: "var(--ink-secondary)" }} />
                        ) : null,
                      ),
                    )}
                  </g>
                </g>
              ))}
          </g>
        ) : (
          <g key={status === "idle" ? "idle" : "live"} className="pix-lap" style={lapStyle}>
            <g transform={`translate(${-(CAT_W * PX) / 2} ${-(CAT_H * PX)})`} className="pix-cat">
              {running ? (
                  <PixelSprite frames={CAT_RUN} palette={CAT_PALETTE} px={PX} fps={6} />
                ) : (
                  <PixelSprite frames={CAT_IDLE} palette={CAT_PALETTE} px={PX} fps={1.2} />
                )}
            </g>
          </g>
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="pointer-events-auto">{children}</div>
      </div>
    </div>
  );
}
