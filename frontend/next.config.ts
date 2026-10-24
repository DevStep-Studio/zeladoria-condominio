import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  experimental: {
    // Permite anexar fotos (data URLs) em ocorrências e outros formulários.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
