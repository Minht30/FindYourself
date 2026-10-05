// Browser notifications are opt-in. Permission is asked only when the user
// flips the switch in settings (a real gesture), never as a surprise on Start.
// A notification is shown only while the tab is hidden: when the user is
// looking at the page, the page itself is the cue.

export type NotifyState = NotificationPermission | "unsupported";

export function notifyState(): NotifyState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotifications(): Promise<NotifyState> {
  if (notifyState() === "unsupported") return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return notifyState();
  }
}

export function showNotification(title: string, body: string) {
  if (notifyState() !== "granted" || !document.hidden) return;
  try {
    const n = new Notification(title, { body, tag: "fy-focus", silent: true });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // some mobile browsers only allow notifications from a service worker
  }
}
