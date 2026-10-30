import { escape } from "@std/html";

export class Markup extends String {}

// String.raw only interleaves here: the strings are already cooked.
export const markup = (strings: TemplateStringsArray, ...values: unknown[]) =>
  new Markup(String.raw({ raw: strings }, ...values.map(stringify)));

export const rawMarkup = (html: string) => new Markup(stripControlChars(html));

function stringify(value: unknown): string {
  if (value instanceof Markup) return `${value}`;
  if (Array.isArray(value)) return value.map(stringify).join("");
  return stripControlChars(escape(`${value ?? ""}`));
}

const stripControlChars = (text: string) => text.replace(/[[\p{Cc}\p{Cs}]--[\t\n\r]]/gv, "");
