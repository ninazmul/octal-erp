import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Octal ERP - Academic, Staff & Financial Management",
    short_name: "Octal ERP",
    description:
      "Enterprise management system for Octal: Academic operations, student admissions, batch scheduling, collections, staff, payroll, and financials.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/erp-logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/erp-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

