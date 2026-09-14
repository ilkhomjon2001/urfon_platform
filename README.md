# URFON platformasi

URFON — oʻquv markazi uchun yagona platforma. Unda toʻrtta kabinet bor: admin, ustoz, ota-ona va oʻquvchi. Kabinetlarga qoʻshimcha ravishda:

- ota-onalarga kunlik va oylik hisobot hamda bildirishnomalar yuboradigan **Telegram bot** ishlaydi;
- **turniket integratsiyasi** davomatni avtomatik belgilaydi;
- **audit jurnali** har bir muhim oʻzgarishni qayd etadi.

## Stek

| Qism | Texnologiyalar |
|---|---|
| `api/` | Node.js 22+ · Fastify 5 · Prisma 6 · PostgreSQL 17 · Zod · grammY (Telegram) · croner (rejali ishlar) |
| `web/` | React 19 · Vite 6 · Tailwind 3 (URFON dizayn tokenlari) · TanStack Query |
| Deploy | Docker (multi-stage) · docker compose · Caddy (avtomatik HTTPS) |

API va web bitta Node jarayonida ishlaydi: productionʼda `api` `web/dist` ni ham tarqatadi. Telegram bot va rejali ishlar ham shu jarayon ichida.

## Lokal ishga tushirish

```bash
cd platforma
npm install
cp .env.example api/.env        # DATABASE_URL va JWT_SECRET (kamida 32 belgi) ni tekshiring

npm run db:start                # alohida terminalda: embedded PostgreSQL, localhost:5433 (Docker shart emas)

cd api
npx prisma migrate deploy       # jadvallarni yaratadi
npm run db:seed                 # demo maʼlumotlar (KANON hikoyasi)
cd ..

npm run dev:api                 # http://localhost:3000
npm run dev:web                 # http://localhost:5173 (APIʼga proxy)
```

`api` ishga tushganda `.env` faylini joriy papkadan qidiradi. `npm run dev:api` uchun bu `api/.env`. Docker compose esa `platforma/.env` dan oʻqiydi.

### Demo akkauntlar

Demo maʼlumotlar KANON hikoyasiga asoslangan (`design-system/KANON.md`). Sanalar seed ishga tushirilgan kunga moslanadi: KANON dagi "bugun" (24-may) oxirgi Du/Cho/Ju kuniga tushadi (`SEED_TODAY=YYYY-MM-DD` bilan oʻzgartirish mumkin). Barcha demo akkauntlarning paroli `.env` dagi `DEMO_PASSWORD` (standart qiymati `urfon2024`). **Productionʼda demo seed ishlatilmaydi** — `db:seed:prod` yoki `admin:create`.

| Rol | Kim | Login |
|---|---|---|
| Admin | Sanjar Rahimov, Bosh administrator | `+998901000001` |
| Ustoz | Alisher Qosimov, IELTS katta ustozi | `+998901000002` |
| Ota-ona | Rustam Valiyev (Alining otasi) | `+998901234567` |
| Oʻquvchi | Ali Valiyev, IELTS Foundation #3 | `ST-8492` |

Toʻliq roʻyxat seed skriptida (`api/prisma/seed/`) turadi. `npm run db:seed` tugaganda ham roʻyxat konsolga chiqariladi.

### Bir nechta dasturchi bir vaqtda ishlasa

Har kim oʻz porti va oʻz bazasidan foydalanadi:

```bash
PORT=3002 DATABASE_URL=postgresql://urfon:urfon@localhost:5433/urfon_<nom> npm run dev -w api
WEB_PORT=5174 VITE_API_PROXY=http://localhost:3002 npm run dev -w web
```

3000 va 5173 portlari lead uchun ajratilgan. Batafsil: `docs/API-KONVENSIYA.md`.

## Skriptlar

| Buyruq | Vazifasi |
|---|---|
| `npm run db:start` | Lokal PostgreSQL (embedded, :5433) |
| `npm run dev:api` / `npm run dev:web` | Ishlab chiqish serverlari |
| `npm run build` | `api/dist` (tsup) + `web/dist` (vite) |
| `npm run start` | Production server (`node api/dist/index.js`) |
| `npm run typecheck` | api va web uchun `tsc --noEmit` |
| `npm run check:uz` | UI/API matnlarida ASCII apostrof va taqiqlangan atamalarni tekshirish |
| `npm run db:migrate -w api` | Yangi migratsiya yaratish (sxema oʻzgarganda, faqat lead) |
| `npm run db:deploy -w api` | Migratsiyalarni qoʻllash |
| `npm run db:seed -w api` | Demo maʼlumotlar |
| `npm run db:seed:prod -w api` | Production uchun boshlangʻich maʼlumotlar |
| `npm run admin:create -w api` | Administrator yaratish (`ADMIN_LOGIN`, `ADMIN_PASSWORD`, `ADMIN_NAME`) |
| `npm run job -w api -- <ish> [YYYY-MM-DD]` | Rejali ishni qoʻlda ishga tushirish: `daily-report`, `monthly-report`, `payments`, `cleanup`, `notifications` |
| `npm run bot:selftest -w api` | Bot, bildirishnoma worker, turniket va rejali ishlar uchun oflayn test. Alohida bazada ishlating. |

## Tuzilma

```
platforma/
  api/
    prisma/schema.prisma      yagona maʼlumot modeli (+ migrations/, seed/)
    src/app.ts                Fastify plaginlari va routeʼlar
    src/routes/               auth, me, files, messages, integrations (turniket), admin|teacher|parent|student/
    src/lib/                  audit, access (RBAC koʻlami), coins, notify (outbox), dates (Toshkent vaqti) …
    src/bot/                  Telegram bot (grammY): menyular, ulash, bildirishnoma worker
    src/jobs/                 rejali ishlar: kunlik/oylik hisobot, toʻlov muddatlari, tozalash
    scripts/                  create-admin, run-job, bot-selftest
  web/                        React ilova (rol kabinetlari)
  deploy/                     Caddyfile, backup.sh, README-DEPLOY.md
  docs/API-KONVENSIYA.md      API va sahifa yozish qoidalari
  Dockerfile, docker-compose.yml
```

## Asosiy tamoyillar

- **Rol va koʻlam.** Ustoz faqat oʻz guruhlarini, ota-ona faqat oʻz farzandini koʻradi. Tekshiruvlar `src/lib/access.ts` da.
- **Audit.** Baho, toʻlov, davomat, biriktirish kabi oʻzgarishlar `AuditLog` ga yoziladi. Jurnaldagi yozuvlar oʻzgartirilmaydi va oʻchirilmaydi (Postgres trigger + hash zanjiri).
- **Bildirishnomalar outbox orqali ishlaydi.** Servislar `notify()` yoki `notifyParents()` ni chaqiradi. Bot worker xabarlarni Telegramga yuboradi, ilova ichidagi qoʻngʻiroqcha esa ularni oʻsha jadvaldan oʻqiydi.
- **Gamifikatsiya bosimsiz** (KANON §8). Faqat kumush tanga ishlatiladi. Markaz boʻyicha reyting yoʻq, bolalar bir-biri bilan solishtirilmaydi.
- **Til.** Oʻzbek lotin yozuvi ishlatiladi: `oʻ`/`gʻ` uchun U+02BB, tutuq belgisi uchun U+02BC. Pul `850 000 soʻm`, sana "24-may, 2024" koʻrinishida.

## Hujjatlar

- `docs/API-KONVENSIYA.md` — API va sahifa yozish qoidalari.
- `deploy/README-DEPLOY.md` — serverga oʻrnatish, Telegram bot, turniket, zaxira nusxa va yangilash.
- `../design-system/KANON.md` — dizayn, til va namuna maʼlumotlar kanoni.
- `../urfon_TOPSHIRIQ.md` — mahsulot topshirigʻi.
