import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadBackendEnv() {
  const envPath = resolve(process.cwd(), "backend/.env");
  const localEnvPath = resolve(process.cwd(), ".env");
  const path = existsSync(envPath) ? envPath : existsSync(localEnvPath) ? localEnvPath : null;
  if (!path) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
