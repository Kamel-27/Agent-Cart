import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a WASM binary and must not be traced/bundled by webpack —
  // it has to be required at runtime from node_modules.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};

export default nextConfig;
