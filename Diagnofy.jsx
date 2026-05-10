import { useState, useRef, useEffect } from "react";

// ══════════════════════════════════════════════
//  BRANDING — change these 4 lines to rebrand
// ══════════════════════════════════════════════
const BRAND_NAME    = "Diagnofy";
const BRAND_TAGLINE = "Your AI Health Companion";
const BRAND_ICON    = "🩺";
const BRAND_COLOR   = "#7c3aed";
// ══════════════════════════════════════════════

const SPECIALTIES = [
  { icon: "💊", name: "General Medicine" }, { icon: "🫀", name: "Cardiology" },
  { icon: "🧠", name: "Neurology" },        { icon: "🦴", name: "Orthopedics" },
  { icon: "🧴", name: "Dermatology" },      { icon: "🫁", name: "Pulmonology" },
  { icon: "🧪", name: "Endocrinology" },    { icon: "🤰", name: "Gynecology" },
  { icon: "🧒", name: "Pediatrics" },       { icon: "🦷", name: "Dentistry" },
  { icon: "👁", name: "Ophthalmology" },    { icon: "🦻", name: "ENT" },
  { icon: "🧬", name: "Oncology" },         { icon: "🧠", name: "Psychiatry" },
  { icon: "🩺", name: "Urology" },          { icon: "🏃", name: "Sports Medicine" },
  { icon: "🍎", name: "Nutrition" },        { icon: "🚨", name: "Emergency" },
];

const EMERGENCY_WORDS = ["chest pain","heart attack","can't breathe","cannot breathe","stroke",
  "unconscious","not breathing","severe bleeding","suicide","overdose","seizure","choking",
  "poisoning","anaphylaxis","unresponsive","dying"];

const QUICK_SYMPTOMS = [
  "I have a severe headache with light sensitivity for 3 days",
  "My chest feels tight and I'm short of breath",
  "I have sharp lower back pain radiating to my leg",
  "I've had a high fever for 2 days with body aches",
  "I noticed unusual skin rashes appearing on my arms",
];

const buildSystem = (specialty, name) =>
  `You are ${BRAND_NAME}, a world-class AI medical assistant with expert knowledge across every specialty.
${specialty ? `Focus area selected: ${specialty}.` : ""}
${name ? `Patient name: ${name}. Use their name naturally to personalize.` : ""}

Specialties you cover: General Medicine, Cardiology, Neurology, Orthopedics, Dermatology, Gastroenterology, Psychiatry, Pediatrics, Gynecology, Urology, ENT, Ophthalmology, Dentistry, Endocrinology, Oncology, Pulmonology, Rheumatology, Nephrology, Infectious Diseases, Emergency Medicine, Sports Medicine, Nutrition, and more.

Approach:
1. Carefully listen to the patient's symptoms
2. Ask 1-2 smart follow-up questions if needed (age, duration, severity, history)
3. Give a structured professional analysis:
   🔍 **Possible Conditions** — ranked by likelihood with explanation
   💊 **Recommended Treatment** — medications, home remedies, lifestyle changes
   🏥 **Specialist to Consult** — exact type of doctor needed
   ⚠️ **Warning Signs** — when to seek emergency care immediately
4. Be empathetic, clear, and thorough like a top doctor
5. For emergencies: IMMEDIATELY urge calling emergency services (911 / 999 / 112)

Always close responses with: "⚠️ This analysis is informational guidance only. Please consult a licensed medical professional for official diagnosis and treatment."`;

const mkId = () => Math.random().toString(36).slice(2);
const mkConv = (specialty, name) => ({ id: mkId(), title: "New Consultation", messages: [], specialty: specialty || null, createdAt: new Date() });

const MD = ({ text }) => (
  <div style={{ lineHeight: 1.8, fontSize: "0.87rem" }}>
    {text.split("\n").map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
      const html = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
      if (/^#{1,3}\s/.test(line)) return <p key={i} style={{ color: "#d8b4fe", fontWeight: 700, margin: "10px 0 4px", fontSize: "0.92rem" }} dangerouslySetInnerHTML={{ __html: html.replace(/^#+\s/, "") }} />;
      if (/^[-•]\s/.test(line)) return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: "#a855f7", flexShrink: 0 }}>•</span><span dangerouslySetInnerHTML={{ __html: html.replace(/^[-•]\s/, "") }} /></div>;
      if (/^\d+\.\s/.test(line)) return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: "#a855f7", flexShrink: 0, minWidth: 14 }}>{(line.match(/^\d+/) || [""])[0]}.</span><span dangerouslySetInnerHTML={{ __html: html.replace(/^\d+\.\s/, "") }} /></div>;
      return <p key={i} style={{ margin: "2px 0" }} dangerouslySetInnerHTML={{ __html: html }} />;
    })}
  </div>
);

const Dots = () => (
  <div style={{ display: "flex", gap: 5, padding: "2px 0" }}>
    {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#a855f7", display: "block", animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
  </div>
);

export default function App() {
  const [step, setStep]           = useState("onboard");
  const [nameInput, setNameInput] = useState("");
  const [userName, setUserName]   = useState("");
  const [convos, setConvos]       = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [specialty, setSpecialty] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId]   = useState(null);
  const [emergency, setEmergency] = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const recogRef  = useRef(null);

  const current = convos.find(c => c.id === currentId);
  const msgs    = current?.messages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, loading]);

  const updateConv = (id, fn) => setConvos(prev => prev.map(c => c.id === id ? fn(c) : c));

  const newChat = (spec) => {
    const activeSpec = spec !== undefined ? spec : specialty;
    const c = mkConv(activeSpec, userName);
    setConvos(prev => [c, ...prev.slice(0, 14)]);
    setCurrentId(c.id);
    setEmergency(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startApp = () => {
    const name = nameInput.trim();
    setUserName(name);
    const c = mkConv(null, name);
    setConvos([c]);
    setCurrentId(c.id);
    setStep("app");
  };

  const send = async (textOverride) => {
    const content = (textOverride || input).trim();
    if (!content || loading) return;
    if (EMERGENCY_WORDS.some(w => content.toLowerCase().includes(w))) setEmergency(true);

    const userMsg = { role: "user", content, id: mkId() };
    const newMsgs = [...msgs, userMsg];
    const newTitle = content.length > 42 ? content.slice(0, 42) + "…" : content;
    updateConv(currentId, c => ({ ...c, messages: newMsgs, title: c.messages.length === 0 ? newTitle : c.title }));
    setInput("");
    setLoading(true);

    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystem(current?.specialty, userName),
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "Unable to process. Please try again.";
      updateConv(currentId, c => ({ ...c, messages: [...c.messages, { role: "assistant", content: reply, id: mkId() }] }));
    } catch {
      updateConv(currentId, c => ({ ...c, messages: [...c.messages, { role: "assistant", content: "Connection error. Please try again.", id: mkId() }] }));
    }
    setLoading(false);
  };

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input requires Chrome browser."); return; }
    if (isListening) { recogRef.current?.stop(); return; }
    const r = new SR();
    r.lang = "en-US"; r.continuous = false; r.interimResults = false;
    r.onstart = () => setIsListening(true);
    r.onresult = e => { setInput(e.results[0][0].transcript); setIsListening(false); };
    r.onerror = r.onend = () => setIsListening(false);
    recogRef.current = r; r.start();
  };

  const copyMsg = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  };

  const exportChat = () => {
    if (!current || !msgs.length) return;
    const lines = msgs.map(m => `[${m.role === "user" ? (userName || "Patient") : BRAND_NAME}]\n${m.content}`).join("\n\n" + "─".repeat(40) + "\n\n");
    const txt = `${BRAND_NAME} – Medical Consultation Report\n${"═".repeat(45)}\nDate: ${new Date().toLocaleString()}\n${userName ? `Patient: ${userName}\n` : ""}${current.specialty ? `Specialty: ${current.specialty}\n` : ""}\n${lines}\n\n⚠ Informational only. Not a substitute for professional medical care.`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = `${BRAND_NAME}-report.txt`;
    a.click();
  };

  // ── CSS ──────────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body,#root{height:100%;}
    body{background:#080212;font-family:'DM Sans',sans-serif;}
    @keyframes bounce{0%,80%,100%{opacity:.2;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(124,58,237,.4)}50%{box-shadow:0 0 44px rgba(168,85,247,.75)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes emergFlash{0%,100%{background:rgba(239,68,68,.1)}50%{background:rgba(239,68,68,.2)}}
    .msg{animation:fadeUp .3s ease forwards;}
    .copy-btn{opacity:0;transition:opacity .15s;}
    .msg-wrap:hover .copy-btn{opacity:1;}
    .sbtn{transition:all .15s;background:transparent;border:none;cursor:pointer;width:100%;text-align:left;border-radius:10px;padding:9px 12px;color:rgba(196,181,253,.65);font-family:'DM Sans',sans-serif;font-size:.77rem;display:flex;align-items:center;gap:8px;}
    .sbtn:hover{background:rgba(124,58,237,.15);color:#e9d5ff;}
    .sbtn.active{background:rgba(124,58,237,.25);color:#f3e8ff;border-left:2px solid #a855f7;}
    .chip{cursor:pointer;background:rgba(124,58,237,.08);border:1px solid rgba(168,85,247,.18);border-radius:16px;padding:6px 12px;color:#c4b5fd;font-family:'DM Sans',sans-serif;font-size:.75rem;transition:all .15s;white-space:nowrap;}
    .chip:hover,.chip.sel{background:rgba(124,58,237,.28);border-color:rgba(168,85,247,.5);color:#e9d5ff;}
    .ibtn{cursor:pointer;background:transparent;border:none;color:rgba(196,181,253,.5);font-size:1rem;padding:6px;border-radius:8px;transition:all .15s;display:flex;align-items:center;justify-content:center;line-height:1;}
    .ibtn:hover{background:rgba(124,58,237,.2);color:#e9d5ff;}
    ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:rgba(168,85,247,.25);border-radius:4px;}
    .send-btn{background:linear-gradient(135deg,#6d28d9,#a855f7);border:none;border-radius:12px;padding:11px 20px;color:#fff;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;font-size:.88rem;transition:all .2s;white-space:nowrap;}
    .send-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 24px rgba(168,85,247,.45);}
    .send-btn:disabled{opacity:.4;cursor:not-allowed;}
    .ninput{background:rgba(255,255,255,.05);border:1px solid rgba(168,85,247,.28);border-radius:14px;padding:14px 18px;color:#f3e8ff;font-family:'DM Sans',sans-serif;font-size:1rem;width:100%;transition:border .2s;}
    .ninput:focus{outline:none;border-color:rgba(168,85,247,.7);}
    .ninput::placeholder{color:rgba(196,181,253,.3);}
    .spec-item{cursor:pointer;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;color:rgba(196,181,253,.75);font-size:.8rem;transition:all .15s;}
    .spec-item:hover{background:rgba(124,58,237,.18);color:#e9d5ff;}
    .spec-item.sel{background:rgba(124,58,237,.28);color:#f3e8ff;}
    textarea{resize:none;scrollbar-width:none;}
    textarea:focus,input:focus{outline:none;}
  `;

  // ── ONBOARDING ───────────────────────────────────────────────────────────────
  if (step === "onboard") return (
    <>
      <style>{css}</style>
      <div style={{ minHeight:"100vh", background:"radial-gradient(ellipse at 30% 10%,#1e0845 0%,#080212 55%,#0e0325 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, overflow:"hidden", position:"relative" }}>
        <div style={{ position:"absolute", top:"-15%", left:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(109,40,217,.16) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"-10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(168,85,247,.1) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ width:"100%", maxWidth:420, textAlign:"center", animation:"fadeUp .6s ease" }}>
          <div style={{ width:90, height:90, borderRadius:28, background:"linear-gradient(135deg,#4c1d95,#7c3aed,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.6rem", margin:"0 auto 26px", animation:"glow 3s ease infinite, float 5s ease-in-out infinite" }}>
            {BRAND_ICON}
          </div>
          <h1 style={{ fontFamily:"Playfair Display,serif", fontSize:"2.2rem", background:"linear-gradient(135deg,#f3e8ff,#c084fc,#7c3aed)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:8 }}>{BRAND_NAME}</h1>
          <p style={{ color:"rgba(196,181,253,.55)", fontSize:".88rem", marginBottom:36, letterSpacing:".04em" }}>{BRAND_TAGLINE}</p>

          <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(168,85,247,.14)", borderRadius:20, padding:"30px 26px", backdropFilter:"blur(20px)" }}>
            <p style={{ color:"#d8b4fe", fontSize:".95rem", marginBottom:18, fontWeight:500 }}>👋 What should I call you?</p>
            <input className="ninput" placeholder="Your name (optional)" value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key === "Enter" && startApp()} />
            <p style={{ color:"rgba(196,181,253,.3)", fontSize:".7rem", margin:"10px 0 22px" }}>Private & secure. Helps personalize your consultation.</p>
            <button className="send-btn" style={{ width:"100%", padding:14, fontSize:".95rem", borderRadius:14 }} onClick={startApp}>
              Start Consultation →
            </button>
          </div>

          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:22, justifyContent:"center" }}>
            {["🔒 Private","🌐 18 Specialties","🎙 Voice Input","📄 Export Reports","🚨 Emergency Detection"].map(f => (
              <span key={f} style={{ background:"rgba(124,58,237,.08)", border:"1px solid rgba(168,85,247,.12)", borderRadius:20, padding:"4px 11px", fontSize:".7rem", color:"rgba(196,181,253,.55)" }}>{f}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  // ── MAIN APP ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div style={{ height:"100vh", display:"flex", background:"radial-gradient(ellipse at 20% 0%,#150430 0%,#080212 60%)", color:"#f3e8ff", overflow:"hidden" }}>

        {/* SIDEBAR */}
        <aside style={{ width:sidebarOpen?248:0, minWidth:sidebarOpen?248:0, overflow:"hidden", transition:"all .25s ease", background:"rgba(0,0,0,.32)", borderRight:"1px solid rgba(168,85,247,.09)", display:"flex", flexDirection:"column", flexShrink:0 }}>
          {/* Brand */}
          <div style={{ padding:"18px 14px 14px", borderBottom:"1px solid rgba(168,85,247,.08)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#5b21b6,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>{BRAND_ICON}</div>
              <div>
                <div style={{ fontFamily:"Playfair Display,serif", fontSize:".9rem", fontWeight:700 }}>{BRAND_NAME}</div>
                <div style={{ fontSize:".6rem", color:"#9f7aea", letterSpacing:".06em", textTransform:"uppercase" }}>{BRAND_TAGLINE}</div>
              </div>
            </div>
            <button className="send-btn" style={{ width:"100%", padding:"9px", fontSize:".8rem", borderRadius:10 }} onClick={() => newChat(null)}>
              + New Consultation
            </button>
          </div>

          {/* Specialties */}
          <div style={{ padding:"12px 14px 6px", borderBottom:"1px solid rgba(168,85,247,.06)" }}>
            <p style={{ fontSize:".62rem", color:"rgba(196,181,253,.35)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>Specialties</p>
            <div style={{ maxHeight:190, overflowY:"auto" }}>
              {SPECIALTIES.map(s => (
                <div key={s.name} className={`spec-item${specialty===s.name?" sel":""}`}
                  onClick={() => { const ns = specialty===s.name?null:s.name; setSpecialty(ns); newChat(ns); }}>
                  <span>{s.icon}</span><span>{s.name}</span>
                  {specialty===s.name && <span style={{ marginLeft:"auto", fontSize:".6rem", color:"#a855f7" }}>✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div style={{ flex:1, overflowY:"auto", padding:"10px 14px" }}>
            <p style={{ fontSize:".62rem", color:"rgba(196,181,253,.35)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>History</p>
            {convos.length === 0 && <p style={{ fontSize:".75rem", color:"rgba(196,181,253,.25)", padding:"4px 0" }}>No history yet</p>}
            {convos.map(c => (
              <button key={c.id} className={`sbtn${c.id===currentId?" active":""}`} onClick={() => { setCurrentId(c.id); setEmergency(false); }}>
                <span style={{ flexShrink:0 }}>💬</span>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</span>
              </button>
            ))}
          </div>

          <div style={{ padding:"10px 14px", borderTop:"1px solid rgba(168,85,247,.07)", fontSize:".64rem", color:"rgba(196,181,253,.25)", lineHeight:1.55 }}>
            ⚠ Informational use only.<br/>Not a substitute for medical care.
          </div>
        </aside>

        {/* MAIN */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

          {/* Header */}
          <header style={{ padding:"13px 18px", borderBottom:"1px solid rgba(168,85,247,.09)", background:"rgba(8,2,18,.75)", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <button className="ibtn" onClick={() => setSidebarOpen(p=>!p)} title="Toggle sidebar" style={{ fontSize:"1.1rem" }}>
              {sidebarOpen ? "◀" : "▶"}
            </button>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"Playfair Display,serif", fontSize:"1rem", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {msgs.length > 0 ? (current?.title || "Consultation") : `Welcome${userName ? ", "+userName : ""}!`}
              </div>
              {current?.specialty && <div style={{ fontSize:".65rem", color:"#9f7aea" }}>{SPECIALTIES.find(s=>s.name===current.specialty)?.icon} {current.specialty}</div>}
            </div>
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              {msgs.length > 0 && <>
                <button className="ibtn" title="Export report" onClick={exportChat}>📄</button>
                <button className="ibtn" title="New consultation" onClick={() => newChat(null)}>✏️</button>
              </>}
              <div style={{ display:"flex", alignItems:"center", gap:5, marginLeft:6, background:"rgba(34,197,94,.07)", border:"1px solid rgba(34,197,94,.18)", borderRadius:20, padding:"4px 10px" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 6px #22c55e", animation:"pulse 2s ease infinite" }} />
                <span style={{ fontSize:".65rem", color:"#86efac", letterSpacing:".04em" }}>ONLINE</span>
              </div>
            </div>
          </header>

          {/* Emergency Banner */}
          {emergency && (
            <div style={{ background:"rgba(239,68,68,.1)", borderBottom:"1px solid rgba(239,68,68,.28)", padding:"10px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", animation:"emergFlash 2s ease infinite", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:"1.3rem" }}>🚨</span>
                <div>
                  <div style={{ color:"#fca5a5", fontWeight:600, fontSize:".85rem" }}>Emergency Symptoms Detected</div>
                  <div style={{ color:"rgba(252,165,165,.65)", fontSize:".73rem" }}>Call emergency services immediately → <strong>911</strong> (US) · <strong>999</strong> (UK) · <strong>112</strong> (EU / India)</div>
                </div>
              </div>
              <button className="ibtn" style={{ color:"rgba(252,165,165,.5)" }} onClick={() => setEmergency(false)}>✕</button>
            </div>
          )}

          {/* Chat */}
          <div style={{ flex:1, overflowY:"auto", padding:"22px 18px", display:"flex", flexDirection:"column", gap:16 }}>

            {/* Empty state */}
            {msgs.length === 0 && (
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"32px 16px", animation:"fadeUp .5s ease" }}>
                <div style={{ width:80, height:80, borderRadius:24, background:"linear-gradient(135deg,#4c1d95,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.4rem", marginBottom:20, boxShadow:"0 0 40px rgba(124,58,237,.45)", animation:"float 5s ease-in-out infinite" }}>{BRAND_ICON}</div>
                <h2 style={{ fontFamily:"Playfair Display,serif", fontSize:"1.65rem", background:"linear-gradient(135deg,#f3e8ff,#c084fc,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:10 }}>
                  {userName ? `Hello, ${userName}!` : "How can I help you?"}
                </h2>
                <p style={{ color:"rgba(196,181,253,.5)", fontSize:".87rem", maxWidth:360, lineHeight:1.7, marginBottom:26 }}>
                  Describe your symptoms in detail. I'll analyze them with expert-level knowledge across <strong style={{ color:"#a855f7" }}>all 18 medical specialties</strong>.
                </p>

                <div style={{ display:"flex", flexWrap:"wrap", gap:7, justifyContent:"center", maxWidth:480, marginBottom:26 }}>
                  {SPECIALTIES.slice(0,10).map(s => (
                    <span key={s.name} className={`chip${specialty===s.name?" sel":""}`} onClick={() => setSpecialty(prev => prev===s.name?null:s.name)}>
                      {s.icon} {s.name}
                    </span>
                  ))}
                </div>

                <div style={{ width:"100%", maxWidth:500 }}>
                  <p style={{ fontSize:".67rem", color:"rgba(196,181,253,.3)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>Try asking:</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {QUICK_SYMPTOMS.map((s,i) => (
                      <button key={i} className="chip" style={{ borderRadius:12, padding:"11px 15px", textAlign:"left", fontSize:".8rem" }} onClick={() => send(s)}>
                        "{s}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {msgs.map(msg => (
              <div key={msg.id} className="msg-wrap msg" style={{ display:"flex", flexDirection:msg.role==="user"?"row-reverse":"row", gap:10, alignItems:"flex-start" }}>
                <div style={{ width:34, height:34, borderRadius:11, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".85rem", background:msg.role==="user"?"rgba(124,58,237,.18)":"linear-gradient(135deg,#5b21b6,#7c3aed)", border:msg.role==="user"?"1px solid rgba(168,85,247,.22)":"none", boxShadow:msg.role==="assistant"?"0 0 14px rgba(124,58,237,.3)":"none" }}>
                  {msg.role==="user" ? (userName ? userName[0].toUpperCase() : "👤") : BRAND_ICON}
                </div>
                <div style={{ maxWidth:"76%", position:"relative" }}>
                  <div style={{ background:msg.role==="user"?"rgba(109,40,217,.18)":"rgba(255,255,255,.04)", border:`1px solid ${msg.role==="user"?"rgba(168,85,247,.28)":"rgba(255,255,255,.07)"}`, borderRadius:msg.role==="user"?"16px 4px 16px 16px":"4px 16px 16px 16px", padding:"12px 16px", color:"#f3e8ff" }}>
                    {msg.role==="assistant" ? <MD text={msg.content} /> : <span style={{ fontSize:".88rem", lineHeight:1.65 }}>{msg.content}</span>}
                  </div>
                  <button className="ibtn copy-btn" style={{ position:"absolute", top:6, [msg.role==="user"?"left":"right"]:-32, fontSize:".75rem", background:"rgba(0,0,0,.4)", border:"1px solid rgba(168,85,247,.18)", padding:"4px 7px" }} onClick={() => copyMsg(msg.content, msg.id)} title="Copy">
                    {copiedId===msg.id ? "✓" : "⎘"}
                  </button>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="msg" style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <div style={{ width:34, height:34, borderRadius:11, background:"linear-gradient(135deg,#5b21b6,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 0 14px rgba(124,58,237,.3)" }}>{BRAND_ICON}</div>
                <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:"4px 16px 16px 16px", padding:"13px 17px" }}>
                  <Dots />
                  <div style={{ fontSize:".67rem", color:"rgba(196,181,253,.38)", marginTop:4 }}>Analyzing symptoms…</div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Disclaimer strip */}
          {msgs.length > 0 && (
            <div style={{ textAlign:"center", padding:"5px 14px", fontSize:".63rem", color:"rgba(196,181,253,.22)", borderTop:"1px solid rgba(255,255,255,.03)", flexShrink:0 }}>
              ⚠ {BRAND_NAME} provides informational analysis only — not a substitute for licensed medical care
            </div>
          )}

          {/* Input bar */}
          <div style={{ padding:"12px 18px 16px", background:"rgba(8,2,18,.82)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(168,85,247,.09)", flexShrink:0 }}>
            {specialty && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                <span style={{ fontSize:".68rem", color:"rgba(196,181,253,.4)" }}>Focus:</span>
                <span style={{ background:"rgba(124,58,237,.18)", border:"1px solid rgba(168,85,247,.22)", borderRadius:12, padding:"2px 10px", fontSize:".7rem", color:"#c4b5fd" }}>
                  {SPECIALTIES.find(s=>s.name===specialty)?.icon} {specialty}
                </span>
                <button style={{ background:"none", border:"none", color:"rgba(196,181,253,.35)", cursor:"pointer", fontSize:".7rem" }} onClick={() => setSpecialty(null)}>✕ clear</button>
              </div>
            )}

            <div style={{ display:"flex", gap:8, alignItems:"flex-end", background:"rgba(255,255,255,.04)", border:"1px solid rgba(168,85,247,.2)", borderRadius:16, padding:"11px 13px", boxShadow:"0 0 24px rgba(124,58,237,.08)" }}>
              <button className="ibtn" onClick={toggleVoice} title={isListening?"Stop":"Voice input"} style={{ color:isListening?"#f87171":"rgba(196,181,253,.5)", animation:isListening?"pulse 1s infinite":"none", flexShrink:0 }}>
                🎙
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
                placeholder={isListening ? "🎙 Listening — speak your symptoms…" : "Describe your symptoms or health concern…"}
                rows={1}
                style={{ flex:1, background:"transparent", border:"none", color:"#f3e8ff", fontFamily:"'DM Sans',sans-serif", fontSize:".9rem", lineHeight:1.5, minHeight:24, maxHeight:120 }}
                onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,120)+"px"; }}
              />
              <button className="send-btn" onClick={() => send()} disabled={!input.trim()||loading} style={{ flexShrink:0 }}>
                {loading ? "Analyzing…" : "Diagnose →"}
              </button>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:".62rem", color:"rgba(196,181,253,.18)" }}>Enter to send · Shift+Enter new line · 🎙 voice</span>
              <span style={{ fontSize:".62rem", color:"rgba(196,181,253,.18)" }}>Powered by {BRAND_NAME} AI</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
