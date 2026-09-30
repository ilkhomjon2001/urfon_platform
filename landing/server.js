// URFON landing + lid qabul serveri
// Node 18+ — hech qanday bog'liqlik kerak emas (npm install shart emas)
// Ishga tushirish: node server.js

import { createServer } from "node:http";
import { readFileSync, appendFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));

/* ---------- .env o'qish (dotenv'siz) ---------- */
const env = {};
try {
  for (const line of readFileSync(join(DIR, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
} catch { /* .env yo'q — muhit o'zgaruvchilaridan olinadi */ }

const PORT     = Number(process.env.PORT || env.PORT || 4600);
const TOKEN    = process.env.TG_BOT_TOKEN || env.TG_BOT_TOKEN || "";
const CHAT_IDS = (process.env.TG_CHAT_ID || env.TG_CHAT_ID || "")
  .split(",").map(s => s.trim()).filter(Boolean);

const LEADS_FILE = join(DIR, "leads.jsonl"); // har bir ariza faylga ham yoziladi (zaxira)
const TZ = "Asia/Tashkent";

/* ---------- yordamchilar ---------- */
const nowLocal = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date()).replace(",", "");

const esc = s => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function sendTelegram(text) {
  if (!TOKEN || !CHAT_IDS.length) {
    console.log("[tg] token/chat yo'q — faqat faylga yozildi");
    return { ok: false, reason: "not_configured" };
  }
  let allOk = true;
  for (const chatId of CHAT_IDS) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId, text, parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
      const json = await res.json();
      if (!json.ok) { allOk = false; console.error("[tg] xato:", json.description); }
    } catch (e) { allOk = false; console.error("[tg] tarmoq xatosi:", e.message); }
  }
  return { ok: allOk };
}

/* ---------- rate-limit va dedupe ---------- */
const ipHits = new Map();          // ip -> [timestamps]
const recentPhones = new Map();    // phone -> timestamp
const RATE_WINDOW = 10 * 60_000;   // 10 daqiqa
const RATE_MAX = 5;                // bitta IP'dan 10 daqiqada 5 ta ariza
const DEDUPE_WINDOW = 60 * 60_000; // bir soat ichida bir xil raqam qayta yuborilmaydi

function rateLimited(ip) {
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter(t => now - t < RATE_WINDOW);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > RATE_MAX;
}
function isDuplicate(phone) {
  const now = Date.now();
  for (const [p, t] of recentPhones) if (now - t > DEDUPE_WINDOW) recentPhones.delete(p);
  if (recentPhones.has(phone)) return true;
  recentPhones.set(phone, now);
  return false;
}

/* ---------- validatsiya ---------- */
function normalizePhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 9) return "+998" + d;               // 973757375
  if (d.length === 12 && d.startsWith("998")) return "+" + d;
  return null;
}

/* ---------- HTTP server ---------- */
const html = readFileSync(join(DIR, "urfon_landing.html"));


/* ---------- SEO va statik fayllar ---------- */
const SITE = (process.env.SITE_URL || env.SITE_URL || "https://urfon-edu.uz").replace(/\/+$/, "");
const STATIC_DIR = join(DIR, "static");
const MIME = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".webmanifest": "application/manifest+json", ".json": "application/json",
  ".html": "text/html; charset=utf-8",
  ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8",
};
const staticCache = new Map(); // yo'l -> { body, type, etag }

/** Yil davomida keshlanadigan statik fayl (rasm, ikonka, manifest, shrift). */
function readStatic(name) {
  if (staticCache.has(name)) return staticCache.get(name);
  const file = join(STATIC_DIR, name);
  if (!file.startsWith(STATIC_DIR) || !existsSync(file)) return null;
  const body = readFileSync(file);
  const ext = name.slice(name.lastIndexOf("."));
  const item = { body, type: MIME[ext] || "application/octet-stream", etag: `"${createHash("sha1").update(body).digest("hex").slice(0, 16)}"` };
  staticCache.set(name, item);
  return item;
}

const htmlEtag = `"${createHash("sha1").update(html).digest("hex").slice(0, 16)}"`;
const htmlModified = (() => {
  try { return statSync(join(DIR, "urfon_landing.html")).mtime.toUTCString(); } catch { return new Date().toUTCString(); }
})();
const lastmodYmd = new Date(htmlModified).toISOString().slice(0, 10);

const ROBOTS = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /api/",
  "Disallow: /health",
  "",
  `Sitemap: ${SITE}/sitemap.xml`,
  "",
].join("\n");

const SITEMAP =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n'.replace("sitemap.org", "sitemaps.org") +
  `  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${lastmodYmd}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n` +
  "</urlset>\n";

/** Har bir javobga qo'yiladigan umumiy sarlavhalar. */
const BASE_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
  "permissions-policy": "geolocation=(), microphone=(), camera=()",
};

/** Javob (HEAD so'rovida tana yuborilmaydi). */
function send(req, res, code, headers, body) {
  res.writeHead(code, { ...BASE_HEADERS, ...headers });
  if (req.method === "HEAD" || body == null) return res.end();
  res.end(body);
}

const NOT_FOUND_HTML = `<!doctype html><html lang="uz"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Sahifa topilmadi — URFON</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,Segoe UI,Arial,sans-serif;color:#101A3D;background:#F5F7FC}
a{color:#1E4FC2}main{text-align:center;padding:24px}h1{font-size:64px;margin:0;color:#1E4FC2}p{margin:8px 0 20px}</style>
</head><body><main><h1>404</h1><p>Bunday sahifa yoʻq.</p><a href="/">Bosh sahifaga qaytish</a></main></body></html>`;

const server = createServer(async (req, res) => {
  const url = req.url.split("?")[0];

  const isGet = req.method === "GET" || req.method === "HEAD"; // HEAD — qidiruv robotlari uchun

  // /index.html → / (yagona manzil, canonical bilan bir xil)
  if (isGet && url === "/index.html") {
    return send(req, res, 301, { location: "/" });
  }

  if (isGet && url === "/") {
    // Brauzer/robotdagi nusxa o'zgarmagan bo'lsa — 304
    if (req.headers["if-none-match"] === htmlEtag) return send(req, res, 304, { etag: htmlEtag });
    return send(req, res, 200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=600, must-revalidate",
      etag: htmlEtag,
      "last-modified": htmlModified,
    }, html);
  }

  if (isGet && url === "/robots.txt") {
    return send(req, res, 200, { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" }, ROBOTS);
  }

  if (isGet && url === "/sitemap.xml") {
    return send(req, res, 200, { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=86400" }, SITEMAP);
  }

  // /favicon.ico va /static/* — uzoq muddat keshlanadi
  if (isGet && (url === "/favicon.ico" || url.startsWith("/static/"))) {
    const name = url === "/favicon.ico" ? "favicon.ico" : decodeURIComponent(url.slice("/static/".length));
    const item = name.includes("..") ? null : readStatic(name);
    if (item) {
      if (req.headers["if-none-match"] === item.etag) return send(req, res, 304, { etag: item.etag });
      return send(req, res, 200, {
        "content-type": item.type,
        "cache-control": url === "/favicon.ico" ? "public, max-age=604800" : "public, max-age=31536000, immutable",
        etag: item.etag,
      }, item.body);
    }
  }

  // Qidiruv tizimlari tasdiq fayllari (Google Search Console, Yandex Webmaster) — static/root/ dan ildizga beriladi
  if (isGet && /^\/[A-Za-z0-9._-]+\.(html|txt|xml)$/.test(url)) {
    const item = readStatic("root/" + url.slice(1));
    if (item) {
      return send(req, res, 200, { "content-type": item.type, "cache-control": "no-cache", "x-robots-tag": "noindex" }, item.body);
    }
  }

  if (isGet && url === "/health") {
    return send(req, res, 200, { "content-type": "application/json" }, JSON.stringify({ ok: true, tg: Boolean(TOKEN && CHAT_IDS.length) }));
  }

  if (req.method === "POST" && url === "/api/lead") {
    let body = "";
    req.on("data", c => { body += c; if (body.length > 4096) req.destroy(); });
    req.on("end", async () => {
      const reply = (code, obj) => {
        res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(obj));
      };
      let data;
      try { data = JSON.parse(body); } catch { return reply(400, { ok: false, error: "bad_json" }); }

      const name = String(data.name || "").trim().slice(0, 80);
      const phone = normalizePhone(data.phone);
      if (!name)  return reply(400, { ok: false, error: "name" });
      if (!phone) return reply(400, { ok: false, error: "phone" });

      const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
              || req.socket.remoteAddress || "?";
      if (rateLimited(ip)) return reply(429, { ok: false, error: "rate" });

      const dup = isDuplicate(phone);
      const lead = { at: nowLocal(), name, phone, ip, dup };

      // 1) Avval faylga — Telegram yiqilsa ham ariza yo'qolmaydi
      try { appendFileSync(LEADS_FILE, JSON.stringify(lead) + "\n"); }
      catch (e) { console.error("[fayl] yozib bo'lmadi:", e.message); }

      // 2) Telegram'ga (dublikat bo'lsa yubormaymiz, spam bo'lmasin)
      if (!dup) {
        await sendTelegram(
          `🔔 <b>Yangi ariza — bepul dars</b>\n\n` +
          `👤 Ism: <b>${esc(name)}</b>\n` +
          `📞 Tel: <code>${esc(phone)}</code>\n` +
          `🕐 Vaqt: ${lead.at}`
        );
      } else {
        console.log("[lead] dublikat (1 soat ichida):", phone);
      }

      console.log("[lead]", lead.at, name, phone, dup ? "(dublikat)" : "");
      reply(200, { ok: true });
    });
    return;
  }

  send(req, res, 404, { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" }, NOT_FOUND_HTML);
});

server.listen(PORT, () => {
  console.log(`URFON server: http://localhost:${PORT}`);
  console.log(`Telegram: ${TOKEN && CHAT_IDS.length ? "ulangan ✓" : "SOZLANMAGAN — arizalar faqat leads.jsonl ga yoziladi"}`);
  if (!existsSync(join(DIR, "urfon_landing.html")))
    console.error("DIQQAT: urfon_landing.html topilmadi — landing ochilmaydi!");
});
