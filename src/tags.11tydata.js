// Per-tag page metadata. Front matter is YAML, so the title and description —
// which depend on the paginated tag — have to be computed here.
export default {
  eleventyComputed: {
    title: (data) => `Tagged “${data.tag}”`,
    description: (data) => `Posts about ${data.tag}.`,
  },
};
