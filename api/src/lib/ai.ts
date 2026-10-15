// AI matn yozuvchi — provayderdan mustaqil yupqa qatlam.
// Qaysi kalit .env da boʻlsa, oʻsha ishlatiladi: GEMINI_API_KEY → Gemini, ANTHROPIC_API_KEY → Claude.
// Kalit boʻlmasa aiJson() null qaytaradi va chaqiruvchi zaxira shablonga oʻtadi (hech narsa toʻxtamaydi).
import { config } from "../config.js";

export type AiProvider = "gemini" | "claude" | "none";

export const aiProvider: AiProvider = config.GEMINI_API_KEY ? "gemini" : config.ANTHROPIC_API_KEY ? "claude" : "none";

/** Javob matnidan JSON obyektni ajratib oladi (model qavs ichida izoh yozsa ham ishlaydi). */
function parseJson<T>(text: string): T | null {
  const i = text.indexOf("{");
  const j = text.lastIndexOf("}");
  if (i < 0 || j <= i) return null;
  try {
    return JSON.parse(text.slice(i, j + 1)) as T;
  } catch {
    return null;
  }
}

async function gemini(system: string, user: string, signal: AbortSignal): Promise<string> {
  const model = config.GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", "x-goog-api-key": config.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.6, maxOutputTokens: 1200 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

async function claude(system: string, user: string, signal: AbortSignal): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", "x-api-key": config.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: config.CLAUDE_MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { content?: { type: string; text?: string }[]; stop_reason?: string };
  if (json.stop_reason === "refusal") return "";
  return (json.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
}

/**
 * Modeldan JSON javob soʻraydi. Kalit yoʻq boʻlsa — null.
 * Xatolarni oʻzi yutmaydi: chaqiruvchi try/catch bilan zaxira matnga oʻtadi.
 */
export async function aiJson<T>(system: string, user: string, timeoutMs = 20_000): Promise<T | null> {
  if (aiProvider === "none") return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const text = aiProvider === "gemini" ? await gemini(system, user, ctl.signal) : await claude(system, user, ctl.signal);
    return text.trim() ? parseJson<T>(text) : null;
  } finally {
    clearTimeout(timer);
  }
}
