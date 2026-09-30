// IndexNow — sayt yangilanganini Bing va Yandex ga darhol xabar qiladi (Google IndexNow ni qoʻllamaydi).
// Kalit fayli: static/root/<kalit>.txt (sayt ildizidan ochilishi shart).
//   node indexnow.mjs            → sitemap dagi barcha manzillar
//   node indexnow.mjs /narx/     → faqat koʻrsatilgan manzillar
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const HOST = "urfon-edu.uz";
const SITE = `https://${HOST}`;
const key = readFileSync(join(DIR, ".indexnow-key"), "utf8").trim();

const args = process.argv.slice(2);
const urlList = args.length
  ? args.map((a) => (a.startsWith("http") ? a : SITE + (a.startsWith("/") ? a : "/" + a)))
  : [...readFileSync(join(DIR, "static", "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const body = { host: HOST, key, keyLocation: `${SITE}/${key}.txt`, urlList };
console.log(`IndexNow → ${urlList.length} manzil:`);
for (const u of urlList) console.log("  " + u);

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});
console.log(`\nJavob: ${res.status} ${res.statusText}`);
console.log(res.status === 200 || res.status === 202 ? "✓ Qabul qilindi (Bing va Yandex)" : await res.text());
