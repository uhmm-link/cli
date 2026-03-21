/**
 * Seed multiple demo decks with projects, stacks, cards, and scores.
 * Usage: uhmm seed  (or node scripts/seed-demo.js)
 * Requires API running. Uses API_URL or UHMM_URL (default: http://localhost:3000)
 */
const BASE = (process.env.API_URL || process.env.UHMM_URL || "http://localhost:3000").replace(/\/$/, "");
const CREATOR_ID = "u1";
const REVIEWER_NAMES = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Henry", "Irene", "Jack", "Kelly", "Leo", "Maria", "Nick"];

const CARD_TEMPLATES = {
  email: [
    "Dear John, thanks for your email. I will get back to you by Friday.",
    "Quick post: Shipping the new feature today. Thanks to the team!",
    "Reminder: Team standup tomorrow 9am. Please prepare your updates.",
    "Hi Sarah, I've reviewed the proposal. A few thoughts below.",
    "Thanks for the feedback. I'll incorporate your suggestions and resend.",
    "Following up on our call—here are the action items we discussed.",
    "Please find attached the revised budget. Let me know if you have questions.",
    "I'll be out of office next week. For urgent matters, contact Jane.",
    "Meeting notes from the product sync. Key decisions captured.",
    "Action required: Please review and sign off by EOD.",
  ],
  social: [
    "Launching something new this week. Stay tuned!",
    "Big thanks to everyone who made the conference a success.",
    "5 lessons from building our first product. A thread.",
    "We're hiring! Check out our open roles.",
    "Behind the scenes: how we ship features.",
    "Customer spotlight: how Acme Corp uses our platform.",
    "New integration alert: we now support Slack.",
    "Recap of our AMA. Top questions answered.",
    "Throwback to our first launch. How far we've come!",
    "Community highlight: Your feedback shaped this release.",
  ],
  content: [
    "Article draft: The future of remote work in 2025.",
    "Blog post: 10 tips for better code reviews.",
    "Landing page copy: Headline and CTA options.",
    "FAQ section: Common support questions.",
    "Release notes draft for v2.1.",
    "Documentation: Getting started guide.",
    "Help center article: Troubleshooting guide.",
    "Marketing email: Product launch announcement.",
    "Case study: Enterprise deployment best practices.",
    "Technical spec: API rate limiting design.",
  ],
  design: [
    "Hero banner mockup v3 – feedback welcome.",
    "Mobile nav redesign – A/B test variants.",
    "Icon set consistency review.",
    "Color palette for dark mode.",
    "Typography scale for headings.",
    "Illustration style guide.",
    "Empty state designs.",
    "Error state illustrations.",
    "Onboarding flow wireframes.",
    "Dashboard layout options.",
  ],
  support: [
    "Ticket #4521: Login timeout on Safari.",
    "Ticket #4522: Export fails for large datasets.",
    "Ticket #4523: Password reset email delay.",
    "Ticket #4524: Mobile app crash on startup.",
    "Ticket #4525: Billing discrepancy report.",
    "Ticket #4526: API 429 rate limit unclear.",
    "Ticket #4527: Webhook delivery failures.",
    "Ticket #4528: SSO configuration help.",
    "Ticket #4529: Data export format request.",
    "Ticket #4530: Feature request – bulk actions.",
  ],
};

function pick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function id() {
  return Math.random().toString(36).slice(2, 11);
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path}: ${await res.text()}`);
  return res.headers.get("content-type")?.includes("json") ? res.json() : null;
}

async function run() {
  console.log("Seeding demo data (creatorId: u1)...\n");
  const projectLabels = [
    "Email drafts", "Social posts", "Content review", "Design feedback", "Support tickets",
    "Legal review", "Marketing copy", "Product specs", "User research", "Beta feedback",
    "Documentation", "API design", "Security audit", "Accessibility review", "Localization",
  ];
  const stackTemplates = [
    { label: "Q1 batch", type: "email" }, { label: "Q2 batch", type: "social" },
    { label: "Drafts", type: "content" }, { label: "Mockups", type: "design" },
    { label: "Open tickets", type: "support" }, { label: "Archive", type: "email" },
    { label: "Pending", type: "content" },
  ];
  const projects = [];
  const allStacks = [];

  for (let i = 0; i < projectLabels.length; i++) {
    const proj = await api("POST", "/projects", { creatorId: CREATOR_ID, label: projectLabels[i] });
    projects.push(proj);
    console.log(`Created project: ${proj.label}`);
    const numStacks = i === 0 ? 15 : 2 + (i % 4);
    for (let j = 0; j < numStacks; j++) {
      const t = stackTemplates[(i + j) % stackTemplates.length];
      const label = (i === 0 && j === 0) ? "Q1 batch 1 — 15 cards, 12 reviewers" : `${t.label} ${j + 1}`;
      const stack = await api("POST", "/stacks", { projectId: proj.id, label });
      allStacks.push({ ...stack, projectId: proj.id, template: t });
    }
  }

  const allCardTemplates = Object.values(CARD_TEMPLATES).flat();
  for (let s = 0; s < allStacks.length; s++) {
    const stack = allStacks[s];
    const numCards = (s === 0) ? 15 : 5 + Math.floor(Math.random() * 8);
    const cardContents = (s === 0) ? pick(allCardTemplates, 15) : pick(CARD_TEMPLATES[stack.template.type] || CARD_TEMPLATES.email, numCards);
    const cardsPayload = cardContents.map((c) => ({ content: c, meta: { source: "seed" } }));
    await api("POST", `/stacks/${stack.id}/cards`, { cards: cardsPayload });
    console.log(`  Stack "${stack.label}": ${cardsPayload.length} cards`);
  }

  for (let s = 0; s < Math.floor(allStacks.length * 0.7); s++) {
    const stack = allStacks[s];
    const cardsRes = await fetch(`${BASE}/api/stacks/${stack.id}/all-cards`);
    if (!cardsRes.ok) continue;
    const cards = await cardsRes.json();
    if (cards.length === 0) continue;
    const numReviewers = (s === 0) ? 12 : 1 + Math.floor(Math.random() * 4);
    const reviewers = pick(REVIEWER_NAMES, numReviewers);
    for (const reviewer of reviewers) {
      const sessionId = id();
      const decisions = cards.map((c) => ({ cardId: c.id, decision: pick(["approved", "rejected"], 1)[0] }));
      await api("POST", "/scores", { stackId: stack.id, reviewerName: reviewer, sessionId, decisions });
    }
    console.log(`  Scores for "${stack.label}": ${reviewers.length} reviewers`);
  }
  console.log("\nDone. Open the app at", BASE);
}

run().catch((e) => { console.error(e); process.exit(1); });
