// Ishlayotgan ilova sahifasining skrinshoti (Chrome DevTools Protocol, tashqi paketlarsiz; Node 22+).
// Foydalanish:
//   node tools/shot.mjs <url> <chiqish.png> [kenglik=1440] [maxBalandlik=4000]
//   SHOT_LOGIN=+998901000001 SHOT_PASSWORD=urfon2024 node tools/shot.mjs http://localhost:5174/admin out.png
// Login berilsa: avval <origin>/login ochiladi, sahifa ichida POST /api/auth/login (cookie o'rnatiladi),
// keyin maqsadli URL ochiladi (ilova refresh cookie orqali sessiyani tiklaydi).
// Kenglik < 640 bo'lsa mobil emulyatsiya yoqiladi. Konsol xatolari chiqishga yoziladi.
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, output, widthArg = "1440", maxHArg = "4000"] = process.argv.slice(2);
if (!url || !output) {
  console.error("Foydalanish: node shot.mjs <url> <chiqish.png> [kenglik] [maxBalandlik]");
  process.exit(2);
}
const width = Number(widthArg);
const maxHeight = Number(maxHArg);
const mobile = width < 640;
const viewH = mobile ? 844 : 900;
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "urfon-shot-"));
const login = process.env.SHOT_LOGIN;
const password = process.env.SHOT_PASSWORD;
const waitMs = Number(process.env.SHOT_WAIT || 2500);

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${viewH}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targetWs() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome DevTools ulanmadi");
}

try {
  const ws = new WebSocket(await targetWs());
  await new Promise((r, j) => {
    ws.onopen = r;
    ws.onerror = j;
  });
  let id = 0;
  const pending = new Map();
  let events = [];
  const errors = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method) {
      events.push(msg.method);
      if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
      if (msg.method === "Runtime.consoleAPICalled" && (msg.params.type === "error" || msg.params.type === "warning")) {
        errors.push(`[console.${msg.params.type}] ` + msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 400));
      }
    }
  };
  const send = (method, params = {}) =>
    new Promise((r) => {
      const n = ++id;
      pending.set(n, r);
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const navigate = async (u) => {
    events = [];
    await send("Page.navigate", { url: u });
    for (let i = 0; i < 150 && !events.includes("Page.loadEventFired"); i++) await sleep(100);
  };

  await send("Page.enable");
  await send("Runtime.enable");

  // SHOT_MOCK=mock.json → { "/api/auth/refresh": {...}, "/api/me/nav-badges": {...} } — mos yo'l so'rovlari soxta JSON bilan javob oladi
  // (backend seed'siz rol qobiqlarini tekshirish uchun). Qolgan so'rovlar backendga o'tadi.
  if (process.env.SHOT_MOCK) {
    const mocks = JSON.parse(readFileSync(process.env.SHOT_MOCK, "utf8"));
    ws.addEventListener("message", (m) => {
      const msg = JSON.parse(m.data);
      if (msg.method !== "Fetch.requestPaused") return;
      const path = new URL(msg.params.request.url).pathname;
      const body = mocks[path];
      if (body === undefined) {
        send("Fetch.continueRequest", { requestId: msg.params.requestId });
        return;
      }
      send("Fetch.fulfillRequest", {
        requestId: msg.params.requestId,
        responseCode: 200,
        responseHeaders: [{ name: "Content-Type", value: "application/json" }],
        body: Buffer.from(JSON.stringify(body)).toString("base64"),
      });
    });
    await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*", requestStage: "Request" }] });
  }
  await send("Emulation.setDeviceMetricsOverride", { width, height: viewH, deviceScaleFactor: 1, mobile });
  if (mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true });

  if (login && password) {
    const origin = new URL(url).origin;
    await navigate(`${origin}/login`);
    const res = await send("Runtime.evaluate", {
      expression: `fetch('/api/auth/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(${JSON.stringify({ login, password })}) }).then(async r => r.status + ' ' + (await r.text()).slice(0, 160))`,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log("login:", res.result?.result?.value);
  }

  await navigate(url);
  await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true });
  await sleep(waitMs);

  const metrics = await send("Runtime.evaluate", {
    expression: "JSON.stringify({ h: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight), sw: document.documentElement.scrollWidth, path: location.pathname })",
    returnByValue: true,
  });
  const info = JSON.parse(metrics.result.result.value);
  const height = Math.min(Math.max(viewH, info.h), maxHeight);
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await sleep(600);
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(output, Buffer.from(shot.result.data, "base64"));
  console.log(`${output} ${width}x${height} path=${info.path} scrollWidth=${info.sw}${info.sw > width ? " (!! gorizontal skroll)" : ""}`);
  if (errors.length) console.log("Konsol xatolari:\n  " + errors.join("\n  "));
  ws.close();
} finally {
  chrome.kill();
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
