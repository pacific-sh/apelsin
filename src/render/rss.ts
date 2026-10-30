import { unescape } from "@std/html";

import { config } from "../config.ts";
import { getPublishTime } from "../time.ts";
import { markup, rawMarkup } from "./markup.ts";
import { getStoryLink, renderStats } from "./story.ts";

import type { Feed, Story } from "../types.ts";

const MAX_TEXT_LENGTH = 280;

export function renderRss({ size, name, hasPages, issues }: Feed, siteUrl: string) {
  const latestIssues = issues.slice(0, config.feedDays);
  const items = latestIssues.map(({ day, number, stories }) => {
    const pageLink = hasPages ? markup`<link>${siteUrl}/top${size}/${day}.html</link>\n` : "";

    return markup`
<item>
<title>Issue #${number}</title>
${pageLink}<guid isPermaLink="false">${siteUrl}/top${size}.xml#${day}</guid>
<pubDate>${formatPubDate(day)}</pubDate>
<description><![CDATA[${stories.map(renderStory)}]]></description>
</item>`;
  });

  return markup`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${name}</title>
<link>${siteUrl}/${hasPages ? `top${size}/` : ""}</link>
<atom:link href="${siteUrl}/top${size}.xml" rel="self" type="application/rss+xml"/>
<description>The ${size} highest-rated Hacker News stories of each day</description>
<language>en</language>
<pubDate>${formatPubDate(latestIssues[0]!.day)}</pubDate>${items}
</channel>
</rss>
`;
}

function renderStory(story: Story, index: number) {
  const { href, host } = getStoryLink(story);
  const hostPrefix = host && `${host} — `;
  const quote = story.text && markup`<blockquote><p>${renderPostText(story.text)}</p></blockquote>`;

  return markup`<h3>${index + 1}. <a href="${href}">${story.title}</a></h3><p>${hostPrefix}${
    renderStats(story)
  }</p>${quote}`;
}

function renderPostText(html: string) {
  const plainText = unescape(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  if (plainText.length <= MAX_TEXT_LENGTH) return rawMarkup(html.replaceAll("<p>", "<br>"));

  return `${plainText.slice(0, MAX_TEXT_LENGTH).replace(/[\s.,;:!?-]*\s\S*$/, "")}…`;
}

const formatPubDate = (day: string) => new Date(getPublishTime(day).epochMilliseconds).toUTCString();
