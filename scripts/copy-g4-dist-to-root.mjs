/**
 * Vercel (dashboard) często ma Output Directory = "dist" w root repo.
 * Vite buduje do g4-app/dist — kopiujemy, żeby deploy nie padał.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "g4-app", "dist");
const dest = resolve(root, "dist");

if (!existsSync(resolve(src, "index.html"))) {
  console.error(`[copy-g4-dist] Brak ${src}/index.html — najpierw npm run build w g4-app.`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`[copy-g4-dist] Skopiowano ${src} → ${dest}`);
