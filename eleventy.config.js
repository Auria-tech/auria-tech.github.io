import { HtmlBasePlugin } from "@11ty/eleventy";
import rssPlugin from "@11ty/eleventy-plugin-rss";

const POSTS_GLOB = "src/posts/*.md";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(rssPlugin);

  // Static files that ship as-is.
  eleventyConfig.addPassthroughCopy({ "src/static": "." });

  // `draft: true` in front matter drops the file from a production build
  // entirely — no page, no feed entry, no sitemap entry, nothing to find.
  // `npm start` still renders drafts so they can be previewed locally.
  // src/drafts.njk is itself marked `draft: true`, so the draft index only
  // exists in local preview too.
  eleventyConfig.addPreprocessor("drafts", "md,njk", (data) => {
    if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
      return false;
    }
  });

  // Published posts, newest first. Drafts are excluded even in local preview so
  // the home page, archive, feed and sitemap always show exactly what a visitor
  // would see. Drafts get their own local-only listing at /drafts/.
  eleventyConfig.addCollection("posts", (collection) =>
    collection
      .getFilteredByGlob(POSTS_GLOB)
      .filter((post) => !post.data.draft)
      .reverse(),
  );

  // Only ever non-empty in local preview — drafts do not exist in a build.
  eleventyConfig.addCollection("drafts", (collection) =>
    collection.getFilteredByGlob(POSTS_GLOB).filter((post) => post.data.draft),
  );

  // Published posts grouped by year, newest year first. Powers /archive/.
  eleventyConfig.addCollection("postsByYear", (collection) => {
    const years = new Map();
    const posts = collection
      .getFilteredByGlob(POSTS_GLOB)
      .filter((post) => !post.data.draft)
      .reverse();

    for (const post of posts) {
      const year = post.date.getUTCFullYear();
      if (!years.has(year)) years.set(year, []);
      years.get(year).push(post);
    }

    return [...years].map(([year, posts]) => ({ year, posts }));
  });

  // Every tag used by a published post, alphabetical. Powers /tags/<tag>/.
  eleventyConfig.addCollection("postTags", (collection) => {
    const tags = new Set();
    for (const post of collection.getFilteredByGlob(POSTS_GLOB)) {
      if (post.data.draft) continue;
      for (const tag of post.data.tags ?? []) tags.add(tag);
    }
    return [...tags].sort((a, b) => a.localeCompare(b));
  });

  // First n items of a list, for "latest posts" style listings.
  eleventyConfig.addFilter("limit", (items, n) => (items ?? []).slice(0, n));

  // The posts in a collection carrying a given tag.
  eleventyConfig.addFilter("postsWithTag", (posts, tag) =>
    (posts ?? []).filter((post) => (post.data.tags ?? []).includes(tag)),
  );

  // 2026-01-31 -> "31 January 2026". Used for human-readable dates.
  eleventyConfig.addFilter("readableDate", (value) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(value),
  );

  // 2026-01-31 -> "2026-01-31". Used for <time datetime="...">.
  eleventyConfig.addFilter("isoDate", (value) =>
    value.toISOString().slice(0, 10),
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
