import { buildSync } from "esbuild";

buildSync({
  entryPoints: ["backend/src/serverless.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "api/_handler.js",
  external: [
    "sqlite3",
    "@libsql/client",
    "node:*",       // All Node.js built-in modules (node:events, node:fs, etc.)
  ],
  banner: {
    // Creates a proper require() function for CJS packages bundled into ESM
    js: `import { createRequire } from "module";const require = createRequire(import.meta.url);`,
  },
});

console.log("  api/_handler.js built successfully");
