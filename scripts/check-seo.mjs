// Crawlability checker for the built site in _site/.
//
// Why this exists: the SEO layer is invisible. A broken canonical tag, a post
// missing from the sitemap or malformed structured data costs us search traffic
// silently, for months, and nobody notices by looking at the site. This asserts
// the parts a crawler reads, on every build, so a regression stops in CI.
//
// Run it with `npm run check:seo` (builds first) or `node scripts/check-seo.mjs`
// against an existing _site/.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const SITE_DIR = "_site";
const SITE = JSON.parse(readFileSync("src/_data/site.json", "utf8"));

const problems = [];
const fail = (where, message) => problems.push({ where, message });

if (!existsSync(SITE_DIR)) {
  console.error(`No ${SITE_DIR}/ directory. Run \`npm run build\` first.`);
  process.exit(1);
}

// --- helpers ---------------------------------------------------------------

function htmlFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...htmlFiles(full));
    else if (entry.name.endsWith(".html")) found.push(full);
  }
  return found.sort();
}

// _site/posts/x/index.html -> /posts/x/ ; _site/404.html -> /404.html
function urlFor(file) {
  const rel = "/" + path.relative(SITE_DIR, file).split(path.sep).join("/");
  return rel.endsWith("/index.html") ? rel.slice(0, -"index.html".length) : rel;
}

const attr = (html, pattern) => html.match(pattern)?.[1];
const meta = (html, name) =>
  attr(
    html,
    new RegExp(
      `<meta\\s+(?:name|property)="${name}"\\s+content="([^"]*)"`,
      "i",
    ),
  );

// --- pages -----------------------------------------------------------------

const pages = htmlFiles(SITE_DIR);
const noindexUrls = new Set();

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const url = urlFor(file);
  const expectedCanonical = SITE.url + url;

  if (!attr(html, /<title>([^<]+)<\/title>/)) fail(url, "no <title>");

  const description = meta(html, "description");
  if (!description) fail(url, "no meta description");
  else if (description.length > 200)
    fail(url, `meta description is ${description.length} characters (max 200)`);

  const canonical = attr(
    html,
    /<link\s+rel="canonical"\s+href="([^"]*)"/i,
  );
  if (canonical !== expectedCanonical)
    fail(url, `canonical is "${canonical}", expected "${expectedCanonical}"`);

  const ogUrl = meta(html, "og:url");
  if (ogUrl !== expectedCanonical)
    fail(url, `og:url is "${ogUrl}", expected "${expectedCanonical}"`);

  for (const tag of ["og:title", "og:description", "og:image", "twitter:card"]) {
    if (!meta(html, tag)) fail(url, `no ${tag}`);
  }

  const image = meta(html, "og:image");
  if (image && !image.startsWith("http"))
    fail(url, `og:image "${image}" is not an absolute URL; crawlers reject those`);
  if (image?.startsWith(SITE.url)) {
    const local = path.join(SITE_DIR, image.slice(SITE.url.length));
    if (!existsSync(local)) fail(url, `og:image points at ${image}, which is not in the build`);
  }

  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html))
    noindexUrls.add(url);

  // --- structured data -----------------------------------------------------
  const blocks = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((match) => match[1]);

  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block);
    } catch (error) {
      fail(url, `structured data is not valid JSON (${error.message})`);
      continue;
    }

    if (data["@context"] !== "https://schema.org")
      fail(url, `structured data @context is "${data["@context"]}"`);
    if (!data["@type"]) fail(url, "structured data has no @type");

    if (data["@type"] === "BlogPosting") {
      // Google treats these as the properties that make an Article eligible for
      // a rich result. Missing ones are warnings in their tester, but a warning
      // we ship on every post is a warning we will stop reading.
      for (const key of [
        "headline",
        "description",
        "datePublished",
        "dateModified",
        "image",
        "author",
        "publisher",
        "mainEntityOfPage",
      ]) {
        if (!data[key]) fail(url, `BlogPosting has no ${key}`);
      }
      if (data.headline?.length > 110)
        fail(url, `BlogPosting headline is ${data.headline.length} characters (Google truncates past 110)`);
      for (const key of ["datePublished", "dateModified"]) {
        if (data[key] && Number.isNaN(Date.parse(data[key])))
          fail(url, `BlogPosting ${key} "${data[key]}" is not a valid date`);
      }
      if (data.url !== expectedCanonical)
        fail(url, `BlogPosting url "${data.url}" does not match the canonical`);
    }
  }

  if (url.startsWith("/posts/") && blocks.length === 0)
    fail(url, "a post with no structured data");
}

// --- sitemap ---------------------------------------------------------------

const sitemapPath = path.join(SITE_DIR, "sitemap.xml");
if (!existsSync(sitemapPath)) {
  fail("/sitemap.xml", "missing");
} else {
  const xml = readFileSync(sitemapPath, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  if (locs.length === 0) fail("/sitemap.xml", "contains no URLs");

  const seen = new Set();
  for (const loc of locs) {
    if (!loc.startsWith(SITE.url + "/"))
      fail("/sitemap.xml", `"${loc}" is not an absolute URL under ${SITE.url}`);
    if (seen.has(loc)) fail("/sitemap.xml", `"${loc}" is listed twice`);
    seen.add(loc);

    const local = path.join(SITE_DIR, loc.slice(SITE.url.length), "index.html");
    if (!existsSync(local) && !existsSync(path.join(SITE_DIR, loc.slice(SITE.url.length))))
      fail("/sitemap.xml", `"${loc}" is listed but no such page was built`);
  }

  for (const url of noindexUrls) {
    if (seen.has(SITE.url + url))
      fail("/sitemap.xml", `"${url}" is marked noindex but is in the sitemap`);
  }

  for (const file of pages) {
    const url = urlFor(file);
    if (url.startsWith("/posts/") && !seen.has(SITE.url + url))
      fail("/sitemap.xml", `published post "${url}" is missing`);
  }

  for (const [tag, close] of [["<urlset", "</urlset>"]]) {
    if (!xml.includes(tag) || !xml.includes(close))
      fail("/sitemap.xml", "is not a well-formed urlset");
  }
}

// --- feed ------------------------------------------------------------------

const feedPath = path.join(SITE_DIR, "feed.xml");
if (!existsSync(feedPath)) {
  fail("/feed.xml", "missing");
} else {
  const xml = readFileSync(feedPath, "utf8");
  const entries = [...xml.matchAll(/<entry>/g)].length;
  const posts = pages.filter((file) => urlFor(file).startsWith("/posts/")).length;

  if (!xml.includes('xmlns="http://www.w3.org/2005/Atom"'))
    fail("/feed.xml", "is not an Atom feed");
  if (entries !== posts)
    fail("/feed.xml", `has ${entries} entries but the site has ${posts} posts`);
  if (/<updated>\s*<\/updated>/.test(xml))
    fail("/feed.xml", "has an empty <updated> — feed readers will reject it");
}

// --- robots ----------------------------------------------------------------

const robotsPath = path.join(SITE_DIR, "robots.txt");
if (!existsSync(robotsPath)) {
  fail("/robots.txt", "missing");
} else {
  const robots = readFileSync(robotsPath, "utf8");
  if (!robots.includes(`Sitemap: ${SITE.url}/sitemap.xml`))
    fail("/robots.txt", `does not point at ${SITE.url}/sitemap.xml`);
  if (/^\s*Disallow:\s*\/\s*$/m.test(robots))
    fail("/robots.txt", "blocks the whole site");
}

// --- report ----------------------------------------------------------------

if (problems.length > 0) {
  for (const { where, message } of problems) {
    console.error(`PROBLEM: ${where}\n   ${message}`);
  }
  console.error(
    `\n${problems.length} crawlability problem${problems.length === 1 ? "" : "s"} found. Nothing was published; the live site is unchanged.\n`,
  );
  process.exit(1);
}

console.log(
  `Checked ${pages.length} pages, the sitemap, the feed and robots.txt: no problems.`,
);
