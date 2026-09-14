# API va sahifa yozish konvensiyasi (agentlar va dasturchilar uchun)

## Tuzilma
```
platforma/
  api/                       Fastify 5 + Prisma 6 (PostgreSQL) + Zod 3
    prisma/schema.prisma     YAGONA ma'lumot modeli (o'zgartirish faqat lead orqali)
    src/app.ts               plaginlar va route ro'yxati
    src/lib/                 umumiy xizmatlar (quyida)
    src/config/gamification.ts  tanga qoidalari — yagona joy
    src/routes/auth.ts|me.ts|files.ts|messages.ts   umumiy
    src/routes/<rol>/*.ts    rolga ajratilgan API (/api/admin, /api/teacher, /api/parent, /api/student)
  web/                       React 19 + Vite 6 + Tailwind 3 (tailwind.urfon preset)
```

## Rol API'lari
- `/api/admin/*` faqat ADMIN, `/api/teacher/*` faqat TEACHER, `/api/parent/*` faqat PARENT, `/api/student/*` faqat STUDENT — guard `routes/<rol>/index.ts` da, ichki fayllarda qayta yozish shart emas.
- **Ko'lam (scope) — majburiy**: rol guard'i yetarli emas. Har bir handler ma'lumotga tegishdan oldin `src/lib/access.ts` dagi tekshiruvni chaqiradi:
  - ustoz: `assertTeacherGroup(req.auth.userId, groupId)`, `assertTeacherLesson`, `assertTeacherHomework`, `assertTeacherSubmission`, `assertTeacherStudent`, `teacherGroupIds`
  - ota-ona: `assertParentChild(req.auth.userId, studentId)` — har bir so'rovda `?studentId=` bo'ladi (sidebar'dagi tanlangan farzand); `parentChildIds`
  - o'quvchi: faqat `req.auth.userId` bo'yicha; `studentGroupIds`, `assertStudentInGroup`
  - ruxsat yo'q yoki topilmadi → `404` (boshqa odamning ID'si borligi oshkor qilinmaydi)
- Hech qachon klientdan kelgan `teacherId/studentId/parentId` ga ishonmang — ular `req.auth` dan olinadi yoki `assert*` bilan tekshiriladi.

## Handler shabloni
```ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db.js";
import { parse, auditCtx, idParam } from "../../lib/http.js";
import { assertTeacherGroup } from "../../lib/access.js";
import { writeAudit } from "../../lib/audit.js";
import { badRequest } from "../../lib/errors.js";

export default async function groups(app: FastifyInstance) {
  app.get("/groups/:id", async (req) => {
    const { id } = parse(idParam, req.params);
    await assertTeacherGroup(req.auth.userId, id);
    return prisma.group.findUnique({ where: { id }, include: { … } });
  });

  app.post("/groups/:id/something", async (req) => {
    const body = parse(z.object({ … }), req.body);
    return prisma.$transaction(async (tx) => {
      const row = await tx.x.update({ … });
      await writeAudit(tx, { ...auditCtx(req), action: "x.update", entityType: "X", entityId: row.id,
        summary: "Odam o'qiydigan matn", before, after });
      return row;
    });
  });
}
```
- Yo'llar plagin ichida prefikssiz yoziladi (`/groups`), prefiks (`/api/teacher`) index.ts dan keladi.
- Validatsiya: har doim `parse(zodSchema, req.body|req.query|req.params)`. Zod xatosi avtomatik 400.
- Xatolar: `throw badRequest("…")`, `notFound()`, `forbidden()`, `conflict()` (`lib/errors.ts`). Xabarlar o'zbekcha, `ʻ`/`ʼ` bilan.
- Javob: oddiy JSON obyekt (Fastify serializatsiya qiladi). Sanalar ISO satr. Ro'yxatlar sahifalansa `paged(items, total, p)` (`lib/http.ts`, `pageQuery`).
- Pul — `Int` so'm. Baho — 2..5 (Grade.value Float, test o'rtachasi 4.6 bo'lishi mumkin).

## Majburiy yon ta'sirlar
| Hodisa | Nima qilinadi |
|---|---|
| Baho qo'yish/o'zgartirish, to'lov, ustoz/xona biriktirish, o'quvchi/akkaunt yaratish, bloklash, parol tiklash, davomat o'zgarishi, vazifa tekshiruvi, tanga qo'lda berish | `writeAudit(tx, {...auditCtx(req), action, entityType, entityId, summary, before, after})` — asosiy o'zgarish bilan **bitta tranzaksiyada** |
| Tanga | faqat `awardCoins(tx, {studentId, reason, groupId, refType, refId, amount?})` / `revokeCoins` (`lib/coins.ts`); miqdorlar `config/gamification.ts` dan. O'quvchi faol bo'lganda `touchStreak(tx, studentId)` |
| Ota-onaga xabar (baho, davomat — kelmadi/kechikdi, vazifa tekshirildi, to'lov) | `notifyParents(tx, studentId, {type, title, body, link})` (`lib/notify.ts`) — bot Telegram'ga o'zi yuboradi |
| Boshqa foydalanuvchiga bildirishnoma | `notify(tx, {userId, type, title, body, link})` |
| Fayl | yuklash: klient avval `POST /api/files` (multipart) → `{files:[{id}]}`; keyin obyekt yaratishda `attachFiles(tx, fileIds, req.auth.userId, {submissionId|homeworkId|messageId})` yoki `Material.fileId`. Yoki to'g'ridan-to'g'ri `saveMultipart(req, db, links)`. Yuklab olish: `GET /api/files/:id` (ruxsat avtomatik tekshiriladi) |
| Tanga ref (idempotentlik) | `coinRef` (`lib/coins.ts`): ATTENDANCE va ACTIVITY → `...coinRef.lesson(lessonId)`, HOMEWORK_ON_TIME → `...coinRef.submission(submissionId)`, STREAK → `coinRef.day(ymd)`. Boshqa ref ishlatilmaydi (aks holda tanga ikki marta beriladi yoki revoke topolmaydi). `awardCoins` tranzaksiya ichida xavfsiz (ON CONFLICT DO NOTHING) |
| `@db.Date` ustunlar (`Payment.dueDate`, `Group.startDate/endDate`, `StudentProfile.enrolledAt/leftAt/lastStreakDate`, `GroupStudent.joinedAt/leftAt`, `birthDate`) | yozish: `toDbDate(date | "YYYY-MM-DD")`; o'qish: `dbDateYmd(d)`; "bugungi" solishtirish: `dueDate < toDbDate()`. `startOfDayTz()` ni @db.Date ga yozmang — bir kun orqaga suriladi |
| Vaqt | `lib/dates.ts` — Toshkent vaqti: `startOfDayTz`, `startOfWeekTz`, `startOfMonthTz`, `ymdTz`, `isoWeekdayTz`, `atTz("2024-05-24","14:00")`, `periodOf()` |

## Xabarlar (umumiy, barcha rollar)
`/api/messages`: `GET /threads`, `GET /threads/:id` (o'qildi deb belgilaydi), `POST /threads/:id/messages {body, fileIds?, lessonId?, isQuestion?}`, `POST / {toUserId, body, studentId?, subject?, lessonId?, isQuestion?}` (yangi suhbat yoki mavjudini davom ettirish), `GET /contacts`. Kim kimga yoza olishi `canMessage()` da. Web'da `components/chat/ChatView` ga ulanadi.

## Til
- UI va API xabarlari o'zbekcha lotin: `oʻ gʻ` → U+02BB, tutuq → U+02BC (`taʼlim`, `maʼlumot`). ASCII `'` ishlatilmaydi.
- Atamalar: oʻquvchi, ustoz, ota-ona, guruh, uyga vazifa, kumush tanga, Mock imtihon. Taqiqlangan: talaba, oʻqituvchi, instruktor, XP, yulduz, UZS.
- Raqam: `1 240`, `850 000 soʻm` (web: `fmtNum`, `fmtMoney`). Sana: "24-may, 2024", `24.05.2024`.
- Bolaga bosimsiz gamifikatsiya (KANON §8): markaz bo'yicha reyting yo'q, "X dan N ta ortdasiz" yo'q; guruh ichidagi faollik alohida bo'limda.

## Test
- Har agent o'z portida ishlaydi: `PORT=30xx npm run dev -w api` va `WEB_PORT=51xx VITE_API_PROXY=http://localhost:30xx npm run dev -w web` (platforma/ dan). 3000/5173 — lead uchun.
- Har agent o'z bazasida: `DATABASE_URL=postgresql://urfon:urfon@localhost:5433/urfon_<nom>` (lead oldindan demo ma'lumot bilan klon qilib beradi).
- `npx tsc --noEmit` (api/ va web/ da) toza bo'lishi kerak.
