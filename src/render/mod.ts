import { feeds } from "../feeds.ts";
import { archivePage, homePage, issuePage } from "./pages.ts";
import { rss } from "./rss.ts";

import type { Snapshot } from "../types.ts";
import type { Markup } from "./markup.ts";

export function* render(snapshots: Snapshot[], url: string): Generator<[path: string, contents: Markup]> {
  const all = feeds(snapshots);
  yield ["index.html", homePage(all)];

  for (const feed of all) {
    const { size, hasPages, issues } = feed;

    yield [`top${size}.xml`, rss(feed, url)];
    if (!hasPages) continue;

    yield [`top${size}/index.html`, archivePage(feed)];
    for (const [i, issue] of issues.entries()) {
      yield [`top${size}/${issue.day}.html`, issuePage({ feed, issue, prev: issues[i + 1], next: issues[i - 1] })];
    }
  }
}
