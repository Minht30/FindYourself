// A repeating timer that keeps going in a background tab. Plain setInterval is
// throttled to once a second (and, after a few minutes hidden, once a minute),
// which would starve the layers of upcoming events and leave the rain without
// droplets. A Worker's timer is not throttled that way. If workers are not
// available (or blocked by a content policy) it quietly falls back to setInterval.

export function createTicker(fn: () => void, ms: number): () => void {
  let stopped = false;
  let fallback: number | null = null;
  const startFallback = () => {
    if (!stopped && fallback === null) fallback = window.setInterval(fn, ms);
  };

  let worker: Worker | null = null;
  let url: string | null = null;
  try {
    url = URL.createObjectURL(new Blob([`setInterval(function(){postMessage(0)},${ms})`], { type: "text/javascript" }));
    worker = new Worker(url);
    worker.onmessage = () => {
      if (!stopped) fn();
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = null;
      startFallback();
    };
  } catch {
    startFallback();
  }

  return () => {
    stopped = true;
    worker?.terminate();
    if (url) URL.revokeObjectURL(url);
    if (fallback !== null) window.clearInterval(fallback);
  };
}
