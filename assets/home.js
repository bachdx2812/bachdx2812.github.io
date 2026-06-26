/* home.js — homepage data + rendering.
   Defines the app/tool catalog, renders the cards into #apps-grid / #tools-grid,
   and wires the "click to copy brew command" buttons. */
const GH = "https://github.com/bachdx2812/";
const apps = [
  { key:"appglance", name:"AppGlance", repo:"app-consuming-monitor", version:"v0.1.0",
    cask:"appglance", ac:"#b5611c", grad:"linear-gradient(150deg,#e8943a,#b5611c)",
    platform:"macOS 13+ · menu app",
    desc:"App-centric activity monitor. Groups every helper process under the app you actually launched — one clean row per app.",
    tags:["Tauri","Rust","React"],
    icon:`<svg viewBox="0 0 24 24" fill="none" stroke="#fbf3e6" stroke-width="2" stroke-linecap="round"><path d="M4 20V13"/><path d="M9 20V8"/><path d="M14 20V11"/><path d="M19 20V5"/></svg>` },
  { key:"quickmemo", name:"QuickMemo", repo:"quick-note", version:"v1.1.1",
    cask:"quickmemo", ac:"#a52e18", grad:"linear-gradient(150deg,#e3573a,#a52e18)",
    platform:"macOS 11+ · menu app",
    desc:"Menu-bar note capture that floats over full-screen apps. Hit ⌘⇧M, type, ↵ to save. Grouped by day, local SQLite.",
    tags:["Tauri","Rust","NSPanel"],
    icon:`<svg viewBox="0 0 24 24" fill="none" stroke="#fdeeea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11l3 3v13H5z"/><path d="M8 9h7M8 13h7M8 17h4"/></svg>` },
  { key:"translate-on-air", name:"Translate On Air", repo:"translation-on-air", version:"v0.1.2",
    cask:"translation-on-air", ac:"#1c514e", grad:"linear-gradient(150deg,#2f7e7a,#1c514e)",
    platform:"macOS · menu app",
    desc:"Select text in any app, press a hotkey, get an instant translation — Japanese renders with furigana over the kanji.",
    tags:["Tauri","Rust","OpenAI / Claude"],
    icon:`<svg viewBox="0 0 24 24" fill="none" stroke="#e7f3f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h7M7.5 6v2c0 2.5-1.5 4.5-3.5 5.5"/><path d="M6 10c.8 2 2.5 3.3 4 4"/><path d="M13 20l3.4-9 3.4 9M14.3 17h4.2"/></svg>` },
  { key:"speakmate", name:"SpeakMate", repo:"speakmate", version:"v0.2.0",
    cask:"speakmate", ac:"#383895", grad:"linear-gradient(150deg,#5a5bc4,#383895)",
    platform:"Apple Silicon · macOS 11+",
    desc:"Practice spoken English & Japanese. AI gives you a line, a native voice reads it, you read back — and get per-word pronunciation scoring.",
    tags:["Tauri","Azure Speech","Claude"],
    icon:`<svg viewBox="0 0 24 24" fill="none" stroke="#eeeefb" stroke-width="2" stroke-linecap="round"><path d="M12 4v16M8 8v8M16 8v8M4 11v2M20 11v2"/></svg>` }
];
const tools = [
  { key:"sda", name:"System Design Advisor", repo:"system-design-advisor",
    ac:"#2a3645", grad:"linear-gradient(150deg,#46566b,#2a3645)",
    platform:"Claude Code · Cursor",
    desc:"AI coding-assistant skills for system design. Drop-in expertise that reasons about scale, trade-offs and architecture as you build.",
    tags:["Skills","AI","Markdown"],
    icon:`<svg viewBox="0 0 24 24" fill="none" stroke="#eaeef3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="18" r="2.4"/><circle cx="19" cy="18" r="2.4"/><path d="M12 7.4v4.6M12 12l-5 4M12 12l5 4"/></svg>` },
  { key:"handbook", name:"The Engineer's Handbook", repo:"dev-learning-hub",
    live:"https://bachdx-learning-hub.vercel.app/",
    ac:"#5e5e22", grad:"linear-gradient(150deg,#9a9a3a,#5e5e22)",
    platform:"VitePress · open source",
    desc:"System design, design patterns & more — master engineering one concept at a time. 25 chapters, 200+ diagrams, interview prep.",
    tags:["VitePress","25 chapters","200+ diagrams"],
    icon:`<svg viewBox="0 0 24 24" fill="none" stroke="#f3f3e3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5z"/><path d="M20 5.5C20 4.7 19.3 4 18.5 4H13v15h5.5c.8 0 1.5-.7 1.5-1.5z"/><path d="M12 4v15"/></svg>` }
];

const ghMark = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg>`;
const copyIco = `<svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`;
const extIco = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>`;

function appCard(a,i){
  const cmd = `brew install --cask bachdx2812/tap/${a.cask}`;
  return `<article class="card reveal" style="--ac:${a.ac};animation-delay:${(0.1+i*0.07).toFixed(2)}s">
    <a class="stretch" href="${GH}${a.repo}" target="_blank" rel="noopener" aria-label="${a.name} on GitHub"></a>
    <div class="card-head">
      <div class="tile" style="background:${a.grad}">${a.icon}</div>
      <div class="titles"><h3>${a.name}</h3><div class="platform">${a.platform}</div></div>
      <span class="ver">${a.version}</span>
    </div>
    <p class="desc">${a.desc}</p>
    <div class="tags">${a.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
    <div class="actions">
      <button class="brew" data-cmd="${cmd}" type="button" title="Click to copy">${copyIco}<code>${cmd}</code></button>
      <a class="ghbtn" href="${GH}${a.repo}" target="_blank" rel="noopener">${ghMark}<span>GitHub</span></a>
    </div>
  </article>`;
}
function toolCard(t,i){
  const live = t.live ? `<a class="ghbtn" href="${t.live}" target="_blank" rel="noopener">${extIco}<span>Live</span></a>` : "";
  return `<article class="card reveal" style="--ac:${t.ac};animation-delay:${(0.1+i*0.08).toFixed(2)}s">
    <a class="stretch" href="${GH}${t.repo}" target="_blank" rel="noopener" aria-label="${t.name} on GitHub"></a>
    <div class="card-head">
      <div class="tile" style="background:${t.grad}">${t.icon}</div>
      <div class="titles"><h3>${t.name}</h3><div class="platform">${t.platform}</div></div>
    </div>
    <p class="desc">${t.desc}</p>
    <div class="tags">${t.tags.map(x=>`<span class="tag">${x}</span>`).join("")}</div>
    <div class="linkrow">
      <a class="ghbtn ghost" href="${GH}${t.repo}" target="_blank" rel="noopener">${ghMark}<span>Repository</span></a>
      ${live}
    </div>
  </article>`;
}
document.getElementById("apps-grid").innerHTML  = apps.map(appCard).join("");
document.getElementById("tools-grid").innerHTML = tools.map(toolCard).join("");

const toast = document.getElementById("toast");
let toastT;
document.querySelectorAll(".brew").forEach(btn=>{
  btn.addEventListener("click", async (e)=>{
    e.preventDefault(); e.stopPropagation();
    const cmd = btn.dataset.cmd;
    try{ await navigator.clipboard.writeText(cmd); }
    catch{ const ta=document.createElement("textarea"); ta.value=cmd; document.body.appendChild(ta); ta.select(); try{document.execCommand("copy");}catch(_){} ta.remove(); }
    btn.classList.add("copied");
    toast.textContent = "copied  ·  "+cmd;
    toast.classList.add("show");
    clearTimeout(toastT);
    toastT=setTimeout(()=>{ toast.classList.remove("show"); btn.classList.remove("copied"); }, 1900);
  });
});
