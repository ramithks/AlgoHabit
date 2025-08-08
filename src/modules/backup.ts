import { store } from "./state";

export function exportProgress() {
  try {
    const raw = localStorage.getItem("dsa-habit-progress-v1");
    const streak = localStorage.getItem("dsa-habit-streak-v1");
    const last = localStorage.getItem("dsa-habit-last-active");
    const xp = localStorage.getItem("dsa-habit-xp-v1");
    const ach = localStorage.getItem("dsa-habit-achievements-v1");
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { raw, streak, last, xp, ach },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dsa-habit-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export function importProgress(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const txt = reader.result as string;
        const parsed = JSON.parse(txt);
        if (parsed && parsed.data) {
          const { raw, streak, last, xp, ach } = parsed.data;
          if (raw) localStorage.setItem("dsa-habit-progress-v1", raw);
          if (streak) localStorage.setItem("dsa-habit-streak-v1", streak);
          if (last) localStorage.setItem("dsa-habit-last-active", last);
          if (xp) localStorage.setItem("dsa-habit-xp-v1", xp);
          if (ach) localStorage.setItem("dsa-habit-achievements-v1", ach);
          // crude reload
          window.location.reload();
          resolve(true);
          return;
        }
      } catch {}
      resolve(false);
    };
    reader.readAsText(file);
  });
}
