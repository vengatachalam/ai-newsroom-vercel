# AI Newsroom — CMS Assistant

Full-featured AI-powered newsroom CMS assistant matching the Lovable app at story-spark-ai-13.lovable.app. Powered by Gemini AI.

## Features

- **Story ideas** — Generate 6 story ideas with angles, sources, news pegs + image briefs
- **Write & edit** — Full story, intro only, para-by-para, edit, summary, translate — in PTI Indian English house style
- **CMS fields** — Auto-fill all fields: headline, strap, blurb, summary, desk URL, SEO title, meta description, keywords, tags, category, tone, disclaimer
- **Image generation** — AI image prompts (Midjourney/DALL-E/Firefly ready), PTI photo search terms, captions, alt text
- **Media & links** — Photo suggestions, crosslinks, hyperlinks, disclaimers, developing-story flags
- **SEO** — Keyword density, gaps, headline scoring, placement recommendations
- **Follow-up ideas** — 6 follow-up angles with timing + click-to-write

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

On first load you'll see a landing page. Click **Start writing**, enter your Gemini API key (get one free at https://aistudio.google.com/apikey), and you're in the editor.

## Deploy to Vercel / Netlify

```bash
npm run build
# Deploy the dist/ folder
```

## Tech stack

- React 18 (no external UI libraries — all styled inline)
- Vite 5
- Gemini 2.0 Flash API (gemini-2.0-flash model)

## Structure

```
ai-newsroom/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── index.jsx       # React entry point
    └── App.jsx         # All components (single file, self-contained)
```

## Deploying to Lovable

1. Create a new Lovable project
2. Replace the generated code with the contents of `src/App.jsx`
3. Set your Gemini API key in the UI (or as a Lovable env variable: `VITE_GEMINI_KEY`)
