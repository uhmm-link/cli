#!/usr/bin/env node
/**
 * Reset backend to demo data (fixtures/demo.json). JSON storage only.
 * Usage: uhmm reset-demo
 * Env: API_URL, UHMM_URL (default: http://localhost:3000)
 */
const BASE = (process.env.API_URL || process.env.UHMM_URL || "http://localhost:3000").replace(/\/$/, "");

async function run() {
  const res = await fetch(`${BASE}/api/admin/reset-demo`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) {
    console.error("Error:", data.error || res.statusText);
    process.exit(1);
  }
  console.log("Reset to demo data. Refresh the app at", BASE);
}

run().catch((e) => { console.error(e); process.exit(1); });
