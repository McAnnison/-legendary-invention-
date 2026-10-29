
import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

const GENRES = [
  { name:"Lo-fi",      icon:"🎧", color:"#6C63FF", desc:"Chill & focused",    stability:0.75, style:0.20 },
  { name:"Hip-Hop",    icon:"🎤", color:"#FF6B6B", desc:"Energetic & catchy", stability:0.45, style:0.70 },
  { name:"Pop",        icon:"🌟", color:"#FFD93D", desc:"Fun & upbeat",        stability:0.55, style:0.65 },
  { name:"Classical",  icon:"🎻", color:"#4ECDC4", desc:"Elegant & deep",      stability:0.85, style:0.10 },
  { name:"Jazz",       icon:"🎺", color:"#F7931E", desc:"Smooth & fluid",      stability:0.60, style:0.45 },
  { name:"Afrobeats",  icon:"🥁", color:"#06D6A0", desc:"Vibrant & rhythmic",  stability:0.50, style:0.75 },
  { name:"R&B",        icon:"🎵", color:"#EF476F", desc:"Soulful & emotional", stability:0.55, style:0.60 },
  { name:"Electronic", icon:"🎛️", color:"#118AB2", desc:"Modern & immersive",  stability:0.40, style:0.80 },
];

const VOICE_IDS = {
  "Lo-fi":"pNInz6obpgDQGcFmaJgB","Hip-Hop":"TxGEqnHWrfWFTfGW9XjX",
  "Pop":"EXAVITQu4vr4xnSDxMaL","Classical":"onwK4e9ZLuTAKqWW03F9",
  "Jazz":"VR6AewLTigWG4xSOukaG","Afrobeats":"pqHfZKP75CvOlQylNhV4",
  "R&B":"EXAVITQu4vr4xnSDxMaL","Electronic":"TxGEqnHWrfWFTfGW9XjX",
};

const BEATS = {
  "Lo-fi":      {bpm:75,  wave:"triangle",bass:"C2",chord:["C3","E3","G3"],  arp:["C4","E4","G4","A4"],     pat:[1,0,0,0,1,0,1,0]},
  "Hip-Hop":    {bpm:90,  wave:"sawtooth",bass:"C2",chord:["C3","G3"],       arp:["C4","D4","F4","G4"],     pat:[1,0,1,0,0,1,0,1]},
  "Pop":        {bpm:118, wave:"sine",    bass:"C2",chord:["C4","E4","G4"],  arp:["C5","E5","G5","A5"],     pat:[1,1,0,1,1,0,1,0]},
  "Classical":  {bpm:66,  wave:"sine",    bass:"C2",chord:["C3","E3","G3"],  arp:["C4","D4","E4","G4","A4"],pat:[1,0,0,0,0,0,1,0]},
  "Jazz":       {bpm:80,  wave:"triangle",bass:"C2",chord:["C3","Eb3","Bb3"],arp:["C4","Eb4","G4","Bb4"],   pat:[1,0,1,1,0,0,1,0]},
  "Afrobeats":  {bpm:104, wave:"sine",    bass:"C2",chord:["C3","F3","G3"],  arp:["C4","D4","F4","G4","A4"],pat:[1,1,0,1,0,1,1,0]},
  "R&B":        {bpm:85,  wave:"triangle",bass:"C2",chord:["C3","Eb3","G3"], arp:["C4","Eb4","G4","Bb4"],   pat:[1,0,0,1,0,0,1,0]},
  "Electronic": {bpm:128, wave:"sawtooth",bass:"C1",chord:["C3","G3"],       arp:["C4","C5","G4","C5"],     pat:[1,0,1,0,1,0,1,0]},
};

const STEPS = ["Scanning content…","Extracting concepts…","Crafting lyrics…","Composing melody…","Generating vocals…"];
const FLOATS = ["♪","♫","♩","♬","🎵","🎶"];

function injectCSS() {
  if (document.getElementById("sb-css")) return;
  const s = document.createElement("style");
  s.id = "sb-css";
  s.textContent =
    "@keyframes floatUp{0%{transform:translateY(0) rotate(0);opacity:.13}50%{opacity:.22}100%{transform:translateY(-100px) rotate(15deg);opacity:0}}" +
    "@keyframes spin{to{transform:rotate(360deg)}}" +
    "@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}" +
    "@keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}" +
    "@keyframes bar{0%,100%{height:18%}50%{height:90%}}" +
    "*{box-sizing:border-box;margin:0;padding:0}" +
    "textarea,button,input{font-family:inherit;outline:none}" +
    "textarea{resize:vertical}" +
    "::-webkit-scrollbar{width:5px}" +
    "::-webkit-scrollbar-track{background:#1a1a2e}" +
    "::-webkit-scrollbar-thumb{background:#6C63FF;border-radius:4px}";
  document.head.appendChild(s);
}

const toB64 = (f) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result.split(",")[1]);
  r.onerror = rej;
  r.readAsDataURL(f);
});

async function loadJSZip() {
  if (window.JSZip) return window.JSZip;
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    s.onload = () => res(window.JSZip);
    s.onerror = () => rej(new Error("JSZip failed"));
    document.head.appendChild(s);
  });
}

async function extractPPTX(file) {
  const JSZip = await loadJSZip();
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const keys = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
    .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
  if (!keys.length) throw new Error("No slides found");
  let out = "";
  for (const k of keys) {
    const xml = await zip.files[k].async("string");
    const hits = (xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [])
      .map(m => m.replace(/<[^>]*>/g, "").trim()).filter(Boolean);
    if (hits.length) out += hits.join(" ") + "\n";
  }
  if (!out.trim()) throw new Error("No text in slides");
  return out.trim();
}

async function callClaude(messages, maxTokens) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens || 1400,
      messages: messages,
    }),
  });
  if (!r.ok) throw new Error("Claude API " + r.status);
  return r.json();
}

async function generateVoiceAudio(lyrics, genre, apiKey) {
  const voiceId = VOICE_IDS[genre.name] || "JBFqnCBsd6RMkjVDRZzb";
  const text = lyrics.split("\n").filter(function(l) {
    return l.trim() && !l.startsWith("[");
  }).join(" ... ");

  const elevenUrl = "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId;
  const reqBody = JSON.stringify({
    text: text,
    model_id: "eleven_multilingual_v2",
    output_format: "mp3_44100_128",
    voice_settings: {
      stability: genre.stability,
      similarity_boost: 0.80,
      style: genre.style,
      use_speaker_boost: true,
    },
  });

  const proxies = [
    "https://corsproxy.io/?url=" + encodeURIComponent(elevenUrl),
    "https://api.cors.lol/?url=" + encodeURIComponent(elevenUrl),
    "https://proxy.corsfix.com/?" + encodeURIComponent(elevenUrl),
  ];

  let lastErr = "Unknown error";
  for (let i = 0; i < proxies.length; i++) {
    try {
      const res = await fetch(proxies[i], {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
          "x-requested-with": "XMLHttpRequest",
        },
        body: reqBody,
      });
      if (!res.ok) {
        const msg = await res.text();
        lastErr = "HTTP " + res.status + ": " + msg.slice(0, 100);
        continue;
      }
      const blob = await res.blob();
      if (blob.size < 1000) {
        lastErr = "Response too small (" + blob.size + "b) — proxy may have blocked request";
        continue;
      }
      return URL.createObjectURL(blob);
    } catch (e) {
      lastErr = e.message;
    }
  }
  throw new Error("All proxies failed. " + lastErr);
}

function FloatNote(props) {
  return React.createElement("div", {
    style: {
      position: "absolute", left: props.x + "%", top: props.top + "%",
      fontSize: props.sz, opacity: 0.13, color: "#fff", pointerEvents: "none",
      animation: "floatUp 8s ease-in-out infinite",
      animationDelay: props.delay + "s",
    }
  }, props.ch);
}

function Bars(props) {
  const [hs, setHs] = useState(Array(24).fill(18));
  useEffect(function() {
    if (!props.on) { setHs(Array(24).fill(18)); return; }
    const id = setInterval(function() {
      setHs(Array(24).fill(0).map(function() { return Math.random() * 72 + 18; }));
    }, 160);
    return function() { clearInterval(id); };
  }, [props.on]);
  return React.createElement("div", { style: { display:"flex", alignItems:"center", gap:3, height:44 } },
    hs.map(function(h, i) {
      return React.createElement("div", {
        key: i,
        style: { width:4, borderRadius:4, background:props.color, opacity:.88, height:h+"%", transition:"height .15s" }
      });
    })
  );
}

export default function StudyBeat() {
  const [page,     setPage]     = useState("home");
  const [rawText,  setRawText]  = useState("");
  const [fileName, setFileName] = useState("");
  const [scanMsg,  setScanMsg]  = useState("");
  const [genre,    setGenre]    = useState(null);
  const [stepIdx,  setStepIdx]  = useState(0);
  const [pct,      setPct]      = useState(0);
  const [lyrics,   setLyrics]   = useState("");
  const [title,    setTitle]    = useState("");
  const [library,  setLibrary]  = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [curLine,  setCurLine]  = useState(-1);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [errMsg,   setErrMsg]   = useState("");
  const [genLog,   setGenLog]   = useState("");
  const [apiKey,   setApiKey]   = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [genAudio, setGenAudio] = useState(false);

  const fileRef   = useRef();
  const timerRef  = useRef();
  const nodesRef  = useRef({});
  const lyricsRef = useRef("");
  const genreRef  = useRef(null);
  const audioRef  = useRef(null);

  useEffect(function() {
    injectCSS();
    window.storage.get("sb-v8").then(function(r) {
      if (r && r.value) {
        try {
          const d = JSON.parse(r.value);
          setLibrary(d.lib || []);
          if (d.key) setApiKey(d.key);
        } catch(e) {}
      }
    }).catch(function() {});
  }, []);

  useEffect(function() { lyricsRef.current = lyrics; }, [lyrics]);
  useEffect(function() { genreRef.current  = genre;  }, [genre]);

  function persist(lib, key) {
    window.storage.set("sb-v8", JSON.stringify({ lib: lib, key: key })).catch(function() {});
  }

  async function handleFile(file) {
    if (!file) return;
    setFileName(file.name); setErrMsg(""); setRawText(""); setScanMsg("");
    const ext = file.name.split(".").pop().toLowerCase();
    setScanMsg("Reading " + ext.toUpperCase() + "…");
    try {
      if (ext === "txt") {
        const t = await file.text();
        setRawText(t); setScanMsg("✅ " + t.trim().split(/\s+/).length + " words loaded");
      } else if (ext === "docx") {
        const buf = await file.arrayBuffer();
        let val = "";
        try {
          const m = await import("mammoth");
          val = ((await (m.default || m).extractRawText({ arrayBuffer: buf })).value) || "";
        } catch(e) { val = await file.text(); }
        setRawText(val); setScanMsg("✅ " + val.trim().split(/\s+/).length + " words from DOCX");
      } else if (ext === "pdf") {
        setScanMsg("🔍 Scanning PDF with AI…");
        const b64 = await toB64(file);
        const data = await callClaude([{ role:"user", content:[
          { type:"document", source:{ type:"base64", media_type:"application/pdf", data:b64 } },
          { type:"text", text:"Extract all readable text. Return plain text only." }
        ]}], 1000);
        const t = (data.content || []).map(function(c) { return c.text || ""; }).join("");
        setRawText(t); setScanMsg("✅ " + t.trim().split(/\s+/).length + " words from PDF");
      } else if (ext === "pptx") {
        setScanMsg("🔍 Parsing PPTX slides…");
        const t = await extractPPTX(file);
        setRawText(t); setScanMsg("✅ " + t.trim().split(/\s+/).length + " words from slides");
      } else {
        const t = await file.text();
        setRawText(t); setScanMsg("✅ Loaded");
      }
    } catch(e) {
      setScanMsg("⚠️ File read failed — paste notes below"); setErrMsg(e.message);
    }
  }

  function startProcessing() {
    if (!rawText.trim() || !genre) return;
    setPage("processing"); setStepIdx(0); setPct(0); setErrMsg(""); setGenLog("Starting…"); setAudioUrl("");
    let p = 0, s = 0;
    timerRef.current = setInterval(function() {
      p = Math.min(p + 1.1, 97); setPct(p);
      if (p > s * 20 && s < STEPS.length - 1) { s++; setStepIdx(s); }
    }, 80);
    doGenerate();
  }

  async function doGenerate() {
    try {
      setGenLog("Generating lyrics…");
      const data = await callClaude([{ role:"user", content:
        "Convert these study notes into a " + genre.name + " song.\n" +
        "RULES:\n- Every lyric line MUST reference a specific fact/concept from the notes\n" +
        "- No generic filler lines\n- Rhyme naturally, sound like authentic " + genre.name + "\n" +
        "- Use [Verse 1] [Chorus] [Verse 2] [Bridge] [Outro] as section labels on their own lines\n\n" +
        "NOTES:\n" + rawText.slice(0, 2800) + "\n\n" +
        "Reply ONLY with raw JSON (no markdown):\n" +
        "{\"title\":\"song title\",\"lyrics\":\"full lyrics\",\"hook\":\"best chorus line\"}"
      }], 1400);
      const raw = (data.content || []).map(function(c) { return c.text || ""; }).join("");
      const clean = raw.replace(/^```[\w]*\s*/, "").replace(/\s*```$/, "").trim();
      let parsed;
      try { parsed = JSON.parse(clean); }
      catch(e) { const m = clean.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); else throw new Error("Bad JSON"); }
      if (!parsed.lyrics) throw new Error("No lyrics returned");

      clearInterval(timerRef.current); setPct(100);
      setLyrics(parsed.lyrics); setTitle(parsed.title || "Study Song");

      let vocalUrl = "";
      if (apiKey.trim()) {
        setGenLog("🎤 Generating AI vocals…"); setGenAudio(true);
        try {
          vocalUrl = await generateVoiceAudio(parsed.lyrics, genre, apiKey.trim());
          setAudioUrl(vocalUrl); setGenLog("✅ Vocals ready!");
        } catch(e) {
          setGenLog("⚠️ Vocals failed — music only. " + e.message);
        }
        setGenAudio(false);
      }

      const song = {
        title: parsed.title || "Study Song", genre: genre.name,
        icon: genre.icon, color: genre.color, lyrics: parsed.lyrics,
        hook: parsed.hook || "", audioUrl: vocalUrl, date: new Date().toLocaleDateString(),
      };
      const lib = [song].concat(library).slice(0, 20);
      setLibrary(lib); persist(lib, apiKey);
      setTimeout(function() { setPage("player"); }, 350);
    } catch(e) {
      clearInterval(timerRef.current);
      setErrMsg("Failed: " + e.message); setGenLog(""); setPage("upload");
    }
  }

  const stopAudio = useCallback(function() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    try { Tone.Transport.stop(); Tone.Transport.cancel(0); } catch(e) {}
    const n = nodesRef.current;
    ["mel","chord","bass","rev","vol"].forEach(function(k) { try { if (n[k]) n[k].dispose(); } catch(e) {} });
    nodesRef.current = {};
    setPlaying(false); setCurLine(-1); setProgress(0);
  }, []);

  const startAudio = useCallback(async function() {
    const g = genreRef.current;
    const lyr = lyricsRef.current;
    if (!g || !lyr) return;
    await Tone.start();
    stopAudio();
    await new Promise(function(r) { setTimeout(r, 100); });

    const cfg = BEATS[g.name] || BEATS["Lo-fi"];
    Tone.Transport.bpm.value = cfg.bpm;
    Tone.Transport.cancel(0);

    const vol   = new Tone.Volume(-4).toDestination();
    const rev   = new Tone.Reverb({ decay:2, wet:0.25 }).toDestination();
    const bass  = new Tone.Synth({ oscillator:{type:"sine"}, envelope:{attack:.04,decay:.2,sustain:.1,release:.4}, volume:-16 }).connect(vol);
    const chord = new Tone.PolySynth(Tone.Synth, { oscillator:{type:cfg.wave}, envelope:{attack:.08,decay:.2,sustain:.5,release:.8}, volume:-22 }).connect(rev);
    const mel   = new Tone.Synth({ oscillator:{type:"sine"}, envelope:{attack:.06,decay:.08,sustain:.82,release:.6}, volume:-13 }).connect(rev);
    nodesRef.current = { bass:bass, chord:chord, mel:mel, rev:rev, vol:vol };

    let beatIdx = 0;
    Tone.Transport.scheduleRepeat(function(time) {
      const step = beatIdx % cfg.pat.length;
      if (cfg.pat[step]) {
        bass.triggerAttackRelease(cfg.bass, "16n", time);
        if (step % 2 === 0) chord.triggerAttackRelease(cfg.chord, "8n", time);
      }
      beatIdx++;
    }, "8n");

    const spb = 60 / cfg.bpm;
    const lines = lyr.split("\n").filter(function(l) { return l.trim() && !l.startsWith("["); });
    const total = lines.length;
    const spl = spb * 4;

    lines.forEach(function(_, i) {
      const t = i * spl;
      cfg.arp.forEach(function(note, j) {
        Tone.Transport.schedule(function(time) {
          mel.triggerAttackRelease(note, "4n", time);
        }, "+" + (t + j * spb));
      });
      Tone.Transport.schedule(function() {
        setCurLine(i); setProgress(i / Math.max(1, total - 1));
      }, "+" + t);
    });

    Tone.Transport.schedule(function() {
      setPlaying(false); setCurLine(-1);
    }, "+" + (total * spl + spb));

    Tone.Transport.start("+0.1");

    const currentAudioUrl = audioUrl;
    if (currentAudioUrl) {
      const audio = new Audio(currentAudioUrl);
      audio.volume = 1.0;
      audioRef.current = audio;
      audio.play().catch(function() {});
      audio.addEventListener("timeupdate", function() {
        if (audio.duration) setProgress(audio.currentTime / audio.duration);
      });
      audio.addEventListener("ended", function() { setPlaying(false); setCurLine(-1); });
    }

    setPlaying(true);
  }, [stopAudio, audioUrl]);

  function togglePlay() { if (playing) stopAudio(); else startAudio(); }

  const BG  = "linear-gradient(135deg,#0f0c29 0%,#1a1a3e 50%,#0f0c29 100%)";
  const acc = genre ? genre.color : "#6C63FF";
  const box = { minHeight:"100vh", background:BG, color:"#fff", fontFamily:"'Segoe UI',sans-serif", padding:"26px 22px" };
  const ghost = { background:"none", border:"none", color:"rgba(255,255,255,.7)", fontSize:14, padding:0, cursor:"pointer" };

  // HOME
  if (page === "home") {
    return (
      <div style={Object.assign({}, box, { position:"relative", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" })}>
        {FLOATS.flatMap(function(ch, ci) {
          return [0,1,2].map(function(j) {
            const i = ci * 3 + j;
            return <FloatNote key={i} x={i*5+3} top={i*4+5} delay={i*0.45} sz={i%3===0?28:18} ch={ch} />;
          });
        })}
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:58, marginBottom:8 }}>🎵</div>
          <h1 style={{ fontSize:"clamp(2.3rem,6vw,3.8rem)", fontWeight:900, background:"linear-gradient(135deg,#6C63FF,#FF6B6B,#FFD93D)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:12 }}>StudyBeat</h1>
          <p style={{ fontSize:"clamp(.92rem,2.5vw,1.2rem)", opacity:.82, maxWidth:480, marginBottom:10 }}>Upload notes or slides. Pick a genre. AI generates real vocals + music.</p>
          <p style={{ opacity:.42, marginBottom:36, fontSize:13 }}>Claude AI lyrics • ElevenLabs vocals • Tone.js beats</p>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", justifyContent:"center", marginBottom:40 }}>
            {GENRES.slice(0,5).map(function(g) {
              return <span key={g.name} style={{ background:g.color+"22", border:"1px solid "+g.color+"44", borderRadius:20, padding:"5px 13px", fontSize:12, color:g.color }}>{g.icon} {g.name}</span>;
            })}
            <span style={{ background:"#fff1", border:"1px solid #fff2", borderRadius:20, padding:"5px 13px", fontSize:12, color:"#fff6" }}>+3 more</span>
          </div>
          <button onClick={function() { setPage("upload"); }} style={{ background:"linear-gradient(135deg,#6C63FF,#FF6B6B)", border:"none", borderRadius:50, padding:"16px 46px", fontSize:17, fontWeight:700, color:"#fff", cursor:"pointer", animation:"pulse 2s ease-in-out infinite", boxShadow:"0 0 36px #6C63FF55" }}>Get Started ✨</button>
          {library.length > 0 && (
            <button onClick={function() { setPage("library"); }} style={Object.assign({}, ghost, { marginTop:16, display:"block", border:"1px solid rgba(255,255,255,.25)", borderRadius:50, padding:"10px 26px", fontSize:13 })}>🎧 My Library ({library.length})</button>
          )}
        </div>
      </div>
    );
  }

  // UPLOAD
  if (page === "upload") {
    return (
      <div style={box}>
        <button onClick={function() { setPage("home"); }} style={ghost}>← Back</button>
        <div style={{ maxWidth:660, margin:"20px auto 0", animation:"slideIn .4s ease" }}>
          <h2 style={{ fontSize:27, fontWeight:800, marginBottom:6 }}>Upload Study Material</h2>
          <p style={{ opacity:.6, marginBottom:24, fontSize:14 }}>PDF, DOCX, PPTX, TXT — or paste notes below.</p>
          <div
            onDragOver={function(e) { e.preventDefault(); setDragOver(true); }}
            onDragLeave={function() { setDragOver(false); }}
            onDrop={function(e) { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={function() { fileRef.current.click(); }}
            style={{ border:"2px dashed "+(dragOver?"#6C63FF":"rgba(255,255,255,.2)"), borderRadius:14, padding:"28px 20px", textAlign:"center", cursor:"pointer", marginBottom:6, background:dragOver?"#6C63FF11":"transparent", transition:"all .2s" }}
          >
            <input ref={fileRef} type="file" accept=".txt,.pdf,.pptx,.docx" style={{ display:"none" }} onChange={function(e) { handleFile(e.target.files[0]); }} />
            <div style={{ fontSize:34, marginBottom:8 }}>📂</div>
            <p style={{ fontWeight:600, fontSize:14 }}>{fileName || "Drop file here or click to browse"}</p>
            <p style={{ opacity:.5, fontSize:12, marginTop:3 }}>PDF • PPTX • DOCX • TXT</p>
          </div>
          {scanMsg && <p style={{ fontSize:13, textAlign:"center", marginBottom:10, color:scanMsg.startsWith("✅")?"#06D6A0":scanMsg.startsWith("⚠️")?"#FFD93D":"#fff8" }}>{scanMsg}</p>}
          {errMsg  && <p style={{ fontSize:12, color:"#FF6B6B", marginBottom:8, textAlign:"center" }}>{errMsg}</p>}
          <p style={{ opacity:.55, fontSize:13, marginBottom:6 }}>Or paste notes directly:</p>
          <textarea value={rawText} onChange={function(e) { setRawText(e.target.value); }} placeholder="Paste study notes here…"
            style={{ width:"100%", minHeight:120, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.15)", borderRadius:12, padding:14, color:"#fff", fontSize:14 }} />
          {rawText && <p style={{ fontSize:11, opacity:.38, marginTop:3, textAlign:"right" }}>{rawText.trim().split(/\s+/).length} words</p>}
          <div style={{ margin:"20px 0 8px", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, padding:16 }}>
            <p style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>🎤 ElevenLabs API Key <span style={{ opacity:.5, fontWeight:400 }}>(for AI singing vocals)</span></p>
            <input value={apiKey} onChange={function(e) { setApiKey(e.target.value); persist(library, e.target.value); }} type="password" placeholder="Paste your ElevenLabs API key here…"
              style={{ width:"100%", background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.2)", borderRadius:8, padding:"10px 12px", color:"#fff", fontSize:13 }} />
            <p style={{ fontSize:11, opacity:.45, marginTop:6 }}>Free key at elevenlabs.io → Profile → API Keys. Without it, music-only mode plays.</p>
          </div>
          <h3 style={{ fontSize:18, fontWeight:700, margin:"20px 0 12px" }}>Choose Your Genre</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(128px,1fr))", gap:10, marginBottom:28 }}>
            {GENRES.map(function(g) {
              const sel = genre && genre.name === g.name;
              return (
                <div key={g.name} onClick={function() { setGenre(g); }}
                  style={{ border:"2px solid "+(sel?g.color:"rgba(255,255,255,.15)"), borderRadius:13, padding:"13px 8px", textAlign:"center", cursor:"pointer", background:sel?g.color+"22":"rgba(255,255,255,.05)", transition:"all .18s", transform:sel?"scale(1.05)":"scale(1)" }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>{g.icon}</div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{g.name}</div>
                  <div style={{ fontSize:10, opacity:.55, marginTop:2 }}>{g.desc}</div>
                </div>
              );
            })}
          </div>
          <button onClick={startProcessing} disabled={!rawText.trim() || !genre}
            style={{ width:"100%", padding:17, border:"none", borderRadius:13, fontSize:16, fontWeight:700, color:"#fff",
              cursor:rawText.trim()&&genre?"pointer":"not-allowed",
              background:rawText.trim()&&genre?"linear-gradient(135deg,"+(genre?genre.color:"#6C63FF")+",#FF6B6B)":"rgba(255,255,255,.12)",
              opacity:rawText.trim()&&genre?1:0.45, transition:"all .2s" }}>
            🎵 Generate My Song
          </button>
        </div>
      </div>
    );
  }

  // PROCESSING
  if (page === "processing") {
    return (
      <div style={Object.assign({}, box, { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" })}>
        <div style={{ fontSize:56, animation:"spin 2.5s linear infinite", marginBottom:20 }}>🎵</div>
        <h2 style={{ fontSize:23, fontWeight:800, marginBottom:6 }}>Creating Your {genre?genre.name:""} Track</h2>
        <p style={{ opacity:.6, marginBottom:30, fontSize:14 }}>{STEPS[stepIdx]}</p>
        {errMsg && <p style={{ color:"#FF6B6B", fontSize:13, marginBottom:10 }}>{errMsg}</p>}
        <div style={{ width:"min(340px,76vw)", background:"rgba(255,255,255,.1)", borderRadius:50, height:8, marginBottom:8 }}>
          <div style={{ height:"100%", borderRadius:50, background:"linear-gradient(90deg,"+acc+",#FF6B6B)", width:pct+"%", transition:"width .2s" }} />
        </div>
        <p style={{ opacity:.4, fontSize:12, marginBottom:16 }}>{Math.floor(pct)}%</p>
        <p style={{ fontSize:13, color:genLog.startsWith("✅")?"#06D6A0":genLog.startsWith("⚠️")?"#FFD93D":"#fff8" }}>{genLog}</p>
        {genAudio && <p style={{ opacity:.4, fontSize:11, marginTop:8 }}>Vocal generation may take 10–20s…</p>}
        <div style={{ display:"flex", gap:3, marginTop:28 }}>
          {Array(8).fill(0).map(function(_, i) {
            return <div key={i} style={{ width:4, height:20, borderRadius:4, background:acc, animation:"bar 1s ease-in-out infinite", animationDelay:(i*0.12)+"s" }} />;
          })}
        </div>
      </div>
    );
  }

  // PLAYER
  if (page === "player") {
    const allLines = lyrics.split("\n");
    const contentLines = allLines.filter(function(l) { return l.trim() && !l.startsWith("["); });
    return (
      <div style={box}>
        <div style={{ maxWidth:640, margin:"0 auto", animation:"slideIn .4s ease" }}>
          <button onClick={function() { stopAudio(); setPage("upload"); }} style={ghost}>← New Song</button>
          <div style={{ background:"linear-gradient(135deg,"+acc+"30,"+acc+"0d)", border:"1px solid "+acc+"40", borderRadius:22, padding:26, margin:"16px 0", textAlign:"center" }}>
            <div style={{ fontSize:54, marginBottom:7 }}>{genre?genre.icon:""}</div>
            <h2 style={{ fontSize:20, fontWeight:800, marginBottom:3 }}>{title}</h2>
            <p style={{ opacity:.6, fontSize:13, marginBottom:4 }}>{genre?genre.name:""} • AI Generated</p>
            <p style={{ fontSize:11, marginBottom:12, color:audioUrl?"#06D6A0":"#FFD93D" }}>
              {audioUrl ? "🎤 ElevenLabs vocals + Tone.js beat" : "🎵 Music-only mode"}
            </p>
            <Bars on={playing} color={acc} />
            <div style={{ width:"100%", background:"rgba(255,255,255,.1)", borderRadius:50, height:4, margin:"14px 0 10px" }}>
              <div style={{ height:"100%", borderRadius:50, background:"linear-gradient(90deg,"+acc+",#FF6B6B)", width:(progress*100)+"%", transition:"width .3s" }} />
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:18, marginBottom:6 }}>
              <button onClick={stopAudio} style={{ background:"none", border:"none", color:"rgba(255,255,255,.6)", fontSize:18, cursor:"pointer" }}>⏹</button>
              <button onClick={togglePlay} style={{ background:acc, border:"none", borderRadius:"50%", width:60, height:60, fontSize:26, color:"#fff", cursor:"pointer", boxShadow:"0 0 22px "+acc+"88", transition:"transform .1s", transform:playing?"scale(.94)":"scale(1)" }}>
                {playing ? "⏸" : "▶️"}
              </button>
              <button onClick={function() { stopAudio(); setTimeout(startAudio, 150); }} style={{ background:"none", border:"none", color:"rgba(255,255,255,.6)", fontSize:18, cursor:"pointer" }}>🔄</button>
            </div>
            <p style={{ opacity:.42, fontSize:11 }}>{playing?"🎵 Playing — follow lyrics below":"▶ Press play to hear your song"}</p>
          </div>
          <div style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:18, padding:20, maxHeight:360, overflowY:"auto" }}>
            <p style={{ fontWeight:700, fontSize:13, opacity:.5, marginBottom:12 }}>📝 Lyrics</p>
            {allLines.map(function(line, i) {
              const isLabel = line.startsWith("[");
              const li = contentLines.indexOf(line);
              const isActive = !isLabel && li === curLine;
              return (
                <div key={i} style={{ padding:"2px 0", marginTop:isLabel?12:0, transition:"all .15s",
                  color:isLabel?acc:isActive?"#fff":"rgba(255,255,255,.6)",
                  fontSize:isActive?17:isLabel?11:15, fontWeight:isLabel||isActive?700:400,
                  textShadow:isActive?"0 0 14px "+acc:"none", letterSpacing:isLabel?1.2:0 }}>
                  {line || <br />}
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button onClick={function() { stopAudio(); setPage("library"); }} style={{ flex:1, padding:13, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", borderRadius:11, color:"#fff", fontSize:14, cursor:"pointer" }}>🎧 Library</button>
            <button onClick={function() { stopAudio(); setRawText(""); setFileName(""); setScanMsg(""); setGenre(null); setAudioUrl(""); setPage("upload"); }}
              style={{ flex:1, padding:13, background:"linear-gradient(135deg,"+acc+",#FF6B6B)", border:"none", borderRadius:11, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>✨ New Song</button>
          </div>
        </div>
      </div>
    );
  }

  // LIBRARY
  return (
    <div style={box}>
      <div style={{ maxWidth:640, margin:"0 auto" }}>
        <button onClick={function() { setPage("home"); }} style={ghost}>← Home</button>
        <h2 style={{ fontSize:27, fontWeight:800, margin:"16px 0 5px" }}>🎧 My Library</h2>
        <p style={{ opacity:.6, marginBottom:22 }}>Your generated study tracks</p>
        {library.length === 0 ? (
          <div style={{ textAlign:"center", padding:50, opacity:.5 }}>
            <div style={{ fontSize:42, marginBottom:12 }}>🎵</div>
            <p>No songs yet — generate your first track!</p>
            <button onClick={function() { setPage("upload"); }} style={{ marginTop:16, padding:"10px 24px", background:"#6C63FF", border:"none", borderRadius:50, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" }}>Create Song</button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {library.map(function(s, i) {
              return (
                <div key={i} onClick={function() {
                  setLyrics(s.lyrics); setTitle(s.title); setAudioUrl(s.audioUrl||"");
                  setGenre(GENRES.find(function(g) { return g.name===s.genre; }) || { name:s.genre, icon:s.icon, color:s.color, stability:.5, style:.5 });
                  setPlaying(false); setCurLine(-1); setPage("player");
                }} style={{ background:s.color+"11", border:"1px solid "+s.color+"33", borderRadius:14, padding:16, display:"flex", alignItems:"center", gap:13, cursor:"pointer" }}>
                  <div style={{ fontSize:30, background:s.color+"33", borderRadius:10, width:50, height:50, display:"flex", alignItems:"center", justifyContent:"center" }}>{s.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{s.title}</div>
                    <div style={{ opacity:.6, fontSize:12 }}>{s.genre} • {s.date}</div>
                    {s.hook && <div style={{ opacity:.44, fontSize:11, marginTop:2, fontStyle:"italic" }}>"{s.hook}"</div>}
                    {s.audioUrl && <div style={{ fontSize:10, color:"#06D6A0", marginTop:2 }}>🎤 with vocals</div>}
                  </div>
                  <div style={{ color:s.color, fontSize:18 }}>▶</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
