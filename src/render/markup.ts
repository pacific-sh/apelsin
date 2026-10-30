import { escape } from "@std/html";

export class Markup extends String {}

// String.raw only interleaves here: the strings are already cooked.
export const markup = (strings: TemplateStringsArray, ...values: unknown[]) =>
  new Markup(String.raw({ raw: strings }, ...values.map(stringify)));

export const raw = (html: string) => new Markup(clean(html));

function stringify(value: unknown): string {
  if (value instanceof Markup) return `${value}`;
  if (Array.isArray(value)) return value.map(stringify).join("");
  return clean(escape(`${value ?? ""}`));
}

const clean = (text: string) => text.replace(/[[\p{Cc}\p{Cs}]--[\t\n\r]]/gv, "");
