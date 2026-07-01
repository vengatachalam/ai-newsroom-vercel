// Vercel serverless function — runs on Vercel's infrastructure, NOT the
// user's local network. This means even if the user's network/firewall
// blocks generativelanguage.googleapis.com, this function (running on
// Vercel's servers in the cloud) can still reach it freely.
//
// The browser calls THIS endpoint (same-origin, never blocked) and this
// function does the actual Gemini call server-side.

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, apiKey } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: "Missing 'prompt' in request body" });
  }
  if (!apiKey) {
    return res.status(400).json({ error: "Missing 'apiKey' in request body" });
  }

  let lastError = "No model available";

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      });

      const data = await geminiRes.json();

      if (!geminiRes.ok) {
        lastError = data.error?.message || `HTTP ${geminiRes.status}`;
        if (geminiRes.status === 404) continue;
        return res.status(geminiRes.status).json({ error: lastError });
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = "Empty response from Gemini";
        continue;
      }

      return res.status(200).json({ text, model });
    } catch (err) {
      lastError = err.message || "Fetch error from server to Gemini";
      continue;
    }
  }

  return res.status(500).json({ error: lastError });
}
