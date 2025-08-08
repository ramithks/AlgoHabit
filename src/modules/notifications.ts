// Local notification helper without external services.
// Capabilities: request permission, immediate notify, simple in-page scheduled reminders (volatile until reload), SW messaging.

interface ScheduledReminder {
  id: string;
  time: number; // epoch ms
  title: string;
  body?: string;
  timeoutId?: number;
}

const reminders: ScheduledReminder[] = [];

export async function ensureServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        console.log("[notif] registering service worker");
        await navigator.serviceWorker.register("/sw.js");
      } else {
        console.log("[notif] existing service worker found");
      }
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[notif] service worker controller ready");
      });
    } catch (e) {
      console.warn("SW registration failed", e);
    }
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  return perm;
}

export async function showImmediateNotification(title: string, body?: string) {
  const perm = await requestNotificationPermission();
  if (perm !== "granted") return false;
  if (navigator.serviceWorker?.controller) {
    console.log("[notif] posting message to active SW");
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      title,
      body,
    });
  } else if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      console.log(
        "[notif] using registration.showNotification (no controller yet)"
      );
      reg.showNotification(title, {
        body,
        icon: "/favicon.svg",
        tag: "dsa-habit",
      });
    } else {
      console.log("[notif] fallback direct Notification (no registration)");
      new Notification(title, { body });
    }
  } else {
    console.log("[notif] direct Notification (no SW support)");
    new Notification(title, { body });
  }
  return true;
}

export function scheduleLocalReminder(
  delayMs: number,
  title: string,
  body?: string
) {
  const id = `rem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const when = Date.now() + delayMs;
  const timeoutId = window.setTimeout(() => {
    showImmediateNotification(title, body);
    const idx = reminders.findIndex((r) => r.id === id);
    if (idx >= 0) reminders.splice(idx, 1);
  }, delayMs);
  reminders.push({ id, time: when, title, body, timeoutId });
  return id;
}

export function cancelReminder(id: string) {
  const idx = reminders.findIndex((r) => r.id === id);
  if (idx >= 0) {
    const r = reminders[idx];
    if (r.timeoutId) clearTimeout(r.timeoutId);
    reminders.splice(idx, 1);
    return true;
  }
  return false;
}

export function listReminders() {
  return reminders.slice().sort((a, b) => a.time - b.time);
}
