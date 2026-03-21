#!/usr/bin/env node
/**
 * uhmm.link CLI - single entry point for dev tools.
 * Commands: start, seed, send-deck, load-folder, check-data, import-json, reset-demo
 */
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const cmd = process.argv[2];
const args = process.argv.slice(3);
const cliRoot = path.join(__dirname, "..");

function loadEnvFromBackend() {
  const backendPath = process.env.UHMM_BACKEND_PATH || path.join(cliRoot, "..", "backend");
  const envPath = path.join(backendPath, ".env");
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf-8")
      .split("\n")
      .forEach((line) => {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim();
      });
  }
}

switch (cmd) {
  case "start": {
    loadEnvFromBackend();
    const backendPath = process.env.UHMM_BACKEND_PATH || path.join(cliRoot, "..", "backend");
    if (!fs.existsSync(backendPath)) {
      console.error("Backend not found at", backendPath);
      console.error("Set UHMM_BACKEND_PATH or clone backend repo next to cli.");
      process.exit(1);
    }
    const pkg = path.join(backendPath, "package.json");
    if (!fs.existsSync(pkg)) {
      console.error("Backend package.json not found. Run npm install in backend.");
      process.exit(1);
    }
    // Run backend: npm run dev
    const child = spawn("npm", ["run", "dev"], {
      stdio: "inherit",
      cwd: backendPath,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "development" },
    });
    child.on("exit", (code) => process.exit(code ?? 0));
    break;
  }
  case "seed": {
    process.argv = ["node", "seed", ...args];
    require("../scripts/seed-demo.js");
    break;
  }
  case "send-deck": {
    process.argv = ["node", "send-deck", ...args];
    require("../scripts/send-deck.js");
    break;
  }
  case "load-folder": {
    process.argv = ["node", "load-folder", ...args];
    require("../scripts/load-from-folder.js");
    break;
  }
  case "check-data": {
    process.argv = ["node", "check-data", ...args];
    require("../scripts/check-data.js");
    break;
  }
  case "import-json": {
    process.argv = ["node", "import-json", ...args];
    require("../scripts/import-json-to-postgres.js");
    break;
  }
  case "reset-demo": {
    process.argv = ["node", "reset-demo", ...args];
    require("../scripts/reset-demo.js");
    break;
  }
  default:
    if (cmd === "-h" || cmd === "--help" || !cmd) {
      console.log(`uhmm.link CLI

Usage: uhmm <command> [args]

Commands:
  start          Start the backend (requires backend repo at ../backend or UHMM_BACKEND_PATH)
  seed           Seed demo projects, stacks, cards, scores (API_URL)
  send-deck      Send a deck to the API (API_URL)
  load-folder    Create stack from local folder (API_URL)
  check-data     Check PostgreSQL or JSON data (DATABASE_URL, DATA_PATH)
  import-json    Import JSON into PostgreSQL (DATABASE_URL, DATA_PATH)
  reset-demo     Reset to demo data via API (API_URL, JSON storage only)

Env vars:
  API_URL, UHMM_URL     Default: http://localhost:3000
  DATABASE_URL         For PostgreSQL scripts
  DATA_PATH            Path to uhmm.json (or backend/data/uhmm.json)
  UHMM_BACKEND_PATH   Path to backend repo (default: ../backend)
`);
    } else {
      console.error("Unknown command:", cmd);
      process.exit(1);
    }
}
