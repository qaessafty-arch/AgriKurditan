import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api", "/checkout", "/render", "/login", "/register", "/reset-password", "/forgot-password"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
