import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  store,
  computeWeekStats,
  overallProgress,
  levelFromXP,
  levelInfo,
  pendingTopicsForReview,
} from "./state";
import { topics, TOTAL_WEEKS, TopicProgress, TopicStatus } from "./plan";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { gentleNudge, randomQuote } from "./motivation";
import { contextualMotivation } from "./motivationEngine";
import { Timeline } from "./components/Timeline";
import { generateDailyPlan, DailyTask } from "./schedule";
import { subscribeTasks, toggleTask } from "./scheduleState";
import { WeekBoard } from "./components/WeekBoard";
import { WeeklyReview } from "./components/WeeklyReview";
import {
  ensureServiceWorker,
  requestNotificationPermission,
  showImmediateNotification,
  scheduleLocalReminder,
  listReminders,
  cancelReminder,
} from "./notifications";
import { logout, getActiveUser, signup, login } from "./localAuth";
import { resetCurrentUserData } from "./state";
import { recordActivity, getActivityDays } from "./activity";

export const App: React.FC = () => {
  const [data, setData] = useState<{
    topics: TopicProgress[];
    streak: number;
    lastActive?: string;
    xp?: number;
  }>(() => ({ topics: [], streak: 0 }));
  const [activeWeek, setActiveWeek] = useState(1);
  const [quote, setQuote] = useState(randomQuote());
  const [planStart] = useState(new Date());
  const [dailyTasks, setDailyTasks] = useState(() =>
    generateDailyPlan(planStart)
  );
  const todayISO = format(new Date(), "yyyy-MM-dd");
  const todayTasks = dailyTasks.filter((d) => d.date === todayISO);
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
  const [levelPulse, setLevelPulse] = useState(false);
  const [authUser, setAuthUser] = useState(() => getActiveUser());
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
  const [activityDays, setActivityDays] = useState<string[]>(() =>
    getActivityDays()
  );

  // React to preference changes (focus preference applies / reverts only if it auto-applied)
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
      // cancel any active celebration
      setRecentAchievement(null);
    } else {
      document.documentElement.classList.remove("reduced-motion");
    }
  }, [prefReducedMotion]);
  useEffect(() => {
    if (prefDisableConfetti) {
      // cancel any active confetti animation instantly
      setRecentAchievement(null);
    }
  }, [prefDisableConfetti]);

  useEffect(() => {
    const unsub = store.subscribe((s) =>
      setData({
        topics: s.topics,
        streak: s.streak,
        lastActive: s.lastActive,
        xp: (s as any).xp,
      })
    );
    const unsubTasks = subscribeTasks(setDailyTasks);
    return () => {
      unsub();
      unsubTasks();
    };
  }, []);
  // XP delta tracking
  useEffect(() => {
    const current = data.xp || 0;
    if (lastXP !== 0 && current > lastXP) {
      setXpDelta(current - lastXP);
      setTimeout(() => setXpDelta(null), 1800);
      // level pulse detection using levelInfo
      const prevLevel = levelInfo(lastXP).level;
      const newLevel = levelInfo(current).level;
      if (newLevel > prevLevel) {
        setLevelPulse(true);
        setTimeout(() => setLevelPulse(false), 2200);
      }
    }
    setLastXP(current);
  }, [data.xp]);
  useEffect(() => {
    const id = setInterval(() => setQuote(randomQuote()), 15000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    ensureServiceWorker();
  }, []);
  // Apply default focus preference on mount once (mark as auto-applied)
  useEffect(() => {
    if (prefFocusDefault) {
      setFocusMode(true);
      setAutoFocusApplied(true);
    }
  }, []);
  // Global shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowPalette(true);
      }
      if (e.key === "Escape") {
        setShowPalette(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Auto exit focus mode if window width small
  useEffect(() => {
    function resize() {
      if (window.innerWidth < 1024 && focusMode) setFocusMode(false);
    }
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [focusMode]);

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
  }, [achievements?.length]);
  // Show auth screen if no active user account (re-introduced minimal UI)
  if (!authUser) {
    return <AuthScreen onAuthed={(u) => setAuthUser(u)} />;
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
          </div>
          <div className="hidden md:block text-sm text-gray-400 order-3 sm:order-none">
            Week <span className="text-gray-200 font-medium">{activeWeek}</span>{" "}
            / {TOTAL_WEEKS}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setShowSettings(true)}
              className="btn btn-ghost text-[10px]"
            >
              Settings
            </button>
            <button
              onClick={() => {
                setFocusMode((f) => !f);
                setAutoFocusApplied(false); // manual override prevents auto revert
              }}
              className={`btn text-[10px] ${
                focusMode
                  ? "btn-primary !px-3 !py-1.5"
                  : "btn-ghost !px-3 !py-1.5"
              }`}
            >
              {focusMode ? "Exit Focus" : "Focus Mode"}
            </button>
            <StreakBadge streak={data.streak} />
            <ProgressBar pct={overall.pct} />
            <div className="relative">
              <LevelBadge
                level={lvlDetails.level}
                xpInto={lvlDetails.xpInto}
                xpFor={lvlDetails.xpForLevel}
                pct={lvlDetails.pct}
                totalXP={lvlDetails.totalXP}
                pulse={levelPulse}
              />
              {xpDelta && (
                <span className="absolute -right-2 -top-3 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 animate-[fadeIn_.2s_ease,fadeOut_.4s_ease_1.4s]">
                  +{xpDelta} XP
                </span>
              )}
            </div>
            <button
              onClick={() => setShowPalette(true)}
              className="btn-ghost btn text-[11px] !px-2 !py-1"
            >
              ⌘K
            </button>
          </div>
        </div>
        <div className="h-0.5 w-full gradient-bar opacity-60" />
      </header>
      <main className="flex-1 grid xl:grid-cols-[310px_1fr_340px] lg:grid-cols-[280px_1fr] gap-6 p-5 transition-all min-w-0">
        <div
          className={`flex flex-col gap-6 ${
            focusMode
              ? "opacity-0 pointer-events-none -translate-x-4 scale-95 hidden lg:block"
              : ""
          } transition min-w-0`}
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
              store.setStatus(id, status);
              recordActivity();
              setActivityDays(getActivityDays());
            }}
            onAddNote={(id: string, note: string) => {
              store.addDailyNote(id, note);
              recordActivity();
              setActivityDays(getActivityDays());
            }}
          />
        </div>
        <div className="flex flex-col gap-6 focus-core min-w-0">
          <DailyPanel
            tasks={todayTasks}
            onToggle={(id) => {
              toggleTask(id);
              recordActivity();
              setActivityDays(getActivityDays());
            }}
          />
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
          {achievements && <AchievementsPanel ids={achievements} />}
          <WeeklyReview week={activeWeek} topics={data.topics} />
          <ReviewSuggestions items={reviewSuggestions} />
        </div>
        <div
          className={`hidden xl:flex flex-col gap-6 ${
            focusMode
              ? "opacity-0 pointer-events-none translate-x-4 scale-95"
              : ""
          } transition min-w-0`}
        >
          <StreakHeatmap days={activityDays} />
          <LeaderboardMock />
          <NotificationPanel
            status={notifStatus}
            onRequest={async () => {
              const p = await requestNotificationPermission();
              setNotifStatus(p);
            }}
            onPing={() =>
              showImmediateNotification(
                "Time to Study DSA",
                "Open a topic now and progress your streak."
              )
            }
            reminders={reminders}
            onSchedule={() => {
              const id = scheduleLocalReminder(
                remMinutes * 60 * 1000,
                "DSA Focus Block",
                "Start your planned session now."
              );
              setReminders(listReminders());
              return id;
            }}
            onCancel={(id) => {
              cancelReminder(id);
              setReminders(listReminders());
            }}
            remMinutes={remMinutes}
            onChangeMinutes={setRemMinutes}
          />
        </div>
      </main>
      <footer className="text-xs text-gray-500 px-5 py-3 border-t border-gray-800 flex items-center gap-4 bg-gray-950/60 backdrop-blur">
        <span>
          All problem solving occurs on LeetCode. This companion only tracks
          habit & topic status.
        </span>
        <span className="ml-auto">{format(new Date(), "PPpp")}</span>
      </footer>
      {showPalette && (
        <CommandPalette
          onClose={() => setShowPalette(false)}
          onJumpWeek={(w) => {
            setActiveWeek(w);
            setShowPalette(false);
          }}
        />
      )}
      {recentAchievement && <AchievementToast id={recentAchievement} />}
      <ConfettiTrigger
        active={
          !!recentAchievement && !prefDisableConfetti && !prefReducedMotion
        }
      />
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          userEmail={authUser?.email || null}
          onReset={() => resetCurrentUserData()}
          onLogout={() => {
            logout();
            setAuthUser(null);
            setFocusMode(false);
            setAutoFocusApplied(false);
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
            if (v) setRecentAchievement(null); // stop active confetti
          }}
          prefReducedMotion={prefReducedMotion}
          onToggleReducedMotion={() => {
            const v = !prefReducedMotion;
            setPrefReducedMotion(v);
            localStorage.setItem("dsa-pref-reduced-motion", v ? "1" : "0");
            if (v) setRecentAchievement(null); // stop active confetti
          }}
          statsSummary={{
            complete: weekStats.complete,
            total: weekStats.total,
            streak: data.streak,
            xp: data.xp || 0,
          }}
        />
      )}
    </div>
  );
};

const LeaderboardMock: React.FC = () => (
  <section className="bg-gray-900 rounded-xl p-4 space-y-3 ring-1 ring-gray-800">
    <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
      Weekly Leaderboard{" "}
      <span className="text-[10px] font-normal text-gray-500">(mock)</span>
    </h2>
    <ul className="text-xs space-y-1 text-gray-400">
      <li className="flex justify-between">
        <span>You</span>
        <span className="text-accent">
          {Math.round(Math.random() * 50) + 50} pts
        </span>
      </li>
      <li className="flex justify-between">
        <span>Peer A</span>
        <span>{Math.round(Math.random() * 50) + 30} pts</span>
      </li>
      <li className="flex justify-between">
        <span>Peer B</span>
        <span>{Math.round(Math.random() * 50) + 20} pts</span>
      </li>
    </ul>
    <div className="text-[10px] text-gray-500">
      Points = completed topics * 10 + in-progress * 3
    </div>
  </section>
);

// Removed obsolete CalendarSyncMock (superseded by real NotificationPanel)

const StreakBadge: React.FC<{ streak: number }> = ({ streak }) => (
  <div
    className="flex items-center gap-1 text-sm font-medium text-amber-400"
    title="Daily active streak"
  >
    <span className="text-lg">🔥</span>
    <span>{streak}d</span>
  </div>
);

const ProgressBar: React.FC<{ pct: number }> = ({ pct }) => (
  <div
    className="w-40 h-2 rounded bg-gray-800 overflow-hidden"
    title="Overall completion"
  >
    <div
      className="h-full bg-gradient-to-r from-accent to-fuchsia-500 transition-all"
      style={{ width: pct + "%" }}
    />
  </div>
);

const LevelBadge: React.FC<{
  level: number;
  xpInto: number;
  xpFor: number;
  pct: number;
  totalXP: number;
  pulse?: boolean;
}> = ({ level, xpInto, xpFor, pct, totalXP, pulse }) => {
  return (
    <div
      className={`relative flex items-center gap-2 px-2 py-1 rounded bg-gray-800/70 backdrop-blur text-[11px] ring-1 ring-fuchsia-500/30 shadow-inner ${
        pulse ? "animate-pulse-slow ring-fuchsia-400/50" : ""
      }`}
      title={`Level ${level} • ${xpInto}/${xpFor} (${pct}%) • Total XP ${totalXP}`}
    >
      <div className="relative w-6 h-6">
        <svg viewBox="0 0 36 36" className="w-6 h-6">
          <path
            className="text-gray-700 stroke-current"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
            strokeOpacity={0.35}
          />
          <path
            className="text-fuchsia-400 stroke-current"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeDashoffset={25}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-fuchsia-300">
          {level}
        </span>
        {pct >= 95 && (
          <span className="absolute -top-1 -right-1 text-[9px] animate-pulse text-amber-300">
            ★
          </span>
        )}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-medium text-fuchsia-300">Lv {level}</span>
        <span className="text-[9px] text-gray-400">
          {xpInto}/{xpFor} ({pct}%)
        </span>
      </div>
    </div>
  );
};

const DailyPanel: React.FC<{
  tasks: DailyTask[];
  onToggle: (id: string) => void;
}> = ({ tasks, onToggle }) => {
  // Map topicId to label for friendlier display
  const topicMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of topics) map[t.id] = t.label;
    return map;
  }, []);
  return (
    <section className="bg-gray-900 rounded-xl p-4 ring-1 ring-gray-800 space-y-3 overflow-hidden">
      <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        Today <span className="text-[10px] text-gray-500">Daily Plan</span>
      </h2>
      {tasks.length === 0 && (
        <div className="text-[11px] text-gray-500">
          No tasks generated for today.
        </div>
      )}
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 text-xs min-w-0">
            <button
              onClick={() => onToggle(t.id)}
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                t.done
                  ? "bg-emerald-500/30 border-emerald-400"
                  : "border-gray-600"
              }`}
            >
              {t.done && "✓"}
            </button>
            <span
              className={`flex-1 truncate ${
                t.done ? "line-through text-gray-500" : "text-gray-200"
              }`}
            >
              {t.topicId && topicMap[t.topicId]
                ? `${topicMap[t.topicId]} (${t.title.replace(
                    /Learn & practice: /,
                    ""
                  )})`
                : t.title}
            </span>
            {t.prereq && !t.done && (
              <span className="text-[10px] text-amber-400 ml-auto">
                Prereq: {t.prereq}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

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

// Streak / Activity Heatmap similar to GitHub contribution graph (last 8 weeks)
const StreakHeatmap: React.FC<{ days: string[] }> = ({ days }) => {
  const today = new Date();
  // Build 8 weeks (56 days) ending today
  const cells: { date: Date; iso: string; active: boolean }[] = [];
  for (let i = 55; i >= 0; i--) {
    const d = new Date(today.getTime());
    d.setDate(today.getDate() - i);
    const iso = format(d, "yyyy-MM-dd");
    cells.push({ date: d, iso, active: days.includes(iso) });
  }
  const weeks: (typeof cells)[] = [];
  for (let w = 0; w < 8; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));
  function tone(idx: number): string {
    return [
      "bg-gray-800 border-gray-700",
      "bg-emerald-900/60 border-emerald-700/60",
      "bg-emerald-800/60 border-emerald-600/60",
      "bg-emerald-600/60 border-emerald-500/60",
      "bg-emerald-400/60 border-emerald-300/60",
    ][idx];
  }
  return (
    <section className="bg-gray-900 rounded-xl p-4 ring-1 ring-gray-800 space-y-3">
      <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        Activity
        <span className="text-[10px] text-gray-500">Last 8 Weeks</span>
      </h2>
      <div className="flex gap-1">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {w.map((c, di) => {
              const dayOfWeek = c.date.getDay();
              const active = c.active;
              // intensity scaling: cluster streaks
              let streakDepth = 0;
              if (active) {
                // look backwards up to 3 days for streak length
                for (let back = 1; back <= 3; back++) {
                  const prev = new Date(c.date.getTime());
                  prev.setDate(c.date.getDate() - back);
                  const isoPrev = format(prev, "yyyy-MM-dd");
                  if (days.includes(isoPrev)) streakDepth++;
                  else break;
                }
              }
              const cls = active ? tone(Math.min(4, 1 + streakDepth)) : tone(0);
              return (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-sm border ${cls} relative group`}
                  title={`${c.iso}${active ? " • Active" : ""}`}
                >
                  <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition shadow border border-gray-700">
                    {c.iso}
                    {active ? " • Active day" : ""}
                  </span>
                  {dayOfWeek === 1 && wi % 2 === 0 && di === 1 && (
                    <span className="sr-only">Week {wi + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 justify-end text-[9px] text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`w-3 h-3 rounded-sm border ${tone(i)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </section>
  );
};

const achievementMeta: Record<
  string,
  { label: string; desc: string; icon: string }
> = {
  "first-complete": {
    label: "First Steps",
    desc: "Completed your first topic.",
    icon: "🌱",
  },
  "five-complete": {
    label: "Momentum 5",
    desc: "Five topics complete.",
    icon: "🚀",
  },
  "ten-complete": {
    label: "Double Digits",
    desc: "Ten topics complete.",
    icon: "💎",
  },
  "week1-master": {
    label: "Week 1 Master",
    desc: "All Week 1 topics done.",
    icon: "🏅",
  },
  "all-cleared": {
    label: "Full Journey",
    desc: "All topics across 8 weeks complete.",
    icon: "🏆",
  },
  "streak-7": { label: "Week Flame", desc: "7-day streak.", icon: "🔥" },
  "streak-30": { label: "Marathon", desc: "30-day streak.", icon: "👑" },
};

const AchievementsPanel: React.FC<{ ids: string[] }> = ({ ids }) => {
  if (!ids.length) return null;
  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl p-4 ring-1 ring-gray-800 border border-gray-800/50 space-y-3">
      <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        Achievements{" "}
        <span className="text-[10px] text-accent/70">Gamified Progress</span>
      </h2>
      <ul className="grid grid-cols-2 gap-2 text-[11px]">
        {ids.map((id) => {
          const meta = achievementMeta[id];
          if (!meta) return null;
          return (
            <li
              key={id}
              className="flex items-start gap-2 bg-gray-800/40 rounded p-2 border border-gray-800 hover:border-gray-700 transition"
            >
              <span className="text-lg leading-none">{meta.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-200">{meta.label}</div>
                <div className="text-gray-500 text-[10px] leading-tight">
                  {meta.desc}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const NotificationPanel: React.FC<{
  status: NotificationPermission | "unsupported";
  onRequest: () => void;
  onPing: () => void;
  reminders: { id: string; time: number; title: string }[];
  onSchedule: () => string;
  onCancel: (id: string) => void;
  remMinutes: number;
  onChangeMinutes: (v: number) => void;
}> = ({
  status,
  onRequest,
  onPing,
  reminders,
  onSchedule,
  onCancel,
  remMinutes,
  onChangeMinutes,
}) => {
  const swReady =
    typeof navigator !== "undefined" && !!navigator.serviceWorker?.controller;
  // Track ticking for live countdown
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((v) => (v + 1) % 1000), 60000); // minute granularity
    return () => clearInterval(id);
  }, []);
  // Map initial durations so we can show progress bars
  const [durations, setDurations] = useState<Record<string, number>>({});
  useEffect(() => {
    setDurations((prev) => {
      const next = { ...prev };
      reminders.forEach((r) => {
        if (!next[r.id]) next[r.id] = r.time - Date.now();
      });
      // prune removed
      Object.keys(next).forEach((id) => {
        if (!reminders.find((r) => r.id === id)) delete next[id];
      });
      return next;
    });
  }, [reminders]);
  function pctRemaining(r: { id: string; time: number }) {
    const total = durations[r.id] || r.time - Date.now();
    const remain = r.time - Date.now();
    return Math.max(0, Math.min(100, (remain / total) * 100));
  }
  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl p-4 ring-1 ring-gray-800 border border-gray-800/50 space-y-3 panel-interactive">
      <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        Notifications{" "}
        <span className="text-[10px] text-accent/70">Local Only</span>
      </h2>
      {status === "unsupported" && (
        <div className="text-[11px] text-rose-400">
          Browser does not support Notifications API.
        </div>
      )}
      {status !== "granted" && status !== "unsupported" && (
        <button
          onClick={onRequest}
          className="text-[11px] px-3 py-1 rounded bg-accent/30 text-accent hover:bg-accent/40"
        >
          Enable Notifications
        </button>
      )}
      {status === "granted" && (
        <div className="space-y-2 text-[11px]">
          {!swReady && (
            <div className="text-[10px] text-amber-400">
              Preparing background worker… retry ping in a moment.
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={onPing}
              className="px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30"
            >
              Test Ping
            </button>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                value={remMinutes}
                onChange={(e) => onChangeMinutes(parseInt(e.target.value) || 1)}
                className="w-16 bg-gray-800 rounded px-2 py-1 outline-none text-[11px]"
              />
              <span className="text-gray-400">min</span>
            </div>
            <button
              onClick={() => onSchedule()}
              className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
            >
              Schedule Reminder
            </button>
          </div>
          <ul className="space-y-1 max-h-32 overflow-auto pr-1">
            {reminders.map((r) => (
              <li
                key={r.id}
                className="group rounded-lg border border-gray-800/60 bg-gray-800/30 px-2 py-2 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-14">
                    {Math.max(0, Math.round((r.time - Date.now()) / 60000))}m
                  </span>
                  <span className="flex-1 text-[11px] truncate text-gray-300">
                    {r.title}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        // snooze +5m
                        const mins = 5;
                        onChangeMinutes(mins);
                        const id = onSchedule();
                        onCancel(r.id);
                      }}
                      title="Snooze 5m"
                      className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 hover:bg-indigo-500/40"
                    >
                      +5m
                    </button>
                    <button
                      onClick={() => onCancel(r.id)}
                      className="text-[10px] px-1 py-0.5 rounded bg-rose-500/30 text-rose-200 hover:bg-rose-500/40"
                      title="Cancel"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="h-1.5 rounded bg-gray-700/60 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-fuchsia-500 transition-all ease-linear"
                    style={{ width: `${pctRemaining(r)}%` }}
                  />
                </div>
              </li>
            ))}
            {reminders.length === 0 && (
              <li className="text-[10px] text-gray-500">
                No reminders scheduled.
              </li>
            )}
          </ul>
          <div className="text-[10px] text-gray-500">
            Reminders rely on page being open (no server push).
          </div>
        </div>
      )}
    </section>
  );
};

// Lightweight command palette for quick week navigation
type PaletteItem = {
  type: "week" | "topic";
  week: number;
  label: string;
  hint: string;
  keywords: string;
};

const CommandPalette: React.FC<{
  onClose: () => void;
  onJumpWeek: (w: number) => void;
}> = ({ onClose, onJumpWeek }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  // Build searchable items: weeks + topics (flattened)
  const weekItems: PaletteItem[] = useMemo(
    () =>
      Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
        type: "week" as const,
        week: i + 1,
        label: `Week ${i + 1}`,
        hint: "Jump to roadmap week",
        keywords: `week ${i + 1} ${i + 1}`,
      })),
    []
  );
  const topicItems: PaletteItem[] = useMemo(
    () =>
      topics.map((t) => ({
        type: "topic" as const,
        week: t.week,
        label: t.label,
        hint: `Week ${t.week}`,
        keywords: `${t.label.toLowerCase()} week ${t.week}`,
      })),
    []
  );
  const allItems: PaletteItem[] = useMemo(
    () => [...weekItems, ...topicItems],
    [weekItems, topicItems]
  );
  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 80);
    const q = query.toLowerCase();
    return allItems
      .filter((i: PaletteItem) => i.keywords.includes(q))
      .slice(0, 80);
  }, [query, allItems]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose(); // toggle close
      } else if (e.key === "Enter") {
        // choose first item
        const first = filtered[0];
        if (first) {
          if (first.type === "week") onJumpWeek(first.week);
          else if (first.type === "topic") onJumpWeek(first.week);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, onClose, onJumpWeek]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[560px] rounded-xl overflow-hidden ring-1 ring-gray-700 bg-gray-900 shadow-xl">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search weeks or topics... (⏎ to jump)"
            className="flex-1 bg-gray-800/60 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent placeholder-gray-500"
          />
          <span className="text-[10px] text-gray-500 hidden sm:inline">
            Esc / ⌘K
          </span>
        </div>
        <ul className="max-h-80 overflow-auto divide-y divide-gray-800 text-sm">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-xs text-gray-500">
              No matches
            </li>
          )}
          {filtered.map((item, idx) => (
            <li key={idx}>
              <button
                onClick={() => {
                  if (item.type === "week") onJumpWeek(item.week);
                  else onJumpWeek(item.week);
                  onClose();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-800/60 flex items-center gap-3 group"
              >
                <span className="text-gray-300 truncate flex-1">
                  {item.type === "week" ? item.label : item.label}
                </span>
                <span className="text-[10px] text-gray-500 group-hover:text-gray-400">
                  {item.hint}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2 bg-gray-800/40 text-[10px] flex items-center gap-4 text-gray-500">
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded border border-gray-600 text-[9px]">
              ⌘K
            </kbd>{" "}
            toggle
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded border border-gray-600 text-[9px]">
              Esc
            </kbd>{" "}
            close
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded border border-gray-600 text-[9px]">
              Enter
            </kbd>{" "}
            first
          </span>
        </div>
      </div>
    </div>
  );
};

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

// Auth UI removed (email/signup flow disabled per request)

// Lightweight confetti (canvas-based minimal)
const ConfettiTrigger: React.FC<{ active: boolean }> = ({ active }) => {
  useEffect(() => {
    if (!active) return;
    // Respect user reduced motion preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // skip animation
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
      vy: 2 + Math.random() * 3,
      vx: -1 + Math.random() * 2,
      rot: Math.random() * Math.PI,
      vr: -0.05 + Math.random() * 0.1,
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
    }, 2500);
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

// ImportModal removed (import/export feature dropped)

// Settings / Profile Panel
const SettingsPanel: React.FC<{
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
  statsSummary: { complete: number; total: number; streak: number; xp: number };
}> = ({
  onClose,
  userEmail,
  onReset,
  onLogout,
  prefFocusDefault,
  onToggleFocusDefault,
  prefDisableConfetti,
  onToggleDisableConfetti,
  prefReducedMotion,
  onToggleReducedMotion,
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
                    Local Profile
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Browser-only storage
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
                <div className="bg-gray-800/60 rounded p-2 flex flex-col gap-1">
                  <span className="text-gray-500">Week</span>
                  <span className="text-gray-200 font-medium">
                    {statsSummary.complete}/{statsSummary.total}
                  </span>
                </div>
                <div className="bg-gray-800/60 rounded p-2 flex flex-col gap-1">
                  <span className="text-gray-500">Streak</span>
                  <span className="text-gray-200 font-medium">
                    {statsSummary.streak}d
                  </span>
                </div>
                <div className="bg-gray-800/60 rounded p-2 flex flex-col gap-1">
                  <span className="text-gray-500">XP</span>
                  <span className="text-gray-200 font-medium">
                    {statsSummary.xp}
                  </span>
                </div>
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
            </div>
          </section>
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-gray-500">
              Data
            </h3>
            <div className="bg-gray-800/40 rounded p-4 space-y-4">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Your progress, streak, XP, achievements, notes and tasks are
                stored locally per account. Clearing data wipes only the current
                account's study state (not the account itself).
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    // Export: gather all relevant keys and download as JSON
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
                        const data = JSON.parse(text);
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
              This companion stores everything locally. For multi-device sync
              you would need a remote backend—intentionally omitted per
              requirements.
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

// Minimal Auth Screen (local-only) - email & password (hashed) stored locally
const AuthScreen: React.FC<{ onAuthed: (u: any) => void }> = ({ onAuthed }) => {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user =
        mode === "signup"
          ? await signup(email.trim(), password)
          : await login(email.trim(), password);
      onAuthed(user);
    } catch (err: any) {
      setError(err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
            AlgoHabit
          </h1>
          <p className="text-[11px] text-gray-400">
            Local-only account. Data stays in this browser.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="space-y-4 bg-gray-900/70 p-5 rounded-xl ring-1 ring-gray-800 shadow"
        >
          <div className="space-y-2">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800/60 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent placeholder-gray-500"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800/60 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent placeholder-gray-500"
            />
          </div>
          {error && (
            <div className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/30">
              {error}
            </div>
          )}
          <button
            disabled={loading}
            className="w-full text-[12px] font-medium px-3 py-2 rounded bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 disabled:opacity-50"
          >
            {loading
              ? mode === "signup"
                ? "Creating..."
                : "Signing in..."
              : mode === "signup"
              ? "Create Account"
              : "Sign In"}
          </button>
          <div className="text-[11px] text-gray-400 text-center">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-accent hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Need an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-accent hover:underline"
                >
                  Create one
                </button>
              </>
            )}
          </div>
        </form>
        <div className="text-[10px] text-gray-500 text-center">
          All local. Clearing browser storage removes data.
        </div>
      </div>
    </div>
  );
};
