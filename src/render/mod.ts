import { getFeeds } from "../feeds.ts";
import { renderArchivePage, renderHomePage, renderIssuePage } from "./pages.ts";
import { renderRss } from "./rss.ts";

import type { Snapshot } from "../types.ts";
import type { Markup } from "./markup.ts";

export function* renderSite(snapshots: Snapshot[], siteUrl: string): Generator<[path: string, contents: Markup]> {
  const feeds = getFeeds(snapshots);
  yield ["index.html", renderHomePage(feeds)];

  for (const feed of feeds) {
    const { size, hasPages, issues } = feed;

    yield [`top${size}.xml`, renderRss(feed, siteUrl)];
    if (!hasPages) continue;

    yield [`top${size}/index.html`, renderArchivePage(feed)];
    for (const [i, issue] of issues.entries()) {
      yield [
        `top${size}/${issue.day}.html`,
        renderIssuePage({ feed, issue, prev: issues[i + 1], next: issues[i - 1] }),
      ];
    }
  }
}
