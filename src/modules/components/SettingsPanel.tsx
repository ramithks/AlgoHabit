import React from "react";

export const SettingsPanel: React.FC<{
  onClose: () => void;
  userEmail: string | null;
  onReset: () => void;
  onLogout: () => void;
  prefFocusDefault: boolean;
  onToggleFocusDefault: () => void;
  prefDisableConfetti: boolean;
  onToggleDisableConfetti: () => void;
  prefReducedMotion: boolean;
  onToggleReducedMotion: () => void;
  prefSfx?: boolean;
  onToggleSfx?: () => void;
  statsSummary: { complete: number; total: number; streak: number; xp: number };
}> = ({
  onClose,
  userEmail: _userEmail,
  onReset,
  onLogout,
  prefFocusDefault,
  onToggleFocusDefault,
  prefDisableConfetti,
  onToggleDisableConfetti,
  prefReducedMotion,
  onToggleReducedMotion,
  prefSfx,
  onToggleSfx,
  statsSummary,
}) => {
  const [confirming, setConfirming] = React.useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full sm:w-[600px] max-w-full rounded-xl overflow-hidden ring-1 ring-gray-700 bg-gray-900 shadow-xl">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            Settings{" "}
            <span className="text-[10px] text-gray-500">Profile & Data</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-sm"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-6 text-sm text-gray-300 max-h-[75vh] overflow-auto custom-scroll">
          <section className="space-y-2">
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
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <Stat
                  label="Week"
                  value={`${statsSummary.complete}/${statsSummary.total}`}
                />
                <Stat label="Streak" value={`${statsSummary.streak}d`} />
                <Stat label="XP" value={`${statsSummary.xp}`} />
              </div>
            </div>
          </section>
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-gray-500">
              Preferences
            </h3>
            <div className="bg-gray-800/40 rounded p-4 space-y-3 text-[11px]">
              <ToggleRow
                label="Start in Focus Mode"
                enabled={prefFocusDefault}
                onToggle={onToggleFocusDefault}
              />
              <ToggleRow
                label="Disable Confetti"
                enabled={prefDisableConfetti}
                onToggle={onToggleDisableConfetti}
              />
              <ToggleRow
                label="Reduced Motion"
                enabled={prefReducedMotion}
                onToggle={onToggleReducedMotion}
              />
              {onToggleSfx && (
                <ToggleRow
                  label="Sound Effects"
                  enabled={!!prefSfx}
                  onToggle={onToggleSfx}
                />
              )}
            </div>
          </section>
          <section className="space-y-2">
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
                        const data: Record<string, unknown> = JSON.parse(text);
                        if (typeof data !== "object" || Array.isArray(data))
                          throw new Error("Invalid format");
                        Object.entries(data).forEach(([k, v]) => {
                          if (typeof v === "string") localStorage.setItem(k, v);
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
          </section>
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-gray-500">
              About
            </h3>
            <div className="bg-gray-800/40 rounded p-3 text-[11px] text-gray-400 leading-relaxed">
              Your study data syncs securely with your account.
            </div>
          </section>
        </div>
      </div>
      {confirming && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[360px] bg-gray-900 rounded-xl ring-1 ring-gray-700 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200">
              Confirm Reset
            </h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              This will reset all topic statuses, notes, streak, XP &
              achievements for this local profile. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onReset();
                  setConfirming(false);
                  onClose();
                }}
                className="flex-1 text-[11px] px-3 py-2 rounded bg-rose-500/30 text-rose-100 hover:bg-rose-500/40"
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
  enabled: boolean;
  onToggle: () => void;
}> = ({ label, enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center justify-between px-3 py-2 rounded border text-left transition ${
      enabled
        ? "bg-accent/10 border-accent/40 text-accent"
        : "bg-gray-800/60 border-gray-700/60 text-gray-300 hover:border-gray-600"
    }`}
  >
    <span>{label}</span>
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
);
