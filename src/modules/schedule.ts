import { topics } from "./plan";
import { formatISO } from "date-fns";

export interface DailyTask {
  id: string;
  date: string; // ISO date (no time)
  topicId?: string; // optional direct topic mapping
  kind: "learn" | "review" | "reinforce" | "plan";
  title: string;
  prereq?: string; // textual prerequisite
  done: boolean;
}

// Generate an 8-week (56 day) schedule with learning tasks first 5 days, day6 reinforce, day7 review/catchup.
export function generateDailyPlan(start: Date): DailyTask[] {
  const days: DailyTask[] = [];
  const startISO = formatISO(start, { representation: "date" });
  // Map weeks -> topics sequentially
  const topicsByWeek = new Map<number, string[]>(
    Array.from({ length: 8 }, (_, i) => [
      i + 1,
      topics.filter((t) => t.week === i + 1).map((t) => t.id),
    ])
  );
  let topicPointer: Record<number, number> = {};
  for (let w = 1; w <= 8; w++) topicPointer[w] = 0;

  for (let offset = 0; offset < 56; offset++) {
    const date = new Date(start.getTime());
    date.setDate(start.getDate() + offset);
    const iso = formatISO(date, { representation: "date" });
    const week = Math.floor(offset / 7) + 1;
    const dayOfWeek = offset % 7; // 0..6
    if (dayOfWeek < 5) {
      // learning day
      const list = topicsByWeek.get(week) || [];
      const idx = topicPointer[week];
      if (idx < list.length) {
        const topicId = list[idx];
        topicPointer[week]++;
        days.push({
          id: `task-${iso}-${topicId}`,
          date: iso,
          topicId,
          kind: "learn",
          title: `Learn & practice: ${topicId}`,
          prereq: derivePrereq(topicId),
          done: false,
        });
      } else {
        days.push({
          id: `task-${iso}-buffer`,
          date: iso,
          kind: "reinforce",
          title: "Reinforce earlier topics / extra LeetCode set",
          done: false,
        });
      }
    } else if (dayOfWeek === 5) {
      days.push({
        id: `task-${iso}-reinforce`,
        date: iso,
        kind: "reinforce",
        title: "Reinforce & partial review (flash revisit notes)",
        done: false,
      });
    } else {
      days.push({
        id: `task-${iso}-review`,
        date: iso,
        kind: "review",
        title: "Weekly Review & Retrospective + Plan next week",
        done: false,
      });
      days.push({
        id: `task-${iso}-plan`,
        date: iso,
        kind: "plan",
        title: "Plan next 5 learning slots & calendar block",
        done: false,
      });
    }
  }
  return days;
}

function derivePrereq(topicId: string): string | undefined {
  if (topicId.includes("binary-search")) return "Arrays + Big-O basics";
  if (topicId.includes("quick-sort") || topicId.includes("merge-sort"))
    return "Big-O + Recursion conceptual";
  if (topicId.includes("graph")) return "DFS/BFS fundamentals";
  if (topicId.includes("dp")) return "Recursion + memoization concept";
  if (topicId.includes("tries")) return "Strings + prefix logic";
  return undefined;
}
