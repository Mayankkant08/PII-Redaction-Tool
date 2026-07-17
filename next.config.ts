import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mammoth and docx are Node.js-only packages — don't try to bundle them for edge/client
  serverExternalPackages: ["mammoth", "docx"],
  // Allow large file uploads (default limit is 4MB; prospectus can be bigger)
  experimental: {},
};

export default nextConfig;
