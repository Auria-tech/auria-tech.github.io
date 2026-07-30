# Auria site

Auria's owned publishing surface. Markdown files in, static HTML out, deployed
automatically on every push to `main`.

**Live:** https://auria-tech.github.io

## Publishing a post

**Writers and editors: read [CONTENT.md](CONTENT.md).** It is the operator
guide — browser only, no terminal, no installs.

The short version for engineers: add a Markdown file to `src/posts/` with
`title`, `description` and `date` in front matter, commit to `main`. CI validates
the front matter, builds, and publishes. `draft: true` holds a post back; drafts
are dropped from the build entirely and are only visible under `npm start`.

## Running it locally

Requires Node 20 or newer. CI builds on Node 22.

```sh
npm install
npm start          # dev server with live reload at http://localhost:8080
```

Other commands:

```sh
npm run build        # write the site to _site/
npm run check        # validate posts, then build without writing files
npm run check:posts  # front-matter validation only (this is what CI gates on)
```

## How the deploy works

`.github/workflows/deploy.yml` runs on every push to `main`: it installs
dependencies, runs `npm run build`, and uploads `_site/` to GitHub Pages. Pages
is configured with **Settings → Pages → Source: GitHub Actions**.

Free tier, no recurring cost. GitHub Pages on a free-plan organisation requires
the repository to stay **public**, which is fine — the site is public anyway.
There are soft fair-use limits (100 GB/month bandwidth, 10 builds/hour) that we
are nowhere near.

Rolling back a bad publish is `git revert` plus a push.

## Layout

```
src/
  index.njk                  home page — 10 most recent posts
  archive.njk                /archive/ — every post by year, plus the topic index
  tags.njk                   /tags/<tag>/ — one page per tag, generated
  tags.11tydata.js           computed title/description for those tag pages
  drafts.njk                 /drafts/ — local preview only, itself a draft
  404.njk                    not-found page
  feed.njk                   Atom feed, output as /feed.xml
  sitemap.njk                output as /sitemap.xml
  posts/
    _template.md             copy this to start a post (excluded from the build)
    *.md                     one file per post
    posts.11tydata.js        layout and permalink for every post
  _includes/
    layouts/base.njk         the HTML shell every page uses
    layouts/post.njk         the post template
    partials/post-list.njk   the one post-listing markup all listings share
    partials/head-meta.njk   everything crawlers and social networks read
    css/main.css             all the styling there is
  _data/site.json            site title, description, canonical URL
  static/robots.txt          copied to the site root verbatim
  static/favicon.svg         site icon, plus apple-touch-icon.png beside it
  static/images/             pictures used in posts, served from /images/
scripts/check-posts.mjs      front-matter validation, run by CI before the build
scripts/check-seo.mjs        crawlability checks, run by CI after the build
scripts/share-image.html     source for the default social share picture
CONTENT.md                   the operator guide for whoever writes the posts
docs/seo.md                  what we tell search engines, and the speed baseline
eleventy.config.js           build configuration
.eleventyignore              files under src/ that are not content
.github/workflows/deploy.yml validate, build and deploy on push to main
```

## Choices worth knowing about

- **[Eleventy](https://www.11ty.dev/) as the generator.** Two dev dependencies
  in total, no client-side JavaScript in the output, and content stays as plain
  Markdown files in Git. If we ever leave Eleventy, the posts come with us.
- **No web fonts and no framework.** Nothing to download before text renders,
  which is most of what makes a content site feel fast.
- **CSS is inlined into every page** by `layouts/base.njk`, so a first visit
  costs one request. That trade-off holds while the stylesheet is small; if it
  grows past roughly 5KB, switch to a linked stylesheet so it can be cached
  across pages.
- **No analytics, no email capture, no design system yet.** Each is its own
  change on its own ticket.

## Things this repo must never contain

No secrets, API keys, or subscriber data. Anything of that kind belongs in
GitHub Actions secrets or the Paperclip secret store. The repository is public.

## If we want a custom domain later

Auria already owns `auria-tech.com`, so pointing a subdomain at this site costs
nothing beyond a DNS record: add a `CNAME` file with the hostname, set the DNS
record at the registrar, and enable the domain under Settings → Pages. GitHub
issues the TLS certificate for free. Worth doing before the site accumulates
inbound links, because moving later means redirects. That is a CEO call, not
a technical blocker.
