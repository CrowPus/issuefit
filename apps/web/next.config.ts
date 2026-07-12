import path from "node:path";

import { config as loadEnvFile } from "dotenv";
import type { NextConfig } from "next";

// Environment lives in a single .env at the monorepo root (shared with the
// worker and drizzle-kit); Next.js only auto-loads .env files from this
// directory, so load the root file explicitly. Values already present in
// process.env (e.g. in CI) always win.
loadEnvFile({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }],
  },
};

export default nextConfig;
