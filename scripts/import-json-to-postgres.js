#!/usr/bin/env node
/**
 * Import data from JSON file into PostgreSQL.
 * Usage: uhmm import-json [path-to-json]
 * Default: backend/data/uhmm.json or DATA_PATH
 * Env: DATABASE_URL (required)
 */
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const backendPath = process.env.UHMM_BACKEND_PATH || path.join(__dirname, "..", "..", "backend");
  const envPath = path.join(backendPath, ".env");
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    });
  }
}

const defaultPaths = () => {
  const backendPath = process.env.UHMM_BACKEND_PATH || path.join(__dirname, "..", "..", "backend");
  return [
    path.join(backendPath, "data", "uhmm.json"),
    path.join(backendPath, "fixtures", "demo.json"),
  ];
};

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    console.error("DATABASE_URL not set. Cannot import to PostgreSQL.");
    process.exit(1);
  }
  const jsonPath = process.argv[2] || process.env.DATA_PATH || defaultPaths().find((p) => fs.existsSync(p));
  if (!jsonPath || !fs.existsSync(jsonPath)) {
    console.error("No JSON file found. Specify path: uhmm import-json <path>");
    process.exit(1);
  }
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);
  const projects = data?.projects?.length ?? 0;
  const stacks = data?.stacks?.length ?? 0;
  const cards = data?.cards?.length ?? 0;
  console.log("Importing from", jsonPath, ":", projects, "projects,", stacks, "stacks,", cards, "cards");
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS uhmm_state (
        id INT PRIMARY KEY DEFAULT 1,
        data JSONB NOT NULL DEFAULT '{}',
        CONSTRAINT single_row CHECK (id = 1)
      );
    `);
    await client.query(
      `INSERT INTO uhmm_state (id, data) VALUES (1, $1::jsonb)
       ON CONFLICT (id) DO UPDATE SET data = $1::jsonb`,
      [JSON.stringify(data)]
    );
    console.log("Done. Restart the API and refresh the app.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
