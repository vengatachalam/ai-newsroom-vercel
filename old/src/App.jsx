import { useState } from "react";

// ─── Gemini API helper ────────────────────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Gemini API request failed"
    );
  }

  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  );
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const m = clean.match(/[\[{][\s\S]*[\]}]/);
  return JSON.parse(m ? m[0] : clean);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ children, color = "blue" }) {
  const colors = {
    blue: { bg: "#E6F1FB", text: "#0C447C", border: "#B5D4F4" },
    green: { bg: "#EAF3DE", text: "#3B6D11", border: "#C0DD97" },
    amber: { bg: "#FAEEDA", text: "#633806", border: "#FAC775" },
    red: { bg: "#FCEBEB", text: "#791F1F", border: "#F7C1C1" },
  };
  const c = colors[color];
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 20, fontSize: 11, padding: "2px 10px", fontWeight: 500 }}>
      {children}
    </span>
  );
}

function Spinner({ light = true }) {
  return (
    <span style={{
      display: "inline-block", width: 13, height: 13,
      border: `2px solid ${light ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.1)"}`,
      borderTopColor: light ? "#fff" : "#185FA5",
      borderRadius: "50%", animation: "spin .7s linear infinite", marginRight: 6,
    }} />
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{children}</div>;
}

function Input({ id, value, onChange, placeholder, style = {} }) {
  return (
    <input id={id} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: "100%", fontSize: 14, padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", color: "#111", outline: "none", ...style }}
      onFocus={e => e.target.style.borderColor = "#185FA5"}
      onBlur={e => e.target.style.borderColor = "#ddd"}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 5 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width: "100%", fontSize: 14, padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", color: "#111", outline: "none", resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
      onFocus={e => e.target.style.borderColor = "#185FA5"}
      onBlur={e => e.target.style.borderColor = "#ddd"}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange}
      style={{ width: "100%", fontSize: 14, padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8, background: "#fff", color: "#111", outline: "none", cursor: "pointer" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function PrimaryButton({ onClick, loading, disabled, children }) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", background: loading || disabled ? "#93b8d8" : "#185FA5", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading || disabled ? "not-allowed" : "pointer", transition: ".15s" }}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function SecondaryButton({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", color: "#444", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
      {children}
    </button>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1rem 1.25rem", ...style }}>
      {children}
    </div>
  );
}

function OutputCard({ label, text, onCopy }) {
  return (
    <div style={{ background: "#f8f9fa", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1rem 1.25rem", marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
        {onCopy && <button onClick={onCopy} style={{ fontSize: 11, padding: "3px 10px", border: "1px solid #ddd", borderRadius: 6, background: "#fff", color: "#666", cursor: "pointer" }}>Copy</button>}
      </div>
      <div style={{ fontSize: 14, color: "#111", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{text}</div>
    </div>
  );
}

function ImageCard({ img, index }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ height: 120, background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
        <svg width="32" height="32" fill="none" stroke="#185FA5" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        <span style={{ fontSize: 12, color: "#185FA5" }}>{img.style || `Image ${index + 1}`}</span>
      </div>
      <div style={{ padding: ".75rem 1rem" }}>
        <div style={{ fontSize: 11, color: "#0C447C", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>AI image prompt</div>
        <div style={{ fontSize: 13, color: "#222", marginBottom: 10, lineHeight: 1.5 }}>{img.prompt}</div>
        <div style={{ fontSize: 11, color: "#0C447C", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>PTI search terms</div>
        <div style={{ fontSize: 13, color: "#222", marginBottom: 10 }}>{img.pti_search}</div>
        <div style={{ fontSize: 11, color: "#0C447C", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>Caption</div>
        <div style={{ fontSize: 13, color: "#222", marginBottom: 8 }}>{img.caption}</div>
        <div style={{ fontSize: 11, color: "#0C447C", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>Alt text</div>
        <div style={{ fontSize: 13, color: "#555" }}>{img.alt_text}</div>
      </div>
    </div>
  );
}

function CMSFieldGrid({ fields }) {
  const labels = {
    headline: "Headline", strap: "Strap / subheading", blurb: "Blurb",
    summary: "Summary", desk_url: "Desk URL", seo_title: "SEO title",
    meta_description: "Meta description", keywords: "SEO keywords",
    tags: "Tags", category: "Category", tone: "Tone",
    word_count_target: "Word count target", disclaimer: "Disclaimer",
    house_style_notes: "House style notes",
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
      {Object.entries(fields).map(([k, v]) => (
        <div key={k} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 8, padding: ".65rem .9rem" }}>
          <div style={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3, fontWeight: 600 }}>{labels[k] || k}</div>
          <div style={{ fontSize: 13, color: "#111", lineHeight: 1.4 }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function FollowUpCard({ idea, index, onSelect }) {
  const timingColors = {
    immediate: { bg: "#FCEBEB", text: "#A32D2D" },
    "48hrs": { bg: "#FAEEDA", text: "#854F0B" },
    weekly: { bg: "#E6F1FB", text: "#185FA5" },
  };
  const tc = timingColors[idea.timing] || timingColors.weekly;
  return (
    <div onClick={() => onSelect(idea)} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: ".75rem 1rem", marginBottom: 8, cursor: "pointer", transition: ".15s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#185FA5"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#e8e8e8"}>
      <div style={{ fontWeight: 500, fontSize: 14, color: "#111", marginBottom: 4 }}>{index + 1}. {idea.headline}</div>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{idea.angle}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: tc.bg, color: tc.text, fontWeight: 500 }}>{idea.timing}</span>
        {idea.image_angle && <span style={{ fontSize: 11, color: "#999" }}>📷 {idea.image_angle}</span>}
      </div>
    </div>
  );
}

// ─── TAB PANELS ──────────────────────────────────────────────────────────────

function IdeateTab({ apiKey }) {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("neutral");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState("");
  const [imgs, setImgs] = useState([]);
  const [status, setStatus] = useState("");

  const STYLES = ["neutral", "broadsheet", "digital-first", "tabloid"];

  async function run() {
    if (!topic) { setStatus("Please enter a topic or beat."); return; }
    setLoading(true); setStatus("Generating story ideas…");
    try {
      const p = `You are a senior news editor. Generate 6 compelling story ideas for a ${style}-style publication on the topic: "${topic}".
For each idea provide:
1. Headline (punchy, AP/PTI style)
2. Angle / hook (1 sentence)
3. Potential sources (agencies, Google News searches, social trends)
4. News peg (why now)
Format each idea clearly numbered. Maintain ${style} Indian English house style.`;
      const out = await callGemini(apiKey, p);
      setIdeas(out);
      setStatus("Generating image briefs…");
      const imgP = `You are a photo editor for PTI. Generate 3 image briefs for news stories about: "${topic}". Return ONLY a JSON array:
[{"prompt":"Detailed AI image generation prompt 60 words photorealistic newsworthy","pti_search":"PTI photo library search keywords","caption":"News photo caption 1-2 sentences","alt_text":"Accessibility alt text concise","style":"Image type"}]`;
      const imgOut = await callGemini(apiKey, imgP);
      setImgs(parseJSON(imgOut));
      setStatus("Done.");
    } catch (e) { setStatus("Error: " + e.message); }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Topic / beat / keyword</FieldLabel>
        <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Indian economy, cricket, climate policy, Modi govt…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>House style</FieldLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          {STYLES.map(s => (
            <button key={s} onClick={() => setStyle(s)}
              style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, border: `1px solid ${style === s ? "#185FA5" : "#ddd"}`, background: style === s ? "#E6F1FB" : "#fff", color: style === s ? "#185FA5" : "#666", cursor: "pointer" }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <PrimaryButton onClick={run} loading={loading}>✦ Generate ideas + visuals</PrimaryButton>
      </div>
      {ideas && <OutputCard label="Story ideas" text={ideas} onCopy={() => navigator.clipboard.writeText(ideas).catch(() => {})} />}
      {imgs.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#111", marginBottom: 8, borderTop: "1px solid #eee", paddingTop: 12 }}>Suggested visuals</div>
          {imgs.map((img, i) => <ImageCard key={i} img={img} index={i} />)}
        </div>
      )}
      {status && <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{status}</div>}
    </div>
  );
}

function WriteTab({ apiKey, prefillTitle = "" }) {
  const [title, setTitle] = useState(prefillTitle);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState("full");
  const [style, setStyle] = useState("neutral");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [imgs, setImgs] = useState([]);
  const [status, setStatus] = useState("");

  const MODES = [
    { value: "full", label: "Full story" },
    { value: "intro", label: "Intro only" },
    { value: "para", label: "Para by para" },
    { value: "edit", label: "Edit / improve" },
    { value: "summary", label: "Summary at top" },
    { value: "translate", label: "Translate" },
  ];
  const STYLES = [
    { value: "neutral", label: "Neutral / wire" },
    { value: "broadsheet", label: "Broadsheet" },
    { value: "digital", label: "Digital-first" },
    { value: "tabloid", label: "Tabloid" },
  ];
  const modeInstr = {
    full: "Write a complete news story (headline, summary, body ~500 words, inverted pyramid)",
    intro: "Write only the intro paragraph (inverted pyramid, who-what-when-where-why)",
    para: "Write 4-5 body paragraphs clearly separated with subheadings",
    edit: "Edit and improve the provided draft for clarity, grammar, and house style",
    summary: "Write a 2-3 sentence story summary for placement at the very top",
    translate: "Translate/transcribe into clean Indian English, preserving journalistic tone",
  };

  async function run() {
    if (!title) { setStatus("Please enter a story title."); return; }
    setLoading(true); setStatus("Writing content…");
    try {
      const p = `You are a senior PTI-style journalist. 
Story title/brief: "${title}"
${draft ? "Existing draft/notes:\n" + draft : ""}
Task: ${modeInstr[mode]}
Rules: ${style} Indian English house style, inverted pyramid, attribute all claims, avoid passive voice, mark speculative as [PLACEHOLDER], include story summary at the top.`;
      const out = await callGemini(apiKey, p);
      setOutput(out);
      setStatus("Generating image briefs…");
      const imgP = `PTI photo editor. Generate 3 image briefs for this news story: "${title}". Return ONLY JSON array:
[{"prompt":"Detailed AI image prompt 60 words photorealistic","pti_search":"PTI search terms","caption":"Photo caption journalistic","alt_text":"Alt text concise","style":"Image type"}]`;
      const imgOut = await callGemini(apiKey, imgP);
      setImgs(parseJSON(imgOut));
      setStatus("Done.");
    } catch (e) { setStatus("Error: " + e.message); }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <FieldLabel>Story title / brief</FieldLabel>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter headline or brief description of the story" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <FieldLabel>Existing draft / notes (optional)</FieldLabel>
        <Textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Paste existing copy, bullet points, or raw notes…" rows={4} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <FieldLabel>Mode</FieldLabel>
          <Select value={mode} onChange={e => setMode(e.target.value)} options={MODES} />
        </div>
        <div>
          <FieldLabel>House style</FieldLabel>
          <Select value={style} onChange={e => setStyle(e.target.value)} options={STYLES} />
        </div>
      </div>
      <PrimaryButton onClick={run} loading={loading}>✦ Generate content + images</PrimaryButton>
      {output && <OutputCard label="Generated content" text={output} onCopy={() => navigator.clipboard.writeText(output).catch(() => {})} />}
      {imgs.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#111", marginBottom: 8, borderTop: "1px solid #eee", paddingTop: 12 }}>Image generation prompts</div>
          {imgs.map((img, i) => <ImageCard key={i} img={img} index={i} />)}
        </div>
      )}
      {status && <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{status}</div>}
    </div>
  );
}

function CMSTab({ apiKey }) {
  const [title, setCmsTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState(null);
  const [imgs, setImgs] = useState([]);
  const [status, setStatus] = useState("");

  async function run() {
    if (!title) { setStatus("Please enter a story title."); return; }
    setLoading(true); setStatus("Auto-filling all CMS fields…");
    try {
      const p = `You are a CMS editor for a PTI-style news organisation. Generate all CMS fields for this story.
Title: "${title}"
Body: "${body}"
Return ONLY valid JSON object (no extra text):
{"headline":"...","strap":"...","blurb":"...","summary":"...","desk_url":"...","seo_title":"...","meta_description":"under 160 chars","keywords":"kw1,kw2,kw3,kw4,kw5","tags":"t1,t2,t3,t4,t5","category":"...","tone":"...","word_count_target":"400-600","disclaimer":"...","house_style_notes":"..."}`;
      const out = await callGemini(apiKey, p);
      setFields(parseJSON(out));
      setStatus("Generating featured image…");
      const imgP = `PTI photo editor. 1 featured image brief for: "${title}". Return ONLY JSON array:
[{"prompt":"Detailed AI image prompt 60 words photorealistic","pti_search":"PTI search terms","caption":"Photo caption","alt_text":"Alt text","style":"Featured image"}]`;
      const imgOut = await callGemini(apiKey, imgP);
      setImgs(parseJSON(imgOut));
      setStatus("All CMS fields filled.");
    } catch (e) { setStatus("Error: " + e.message); }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <FieldLabel>Story title</FieldLabel>
        <Input value={title} onChange={e => setCmsTitle(e.target.value)} placeholder="Enter story title — all CMS fields will be auto-populated" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Story body (optional — improves accuracy)</FieldLabel>
        <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Paste story body…" rows={4} />
      </div>
      <PrimaryButton onClick={run} loading={loading}>✦ Auto-fill all CMS fields</PrimaryButton>
      {fields && (
        <>
          <CMSFieldGrid fields={fields} />
          {imgs.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#111", marginBottom: 8, borderTop: "1px solid #eee", paddingTop: 12 }}>Featured image</div>
              {imgs.map((img, i) => <ImageCard key={i} img={img} index={i} />)}
            </div>
          )}
        </>
      )}
      {status && <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{status}</div>}
    </div>
  );
}

function ImagesTab({ apiKey }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [count, setCount] = useState("3");
  const [style, setStyle] = useState("photojournalism");
  const [loading, setLoading] = useState(false);
  const [imgs, setImgs] = useState([]);
  const [status, setStatus] = useState("");

  const COUNTS = [{ value: "3", label: "3 images" }, { value: "5", label: "5 images" }, { value: "8", label: "8 images" }];
  const STYLES = [
    { value: "photojournalism", label: "Photojournalism / wire" },
    { value: "editorial", label: "Editorial illustration" },
    { value: "infographic", label: "Infographic / data viz" },
    { value: "portrait", label: "Portrait / headshot" },
    { value: "aerial", label: "Aerial / wide shot" },
  ];

  async function run() {
    if (!title) { setStatus("Please enter a story headline."); return; }
    setLoading(true); setStatus(`Generating ${count} image briefs…`);
    try {
      const p = `You are a PTI photo editor. Generate ${count} image briefs for this news story.
Story: "${title}". ${body ? "Body: " + body.substring(0, 300) : ""}
Style: ${style}
Return ONLY a JSON array with ${count} items:
[{"prompt":"Detailed AI image prompt 60-80 words photorealistic newsworthy ${style}","pti_search":"PTI photo library search 5-8 keywords","caption":"Journalistic photo caption 1-2 sentences","alt_text":"Concise accessibility alt text","style":"${style}"}]`;
      const out = await callGemini(apiKey, p);
      setImgs(parseJSON(out));
      setStatus(`${count} image briefs ready. Use prompts with Midjourney, DALL-E, or Adobe Firefly.`);
    } catch (e) { setStatus("Error: " + e.message); }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ background: "#EAF3DE", border: "1px solid #C0DD97", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#3B6D11", marginBottom: 14 }}>
        ✦ AI image prompts · PTI search terms · Alt text · Captions — for every story
      </div>
      <div style={{ marginBottom: 12 }}>
        <FieldLabel>Story headline or topic</FieldLabel>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. India-Pakistan trade talks resume in New Delhi" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <FieldLabel>Story body (optional)</FieldLabel>
        <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Paste story text for more precise image suggestions…" rows={3} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <FieldLabel>Number of images</FieldLabel>
          <Select value={count} onChange={e => setCount(e.target.value)} options={COUNTS} />
        </div>
        <div>
          <FieldLabel>Image style</FieldLabel>
          <Select value={style} onChange={e => setStyle(e.target.value)} options={STYLES} />
        </div>
      </div>
      <PrimaryButton onClick={run} loading={loading}>✦ Generate image briefs</PrimaryButton>
      {imgs.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {imgs.map((img, i) => <ImageCard key={i} img={img} index={i} />)}
        </div>
      )}
      {status && <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{status}</div>}
    </div>
  );
}

function MediaTab({ apiKey }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");

  async function run() {
    if (!body) { setStatus("Please paste story text."); return; }
    setLoading(true); setStatus("Analysing for media & link suggestions…");
    try {
      const p = `You are a digital news editor for a PTI-style publication. Analyse this story and provide:

1. PHOTO SUGGESTIONS (3): PTI photo library search terms, alt text, and caption for each
2. CROSSLINKS (3): Internal story crosslink anchor texts and topics  
3. HYPERLINKS (3): External hyperlink anchor texts with target descriptions
4. DISCLAIMER: Required sourcing/legal/editorial disclaimer text
5. DEVELOPING STORY FLAG: Should this be marked developing? Why?
6. RELATED MEDIA: Video, infographic, or interactive content suggestions

Story:
${body}

Format each section with clear headers.`;
      const out = await callGemini(apiKey, p);
      setOutput(out);
      setStatus("Done.");
    } catch (e) { setStatus("Error: " + e.message); }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Story text</FieldLabel>
        <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Paste your story here…" rows={6} />
      </div>
      <PrimaryButton onClick={run} loading={loading}>✦ Suggest media, crosslinks & disclaimers</PrimaryButton>
      {output && <OutputCard label="Media & link suggestions" text={output} onCopy={() => navigator.clipboard.writeText(output).catch(() => {})} />}
      {status && <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{status}</div>}
    </div>
  );
}

function SEOTab({ apiKey }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");

  async function run() {
    if (!body) { setStatus("Please paste story text."); return; }
    setLoading(true); setStatus("Analysing SEO & keywords…");
    try {
      const p = `You are an SEO editor for an Indian news organisation. Analyse this story and provide:

1. PRIMARY KEYWORD: Best keyword + ideal usage count for this length
2. SECONDARY KEYWORDS: 5 keywords with recommended frequency each
3. CURRENT KEYWORD DENSITY: Count occurrences of main keywords in text
4. KEYWORD GAPS: Missing important keywords that should be added
5. HEADLINE SCORE: Rate headline SEO strength /10 with specific suggestions
6. META DESCRIPTION: Optimised meta under 160 characters
7. KEYWORD PLACEMENT: Where exactly to insert keywords (intro, subheadings, para 3, etc.)
8. INTERNAL LINK OPPORTUNITIES: Based on the keywords

Story:
${body}

Be specific with exact counts and paragraph placements.`;
      const out = await callGemini(apiKey, p);
      setOutput(out);
      setStatus("Done.");
    } catch (e) { setStatus("Error: " + e.message); }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Story text</FieldLabel>
        <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Paste story for keyword & SEO analysis…" rows={6} />
      </div>
      <PrimaryButton onClick={run} loading={loading}>✦ Analyse SEO & keywords</PrimaryButton>
      {output && <OutputCard label="SEO analysis" text={output} onCopy={() => navigator.clipboard.writeText(output).catch(() => {})} />}
      {status && <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{status}</div>}
    </div>
  );
}

function FollowUpTab({ apiKey, onWriteIdea }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [status, setStatus] = useState("");

  async function run() {
    if (!body) { setStatus("Please enter the published story."); return; }
    setLoading(true); setStatus("Generating follow-up ideas…");
    try {
      const p = `You are a senior PTI news editor. Read this published story and suggest 6 strong follow-up story ideas.
Story: ${body}
Return ONLY a JSON array:
[{"headline":"...","angle":"...","timing":"immediate|48hrs|weekly","image_angle":"brief photo direction for this story"}]`;
      const out = await callGemini(apiKey, p);
      setIdeas(parseJSON(out));
      setStatus("Click any idea to open it in the Write tab.");
    } catch (e) { setStatus("Error: " + e.message); }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Published story headline / summary</FieldLabel>
        <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Paste the published story headline or brief…" rows={4} />
      </div>
      <PrimaryButton onClick={run} loading={loading}>✦ Generate follow-up ideas</PrimaryButton>
      {ideas.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#111", marginBottom: 8 }}>Click any idea to write it →</div>
          {ideas.map((idea, i) => <FollowUpCard key={i} idea={idea} index={i} onSelect={onWriteIdea} />)}
        </div>
      )}
      {status && <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{status}</div>}
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onStart }) {
  const features = [
    { icon: "📋", title: "Full CMS fill", desc: "Headline, strap, blurb, summary, body, SEO title, description, keywords, tags, desk URL — all at once." },
    { icon: "📷", title: "Photo suggestions", desc: "PTI-style photo brief, caption, and alt text generated for every story." },
    { icon: "🔗", title: "Crosslinks & disclaimers", desc: "Internal link anchors, sourcing disclaimers, developing-story flags." },
    { icon: "📰", title: "House style enforced", desc: "Inverted pyramid, Indian English, attribution, neutral tone — every time." },
    { icon: "✏️", title: "Para-by-para rewrites", desc: "Tighten, expand, change tone, translate — without leaving the editor." },
    { icon: "💡", title: "Follow-up ideas", desc: "Every article ends with 4–6 follow-up story angles ready for the desk." },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "system-ui, sans-serif" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>AI Newsroom</div>
        <button onClick={onStart} style={{ fontSize: 13, padding: "7px 18px", background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500 }}>
          Start writing →
        </button>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "5rem 2rem 3rem", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#E6F1FB", color: "#185FA5", fontSize: 12, fontWeight: 600, padding: "4px 14px", borderRadius: 20, marginBottom: 24, letterSpacing: ".04em" }}>
          Powered by Gemini AI
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: "#111", lineHeight: 1.2, marginBottom: 20 }}>
          From title to publish-ready story in seconds
        </h1>
        <p style={{ fontSize: 17, color: "#666", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 36px" }}>
          Type a headline idea. AI writes the full article in PTI-style Indian English — headline, strap, summary, body, SEO, photo suggestions, crosslinks, follow-ups. Every CMS field, filled.
        </p>
        <button onClick={onStart} style={{ fontSize: 15, padding: "12px 32px", background: "#185FA5", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}>
          Start writing →
        </button>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 2rem 5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#111", marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing"); // landing | setup | editor
  const [apiKey, setApiKeyState] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [activeTab, setActiveTab] = useState("ideate");
  const [writeTitle, setWriteTitle] = useState("");

  function handleStart() { setPage("setup"); }

  function handleSaveKey() {
    if (apiKeyInput.trim()) {
      setApiKeyState(apiKeyInput.trim());
      setKeySaved(true);
      setTimeout(() => setPage("editor"), 400);
    }
  }

  function handleWriteIdea(idea) {
    setWriteTitle(idea.headline);
    setActiveTab("write");
  }

  const TABS = [
    { id: "ideate", label: "Story ideas" },
    { id: "write", label: "Write & edit" },
    { id: "cms", label: "CMS fields" },
    { id: "images", label: "Images" },
    { id: "media", label: "Media & links" },
    { id: "seo", label: "SEO" },
    { id: "follow", label: "Follow-ups" },
  ];

  if (page === "landing") return <LandingPage onStart={handleStart} />;

  if (page === "setup") return (
    <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: "2.5rem", width: "100%", maxWidth: 440 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 6 }}>Enter your Gemini API key</div>
        <div style={{ fontSize: 14, color: "#666", marginBottom: 24, lineHeight: 1.6 }}>
          Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: "#185FA5" }}>aistudio.google.com/apikey</a>. Your key is used only in your browser.
        </div>
        <div style={{ marginBottom: 16 }}>
          <FieldLabel>Gemini API key</FieldLabel>
          <Input value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} placeholder="AIza…" style={{ fontFamily: "monospace" }} />
        </div>
        <PrimaryButton onClick={handleSaveKey} disabled={!apiKeyInput.trim()}>
          {keySaved ? "✓ Saved — entering editor…" : "Save key & start →"}
        </PrimaryButton>
        <div style={{ marginTop: 12, fontSize: 12, color: "#aaa" }}>Never stored. Used only for Gemini API calls.</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <nav style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "0 1.5rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>AI Newsroom</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#aaa" }}>Gemini connected</div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B6D11" }} />
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.5rem 1rem" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ fontSize: 13, padding: "6px 14px", borderRadius: 20, border: `1px solid ${activeTab === t.id ? "#185FA5" : "#ddd"}`, background: activeTab === t.id ? "#185FA5" : "#fff", color: activeTab === t.id ? "#fff" : "#555", cursor: "pointer", fontWeight: activeTab === t.id ? 500 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>

        <Card>
          {activeTab === "ideate" && <IdeateTab apiKey={apiKey} />}
          {activeTab === "write" && <WriteTab apiKey={apiKey} prefillTitle={writeTitle} key={writeTitle} />}
          {activeTab === "cms" && <CMSTab apiKey={apiKey} />}
          {activeTab === "images" && <ImagesTab apiKey={apiKey} />}
          {activeTab === "media" && <MediaTab apiKey={apiKey} />}
          {activeTab === "seo" && <SEOTab apiKey={apiKey} />}
          {activeTab === "follow" && <FollowUpTab apiKey={apiKey} onWriteIdea={handleWriteIdea} />}
        </Card>
      </div>
    </div>
  );
}
