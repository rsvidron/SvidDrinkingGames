# Bar Games

Mobile-first drinking card games for one shared phone at the bar. Built with React + Vite + TypeScript.

Currently available:

- **Up the River, Down the River** — each player gets their own 4-card pyramid (red/black, higher/lower, inside/outside, guess the suit), then those same cards double as their hand for the river phase.

More games can be added under `src/games/` and registered in `src/games/registry.ts`.

## Local development

```bash
npm install
npm run dev
```

Open the printed URL. To test on your phone, make sure your phone is on the same WiFi as your computer, then visit `http://<your-computer's-local-ip>:5173` (Vite prints a "Network" URL when you run `npm run dev -- --host`).

## Deploying to Railway

This repo builds to a static site and serves it with `serve` (see the `start` script in `package.json` and `railway.json`).

**Option A — Railway CLI (no GitHub needed):**

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Railway will run `npm run build` then `npm run start`, which serves the `dist/` folder on the port Railway assigns.

**Option B — GitHub-linked deploys:**

1. Push this repo to a GitHub repository.
2. In the Railway dashboard, create a new project → "Deploy from GitHub repo" → select this repo.
3. Railway auto-detects the Node app, builds, and deploys. Every push to your default branch redeploys.

Once deployed, Railway gives you a public `*.up.railway.app` URL you can open on any phone.

## Project structure

```
src/
  lib/deck.ts            shared card/deck utilities
  components/             shared UI (PlayingCard, etc.)
  pages/Home.tsx           game picker menu
  games/registry.ts        list of games shown on the home screen
  games/upDownRiver/       Up the River, Down the River game logic + screens
```
