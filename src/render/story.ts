import { markup } from "./markup.ts";

import type { Story } from "../types.ts";

export const HN = "https://news.ycombinator.com/";

export function source({ id, url }: Story) {
  const link = URL.parse(url ?? "");

  return { href: link?.href ?? discussion(id), host: link?.hostname.replace(/^www\./, "") };
}

export const stats = ({ id, points, comments }: Story) =>
  markup`${count(points, "point")}, <a href="${discussion(id)}">${count(comments, "comment")}</a>`;

const discussion = (id: number) => `${HN}item?id=${id}`;
const count = (n: number, noun: string) => `${n.toLocaleString("en-US")} ${noun}${n === 1 ? "" : "s"}`;
