#!/usr/bin/env node
/**
 * Send a deck of cards to uhmm.link.
 * Usage: uhmm send-deck [URL] [label] [card1] [card2] ...
 * Or: uhmm send-deck [URL]  (pipe JSON to stdin)
 * Env: API_URL, UHMM_URL (default: http://localhost:3000)
 */
const url = process.argv[2] || process.env.API_URL || process.env.UHMM_URL || "http://localhost:3000";
const isStdin = !process.stdin.isTTY;

async function run() {
  let body;
  if (isStdin) {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    body = JSON.parse(Buffer.concat(chunks).toString());
  } else {
    const label = process.argv[3];
    const cards = process.argv.slice(4);
    if (!label || cards.length === 0) {
      console.error("Usage: uhmm send-deck [URL] <label> <card1> [card2] ...");
      console.error("   or: echo '{\"label\":\"x\",\"cards\":[\"a\",\"b\"]}' | uhmm send-deck [URL]");
      process.exit(1);
    }
    body = { label, cards };
  }
  const res = await fetch(`${url.replace(/\/$/, "")}/api/deck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Error:", res.status, err);
    process.exit(1);
  }
  const data = await res.json();
  console.log(`Created deck "${data.stack.label}" with ${data.cards.length} cards`);
  if (data.reviewUrl) console.log(`Review link: ${data.reviewUrl}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
