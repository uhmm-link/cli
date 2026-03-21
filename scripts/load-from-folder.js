#!/usr/bin/env node
/**
 * Create a stack from a local folder. Simulates cloud storage for local dev.
 * Usage: uhmm load-folder [folderId]
 * Folder must exist at backend/data/stacks/<folderId>/ with .txt or image files.
 * Env: API_URL, UHMM_URL (default: http://localhost:3000)
 */
const folderId = process.argv[2] || "demo";
const base = (process.env.API_URL || process.env.UHMM_URL || "http://localhost:3000").replace(/\/$/, "");

async function run() {
  const res = await fetch(`${base}/api/stacks/from-folder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderId }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Error:", data.error || res.statusText);
    process.exit(1);
  }
  console.log(`Created stack "${data.stack.label}" with ${data.cards} cards`);
  console.log(`Review link: ${data.link}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
