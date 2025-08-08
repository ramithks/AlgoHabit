import React from 'react';
import { TopicProgress } from '../plan';
import { computeWeekStats } from '../state';

interface Props { week: number; topics: TopicProgress[]; }

export const WeeklyReview: React.FC<Props> = ({ week, topics }) => {
  const stats = computeWeekStats(week, topics);
  const pending = topics.filter(t => t.week === week && t.status !== 'complete' && t.status !== 'skipped').length;
  return (
    <section className="bg-gray-900 rounded-xl p-4 ring-1 ring-gray-800 space-y-3">
      <h2 className="text-sm font-semibold text-gray-300">Weekly Review</h2>
      <div className="text-xs text-gray-400 grid grid-cols-2 gap-y-1">
        <span>Total Topics:</span><span className="text-gray-200 text-right">{stats.total}</span>
        <span>Complete:</span><span className="text-emerald-400 text-right">{stats.complete}</span>
        <span>In Progress:</span><span className="text-amber-400 text-right">{stats.inProgress}</span>
        <span>Skipped:</span><span className="text-rose-400 text-right">{stats.skipped}</span>
        <span>Week Completion:</span><span className="text-accent text-right">{stats.pct}%</span>
      </div>
      <div className="w-full h-2 rounded bg-gray-800 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-accent via-fuchsia-500 to-rose-500" style={{ width: stats.pct + '%' }} />
      </div>
      {pending > 0 && (
        <div className="text-[11px] text-amber-400">Finish {pending} more topic{pending>1?'s':''} to close Week {week} strong.</div>
      )}
      {pending === 0 && <div className="text-[11px] text-emerald-400">Great! Week {week} locked in. Advance or reinforce with spaced review.</div>}
    </section>
  );
};
