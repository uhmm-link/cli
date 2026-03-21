# uhmm.link CLI

Dev tools for uhmm.link: start backend, seed, send-deck, load-folder, check-data, import-json, reset-demo.

**Full spec:** [uhmm-link-backend docs/TECHNICAL-OUTLINE.md](https://github.com/uhmm-link/backend/blob/main/docs/TECHNICAL-OUTLINE.md)

## Setup

```bash
npm install
```

## Commands

| Command | Description |
|---------|-------------|
| `uhmm start` | Start the backend (requires backend repo at `../backend` or `UHMM_BACKEND_PATH`) |
| `uhmm seed` | Seed demo projects, stacks, cards, scores |
| `uhmm send-deck [URL] <label> <card1> ...` | Send a deck to the API |
| `uhmm load-folder [folderId]` | Create stack from backend/data/stacks/&lt;folderId&gt;/ |
| `uhmm check-data` | Check PostgreSQL or JSON data |
| `uhmm import-json [path]` | Import JSON into PostgreSQL |
| `uhmm reset-demo` | Reset to demo data (JSON storage only) |

## Env vars

- `API_URL`, `UHMM_URL` — Default: http://localhost:3000
- `DATABASE_URL` — For check-data, import-json (PostgreSQL)
- `DATA_PATH` — Path to uhmm.json
- `UHMM_BACKEND_PATH` — Path to backend repo (default: ../backend)

## Repo layout

Clone all three repos as siblings:

```
repos/
  backend/   # uhmm-link-backend
  mobile/    # uhmm-link-mobile
  cli/       # uhmm-link-cli
```

Then `uhmm start` finds the backend at `../backend`.
