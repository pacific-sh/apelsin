export const config = {
  // Site name, shown in the header and the browser tab.
  title: "apelsin",
  // Sizes with their own pages. The first is shown on the home page.
  sizes: [10, 15, 25, 50, 100],
  // Every multiple of `feedStep` up to `maxFeedSize` also gets an RSS feed.
  feedStep: 5,
  // Issues per feed, and how far back a first or late run catches up.
  feedDays: 30,
  // The largest RSS feed.
  maxFeedSize: 100,
  // When each day's issue comes out: a time and its IANA time zone.
  publishAt: "08:00[Europe/Madrid]",
};
