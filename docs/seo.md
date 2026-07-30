# Discovery and speed

What we tell search engines, what a shared link looks like, and how fast pages
load. Written for whoever inherits this — a writer does not need to read it.

## The short version

Nothing here needs doing per post. Write the file, commit it, and the sitemap,
the feed, the structured data and the share card update themselves. The only
per-post decisions are the `description:` line (which becomes the grey text
under the Google result) and, optionally, an `image:` — both covered in
[CONTENT.md](../CONTENT.md#the-settings-block).

## What ships on every page

| Thing | Where it comes from |
| --- | --- |
| `<title>`, meta description, canonical URL | `src/_includes/partials/head-meta.njk` |
| Open Graph and Twitter card tags | same file |
| JSON-LD structured data (`BlogPosting` on posts, `WebSite` on the home page) | same file, serialised by the `jsonld` filter in `eleventy.config.js` |
| Site icon | `src/static/favicon.svg`, `src/static/apple-touch-icon.png` |
| Default share picture (1200×630) | `src/static/images/share-default.png`, source in `scripts/share-image.html` |
| `sitemap.xml` | `src/sitemap.njk`, built from the collections |
| `feed.xml` (Atom) | `src/feed.njk` |
| `robots.txt` | `src/static/robots.txt` |

`npm run check:seo` asserts all of it against the built HTML and runs in CI
after the build. None of this is visible by looking at the site, so without the
check a break would ship silently and cost us months of search traffic.

### Keeping a page out of Google

Put `noindex: true` in its settings block. The page then carries a
`noindex, follow` robots tag *and* drops out of the sitemap — the two have to
agree, or a crawler resolves the contradiction against us. `/404.html` and
`/subscribe/confirmed/` use this.

### Regenerating the share picture

It is a checked-in PNG, not a build step, because a build step that needs a
browser is a build step that breaks in CI. Edit `scripts/share-image.html`,
then on macOS:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --window-size=1200,630 \
  --screenshot=src/static/images/share-default.png scripts/share-image.html
```

It is deliberately plain — a wordmark and the address — because the editorial
niche is not decided. It should be redone when there is a brand to put on it.

## Verified against external tools

Run on 2026-07-30, against the deployed site:

- **Structured data** — [validator.schema.org](https://validator.schema.org/)
  on `/`, `/posts/hello-world/` and `/posts/publishing-in-five-steps/`:
  **0 errors, 0 warnings**, recognised as `BlogPosting` and `WebSite`. That is
  the same parser behind Google's Rich Results Test.
- **`sitemap.xml` and `feed.xml`** — well-formed under `xmllint --noout`.

## Core Web Vitals baseline

Lighthouse 12.8.2, headless Chrome, against the built site served over
`127.0.0.1` so the numbers describe the pages rather than the network. Measured
2026-07-30 at commit `4d1c5b8`.

| Page | Form factor | Perf | A11y | Best practices | SEO | LCP | CLS | TBT | FCP | Speed Index |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | mobile | 100 | 100 | 100 | 100 | 0.8 s | 0 | 0 ms | 0.6 s | 0.6 s |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.2 s | 0 | 0 ms | 0.2 s | 0.2 s |
| `/posts/hello-world/` | mobile | 100 | 100 | 100 | 100 | 0.8 s | 0 | 0 ms | 0.6 s | 0.6 s |
| `/posts/hello-world/` | desktop | 100 | 100 | 100 | 100 | 0.2 s | 0 | 0 ms | 0.2 s | 0.2 s |

Two requests per page — the HTML (≈10 KB, CSS inlined) and the icon. No web
fonts, no layout shift, no blocking JavaScript.

The analytics tracker landed on the same day, so the table above is the site
without it. Measured again with it enabled, on the same page and form factor:
performance still **100**, LCP **0.6 s**, CLS **0**, TBT **0 ms**. It is loaded
asynchronously from a third-party host, so it costs a DNS lookup and nothing on
the critical path. Measurement is not what will slow this site down.

Google's thresholds for "good" are LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms. We are
inside all three with room to spare. INP is not measurable in a lab run with no
interactive elements; it is effectively zero while the pages carry no
JavaScript, and becomes worth watching the first time they do.

**Reproduce it:**

```
npm run build
(cd _site && python3 -m http.server 8099 --bind 127.0.0.1) &
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  npx lighthouse@12 http://127.0.0.1:8099/posts/hello-world/ --view
```

### Known imperfections, and why they are left alone

- **Inline CSS is not minified.** ~16 KB uncompressed, ~4 KB over the wire once
  GitHub Pages gzips it. Minifying would add a build dependency to save a
  fraction of a single already-fast request. Revisit if the stylesheet grows
  past ~5 KB of real content, at which point it should become a cached external
  file anyway.
- **Pages sets `Cache-Control: max-age=600` and we cannot change it.** Lighthouse
  wants long cache lifetimes on static assets. This is a platform constraint of
  free GitHub Pages hosting; it would go away behind a CDN, which is not worth
  paying for at zero traffic.
- **A run against the live URL from this machine shows phantom same-origin
  requests** (a ~96 KB script the HTML does not contain, which 404s when fetched
  with `curl`). Something local to the developer machine injects them. The live
  HTML is byte-for-byte what we build, which is why the baseline above is taken
  over loopback. Worth re-checking from a different machine before trusting any
  future field data.

## Not done yet: Google Search Console

Registering the site needs a Google account to own the property, which is a CEO
action, not an engineering one. Once the property exists, verification is a
five-minute change here: drop the `google*.html` file Google gives you into
`src/static/`, or send me the `google-site-verification` token to add as a meta
tag. Until then we have no query data — analytics tells us what visitors did,
Search Console is the only thing that tells us what they searched for.

Sitemap submission is the same story: `https://auria-tech.github.io/sitemap.xml`
is already linked from `robots.txt`, so crawlers will find it on their own, but
we cannot watch its indexing status without the property.
