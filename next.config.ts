import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/plan": ["./src/data/snapshots/*.json", "./src/data/reference/*.json"],
    "/api/plan/preview": ["./src/data/snapshots/*.json", "./src/data/reference/*.json"],
    "/api/plan/regenerate": ["./src/data/snapshots/*.json", "./src/data/reference/*.json"],
    "/api/options": ["./src/data/snapshots/*.json", "./src/data/reference/*.json"],
    "/api/destination": ["./src/data/snapshots/*.json", "./src/data/reference/*.json"],
    "/api/destination/prepare": ["./src/data/snapshots/*.json", "./src/data/reference/*.json"],
    "/api/data/status": ["./src/data/snapshots/*.json", "./src/data/reference/*.json"],
    "/api/health": ["./src/data/snapshots/*.json", "./src/data/reference/*.json"],
    "/api/diem-chon": ["./src/data/snapshots/*.json", "./src/data/reference/*.json"],
    "/": ["./src/data/snapshots/*.json", "./src/data/reference/*.json", "./src/data/site/*.json"],
    "/diem-den": ["./src/data/snapshots/*.json", "./src/data/reference/*.json", "./src/data/site/*.json"],
    "/diem-den/[slug]": ["./src/data/snapshots/*.json", "./src/data/reference/*.json", "./src/data/site/*.json"],
    "/khach-san": ["./src/data/snapshots/*.json", "./src/data/reference/*.json", "./src/data/site/*.json"],
  },
};

export default nextConfig;
