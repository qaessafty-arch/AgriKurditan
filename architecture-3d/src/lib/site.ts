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

/** Main navigation; labels come from the message catalogue (nav.*). */
export const NAV = [
  { href: "/projects" }, { href: "/services" }, { href: "/explore" }, { href: "/studio" }, { href: "/assistant" }, { href: "/pricing" },
] as const;
