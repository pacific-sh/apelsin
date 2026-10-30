import { unescape } from "@std/html";

import { config } from "../config.ts";
import { publishedAt } from "../time.ts";
import { markup, raw } from "./markup.ts";
import { source, stats } from "./story.ts";

import type { Feed, Story } from "../types.ts";

const BODY_MAX_LENGTH = 280;

export function rss({ size, name, hasPages, issues }: Feed, url: string) {
  const latest = issues.slice(0, config.feedDays);
  const items = latest.map(({ day, number, stories }) => {
    const link = hasPages ? markup`<link>${url}/top${size}/${day}.html</link>\n` : "";

    return markup`
<item>
<title>Issue #${number}</title>
${link}<guid isPermaLink="false">${url}/top${size}.xml#${day}</guid>
<pubDate>${pubDate(day)}</pubDate>
<description><![CDATA[${stories.map(item)}]]></description>
</item>`;
  });

  return markup`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${name}</title>
<link>${url}/${hasPages ? `top${size}/` : ""}</link>
<atom:link href="${url}/top${size}.xml" rel="self" type="application/rss+xml"/>
<description>The ${size} highest-rated Hacker News stories of each day</description>
<language>en</language>
<pubDate>${pubDate(latest[0]!.day)}</pubDate>${items}
</channel>
</rss>
`;
}

function item(story: Story, i: number) {
  const { href, host } = source(story);
  const origin = host && `${host} — `;
  const quote = story.text && markup`<blockquote><p>${postText(story.text)}</p></blockquote>`;

  return markup`<h3>${i + 1}. <a href="${href}">${story.title}</a></h3><p>${origin}${stats(story)}</p>${quote}`;
}

function postText(html: string) {
  const text = unescape(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  if (text.length <= BODY_MAX_LENGTH) return raw(html.replaceAll("<p>", "<br>"));

  return `${text.slice(0, BODY_MAX_LENGTH).replace(/[\s.,;:!?-]*\s\S*$/, "")}…`;
}

const pubDate = (day: string) => new Date(publishedAt(day).epochMilliseconds).toUTCString();
