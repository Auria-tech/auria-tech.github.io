// Directory data: applies to every .md file in src/posts/. A writer only needs
// `title`, `description` and `date` in front matter — everything else has a
// default here. The full convention is documented in CONTENT.md.
export default {
  layout: "layouts/post.njk",
  ogType: "article",
  // The filename is the URL: src/posts/my-post.md -> /posts/my-post/
  // An optional `slug:` in front matter overrides it, which is how a file gets
  // renamed without changing the post's published URL.
  permalink: "/posts/{{ slug or page.fileSlug }}/",
};
