# Sending the email newsletter

For whoever is sending the email. No coding, no terminal, no deploy.

We use **Buttondown** as the email provider. It holds the subscriber list, sends
the emails, and handles unsubscribes automatically. It is free up to 100
subscribers and allows one send per day.

## Sending an issue

1. Sign in at <https://buttondown.com>.
2. Click **New email**.
3. Write a subject line and the body. The editor takes Markdown — the same
   formatting the posts on the site use. `**bold**`, `_italic_`, `# heading`,
   `[link text](https://example.com)`.
4. Click **Preview** and read it once as a stranger would.
5. Send yourself a test first: **Send test email** puts it in your own inbox
   only. Do this every time. It is the only step that catches a broken link or a
   wrong name before 100 people see it.
6. Click **Send**.

You do not need to add an unsubscribe link. Buttondown appends one to every
email automatically, and it must never be removed.

### Writing so it lands well

- Plain text beats a designed template. It reads as a person writing, not as
  marketing, and it renders identically in every email client.
- Put the point in the first two lines. Many people read only the preview.
- One clear link is better than five competing ones.
- Do not attach files. Link to a page on the site instead.

## What happens when someone subscribes

1. They type their address into the form on the site and tick the consent box.
2. Buttondown emails them a confirmation link. **Nothing is sent to them until
   they click it.** Until then they show up as `unactivated` in Buttondown.
3. Once confirmed, they receive future sends.

This is double opt-in. It is why our list stays deliverable, and it is
deliberate — do not turn it off.

## What happens when someone unsubscribes

They click the unsubscribe link in any email and they are removed immediately.
Nothing is required from us. If someone emails asking to be removed instead,
find them in **Subscribers**, open their record, and archive them by hand.

## Rules that are not negotiable

- **Never** paste in a list of addresses that did not come through our own form.
  No purchased lists, no conference badge scans, no "they replied to me once so
  they are probably fine". This is both the law in most of our readers'
  countries and the fastest way to get our sending domain blocked.
- **Never** remove the unsubscribe link.
- **Never** export the subscriber list into the website repository, a shared
  document, or a chat message. It is personal data. It lives in Buttondown.

## Growing the list

The signup form appears in three places on the site, and all three are wired up
already: the home page, the bottom of every post, and <https://auria-tech.github.io/subscribe/>.

## If something looks wrong

- **The form on the site does nothing / shows an error.** The provider URL in
  the site's configuration is probably wrong. That is a job for the engineer —
  file it and mention `src/_data/newsletter.json`.
- **No confirmation email arrives.** Check spam. Buttondown's dashboard shows
  whether it was sent.
- **We are near 100 subscribers.** Good problem. It means a paid plan is coming
  ($9/month for 1,000 at the time of writing), which needs CEO sign-off before
  anyone upgrades.

## For the engineer

The site holds no secrets for this. The form posts directly from the reader's
browser to Buttondown, so there is no API key in the site, in CI, or in the
repository.

Configuration lives in `src/_data/newsletter.json`:

| Field | What it does |
| --- | --- |
| `formAction` | The provider's form endpoint. **The form does not render at all while this is empty**, so the site can never show a form that silently discards addresses. |
| `provider` | Provider name, shown on `/privacy/`. |
| `heading`, `pitch`, `consent`, `buttonLabel` | The wording. Editable without touching a template. |

For Buttondown the endpoint is
`https://buttondown.com/api/emails/embed-subscribe/<account-name>`.

Set the post-signup redirect in Buttondown to
`https://auria-tech.github.io/subscribe/confirmed/` so readers land back on our
own domain instead of the provider's page.

Switching providers later is a change to `formAction` plus a subscriber CSV
export and import. No template changes — that is the reason the whole URL lives
in the data file rather than an account name being pasted into the markup.
