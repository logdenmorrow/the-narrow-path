import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Narrow Path",
    short_name: "Narrow Path",
    description:
      "A Catholic app for daily readings, tasks, reminders, and accountability.",
    id: "/",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#f5efe1",
    theme_color: "#6d4729",
    categories: ["lifestyle", "productivity"],
    // Launcher icon filenames are versioned to reduce PWA/home-screen icon caching issues.
    icons: [
      {
        src: "/app-icon-v2-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-v2-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-icon-v2-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/maskable-icon-v2-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
