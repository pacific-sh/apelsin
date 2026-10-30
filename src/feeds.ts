import { config } from "./config.ts";

import type { Feed, Issue, Snapshot } from "./types.ts";

const stepSizes = Array.from({ length: config.maxFeedSize / config.feedStep }, (_, i) => (i + 1) * config.feedStep);
export const feedSizes = [...new Set(stepSizes).union(new Set(config.sizes))].sort((a, b) => a - b);

export const getFeeds = (snapshots: Snapshot[]): Feed[] =>
  feedSizes.map((size) => ({
    size,
    name: `Hacker News: Top ${size}`,
    hasPages: config.sizes.includes(size),
    issues: getIssues(snapshots, size),
  }));

function getIssues(snapshots: Snapshot[], size: number): Issue[] {
  const shownIds = new Set<number>();

  return snapshots.map(({ day, stories }, i) => {
    const pickedStories = stories.values().filter((story) => !shownIds.has(story.id)).take(size).toArray();
    pickedStories.forEach((story) => shownIds.add(story.id));

    return { day, number: i + 1, stories: pickedStories };
  }).reverse();
}
