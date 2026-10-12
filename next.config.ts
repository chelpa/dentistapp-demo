import type { NextConfig } from "next";

// Subpath for hosts like GitHub Pages (e.g. "/dentistapp-demo"); empty for root hosting.
const basePath = process.env.DENTISTAPP_BASE_PATH ?? "";

const nextConfig: NextConfig = process.env.DENTISTAPP_STATIC_EXPORT === "1"
  ? { output: "export", basePath, images: { unoptimized: true } }
  : {};

export default nextConfig;
