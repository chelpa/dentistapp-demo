import type { NextConfig } from "next";

// DENTISTAPP_BASE_PATH: sub-path for hosts like GitHub Pages (e.g. "/dentistapp-demo").
// Leave it empty for a site served at the domain root.
const basePath = (process.env.DENTISTAPP_BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = process.env.DENTISTAPP_STATIC_EXPORT === "1"
  ? { output: "export", ...(basePath ? { basePath } : {}), images: { unoptimized: true } }
  : {};

export default nextConfig;
