import { config } from "../config.ts";
import { publishedAt } from "../time.ts";
import { type Markup, markup } from "./markup.ts";
import { HN, source, stats } from "./story.ts";

import type { Feed, Issue, Story } from "../types.ts";

export function homePage(feeds: Feed[]) {
  const main = feeds.find(({ size }) => size === config.sizes[0])!;
  const latest = main.issues[0]!;

  return page({
    title: config.title,
    base: "./",
    feeds: feeds.filter(({ hasPages }) => hasPages),
    body: markup`
<p>The best of ${md({ text: "Hacker News", href: HN, shown: "news.ycombinator.com" })}, daily at ${time(latest.day)}</p>
<h2>RSS</h2>
${feedList(feeds)}
<h2>${issueLink(latest, `top${main.size}/${latest.day}.html`)}</h2>
${storyList(latest.stories)}
<p>${md({ text: "all issues", href: `top${main.size}/` })}</p>`,
  });
}

export function archivePage(feed: Feed) {
  const { size, name, issues } = feed;

  return page({
    title: name,
    crumbs: [`top ${size}`],
    feeds: [feed],
    body: markup`
<h1>Top ${size}</h1>
<p>${md({ text: "rss", href: `../top${size}.xml`, shown: `top${size}.xml` })}</p>
<ul>${issues.map((issue) => markup`<li>${issueLink(issue)}</li>`)}</ul>`,
  });
}

export function issuePage({ feed, issue, prev, next }: { feed: Feed; issue: Issue; prev?: Issue; next?: Issue }) {
  const back = prev && markup`<span>← ${issueLink(prev)}</span>`;
  const forward = next && markup`<span class="next">${issueLink(next)} →</span>`;

  return page({
    title: `${feed.name} for ${issue.day}`,
    crumbs: [markup`<a href="./">top ${feed.size}</a>`, `Issue #${issue.number}`],
    feeds: [feed],
    body: markup`
<h1>${issueLink(issue)}</h1>
${storyList(issue.stories)}
<p class="pager">${back}${forward}</p>`,
  });
}

function page({ title, base = "../", crumbs = [], feeds, body }: {
  title: string;
  base?: string;
  crumbs?: (string | Markup)[];
  feeds: Feed[];
  body: Markup;
}) {
  const alternates = feeds.map(({ size, name }) =>
    markup`<link rel="alternate" type="application/rss+xml" title="${name}" href="${base}top${size}.xml">`
  );

  return markup`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="${base}favicon.ico" sizes="32x32">
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${base}apple-touch-icon.png">
<link rel="stylesheet" href="${base}style.css">
${alternates}
</head>
<body>
<header><a href="${base}">${config.title}</a>${crumbs.map((crumb) => markup` / ${crumb}`)}</header>
<main>${body}</main>
</body>
</html>
`;
}

function feedList(feeds: Feed[]) {
  const items = (feeds: Feed[]) =>
    feeds.map(({ size }) => markup`<li>${md({ text: `top ${size}`, href: `top${size}.xml` })}</li>`);
  const folded = markup`<li><details><summary>...</summary><ul>${items(feeds.slice(2, -2))}</ul></details></li>`;

  return markup`<ul>${items(feeds.slice(0, 2))}${folded}${items(feeds.slice(-2))}</ul>`;
}

function storyList(stories: Story[]) {
  const items = stories.map((story) => {
    const { href, host } = source(story);
    return markup`<li>${md({ text: story.title, href, shown: host ?? "hn" })}<span class="meta">${
      stats(story)
    }</span></li>`;
  });

  return markup`<ol>${items}</ol>`;
}

const issueLink = (issue: Issue, href = `${issue.day}.html`) =>
  md({ text: `Issue #${issue.number}`, href, shown: issue.day });

const time = (day: string) =>
  publishedAt(day).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

const md = ({ text, href, shown = href }: { text: string; href: string; shown?: string }) =>
  markup`<a href="${href}"><span class="sym">[</span>${text}<span class="sym">](</span><span class="url">${shown}</span><span class="sym">)</span></a>`;
