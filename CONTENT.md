# Publishing guide

Everything you need to write and publish a post. No software to install, no
terminal, no engineer. You need a GitHub account with access to this repository
and a web browser.

Publishing a post takes about five minutes, most of which is deciding on the
title.

---

## Publish a post in five steps

**1. Start a new file**

Open this link: **[Create a new post →](https://github.com/Auria-tech/auria-tech.github.io/new/main/src/posts)**

You get an empty editor with a filename box at the top.

**2. Name the file**

Type a filename in the box, ending in `.md`. **The filename becomes the web
address**, so keep it lowercase with hyphens instead of spaces:

| Filename | Becomes |
| --- | --- |
| `why-we-changed-our-pricing.md` | `/posts/why-we-changed-our-pricing/` |
| `Why We Changed Our Pricing.md` | ✗ rejected — capitals and spaces |

Short is better than clever. The address is permanent once people link to it, so
avoid dates, numbers and "part-2" in the name.

**3. Paste this at the very top of the file**

```
---
title: Why we changed our pricing
description: What we learned from six months of flat-rate billing, and the three numbers that made us switch.
date: 2026-07-30
tags: [pricing]
---
```

Then replace the values with your own. The three dashes above and below matter —
they are how the site tells settings apart from writing. Field reference is
[below](#the-settings-block).

**4. Write the post underneath**

Plain text with Markdown for formatting:

```
This is a normal paragraph. Leave a blank line between paragraphs.

## A subheading

Use **bold**, *italic*, and [links like this](https://example.com).

- bullet
- another bullet

> An indented quote.
```

Start subheadings at `##`, not `#`. The title from step 3 is already the page's
main heading; starting lower keeps the page readable for screen readers and
search engines.

**5. Publish it**

Scroll to the bottom, then **Commit changes**. Leave the default message, make
sure **Commit directly to the `main` branch** is selected, and confirm.

That is it. The post is live in about a minute at
`https://auria-tech.github.io/posts/your-filename/`, and it appears on the home
page, in the archive, and in the RSS feed automatically.

---

## What happens after you hit commit

The site rebuilds itself and republishes. Nobody has to approve it, run
anything, or be awake.

To watch it happen, open the
[**Actions** tab](https://github.com/Auria-tech/auria-tech.github.io/actions).
The top entry is your commit:

- **Yellow dot** — building, usually under a minute.
- **Green tick** — live. Refresh the site.
- **Red cross** — something in the post is wrong and **nothing was published**.
  The live site is untouched. See [If the build goes red](#if-the-build-goes-red).

GitHub emails you if your commit fails to build, so you do not need to sit and
watch the tab.

---

## The settings block

The block between the three-dash lines at the top of every post.

| Field | Required | What it does |
| --- | --- | --- |
| `title` | yes | The headline. Shown on the page, in listings, in the browser tab, and in search results. |
| `description` | yes | One or two sentences. This is the grey text under the link in Google and the preview text when the post is shared. Aim for under 160 characters. |
| `date` | yes | `2026-07-30` — year-month-day, no quotes. Controls the ordering of the home page and archive. |
| `tags` | no | Topics, e.g. `tags: [pricing, interviews]`. Each one gets its own page at `/tags/pricing/` automatically. Leave the line out if you do not want any. |
| `draft` | no | `draft: true` keeps the post unpublished. See [Drafts](#drafts). |
| `slug` | no | Overrides the web address. Only needed for [renaming a file without breaking its link](#rename-a-file-without-breaking-its-address). |

Two rules that cause most mistakes:

- **No quotes needed** — write `title: Why we changed our pricing`, not
  `title: "Why we changed our pricing"`. The exception is if your title
  contains a colon: `title: "Pricing: what we learned"` needs the quotes.
- **`tags` is a list** — `tags: [pricing]`, with the square brackets, even for
  one tag.

---

## Drafts

Add `draft: true` to the settings block:

```
---
title: Not finished yet
description: A placeholder.
date: 2026-07-30
draft: true
---
```

A draft is not built and not published: no page, no listing, no feed entry,
nothing for Google to find. It is safe to commit a draft to `main` — it stays
invisible. Deleting the `draft: true` line and committing again publishes it.

There is no scheduled publishing. A post goes live when you commit it without
`draft: true`, whatever date you put in the settings.

---

## Everyday tasks

### Edit a post that is already live

Open the post's file in
[`src/posts/`](https://github.com/Auria-tech/auria-tech.github.io/tree/main/src/posts),
click the pencil icon, make the change, and commit. Live again in about a minute.

### Unpublish a post

Two options, both about thirty seconds:

- **Take it down but keep it** — edit the file, add `draft: true` to the
  settings block, commit.
- **Delete it** — open the file, click the **⋯** menu, **Delete file**, commit.

Either way the page disappears from the site on the next build. Anyone who
already has the link will get the not-found page.

### Add a picture

1. Go to
   [`src/static/images/`](https://github.com/Auria-tech/auria-tech.github.io/tree/main/src/static/images)
   and use **Add file → Upload files**. Commit.
2. In your post, write:

   ```html
   <img src="/images/your-file.jpg" width="1600" height="900" alt="A short description of the picture." />
   ```

Fill in the real `width` and `height` in pixels — your image viewer shows them.
Without them the page jumps around as it loads, which hurts our search ranking.
`alt` is the description read aloud to blind readers; write a real sentence.

Resize photos to about 1600 pixels wide before uploading. A 5MB photo makes the
page slow, and page speed is one of the few things we know affects traffic.

### Rename a file without breaking its address

If a post already has links pointing at it, renaming the file would break them.
Instead, keep the old address by adding a `slug` line to the settings:

```
slug: the-original-filename
```

Now the file can be called anything and the post stays at
`/posts/the-original-filename/`.

---

## If the build goes red

A red cross means a setting in the post is malformed. **Nothing was published
and the live site is unchanged** — this is a safety net, not a breakage.

Click the red cross → the failed run → the **Check posts** step. It prints the
file, the problem, and how to fix it in plain English:

```
PROBLEM:  src/posts/why-we-changed-our-pricing.md
   `description` is missing or empty
   Fix: Add a one-sentence `description:` line. It is what Google and social
   previews show, so a post without one loses clicks.
```

Fix the file, commit again, and the build goes green. The three most common
causes:

- The settings block is not the very first thing in the file, or a `---` line is
  missing.
- A `title` or `description` contains a colon and is not wrapped in quotes.
- `tags` was written without square brackets.

If the message does not make sense, that is a bug in the checker — say so and it
gets a better message.

---

## Previewing before you publish

You do not need to. Commit a draft, look at it, then remove the `draft: true`
line. That is the intended workflow and it needs no tools.

If you would rather preview locally, that path exists and needs Node installed:
`npm install`, then `npm start`, then open `http://localhost:8080`. Drafts are
visible there and listed at `http://localhost:8080/drafts/`, marked as drafts so
they cannot be mistaken for live pages.

---

## Where things live

```
src/posts/                     one Markdown file per post — this is your folder
src/posts/_template.md         a blank post to copy
src/static/images/             pictures
```

Everything else in the repository is site machinery. You never need to touch it.

Posts are plain files in Git. There is no CMS and no database, which means every
post is portable, every change is reversible, and nothing is locked in a vendor's
account.
