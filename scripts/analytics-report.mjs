#!/usr/bin/env node
// Per-piece performance report. Reads our self-hosted Umami and prints a table
// of how each published post actually did. See docs/analytics.md.
//
//   npm run report              last 30 days
//   npm run report -- --days 7  last 7 days
//   npm run report -- --out reports/2026-07.md
//
// Credentials come from .env at the repo root (never committed). No arguments
// are required and nothing is written unless --out is passed.

import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- config -----------------------------------------------------------------

async function loadEnv() {
  const path = join(ROOT, ".env");
  if (!existsSync(path)) return;
  for (const line of (await readFile(path, "utf8")).split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const value = m[2].trim().replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

// --- umami client -----------------------------------------------------------

class Umami {
  constructor(host, token, websiteId) {
    this.host = host.replace(/\/$/, "");
    this.token = token;
    this.websiteId = websiteId;
  }

  static async connect({ host, username, password, websiteId }) {
    const res = await fetch(`${host.replace(/\/$/, "")}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      throw new Error(
        `Could not sign in to Umami at ${host} (HTTP ${res.status}). ` +
          `Check UMAMI_USERNAME and UMAMI_PASSWORD in .env.`,
      );
    }
    return new Umami(host, (await res.json()).token, websiteId);
  }

  async get(endpoint, params) {
    const url = new URL(`${this.host}/api/websites/${this.websiteId}/${endpoint}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`${endpoint} failed: HTTP ${res.status} ${url}`);
    return res.json();
  }
}

// Umami 3 filters by `path`. It silently ignores query parameters it does not
// recognise and answers with site-wide totals instead, so a typo here does not
// error — it quietly reports the wrong number for every post. Do not rename.
const PATH_PARAM = "path";

// --- data gathering ---------------------------------------------------------

async function localPostPaths() {
  const dir = join(ROOT, "src", "posts");
  const files = await readdir(dir);
  return files
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => `/posts/${f.replace(/\.md$/, "")}/`);
}

async function gather(umami, range) {
  // Union of what we published and what actually received traffic, so a post
  // with zero visits still appears and a URL we forgot about is not hidden.
  const seen = await umami.get("metrics", { ...range, type: "path" });
  const paths = [
    ...new Set([
      ...(await localPostPaths()),
      ...seen.map((r) => r.x).filter((p) => p.startsWith("/posts/")),
    ]),
  ].sort();

  return Promise.all(
    paths.map(async (path) => {
      const scoped = { ...range, [PATH_PARAM]: path };
      const [stats, referrers, events] = await Promise.all([
        umami.get("stats", scoped),
        umami.get("metrics", { ...scoped, type: "referrer" }),
        umami.get("metrics", { ...scoped, type: "event" }),
      ]);
      const event = (name) => events.find((e) => e.x === name)?.y ?? 0;

      // Umami drops visits with an empty referrer from the referrer metric
      // rather than reporting them as "direct", so direct traffic would simply
      // vanish from the report. Referrer counts are per visit, so the shortfall
      // against the visit count is exactly the traffic that arrived with no
      // referrer. Clamped at zero: if the two ever disagree the other way we
      // would rather show nothing than invent a source.
      const named = referrers
        .map((r) => ({ source: r.x, count: r.y }))
        .filter((r) => r.source);
      const direct = Math.max(
        0,
        (stats.visits ?? 0) - named.reduce((n, r) => n + r.count, 0),
      );

      return {
        path,
        visitors: stats.visitors ?? 0,
        views: stats.pageviews ?? 0,
        reachedEnd: event("scroll-90"),
        read30s: event("read-30s"),
        referrers: [...named, ...(direct ? [{ source: "Direct / none", count: direct }] : [])]
          .sort((a, b) => b.count - a.count),
      };
    }),
  );
}

// --- rendering --------------------------------------------------------------

const pct = (part, whole) =>
  whole === 0 ? "—" : `${Math.round((part / whole) * 100)}%`;

function render(rows, { days, from, to, host }) {
  const total = rows.reduce(
    (acc, r) => ({
      visitors: acc.visitors + r.visitors,
      views: acc.views + r.views,
    }),
    { visitors: 0, views: 0 },
  );

  const out = [];
  out.push(`# Content performance — last ${days} days`);
  out.push("");
  out.push(`${from} to ${to}. ${total.views} views across ${rows.length} posts.`);
  out.push("");

  if (total.views === 0) {
    out.push(
      "No traffic recorded in this window. If that is unexpected, check that",
      `${host} is reachable and that the tracker is present in the page source`,
      "of a published post.",
      "",
    );
  }

  out.push("| Post | Readers | Views | Reached the end | Stayed 30s+ | Top source |");
  out.push("| --- | ---: | ---: | ---: | ---: | --- |");
  for (const r of [...rows].sort((a, b) => b.visitors - a.visitors)) {
    const top = r.referrers[0]
      ? `${r.referrers[0].source} (${r.referrers[0].count})`
      : "—";
    out.push(
      `| ${r.path} | ${r.visitors} | ${r.views} | ${pct(r.reachedEnd, r.views)} | ` +
        `${pct(r.read30s, r.views)} | ${top} |`,
    );
  }
  out.push("");

  out.push("## Where readers came from");
  out.push("");
  for (const r of rows.filter((r) => r.referrers.length)) {
    out.push(`**${r.path}**`);
    for (const { source, count } of r.referrers.slice(0, 5)) {
      out.push(`- ${source} — ${count}`);
    }
    out.push("");
  }

  out.push("## How to read this");
  out.push("");
  out.push(
    "- **Readers** counts people, **Views** counts page loads. One person",
    "  re-reading a post adds a view, not a reader.",
    "- **Reached the end** is the share of views that scrolled into the last",
    "  tenth of the article. Posts shorter than one screen never report it, on",
    "  purpose — there is nothing to scroll, so the number would be a fiction.",
    "- **Stayed 30s+** is the share of views where the tab was actually visible",
    "  for 30 seconds. A page left open in a background tab does not count.",
    "- **Direct / none** means no referrer was sent: typed URLs, bookmarks, most",
    "  apps, and every link from an email client. It is not one traffic source.",
    "- Readers who block scripts or send Do Not Track are missing from all of",
    "  the above. Treat these as a floor, not an exact count.",
    "",
  );
  return out.join("\n");
}

// --- main -------------------------------------------------------------------

await loadEnv();

const required = ["UMAMI_HOST", "UMAMI_USERNAME", "UMAMI_PASSWORD", "UMAMI_WEBSITE_ID"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    `Missing ${missing.join(", ")}.\n` +
      `Copy .env.example to .env and fill it in — see docs/analytics.md.`,
  );
  process.exit(1);
}

const days = Number(arg("days", 30));
if (!Number.isFinite(days) || days <= 0) {
  console.error(`--days must be a positive number, got "${arg("days")}"`);
  process.exit(1);
}

const end = Date.now();
const start = end - days * 24 * 60 * 60 * 1000;
const range = { startAt: String(start), endAt: String(end), unit: "day", timezone: "UTC" };

const umami = await Umami.connect({
  host: process.env.UMAMI_HOST,
  username: process.env.UMAMI_USERNAME,
  password: process.env.UMAMI_PASSWORD,
  websiteId: process.env.UMAMI_WEBSITE_ID,
});

const rows = await gather(umami, range);
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const markdown = render(rows, {
  days,
  from: iso(start),
  to: iso(end),
  host: process.env.UMAMI_HOST,
});

const out = arg("out");
if (out) {
  await mkdir(dirname(join(ROOT, out)), { recursive: true });
  await writeFile(join(ROOT, out), markdown);
  console.error(`Wrote ${out}`);
} else {
  console.log(markdown);
}
