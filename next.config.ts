import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  serverExternalPackages: ["pg"],
};

export default nextConfig;
