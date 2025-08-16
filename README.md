# AlgoHabit

Focused, lightweight habit & progress companion for an 8‑week DSA roadmap (all solving happens on LeetCode). Drives consistency, visibility, motivation & light gamification.

Live App: https://ramithks.github.io/AlgoHabit/
Cheat Sheet (printable): `DSA_LeetCode_Cheatsheet.pdf`

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

## Data Model (Brief)

Topic (id, label, week, category, cheatSheetRef) + progress fields (status, lastTouched, dailyNotes, xp flags) stored locally (per user) in versioned localStorage.

## Status Flow

Button cycles: Not Started → In Progress → Complete → Skipped → …
Skipped remains visible (cannot silently drop) preventing unnoticed omissions.

## Streak & XP

Daily activity maintains streak; 1+ day gap resets. XP awards on first in‑progress & completion per topic; level curve non‑linear.

## Weekly Review

Progress counts, remaining topics callouts, simple review suggestions.

## Notifications

In-tab (service worker assisted) reminders only; no server push.

## Mock Leaderboard

Simple points (complete=10, in-progress=3) – placeholder for future backend.

## Tech

React + Vite + TypeScript, Tailwind CSS, date-fns, Service Worker (local only), localStorage (versioned, migratable).

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

## Implemented Highlights

- Level curve + progress ring & XP delta pulse
- Achievements toast + (optional) confetti
- Focus mode & command palette (⌘/Ctrl+K)
- Timestamps, contextual suggestions
- Import / Export JSON (Settings)
- 8‑week activity heatmap (streak intensity)
- Daily schedule generator (learn / reinforce / review cadence)
- Auto deploy via GitHub Actions → gh-pages

## Roadmap (Short)

- Spaced repetition & retention heatmap
- Pomodoro / quiet hours
- Achievement tiers & combo multipliers
- Reduced motion & high contrast / themes
- PWA offline support
- Shareable snapshot card

## Deployment

GitHub Actions builds & publishes to `gh-pages` on push to `main` (base `/AlgoHabit/`).

## Data Portability

Settings → Data: Export (JSON snapshot) & Import (restore entire state).

## Activity Heatmap

8-week contribution-style grid; greener = deeper recent streak cluster.

## License

MIT License (see `LICENSE`).

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

## Supabase Setup

1. Enable Email Auth and Password Policy

- In Supabase dashboard: Settings → Auth → Providers → Email → Enable.
- Settings → Auth → Password rules: require lowercase, uppercase, digits, and symbols.

2. Apply Database Schema

- Open SQL Editor and run `supabase/schema.sql` from this repo.
- This creates normalized tables (profiles, user_metrics, topics_progress, topic_daily_notes, tasks, activity_log), RLS policies using `auth.uid()`, and triggers to keep `profiles.email` synced with `auth.users`.

3. Client Configuration

- Use Supabase JS client with Auth (email/password). Remove any custom header RLS code and rely on the authenticated session.
