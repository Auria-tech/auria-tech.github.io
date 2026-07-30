# Auria site

Auria's owned publishing surface. Markdown files in, static HTML out, deployed
automatically on every push to `main`.

**Live:** https://auria-tech.github.io

## Publishing a post

You do not need to run anything locally to publish.

1. Copy `src/posts/_template.md` to `src/posts/your-post-title.md`. The filename
   becomes the URL, so keep it lowercase with hyphens.
2. Fill in `title`, `description`, and `date` at the top of the file.
3. Delete the `draft: true` line.
4. Commit to `main` and push.

The site rebuilds and goes live in about a minute. Progress is visible under the
repository's **Actions** tab. Nothing else is required — no deploy button, no
one on call.

To take a post down, delete the file (or put `draft: true` back) and push.

## Running it locally

Requires Node 20 or newer.

```sh
npm install
npm start          # dev server with live reload at http://localhost:8080
```

Other commands:

```sh
npm run build      # write the site to _site/
npm run check      # build without writing files — fastest way to catch an error
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
  index.njk                  home page — lists published posts
  404.njk                    not-found page
  feed.njk                   Atom feed, output as /feed.xml
  sitemap.njk                output as /sitemap.xml
  posts/
    _template.md             copy this to start a post
    *.md                     one file per post
    posts.11tydata.js        shared settings for every post
  _includes/
    layouts/base.njk         the HTML shell every page uses
    layouts/post.njk         the post template
    css/main.css             all the styling there is
  _data/site.json            site title, description, canonical URL
  static/robots.txt          copied to the site root verbatim
eleventy.config.js           build configuration
.github/workflows/deploy.yml build and deploy on push to main
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
