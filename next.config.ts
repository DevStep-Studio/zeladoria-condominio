import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Permite anexar fotos (data URLs) em ocorrências e outros formulários.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
