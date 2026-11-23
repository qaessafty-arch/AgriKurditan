/** Static site identity. Business settings (bank details, WhatsApp, contact) live in the database. */
export const SITE = {
  name: "Architecture 3D",
  shortName: "A3D",
  tagline: "Architecture you can walk into before it is built",
  description:
    "Architectural design studio and immersive 3D visualization platform. Explore buildings in real-time 3D, customise materials and light, and commission residential, commercial and interior projects.",
  url: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en",
};

export const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/services", label: "Services" },
  { href: "/explore", label: "Explore 3D" },
  { href: "/studio", label: "Design studio" },
  { href: "/assistant", label: "AI assistant" },
  { href: "/pricing", label: "Pricing" },
] as const;
