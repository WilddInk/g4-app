/**
 * Test Slack Incoming Webhook (lokalnie / CI).
 * Nie używaj tego URL w Vite / przeglądarce — webhook musi pozostać tajny.
 *
 * Slack: Workspace → Appy → Manage / Build → Incoming Webhooks → Create → wybierz kanał.
 * Skopiuj adres POST (https://hooks.slack.com/services/…)
 *
 * Uruchomienie (PowerShell):
 *   $env:SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
 *   npm run test:slack
 *
 * Albo dopisz linię SLACK_WEBHOOK_URL=… do pliku g4-app/.env (nie commituj).
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(root, ".env");
if (!process.env.SLACK_WEBHOOK_URL?.trim() && existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*SLACK_WEBHOOK_URL\s*=\s*(.+?)\s*$/);
    if (m) {
      process.env.SLACK_WEBHOOK_URL = m[1].replace(/^["']|["']$/g, "").trim();
      break;
    }
  }
}

const url = process.env.SLACK_WEBHOOK_URL?.trim();
if (!url || !url.startsWith("https://hooks.slack.com/")) {
  console.error(
    [
      "Brak poprawnej zmiennej SLACK_WEBHOOK_URL.",
      "Ustaw adres Incoming Webhook z Slack (zaczyna się od https://hooks.slack.com/).",
      "",
      "PowerShell:",
      '  $env:SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXX/YYY/ZZZ"',
      "  npm run test:slack",
    ].join("\n")
  );
  process.exit(1);
}

const text =
  process.argv.slice(2).join(" ").trim() ||
  `Test G4-APP — ${new Date().toISOString()}. Jeśli widzisz tę wiadomość, webhook działa.`;

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ text }),
});

const body = await res.text();
if (!res.ok) {
  console.error("Slack odpowiedział błędem:", res.status, body);
  process.exit(1);
}

console.log("OK — sprawdź kanał Slack („", text.slice(0, 60), '…”).');
if (body) console.log("Odpowiedź:", body);
