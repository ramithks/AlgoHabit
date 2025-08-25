import React from "react";
import {
  updateProfile,
  getProfileById,
  getProfileByUsername,
} from "../repos/profilesRepo";
import { supabase } from "../../lib/supabaseClient";
import { useProStatus } from "../hooks/useProStatus";
import { COMPANY_ADDRESS } from "../public/legal/constants";
import { getActiveUser } from "../localAuth";
import { changePlan } from "../repos/subscriptionsRepo";

type TabKey = "general" | "preferences" | "data" | "about" | "subscription";

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
  onSyncNow: _onSyncNow,
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
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  // Trap focus within the modal
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const focusable = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])'
        )
      ).filter((n) => !n.hasAttribute("disabled"));
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = focusable();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !el.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener("keydown", onKey as any);
    const timer = setTimeout(() => {
      const nodes = focusable();
      nodes[0]?.focus();
    }, 0);
    return () => {
      el.removeEventListener("keydown", onKey as any);
      clearTimeout(timer);
    };
  }, []);
  const [confirming, setConfirming] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>("general");
  const { isPro, loading: proLoading, subInfo } = useProStatus();

  // Open specific tab via URL ?tab=subscription
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = (params.get("tab") || "").toLowerCase();
      if (t === "subscription") setTab("subscription");
    } catch {}
  }, []);
  const [resetText, setResetText] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [isPublic, setIsPublic] = React.useState(false);
  const [usernameAvailable, setUsernameAvailable] = React.useState<
    null | boolean
  >(null);
  const [checkingUsername, setCheckingUsername] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const [showPublicConfirm, setShowPublicConfirm] = React.useState(false);
  const [emailVerified, setEmailVerified] = React.useState<boolean>(true);
  const [verifyHint, setVerifyHint] = React.useState<string>("");
  const [savingPublic, setSavingPublic] = React.useState(false);
  const [resendState, setResendState] = React.useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [publicError, setPublicError] = React.useState<string>("");
  const reservedUsernames = React.useMemo(
    () =>
      new Set([
        "me",
        "auth",
        "login",
        "signup",
        "settings",
        "u",
        "app",
        "admin",
      ]),
    []
  );
  const persistPublic = React.useCallback(
    async (newVal: boolean) => {
      if (!userId) return;
      setPublicError("");
      if (newVal) {
        // Validations before enabling
        if (!emailVerified) {
          setVerifyHint("Verify your email before enabling public profile.");
          setShowPublicConfirm(true);
          return;
        }
        if (
          !username ||
          reservedUsernames.has(username) ||
          usernameAvailable === false ||
          checkingUsername
        ) {
          setShowPublicConfirm(true);
          return;
        }
      }
      setSavingPublic(true);
      const { ok, error } = await updateProfile(userId, {
        full_name: fullName || null,
        username: username || null,
        is_public: newVal,
      });
      setSavingPublic(false);
      if (ok) {
        setIsPublic(newVal);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1400);
      } else if (error) {
        setPublicError(error.message || "Failed to update profile");
      }
      try {
        const el = document.createElement("div");
        el.className =
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-gray-900/90 text-[11px] text-gray-200 ring-1 ring-gray-700 animate-[fadeIn_.15s_ease,fadeOut_.3s_ease_1.2s]";
        el.textContent = ok
          ? newVal
            ? "Public profile enabled"
            : "Public profile disabled"
          : "Update failed";
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1400);
      } catch {}
    },
    [
      userId,
      emailVerified,
      username,
      reservedUsernames,
      usernameAvailable,
      checkingUsername,
      fullName,
    ]
  );
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!userId) return;
      const p = await getProfileById(userId);
      if (!mounted || !p) return;
      setFullName(p.full_name || "");
      setUsername((p.username || "").toLowerCase());
      setIsPublic(!!p.is_public);
      setPublicError("");
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);
  // Check email verification status
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!active) return;
        const verified = !!data.user?.email_confirmed_at;
        setEmailVerified(verified);
        if (!verified)
          setVerifyHint("Verify your email to enable public profile.");
        else setVerifyHint("");
      } catch {
        // default to true to avoid blocking in case of transient errors
        setEmailVerified(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  // Check username availability (debounced)
  React.useEffect(() => {
    let active = true;
    const name = username.trim();
    if (!name) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }
    if (reservedUsernames.has(name)) {
      setUsernameAvailable(false);
      setCheckingUsername(false);
      return;
    }
    setCheckingUsername(true);
    const t = setTimeout(async () => {
      try {
        const found = await getProfileByUsername(name);
        if (!active) return;
        const ok =
          !found || (userId && (found as any).id === userId) ? true : false;
        setUsernameAvailable(!!ok);
      } catch {
        // ignore
      } finally {
        if (active) setCheckingUsername(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [username, userId, reservedUsernames]);
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
  const formatINR = (p: number | null | undefined) => {
    try {
      const num = (p || 0) / 100;
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(num);
    } catch {
      return `₹${((p || 0) / 100).toFixed(2)}`;
    }
  };

  // Plan selector UI using real plan data
  const PlanSelector: React.FC<{ isPro: boolean }> = ({ isPro }) => {
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<string>("");

    // Import plans dynamically to avoid circular dependencies
    const [plans, setPlans] = React.useState<any[]>([]);
    const [plansLoading, setPlansLoading] = React.useState(true);

    React.useEffect(() => {
      import("../payments/plans")
        .then(({ plans: planData }) => {
          setPlans(planData);
          setPlansLoading(false);
        })
        .catch(() => {
          setPlansLoading(false);
        });
    }, []);

    // Get current plan info
    const currentPlan = (subInfo?.plan as string) || "";
    const currentPlanData =
      plans.find((p) => p.key === `pro_${currentPlan}`) ||
      plans.find((p) => p.key === currentPlan);

    // Filter plans to show only upgrade options (higher value plans)
    const upgradePlans = plans.filter((plan) => {
      if (!currentPlanData) return true; // If no current plan, show all
      return plan.pricePaise > currentPlanData.pricePaise;
    });

    // Format price display
    const formatPrice = (paise: number) => {
      return `₹${(paise / 100).toLocaleString("en-IN")}`;
    };
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`text-[11px] px-3 py-1.5 rounded border ${
            isPro
              ? "bg-gray-700/60 text-gray-200 hover:bg-gray-700 border-gray-600/60"
              : "bg-accent/20 text-accent hover:bg-accent/30 border-accent/40"
          }`}
        >
          {isPro ? "Manage Plan" : "Upgrade Plan"}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-64 z-40 bg-gray-900 rounded-lg ring-1 ring-gray-800 shadow-xl p-2">
            {/* Current Plan Display */}
            {currentPlanData && (
              <div className="text-[11px] text-gray-300 mb-2 p-2 bg-gray-800/50 rounded border border-gray-700">
                <div className="font-medium">
                  Current Plan: {currentPlanData.title}
                </div>
                <div className="text-gray-400">
                  {formatPrice(currentPlanData.pricePaise)}
                </div>
              </div>
            )}

            <div className="text-[11px] text-gray-400 mb-1">Select a plan</div>
            {plansLoading ? (
              <div className="text-[11px] text-gray-500 p-2 text-center">
                Loading plans...
              </div>
            ) : upgradePlans.length === 0 ? (
              <div className="text-[11px] text-gray-500 p-2 text-center">
                You're already on the highest tier plan! 🎉
              </div>
            ) : (
              <ul className="text-[12px] text-gray-200 space-y-1">
                {upgradePlans.map((plan) => (
                  <li key={plan.key}>
                    <button
                      onClick={() => setSelected(plan.key)}
                      className={`w-full text-left px-2 py-1 rounded ${
                        selected === plan.key
                          ? "bg-accent/20 text-accent"
                          : "hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{plan.title}</span>
                        <span className="text-accent/80">
                          {formatPrice(plan.pricePaise)}
                        </span>
                      </div>
                      {plan.discountPercent && (
                        <div className="text-[10px] text-green-400">
                          Save {plan.discountPercent}%
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 text-[11px] px-2 py-1.5 rounded bg-gray-700/60 text-gray-200 hover:bg-gray-700 border border-gray-600/60"
              >
                Cancel
              </button>
              <button
                disabled={!selected}
                onClick={async () => {
                  if (!selected) return;
                  setOpen(false);
                  try {
                    const uid = getActiveUser()?.id;
                    if (!uid) return;

                    // Extract plan name from plan key (e.g., "pro_monthly" -> "monthly")
                    const planName = selected.replace("pro_", "");
                    console.log("=== UPGRADE PROCESS DEBUG ===");
                    console.log("User ID:", uid);
                    console.log("Selected plan key:", selected);
                    console.log("Extracted plan name:", planName);
                    console.log("Current plan:", currentPlanData);

                    // Import and test changePlan function
                    try {
                      const { changePlan } = await import(
                        "../repos/subscriptionsRepo"
                      );
                      console.log("changePlan function imported successfully");

                      const ok = await changePlan(uid, planName as any);
                      console.log("changePlan returned:", ok);

                      if (ok) {
                        const el = document.createElement("div");
                        el.className =
                          "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-gray-900/90 text-[11px] text-emerald-200 ring-1 ring-emerald-700 animate-[fadeIn_.15s_ease,fadeOut_.3s_ease_1.6s]";
                        el.textContent =
                          "Payment opened! Complete payment to change plan.";
                        document.body.appendChild(el);
                        setTimeout(() => {
                          try {
                            el.remove();
                          } catch {}
                        }, 5000);

                        // Refresh subscription data after a delay to show the change
                        setTimeout(async () => {
                          try {
                            console.log("Refreshing subscription data...");
                            // Force refresh of Pro status
                            localStorage.removeItem("dsa-manual-pro-override");
                            // Reload the page to show updated plan
                            window.location.reload();
                          } catch (refreshError) {
                            console.error("Failed to refresh:", refreshError);
                          }
                        }, 10000); // Wait 10 seconds for payment to complete
                      } else {
                        console.error("changePlan returned false");
                        // Show error message
                        const el = document.createElement("div");
                        el.className =
                          "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-gray-900/90 text-[11px] text-red-200 ring-1 ring-red-700 animate-[fadeIn_.15s_ease,fadeOut_.3s_ease_1.6s]";
                        el.textContent = "Upgrade failed. Please try again.";
                        document.body.appendChild(el);
                        setTimeout(() => {
                          try {
                            el.remove();
                          } catch {}
                        }, 3000);
                      }
                    } catch (importError) {
                      console.error(
                        "Failed to import changePlan:",
                        importError
                      );
                      throw importError;
                    }
                  } catch (error) {
                    console.error("=== UPGRADE ERROR ===", error);
                    // Show error message
                    const el = document.createElement("div");
                    el.className =
                      "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-gray-900/90 text-[11px] text-red-200 ring-1 ring-red-700 animate-[fadeIn_.15s_ease,fadeOut_.3s_ease_1.6s]";
                    el.textContent = `Upgrade failed: ${
                      error instanceof Error ? error.message : "Unknown error"
                    }`;
                    document.body.appendChild(el);
                    setTimeout(() => {
                      try {
                        el.remove();
                      } catch {}
                    }, 5000);
                  }
                }}
                className="flex-1 text-[11px] px-2 py-1.5 rounded bg-accent/20 text-accent hover:bg-accent/30 border border-accent/40"
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
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
          <div className="mt-2">
            <button
              onClick={() => setTab("subscription")}
              className={`w-full px-2 py-1 rounded border text-[11px] ${
                tab === "subscription"
                  ? "bg-accent/10 border-accent/40 text-accent"
                  : "bg-gray-800/60 border-gray-700/60 text-gray-300 hover:border-gray-600"
              }`}
            >
              Subscription
            </button>
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
            <div className="pt-1 mt-1 border-t border-gray-800" />
            <TabBtn
              active={tab === "subscription"}
              onClick={() => setTab("subscription")}
            >
              Subscription
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
                {!emailVerified && _userEmail && (
                  <div
                    className="mt-2 text-[11px] flex items-center justify-between gap-2 rounded border border-amber-500/30 bg-amber-500/10 text-amber-200 px-2 py-1.5"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="truncate">
                      Email not verified. Check your inbox or resend.
                    </span>
                    <button
                      disabled={resendState === "sending"}
                      onClick={async () => {
                        if (!_userEmail) return;
                        setResendState("sending");
                        try {
                          const { error } = await supabase.auth.resend({
                            type: "signup",
                            email: _userEmail,
                          } as any);
                          if (error) throw error;
                          setResendState("sent");
                          setTimeout(() => setResendState("idle"), 3000);
                        } catch {
                          setResendState("error");
                          setTimeout(() => setResendState("idle"), 3000);
                        }
                      }}
                      className={`shrink-0 px-2 py-1 rounded border ${
                        resendState === "sending"
                          ? "bg-gray-700/60 text-gray-400 border-gray-600 cursor-not-allowed"
                          : "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border-amber-500/30"
                      }`}
                    >
                      {resendState === "sending"
                        ? "Sending…"
                        : resendState === "sent"
                        ? "Sent"
                        : "Resend"}
                    </button>
                  </div>
                )}
                {/* Share Profile */}
                <div className="bg-gray-800/40 rounded p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-200 text-sm font-medium">
                        Share profile
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Create a public page to share your progress.
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!isPublic) setShowPublicConfirm(true);
                        else void persistPublic(false);
                      }}
                      aria-pressed={isPublic}
                      className={`text-[11px] px-2 py-1 rounded border ${
                        isPublic
                          ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30"
                          : "bg-gray-700/60 text-gray-300 hover:bg-gray-700 border-gray-600"
                      }`}
                      title={
                        isPublic
                          ? "Disable Public Profile"
                          : "Enable Public Profile"
                      }
                    >
                      {isPublic
                        ? "Disable Public Profile"
                        : "Enable Public Profile"}
                    </button>
                    {!isPublic && !emailVerified && (
                      <span
                        className="ml-2 text-[10px] text-amber-400"
                        aria-live="polite"
                      >
                        {verifyHint || "Verify email to enable"}
                      </span>
                    )}
                  </div>
                  {publicError && (
                    <div
                      className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded p-2"
                      role="alert"
                    >
                      {publicError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <div className="text-gray-400 mb-1">Full name</div>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full text-[12px] px-3 py-2 rounded bg-gray-800 text-gray-200 border border-gray-700 outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400">Username</span>
                      </div>
                      <div className="flex">
                        <span className="px-2 py-2 text-[12px] rounded-l bg-gray-800 border border-r-0 border-gray-700 text-gray-400">
                          /u/
                        </span>
                        <input
                          value={username}
                          onChange={(e) =>
                            setUsername(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-_]/g, "")
                            )
                          }
                          placeholder="swift-coder-23"
                          className="w-full text-[12px] px-3 py-2 rounded-r bg-gray-800 text-gray-200 border border-gray-700 outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <div className="min-h-[16px] mt-1 text-[10px]">
                        {username && reservedUsernames.has(username) && (
                          <span className="text-amber-400">Reserved name</span>
                        )}
                        {username &&
                          !reservedUsernames.has(username) &&
                          checkingUsername && (
                            <span className="text-gray-500">Checking…</span>
                          )}
                        {username &&
                          !reservedUsernames.has(username) &&
                          usernameAvailable === true &&
                          !checkingUsername && (
                            <span className="text-emerald-400">Available</span>
                          )}
                        {username &&
                          !reservedUsernames.has(username) &&
                          usernameAvailable === false &&
                          !checkingUsername && (
                            <span className="text-rose-400">Taken</span>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-gray-500 truncate flex items-center gap-2 min-w-0">
                      {isPublic && username ? (
                        <>
                          <a
                            className="text-accent hover:underline truncate"
                            href={`${location.origin}${
                              import.meta.env.BASE_URL || "/"
                            }u/${username}`}
                            target="_blank"
                            rel="noreferrer"
                            title={`${location.origin}${
                              import.meta.env.BASE_URL || "/"
                            }u/${username}`}
                          >
                            {location.origin}
                            {import.meta.env.BASE_URL || "/"}
                            u/{username}
                          </a>
                          <button
                            onClick={async () => {
                              try {
                                const url = `${location.origin}${
                                  import.meta.env.BASE_URL || "/"
                                }u/${username}`;
                                await navigator.clipboard.writeText(url);
                                setCopiedUrl(true);
                                setTimeout(() => setCopiedUrl(false), 1000);
                              } catch {}
                            }}
                            className="shrink-0 px-2 py-1 rounded bg-gray-800/60 hover:bg-gray-800 border border-gray-700 text-gray-300"
                            aria-live="polite"
                            aria-label={
                              copiedUrl ? "Link copied" : "Copy profile link"
                            }
                          >
                            {copiedUrl ? "Copied" : "Copy"}
                          </button>
                        </>
                      ) : (
                        <span>Public page URL will appear here</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {justSaved && (
                        <span
                          className="text-[10px] text-emerald-400"
                          aria-live="polite"
                        >
                          Saved
                        </span>
                      )}
                      <button
                        disabled={
                          isPublic &&
                          (!username ||
                            reservedUsernames.has(username) ||
                            usernameAvailable === false ||
                            checkingUsername ||
                            !emailVerified)
                        }
                        onClick={async () => {
                          if (!userId) return;
                          if (isPublic && !emailVerified) {
                            setVerifyHint(
                              "Verify your email before enabling public profile."
                            );
                            try {
                              const el = document.createElement("div");
                              el.className =
                                "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-gray-900/90 text-[11px] text-amber-200 ring-1 ring-amber-700 animate-[fadeIn_.15s_ease,fadeOut_.3s_ease_1.8s]";
                              el.textContent =
                                "Email verification required to make profile public";
                              document.body.appendChild(el);
                              setTimeout(() => el.remove(), 1800);
                            } catch {}
                            return;
                          }
                          const { ok, error } = await updateProfile(userId, {
                            full_name: fullName || null,
                            username: username || null,
                            is_public: isPublic,
                          });
                          if (ok) {
                            setJustSaved(true);
                            setTimeout(() => setJustSaved(false), 1400);
                          } else if (error) {
                            setPublicError(error.message || "Update failed");
                          }
                          try {
                            const el = document.createElement("div");
                            el.className =
                              "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-gray-900/90 text-[11px] text-gray-200 ring-1 ring-gray-700 animate-[fadeIn_.15s_ease,fadeOut_.3s_ease_1.2s]";
                            el.textContent = ok
                              ? "Profile updated"
                              : "Update failed";
                            document.body.appendChild(el);
                            setTimeout(() => el.remove(), 1400);
                          } catch {}
                        }}
                        className={`text-[11px] px-3 py-1.5 rounded border ${
                          isPublic &&
                          (!username ||
                            reservedUsernames.has(username) ||
                            usernameAvailable === false ||
                            checkingUsername)
                            ? "bg-gray-700/60 text-gray-400 border-gray-600 cursor-not-allowed"
                            : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/30"
                        }`}
                      >
                        Save
                      </button>
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

            {tab === "subscription" && (
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wide text-gray-500">
                  Subscription
                </h3>
                <div className="bg-gray-800/40 rounded p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-200 text-sm font-medium flex items-center gap-2">
                        {isPro ? (
                          <>
                            <span>AlgoHabit Pro</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <span>Free Plan</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-300 border border-gray-600/60">
                              Inactive
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {isPro
                          ? "Enjoy all Pro features"
                          : "Unlock Pro features"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlanSelector isPro={isPro} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                    <div className="bg-gray-900/40 rounded p-3 border border-gray-800/60">
                      <div className="text-gray-500">Status</div>
                      <div className="text-gray-200 font-medium mt-0.5">
                        {proLoading
                          ? "Checking…"
                          : isPro
                          ? "Pro Active"
                          : "Free"}
                      </div>
                    </div>
                    <div className="bg-gray-900/40 rounded p-3 border border-gray-800/60">
                      <div className="text-gray-500">Renewal</div>
                      <div className="text-gray-200 font-medium mt-0.5">
                        {subInfo?.plan === "lifetime"
                          ? "Never Expires"
                          : subInfo?.end_date
                          ? new Date(subInfo.end_date).toLocaleDateString()
                          : isPro
                          ? "Auto-renew"
                          : "—"}
                      </div>
                    </div>
                    <div className="bg-gray-900/40 rounded p-3 border border-gray-800/60">
                      <div className="text-gray-500">Plan</div>
                      <div className="text-gray-200 font-medium mt-0.5">
                        {(() => {
                          const map: Record<string, string> = {
                            weekly: "Pro Weekly",
                            monthly: "Pro Monthly",
                            quarterly: "Pro Quarterly",
                            semiannual: "Pro Semi-Annual",
                            yearly: "Pro Yearly",
                            biennial: "Pro 2-Year",
                            lifetime: "Pro Lifetime",
                          };
                          const p = (subInfo?.plan as string) || "";
                          if (p && map[p]) return map[p];
                          const lbl = (subInfo?.plan_label as string) || "";
                          if (lbl.startsWith("pro_")) {
                            const pretty = lbl.replace("pro_", "");
                            return `Pro ${pretty
                              .charAt(0)
                              .toUpperCase()}${pretty.slice(1)}`;
                          }
                          return isPro ? "Pro" : "Free";
                        })()}
                      </div>
                    </div>
                  </div>
                  {isPro && (
                    <div className="bg-gray-900/40 rounded p-3 border border-gray-800/60">
                      <div className="text-gray-500">Days Remaining</div>
                      <div className="text-gray-200 font-medium mt-0.5">
                        {subInfo?.plan === "lifetime"
                          ? "Forever"
                          : subInfo?.end_date
                          ? (() => {
                              const end = new Date(subInfo.end_date).getTime();
                              const now = Date.now();
                              const days = Math.max(
                                0,
                                Math.ceil((end - now) / (1000 * 60 * 60 * 24))
                              );
                              return `${days} day${days === 1 ? "" : "s"}`;
                            })()
                          : "—"}
                      </div>
                    </div>
                  )}
                </div>
                {/* Payment Details */}
                <div className="bg-gray-800/40 rounded p-4">
                  <div className="text-[11px] text-gray-400 mb-2">
                    Payment Details
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-[11px] text-gray-300">
                    <div className="bg-gray-900/40 rounded p-3 border border-gray-800/60">
                      <div className="text-gray-500">Start Date</div>
                      <div className="text-gray-200 font-medium mt-0.5">
                        {subInfo?.start_date
                          ? new Date(subInfo.start_date).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                    <div className="bg-gray-900/40 rounded p-3 border border-gray-800/60">
                      <div className="text-gray-500">Renewal Date</div>
                      <div className="text-gray-200 font-medium mt-0.5">
                        {subInfo?.plan === "lifetime"
                          ? "Never Expires"
                          : subInfo?.end_date
                          ? new Date(subInfo.end_date).toLocaleDateString()
                          : isPro
                          ? "Auto-renew"
                          : "—"}
                      </div>
                    </div>
                    <div className="bg-gray-900/40 rounded p-3 border border-gray-800/60">
                      <div className="text-gray-500">Amount</div>
                      <div className="text-gray-200 font-medium mt-0.5">
                        {formatINR(subInfo?.amount_paise)}
                      </div>
                    </div>
                    <div className="bg-gray-900/40 rounded p-3 border border-gray-800/60">
                      <div className="text-gray-500">Payment ID</div>
                      <div
                        className="text-gray-200 font-medium mt-0.5 truncate"
                        title={subInfo?.razorpay_payment_id || undefined}
                      >
                        {subInfo?.razorpay_payment_id || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        try {
                          const invId =
                            subInfo?.razorpay_payment_id ||
                            subInfo?.id ||
                            "invoice";
                          const planLbl = (() => {
                            const map: Record<string, string> = {
                              weekly: "Pro Weekly",
                              monthly: "Pro Monthly",
                              quarterly: "Pro Quarterly",
                              semiannual: "Pro Semi-Annual",
                              yearly: "Pro Yearly",
                              biennial: "Pro 2-Year",
                              lifetime: "Pro Lifetime",
                            };
                            const p = subInfo?.plan as any as
                              | string
                              | undefined;
                            return (
                              (p && map[p]) ||
                              subInfo?.plan_label ||
                              "AlgoHabit Pro"
                            );
                          })();
                          const amount = formatINR(subInfo?.amount_paise);
                          const start = subInfo?.start_date
                            ? new Date(subInfo.start_date).toLocaleDateString()
                            : "—";
                          const end =
                            subInfo?.plan === "lifetime"
                              ? "Forever"
                              : subInfo?.end_date
                              ? new Date(subInfo.end_date).toLocaleDateString()
                              : "—";
                          const email = _userEmail || "—";
                          // Create a more robust invoice generation approach
                          const html = `<!doctype html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width,initial-scale=1'>
  <title>Invoice ${invId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif;
      background: #ffffff;
      color: #1f2937;
      line-height: 1.6;
      font-size: 14px;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #ffffff;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .company-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #92400e;
      font-weight: 700;
      font-size: 20px;
    }
    
    .company-details h1 {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }
    
    .company-details p {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .invoice-badge {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .invoice-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .detail-section h3 {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .detail-section p {
      font-size: 16px;
      font-weight: 500;
      color: #111827;
      margin-bottom: 4px;
    }
    
    .detail-section .secondary {
      font-size: 14px;
      color: #6b7280;
      font-weight: 400;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      background: #f9fafb;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .items-table th {
      background: #f3f4f6;
      padding: 16px 20px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .items-table td {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    
    .items-table tr:last-child td {
      border-bottom: none;
    }
    
    .item-description {
      font-weight: 500;
      color: #111827;
    }
    
    .item-amount {
      font-weight: 600;
      color: #111827;
      text-align: right;
    }
    
    .total-row {
      background: #f8fafc;
      border-top: 2px solid #e5e7eb;
    }
    
    .total-row td {
      font-weight: 700;
      font-size: 16px;
      color: #111827;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .payment-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-badge {
      background: #10b981;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .terms {
      color: #6b7280;
      font-size: 12px;
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .no-print {
      display: none;
    }
    
    @media print {
      body { padding: 0; }
      .invoice-container { padding: 0; }
      .header { border-bottom: 1px solid #000; }
      .items-table { background: white; }
      .total-row { background: #f0f0f0; }
    }
  </style>
</head>
<body>
  <div class='invoice-container'>
    <!-- Header -->
    <div class='header'>
      <div class='company-info'>
        <div class='logo'>A</div>
        <div class='company-details'>
          <h1>AlgoHabit</h1>
          <p>${COMPANY_ADDRESS}</p>
        </div>
      </div>
      <div class='invoice-badge'>Invoice</div>
    </div>
    
    <!-- Invoice Details -->
    <div class='invoice-details'>
      <div class='detail-section'>
        <h3>Invoice Details</h3>
        <p><strong>Invoice #:</strong> ${invId}</p>
        <p><strong>Issue Date:</strong> ${start}</p>
        <p><strong>Due Date:</strong> ${end}</p>
      </div>
      
      <div class='detail-section'>
        <h3>Bill To</h3>
        <p>${email}</p>
        <p class='secondary'>Customer</p>
      </div>
    </div>
    
    <!-- Subscription Details -->
    <div class='invoice-details'>
      <div class='detail-section'>
        <h3>Subscription Plan</h3>
        <p><strong>Plan:</strong> ${planLbl}</p>
        <p><strong>Period:</strong> ${start} - ${end}</p>
      </div>
      
      <div class='detail-section'>
        <h3>Payment Information</h3>
        <p><strong>Payment ID:</strong> ${
          subInfo?.razorpay_payment_id || "—"
        }</p>
        <p><strong>Status:</strong> ${subInfo?.payment_state || "Paid"}</p>
      </div>
    </div>
    
    <!-- Items Table -->
    <table class='items-table'>
      <thead>
        <tr>
          <th>Description</th>
          <th style='text-align: right;'>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class='item-description'>
            <strong>${planLbl} Subscription</strong><br>
            <span style='color: #6b7280; font-size: 12px;'>Subscription period from ${start} to ${end}</span>
          </td>
          <td class='item-amount'>${amount}</td>
        </tr>
        <tr class='total-row'>
          <td class='item-description'>Total Amount</td>
          <td class='item-amount'>${amount}</td>
        </tr>
      </tbody>
    </table>
    
    <!-- Footer -->
    <div class='footer'>
      <div class='payment-status'>
        <span class='status-badge'>Paid</span>
        <span style='color: #6b7280; font-size: 14px;'>Payment completed successfully</span>
      </div>
      
      <div style='text-align: right;'>
        <p style='font-size: 12px; color: #6b7280; margin-bottom: 4px;'>Thank you for choosing AlgoHabit!</p>
        <p style='font-size: 12px; color: #6b7280;'>For support, contact: ramithgowdakundoor123@gmail.com</p>
      </div>
    </div>
    
    <!-- Terms -->
    <div class='terms'>
      <p><strong>Terms & Conditions:</strong> This is a digital invoice. Payment is non-refundable. Subscription will auto-renew unless cancelled.</p>
    </div>
    
    <!-- Action Buttons (Hidden in print) -->
    <div style='margin-top: 30px; text-align: center;' class='no-print'>
      <button onclick='window.print()' style='padding: 12px 24px; border: none; background: #10b981; color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 12px;'>Print Invoice</button>
      <button onclick='window.close()' style='padding: 12px 24px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;'>Close</button>
    </div>
  </div>
</body>
</html>`;

                          // Generate PDF using jsPDF and html2canvas
                          try {
                            // Create a temporary div to render the invoice
                            const tempDiv = document.createElement("div");
                            tempDiv.innerHTML = html;
                            tempDiv.style.position = "absolute";
                            tempDiv.style.left = "-9999px";
                            tempDiv.style.top = "0";
                            tempDiv.style.width = "760px";
                            tempDiv.style.background = "#ffffff";
                            document.body.appendChild(tempDiv);

                            // Import jsPDF and html2canvas dynamically
                            Promise.all([
                              import("jspdf"),
                              import("html2canvas"),
                            ])
                              .then(([jsPDF, html2canvas]) => {
                                const { default: JsPDF } = jsPDF;
                                const { default: Html2Canvas } = html2canvas;

                                // Convert HTML to canvas
                                Html2Canvas(tempDiv, {
                                  scale: 2,
                                  useCORS: true,
                                  allowTaint: true,
                                  backgroundColor: "#ffffff",
                                  width: 760,
                                  height: tempDiv.scrollHeight,
                                })
                                  .then((canvas) => {
                                    // Create PDF
                                    const pdf = new JsPDF("p", "mm", "a4");
                                    const imgWidth = 210; // A4 width in mm
                                    const pageHeight = 295; // A4 height in mm
                                    const imgHeight =
                                      (canvas.height * imgWidth) / canvas.width;
                                    let heightLeft = imgHeight;
                                    let position = 0;

                                    // Add first page
                                    pdf.addImage(
                                      canvas,
                                      "PNG",
                                      0,
                                      position,
                                      imgWidth,
                                      imgHeight
                                    );
                                    heightLeft -= pageHeight;

                                    // Add additional pages if needed
                                    while (heightLeft >= 0) {
                                      position = heightLeft - imgHeight;
                                      pdf.addPage();
                                      pdf.addImage(
                                        canvas,
                                        "PNG",
                                        0,
                                        position,
                                        imgWidth,
                                        imgHeight
                                      );
                                      heightLeft -= pageHeight;
                                    }

                                    // Download PDF
                                    pdf.save(`invoice-${invId}.pdf`);

                                    // Clean up
                                    document.body.removeChild(tempDiv);
                                  })
                                  .catch((err) => {
                                    console.error(
                                      "Canvas generation failed:",
                                      err
                                    );
                                    alert(
                                      "PDF generation failed. Please try again."
                                    );
                                    document.body.removeChild(tempDiv);
                                  });
                              })
                              .catch((err) => {
                                console.error(
                                  "PDF library import failed:",
                                  err
                                );
                                alert(
                                  "PDF generation failed. Please try again."
                                );
                                document.body.removeChild(tempDiv);
                              });
                          } catch (e) {
                            console.error("PDF generation failed:", e);
                            alert("PDF generation failed. Please try again.");
                          }
                        } catch {}
                      }}
                      className="text-[11px] px-3 py-1.5 rounded border border-gray-600/60 text-gray-200 bg-gray-700/60 hover:bg-gray-700"
                    >
                      Download Invoice (PDF)
                    </button>
                  </div>
                </div>
                {/* Billing section intentionally removed per design */}
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

        {/* Enable Public confirm */}
        {showPublicConfirm && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[420px] bg-gray-900 rounded-xl ring-1 ring-gray-700 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-200">
                Enable Public Profile
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Your streak and XP will be visible to anyone with your link. You
                can disable this anytime from Settings.
              </p>
              {(!username ||
                reservedUsernames.has(username) ||
                usernameAvailable === false ||
                checkingUsername) && (
                <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded p-2">
                  Set a valid, available username before enabling.
                </div>
              )}
              {!emailVerified && (
                <div
                  className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded p-2"
                  aria-live="polite"
                >
                  {verifyHint || "Verify your email to proceed."}
                </div>
              )}
              {publicError && (
                <div
                  className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded p-2"
                  role="alert"
                >
                  {publicError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPublicConfirm(false)}
                  className="flex-1 text-[11px] px-3 py-2 rounded bg-gray-700/60 text-gray-200 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  disabled={
                    !emailVerified ||
                    !username ||
                    reservedUsernames.has(username) ||
                    usernameAvailable === false ||
                    checkingUsername ||
                    savingPublic
                  }
                  onClick={async () => {
                    await persistPublic(true);
                    setShowPublicConfirm(false);
                  }}
                  className={`flex-1 text-[11px] px-3 py-2 rounded ${
                    !emailVerified ||
                    !username ||
                    reservedUsernames.has(username) ||
                    usernameAvailable === false ||
                    checkingUsername ||
                    savingPublic
                      ? "bg-gray-700/60 text-gray-400 cursor-not-allowed"
                      : "bg-emerald-500/30 text-emerald-100 hover:bg-emerald-500/40"
                  }`}
                >
                  {savingPublic ? "Enabling…" : "Enable"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const _Stat: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
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
