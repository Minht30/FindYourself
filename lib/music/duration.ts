// How long is this audio file? Asks the browser's own decoder (an <audio>
// element on a temporary object URL). null when it cannot tell: an unreadable
// file, an endless stream (Infinity), or no answer within the timeout.
export function readDuration(file: Blob, timeoutMs = 8000): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof Audio === "undefined" || typeof URL === "undefined") return resolve(null);
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    let done = false;
    const finish = (v: number | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
      resolve(v);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? audio.duration : null);
    audio.onerror = () => finish(null);
    audio.src = url;
  });
}
