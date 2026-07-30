// Front-matter checker for src/posts/*.md.
//
// Why this exists: an editor publishes by committing a Markdown file, and the
// deploy is automatic. Without a gate, a typo in the front matter either breaks
// the build with an Eleventy stack trace or — worse — publishes a page with a
// missing title. This runs first in CI, so a bad post stops at the check with a
// plain-English message and the live site is left exactly as it was.
//
// Run it locally with `npm run check:posts`.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = "src/posts";
// src/static is copied to the site root, so /images/x.png lives here.
const STATIC_DIR = "src/static";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_DESCRIPTION = 160;

const problems = [];
const warnings = [];
const slugs = new Map();

function fail(file, message, fix) {
  problems.push({ file, message, fix });
}

function warn(file, message, fix) {
  warnings.push({ file, message, fix });
}

const files = readdirSync(POSTS_DIR)
  .filter((name) => name.endsWith(".md"))
  // Files starting with an underscore are templates, not posts.
  .filter((name) => !name.startsWith("_"))
  .sort();

for (const name of files) {
  const file = path.join(POSTS_DIR, name);
  let data;
  let content;

  try {
    ({ data, content } = matter(readFileSync(file, "utf8")));
  } catch (error) {
    fail(
      file,
      `the settings block at the top of the file could not be read (${error.message})`,
      "Check that the file starts with a line of exactly three dashes, has a matching line of three dashes below the settings, and that any value containing a colon is wrapped in quotes.",
    );
    continue;
  }

  if (Object.keys(data).length === 0) {
    fail(
      file,
      "there is no settings block at the top of the file",
      "Copy the block from src/posts/_template.md — it must be the very first thing in the file, fenced by lines of three dashes.",
    );
    continue;
  }

  // --- title -------------------------------------------------------------
  if (typeof data.title !== "string" || data.title.trim() === "") {
    fail(
      file,
      "`title` is missing or empty",
      "Add a line like `title: Why we changed our pricing`.",
    );
  }

  // --- description -------------------------------------------------------
  if (typeof data.description !== "string" || data.description.trim() === "") {
    fail(
      file,
      "`description` is missing or empty",
      "Add a one-sentence `description:` line. It is what Google and social previews show, so a post without one loses clicks.",
    );
  } else if (data.description.length > MAX_DESCRIPTION) {
    warn(
      file,
      `\`description\` is ${data.description.length} characters; search results cut off around ${MAX_DESCRIPTION}`,
      "Trim it — the post still publishes either way.",
    );
  }

  // --- date --------------------------------------------------------------
  if (!(data.date instanceof Date) || Number.isNaN(data.date.getTime())) {
    fail(
      file,
      "`date` is missing or is not a real date",
      "Use plain `date: 2026-07-30` — year, month, day, no quotes.",
    );
  } else {
    const daysAhead = (data.date.getTime() - Date.now()) / 86_400_000;
    if (daysAhead > 1) {
      warn(
        file,
        `\`date\` is ${Math.round(daysAhead)} days in the future`,
        "There is no scheduled publishing: this post goes live as soon as it is committed without `draft: true`, it will just show a future date. Use `draft: true` to hold it back.",
      );
    }
  }

  // --- updated -----------------------------------------------------------
  if ("updated" in data) {
    if (!(data.updated instanceof Date) || Number.isNaN(data.updated.getTime())) {
      fail(
        file,
        "`updated` is not a real date",
        "Use plain `updated: 2026-08-14`, or delete the line if the post has not been revised.",
      );
    } else if (data.date instanceof Date && data.updated < data.date) {
      warn(
        file,
        "`updated` is earlier than `date`",
        "A revision cannot predate publication — check which of the two dates is wrong.",
      );
    }
  }

  // --- image ---------------------------------------------------------------
  if ("image" in data) {
    if (typeof data.image !== "string" || !data.image.startsWith("/images/")) {
      fail(
        file,
        `\`image: ${data.image}\` is not a usable share picture`,
        "Write the address the picture has on the site: `image: /images/my-picture.png`.",
      );
    } else if (!existsSync(path.join(STATIC_DIR, data.image))) {
      fail(
        file,
        `the share picture ${data.image} is not in the repository`,
        `Add the file to ${STATIC_DIR}${data.image} and commit it, or remove the \`image:\` line.`,
      );
    }
  }

  // --- draft -------------------------------------------------------------
  if ("draft" in data && typeof data.draft !== "boolean") {
    fail(
      file,
      `\`draft\` must be true or false, not "${data.draft}"`,
      "Write `draft: true` to hold the post back, or delete the line to publish it. Quotes around true make it a word, not a switch.",
    );
  }

  // --- tags --------------------------------------------------------------
  if ("tags" in data) {
    if (!Array.isArray(data.tags)) {
      fail(
        file,
        "`tags` must be a list",
        "Write `tags: [pricing, interviews]`, or delete the line if the post has no tags.",
      );
    } else {
      for (const tag of data.tags) {
        if (typeof tag !== "string" || tag.trim() === "") {
          fail(file, "one of the `tags` is empty", "Remove the empty entry.");
        }
      }
    }
  }

  // --- slug and URL ------------------------------------------------------
  const base = name.replace(/\.md$/, "");
  const slug = "slug" in data ? data.slug : base;

  if ("slug" in data && (typeof data.slug !== "string" || !SLUG.test(data.slug))) {
    fail(
      file,
      `\`slug: ${data.slug}\` is not usable in a URL`,
      "Use lowercase letters, numbers and single hyphens: `slug: why-we-changed-our-pricing`. Or delete the line and let the filename decide the URL.",
    );
  } else if (!("slug" in data) && !SLUG.test(base)) {
    fail(
      file,
      `the filename "${name}" is not usable in a URL`,
      "Rename the file to lowercase letters, numbers and hyphens only — for example why-we-changed-our-pricing.md. No spaces, no capitals, no underscores.",
    );
  }

  if (slugs.has(slug)) {
    fail(
      file,
      `this post would publish at the same URL as ${slugs.get(slug)} (/posts/${slug}/)`,
      "Rename one of the two files, or give one of them a different `slug:`.",
    );
  } else {
    slugs.set(slug, file);
  }

  // --- body --------------------------------------------------------------
  if (content.trim() === "") {
    fail(
      file,
      "the post has no body text",
      "Write the post below the settings block.",
    );
  }
}

function report(items, label) {
  for (const { file, message, fix } of items) {
    console.error(`\n${label}  ${file}`);
    console.error(`   ${message}`);
    console.error(`   Fix: ${fix}`);
  }
}

report(warnings, "warning:");
report(problems, "PROBLEM:");

const counted = `${files.length} post${files.length === 1 ? "" : "s"}`;

if (problems.length > 0) {
  console.error(
    `\n${problems.length} problem${problems.length === 1 ? "" : "s"} found in ${counted}. Nothing was published; the live site is unchanged.`,
  );
  console.error("Fix the files above and commit again.\n");
  process.exit(1);
}

console.log(
  `Checked ${counted}: no problems${warnings.length ? `, ${warnings.length} warning(s)` : ""}.`,
);
