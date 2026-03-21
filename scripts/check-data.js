#!/usr/bin/env node
/**
 * Check where data exists: PostgreSQL (uhmm_state) or JSON file.
 * Usage: uhmm check-data
 * Env: DATABASE_URL, DATA_PATH (or UHMM_BACKEND_PATH for backend/data/uhmm.json)
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

function getDataPaths() {
  if (process.env.DATA_PATH && fs.existsSync(process.env.DATA_PATH)) {
    return [process.env.DATA_PATH];
  }
  const backendPath = process.env.UHMM_BACKEND_PATH || path.join(__dirname, "..", "..", "backend");
  return [
    path.join(backendPath, "data", "uhmm.json"),
    path.join(backendPath, "..", "data", "uhmm.json"),
  ];
}

async function checkPostgres() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    console.log("PostgreSQL: DATABASE_URL not set (using JSON storage)");
    return null;
  }
  try {
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: url });
    const client = await pool.connect();
    try {
      const uhmm = await client.query("SELECT data FROM uhmm_state WHERE id = 1");
      const uhmmData = uhmm.rows[0]?.data;
      const uhmmProjects = uhmmData?.projects?.length ?? 0;
      console.log("PostgreSQL:");
      console.log("  uhmm_state: " + uhmmProjects + " projects");
      return { uhmmProjects };
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.log("PostgreSQL: Error -", err.message);
    return null;
  }
}

function checkJson() {
  const dataPaths = getDataPaths();
  console.log("JSON files:");
  for (const p of dataPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf-8");
        const data = JSON.parse(raw);
        const projects = data?.projects?.length ?? 0;
        console.log("  " + p + ": " + projects + " projects");
        return { path: p, projects, data };
      } catch (e) {
        console.log("  " + p + ": parse error");
      }
    }
  }
  console.log("  (no JSON data files found)");
  return null;
}

async function main() {
  console.log("=== uhmm.link data check ===\n");
  const pg = await checkPostgres();
  console.log("");
  const json = checkJson();
  console.log("");
  if (json?.projects > 0 && (!pg || pg.uhmmProjects === 0)) {
    console.log("→ Data is in JSON but PostgreSQL is configured. Run: uhmm import-json [path]");
  } else if (!pg?.uhmmProjects && !json?.projects) {
    console.log("→ No projects found. Create some via the web UI or uhmm seed.");
  } else {
    console.log("→ Data looks OK.");
  }
}

main().catch(console.error);
