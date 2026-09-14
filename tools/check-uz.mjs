// UI/API matnlarini KANON til qoidalari bo'yicha tekshiradi (izohlar hisobga olinmaydi).
// Foydalanish: node tools/check-uz.mjs   → 0 = toza, 1 = muammo bor
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dirs = ["web/src", "api/src"].map((d) => path.join(root, d));
const EN_OK = /\b(?:[A-Za-z]+'(?:s|t|re|ll|ve|d|m)|o'clock|rock'n'roll)\b/g; // inglizcha qisqartmalar
const FORBIDDEN = [
  [/\btalaba/i, "talaba → oʻquvchi"],
  [/o[ʻ']qituvchi/i, "oʻqituvchi → ustoz"],
  [/instru[ck]tor/i, "instruktor → ustoz"],
  [/\bXP\b/, "XP → tanga"],
  [/\bUZS\b/, "UZS → soʻm"],
  [/\byulduz/i, "yulduz → tanga"],
  [/sinf rahbari/i, "sinf rahbari → ustoz"],
];

function* files(dir) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(tsx?|mjs)$/.test(f)) yield p;
  }
}

// izohlarni olib tashlaydi, satr raqamlarini saqlagan holda
function stripComments(src) {
  let out = "", i = 0, str = null;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (str) {
      out += c;
      if (c === "\\") { out += n ?? ""; i += 2; continue; }
      if (c === str) str = null;
      i++;
      continue;
    }
    if (c === "/" && n === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && n === "*") {
      const end = src.indexOf("*/", i + 2);
      const chunk = src.slice(i, end < 0 ? src.length : end + 2);
      out += chunk.replace(/[^\n]/g, " ");
      i += chunk.length;
      continue;
    }
    if (c === '"' || c === "`") str = c;
    out += c;
    i++;
  }
  return out;
}

let problems = 0;
for (const dir of dirs) {
  for (const f of files(dir)) {
    const lines = stripComments(readFileSync(f, "utf8")).split("\n");
    lines.forEach((line, idx) => {
      if (/^\s*import\s/.test(line)) return;
      // satr literallari va JSX matni: '…' qo'shtirnoqlarini hisobga olmaslik uchun faqat "…" `…` va >…< ichini tekshiramiz
      const texts = [...line.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|`([^`]*)`|>([^<>{}]+)</g)].map((m) => m[1] ?? m[2] ?? m[3] ?? "");
      for (const t of texts) {
        const cleaned = t.replace(EN_OK, "");
        const apos = cleaned.match(/[A-Za-zʻ]'[A-Za-z]/);
        const bad = FORBIDDEN.find(([re]) => re.test(t));
        if (apos || bad) {
          problems++;
          console.log(`${path.relative(root, f)}:${idx + 1}  ${apos ? "ASCII apostrof" : bad[1]}  → ${t.trim().slice(0, 90)}`);
        }
      }
    });
  }
}
console.log(problems ? `\n${problems} ta muammo` : "Toza: ASCII apostrof va taqiqlangan atama yoʻq");
process.exit(problems ? 1 : 0);
