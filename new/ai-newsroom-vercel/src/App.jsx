import { useState, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const PTI_CATEGORIES = ["National","Politics","Economy","Business & Finance","Sports","Cricket","International","Science & Technology","Health","Entertainment","Education","Environment","Defence","Law & Order","Social","Agriculture","Infrastructure","Energy","Weather","Obituary","Feature","Analysis","Opinion"];
const PTI_IMAGE_TAGS = ["Breaking News","File Photo","Representative Image","PTI Photo","ANI Photo","Getty Images","AP Photo","Reuters","AFP","Screengrab","Social Media","Handout","Archive","Illustration","Infographic","Satellite Image","Video Frame"];
const PTI_DESKS = ["National Desk","Political Desk","Economic Desk","Sports Desk","International Desk","Science Desk","Health Desk","Entertainment Desk","Business Desk","State Desk","Defence Desk","Legal Desk"];
const SCHEMA_TYPES = ["NewsArticle","Article","BlogPosting","ReportageNewsArticle","AnalysisNewsArticle","OpinionNewsArticle"];
const ROBOTS_OPTIONS = ["index, follow","noindex, follow","index, nofollow","noindex, nofollow"];
const KEY_STORE = "pti_gemini_key_v2";

// ─── Key storage ──────────────────────────────────────────────────────────────
function loadKey() { try { return localStorage.getItem(KEY_STORE) || ""; } catch(e) { return ""; } }
function saveKey(k) { try { localStorage.setItem(KEY_STORE, k); } catch(e) {} }
function clearKey() { try { localStorage.removeItem(KEY_STORE); } catch(e) {} }

// ─── AI API — calls our own /api/gemini serverless function ──────────────────
// This is the fix for networks that block generativelanguage.googleapis.com:
// the BROWSER only ever talks to /api/gemini (same domain — never blocked).
// The actual Gemini call happens inside the Vercel serverless function,
// which runs on Vercel's cloud infrastructure — not the user's local network —
// so it is never affected by local firewalls, corporate proxies, or ISP blocks.

async function callAI(prompt) {
  const key = loadKey();
  if (!key) throw new Error("No API key — please save your Gemini key first.");

  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, apiKey: key }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error || `Server error ${res.status}`;
    if (msg.includes("API_KEY") || msg.includes("API key not valid")) {
      throw new Error("Invalid Gemini API key. Get one at aistudio.google.com/apikey");
    }
    if (res.status === 429) throw new Error("Rate limit hit — wait a moment and try again.");
    throw new Error(msg);
  }

  if (!data.text) throw new Error("Empty response from Gemini.");
  return data.text;
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const m = clean.match(/[\[{][\s\S]*[\]}]/);
  return JSON.parse(m ? m[0] : clean);
}

function escX(s) {
  return String(s || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ─── UI primitives ────────────────────────────────────────────────────────────
function Spin({ light = true }) {
  return <span style={{ display:"inline-block",width:13,height:13,border:`2px solid ${light?"rgba(255,255,255,.3)":"rgba(0,0,0,.08)"}`,borderTopColor:light?"#fff":"#1a56db",borderRadius:"50%",animation:"spin .7s linear infinite",marginRight:6 }}/>;
}
function Lbl({ c }) { return <label style={{ fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>{c}</label>; }
function Inp({ value, onChange, placeholder, type="text", mono=false, readOnly=false }) {
  const [f,setF] = useState(false);
  return <input value={value} onChange={onChange} placeholder={placeholder} type={type} readOnly={readOnly}
    style={{ width:"100%",fontSize:14,padding:"9px 12px",border:`1.5px solid ${f?"#1a56db":"#e5e7eb"}`,borderRadius:8,background:readOnly?"#f9fafb":"#fff",color:"#111",outline:"none",fontFamily:mono?"monospace":"inherit",transition:"border-color .12s" }}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>;
}
function Txt({ value, onChange, placeholder, rows=5, readOnly=false, mono=false }) {
  const [f,setF] = useState(false);
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} readOnly={readOnly}
    style={{ width:"100%",fontSize:14,padding:"9px 12px",border:`1.5px solid ${f?"#1a56db":"#e5e7eb"}`,borderRadius:8,background:readOnly?"#f9fafb":"#fff",color:"#111",outline:"none",resize:"vertical",lineHeight:1.6,fontFamily:mono?"monospace":"inherit",transition:"border-color .12s" }}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>;
}
function Sel({ value, onChange, options }) {
  return <select value={value} onChange={onChange}
    style={{ width:"100%",fontSize:14,padding:"9px 12px",border:"1.5px solid #e5e7eb",borderRadius:8,background:"#fff",color:"#111",outline:"none",cursor:"pointer" }}>
    {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
  </select>;
}
function Btn({ onClick, loading, disabled, children, color="#1a56db" }) {
  return <button onClick={onClick} disabled={loading||disabled}
    style={{ display:"inline-flex",alignItems:"center",gap:7,padding:"10px 22px",background:loading||disabled?"#93c5fd":color,color:"#fff",border:"none",borderRadius:9,fontSize:14,fontWeight:600,cursor:loading||disabled?"not-allowed":"pointer" }}>
    {loading&&<Spin/>}{children}
  </button>;
}
function Card({ children, style={} }) {
  return <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"1.25rem 1.5rem",...style }}>{children}</div>;
}
function Row({ children, cols=2 }) { return <div style={{ display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:12 }}>{children}</div>; }
function Divider({ label }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8,margin:"16px 0 12px" }}>
      <div style={{ flex:1,height:1,background:"#e5e7eb" }}/>
      <span style={{ fontSize:10,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap" }}>{label}</span>
      <div style={{ flex:1,height:1,background:"#e5e7eb" }}/>
    </div>
  );
}
function Pill({ label, on, onClick }) {
  return <button onClick={onClick}
    style={{ fontSize:12,padding:"4px 11px",borderRadius:20,border:`1.5px solid ${on?"#1a56db":"#e5e7eb"}`,background:on?"#eff6ff":"#fff",color:on?"#1a56db":"#6b7280",cursor:"pointer",fontWeight:on?700:400 }}>
    {label}
  </button>;
}
function ScoreBadge({ label, score }) {
  const pct = (parseFloat(score)||0)/10;
  const col = pct>=0.8?"#16a34a":pct>=0.6?"#d97706":"#dc2626";
  return (
    <div style={{ background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:9,padding:".75rem",textAlign:"center" }}>
      <div style={{ fontSize:10,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26,fontWeight:700,color:col }}>{score||"—"}</div>
      <div style={{ fontSize:10,color:"#9ca3af" }}>/ 10</div>
      <div style={{ marginTop:6,height:3,background:"#e5e7eb",borderRadius:2 }}>
        <div style={{ height:3,width:`${Math.min(pct*100,100)}%`,background:col,borderRadius:2 }}/>
      </div>
    </div>
  );
}
function StatusBar({ msg }) {
  if (!msg) return null;
  const err = msg.startsWith("❌"); const ok = msg.startsWith("✅");
  return <div style={{ fontSize:12,marginTop:8,color:err?"#dc2626":ok?"#16a34a":"#6b7280",fontWeight:err||ok?600:400 }}>{msg}</div>;
}

// ─── Output box ───────────────────────────────────────────────────────────────
function OutBox({ label, text, onCopy }) {
  return (
    <div style={{ background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden",marginTop:10 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",borderBottom:"1px solid #e5e7eb",background:"#fff" }}>
        <span style={{ fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".06em" }}>{label}</span>
        {onCopy && <button onClick={onCopy} style={{ fontSize:11,padding:"3px 10px",border:"1px solid #e5e7eb",borderRadius:6,background:"#f9fafb",color:"#6b7280",cursor:"pointer" }}>Copy</button>}
      </div>
      <div style={{ padding:"12px 14px",fontSize:14,color:"#111",lineHeight:1.8,whiteSpace:"pre-wrap",wordBreak:"break-word",maxHeight:560,overflowY:"auto" }}>
        {text}
      </div>
    </div>
  );
}

// ─── Image Card ───────────────────────────────────────────────────────────────
function ImgCard({ img, idx, tags=[], onTagToggle }) {
  return (
    <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,overflow:"hidden",marginBottom:12 }}>
      <div style={{ height:80,background:"linear-gradient(135deg,#eff6ff,#dbeafe)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:4 }}>
        <svg width="24" height="24" fill="none" stroke="#1a56db" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        <span style={{ fontSize:11,color:"#1a56db",fontWeight:600 }}>{img.style||`Image ${idx+1}`}</span>
      </div>
      <div style={{ padding:".85rem 1rem" }}>
        {[["AI image prompt",img.prompt],["PTI search terms",img.pti_search],["Caption",img.caption],["Alt text",img.alt_text],["Credit",img.photographer_credit]].map(([lbl,val])=>val?(
          <div key={lbl} style={{ marginBottom:8 }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#1a56db",textTransform:"uppercase",letterSpacing:".05em",marginBottom:2 }}>{lbl}</div>
            <div style={{ fontSize:13,color:"#222",lineHeight:1.5 }}>{val}</div>
          </div>
        ):null)}
        <Divider label="Image tags — click to select"/>
        <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
          {PTI_IMAGE_TAGS.map(t=>(
            <button key={t} onClick={()=>onTagToggle(idx,t)}
              style={{ fontSize:10,padding:"2px 8px",borderRadius:20,border:`1.5px solid ${tags.includes(t)?"#1a56db":"#e5e7eb"}`,background:tags.includes(t)?"#eff6ff":"#fff",color:tags.includes(t)?"#1a56db":"#6b7280",cursor:"pointer" }}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CMS Grid ─────────────────────────────────────────────────────────────────
function CMSGrid({ fields }) {
  const HI = ["headline","category","desk","breaking","priority"];
  const LABELS = { headline:"Headline",strap:"Strap",blurb:"Blurb",summary:"Summary",desk_url:"Desk URL",pti_slug:"PTI slug",tone:"Tone",word_count_target:"Word count",breaking:"Breaking?",developing:"Developing?",priority:"Priority",disclaimer:"Disclaimer",house_style_notes:"Style notes",embargo:"Embargo",tags:"Tags",keywords:"Keywords",category:"Category",desk:"Desk" };
  return (
    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12 }}>
      {Object.entries(fields).map(([k,v])=>(
        <div key={k} style={{ background:HI.includes(k)?"#eff6ff":"#f9fafb",border:`1px solid ${HI.includes(k)?"#bfdbfe":"#e5e7eb"}`,borderRadius:9,padding:".7rem .95rem" }}>
          <div style={{ fontSize:10,color:HI.includes(k)?"#1a56db":"#9ca3af",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3,fontWeight:700 }}>{LABELS[k]||k}</div>
          <div style={{ fontSize:13,color:"#111",lineHeight:1.4,fontWeight:HI.includes(k)?600:400 }}>{String(v)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MetaBlock ────────────────────────────────────────────────────────────────
function MetaBlock({ value, onCopy }) {
  return (
    <div style={{ background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:9,padding:"1rem",marginBottom:12 }}>
      <pre style={{ fontFamily:"monospace",fontSize:12,color:"#111",whiteSpace:"pre-wrap",wordBreak:"break-all",lineHeight:1.6,margin:0 }}>{value}</pre>
      {onCopy && <button onClick={onCopy} style={{ marginTop:8,fontSize:11,padding:"3px 10px",border:"1px solid #e5e7eb",borderRadius:6,background:"#fff",color:"#6b7280",cursor:"pointer" }}>Copy</button>}
    </div>
  );
}

async function fetchImgs(context, count=3, cat="") {
  const out = await callAI(
    `PTI photo editor India. ${count} image briefs for: "${context}"${cat?` Category: ${cat}`:""}.
Return ONLY a JSON array with exactly ${count} items, no other text:
[{"prompt":"Detailed AI image prompt 60 words photorealistic Indian news","pti_search":"PTI photo library India search 5-7 keywords","caption":"PTI dateline caption [CITY], [DATE] (PTI Photo)","alt_text":"Under 15 words","style":"Photojournalism","photographer_credit":"PTI Photo"}]`
  );
  return parseJSON(out);
}

// ══════════════════════════════════════════════════════════════════════════════
// SETUP SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function SetupScreen({ onSave }) {
  const saved = loadKey();
  const [key, setKey] = useState(saved);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(saved ? "✦ Saved key found — click Test to continue" : "");

  async function test() {
    if (!key.trim()) { setResult("❌ Please enter your Gemini API key."); return; }
    setTesting(true); setResult("Testing connection…");
    saveKey(key.trim());
    try {
      await callAI("Reply with just the word: OK");
      setResult("✅ Connected! Entering editor…");
      setTimeout(() => onSave(), 600);
    } catch(e) {
      clearKey();
      setResult("❌ " + e.message);
    }
    setTesting(false);
  }

  return (
    <div style={{ minHeight:"100vh",background:"#f9fafb",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:"1rem" }}>
      <div style={{ background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"2.5rem",width:"100%",maxWidth:480,boxShadow:"0 4px 24px rgba(0,0,0,.06)" }}>
        <div style={{ fontSize:22,fontWeight:700,color:"#111",marginBottom:6 }}>Connect Gemini AI</div>
        <div style={{ fontSize:14,color:"#6b7280",marginBottom:20,lineHeight:1.7 }}>
          Get a <strong>free</strong> Gemini API key at{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color:"#1a56db",fontWeight:500 }}>aistudio.google.com/apikey</a>
          <br/>
          <span style={{ fontSize:12,background:"#fffbeb",color:"#92400e",padding:"2px 8px",borderRadius:4,display:"inline-block",marginTop:6 }}>
            ⚠ In Google AI Studio: make sure your key has <strong>no restrictions</strong> set
          </span>
        </div>

        {saved && (
          <div style={{ background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:9,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:12,fontWeight:700,color:"#15803d" }}>✅ Saved key found</div>
              <div style={{ fontSize:11,color:"#166534",fontFamily:"monospace",marginTop:2 }}>{saved.slice(0,10)}••••••••••••••••••••</div>
            </div>
            <button onClick={()=>{ clearKey(); setKey(""); setResult(""); }}
              style={{ fontSize:11,padding:"3px 9px",border:"1px solid #bbf7d0",borderRadius:6,background:"#fff",color:"#dc2626",cursor:"pointer",fontWeight:600 }}>Remove</button>
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <Lbl c={saved ? "Use a different key" : "Gemini API key"}/>
          <Inp value={key} onChange={e=>setKey(e.target.value)} placeholder="AIza…" type="password" mono/>
        </div>

        <Btn onClick={test} loading={testing}>{saved ? "✦ Enter editor →" : "Test key & save →"}</Btn>
        {result && (
          <div style={{ marginTop:12,fontSize:13,fontWeight:600,color:result.startsWith("✅")?"#16a34a":result.startsWith("Testing")||result.startsWith("✦")?"#6b7280":"#dc2626" }}>
            {result}
          </div>
        )}
        <div style={{ marginTop:16,fontSize:12,color:"#9ca3af" }}>
          Key saved in browser localStorage — auto-loaded every visit. No re-entry needed.
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SEO + CMS TAB
// ══════════════════════════════════════════════════════════════════════════════
function SEOCMSTab() {
  const [title,setTitle]   = useState("");
  const [body,setBody]     = useState("");
  const [cat,setCat]       = useState("National");
  const [desk,setDesk]     = useState("National Desk");
  const [schema,setSchema] = useState("NewsArticle");
  const [robots,setRobots] = useState("index, follow");
  const [site,setSite]     = useState("PTI News");
  const [baseUrl,setBaseUrl] = useState("https://www.ptinews.com");
  const [author,setAuthor] = useState("PTI");
  const [tw,setTw]         = useState("@PTI_News");
  const [brk,setBrk]       = useState(false);
  const [dev,setDev]       = useState(false);
  const [cmsApi,setCmsApi] = useState("");
  const [cmsToken,setCmsToken] = useState("");
  const [loading,setLoading] = useState(false);
  const [pushing,setPushing] = useState(false);
  const [status,setStatus] = useState("");
  const [pushStatus,setPushStatus] = useState("");
  const [sec,setSec]       = useState("inputs");
  const [cmsData,setCmsData] = useState(null);
  const [seoData,setSeoData] = useState(null);
  const [imgs,setImgs]     = useState([]);
  const [imgTags,setImgTags] = useState({});

  function toggleImgTag(idx,t) {
    setImgTags(p=>{ const c=p[idx]||[]; return {...p,[idx]:c.includes(t)?c.filter(x=>x!==t):[...c,t]}; });
  }

  async function generate() {
    if (!title) { setStatus("❌ Please enter a story title."); return; }
    setLoading(true); setCmsData(null); setSeoData(null); setImgs([]); setImgTags({}); setPushStatus("");
    const now = new Date().toISOString();
    const today = now.split("T")[0];
    try {
      // Step 1 — CMS
      setStatus("Step 1/3 — Filling CMS fields…");
      const cmsRaw = await callAI(
        `PTI CMS editor India. All CMS fields for: "${title}" | Category: ${cat} | Desk: ${desk} | Breaking: ${brk} | Developing: ${dev}
${body?"Body:\n"+body.substring(0,600):""}
Return ONLY valid JSON, no other text:
{"headline":"PTI wire headline active voice","strap":"subheading 1 sentence","blurb":"2-3 sentence blurb","summary":"2-sentence summary","desk_url":"url-slug","pti_slug":"PTI/${cat}/${today}/<slug>","tone":"neutral","word_count_target":"400-600","breaking":"${brk}","developing":"${dev}","priority":"High","disclaimer":"PTI disclaimer if needed","house_style_notes":"style notes","embargo":"none","tags":"tag1,tag2,tag3,tag4,tag5","keywords":"kw1,kw2,kw3,kw4,kw5","category":"${cat}","desk":"${desk}"}`
      );
      const cms = parseJSON(cmsRaw);
      setCmsData(cms);

      // Step 2 — SEO
      setStatus("Step 2/3 — Generating full SEO package…");
      const seoRaw = await callAI(
        `Senior SEO strategist Indian news PTI. Complete SEO package for:
Title: "${title}" | Category: ${cat} | Schema: ${schema} | Site: ${site} | Author: ${author}
${body?"Body:\n"+body.substring(0,500):""}
Return ONLY valid JSON, no other text:
{"seo_title":"under 60 chars with keyword","meta_description":"under 155 chars","canonical_url":"${baseUrl}/<slug>","og_title":"OG title","og_description":"OG description under 200 chars","og_image":"${baseUrl}/images/<slug>.jpg","twitter_title":"under 70 chars","twitter_description":"under 200 chars","primary_keyword":"best keyword","primary_keyword_density":"1.5%","secondary_keywords":[{"word":"kw","density":"0.8%"},{"word":"kw","density":"0.6%"},{"word":"kw","density":"0.5%"}],"lsi_keywords":["lsi1","lsi2","lsi3"],"long_tail":["phrase1","phrase2","phrase3"],"news_keywords":"kw1,kw2,kw3","schema_json":"{\"@context\":\"https://schema.org\",\"@type\":\"${schema}\",\"headline\":\"TITLE\",\"author\":{\"@type\":\"Organization\",\"name\":\"${author}\"},\"publisher\":{\"@type\":\"Organization\",\"name\":\"${site}\"},\"datePublished\":\"${now}\",\"articleSection\":\"${cat}\"}","headline_score":"8","readability_score":"7","seo_score":"8","keyword_placement":"Para 1: primary keyword; Subhead 1: secondary keyword","missing_keywords":"keywords to add to body","internal_link_anchors":"anchor1, anchor2, anchor3","improvement_tips":"3 specific actionable improvements"}`
      );
      const seo = parseJSON(seoRaw);
      setSeoData(seo);

      // Step 3 — Images
      setStatus("Step 3/3 — Generating PTI image briefs…");
      const imgData = await fetchImgs(title, 3, cat);
      setImgs(imgData);

      setSec("cms");
      setStatus("✅ Done — view CMS fields, SEO package, or Images using the tabs above.");
    } catch(e) { setStatus("❌ " + e.message); }
    setLoading(false);
  }

  async function pushToCMS() {
    if (!cmsApi) { setPushStatus("❌ Please enter your CMS API endpoint URL."); return; }
    setPushing(true); setPushStatus("Pushing to CMS…");
    try {
      const headers = { "Content-Type": "application/json" };
      if (cmsToken) headers["Authorization"] = cmsToken.startsWith("Bearer ") ? cmsToken : `Bearer ${cmsToken}`;
      const res = await fetch(cmsApi, {
        method: "POST", headers,
        body: JSON.stringify({ cms: cmsData, seo: seoData, images: imgs.map((img,i)=>({...img,selectedTags:imgTags[i]||[]})), meta: { generatedAt: new Date().toISOString() } })
      });
      if (!res.ok) { const t = await res.text(); throw new Error(`CMS returned ${res.status}: ${t.slice(0,100)}`); }
      const result = await res.json().catch(()=>({ok:true}));
      setPushStatus(`✅ Pushed to CMS!${result.id?" Article ID: "+result.id:""}`);
    } catch(e) { setPushStatus("❌ " + e.message); }
    setPushing(false);
  }

  const SNAV = [{id:"inputs",label:"Inputs"},{id:"cms",label:"CMS fields"},{id:"seo",label:"SEO package"},{id:"images",label:"Images"}];

  return (
    <div>
      <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:16 }}>
        {SNAV.map(s=>(
          <button key={s.id} onClick={()=>setSec(s.id)}
            style={{ fontSize:12,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${sec===s.id?"#1a56db":"#e5e7eb"}`,background:sec===s.id?"#eff6ff":"#fff",color:sec===s.id?"#1a56db":"#6b7280",cursor:"pointer",fontWeight:sec===s.id?700:400 }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* INPUTS */}
      {sec==="inputs" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ background:"#fffbeb",border:"1px solid #fde68a",borderRadius:9,padding:"10px 14px",fontSize:13,color:"#92400e",fontWeight:500 }}>
            One click → CMS fields · SEO title · Meta · OG · Twitter Card · Schema JSON-LD · Keywords · PTI images · CMS push
          </div>
          <div><Lbl c="Story title / headline"/><Inp value={title} onChange={e=>setTitle(e.target.value)} placeholder="Enter story headline…"/></div>
          <div><Lbl c="Story body (optional — paste for better accuracy)"/><Txt value={body} onChange={e=>setBody(e.target.value)} placeholder="Paste story body here…" rows={4}/></div>
          <Row>
            <div><Lbl c="Category"/><Sel value={cat} onChange={e=>setCat(e.target.value)} options={PTI_CATEGORIES}/></div>
            <div><Lbl c="PTI desk"/><Sel value={desk} onChange={e=>setDesk(e.target.value)} options={PTI_DESKS}/></div>
            <div><Lbl c="Schema type"/><Sel value={schema} onChange={e=>setSchema(e.target.value)} options={SCHEMA_TYPES}/></div>
            <div><Lbl c="Robots"/><Sel value={robots} onChange={e=>setRobots(e.target.value)} options={ROBOTS_OPTIONS}/></div>
            <div><Lbl c="Site name"/><Inp value={site} onChange={e=>setSite(e.target.value)} placeholder="PTI News"/></div>
            <div><Lbl c="Base URL"/><Inp value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} placeholder="https://www.ptinews.com"/></div>
            <div><Lbl c="Author"/><Inp value={author} onChange={e=>setAuthor(e.target.value)} placeholder="PTI"/></div>
            <div><Lbl c="Twitter handle"/><Inp value={tw} onChange={e=>setTw(e.target.value)} placeholder="@PTI_News"/></div>
          </Row>
          <div style={{ display:"flex",gap:20 }}>
            <label style={{ display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:14 }}>
              <input type="checkbox" checked={brk} onChange={e=>setBrk(e.target.checked)} style={{ width:16,height:16,accentColor:"#dc2626" }}/>
              <span style={{ fontWeight:600,color:brk?"#dc2626":"#374151" }}>🔴 Breaking news</span>
            </label>
            <label style={{ display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:14 }}>
              <input type="checkbox" checked={dev} onChange={e=>setDev(e.target.checked)} style={{ width:16,height:16,accentColor:"#d97706" }}/>
              <span style={{ fontWeight:600,color:dev?"#d97706":"#374151" }}>🟡 Developing story</span>
            </label>
          </div>
          <Divider label="CMS API endpoint (optional)"/>
          <div style={{ background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:9,padding:".85rem 1rem" }}>
            <div style={{ fontSize:12,color:"#6b7280",marginBottom:10 }}>After generating, push CMS fields + SEO package directly to your CMS via API.</div>
            <div style={{ marginBottom:8 }}><Lbl c="CMS API endpoint URL"/><Inp value={cmsApi} onChange={e=>setCmsApi(e.target.value)} placeholder="https://your-cms.com/api/articles/ingest"/></div>
            <div><Lbl c="API auth token"/><Inp value={cmsToken} onChange={e=>setCmsToken(e.target.value)} placeholder="Bearer eyJ…" type="password"/></div>
          </div>
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            <Btn onClick={generate} loading={loading}>✦ Generate full SEO + CMS package</Btn>
            {cmsData && cmsApi && <Btn onClick={pushToCMS} loading={pushing} color="#16a34a">⬆ Push to CMS API</Btn>}
          </div>
          <StatusBar msg={status}/>
          {pushStatus && <StatusBar msg={pushStatus}/>}
        </div>
      )}

      {/* CMS FIELDS */}
      {sec==="cms" && (
        <div>
          {cmsData ? <>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
              <span style={{ fontSize:14,fontWeight:600,color:"#111" }}>All CMS fields auto-filled</span>
              <button onClick={()=>navigator.clipboard.writeText(JSON.stringify(cmsData,null,2)).catch(()=>{})}
                style={{ fontSize:11,padding:"4px 12px",border:"1px solid #e5e7eb",borderRadius:6,background:"#fff",color:"#6b7280",cursor:"pointer" }}>Copy JSON</button>
            </div>
            <CMSGrid fields={cmsData}/>
          </> : <div style={{ color:"#9ca3af",fontSize:14,padding:"2rem",textAlign:"center" }}>Generate from the Inputs tab first.</div>}
        </div>
      )}

      {/* SEO PACKAGE */}
      {sec==="seo" && (
        <div>
          {seoData ? <>
            <Row cols={3}>
              <ScoreBadge label="SEO score" score={seoData.seo_score}/>
              <ScoreBadge label="Headline" score={seoData.headline_score}/>
              <ScoreBadge label="Readability" score={seoData.readability_score}/>
            </Row>
            <Divider label="Title & meta"/>
            {[
              ["SEO title", seoData.seo_title, (seoData.seo_title||"").length+"/60", (seoData.seo_title||"").length>60],
              ["Meta description", seoData.meta_description, (seoData.meta_description||"").length+"/155", (seoData.meta_description||"").length>155],
              ["Canonical URL", seoData.canonical_url, null, false],
            ].map(([lbl,val,cnt,over])=>(
              <div key={lbl} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <Lbl c={lbl}/>
                  {cnt && <span style={{ fontSize:11,color:over?"#dc2626":"#16a34a",fontWeight:600 }}>{cnt}</span>}
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  <Inp value={val||""} onChange={()=>{}} readOnly/>
                  <button onClick={()=>navigator.clipboard.writeText(val||"").catch(()=>{})}
                    style={{ fontSize:11,padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:8,background:"#fff",color:"#666",cursor:"pointer",whiteSpace:"nowrap" }}>Copy</button>
                </div>
              </div>
            ))}
            <Divider label="Open Graph tags"/>
            <MetaBlock
              value={`<meta property="og:title" content="${seoData.og_title||""}" />\n<meta property="og:description" content="${seoData.og_description||""}" />\n<meta property="og:image" content="${seoData.og_image||""}" />\n<meta property="og:type" content="article" />\n<meta property="og:url" content="${seoData.canonical_url||""}" />\n<meta property="og:site_name" content="${site}" />\n<meta property="og:locale" content="en_IN" />\n<meta property="article:author" content="${author}" />\n<meta property="article:section" content="${cat}" />`}
              onCopy={()=>navigator.clipboard.writeText(`<meta property="og:title" content="${seoData.og_title||""}" />\n<meta property="og:description" content="${seoData.og_description||""}" />`).catch(()=>{})}
            />
            <Divider label="Twitter Card tags"/>
            <MetaBlock
              value={`<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${seoData.twitter_title||""}" />\n<meta name="twitter:description" content="${seoData.twitter_description||""}" />\n<meta name="twitter:image" content="${seoData.og_image||""}" />\n<meta name="twitter:site" content="${tw}" />`}
              onCopy={()=>navigator.clipboard.writeText(`<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${seoData.twitter_title||""}" />`).catch(()=>{})}
            />
            <Divider label="Schema JSON-LD"/>
            <MetaBlock
              value={`<script type="application/ld+json">\n${seoData.schema_json||"{}"}\n</script>`}
              onCopy={()=>navigator.clipboard.writeText(`<script type="application/ld+json">\n${seoData.schema_json||"{}"}\n</script>`).catch(()=>{})}
            />
            <Divider label="Keywords"/>
            <div style={{ background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:9,padding:".85rem 1rem",marginBottom:10 }}>
              <div style={{ fontSize:10,fontWeight:700,color:"#1a56db",textTransform:"uppercase",letterSpacing:".05em",marginBottom:4 }}>Primary keyword</div>
              <div style={{ fontSize:15,fontWeight:700,color:"#111" }}>{seoData.primary_keyword} <span style={{ fontSize:12,color:"#6b7280",fontWeight:400 }}>— target: {seoData.primary_keyword_density}</span></div>
            </div>
            <div style={{ marginBottom:10 }}>
              <Lbl c="Secondary keywords"/>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {(seoData.secondary_keywords||[]).map((k,i)=>(
                  <div key={i} style={{ background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:8,padding:"4px 12px",fontSize:13 }}>
                    <strong>{k.word}</strong> <span style={{ color:"#9ca3af",fontSize:11 }}>{k.density}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:10 }}><Lbl c="LSI keywords"/><div style={{ fontSize:13,color:"#374151",lineHeight:1.8 }}>{(seoData.lsi_keywords||[]).join(" · ")}</div></div>
            <div style={{ marginBottom:10 }}><Lbl c="Long-tail keywords"/>{(seoData.long_tail||[]).map((k,i)=><div key={i} style={{ fontSize:13,color:"#374151",marginBottom:3 }}>→ {k}</div>)}</div>
            <div style={{ marginBottom:12 }}><Lbl c="Google News keywords"/><Inp value={seoData.news_keywords||""} onChange={()=>{}} readOnly/></div>
            <Divider label="Recommendations"/>
            {[["Keyword placement",seoData.keyword_placement],["Missing keywords",seoData.missing_keywords],["Internal link anchors",seoData.internal_link_anchors],["Improvement tips",seoData.improvement_tips]].map(([lbl,val])=>val?(
              <OutBox key={lbl} label={lbl} text={val} onCopy={()=>navigator.clipboard.writeText(val).catch(()=>{})}/>
            ):null)}
          </> : <div style={{ color:"#9ca3af",fontSize:14,padding:"2rem",textAlign:"center" }}>Generate from the Inputs tab first.</div>}
        </div>
      )}

      {/* IMAGES */}
      {sec==="images" && (
        <div>
          {imgs.length>0
            ? imgs.map((img,i)=><ImgCard key={i} img={img} idx={i} tags={imgTags[i]||[]} onTagToggle={toggleImgTag}/>)
            : <div style={{ color:"#9ca3af",fontSize:14,padding:"2rem",textAlign:"center" }}>Generate from the Inputs tab first.</div>}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// IDEATE TAB
// ══════════════════════════════════════════════════════════════════════════════
function IdeateTab() {
  const [topic,setTopic]=useState(""); const [cats,setCats]=useState([]); const [style,setStyle]=useState("neutral");
  const [loading,setLoading]=useState(false); const [ideas,setIdeas]=useState(""); const [imgs,setImgs]=useState([]);
  const [imgTags,setImgTags]=useState({}); const [status,setStatus]=useState("");
  function toggleImgTag(idx,t){setImgTags(p=>{const c=p[idx]||[];return{...p,[idx]:c.includes(t)?c.filter(x=>x!==t):[...c,t]};});}
  async function run() {
    if (!topic){setStatus("❌ Please enter a topic.");return;}
    setLoading(true);setStatus("Generating story ideas…");setIdeas("");setImgs([]);
    try{
      const out=await callAI(`Senior PTI news editor India. 6 story ideas for a ${style} Indian publication on: "${topic}".${cats.length?` Categories: ${cats.join(", ")}.`:""}
Each idea: 1) Headline (PTI wire style) 2) Category 3) Angle (1 sentence) 4) Key sources 5) News peg 6) Desk. Number clearly.`);
      setIdeas(out);setStatus("Generating PTI image briefs…");
      setImgs(await fetchImgs(topic,3,cats[0]||""));
      setStatus("✅ Done");
    }catch(e){setStatus("❌ "+e.message);}
    setLoading(false);
  }
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div><Lbl c="Topic / beat / keyword"/><Inp value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Indian economy, cricket, climate policy…"/></div>
      <div><Lbl c="Filter by category (optional)"/><div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>{PTI_CATEGORIES.map(c=><Pill key={c} label={c} on={cats.includes(c)} onClick={()=>setCats(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c])}/>)}</div></div>
      <div><Lbl c="House style"/><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>{["neutral","broadsheet","digital-first","tabloid"].map(s=><Pill key={s} label={s.charAt(0).toUpperCase()+s.slice(1)} on={style===s} onClick={()=>setStyle(s)}/>)}</div></div>
      <Btn onClick={run} loading={loading}>✦ Generate ideas + PTI visuals</Btn>
      {ideas&&<OutBox label="Story ideas" text={ideas} onCopy={()=>navigator.clipboard.writeText(ideas).catch(()=>{})}/>}
      {imgs.length>0&&<><Divider label="PTI image briefs"/>{imgs.map((img,i)=><ImgCard key={i} img={img} idx={i} tags={imgTags[i]||[]} onTagToggle={toggleImgTag}/>)}</>}
      <StatusBar msg={status}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WRITE TAB
// ══════════════════════════════════════════════════════════════════════════════
function WriteTab({prefillTitle=""}) {
  const [title,setTitle]=useState(prefillTitle);const [draft,setDraft]=useState("");
  const [mode,setMode]=useState("full");const [style,setStyle]=useState("neutral");
  const [cat,setCat]=useState("National");const [desk,setDesk]=useState("National Desk");
  const [loading,setLoading]=useState(false);const [output,setOutput]=useState("");
  const [imgs,setImgs]=useState([]);const [imgTags,setImgTags]=useState({});const [status,setStatus]=useState("");
  function toggleImgTag(idx,t){setImgTags(p=>{const c=p[idx]||[];return{...p,[idx]:c.includes(t)?c.filter(x=>x!==t):[...c,t]};});}
  const modeMap={full:"Complete PTI wire story: 2-sentence summary box, headline, strap, body ~500 words inverted pyramid",intro:"Intro paragraph: who-what-when-where-why PTI style",para:"4-5 body paragraphs with subheadings",edit:"Edit for clarity, grammar, PTI house style",summary:"2-3 sentence summary for top of CMS",translate:"Translate into clean Indian English PTI wire style"};
  async function run(){
    if(!title){setStatus("❌ Please enter a story title.");return;}
    setLoading(true);setStatus("Writing PTI-style content…");setOutput("");setImgs([]);
    try{
      const out=await callAI(`Senior PTI journalist. ${style} Indian English. Category: ${cat} | Desk: ${desk}
Story: "${title}"${draft?"\nDraft:\n"+draft:""}
Task: ${modeMap[mode]}
PTI rules: inverted pyramid, active voice, attribute all claims, no opinion, mark unverified [UNCONFIRMED], include summary at top.`);
      setOutput(out);setStatus("Generating image briefs…");
      setImgs(await fetchImgs(title,3,cat));
      setStatus("✅ Done");
    }catch(e){setStatus("❌ "+e.message);}
    setLoading(false);
  }
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div><Lbl c="Story title / brief"/><Inp value={title} onChange={e=>setTitle(e.target.value)} placeholder="Enter headline or brief description"/></div>
      <div><Lbl c="Existing draft / notes (optional)"/><Txt value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Paste draft, bullet points, or raw notes…" rows={4}/></div>
      <Row>
        <div><Lbl c="Mode"/><Sel value={mode} onChange={e=>setMode(e.target.value)} options={[{value:"full",label:"Full story"},{value:"intro",label:"Intro only"},{value:"para",label:"Para by para"},{value:"edit",label:"Edit / improve"},{value:"summary",label:"Summary at top"},{value:"translate",label:"Translate"}]}/></div>
        <div><Lbl c="House style"/><Sel value={style} onChange={e=>setStyle(e.target.value)} options={[{value:"neutral",label:"Neutral / wire"},{value:"broadsheet",label:"Broadsheet"},{value:"digital",label:"Digital-first"},{value:"tabloid",label:"Tabloid"}]}/></div>
        <div><Lbl c="Category"/><Sel value={cat} onChange={e=>setCat(e.target.value)} options={PTI_CATEGORIES}/></div>
        <div><Lbl c="Desk"/><Sel value={desk} onChange={e=>setDesk(e.target.value)} options={PTI_DESKS}/></div>
      </Row>
      <Btn onClick={run} loading={loading}>✦ Generate content + PTI images</Btn>
      {output&&<OutBox label="Generated content" text={output} onCopy={()=>navigator.clipboard.writeText(output).catch(()=>{})}/>}
      {imgs.length>0&&<><Divider label="PTI image briefs"/>{imgs.map((img,i)=><ImgCard key={i} img={img} idx={i} tags={imgTags[i]||[]} onTagToggle={toggleImgTag}/>)}</>}
      <StatusBar msg={status}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MEDIA TAB
// ══════════════════════════════════════════════════════════════════════════════
function MediaTab() {
  const [body,setBody]=useState("");const [cat,setCat]=useState("National");
  const [loading,setLoading]=useState(false);const [output,setOutput]=useState("");const [status,setStatus]=useState("");
  async function run(){
    if(!body){setStatus("❌ Please paste story text.");return;}
    setLoading(true);setStatus("Analysing…");setOutput("");
    try{
      const out=await callAI(`PTI digital news editor India. Category: ${cat}. Analyse this story and provide:
1. PHOTO SUGGESTIONS (3): PTI search terms, alt text, PTI dateline caption for each
2. CROSSLINKS (3): Internal PTI crosslink anchor texts
3. HYPERLINKS (3): External link anchors with target descriptions
4. DISCLAIMER: Required PTI sourcing disclaimer
5. DEVELOPING FLAG: Should this be marked developing? Why?
6. PHOTO CREDITS: PTI/ANI/Reuters/AFP/AP suggestions
7. RELATED MEDIA: Video, infographic, interactive suggestions
Story:\n${body}`);
      setOutput(out);setStatus("✅ Done");
    }catch(e){setStatus("❌ "+e.message);}
    setLoading(false);
  }
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{maxWidth:240}}><Lbl c="Category"/><Sel value={cat} onChange={e=>setCat(e.target.value)} options={PTI_CATEGORIES}/></div>
      <div><Lbl c="Story text"/><Txt value={body} onChange={e=>setBody(e.target.value)} placeholder="Paste your story here…" rows={6}/></div>
      <Btn onClick={run} loading={loading}>✦ Suggest media, crosslinks & disclaimers</Btn>
      {output&&<OutBox label="Media & link suggestions" text={output} onCopy={()=>navigator.clipboard.writeText(output).catch(()=>{})}/>}
      <StatusBar msg={status}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FOLLOW-UPS TAB
// ══════════════════════════════════════════════════════════════════════════════
function FollowTab({onWrite}) {
  const [body,setBody]=useState("");const [cat,setCat]=useState("National");
  const [loading,setLoading]=useState(false);const [ideas,setIdeas]=useState([]);const [status,setStatus]=useState("");
  const TC={immediate:{bg:"#fef2f2",c:"#b91c1c"},"48hrs":{bg:"#fffbeb",c:"#92400e"},weekly:{bg:"#eff6ff",c:"#1e40af"}};
  async function run(){
    if(!body){setStatus("❌ Please enter the published story.");return;}
    setLoading(true);setStatus("Generating follow-up ideas…");setIdeas([]);
    try{
      const out=await callAI(`Senior PTI editor India. 6 follow-up story ideas for this published story. Category: ${cat}.
Return ONLY a JSON array, no other text:
[{"headline":"PTI wire headline","angle":"one sentence angle","timing":"immediate|48hrs|weekly","category":"PTI category","desk":"PTI desk","image_angle":"brief photo direction"}]
Story: ${body}`);
      setIdeas(parseJSON(out));setStatus("Click any idea to write it →");
    }catch(e){setStatus("❌ "+e.message);}
    setLoading(false);
  }
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{maxWidth:240}}><Lbl c="Category"/><Sel value={cat} onChange={e=>setCat(e.target.value)} options={PTI_CATEGORIES}/></div>
      <div><Lbl c="Published story headline / summary"/><Txt value={body} onChange={e=>setBody(e.target.value)} placeholder="Paste the published story headline or brief…" rows={4}/></div>
      <Btn onClick={run} loading={loading}>✦ Generate follow-up ideas</Btn>
      {ideas.map((idea,i)=>{const tc=TC[idea.timing]||TC.weekly;return(
        <div key={i} onClick={()=>onWrite(idea)} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:".85rem 1.1rem",cursor:"pointer",transition:"border-color .15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor="#1a56db"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e7eb"}>
          <div style={{fontWeight:600,fontSize:14,color:"#111",marginBottom:4}}>{i+1}. {idea.headline}</div>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:8}}>{idea.angle}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:11,padding:"2px 9px",borderRadius:20,background:tc.bg,color:tc.c,fontWeight:600}}>{idea.timing}</span>
            {idea.category&&<span style={{fontSize:11,padding:"2px 9px",borderRadius:20,background:"#f3f4f6",color:"#374151",fontWeight:500}}>{idea.category}</span>}
            {idea.image_angle&&<span style={{fontSize:11,color:"#9ca3af"}}>📷 {idea.image_angle}</span>}
          </div>
        </div>);})}
      <StatusBar msg={status}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ══════════════════════════════════════════════════════════════════════════════
function LandingPage({onStart}) {
  const feats=[
    {icon:"🔍",t:"Full SEO package",d:"Title, meta, OG, Twitter Card, Schema JSON-LD, keywords, LSI, long-tail, Google News keywords — one click."},
    {icon:"📋",t:"All CMS fields",d:"Headline, strap, blurb, SEO, keywords, tags, desk URL, PTI slug, breaking/developing flags — auto-filled."},
    {icon:"📷",t:"PTI image briefs",d:"AI prompts, PTI photo search terms, dateline captions, alt text and image tags for every story."},
    {icon:"🏷️",t:"Categories & tags",d:"23 PTI categories, 10 desks, full image tag picker (File Photo, PTI Photo, Breaking News, etc.)."},
    {icon:"⬆",t:"CMS API push",d:"Push generated CMS fields + SEO package directly to your CMS via a REST API endpoint."},
    {icon:"💡",t:"Follow-up ideas",d:"6 follow-up angles with timing, category, desk and photo direction per story."},
  ];
  return(
    <div style={{minHeight:"100vh",background:"#f9fafb",fontFamily:"system-ui,sans-serif"}}>
      <nav style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"0 2rem",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontWeight:800,fontSize:17,color:"#111"}}>AI Newsroom <span style={{fontWeight:400,color:"#6b7280",fontSize:13}}>PTI</span></div>
        <button onClick={onStart} style={{fontSize:13,padding:"8px 20px",background:"#1a56db",color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontWeight:600}}>Get started →</button>
      </nav>
      <div style={{maxWidth:700,margin:"0 auto",padding:"5rem 2rem 3rem",textAlign:"center"}}>
        <div style={{display:"inline-block",background:"#eff6ff",color:"#1a56db",fontSize:12,fontWeight:700,padding:"4px 14px",borderRadius:20,marginBottom:24,letterSpacing:".04em"}}>POWERED BY GEMINI AI</div>
        <h1 style={{fontSize:38,fontWeight:800,color:"#111",lineHeight:1.15,marginBottom:20}}>Full SEO + CMS package — one click</h1>
        <p style={{fontSize:16,color:"#6b7280",lineHeight:1.75,maxWidth:540,margin:"0 auto 36px"}}>Enter your free Gemini API key once. Type a headline. Get the complete PTI-style article — every meta tag, OG, Twitter Card, Schema JSON-LD, PTI image briefs, push to CMS.</p>
        <button onClick={onStart} style={{fontSize:15,padding:"13px 34px",background:"#1a56db",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700}}>Get started →</button>
      </div>
      <div style={{maxWidth:820,margin:"0 auto",padding:"0 2rem 5rem",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        {feats.map((f,i)=>(
          <div key={i} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"1.25rem"}}>
            <div style={{fontSize:26,marginBottom:10}}>{f.icon}</div>
            <div style={{fontWeight:700,fontSize:14,color:"#111",marginBottom:6}}>{f.t}</div>
            <div style={{fontSize:13,color:"#6b7280",lineHeight:1.65}}>{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const savedKey = loadKey();
  const [page,setPage] = useState(savedKey ? "editor" : "landing");
  const [tab,setTab]   = useState("seocms");
  const [writeTitle,setWriteTitle] = useState("");

  const TABS = [
    {id:"seocms", label:"🔍 SEO + CMS"},
    {id:"ideate", label:"Story ideas"},
    {id:"write",  label:"Write & edit"},
    {id:"media",  label:"Media & links"},
    {id:"follow", label:"Follow-ups"},
  ];

  function handleWrite(idea) { setWriteTitle(idea.headline); setTab("write"); }

  if (page==="landing") return <LandingPage onStart={()=>setPage("setup")}/>;
  if (page==="setup")   return <SetupScreen onSave={()=>setPage("editor")}/>;

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb",fontFamily:"system-ui,sans-serif"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>
      <nav style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"0 1.5rem",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
        <div style={{fontWeight:800,fontSize:15,color:"#111"}}>AI Newsroom <span style={{fontWeight:400,color:"#9ca3af",fontSize:12}}>PTI</span></div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:"#16a34a",display:"inline-block"}}/>
          <span style={{fontSize:12,color:"#6b7280"}}>Gemini AI connected</span>
          <button onClick={()=>setPage("setup")} style={{fontSize:11,padding:"4px 10px",border:"1px solid #e5e7eb",borderRadius:6,background:"#fff",color:"#6b7280",cursor:"pointer",marginLeft:4}}>Change key</button>
        </div>
      </nav>
      <div style={{maxWidth:960,margin:"0 auto",padding:"1.5rem 1rem 3rem"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{fontSize:13,padding:"7px 15px",borderRadius:20,border:`1.5px solid ${tab===t.id?"#1a56db":"#e5e7eb"}`,background:tab===t.id?"#1a56db":"#fff",color:tab===t.id?"#fff":"#6b7280",cursor:"pointer",fontWeight:tab===t.id?600:400,transition:"all .12s"}}>
              {t.label}
            </button>
          ))}
        </div>
        <Card>
          {tab==="seocms" && <SEOCMSTab/>}
          {tab==="ideate" && <IdeateTab/>}
          {tab==="write"  && <WriteTab prefillTitle={writeTitle} key={writeTitle+tab}/>}
          {tab==="media"  && <MediaTab/>}
          {tab==="follow" && <FollowTab onWrite={handleWrite}/>}
        </Card>
      </div>
    </div>
  );
}
