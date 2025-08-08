# AlgoHabit

Focused, gamified habit & progress companion for an 8‑week DSA roadmap. No problem solving UI: all coding happens on LeetCode. AlgoHabit enforces consistency, visibility, motivation, and light gamification.

## Feature Mapping to Cheat Sheet & Weeks

| Feature                                                                    | Cheat Sheet Section                                                 | Week(s) |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------- |
| Timeline 8-week roadmap                                                    | 8-WEEK STUDY PATH                                                   | All     |
| Weekly topic checklist & status (Not Started/In Progress/Complete/Skipped) | All topic sections (Data Structures, Sorting, DP, Graphs, Advanced) | 1-8     |
| Daily notes & reflections per topic                                        | Interview Success Tips (Testing & review)                           | All     |
| Streak tracker & nudges                                                    | Habit formation objective                                           | All     |
| Weekly review stats (complete/in-progress/skipped %)                       | Progress summarization requirement                                  | All     |
| Motivation quotes & gentle nudges on inactivity                            | Behavioral coaching                                                 | All     |
| Notifications (local) & focus mode                                         | Time Management (45min) & reminders / deep work                     | All     |
| Leaderboard mock (points)                                                  | Optional gamification                                               | All     |
| Topic linking via cheatSheetRef                                            | Each cheat sheet heading                                            | All     |

## Core Data Model

- Topic: id, label, week, category, cheatSheetRef
- TopicProgress: Topic + status, lastTouched, dailyNotes
- AppState persisted in localStorage with streak logic (resets after >1 day gap)

## Status Flow

Button cycles: Not Started → In Progress → Complete → Skipped → …
Skipped remains visible (cannot silently drop) preventing unnoticed omissions.

## Streak & XP Logic

- Increment if user active on consecutive day.
- Reset to 1 if gap >1 day.
- Nudges derived from missed days heuristics.

## Weekly Review & Suggestions

Shows counts + progress bar; calls out remaining topics or congratulates when week locked.

## Notifications

- In-tab only (setTimeout + Service Worker immediate notifications)
- Requires page open (no server push). Graceful fallback if permission denied.

## Leaderboard (Mock)

- Points: complete=10, in-progress=3, skipped=0 (demo only until backend introduced).

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS (custom panel utilities, gradients)
- date-fns for dates
- LocalStorage (versioned schema) + light migration hook
- Service Worker (notification display, no external push)

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Current Enhancements Implemented

- Non-linear level curve & dynamic progress ring
- XP deltas & level-up pulse animation
- Achievement toast + confetti (suppressed easily for reduced motion later)
- Focus mode (side-rail suppression)
- Command palette (⌘/Ctrl + K) for week jumps
- Status timestamps (lastTouched) & contextual review suggestions

## Planned / Potential Enhancements

- Spaced repetition scheduling & heatmap
- Persist filter per week & more ARIA roles
- Pomodoro / focus session timer & quiet hours
- Tiered achievements / XP combo multiplier / streak freeze token
- Reduced motion & high contrast toggles
- Theme variants & shareable snapshot card

## Keyboard Shortcuts

| Shortcut       | Action               |
| -------------- | -------------------- |
| ⌘/Ctrl + K     | Open command palette |
| Esc            | Close palette        |
| Focus Mode Btn | Toggle focus mode    |

## Storage Keys (Version 2)

| Purpose        | Key                       |
| -------------- | ------------------------- |
| Topics         | dsa-habit-progress-v1     |
| Streak         | dsa-habit-streak-v1       |
| Last Active    | dsa-habit-last-active     |
| XP             | dsa-habit-xp-v1           |
| Achievements   | dsa-habit-achievements-v1 |
| Schema Version | dsa-habit-version         |

## Accessibility & UX Principles

- Clear status buttons (aria-label on cycle)
- High contrast dark baseline
- Motion guarded with `motion-safe`
- Gradual introduction of semantic headings & focus indicators

## Disclaimer

All algorithm practice & problem statements stay external (e.g. LeetCode). This app tracks habit + meta only.
