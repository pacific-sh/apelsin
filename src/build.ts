import { cp } from "node:fs/promises";
import { dirname } from "node:path";

import { config } from "./config.ts";
import { feedSizes } from "./feeds.ts";
import { getTopStories } from "./hn.ts";
import { renderSite } from "./render/mod.ts";
import { addDays, getPublishTime } from "./time.ts";

import type { Snapshot } from "./types.ts";

async function loadSnapshots(): Promise<Snapshot[]> {
  const entries = await Array.fromAsync(Deno.readDir("data")).catch(() => []);
  const fileNames = entries.map(({ name }) => name).filter((name) => name.endsWith(".json")).sort();

  return Array.fromAsync(fileNames, (fileName) => Deno.readTextFile(`data/${fileName}`).then(JSON.parse));
}

function getLatestIssueDay() {
  let day = Temporal.Now.plainDateISO().add({ days: 1 }).toString();
  while (getPublishTime(day).epochMilliseconds > Date.now()) day = addDays(day, -1);
  return day;
}

function getMissingDays(after = "") {
  const latestDay = getLatestIssueDay();
  const recentDays = Array.from({ length: config.feedDays }, (_, i) => addDays(latestDay, i + 1 - config.feedDays));

  return recentDays.filter((day) => day > after);
}

async function takeSnapshot(day: string): Promise<Snapshot> {
  const stories = await getTopStories({
    from: getPublishTime(addDays(day, -2)),
    to: getPublishTime(day),
    // Twice the largest feed: the window overlaps yesterday's, so up to half may already have been shown.
    limit: 2 * Math.max(...feedSizes),
  });
  if (!stories.length) throw new Error(`${day}: no stories`);

  const snapshot = { day, stories };
  await Deno.mkdir("data", { recursive: true });
  await Deno.writeTextFile(`data/${day}.json`, JSON.stringify(snapshot));

  console.log(`${day}: ${stories.length} stories`);
  return snapshot;
}

async function writeSite(snapshots: Snapshot[]) {
  if (!snapshots.length) throw new Error("No snapshots in data/");
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:8000";

  await Deno.remove("dist", { recursive: true }).catch(() => {});
  await cp("./public", "./dist", { recursive: true });

  for (const [path, contents] of renderSite(snapshots, siteUrl)) {
    await Deno.mkdir(dirname(`dist/${path}`), { recursive: true });
    await Deno.writeTextFile(`dist/${path}`, `${contents}`);
  }
}

const snapshots = await loadSnapshots();

if (!Deno.args.includes("--offline")) {
  for (const day of getMissingDays(snapshots.at(-1)?.day)) {
    snapshots.push(await takeSnapshot(day));
  }
}

await writeSite(snapshots);
