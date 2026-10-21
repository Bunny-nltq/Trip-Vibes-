import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/plan": ["./src/data/snapshots/**/*", "./src/data/reference/**/*"],
    "/api/plan/preview": ["./src/data/snapshots/**/*", "./src/data/reference/**/*"],
    "/api/plan/regenerate": ["./src/data/snapshots/**/*", "./src/data/reference/**/*"],
    "/api/options": ["./src/data/snapshots/**/*", "./src/data/reference/**/*"],
    "/api/destination": ["./src/data/snapshots/**/*", "./src/data/reference/**/*"],
    "/api/destination/prepare": ["./src/data/snapshots/**/*", "./src/data/reference/**/*"],
    "/api/data/status": ["./src/data/snapshots/**/*", "./src/data/reference/**/*"],
    "/api/health": ["./src/data/snapshots/**/*", "./src/data/reference/**/*"],
  },
};

export default nextConfig;
