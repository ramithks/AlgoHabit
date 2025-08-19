import React from "react";

type TabKey = "general" | "preferences" | "data" | "about";

export const SettingsPanel: React.FC<{
  onClose: () => void;
  userEmail: string | null;
  userId?: string | null;
  onReset: () => void;
  onLogout: () => void;
  onSyncNow?: () => void;
  prefFocusDefault: boolean;
  onToggleFocusDefault: () => void;
  prefDisableConfetti: boolean;
  onToggleDisableConfetti: () => void;
  prefReducedMotion: boolean;
  onToggleReducedMotion: () => void;
  prefSfx?: boolean;
  onToggleSfx?: () => void;
  prefHighContrast?: boolean;
  onToggleHighContrast?: () => void;
  statsSummary: { complete: number; total: number; streak: number; xp: number };
}> = ({
  onClose,
  userEmail: _userEmail,
  userId,
  onReset,
  onLogout,
  onSyncNow,
  prefFocusDefault,
  onToggleFocusDefault,
  prefDisableConfetti,
  onToggleDisableConfetti,
  prefReducedMotion,
  onToggleReducedMotion,
  prefSfx,
  onToggleSfx,
  prefHighContrast,
  onToggleHighContrast,
  statsSummary,
}) => {
  const [confirming, setConfirming] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>("general");
  const [resetText, setResetText] = React.useState("");
  const tz = React.useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    []
  );
  const locale = typeof navigator !== "undefined" ? navigator.language : "";
  const storageBytes = React.useMemo(() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("dsa-")) continue;
        const val = localStorage.getItem(key) ?? "";
        total += new Blob([val]).size + new Blob([key]).size;
      }
      return total;
    } catch {
      return 0;
    }
  }, []);
  const formatBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  };
  const done = statsSummary.complete;
  const total = statsSummary.total;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="relative w-full sm:w-[720px] max-w-full rounded-2xl overflow-hidden ring-1 ring-gray-700 bg-gray-900 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/80 backdrop-blur">
          <h2
            id="settings-title"
            className="text-sm font-semibold text-gray-200 flex items-center gap-2"
          >
            Settings{" "}
            <span className="text-[10px] text-gray-500">
              Profile & Preferences
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-sm"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Mobile Tabs */}
        <div className="sm:hidden px-3 pt-3">
          <div className="grid grid-cols-4 gap-2 text-[11px]">
            {[
              { k: "general", label: "General" },
              { k: "preferences", label: "Prefs" },
              { k: "data", label: "Data" },
              { k: "about", label: "About" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as TabKey)}
                className={`px-2 py-1 rounded border transition ${
                  tab === t.k
                    ? "bg-accent/10 border-accent/40 text-accent"
                    : "bg-gray-800/60 border-gray-700/60 text-gray-300 hover:border-gray-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 sm:grid-cols-[160px_1fr]">
          {/* Sidebar */}
          <aside className="hidden sm:flex flex-col border-r border-gray-800 p-3 gap-1 text-[12px]">
            <TabBtn
              active={tab === "general"}
              onClick={() => setTab("general")}
            >
              General
            </TabBtn>
            <TabBtn
              active={tab === "preferences"}
              onClick={() => setTab("preferences")}
            >
              Preferences
            </TabBtn>
            <TabBtn active={tab === "data"} onClick={() => setTab("data")}>
              Data
            </TabBtn>
            <TabBtn active={tab === "about"} onClick={() => setTab("about")}>
              About
            </TabBtn>
          </aside>

          {/* Content */}
          <section className="overflow-auto custom-scroll p-5 space-y-6">
            {tab === "general" && (
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wide text-gray-500">
                  Profile
                </h3>
                <div className="bg-gray-800/40 rounded p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-200 text-sm font-medium">
                        Account
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Cloud-synced data
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onLogout();
                        onClose();
                      }}
                      className="text-[11px] px-2 py-1 rounded bg-gray-700/60 hover:bg-gray-700 text-gray-200"
                    >
                      Logout
                    </button>
                  </div>
                  {false && userId}
                  {_userEmail && (
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="truncate" title={_userEmail}>
                        Email:{" "}
                        <span className="text-gray-300">{_userEmail}</span>
                      </span>
                      <button
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(_userEmail);
                          } catch {}
                        }}
                        className="px-2 py-1 rounded bg-gray-800/60 hover:bg-gray-800 border border-gray-700 text-gray-300"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">This week</span>
                      <span className="text-gray-200">
                        {done}/{total} • {rate}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded bg-gray-800 overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{
                          width: `${Math.min(100, Math.max(0, rate))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Streak</span>
                      <span className="text-gray-200">
                        {statsSummary.streak} days
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-800/40 rounded p-3">
                    <div className="text-gray-500 text-[11px]">Timezone</div>
                    <div className="text-gray-200 text-sm font-medium">
                      {tz || "—"}
                    </div>
                  </div>
                  <div className="bg-gray-800/40 rounded p-3">
                    <div className="text-gray-500 text-[11px]">Locale</div>
                    <div className="text-gray-200 text-sm font-medium">
                      {locale || "—"}
                    </div>
                  </div>
                  <div className="bg-gray-800/40 rounded p-3">
                    <div className="text-gray-500 text-[11px]">
                      Local Storage
                    </div>
                    <div className="text-gray-200 text-sm font-medium">
                      {formatBytes(storageBytes)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "preferences" && (
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wide text-gray-500">
                  Preferences
                </h3>
                <div className="bg-gray-800/40 rounded p-4 space-y-4 text-[11px]">
                  <ToggleRow
                    label="Start in Focus Mode"
                    hint="Open with the focused study view by default."
                    enabled={prefFocusDefault}
                    onToggle={onToggleFocusDefault}
                  />
                  <ToggleRow
                    label="Disable Confetti"
                    hint="Turn off celebration effects (helps battery/attention)."
                    enabled={prefDisableConfetti}
                    onToggle={onToggleDisableConfetti}
                  />
                  <ToggleRow
                    label="Reduced Motion"
                    hint="Minimize animations/transitions for sensitive users."
                    enabled={prefReducedMotion}
                    onToggle={onToggleReducedMotion}
                  />
                  {onToggleSfx && (
                    <ToggleRow
                      label="Sound Effects"
                      hint="Light UI clicks and completion tones."
                      enabled={!!prefSfx}
                      onToggle={onToggleSfx}
                    />
                  )}
                  {onToggleHighContrast && (
                    <ToggleRow
                      label="High Contrast"
                      hint="Stronger borders and accents for low-light or outdoor use."
                      enabled={!!prefHighContrast}
                      onToggle={onToggleHighContrast}
                    />
                  )}
                  {(typeof onToggleSfx === "function" ||
                    typeof onToggleReducedMotion === "function" ||
                    typeof onToggleDisableConfetti === "function" ||
                    typeof onToggleFocusDefault === "function") && (
                    <div className="pt-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          try {
                            localStorage.setItem("dsa-pref-focus-default", "0");
                            localStorage.setItem(
                              "dsa-pref-disable-confetti",
                              "0"
                            );
                            localStorage.setItem(
                              "dsa-pref-reduced-motion",
                              "0"
                            );
                            localStorage.setItem("dsa-pref-sfx", "1");
                            localStorage.setItem("dsa-pref-high-contrast", "0");
                          } catch {}
                          if (prefFocusDefault) onToggleFocusDefault?.();
                          if (prefDisableConfetti) onToggleDisableConfetti?.();
                          if (prefReducedMotion) onToggleReducedMotion?.();
                          if (prefSfx === false) onToggleSfx?.();
                          if (prefHighContrast) onToggleHighContrast?.();
                        }}
                        className="mt-2 text-[11px] px-3 py-1.5 rounded bg-gray-700/60 text-gray-200 hover:bg-gray-700 border border-gray-600/60"
                      >
                        Reset Preferences
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "data" && (
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wide text-gray-500">
                  Data
                </h3>
                <div className="bg-gray-800/40 rounded p-4 space-y-4">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Your progress, streak, XP, achievements and notes are stored
                    locally per account. Clearing data wipes only the current
                    account's study state (not the account itself).
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        const keys = [
                          "dsa-habit-progress-v1",
                          "dsa-habit-streak-v1",
                          "dsa-habit-last-active",
                          "dsa-habit-xp-v1",
                          "dsa-habit-achievements-v1",
                          "dsa-habit-version",
                        ];
                        const data: Record<string, any> = {};
                        keys.forEach((k) => {
                          const v = localStorage.getItem(k);
                          if (v !== null) data[k] = v;
                        });
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "algo-habit-backup.json";
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => {
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }, 100);
                      }}
                      className="text-[11px] px-3 py-1.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30"
                    >
                      Export Data
                    </button>
                    <label className="text-[11px] px-3 py-1.5 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30 cursor-pointer">
                      Import Data
                      <input
                        type="file"
                        accept="application/json"
                        style={{ display: "none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const text = await file.text();
                            const data: Record<string, unknown> =
                              JSON.parse(text);
                            if (typeof data !== "object" || Array.isArray(data))
                              throw new Error("Invalid format");
                            Object.entries(data).forEach(([k, v]) => {
                              if (typeof v === "string")
                                localStorage.setItem(k, v);
                            });
                            window.location.reload();
                          } catch {
                            alert("Import failed: invalid file.");
                          }
                        }}
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => setConfirming(true)}
                    className="text-[11px] px-3 py-1.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
                  >
                    Clear All Study Data
                  </button>
                </div>
              </div>
            )}

            {tab === "about" && (
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wide text-gray-500">
                  About
                </h3>
                <div className="bg-gray-800/40 rounded p-4 text-[11px] text-gray-400 leading-relaxed space-y-3">
                  <p>
                    AlgoHabit is a lightweight companion for consistent DSA
                    practice. Track weekly topics, keep a streak, and level up
                    as you complete tasks.
                  </p>
                  <p className="text-gray-300 font-medium">Privacy</p>
                  <p>
                    Your progress and notes are stored in your browser and may
                    sync to your account if logged in. We don’t sell data. You
                    can export/import or clear your study data anytime from the
                    Data tab.
                  </p>
                  <p className="text-gray-300 font-medium">Keyboard</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>⌘K — Command Palette</li>
                    <li>Esc — Close dialogs</li>
                    <li>Tab — Navigate buttons/links</li>
                  </ul>
                  <p className="text-gray-300 font-medium">Support</p>
                  <p>
                    Found a bug or want a feature? Reach out via the repo or
                    open an issue.
                  </p>
                  {userId && (
                    <div className="mt-2 pt-2 border-t border-gray-800 text-[11px] text-gray-500 flex items-center justify-between">
                      <span>
                        Account ID:{" "}
                        <span className="text-gray-300">
                          {userId.slice(0, 8)}…
                        </span>
                      </span>
                      <button
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(userId);
                          } catch {}
                        }}
                        className="px-2 py-1 rounded bg-gray-800/60 hover:bg-gray-800 border border-gray-700 text-gray-300"
                        title="Copy Account ID"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer (keeps height stable on small screens) */}
        <div className="px-5 py-3 border-t border-gray-800 bg-gray-900/80 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost !px-3 !py-1.5">
            Close
          </button>
        </div>

        {/* Confirm dialog */}
        {confirming && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[380px] bg-gray-900 rounded-xl ring-1 ring-gray-700 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-200">
                Confirm Reset
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Type <span className="text-gray-300 font-mono">RESET</span> to
                confirm wiping topic statuses, notes, streak, XP & achievements
                for this local profile.
              </p>
              <input
                value={resetText}
                onChange={(e) => setResetText(e.target.value)}
                placeholder="Type RESET"
                className="w-full text-[12px] px-3 py-2 rounded bg-gray-800 text-gray-200 border border-gray-700 outline-none focus:ring-1 focus:ring-accent"
              />
              <div className="flex gap-3">
                <button
                  disabled={resetText !== "RESET"}
                  onClick={() => {
                    onReset();
                    setConfirming(false);
                    onClose();
                  }}
                  className={`flex-1 text-[11px] px-3 py-2 rounded ${
                    resetText === "RESET"
                      ? "bg-rose-500/30 text-rose-100 hover:bg-rose-500/40"
                      : "bg-gray-700/60 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Yes, Reset
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 text-[11px] px-3 py-2 rounded bg-gray-700/60 text-gray-200 hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-gray-800/60 rounded p-2 flex flex-col gap-1">
    <span className="text-gray-500">{label}</span>
    <span className="text-gray-200 font-medium">{value}</span>
  </div>
);

const ToggleRow: React.FC<{
  label: string;
  hint?: string;
  enabled: boolean;
  onToggle: () => void;
}> = ({ label, hint, enabled, onToggle }) => (
  <div
    className={`w-full rounded border ${
      enabled
        ? "bg-accent/10 border-accent/40"
        : "bg-gray-800/60 border-gray-700/60"
    }`}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 text-left"
    >
      <div className="flex flex-col">
        <span
          className={`text-[12px] ${enabled ? "text-accent" : "text-gray-300"}`}
        >
          {label}
        </span>
        {hint && <span className="text-[10px] text-gray-500">{hint}</span>}
      </div>
      <span
        className={`w-8 h-4 rounded-full flex items-center px-0.5 transition ${
          enabled ? "bg-accent" : "bg-gray-600"
        }`}
      >
        <span
          className={`h-3 w-3 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-4" : ""
          }`}
        ></span>
      </span>
    </button>
  </div>
);

const TabBtn: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`text-left px-3 py-2 rounded border transition ${
      active
        ? "bg-accent/10 border-accent/40 text-accent"
        : "bg-gray-800/60 border-gray-700/60 text-gray-300 hover:border-gray-600"
    }`}
  >
    {children}
  </button>
);
