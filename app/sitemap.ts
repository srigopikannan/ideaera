import { type MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "/", lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: "/hackathons", lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: "/ideas", lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: "/people", lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];
}
