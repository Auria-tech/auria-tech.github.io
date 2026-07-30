# Reading the numbers

For whoever wants to know how a post did. One command, no deploy.

We run **Umami** on Auria's own server. It is open source, it stores no cookies,
and the data sits in our database rather than a vendor's. There is no recurring
cost: it shares the server we already pay for, and there is no plan to outgrow.

## Getting a report

```
npm run report              # last 30 days
npm run report -- --days 7  # last 7 days
npm run report -- --out reports/july.md
```

The first time, copy `.env.example` to `.env` and paste in the Umami password.
`.env` is never committed. If you do not have the password, ask.

What you get is one row per published post:

| Column | What it means |
| --- | --- |
| Readers | How many different people opened it |
| Views | How many times it was opened, including repeat reads |
| Reached the end | Share of views that scrolled into the last tenth of the piece |
| Stayed 30s+ | Share of views where the tab was visible for 30 seconds |
| Top source | Where most of them came from |

Posts with no traffic still appear, with zeroes. That is deliberate — a post
quietly getting nothing is the thing you most want to see.

There is also a dashboard with charts at the Umami address in `.env`, but the
report is the thing designed to be read.

## What we collect

Per page view, and nothing else:

- The page path (`/posts/hello-world/`)
- The referring site's hostname (`news.ycombinator.com`), never the full URL
- Rough location, to country level only
- Browser, operating system, device type, screen size, language
- Two engagement events, `scroll-90` and `read-30s`, which carry no data beyond
  their own names

## What we deliberately do not collect

- **No cookies.** Nothing is stored on the reader's device, which is why the
  site has no consent banner to click past.
- **No IP addresses.** Umami hashes the address with the browser details and a
  rotating salt to recognise a returning visitor within a day, then discards it.
  The hash cannot be turned back into an address, and it stops working the next
  day, so we cannot follow anyone across days.
- **No cross-site tracking.** The tracker is ours, it runs on one site, and it
  reports to our server. There is no ad network and no data sold or shared.
- **No names, emails, or accounts.** Analytics has no connection to the mailing
  list. We cannot tell that a subscriber read a given post, and we do not want
  to be able to.
- **No scroll or mouse recording, no session replay, no heatmaps.**
- **We honour Do Not Track.** Browsers that send it are not counted at all.

Readers who block scripts are also not counted, and Umami discards anything whose
browser identifies itself as a crawler or automation tool. Every number here is
therefore a floor, not an exact count. That is the right trade for this business: a slightly
low number we trust beats a precise one we do not.

## How it is wired

- `src/_data/analytics.js` holds the Umami address and the site's public id.
  Changing the address is a one-line edit here.
- `src/_includes/partials/analytics.njk` renders the tracker on every page and
  the engagement probe on `/posts/` pages only.
- `scripts/analytics-report.mjs` builds the report.
- The tracker ships only in a production build. `npm start` never sends
  anything, so drafts and local previews cannot pollute the real numbers.

Two details worth knowing before changing the report script:

1. Umami filters by `path`. It **silently ignores** query parameters it does not
   recognise and answers with site-wide totals instead. Get the name wrong and
   every post reports the same numbers, with no error.
2. Visits with no referrer are missing from Umami's referrer list rather than
   listed as "direct", so the report derives direct traffic from the shortfall
   against the visit count.

## Operating the server

Umami runs as a Coolify service on Auria's own box, alongside the other Auria
projects. It is a Docker container plus a Postgres database, both managed by
Coolify, which handles restarts and TLS.

To move it to a different address, change the domain in Coolify, then update
`src/_data/analytics.js` and `.env`. Nothing else refers to it.
