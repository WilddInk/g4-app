import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8"));

/** Skrót SHA z CI (deploy) albo lokalnie z `git` — bez ręcznego wpisywania. */
function resolveGitShort() {
  const zEnv =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GITHUB_SHA?.trim() ||
    process.env.CF_PAGES_COMMIT_SHA?.trim() ||
    process.env.COMMIT_REF?.trim() ||
    "";
  if (zEnv.length >= 7) return zEnv.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/** Czy working tree ma niezacommitowane zmiany (tylko lokalnie; w CI zwykle false). */
function resolveGitDirty() {
  try {
    const out = execSync("git status --porcelain", {
      encoding: "utf8",
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

const gitShort = resolveGitShort();
const gitDirty = resolveGitDirty();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __G4_APP_VERSION__: JSON.stringify(pkg.version ?? "0.0.0"),
    __G4_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __G4_GIT_SHORT__: JSON.stringify(gitShort),
    __G4_GIT_DIRTY__: JSON.stringify(gitDirty ? "1" : ""),
  },
});
