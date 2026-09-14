import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

// .env faqat lokalda; production'da muhit o'zgaruvchilari tashqaridan beriladi.
for (const p of [path.resolve(".env"), path.resolve("api/.env")]) {
  if (existsSync(p)) {
    process.loadEnvFile(p);
    break;
  }
}

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET kamida 32 belgi boʻlishi kerak"),
  APP_ORIGIN: z.string().default("http://localhost:5173"),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_UPLOAD_MB: z.coerce.number().default(25),
  WEB_DIST: z.string().optional(), // production: web/dist ni shu server beradi
  TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
  TELEGRAM_BOT_USERNAME: z.string().optional().default("urfon_bot"),
  TURNSTILE_API_KEY: z.string().optional().default(""), // bo'sh bo'lsa /api/integrations/turnstile → 404
  TZ_OFFSET: z.string().default("+05:00"), // Asia/Tashkent
  // Ishonchli proxy manzillari (proxy-addr formati). API to'g'ridan-to'g'ri internetga ochilsa: "false"
  TRUST_PROXY: z
    .string()
    .default("loopback, linklocal, uniquelocal")
    .transform((v) => (v === "false" ? false : v === "true" ? true : v)),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Muhit oʻzgaruvchilari notoʻgʻri:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}
// .env.example / dev qiymati bilan production'da ishga tushmaslik: ma'lum sir bilan har kim admin JWT soxtalashtira oladi
if (parsed.data.NODE_ENV === "production" && /change-me|dev-only|example/i.test(parsed.data.JWT_SECRET)) {
  console.error("JWT_SECRET namunaviy qiymatda — production uchun tasodifiy sir yarating: openssl rand -base64 48");
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === "production",
  // Domen/HTTPS bo'lmasa (http://SERVER_IP) Secure cookie va HSTS o'chiriladi — aks holda brauzer sessiyani saqlamaydi
  secureCookies: parsed.data.APP_ORIGIN.startsWith("https://"),
  uploadDir: path.resolve(parsed.data.UPLOAD_DIR),
  accessTtlSec: 15 * 60,
  refreshTtlDays: 30,
  refreshCookie: "urfon_rt",
};
