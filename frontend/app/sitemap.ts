import type { MetadataRoute } from "next";
import { absoluteUrl } from "../src/shared/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl() },
    { url: absoluteUrl("/about") },
    { url: absoluteUrl("/methodology") },
  ];
}
