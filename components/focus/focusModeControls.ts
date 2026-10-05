import { useFocusStore } from "@/lib/focus/store";

// Open / close Focus Mode. Entering also asks the browser for real fullscreen,
// which is best effort: it must come from a user gesture (call this from a
// click or key handler), and a browser that refuses still gets the full-window
// overlay.
export function openFocusMode() {
  useFocusStore.getState().setFocusMode(true);
  try {
    void document.documentElement.requestFullscreen?.().catch(() => {});
  } catch {
    // no fullscreen: the overlay alone is fine
  }
}

export function closeFocusMode() {
  useFocusStore.getState().setFocusMode(false);
  try {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  } catch {}
}
