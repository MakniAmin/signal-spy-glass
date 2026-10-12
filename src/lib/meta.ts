export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} · LTE/5G Signaling Analysis Lab` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · LTE/5G Signaling Analysis Lab` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
