# AlgoHabit

Focused habit & progress companion for an 8‑week DSA roadmap. Tracks topics, streaks, XP, reviews, and focus sessions.

Live App: https://ramithks.github.io/AlgoHabit/
Cheat Sheet (printable PDF included in repo)

## Features

- 8‑week timeline and weekly topic checklist (Not Started / In Progress / Complete / Skipped)
- Compact level badge with non‑linear XP curve and XP delta pulse
- Streak tracker + 8‑week activity heatmap (hover for details)
- Motivation: steady daily tip + periodic quote
- Focus Clock (25m focus / 5m break)
- Focus Mode (hides side panels; centers core)
- Local notifications (in‑tab only) with reminder scheduling
- Weekly review summary + simple review queue
- Self points scoreboard (mock)

## Tech

React + Vite + TypeScript, Tailwind CSS, date-fns, Service Worker (local), localStorage.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Notes

- Settings → Data: Export/Import your state (JSON)
- Privacy: Supabase Auth is configured, your data syncs to the cloud

## License

MIT (see `LICENSE`).
