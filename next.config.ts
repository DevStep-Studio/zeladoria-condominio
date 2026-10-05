import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  experimental: {
    // Permite anexar fotos (data URLs) em ocorrências e outros formulários.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
