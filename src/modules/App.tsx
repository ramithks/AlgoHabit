import React, { useEffect, useState, Suspense, lazy } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  store,
  computeWeekStats,
  overallProgress,
  levelFromXP,
  levelInfo,
  pendingTopicsForReview,
} from "./state";
import { TOTAL_WEEKS, TopicProgress, TopicStatus } from "./plan";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { gentleNudge, randomQuote } from "./motivation";
import { contextualMotivation } from "./motivationEngine";
import {
  Timeline,
  WeekBoard,
  NotificationPanel,
  AuthScreen,
  StatusCluster,
} from "./components";
import { FocusClock } from "./components/FocusClock";
import { useProStatus } from "./hooks/useProStatus";

// Lazy-loaded components for code-splitting
const SettingsPanelLazy = lazy(() =>
  import("./components/SettingsPanel").then((m) => ({
    default: m.SettingsPanel,
  }))
);
const StreakHeatmapLazy = lazy(() =>
  import("./components/StreakHeatmap").then((m) => ({
    default: m.StreakHeatmap,
  }))
);
const AchievementsPanelLazy = lazy(() =>
  import("./components/AchievementsPanel").then((m) => ({
    default: m.AchievementsPanel,
  }))
);
const CommandPaletteLazy = lazy(() =>
  import("./components/CommandPalette").then((m) => ({
    default: m.CommandPalette,
  }))
);
const WeeklyReviewLazy = lazy(() =>
  import("./components/WeeklyReview").then((m) => ({ default: m.WeeklyReview }))
);
// Daily tasks removed; no schedule imports
import {
  ensureServiceWorker,
  requestNotificationPermission,
  scheduleLocalReminder,
  listReminders,
  cancelReminder,
} from "./notifications";
import { logout, getActiveUser } from "./localAuth";
import { resetCurrentUserData } from "./state";
import { recordActivity, getActivityDays } from "./activity";
import { startAutoSync, pullAll } from "./cloudSync";
import { sfx } from "./sfx";

export const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<{
    topics: TopicProgress[];
    streak: number;
    lastActive?: string;
    xp?: number;
  }>(() => ({ topics: [], streak: 0 }));
  const [activeWeek, setActiveWeek] = useState(1);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [quote, setQuote] = useState(randomQuote());
  // Daily tasks removed
  const [notifStatus, setNotifStatus] = useState<
    NotificationPermission | "unsupported"
  >(() => ("Notification" in window ? Notification.permission : "unsupported"));
  const [reminders, setReminders] = useState(() => listReminders());
  const [remMinutes, setRemMinutes] = useState(60);
  const [focusMode, setFocusMode] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState<string | null>(
    null
  );
  const [lastXP, setLastXP] = useState(0);
  const [xpDelta, setXpDelta] = useState<number | null>(null);
  const [_levelPulse, setLevelPulse] = useState(false);
  const [authUser, setAuthUser] = useState<ReturnType<typeof getActiveUser>>(
    () => getActiveUser()
  );
  const [showSettings, setShowSettings] = useState(false);
  const [autoFocusApplied, setAutoFocusApplied] = useState(false);
  const [prefFocusDefault, setPrefFocusDefault] = useState(
    () => localStorage.getItem("dsa-pref-focus-default") === "1"
  );
  const [prefDisableConfetti, setPrefDisableConfetti] = useState(
    () => localStorage.getItem("dsa-pref-disable-confetti") === "1"
  );
  const [prefReducedMotion, setPrefReducedMotion] = useState(
    () => localStorage.getItem("dsa-pref-reduced-motion") === "1"
  );
  const [prefSfx, setPrefSfx] = useState(() => {
    const v = localStorage.getItem("dsa-pref-sfx");
    return v === null ? true : v === "1";
  });
  const [prefHighContrast, setPrefHighContrast] = useState(
    () => localStorage.getItem("dsa-pref-high-contrast") === "1"
  );
  const [activityDays, setActivityDays] = useState<string[]>(() =>
    getActivityDays()
  );

  useEffect(() => {
    if (prefFocusDefault && !focusMode) {
      setFocusMode(true);
      setAutoFocusApplied(true);
    }
    if (!prefFocusDefault && autoFocusApplied && focusMode) {
      setFocusMode(false);
      setAutoFocusApplied(false);
    }
  }, [prefFocusDefault, focusMode, autoFocusApplied]);

  useEffect(() => {
    if (prefReducedMotion) {
      document.documentElement.classList.add("reduced-motion");
      setRecentAchievement(null);
    } else {
      document.documentElement.classList.remove("reduced-motion");
    }
  }, [prefReducedMotion]);

  useEffect(() => {
    if (prefDisableConfetti) {
      setRecentAchievement(null);
    }
  }, [prefDisableConfetti]);

  useEffect(() => {
    sfx.setEnabled(prefSfx);
  }, [prefSfx]);

  // Apply high-contrast UI theme
  useEffect(() => {
    const root = document.documentElement;
    if (prefHighContrast) root.classList.add("high-contrast");
    else root.classList.remove("high-contrast");
  }, [prefHighContrast]);

  useEffect(() => {
    const unsub = store.subscribe((s) =>
      setData({
        topics: s.topics,
        streak: s.streak,
        lastActive: s.lastActive,
        xp: (s as any).xp,
      })
    );
    pullAll();
    const stopSync = startAutoSync();
    return () => {
      unsub();
      stopSync?.();
    };
  }, []);

  // Daily tasks removed

  useEffect(() => {
    const current = data.xp || 0;
    if (lastXP !== 0 && current > lastXP) {
      setXpDelta(current - lastXP);
      setTimeout(() => setXpDelta(null), 1800);
      const prevLevel = levelInfo(lastXP).level;
      const newLevel = levelInfo(current).level;
      if (newLevel > prevLevel) {
        setLevelPulse(true);
        setTimeout(() => setLevelPulse(false), 2200);
        sfx.play("levelUp");
      }
    }
    setLastXP(current);
  }, [data.xp, lastXP]);

  // Streak milestone shimmer (7 and 30)
  const [streakShimmer, setStreakShimmer] = useState(false);
  useEffect(() => {
    if (data.streak === 7 || data.streak === 30) {
      setStreakShimmer(true);
      const to = setTimeout(() => setStreakShimmer(false), 2000);
      return () => clearTimeout(to);
    }
  }, [data.streak]);

  useEffect(() => {
    const id = setInterval(() => setQuote(randomQuote()), 180000); // rotate every 3 minutes
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    ensureServiceWorker();
  }, []);

  // Nudge audio context on first user interaction (browser autoplay policy)
  useEffect(() => {
    const fn = () => {
      try {
        sfx.setEnabled(prefSfx);
      } catch {}
      window.removeEventListener("pointerdown", fn);
    };
    window.addEventListener("pointerdown", fn);
    return () => window.removeEventListener("pointerdown", fn);
  }, [prefSfx]);

  // Daily tasks removed

  // initial focus state handled by the effect that watches prefFocusDefault

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowPalette(true);
        sfx.play("open");
      }
      if (e.key === "Escape") {
        setShowPalette(false);
        sfx.play("close");
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    function resize() {
      if (window.innerWidth < 1024 && focusMode) setFocusMode(false);
    }
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [focusMode]);

  // Roadmap drawer: esc to close and lock body scroll
  useEffect(() => {
    if (!showRoadmap) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowRoadmap(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [showRoadmap]);

  useEffect(() => {
    const atSettings = location.pathname.endsWith("/settings");
    setShowSettings(atSettings);
  }, [location.pathname]);

  const weekStats = computeWeekStats(activeWeek, data.topics);
  const overall = overallProgress(data.topics);
  const lvl = levelFromXP(data.xp || 0);
  const lvlDetails = levelInfo(data.xp || 0);
  const reviewSuggestions = pendingTopicsForReview(activeWeek, data.topics);
  const missedDays = data.lastActive
    ? Math.max(
        0,
        differenceInCalendarDays(new Date(), parseISO(data.lastActive)) - 0
      )
    : 0;
  const nudge = gentleNudge(missedDays > 0 ? missedDays - 1 : 0);
  const motivationLines = contextualMotivation({
    streak: data.streak,
    topics: data.topics,
    level: lvl,
    xp: data.xp || 0,
  });
  const achievements = (data as any).achievements as string[] | undefined;
  useEffect(() => {
    if (achievements && achievements.length) {
      const last = achievements[achievements.length - 1];
      setRecentAchievement(last);
      const to = setTimeout(() => setRecentAchievement(null), 4000);
      return () => clearTimeout(to);
    }
  }, [achievements]);

  // Call useProStatus unconditionally at top-level to satisfy hooks rule.
  const { isPro } = useProStatus();
  if (!authUser) {
    return <AuthScreen onAuthed={(u: any) => setAuthUser(u)} />;
  }
  return (
    <div
      className={`min-h-full flex flex-col ${focusMode ? "focus-mode" : ""}`}
    >
      <header className="relative border-b border-gray-800/60 overflow-hidden">
        <div className="absolute inset-0 gradient-bar opacity-30 blur-xl" />
        <div className="relative backdrop-blur-xl bg-gray-950/70 px-4 sm:px-5 py-3 flex flex-wrap gap-3 sm:gap-6 items-center shadow">
          <div className="flex items-center gap-3 font-semibold tracking-tight text-lg">
            <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
              AlgoHabit
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-normal">
              beta
            </span>
            {isPro ? (
              <span className="badge badge-accent">Pro</span>
            ) : (
              <button
                className="btn btn-primary text-[11px] !px-3 !py-1.5 hidden sm:inline-flex"
                onClick={() => navigate("/#pricing")}
              >
                Upgrade
              </button>
            )}
          </div>
          <div className="hidden md:block text-sm text-gray-400 order-3 sm:order-none">
            Week <span className="text-gray-200 font-medium">{activeWeek}</span>{" "}
            / {TOTAL_WEEKS}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 flex-wrap justify-end w-full sm:w-auto relative">
            <div className="basis-full sm:basis-auto">
              <StatusCluster
                overallPct={overall.pct}
                streak={data.streak}
                level={lvlDetails.level}
                xp={lvlDetails.totalXP}
              />
            </div>
            {/* Mobile: open roadmap drawer */}
            <button
              onClick={() => setShowRoadmap(true)}
              className="btn btn-ghost text-[11px] !px-3 !py-1.5 inline-flex lg:hidden"
              aria-label="Open Roadmap"
            >
              Roadmap
            </button>
            {xpDelta && (
              <span className="absolute -top-2 right-2 text-[10px] px-1 py-0.5 rounded bg-emerald-500/30 text-emerald-300 animate-[fadeIn_.2s_ease,fadeOut_.4s_ease_1.4s] pointer-events-none">
                +{xpDelta} XP
              </span>
            )}
            <button
              onClick={() => {
                setFocusMode((f) => !f);
                setAutoFocusApplied(false);
              }}
              className={`btn ${
                focusMode ? "btn-primary" : "btn-ghost"
              } text-[11px] !px-3 !py-1.5 sm:text-[11px] sm:!px-3 sm:!py-1.5`}
            >
              {focusMode ? "Exit" : "Focus"}
            </button>
            <button
              onClick={() => setShowPalette(true)}
              className={`btn btn-ghost text-[11px] !px-3 !py-1.5 sm:inline-flex ${
                streakShimmer ? "animate-pulse" : ""
              }`}
            >
              ⌘K
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="btn btn-ghost text-[11px] !px-3 !py-1.5 sm:inline-flex"
            >
              Settings
            </button>
          </div>
        </div>
        <div className="h-0.5 w-full gradient-bar opacity-60" />
      </header>
      <main
        className={`flex-1 grid gap-6 p-5 transition-all min-w-0 xl:grid-cols-[310px_1fr_340px] lg:grid-cols-[280px_1fr]`}
      >
        <div
          className={`hidden lg:flex flex-col gap-6 transition min-w-0 ${
            focusMode ? "lg:opacity-0 lg:pointer-events-none" : ""
          }`}
        >
          <Timeline
            activeWeek={activeWeek}
            onSelectWeek={setActiveWeek}
            topics={data.topics}
          />
          <WeekBoard
            week={activeWeek}
            topics={data.topics}
            onStatusChange={(id: string, status: TopicStatus) => {
              const prev = data.topics.find((t) => t.id === id)?.status;
              store.setStatus(id, status);
              recordActivity();
              setActivityDays(getActivityDays());
              if (status === "complete" && prev !== "complete") {
                // trigger a quick confetti pulse via achievement toast
                setRecentAchievement("topic-complete");
                setTimeout(() => setRecentAchievement(null), 2000);
              }
            }}
            onAddNote={(id: string, note: string) => {
              store.addDailyNote(id, note);
              recordActivity();
              setActivityDays(getActivityDays());
            }}
          />
        </div>
        <div className="flex flex-col gap-6 focus-core min-w-0 w-full max-w-3xl mx-auto">
          <FocusClock />
          {!focusMode && (
            <div className="xl:hidden">
              <Suspense fallback={null}>
                <StreakHeatmapLazy days={activityDays} />
              </Suspense>
            </div>
          )}
          <section className="panel-alt space-y-3">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              Motivation{" "}
              <span className="text-[10px] text-accent/70">Coach</span>
            </h2>
            {nudge && (
              <div className="text-amber-400 text-xs font-medium">{nudge}</div>
            )}
            <ul className="text-[11px] text-gray-300 leading-relaxed list-disc pl-4 space-y-1">
              {motivationLines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
            <div className="text-gray-400 italic text-[11px] border-t border-gray-800/60 pt-2">
              “{quote}”
            </div>
          </section>
          {achievements && (
            <Suspense fallback={null}>
              <AchievementsPanelLazy ids={achievements} />
            </Suspense>
          )}
          <Suspense fallback={null}>
            <WeeklyReviewLazy week={activeWeek} topics={data.topics} />
          </Suspense>
          <ReviewSuggestions items={reviewSuggestions} />

          {/* Mobile/Tablet: Notifications and Leaderboard visible here */}
          {!focusMode && (
            <div className="xl:hidden flex flex-col gap-6">
              <section>
                <NotificationPanel
                  status={notifStatus}
                  onRequest={async () => {
                    const p = await requestNotificationPermission();
                    setNotifStatus(p);
                  }}
                  reminders={reminders}
                  onSchedule={() => {
                    const id = scheduleLocalReminder(
                      remMinutes * 60 * 1000,
                      "DSA Focus Block",
                      "Start your planned session now."
                    );
                    setReminders(listReminders());
                    try {
                      const el = document.createElement("div");
                      el.className =
                        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-gray-900/90 text-[11px] text-gray-200 ring-1 ring-gray-700 animate-[fadeIn_.15s_ease,fadeOut_.3s_ease_1.2s]";
                      el.textContent = "Reminder scheduled";
                      document.body.appendChild(el);
                      setTimeout(() => el.remove(), 1600);
                    } catch {}
                    return id;
                  }}
                  onCancel={(id: string) => {
                    cancelReminder(id);
                    setReminders(listReminders());
                    try {
                      const el = document.createElement("div");
                      el.className =
                        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-gray-900/90 text-[11px] text-gray-200 ring-1 ring-gray-700 animate-[fadeIn_.15s_ease,fadeOut_.3s_ease_1.2s]";
                      el.textContent = "Reminder canceled";
                      document.body.appendChild(el);
                      setTimeout(() => el.remove(), 1600);
                    } catch {}
                  }}
                  remMinutes={remMinutes}
                  onChangeMinutes={setRemMinutes}
                />
              </section>
              <LeaderboardMock />
            </div>
          )}
        </div>
        <div
          className={`hidden xl:flex flex-col gap-6 transition min-w-0 ${
            focusMode ? "xl:opacity-0 xl:pointer-events-none" : ""
          }`}
        >
          <Suspense fallback={null}>
            <StreakHeatmapLazy days={activityDays} />
          </Suspense>
          <LeaderboardMock />
          <NotificationPanel
            status={notifStatus}
            onRequest={async () => {
              const p = await requestNotificationPermission();
              setNotifStatus(p);
            }}
            reminders={reminders}
            onSchedule={() => {
              const id = scheduleLocalReminder(
                remMinutes * 60 * 1000,
                "DSA Focus Block",
                "Start your planned session now."
              );
              setReminders(listReminders());
              // toast
              try {
                const el = document.createElement("div");
                el.className =
                  "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-gray-900/90 text-[11px] text-gray-200 ring-1 ring-gray-700 animate-[fadeIn_.15s_ease,fadeOut_.3s_ease_1.2s]";
                el.textContent = "Reminder scheduled";
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 1600);
              } catch {}
              return id;
            }}
            onCancel={(id: string) => {
              cancelReminder(id);
              setReminders(listReminders());
              try {
                const el = document.createElement("div");
                el.className =
                  "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-gray-900/90 text-[11px] text-gray-200 ring-1 ring-gray-700 animate-[fadeIn_.15s_ease,fadeOut_.3s_ease_1.2s]";
                el.textContent = "Reminder canceled";
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 1600);
              } catch {}
            }}
            remMinutes={remMinutes}
            onChangeMinutes={setRemMinutes}
          />
        </div>
      </main>
      {/* Mobile/Tablet slide-in for 8-Week Roadmap + Weekly Topics */}
      {showRoadmap && !focusMode && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRoadmap(false)}
          />
          {/* Panel */}
          <aside className="absolute left-0 top-0 h-full w-[88%] max-w-sm bg-gray-950 ring-1 ring-gray-800 shadow-2xl animate-[slideIn_.2s_ease] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/70">
              <div className="text-sm font-semibold text-gray-200">
                Roadmap & Topics
              </div>
              <button
                className="btn btn-ghost text-[11px] !px-3 !py-1.5"
                onClick={() => setShowRoadmap(false)}
                aria-label="Close"
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto min-w-0">
              <Timeline
                activeWeek={activeWeek}
                onSelectWeek={(w) => {
                  setActiveWeek(w);
                }}
                topics={data.topics}
              />
              <WeekBoard
                week={activeWeek}
                topics={data.topics}
                onStatusChange={(id: string, status: TopicStatus) => {
                  const prev = data.topics.find((t) => t.id === id)?.status;
                  store.setStatus(id, status);
                  recordActivity();
                  setActivityDays(getActivityDays());
                  if (status === "complete" && prev !== "complete") {
                    setRecentAchievement("topic-complete");
                    setTimeout(() => setRecentAchievement(null), 2000);
                  }
                }}
                onAddNote={(id: string, note: string) => {
                  store.addDailyNote(id, note);
                  recordActivity();
                  setActivityDays(getActivityDays());
                }}
              />
            </div>
          </aside>
        </div>
      )}
      <footer className="text-xs text-gray-500 px-5 py-3 border-t border-gray-800 flex items-center gap-4 bg-gray-950/60 backdrop-blur">
        <span>
          Practice anywhere; this app tracks your habit and topic progress.
        </span>
        <span className="ml-auto">{format(new Date(), "PPpp")}</span>
      </footer>
      {showPalette && (
        <Suspense fallback={null}>
          <CommandPaletteLazy
            onClose={() => setShowPalette(false)}
            onJumpWeek={(w) => {
              setActiveWeek(w);
              setShowPalette(false);
            }}
          />
        </Suspense>
      )}
      {recentAchievement ? <AchievementToast id={recentAchievement} /> : null}
      <ConfettiTrigger
        active={
          !!recentAchievement && !prefDisableConfetti && !prefReducedMotion
        }
      />
      {showSettings && (
        <Suspense fallback={null}>
          <SettingsPanelLazy
            onClose={() => navigate("/app")}
            userEmail={authUser?.email || null}
            userId={authUser?.id || null}
            onReset={() => resetCurrentUserData()}
            onLogout={() => {
              logout();
              setAuthUser(null);
              setFocusMode(false);
              setAutoFocusApplied(false);
              navigate("/auth", { replace: true });
            }}
            onSyncNow={() => {
              try {
                pullAll();
              } catch {}
            }}
            prefFocusDefault={prefFocusDefault}
            onToggleFocusDefault={() => {
              const v = !prefFocusDefault;
              setPrefFocusDefault(v);
              localStorage.setItem("dsa-pref-focus-default", v ? "1" : "0");
              if (v) {
                setFocusMode(true);
                setAutoFocusApplied(true);
              } else if (autoFocusApplied) {
                setFocusMode(false);
                setAutoFocusApplied(false);
              }
            }}
            prefDisableConfetti={prefDisableConfetti}
            onToggleDisableConfetti={() => {
              const v = !prefDisableConfetti;
              setPrefDisableConfetti(v);
              localStorage.setItem("dsa-pref-disable-confetti", v ? "1" : "0");
              if (v) setRecentAchievement(null);
            }}
            prefReducedMotion={prefReducedMotion}
            onToggleReducedMotion={() => {
              const v = !prefReducedMotion;
              setPrefReducedMotion(v);
              localStorage.setItem("dsa-pref-reduced-motion", v ? "1" : "0");
              if (v) setRecentAchievement(null);
            }}
            prefSfx={prefSfx}
            onToggleSfx={() => setPrefSfx((v) => !v)}
            prefHighContrast={prefHighContrast}
            onToggleHighContrast={() => {
              const v = !prefHighContrast;
              setPrefHighContrast(v);
              localStorage.setItem("dsa-pref-high-contrast", v ? "1" : "0");
            }}
            statsSummary={{
              complete: weekStats.complete,
              total: weekStats.total,
              streak: data.streak,
              xp: data.xp || 0,
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

const LeaderboardMock: React.FC = () => {
  // Simple self-only scoreboard based on current local state
  const [pts, setPts] = React.useState(0);
  useEffect(() => {
    const unsub = store.subscribe((s) => {
      const complete = s.topics.filter((t) => t.status === "complete").length;
      const inProg = s.topics.filter((t) => t.status === "in-progress").length;
      setPts(complete * 10 + inProg * 3);
    });
    return () => {
      unsub();
    };
  }, []);
  return (
    <section className="bg-gray-900 rounded-xl p-4 space-y-3 ring-1 ring-gray-800">
      <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        Weekly Leaderboard
      </h2>
      <ul className="text-xs space-y-1 text-gray-400">
        <li className="flex justify-between">
          <span>You</span>
          <span className="text-accent">{pts} pts</span>
        </li>
      </ul>
      <div className="text-[10px] text-gray-500">
        Points = completed x10 + in-progress x3
      </div>
    </section>
  );
};

// moved to components/StreakBadge and components/ProgressBar

const ReviewSuggestions: React.FC<{ items: TopicProgress[] }> = ({ items }) => (
  <section className="bg-gray-900 rounded-xl p-4 ring-1 ring-gray-800 space-y-2">
    <h2 className="text-sm font-semibold text-gray-300">Review Queue</h2>
    {items.length === 0 && (
      <div className="text-[11px] text-gray-500">
        No prior-week pending topics. Great!
      </div>
    )}
    <ul className="space-y-1 text-[11px]">
      {items.map((i) => (
        <li key={i.id} className="text-gray-300">
          • {i.label}
        </li>
      ))}
    </ul>
  </section>
);

const achievementIcons: Record<string, string> = {
  "first-complete": "🌱",
  "five-complete": "🚀",
  "ten-complete": "💎",
  "week1-master": "🏅",
  "all-cleared": "🏆",
  "streak-7": "🔥",
  "streak-30": "👑",
};

const AchievementToast: React.FC<{ id: string }> = ({ id }) => {
  const icon = achievementIcons[id] || "⭐";
  return (
    <div className="fixed bottom-4 right-4 z-40 animate-[fadeIn_.25s_ease]">
      <div className="px-4 py-3 rounded-xl bg-gray-900/90 backdrop-blur ring-1 ring-gray-700 border border-gray-700/40 shadow-lg flex items-center gap-3">
        <span className="text-xl leading-none">{icon}</span>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-200 tracking-wide">
            Achievement Unlocked
          </span>
          <span className="text-[11px] text-gray-400">{id}</span>
        </div>
      </div>
    </div>
  );
};

const ConfettiTrigger: React.FC<{ active: boolean }> = ({ active }) => {
  useEffect(() => {
    if (!active) return;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.className = "pointer-events-none fixed inset-0 z-40";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    document.body.appendChild(canvas);
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const parts = Array.from({ length: 120 }, () => ({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.3,
      r: 4 + Math.random() * 6,
      c: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"][
        Math.floor(Math.random() * 5)
      ],
      vy: 3.5 + Math.random() * 4.5,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: -0.08 + Math.random() * 0.16,
    }));
    let frame: number;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      parts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > h + 40) p.y = -20;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
        ctx.restore();
      });
    };
    draw();
    const to = setTimeout(() => {
      cancelAnimationFrame(frame);
      canvas.remove();
    }, 1600);
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(to);
      window.removeEventListener("resize", onResize);
      canvas.remove();
    };
  }, [active]);
  return null;
};
