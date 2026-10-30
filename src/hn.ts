import type { Story } from "./types.ts";

type Hit = {
  objectID: string;
  title: string;
  url?: string;
  points?: number;
  num_comments?: number;
  story_text?: string;
};

async function fetchJson(url: string) {
  for (const retryIn of [2, 4, 8, 0]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      return await res.json();
    } catch (err) {
      if (!retryIn) throw err;

      console.warn(`${err}, retrying in ${retryIn}s`);
      await new Promise((resolve) => setTimeout(resolve, retryIn * 1000));
    }
  }
}

// With no query, Algolia ranks by points.
export async function getTopStories({ from, to, limit }: {
  from: Temporal.ZonedDateTime;
  to: Temporal.ZonedDateTime;
  limit: number;
}) {
  const query = new URLSearchParams({
    tags: "story",
    numericFilters: `created_at_i>=${from.epochMilliseconds / 1000},created_at_i<${to.epochMilliseconds / 1000}`,
    hitsPerPage: `${limit}`,
    attributesToRetrieve: "title,url,points,num_comments,story_text",
  });

  const { hits }: { hits: Hit[] } = await fetchJson(`https://hn.algolia.com/api/v1/search?${query}`);

  return hits.map((hit): Story => ({
    id: Number(hit.objectID),
    title: hit.title,
    points: hit.points ?? 0,
    comments: hit.num_comments ?? 0,
    url: hit.url || null,
    text: hit.story_text || null,
  }));
}
