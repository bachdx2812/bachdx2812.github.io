#!/usr/bin/env node
// Trinh sinh blog "lessons" tinh — khong phu thuoc package ngoai.
// Doc lessons/posts/*.md (frontmatter + markdown) -> sinh:
//   - lessons/<slug>.html   (trang chi tiet, moi bai 1 file)
//   - lessons/index.html    (trang danh sach, moi non-draft 1 card)
// Bai draft VAN duoc sinh trang chi tiet (co <meta noindex> + nhan DRAFT) de xem truoc,
// nhung KHONG hien trong danh sach. Style khop homepage (warm paper / Fraunces / vermilion).
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url)); // .../lessons
const POSTS = join(ROOT, "posts");
const SITE = "https://bachdx2812.github.io";

// ---------- helpers ----------
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

// ---------- frontmatter ----------
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split("\n")) {
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!mm) continue;
    let [, k, v] = mm;
    v = v.trim();
    if (k === "tags") {
      if (v.startsWith("[")) {
        try { data.tags = JSON.parse(v); } catch { data.tags = []; }
      } else {
        data.tags = v ? v.split(",").map((t) => t.trim()).filter(Boolean) : [];
      }
      continue;
    }
    if (v === "true") v = true;
    else if (v === "false") v = false;
    else v = v.replace(/^["']|["']$/g, "");
    data[k] = v;
  }
  return { data, body: m[2] };
}

// ---------- markdown -> html (subset du cho bai hoc) ----------
function inline(t) {
  // 1) tach inline code RAW (placeholder sentinel \u0000), 2) escape, 3) link/bold/italic, 4) tra lai code
  const codes = [];
  let s = t.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return "\u0000" + (codes.length - 1) + "\u0000";
  });
  s = esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => {
      const ext = /^https?:/.test(url);
      return `<a href="${escAttr(url)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${txt}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, "$1<em>$2</em>");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const flushList = (items, ordered) => {
    const tag = ordered ? "ol" : "ul";
    out.push(`<${tag}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${tag}>`);
  };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    // fenced code
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; // skip closing fence
      out.push(
        `<pre data-lang="${escAttr(lang)}"><code>${esc(buf.join("\n"))}</code></pre>`
      );
      continue;
    }
    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = Math.min(Math.max(h[1].length, 2), 6); // # va ## -> h2 (h1 reserved cho tieu de bai)
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      i++;
      continue;
    }
    // hr
    if (/^(---+|\*\*\*+|___+)\s*$/.test(line)) { out.push("<hr/>"); i++; continue; }
    // blockquote
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, "")); i++;
      }
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }
    // unordered list
    if (/^[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, "")); i++;
      }
      flushList(items, false);
      continue;
    }
    // ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, "")); i++;
      }
      flushList(items, true);
      continue;
    }
    // paragraph (gom cac dong lien tiep)
    const buf = [];
    while (
      i < lines.length && lines[i].trim() &&
      !/^(#{1,6}\s|```|>|[-*+]\s|\d+\.\s|---+|\*\*\*+|___+)/.test(lines[i])
    ) { buf.push(lines[i]); i++; }
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}

// ---------- templates ----------
const TOPBAR = `<header class="topbar"><div class="wrap">
  <a class="brand" href="/"><span class="sigil">b</span><span>bachdx<span class="mono">&nbsp;/ lessons</span></span></a>
  <nav>
    <a href="/#apps">Apps</a>
    <a href="/#tools">Open&nbsp;source</a>
    <a href="/lessons/">Lessons</a>
    <a class="gh" href="https://github.com/bachdx2812" target="_blank" rel="noopener">GitHub&nbsp;↗</a>
  </nav>
</div></header>`;

const FOOTER = `<footer><div class="wrap foot">
  <span>© 2026 bachdx — engineering lessons, written after each build session.</span>
  <span><a href="/">bachdx2812.github.io</a><span class="dot"> · </span><a href="https://github.com/bachdx2812" target="_blank" rel="noopener">github</a></span>
</div></footer>`;

const fmtDate = (d) => {
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

function page({ title, description, body, css = "assets/lessons.css", noindex = false, canonical }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>${esc(title)}</title>
<meta name="description" content="${escAttr(description || "")}"/>
${noindex ? '<meta name="robots" content="noindex"/>\n' : ""}${canonical ? `<link rel="canonical" href="${escAttr(canonical)}"/>\n` : ""}<meta name="theme-color" content="#f3eee4"/>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231a1714'/%3E%3Ctext x='16' y='22' font-family='Georgia,serif' font-size='18' font-weight='700' fill='%23d8492b' text-anchor='middle'%3Eb%3C/text%3E%3C/svg%3E"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,500&family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/assets/base.css"/>
<link rel="stylesheet" href="${css}"/>
</head>
<body>
${TOPBAR}
${body}
${FOOTER}
</body>
</html>`;
}

function listCard(p) {
  const tags = (p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  return `<a class="lcard" href="${escAttr(p.slug)}.html">
  <div class="lcard-meta"><time>${esc(fmtDate(p.pubDate))}</time></div>
  <h3>${esc(p.title)}</h3>
  <p class="desc">${esc(p.description || "")}</p>
  <div class="tags">${tags}</div>
</a>`;
}

function listPage(posts) {
  const cards = posts.length
    ? posts.map(listCard).join("\n")
    : `<p class="empty">No lessons yet. Run <code>/lesson</code> or end a Claude session to create the first one.</p>`;
  const body = `<section class="hero-lessons"><div class="wrap">
  <div class="eyebrow">Engineering lessons · written after each build session</div>
  <h1>Lessons<em>.</em></h1>
  <p class="lede">The problem, the options tried, the final call, and what I learned — distilled from real build sessions.</p>
</div></section>
<section class="wrap"><div class="lcount">${posts.length} posts</div><div class="lgrid">${cards}</div></section>`;
  return page({
    title: "Lessons — bachdx",
    description: "Engineering lessons by bachdx, distilled after each build session.",
    body,
    canonical: `${SITE}/lessons/`,
  });
}

function detailPage(p) {
  const tags = (p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  const draftBadge = p.draft ? `<span class="draft-pill">DRAFT — not published</span>` : "";
  const body = `<article class="post"><div class="wrap">
  <a class="back" href="/lessons/">← All lessons</a>
  <div class="post-head">
    <div class="eyebrow"><time>${esc(fmtDate(p.pubDate))}</time>${draftBadge}</div>
    <h1>${esc(p.title)}</h1>
    ${p.description ? `<p class="lede">${esc(p.description)}</p>` : ""}
    <div class="tags">${tags}</div>
  </div>
  <div class="prose">${p.html}</div>
  <a class="back back-bottom" href="/lessons/">← All lessons</a>
</div></article>`;
  return page({
    title: `${p.title} — bachdx`,
    description: p.description || "",
    body,
    noindex: !!p.draft,
    canonical: p.draft ? undefined : `${SITE}/lessons/${p.slug}.html`,
  });
}

// ---------- build ----------
function build() {
  if (!existsSync(POSTS)) mkdirSync(POSTS, { recursive: true });
  const files = readdirSync(POSTS).filter((f) => f.endsWith(".md"));
  const posts = files.map((f) => {
    const raw = readFileSync(join(POSTS, f), "utf8");
    const { data, body } = parseFrontmatter(raw);
    const slug = basename(f, ".md");
    return {
      slug,
      title: data.title || slug,
      description: data.description || "",
      pubDate: data.pubDate || "1970-01-01",
      tags: data.tags || [],
      draft: data.draft === true,
      html: mdToHtml(body.trim()),
    };
  });
  posts.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // chi tiet: build het (ke ca draft, draft co noindex)
  for (const p of posts) writeFileSync(join(ROOT, `${p.slug}.html`), detailPage(p));
  // danh sach: chi non-draft
  const published = posts.filter((p) => !p.draft);
  writeFileSync(join(ROOT, "index.html"), listPage(published));

  const drafts = posts.length - published.length;
  console.log(
    `[lessons] built ${posts.length} posts (${published.length} published, ${drafts} draft) -> ${ROOT}`
  );
}

build();
