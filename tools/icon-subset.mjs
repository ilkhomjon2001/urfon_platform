// Material Symbols shriftini faqat ilovada ishlatilgan ikonkalar bilan yig'adi (3.7 MB → bir necha yuz KB).
// Ikonka qo'shilgach qayta ishga tushiring:  npm run icons
// Natija: web/src/assets/material-symbols-subset.woff2 + web/src/icons.css (qo'lda tahrirlamang).
// Shrift o'z serverimizdan beriladi; Google Fonts faqat shu skript ishlaganda (build vaqtida emas) chaqiriladi.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const all = new Set(
  [...readFileSync(path.join(root, "node_modules/material-symbols/index.d.ts"), "utf8").matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]),
);

// Kodda uchragan har bir ikonka nomi (satr literali yoki JSX matni) — ortiqchasi zarar qilmaydi, yetishmasa matn chiqadi.
// Paketdagi index.d.ts to'liq emas (masalan "insights", "expand_less" yo'q), shuning uchun nomzodlar:
//   d.ts dagi nom | "icon" so'zi bor qatordagi har bir so'z | pastki chiziqli so'z ("picture_as_pdf").
// Google Fonts noma'lum nomlarni jimgina tashlab yuboradi — ortiqcha nomzod xato bermaydi.
const used = new Set(["check", "close", "expand_more", "expand_less", "chevron_right", "chevron_left", "search", "notifications", "logout", "settings"]);
function scan(dir) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) scan(p);
    else if (/\.(tsx?|css)$/.test(f)) {
      for (const line of readFileSync(p, "utf8").split("\n")) {
        const iconLine = /icon/i.test(line);
        for (const m of line.matchAll(/["'`]([a-z0-9_]{2,48})["'`]|>\s*([a-z0-9_]{2,48})\s*</g)) {
          const n = m[1] ?? m[2];
          if (all.has(n) || iconLine || n.includes("_")) used.add(n);
        }
      }
    }
  }
}
scan(path.join(root, "web/src"));
scan(path.join(root, "api/src"));

const names = [...used].sort();
// Ilova faqat FILL 0/1, wght 400, GRAD 0, opsz 24 ishlatadi (web/src/index.css → .icon)
const url =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0" +
  `&icon_names=${names.join(",")}&display=block`;
const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const css = await (await fetch(url, { headers: { "user-agent": ua } })).text();
const fontUrl = css.match(/url\((https:[^)]+)\)\s*format\(['"]woff2['"]\)/)?.[1];
if (!fontUrl) {
  console.error("Google Fonts javobida woff2 topilmadi:\n", css.slice(0, 500));
  process.exit(1);
}
const buf = Buffer.from(await (await fetch(fontUrl)).arrayBuffer());
mkdirSync(path.join(root, "web/src/assets"), { recursive: true });
writeFileSync(path.join(root, "web/src/assets/material-symbols-subset.woff2"), buf);
writeFileSync(
  path.join(root, "web/src/icons.css"),
  `/* Avtomatik: node tools/icon-subset.mjs (${names.length} ta ikonka). Qo'lda tahrirlamang. */
@font-face {
  font-family: "Material Symbols Outlined";
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url("./assets/material-symbols-subset.woff2") format("woff2");
}
.material-symbols-outlined {
  font-family: "Material Symbols Outlined";
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: "liga";
}
`,
);
writeFileSync(path.join(root, "web/src/assets/icon-names.txt"), names.join("\n") + "\n");
console.log(`✓ ${names.length} ta ikonka, shrift ${(buf.length / 1024).toFixed(0)} KB`);
