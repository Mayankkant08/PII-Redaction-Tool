import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mammoth and docx are Node.js-only packages — don't try to bundle them for edge/client
  serverExternalPackages: ["mammoth", "docx"],
};

export default nextConfig;
