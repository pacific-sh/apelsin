import { cp } from "node:fs/promises";
import { dirname } from "node:path";

import { config } from "./config.ts";
import { feedSizes } from "./feeds.ts";
import { getTopStories } from "./hn.ts";
import { render } from "./render/mod.ts";
import { addDays, publishedAt } from "./time.ts";

import type { Snapshot } from "./types.ts";

async function loadSnapshots(): Promise<Snapshot[]> {
  const files = await Array.fromAsync(Deno.readDir("data")).catch(() => []);
  const names = files.map(({ name }) => name).filter((name) => name.endsWith(".json")).sort();

  return Array.fromAsync(names, (name) => Deno.readTextFile(`data/${name}`).then(JSON.parse));
}

function latestIssueDay() {
  let day = Temporal.Now.plainDateISO().add({ days: 1 }).toString();
  while (publishedAt(day).epochMilliseconds > Date.now()) day = addDays(day, -1);
  return day;
}

function missingDays(newest = "") {
  const due = latestIssueDay();
  const days = Array.from({ length: config.feedDays }, (_, i) => addDays(due, i + 1 - config.feedDays));

  return days.filter((day) => day > newest);
}

async function takeSnapshot(day: string): Promise<Snapshot> {
  const stories = await getTopStories({
    from: publishedAt(addDays(day, -2)),
    to: publishedAt(day),
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
  const url = Deno.env.get("SITE_URL") ?? "http://localhost:8000";

  await Deno.remove("dist", { recursive: true }).catch(() => {});
  await cp("./public", "./dist", { recursive: true });

  for (const [path, contents] of render(snapshots, url)) {
    await Deno.mkdir(dirname(`dist/${path}`), { recursive: true });
    await Deno.writeTextFile(`dist/${path}`, `${contents}`);
  }
}

const snapshots = await loadSnapshots();

if (!Deno.args.includes("--offline")) {
  for (const day of missingDays(snapshots.at(-1)?.day)) {
    snapshots.push(await takeSnapshot(day));
  }
}

await writeSite(snapshots);
