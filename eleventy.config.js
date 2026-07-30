import { HtmlBasePlugin } from "@11ty/eleventy";
import rssPlugin from "@11ty/eleventy-plugin-rss";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(rssPlugin);

  // Static files that ship as-is.
  eleventyConfig.addPassthroughCopy({ "src/static": "." });

  // `draft: true` in front matter drops the file from a production build
  // entirely. `npm start` still renders drafts so they can be previewed.
  eleventyConfig.addPreprocessor("drafts", "md,njk", (data) => {
    if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
      return false;
    }
  });

  // Published posts, newest first.
  eleventyConfig.addCollection("posts", (collection) =>
    collection.getFilteredByGlob("src/posts/*.md").reverse(),
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
