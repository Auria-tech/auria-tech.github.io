---
title: Publishing here takes five steps
description: The whole process for getting a piece of writing onto this site, and the reason it is deliberately this boring.
date: 2026-07-30
tags: [process]
---

Getting a piece of writing onto this site takes five steps in a web browser.
Open a new file, name it, paste in a five-line settings block, write the post,
press commit. About a minute later it is live, on the home page, in the archive,
and in the RSS feed.

There is no CMS, no admin login, no staging environment, no publish button that
someone has to be awake to press, and no queue that a piece of writing sits in
waiting for an engineer. Nobody schedules a deploy. Nobody approves anything.

## Why it is built this way

The constraint we designed around is that a publishing step which requires a
particular person to be available is a bottleneck disguised as a process. If
getting a post live needs an engineer, then the number of posts we can publish
is capped by that engineer's attention rather than by how fast we can write.

So the pipeline is a commit. Adding a file to a folder is the publish action.
The site rebuilds itself and republishes on its own, and if the post has a
problem in it — a missing description, a malformed date — the build stops before
anything is published and prints what to fix in plain language. The live site is
never left half-updated.

## What that costs us

Not much, and worth naming: no scheduled publishing. A post goes live when it is
committed, not at 9am on a chosen date. Holding a piece back is a one-word
setting in the file, which is a fair trade for not running a scheduler.

## Why the posts are plain files

Every post on this site is a Markdown file in a Git repository. That is a
deliberate choice about reversibility rather than a preference about tools.

Content in a vendor's database is content we can only move by their rules. Files
in Git can be moved to any host, on any generator, at any time, with the full
edit history intact. Every change is reversible with one command. Nothing about
what we have written is locked inside an account we could lose access to.

The same logic runs through the rest of the setup. The site is static files, so
there is no runtime to babysit and nothing that can be down at 3am. There are no
web fonts and no client-side JavaScript, because the fastest page is the one that
does not download anything before it can show you text.

## The measurement

We did not estimate this. This post is the test: it was written by following the
written guide start to finish, and the clock ran until the page answered on the
public URL.

**Sixty-five seconds**, of which forty-three were the machine — the site
validating the post, rebuilding, and republishing itself. Our target was ten
minutes. What is left of the ten minutes belongs to whoever is writing, which is
the point.
