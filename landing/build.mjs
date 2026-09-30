// URFON sayti — ichki sahifalarni yigʻadi (bosh sahifa qoʻlda yozilgan urfon_landing.html da qoladi).
//   node build.mjs
// Natija: site/<slug>/index.html, static/site.css (bosh sahifadagi uslublar), sitemap.xml
// Har sahifa: oʻz <title>/description, canonical, Open Graph, JSON-LD (WebPage + Breadcrumb, kerak boʻlsa Course/FAQ).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const SITE = "https://urfon-edu.uz";
const TEL = "+998973757375";
const TEL_TEXT = "+998 97 375 73 75";
const today = new Date().toISOString().slice(0, 10);

/* ─────────── Bosh sahifadagi uslublarni umumiy faylga ajratamiz ─────────── */
const home = readFileSync(join(DIR, "urfon_landing.html"), "utf8");
const styleBlocks = [...home.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const baseCss = styleBlocks.join("\n"); // shrift @font-face + butun dizayn

const pageCss = `
/* ── Ichki sahifalar ── */
.page-hero{background:linear-gradient(180deg,var(--primary-soft),var(--bg));padding:40px 0 32px;border-bottom:1px solid var(--border)}
.crumbs{font-size:14px;color:var(--text-muted);margin-bottom:12px}
.crumbs a{color:var(--primary);text-decoration:none}
.crumbs a:hover{text-decoration:underline}
.page-hero h1{font-size:clamp(28px,5vw,44px);line-height:1.15;margin-bottom:12px}
.page-hero .lead{font-size:clamp(17px,2.2vw,20px);color:var(--text-muted);max-width:62ch}
.page-hero .hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}
.prose{padding:44px 0}
.prose h2{font-size:clamp(22px,3.4vw,30px);margin:34px 0 12px}
.prose h2:first-child{margin-top:0}
.prose h3{font-size:19px;margin:22px 0 8px}
.prose p,.prose li{color:var(--text-muted);max-width:70ch}
.prose p{margin-bottom:12px}
.prose ul{margin:0 0 14px 20px}
.prose li{margin-bottom:6px}
.prose strong,.prose b{color:var(--text)}
.cards{display:grid;gap:16px;margin:18px 0 6px}
@media(min-width:700px){.cards.c2{grid-template-columns:1fr 1fr}.cards.c3{grid-template-columns:repeat(3,1fr)}}
.ucard{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;box-shadow:var(--shadow-md)}
.ucard h3{margin:0 0 6px;font-size:18px;color:var(--text)}
.ucard p{margin:0;font-size:15px}
.ucard .tag{display:inline-block;background:var(--primary-soft);color:var(--primary-hover);font-size:12px;font-weight:800;letter-spacing:.4px;border-radius:999px;padding:4px 10px;margin-bottom:10px}
.steps{counter-reset:s;list-style:none;margin:16px 0 0;padding:0}
.steps li{counter-increment:s;position:relative;padding:0 0 18px 46px;border-left:2px solid var(--border);margin-left:14px}
.steps li:last-child{border-left-color:transparent;padding-bottom:0}
.steps li::before{content:counter(s);position:absolute;left:-16px;top:-2px;width:30px;height:30px;border-radius:50%;background:var(--primary);color:#fff;font-weight:800;display:grid;place-items:center;font-size:14px}
.steps b{display:block;color:var(--text);margin-bottom:2px}
.note{background:var(--primary-soft);border-radius:var(--radius-lg);padding:18px 20px;margin:22px 0}
.note p{margin:0;color:var(--primary-hover)}
.ctaband{background:var(--primary);color:#fff;border-radius:var(--radius-lg);padding:28px 24px;margin:34px 0 0;text-align:center}
.ctaband h2{color:#fff;margin:0 0 8px;font-size:clamp(20px,3vw,26px)}
.ctaband p{color:#D7E1FA;margin:0 auto 18px;max-width:52ch}
.ctaband .btn-accent{margin:0 6px 8px}
.qa{border-top:1px solid var(--border);padding:16px 0}
.qa h3{margin:0 0 6px}
.qa p{margin:0}
.pagelinks{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.pagelinks a{background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:8px 16px;font-size:14px;font-weight:600;color:var(--primary-hover);text-decoration:none}
.pagelinks a:hover{border-color:var(--primary);color:var(--primary)}
.foot-nav{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-bottom:10px}
.foot-nav a{color:var(--text-muted);text-decoration:none;font-size:14px}
.foot-nav a:hover{color:var(--primary)}
`;
writeFileSync(join(DIR, "static", "site.css"), baseCss + pageCss, "utf8");

/* ─────────── Sahifalar ─────────── */
const NAV = [
  { slug: "8-12-yosh", nav: "8–12 yosh" },
  { slug: "13-16-yosh", nav: "13–16 yosh" },
  { slug: "dastur", nav: "Dastur" },
  { slug: "narx", nav: "Narx" },
  { slug: "ustozlar", nav: "Ustozlar" },
  { slug: "aloqa", nav: "Aloqa" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Sahifa qolipi: nav, hero, matn, chaqiruv bloki, footer. */
function layout(p) {
  const url = `${SITE}/${p.slug}/`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url + "#sahifa",
        url,
        name: p.title,
        description: p.description,
        inLanguage: "uz",
        isPartOf: { "@id": `${SITE}/#sayt` },
        about: { "@id": `${SITE}/#markaz` },
        primaryImageOfPage: `${SITE}/static/og-image.jpg`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: SITE + "/" },
          { "@type": "ListItem", position: 2, name: p.crumb ?? p.nav, item: url },
        ],
      },
      ...(p.ld ?? []),
      ...(p.faq?.length
        ? [{ "@type": "FAQPage", "@id": url + "#savollar", mainEntity: p.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }]
        : []),
    ],
  };

  const navLinks = NAV.map((n) => `<li><a href="/${n.slug}/"${n.slug === p.slug ? ' aria-current="page"' : ""}>${n.nav}</a></li>`).join("\n        ");
  const footNav = ["<a href=\"/\">Bosh sahifa</a>", ...NAV.map((n) => `<a href="/${n.slug}/">${n.nav}</a>`)].join("\n      ");

  return `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta name="theme-color" content="#1E4FC2">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/static/favicon.svg" type="image/svg+xml" sizes="any">
<link rel="apple-touch-icon" href="/static/apple-touch-icon.png">
<link rel="manifest" href="/static/site.webmanifest">
<meta property="og:type" content="article">
<meta property="og:site_name" content="URFON oʻquv markazi">
<meta property="og:locale" content="uz_UZ">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:image" content="${SITE}/static/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/static/fonts/manrope-latin-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/static/fonts/manrope-latin-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/static/site.css">
<script type="application/ld+json">
${JSON.stringify(ld, null, 1)}
</script>
</head>
<body>
<header class="nav" id="nav">
  <div class="container nav-inner">
    <a class="logo" href="/">URFON <small>oʻquv markazi</small></a>
    <ul class="nav-links">
        ${navLinks}
    </ul>
    <div class="nav-actions">
      <a class="btn btn-secondary nav-login" href="https://app.urfon-edu.uz/">Kabinetga kirish</a>
      <a class="btn btn-primary nav-cta" href="/#aloqa">Bepul darsga yozilish</a>
    </div>
  </div>
</header>

<main id="top">
<section class="page-hero">
  <div class="container">
    <nav class="crumbs" aria-label="Yoʻl"><a href="/">Bosh sahifa</a> → ${esc(p.crumb ?? p.nav)}</nav>
    <h1>${p.h1}</h1>
    <p class="lead">${p.lead}</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="/#aloqa">Bepul darsga yozilish</a>
      <a class="btn btn-secondary" href="tel:${TEL}">${TEL_TEXT}</a>
    </div>
  </div>
</section>

<section class="prose">
  <div class="container">
${p.body}
${p.faq?.length ? `    <h2>Koʻp beriladigan savollar</h2>\n` + p.faq.map(([q, a]) => `    <div class="qa"><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join("\n") : ""}
    <div class="ctaband">
      <h2>${p.ctaTitle ?? "Dastlabki 3 ta dars — bepul"}</h2>
      <p>${p.ctaText ?? "Farzandingiz oddiy oʻquvchi kabi 3 ta toʻliq darsda qatnashadi. Yoqmasa — hech qanday toʻlov yoʻq."}</p>
      <a class="btn btn-accent" href="/#aloqa">Ariza qoldirish</a>
      <a class="btn btn-secondary" href="tel:${TEL}">Qoʻngʻiroq qilish</a>
    </div>

    <h2>Boshqa sahifalar</h2>
    <div class="pagelinks">
      <a href="/">Bosh sahifa</a>
      ${NAV.filter((n) => n.slug !== p.slug).map((n) => `<a href="/${n.slug}/">${n.nav}</a>`).join("\n      ")}
    </div>
  </div>
</section>
</main>

<footer>
  <div class="container foot" style="flex-direction:column;text-align:center">
    <nav class="foot-nav" aria-label="Sayt boʻlimlari">
      ${footNav}
    </nav>
    <div><b style="color:var(--text)">URFON oʻquv markazi</b> · 8–16 yoshli bolalar va oʻsmirlar uchun ingliz tili</div>
    <div>Kushan shaharchasi, 12-maktab yonida · <a href="tel:${TEL}">${TEL_TEXT}</a></div>
  </div>
</footer>

<div class="sticky-cta">
  <a class="btn btn-secondary" href="tel:${TEL}">Qoʻngʻiroq</a>
  <a class="btn btn-primary" href="/#aloqa">Bepul darsga yozilish</a>
</div>

<script>
const nav=document.getElementById('nav');
addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>8),{passive:true});
</script>
</body>
</html>
`;
}

/* ─────────── Sahifalar matni ─────────── */
const pages = [
  {
    slug: "8-12-yosh",
    nav: "8–12 yosh",
    crumb: "8–12 yosh uchun kurs",
    title: "8–12 yoshli bolalar uchun ingliz tili kursi — URFON, Kushan",
    description:
      "Kushan shaharchasida 8–12 yoshli bolalar uchun ingliz tili: Cambridge Kidʼs Box darsligi, oʻyin va qoʻshiq bilan darslar, guruhda 12–15 bola, kunlik hisobot Telegramda.",
    h1: "8–12 yoshli bolalar uchun ingliz tili kursi",
    lead: "Bu yoshda bola tilni qoida yodlab emas, oʻyin, qoʻshiq va harakat orqali oʻrganadi. Shuning uchun kichik yoshdagilar uchun alohida guruh, alohida darslik va alohida sur'at.",
    body: `    <h2>Darslar qanday oʻtadi</h2>
    <p>Bir dars <b>90 daqiqa</b> davom etadi va bir necha qisqa bosqichga boʻlinadi: takrorlash oʻyini, yangi soʻzlar, qoʻshiq yoki chant, juftlikda gapirish, hikoya va yakuniy oʻyin. Bolaning diqqati bir joyda uzoq turmaydi — shuning uchun faoliyat har 10–15 daqiqada almashadi.</p>
    <p>Darsda bola <b>gapiradi</b>: ustoz savol beradi, bolalar juftlikda mashq qiladi, kichik sahnalar oʻynaladi. Yozish va oʻqish asta-sekin, bola tovushlarni oʻzlashtirgandan keyin qoʻshiladi.</p>

    <h2>Qaysi darslik boʻyicha</h2>
    <p>Kichik guruhlar <b>Cambridge University Press</b> ning <b>Kidʼs Box</b> darsligi boʻyicha oʻqiydi — bu dunyoda eng koʻp qoʻllaniladigan bolalar darsliklaridan biri. Har bir unit oʻz mavzusiga ega: salomlashish, sonlar, ranglar, maktab, oʻyinchoqlar, oila, uy hayvonlari, kiyimlar.</p>
    <div class="cards c3">
      <div class="ucard"><span class="tag">MAVZU</span><h3>Yaqin va tanish</h3><p>Oila, uy, maktab, oʻyinchoq — bola kundalik hayotida koʻradigan narsalar.</p></div>
      <div class="ucard"><span class="tag">USUL</span><h3>Qoʻshiq va chant</h3><p>Ritm bilan aytilgan soʻz uzoq esda qoladi — shuning uchun har unitda qoʻshiq bor.</p></div>
      <div class="ucard"><span class="tag">NATIJA</span><h3>Birinchi jumlalar</h3><p>Bir yil ichida bola oʻzi, oilasi va kuni haqida sodda jumlalar bilan gapira boshlaydi.</p></div>
    </div>

    <h2>Ota-ona nimani koʻradi</h2>
    <p>Har darsdan keyin Telegram botimiz sizga xabar yuboradi: bola darsga keldimi, qaysi mavzu oʻtildi, darsdagi faolligi qanday boʻldi va qanday uy vazifasi berildi. Bundan tashqari <b>ota-ona kabineti</b> bor — davomat, baholar va uy vazifalari tarixi oʻsha yerda saqlanadi.</p>
    <div class="note"><p>Bola yigʻgan «kumush tangalar» — darsga oʻz vaqtida kelgani, yaxshi baho va faolligi uchun. Tangalarni markazdagi sovgʻalarga almashtiradi. Bu kichik yoshdagilar uchun juda kuchli ragʻbat.</p></div>

    <h2>Guruh va jadval</h2>
    <ul>
      <li>Guruhda <b>12–15 bola</b> — har biri gapirishga ulguradi.</li>
      <li>Haftada <b>3 marta</b>, dars 90 daqiqa.</li>
      <li>Vaqtni maktab jadvalingizga qarab tanlaysiz.</li>
      <li>Bola hech narsa bilmasa ham boʻladi — birinchi bosqich aynan noldan boshlaydiganlar uchun.</li>
    </ul>
    <p>13 yoshdan oshgan farzandingiz uchun <a href="/13-16-yosh/">oʻsmirlar guruhi</a> alohida ishlaydi, butun dastur esa <a href="/dastur/">Dastur</a> sahifasida yozilgan.</p>`,
    faq: [
      ["Bolam 8 yoshda, hech narsa bilmaydi — qiyin boʻlmaydimi?", "Yoʻq. Birinchi bosqich alifbo, tovushlar va birinchi soʻzlardan boshlanadi. Bepul darslarda ustoz bolaning darajasini koʻrib, mos guruhni tavsiya qiladi."],
      ["Uy vazifasi koʻpmi?", "Yoʻq. Kichik yoshdagilarga uy vazifasi qisqa va oʻyin shaklida beriladi — odatda 10–15 daqiqalik ish. Maqsad — charchatish emas, darsdagi soʻzlarni mustahkamlash."],
      ["Bola darsga kelmasa, bilamanmi?", "Ha. Bola darsga kelmasa yoki kechiksa, Telegram orqali darhol xabar boradi."],
    ],
    ld: [
      {
        "@type": "Course",
        name: "8–12 yoshli bolalar uchun ingliz tili kursi",
        description: "Cambridge Kidʼs Box darsligi asosida, oʻyin va qoʻshiq usulida ingliz tili. Haftada 3 ta dars, guruhda 12–15 bola.",
        inLanguage: "uz",
        teaches: "Ingliz tili: gapirish, tinglash, sodda oʻqish va yozish",
        provider: { "@id": `${SITE}/#markaz` },
        audience: { "@type": "EducationalAudience", educationalRole: "student", audienceType: "8–12 yoshli bolalar" },
        hasCourseInstance: { "@type": "CourseInstance", courseMode: "onsite", courseWorkload: "PT4H30M", location: { "@id": `${SITE}/#markaz` } },
        offers: { "@type": "Offer", category: "Paid", priceCurrency: "UZS", availability: "https://schema.org/InStock", url: `${SITE}/8-12-yosh/` },
      },
    ],
  },

  {
    slug: "13-16-yosh",
    nav: "13–16 yosh",
    crumb: "13–16 yosh uchun kurs",
    title: "13–16 yoshli oʻsmirlar uchun ingliz tili kursi — URFON, Kushan",
    description:
      "Oʻsmirlar uchun ingliz tili kursi Kushanda: Cambridge Prepare darsligi, suhbat va grammatika, maktab dasturiga yordam, kunlik hisobot ota-onaga.",
    h1: "13–16 yoshli oʻsmirlar uchun ingliz tili kursi",
    lead: "Oʻsmir uchun ingliz tili — kelajakdagi imtihon, universitet va ish. Shuning uchun bu guruhlarda sur'at tezroq, grammatika chuqurroq, mavzular esa ularning hayotiga yaqin.",
    body: `    <h2>Darslar qanday oʻtadi</h2>
    <p>Dars 90 daqiqa. Har darsda toʻrt koʻnikma ustida ishlanadi: <b>tinglash</b> (audio va video), <b>gapirish</b> (juftlikda va guruhda muhokama), <b>oʻqish</b> (matn va vazifalar) va <b>yozish</b> (xat, insho, izoh). Grammatika alohida quruq qoida sifatida emas, mavzu ichida oʻrganiladi.</p>
    <p>Mavzular oʻsmirga qiziq: doʻstlar, sport, texnologiya, sayohat, kelajakdagi kasb. Bola oʻz fikrini ingliz tilida aytishga oʻrganadi — bu maktabdagi darsdan asosiy farqi.</p>

    <h2>Qaysi darslik boʻyicha</h2>
    <p>Oʻsmirlar guruhi <b>Cambridge Prepare</b> darsligi boʻyicha oʻqiydi. Bu darslik aynan 11–16 yoshlilar uchun yozilgan va CEFR darajalariga (A1, A2, B1) aniq bogʻlangan, shuning uchun bola qaysi bosqichda ekanini aniq bilib boradi.</p>
    <div class="cards c3">
      <div class="ucard"><span class="tag">MAKTABGA</span><h3>Darsga yordam</h3><p>Maktabdagi ingliz tili mavzulari mustahkamlanadi — baho ham koʻtariladi.</p></div>
      <div class="ucard"><span class="tag">IMTIHONGA</span><h3>Keyingi qadam</h3><p>Dastur CEFR ga bogʻlangan, kelgusida Multilevel yoki IELTS ga tayyorgarlik osonlashadi.</p></div>
      <div class="ucard"><span class="tag">AMALIYOT</span><h3>Erkin suhbat</h3><p>Har darsda gapirish mashqi — bolaning tili «ochiladi».</p></div>
    </div>

    <h2>Ota-ona nazorati — bosim oʻtkazmasdan</h2>
    <p>Oʻsmir yoshida doimiy nazorat qarshilik tugʻdiradi. Shuning uchun biz tayyor maʼlumot beramiz: har darsdan keyin Telegramga davomat, mavzu, faollik va uy vazifasi haqida xabar keladi. Ota-ona kabinetida esa baholar va oʻzlashtirish grafigi koʻrinadi — «darsga bordingmi?» deb soʻrab yurishga hojat qolmaydi.</p>

    <h2>Guruh va jadval</h2>
    <ul>
      <li>Guruhda <b>12–15 oʻquvchi</b>, yosh boʻyicha ajratilgan.</li>
      <li>Haftada <b>3 marta</b>, dars 90 daqiqa.</li>
      <li>Darajani bepul darslarda ustoz aniqlaydi — nolldan boshlovchilar uchun ham guruh bor.</li>
    </ul>
    <p>Kichik farzandingiz boʻlsa, <a href="/8-12-yosh/">8–12 yosh guruhi</a> alohida; bosqichlar haqida <a href="/dastur/">Dastur</a> sahifasida oʻqing.</p>`,
    faq: [
      ["Farzandim maktabda ingliz tilini oʻqiydi, yana kerakmi?", "Maktabda asosan yozma vazifa va grammatika boʻladi, gapirish mashqi kam. Bizda har darsda suhbat bor — maktab bahosi ham, tili ham shundan yaxshilanadi."],
      ["Oʻsmir uchun dars zerikarli boʻlmaydimi?", "Mavzular ular qiziqadigan narsalar: sport, texnologiya, sayohat, kasb. Dars muhokama va juftlikdagi ishga qurilgan, quruq yodlash yoʻq."],
      ["IELTS ga tayyorlaysizmi?", "Hozirgi dastur CEFR boʻyicha B1 gacha olib boradi. Bu — Multilevel va IELTS ga tayyorgarlik uchun mustahkam poydevor."],
    ],
    ld: [
      {
        "@type": "Course",
        name: "13–16 yoshli oʻsmirlar uchun ingliz tili kursi",
        description: "Cambridge Prepare darsligi asosida oʻsmirlar uchun ingliz tili: gapirish, grammatika, tinglash va yozish. Haftada 3 ta dars.",
        inLanguage: "uz",
        teaches: "Ingliz tili: gapirish, tinglash, oʻqish, yozish va grammatika",
        educationalLevel: "A1–B1 (CEFR)",
        provider: { "@id": `${SITE}/#markaz` },
        audience: { "@type": "EducationalAudience", educationalRole: "student", audienceType: "13–16 yoshli oʻsmirlar" },
        hasCourseInstance: { "@type": "CourseInstance", courseMode: "onsite", courseWorkload: "PT4H30M", location: { "@id": `${SITE}/#markaz` } },
        offers: { "@type": "Offer", category: "Paid", priceCurrency: "UZS", availability: "https://schema.org/InStock", url: `${SITE}/13-16-yosh/` },
      },
    ],
  },

  {
    slug: "dastur",
    nav: "Dastur",
    crumb: "Oʻquv dasturi",
    title: "Oʻquv dasturi — 6 bosqich, Cambridge darsliklari | URFON",
    description:
      "URFON oʻquv dasturi: 6 bosqich, har biri 2,5–3 oy. Cambridge Kidʼs Box va Prepare darsliklari, haftada 3 ta 90 daqiqalik dars, har dars uchun tayyor reja.",
    h1: "Oʻquv dasturi: oddiy soʻzlardan erkin suhbatgacha",
    lead: "Dastur 6 bosqichdan iborat. Har bosqich 2,5–3 oy (10–12 hafta) davom etadi. Bola oʻz darajasidan boshlaydi va har bosqichda aniq natijaga chiqadi.",
    body: `    <h2>Bosqichlar</h2>
    <div class="cards c2">
      <div class="ucard"><span class="tag">1-BOSQICH</span><h3>Boshlangʻich qadam</h3><p>Alifbo, tovushlar, birinchi soʻzlar va sodda jumlalar. Nolldan boshlaydiganlar uchun.</p></div>
      <div class="ucard"><span class="tag">2-BOSQICH</span><h3>Tanishuv va oila</h3><p>Oʻzi va atrofi haqida gapirish, kundalik iboralar, sonlar va ranglar.</p></div>
      <div class="ucard"><span class="tag">3-BOSQICH</span><h3>Oʻqish va yozish</h3><p>Qisqa matnlarni oʻqish, asosiy grammatika bilan yozish.</p></div>
      <div class="ucard"><span class="tag">4-BOSQICH</span><h3>Kundalik muloqot</h3><p>Maktab, sayohat va qiziqishlar mavzusida suhbat.</p></div>
      <div class="ucard"><span class="tag">5-BOSQICH</span><h3>Ishonchli soʻzlashuv</h3><p>Murakkabroq grammatika, fikrni erkin bayon qilish.</p></div>
      <div class="ucard"><span class="tag">6-BOSQICH</span><h3>Erkin suhbat</h3><p>Tengdoshlari bilan ingliz tilida bemalol muloqot.</p></div>
    </div>

    <h2>Darsliklar</h2>
    <p>Markaz <b>Cambridge University Press</b> darsliklari boʻyicha ishlaydi:</p>
    <ul>
      <li><b>Kidʼs Box</b> — 8–12 yoshli bolalar uchun: oʻyin, qoʻshiq va hikoyaga qurilgan.</li>
      <li><b>Prepare</b> — 13–16 yoshli oʻsmirlar uchun: CEFR darajalariga aniq bogʻlangan zamonaviy darslik.</li>
    </ul>
    <p>Har ikkala darslik ham dunyo boʻyicha million nusxada ishlatiladi va mustaqil ekspertlar tomonidan tekshirilgan. Bu — dastur «oʻylab topilgan» emas, sinovdan oʻtgan degani.</p>

    <h2>Har bir dars rejalashtirilgan</h2>
    <p>Ustoz darsga «shu mavzuni oʻtaman» deb emas, <b>tayyor reja</b> bilan kiradi: darsning maqsadi, yangi soʻzlar roʻyxati, har bosqichga ajratilgan daqiqalar, uy vazifasi. Rejalar platformamizda saqlanadi, shuning uchun bir guruh kasallik yoki bayram sababli dars qoldirsa ham, dastur izidan chiqmaydi.</p>
    <div class="note"><p>Bir hafta = bir unit = 3 ta dars. Shu tartib saqlangani uchun bola qaysi mavzuda ekanini ota-ona ham, ustoz ham aniq biladi.</p></div>

    <h2>Baholash va oʻsish</h2>
    <ul>
      <li>Har darsda <b>faollik</b> baholanadi va uy vazifasi tekshiriladi.</li>
      <li>Bosqich oxirida <b>yakuniy ish</b> — bola keyingi bosqichga tayyormi yoki yoʻqmi, shundan koʻrinadi.</li>
      <li>Natijalar ota-ona kabinetida grafik shaklida saqlanadi.</li>
    </ul>
    <p>Yosh guruhlari boʻyicha tafsilotlar: <a href="/8-12-yosh/">8–12 yosh</a> va <a href="/13-16-yosh/">13–16 yosh</a>.</p>`,
    faq: [
      ["Bir bosqich qancha davom etadi?", "Har bir bosqich 2,5–3 oy (10–12 hafta). Jami 6 ta bosqich bor."],
      ["Bola qaysi bosqichdan boshlaydi?", "Buni bepul darslarda ustoz aniqlaydi. Hech narsa bilmasa — birinchi bosqichdan, allaqachon bilsa — mos guruhdan boshlaydi."],
      ["Dars qoldirsa, ortda qolmaydimi?", "Har darsning rejasi va materiallari platformada saqlanadi. Ustoz qoldirilgan mavzuni koʻrsatib beradi, uy vazifasi ham oʻsha yerda turadi."],
    ],
  },

  {
    slug: "narx",
    nav: "Narx",
    crumb: "Narx va toʻlov",
    title: "Kurs narxi va toʻlov tartibi — URFON oʻquv markazi",
    description:
      "URFON da dastlabki 3 ta dars bepul. Toʻlov oylik, guruh va yoshga qarab belgilanadi — aniq summani qoʻngʻiroq orqali ayting. Toʻlov tarixi ota-ona kabinetida koʻrinadi.",
    h1: "Narx va toʻlov tartibi",
    lead: "Aniq summa guruh, yosh toifasi va jadvalga qarab belgilanadi. Eng toʻgʻrisi — qoʻngʻiroq qiling yoki ariza qoldiring, biz sizga mos guruhni va uning narxini aytamiz.",
    body: `    <h2>Avval — 3 ta bepul dars</h2>
    <p>Yangi kelgan har bir bola <b>3 ta toʻliq darsda bepul</b> qatnashadi. Shu davrda hech qanday toʻlov olinmaydi va hech qanday majburiyat yoʻq. Uchinchi darsdan soʻng qaror qilasiz: davom etamizmi yoki yoʻq.</p>
    <p>Bu bizning shartimiz emas, ota-onaning huquqi: avval koʻrasiz — ustozni, guruhni, bolaning kayfiyatini — keyin toʻlaysiz.</p>

    <h2>Toʻlovga nimalar kiradi</h2>
    <div class="cards c2">
      <div class="ucard"><h3>Haftada 3 ta dars</h3><p>Har biri 90 daqiqa, kichik guruhda (12–15 oʻquvchi).</p></div>
      <div class="ucard"><h3>Kunlik hisobot</h3><p>Telegram bot orqali davomat, mavzu, faollik va uy vazifasi.</p></div>
      <div class="ucard"><h3>Ota-ona kabineti</h3><p>Baholar, davomat tarixi, uy vazifalari va oʻquv materiallari.</p></div>
      <div class="ucard"><h3>Oʻquvchi kabineti</h3><p>Vazifalarni topshirish, lugʻat, yutuqlar va kumush tangalar.</p></div>
    </div>

    <h2>Toʻlov qanday amalga oshiriladi</h2>
    <ol class="steps">
      <li><b>Oylik hisob</b><span>Har oy boshida oylik toʻlov hisoblanadi va ota-ona kabinetida koʻrinadi.</span></li>
      <li><b>Qabul qilish</b><span>Toʻlov markazda qabul qilinadi; har toʻlov tizimga kiritiladi.</span></li>
      <li><b>Kvitansiya</b><span>Toʻlov tarixi va kvitansiya ota-ona kabinetida saqlanadi — «toʻladimmi yoʻqmi» degan savol qolmaydi.</span></li>
    </ol>
    <div class="note"><p>Qarzdorlik yoki toʻlov muddati haqida ham Telegram orqali eslatma keladi — kutilmagan hol boʻlmaydi.</p></div>

    <h2>Nega narx saytda yozilmagan?</h2>
    <p>Chunki u guruhga bogʻliq: yosh toifasi, dars vaqti va guruhdagi oʻrinlar soni har xil. Sizga mos boʻlmagan raqamni koʻrsatgandan koʻra, qoʻngʻiroq qilib aniq aytganimiz halolroq. Qoʻngʻiroq bepul va hech narsaga majburlamaydi.</p>`,
    ctaTitle: "Narxni bilish uchun qoʻngʻiroq qiling",
    ctaText: "Ish vaqtida 15 daqiqa ichida javob beramiz. Yoki ariza qoldiring — oʻzimiz bogʻlanamiz.",
    faq: [
      ["Bepul darslar uchun keyin toʻlash kerakmi?", "Yoʻq. Uchta dars butunlay bepul. Davom etmasangiz ham hech qanday toʻlov yoʻq."],
      ["Toʻlovni oyiga bir marta qilamanmi?", "Ha, hisob oylik. Muddati va summasi ota-ona kabinetida koʻrinadi, eslatma Telegramga keladi."],
      ["Bola kasal boʻlib, darsga kelolmasa-chi?", "Ustozni ogohlantirsangiz, qoldirilgan mavzu va uy vazifasi kabinetda turadi. Bunday holatlar guruh boʻyicha alohida kelishiladi."],
    ],
  },

  {
    slug: "ustozlar",
    nav: "Ustozlar",
    crumb: "Ustozlarimiz",
    title: "Ustozlarimiz — magistr darajali ingliz tili oʻqituvchilari | URFON",
    description:
      "URFON da darslarni magistr darajasiga ega ingliz tili oʻqituvchilari olib boradi. Har dars tayyor reja asosida, har bola nazoratda, natija ota-onaga har kuni yetkaziladi.",
    h1: "Ustozlarimiz",
    lead: "Markazda darslarni ingliz tili boʻyicha magistr darajasiga ega oʻqituvchilar olib boradi. Ular uchun asosiy oʻlchov — bolaning gapira olishi.",
    body: `    <h2>Qanday ishlaymiz</h2>
    <div class="cards c2">
      <div class="ucard"><h3>Tayyor reja bilan</h3><p>Ustoz har darsga aniq reja bilan kiradi: maqsad, yangi soʻzlar, bosqichlar va daqiqalar, uy vazifasi. Dars «koʻngilga kelganicha» oʻtmaydi.</p></div>
      <div class="ucard"><h3>Har bola nazoratda</h3><p>Guruh 12–15 kishidan oshmaydi. Ustoz har darsda kimning gapirgani, kimning jim qolganini belgilab boradi.</p></div>
      <div class="ucard"><h3>Kundalik hisobot</h3><p>Dars tugagach ustoz davomat, faollik va uy vazifasini tizimga kiritadi — ota-onaga xabar shundan keyin avtomatik ketadi.</p></div>
      <div class="ucard"><h3>Ragʻbat bilan</h3><p>Yaxshi baho va faollik uchun bola kumush tanga oladi. Bu bolani baho bilan qoʻrqitmasdan, oldinga undaydigan tizim.</p></div>
    </div>

    <h2>Nimaga eʼtibor beramiz</h2>
    <ul>
      <li><b>Bola gapirsin.</b> Dars vaqtining katta qismi ustozning gapirishiga emas, bolalarning mashqiga ketadi.</li>
      <li><b>Xato — tabiiy.</b> Bolani xato uchun uyaltirmaymiz; xato tuzatiladi, lekin gapirish toʻxtatilmaydi.</li>
      <li><b>Har kimning sur'ati.</b> Sekinroq oʻzlashtirayotgan bola bilan alohida ishlanadi, tez oʻzlashtiruvchiga qoʻshimcha vazifa beriladi.</li>
      <li><b>Ota-ona — hamkor.</b> Bolada muammo koʻrinsa, oy oxirini kutmasdan ota-onaga aytamiz.</li>
    </ul>

    <div class="note"><p>Ustozlarimiz ism-sharifi va fotosuratlari maxfiylik sababli saytda berilmagan. Markazga kelganingizda ustoz bilan bevosita tanishasiz — bepul darslar aynan shu uchun ham qulay.</p></div>

    <h2>Ustoz boʻlib ishlashni istaysizmi?</h2>
    <p>Markaz kengaymoqda. Ingliz tili boʻyicha maʼlumoti va bolalar bilan ishlash tajribasi bor mutaxassislar <a href="tel:${TEL}">${TEL_TEXT}</a> raqamiga qoʻngʻiroq qilishlari mumkin.</p>`,
    ctaTitle: "Ustoz bilan tanishish uchun keling",
    ctaText: "3 ta bepul dars — bu bir vaqtning oʻzida ustoz, guruh va markaz bilan tanishuv.",
  },

  {
    slug: "aloqa",
    nav: "Aloqa",
    crumb: "Manzil va aloqa",
    title: "Manzil va aloqa — URFON oʻquv markazi, Kushan shaharchasi",
    description:
      "URFON oʻquv markazi: Kushan shaharchasi, 12-maktab yonida. Telefon +998 97 375 73 75. Xaritada koʻrsatilgan, bepul darsga yozilish uchun ariza qoldiring.",
    h1: "Manzil va aloqa",
    lead: "Markaz Kushan shaharchasida, 12-maktab yonida joylashgan — bolangiz maktabdan keyin oʻzi kelib-ketishi mumkin.",
    body: `    <h2>Qanday bogʻlanish mumkin</h2>
    <div class="cards c2">
      <div class="ucard"><h3>Telefon</h3><p><a href="tel:${TEL}">${TEL_TEXT}</a> — ish vaqtida 15 daqiqa ichida javob beramiz.</p></div>
      <div class="ucard"><h3>Manzil</h3><p>Kushan shaharchasi, 12-maktab yonida. <a href="https://maps.app.goo.gl/aNiExNPT5S4bi8gHA" target="_blank" rel="noopener">Xaritada ochish</a>.</p></div>
      <div class="ucard"><h3>Ariza</h3><p>Bosh sahifadagi <a href="/#aloqa">formani</a> toʻldiring — oʻzimiz qoʻngʻiroq qilamiz.</p></div>
      <div class="ucard"><h3>Kabinet</h3><p>Oʻquvchi va ota-onalar uchun: <a href="https://app.urfon-edu.uz/">app.urfon-edu.uz</a></p></div>
    </div>

    <h2>Ish vaqti</h2>
    <p>Dushanbadan shanbagacha, 09:00 dan 19:00 gacha. Dars vaqtlari guruhga qarab belgilanadi — maktab jadvalingizga moslashtiramiz.</p>

    <h2>Birinchi marta kelayotgan boʻlsangiz</h2>
    <ol class="steps">
      <li><b>Qoʻngʻiroq qiling yoki ariza qoldiring</b><span>Bolaning yoshi va maktab jadvalini soʻraymiz.</span></li>
      <li><b>Mos guruhni tanlaymiz</b><span>Yosh va daraja boʻyicha — 8–12 yoki 13–16 yosh guruhi.</span></li>
      <li><b>3 ta bepul darsga kelasiz</b><span>Bola oddiy oʻquvchi kabi qatnashadi, siz natijani Telegramda koʻrasiz.</span></li>
      <li><b>Qaror qilasiz</b><span>Yoqsa — davom etamiz, yoqmasa — hech qanday toʻlov yoʻq.</span></li>
    </ol>`,
    ctaTitle: "Bepul darsga yozilish",
    ctaText: "Formani qoldiring yoki qoʻngʻiroq qiling — mos guruh va vaqtni birga tanlaymiz.",
    ld: [
      {
        "@type": "ContactPage",
        "@id": `${SITE}/aloqa/#aloqa`,
        url: `${SITE}/aloqa/`,
        about: { "@id": `${SITE}/#markaz` },
      },
    ],
  },
];

/* ─────────── Yozish ─────────── */
for (const p of pages) {
  const dir = join(DIR, "site", p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), layout(p), "utf8");
  console.log("✓ /" + p.slug + "/");
}

const urls = [{ loc: SITE + "/", pri: "1.0", freq: "weekly" }, ...pages.map((p) => ({ loc: `${SITE}/${p.slug}/`, pri: "0.8", freq: "monthly" }))];
writeFileSync(
  join(DIR, "static", "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`).join("\n") +
    "\n</urlset>\n",
  "utf8",
);
console.log(`✓ sitemap.xml (${urls.length} manzil) · site.css (${Math.round((baseCss + pageCss).length / 1024)} KB)`);
