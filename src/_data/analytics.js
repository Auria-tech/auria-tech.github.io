// Analytics configuration. See docs/analytics.md for what we collect and why.
//
// Neither value below is a secret. Both appear in the page source of every
// published page, and the website id only says which site an event belongs to —
// reading our numbers needs a login, which lives outside this repo.
export default {
  // Self-hosted Umami, on Auria's own Coolify server. Swapping this hostname
  // later is a one-line change here; nothing else in the site references it.
  host: process.env.ANALYTICS_HOST || "https://analytics.auria-tech.com",

  websiteId:
    process.env.ANALYTICS_WEBSITE_ID || "393a4821-c400-4a65-ab8a-a42a7284b705",

  // Local previews and drafts must never land in the real numbers, so the
  // tracker ships only in a production build. `npm start` renders without it.
  enabled: process.env.ELEVENTY_RUN_MODE === "build",
};
