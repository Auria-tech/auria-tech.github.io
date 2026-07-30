// Directory data: applies to every .md file in src/posts/. A writer only needs
// `title` and `date` in front matter — everything else is set here.
export default {
  layout: "layouts/post.njk",
  ogType: "article",
  // The filename is the URL: src/posts/my-post.md -> /posts/my-post/
  permalink: "/posts/{{ page.fileSlug }}/",
};
