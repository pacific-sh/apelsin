import { config } from "./config.ts";

import type { Feed, Issue, Snapshot } from "./types.ts";

const steps = Array.from({ length: config.maxFeedSize / config.feedStep }, (_, i) => (i + 1) * config.feedStep);
export const feedSizes = [...new Set(steps).union(new Set(config.sizes))].sort((a, b) => a - b);

export const feeds = (snapshots: Snapshot[]): Feed[] =>
  feedSizes.map((size) => ({
    size,
    name: `Hacker News: Top ${size}`,
    hasPages: config.sizes.includes(size),
    issues: issues(snapshots, size),
  }));

function issues(snapshots: Snapshot[], size: number): Issue[] {
  const shown = new Set<number>();

  return snapshots.map(({ day, stories }, i) => {
    const picked = stories.values().filter((story) => !shown.has(story.id)).take(size).toArray();
    picked.forEach((story) => shown.add(story.id));

    return { day, number: i + 1, stories: picked };
  }).reverse();
}
