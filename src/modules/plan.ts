export type TopicStatus =
  | "not-started"
  | "in-progress"
  | "complete"
  | "skipped";

export interface Topic {
  id: string;
  label: string;
  week: number;
  category:
    | "foundation"
    | "linear"
    | "trees"
    | "sorting"
    | "dp"
    | "graphs"
    | "advanced"
    | "practice";
  cheatSheetRef: string; // pointer to cheat sheet section name
}

export interface TopicProgress extends Topic {
  status: TopicStatus;
  lastTouched?: string; // ISO date
  dailyNotes: Record<string, string>; // date -> note
  // XP award flags so repeated cycles don't farm XP
  xpFlags?: { inProgress?: boolean; complete?: boolean };
}

export const topics: Topic[] = [
  // Week 1 – Foundation
  {
    id: "big-o",
    label: "Big-O Complexity",
    week: 1,
    category: "foundation",
    cheatSheetRef: "BIG-O COMPLEXITY",
  },
  {
    id: "arrays",
    label: "Arrays",
    week: 1,
    category: "foundation",
    cheatSheetRef: "DATA STRUCTURE HIGHLIGHTS",
  },
  {
    id: "strings",
    label: "Strings",
    week: 1,
    category: "foundation",
    cheatSheetRef: "DATA STRUCTURE HIGHLIGHTS",
  },
  {
    id: "hash-maps",
    label: "Hash Maps",
    week: 1,
    category: "foundation",
    cheatSheetRef: "DATA STRUCTURE HIGHLIGHTS",
  },
  // Week 2 – Linear Structures
  {
    id: "linked-lists",
    label: "Linked Lists",
    week: 2,
    category: "linear",
    cheatSheetRef: "DATA STRUCTURE HIGHLIGHTS",
  },
  {
    id: "stacks",
    label: "Stacks",
    week: 2,
    category: "linear",
    cheatSheetRef: "DATA STRUCTURE HIGHLIGHTS",
  },
  {
    id: "queues",
    label: "Queues",
    week: 2,
    category: "linear",
    cheatSheetRef: "DATA STRUCTURE HIGHLIGHTS",
  },
  // Week 3 – Trees
  {
    id: "binary-trees",
    label: "Binary Trees & Traversals",
    week: 3,
    category: "trees",
    cheatSheetRef: "ADVANCED STRUCTURES",
  },
  {
    id: "dfs-bfs",
    label: "DFS vs BFS Patterns",
    week: 3,
    category: "trees",
    cheatSheetRef: "TRAVERSALS & GRAPH ALGORITHMS",
  },
  {
    id: "recursion",
    label: "Recursion Patterns",
    week: 3,
    category: "trees",
    cheatSheetRef: "CORE ALGORITHMS",
  },
  // Week 4 – Sorting
  {
    id: "sorting-overview",
    label: "Sorting Overview",
    week: 4,
    category: "sorting",
    cheatSheetRef: "SORTING ALGORITHMS",
  },
  {
    id: "merge-sort",
    label: "Merge Sort",
    week: 4,
    category: "sorting",
    cheatSheetRef: "SORTING ALGORITHMS",
  },
  {
    id: "quick-sort",
    label: "Quick Sort",
    week: 4,
    category: "sorting",
    cheatSheetRef: "SORTING ALGORITHMS",
  },
  {
    id: "heap-sort",
    label: "Heap Sort",
    week: 4,
    category: "sorting",
    cheatSheetRef: "SORTING ALGORITHMS",
  },
  {
    id: "binary-search",
    label: "Binary Search Variants",
    week: 4,
    category: "sorting",
    cheatSheetRef: "SORTING ALGORITHMS",
  },
  // Week 5 – Dynamic Programming
  {
    id: "dp-basics",
    label: "DP Basics (Memo vs Tab)",
    week: 5,
    category: "dp",
    cheatSheetRef: "DYNAMIC PROGRAMMING",
  },
  {
    id: "1d-dp",
    label: "1D DP Patterns",
    week: 5,
    category: "dp",
    cheatSheetRef: "DYNAMIC PROGRAMMING",
  },
  {
    id: "2d-dp",
    label: "2D DP Patterns",
    week: 5,
    category: "dp",
    cheatSheetRef: "DYNAMIC PROGRAMMING",
  },
  {
    id: "knapsack",
    label: "Knapsack",
    week: 5,
    category: "dp",
    cheatSheetRef: "DYNAMIC PROGRAMMING",
  },
  // Week 6 – Graphs
  {
    id: "graph-traversal",
    label: "Graph Traversal (DFS/BFS)",
    week: 6,
    category: "graphs",
    cheatSheetRef: "GRAPH ALGORITHMS",
  },
  {
    id: "shortest-path",
    label: "Shortest Path (Dijkstra/Bellman)",
    week: 6,
    category: "graphs",
    cheatSheetRef: "GRAPH ALGORITHMS",
  },
  {
    id: "mst",
    label: "MST (Kruskal/Prim)",
    week: 6,
    category: "graphs",
    cheatSheetRef: "GRAPH ALGORITHMS",
  },
  {
    id: "union-find",
    label: "Union-Find",
    week: 6,
    category: "graphs",
    cheatSheetRef: "GRAPH ALGORITHMS",
  },
  // Week 7 – Advanced
  {
    id: "heaps",
    label: "Heaps / Priority Queues",
    week: 7,
    category: "advanced",
    cheatSheetRef: "ADVANCED STRUCTURES",
  },
  {
    id: "tries",
    label: "Tries",
    week: 7,
    category: "advanced",
    cheatSheetRef: "ADVANCED STRUCTURES",
  },
  {
    id: "backtracking",
    label: "Backtracking",
    week: 7,
    category: "advanced",
    cheatSheetRef: "PROBLEM-SOLVING PATTERNS",
  },
  {
    id: "segment-tree",
    label: "Segment Trees / Fenwick",
    week: 7,
    category: "advanced",
    cheatSheetRef: "ADVANCED STRUCTURES",
  },
  // Week 8 – Practice
  {
    id: "company-sets",
    label: "Company Problem Sets",
    week: 8,
    category: "practice",
    cheatSheetRef: "8-WEEK STUDY PATH",
  },
  {
    id: "mock-interviews",
    label: "Mock Interviews",
    week: 8,
    category: "practice",
    cheatSheetRef: "INTERVIEW SUCCESS TIPS",
  },
];

export const TOTAL_WEEKS = 8;

export function initialProgress(): TopicProgress[] {
  return topics.map((t) => ({
    ...t,
    status: "not-started",
    dailyNotes: {},
    xpFlags: {},
  }));
}
