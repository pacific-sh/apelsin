import { markup } from "./markup.ts";

import type { Story } from "../types.ts";

export const HN_URL = "https://news.ycombinator.com/";

export function getStoryLink({ id, url }: Story) {
  const parsedUrl = URL.parse(url ?? "");

  return { href: parsedUrl?.href ?? getDiscussionUrl(id), host: parsedUrl?.hostname.replace(/^www\./, "") };
}

export const renderStats = ({ id, points, comments }: Story) =>
  markup`${formatCount(points, "point")}, <a href="${getDiscussionUrl(id)}">${formatCount(comments, "comment")}</a>`;

const getDiscussionUrl = (id: number) => `${HN_URL}item?id=${id}`;
const formatCount = (count: number, noun: string) =>
  `${count.toLocaleString("en-US")} ${noun}${count === 1 ? "" : "s"}`;
