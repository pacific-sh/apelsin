import { config } from "../config.ts";
import { getPublishTime } from "../time.ts";
import { type Markup, markup } from "./markup.ts";
import { getStoryLink, HN_URL, renderStats } from "./story.ts";

import type { Feed, Issue, Story } from "../types.ts";

export function renderHomePage(feeds: Feed[]) {
  const mainFeed = feeds.find(({ size }) => size === config.sizes[0])!;
  const latestIssue = mainFeed.issues[0]!;
  const hnLink = renderMarkdownLink({ text: "Hacker News", href: HN_URL, display: "news.ycombinator.com" });

  return renderPage({
    title: config.title,
    basePath: "./",
    feeds: feeds.filter(({ hasPages }) => hasPages),
    body: markup`
<p>The best of ${hnLink}, daily at ${formatPublishTime(latestIssue.day)}</p>
<h2>RSS</h2>
${renderFeedList(feeds)}
<h2>${renderIssueLink(latestIssue, `top${mainFeed.size}/${latestIssue.day}.html`)}</h2>
${renderStoryList(latestIssue.stories)}
<p>${renderMarkdownLink({ text: "all issues", href: `top${mainFeed.size}/` })}</p>`,
  });
}

export function renderArchivePage(feed: Feed) {
  const { size, name, issues } = feed;

  return renderPage({
    title: name,
    breadcrumbs: [`top ${size}`],
    feeds: [feed],
    body: markup`
<h1>Top ${size}</h1>
<p>${renderMarkdownLink({ text: "rss", href: `../top${size}.xml`, display: `top${size}.xml` })}</p>
<ul>${issues.map((issue) => markup`<li>${renderIssueLink(issue)}</li>`)}</ul>`,
  });
}

export function renderIssuePage({ feed, issue, prev, next }: { feed: Feed; issue: Issue; prev?: Issue; next?: Issue }) {
  const backLink = prev && markup`<span>← ${renderIssueLink(prev)}</span>`;
  const forwardLink = next && markup`<span class="next">${renderIssueLink(next)} →</span>`;

  return renderPage({
    title: `${feed.name} for ${issue.day}`,
    breadcrumbs: [markup`<a href="./">top ${feed.size}</a>`, `Issue #${issue.number}`],
    feeds: [feed],
    body: markup`
<h1>${renderIssueLink(issue)}</h1>
${renderStoryList(issue.stories)}
<p class="pager">${backLink}${forwardLink}</p>`,
  });
}

function renderPage({ title, basePath = "../", breadcrumbs = [], feeds, body }: {
  title: string;
  basePath?: string;
  breadcrumbs?: (string | Markup)[];
  feeds: Feed[];
  body: Markup;
}) {
  const feedLinks = feeds.map(({ size, name }) =>
    markup`<link rel="alternate" type="application/rss+xml" title="${name}" href="${basePath}top${size}.xml">`
  );

  return markup`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="${basePath}favicon.ico" sizes="32x32">
<link rel="icon" href="${basePath}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${basePath}apple-touch-icon.png">
<link rel="stylesheet" href="${basePath}style.css">
${feedLinks}
</head>
<body>
<header><a href="${basePath}">${config.title}</a>${breadcrumbs.map((crumb) => markup` / ${crumb}`)}</header>
<main>${body}</main>
</body>
</html>
`;
}

function renderFeedList(feeds: Feed[]) {
  const renderItems = (feeds: Feed[]) =>
    feeds.map(({ size }) => markup`<li>${renderMarkdownLink({ text: `top ${size}`, href: `top${size}.xml` })}</li>`);
  const foldedItems = markup`<li><details><summary>...</summary><ul>${
    renderItems(feeds.slice(2, -2))
  }</ul></details></li>`;

  return markup`<ul>${renderItems(feeds.slice(0, 2))}${foldedItems}${renderItems(feeds.slice(-2))}</ul>`;
}

function renderStoryList(stories: Story[]) {
  const items = stories.map((story) => {
    const { href, host } = getStoryLink(story);
    const link = renderMarkdownLink({ text: story.title, href, display: host ?? "hn" });

    return markup`<li>${link}<span class="meta">${renderStats(story)}</span></li>`;
  });

  return markup`<ol>${items}</ol>`;
}

const renderIssueLink = (issue: Issue, href = `${issue.day}.html`) =>
  renderMarkdownLink({ text: `Issue #${issue.number}`, href, display: issue.day });

const formatPublishTime = (day: string) =>
  getPublishTime(day).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

const renderMarkdownLink = ({ text, href, display = href }: { text: string; href: string; display?: string }) =>
  markup`<a href="${href}"><span class="sym">[</span>${text}<span class="sym">](</span><span class="url">${display}</span><span class="sym">)</span></a>`;
