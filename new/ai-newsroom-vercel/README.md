# AI Newsroom — PTI (network-block-proof version)

## Why this version exists

Direct browser calls to `generativelanguage.googleapis.com` and
`api.anthropic.com` were confirmed blocked on the user's network — even
from a plain standalone HTML file outside any app, and even with a paid
Google Cloud account. This is a network/firewall-level block, not a
code or API key issue.

The fix: the browser never talks to Gemini directly. It calls
`/api/gemini` (same domain as the deployed app — never blocked), and a
**serverless function** running on Vercel's cloud infrastructure makes
the actual call to Gemini from Vercel's servers, which are not behind
the user's blocked network.

## Deploy to Vercel (recommended — 2 minutes)

1. Install the Vercel CLI: `npm i -g vercel`
2. From this folder, run: `vercel`
3. Follow the prompts (link or create a project) — accept all defaults
4. When done, Vercel gives you a live URL like `https://ai-newsroom-xyz.vercel.app`
5. Open that URL, paste your Gemini API key, click "Test & save key"

That's it — the app is now live and the serverless function handles all
Gemini calls server-side.

## Deploy via Vercel's website (no CLI needed)

1. Push this folder to a GitHub repo
2. Go to vercel.com → "Add New Project" → import the repo
3. Vercel auto-detects Vite + the `/api` folder — just click Deploy
4. Done — same result as above

## Local development

```bash
npm install
npm i -g vercel
vercel dev
```

`vercel dev` runs both the Vite frontend AND the `/api/gemini.js`
serverless function locally, so you can test everything before
deploying. Plain `npm run dev` will NOT run the API route — you'll get
"Failed to fetch" on `/api/gemini` because nothing is serving it.

## Project structure

```
ai-newsroom-vercel/
├── api/
│   └── gemini.js        ← Serverless function (runs Gemini call server-side)
├── src/
│   ├── App.jsx           ← Full app — calls /api/gemini, never Gemini directly
│   └── index.jsx
├── index.html
├── package.json
├── vite.config.js
└── vercel.json            ← Tells Vercel how to route /api/*
```

## How it works

1. User enters their Gemini API key in the app (saved to `localStorage`)
2. Every AI action calls `fetch("/api/gemini", { body: { prompt, apiKey } })`
3. This request goes to YOUR deployed domain — same-origin, never blocked
4. The serverless function (`api/gemini.js`) receives it and calls
   `generativelanguage.googleapis.com` from Vercel's servers
5. Vercel's servers are not behind the user's firewall, so the call
   succeeds even when the user's own browser/network cannot reach Google
6. The function returns the result back through `/api/gemini` to the browser

## If you still get "Failed to fetch" after deploying

That would mean even `your-app.vercel.app/api/gemini` itself is
unreachable — which would point to a much broader network block (e.g.
all of vercel.app is blocked, or all outbound HTTPS is blocked except an
explicit allowlist). At that point the fix is firewall/network
administration, not application code — contact whoever manages the
network/proxy to allow outbound HTTPS to `*.vercel.app`.
