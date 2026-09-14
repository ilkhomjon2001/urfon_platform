# Rol agentlari uchun umumiy qoidalar va o'zaro kelishuvlar

## Kim nimaga egalik qiladi (faqat o'z fayllaringizni tahrirlang)
| Agent | Backend (`api/src/routes/…`) | Frontend (`web/src/pages/…`) |
|---|---|---|
| admin-a | `admin/dashboard.ts`, `admin/groups.ts`, `admin/teachers.ts`, `admin/curriculum.ts`, `admin/lookups.ts` | `admin/Dashboard.tsx`, `admin/Groups.tsx`, `admin/Teachers.tsx`, `admin/Curriculum.tsx`, `admin/a/**` (yordamchi komponentlar) |
| admin-b | `admin/students.ts`, `admin/parents.ts`, `admin/payments.ts`, `admin/reports.ts`, `admin/audit.ts` | `admin/Students.tsx`, `admin/Parents.tsx`, `admin/Payments.tsx`, `admin/Reports.tsx`, `admin/Audit.tsx`, `admin/b/**` |
| teacher-a | `teacher/dashboard.ts`, `teacher/groups.ts`, `teacher/lessons.ts`, `teacher/schedule.ts` | `teacher/Dashboard.tsx`, `teacher/Groups.tsx`, `teacher/GroupDetail.tsx`, `teacher/LessonConduct.tsx`, `teacher/Schedule.tsx`, `teacher/a/**` |
| teacher-b | `teacher/homework.ts`, `teacher/exams.ts`, `teacher/resources.ts`, `teacher/announcements.ts` | `teacher/Homework.tsx`, `teacher/Exams.tsx`, `teacher/Resources.tsx`, `teacher/Messages.tsx`, `teacher/b/**` |
| parent | `parent/*.ts` | `parent/**` |
| student | `student/*.ts` | `student/**` |

**Tahrirlash taqiqlangan (umumiy):** `api/prisma/**`, `api/src/lib/**`, `api/src/app.ts`, `api/src/config/**`, `api/src/routes/{auth,me,files,messages}.ts`, `api/src/routes/*/index.ts`, `web/src/components/**`, `web/src/lib/**`, `web/src/routes.tsx|App.tsx|main.tsx`, `web/tailwind*`, `package.json` fayllar. Umumiy joyda nimadir yetishmasa — o'z papkangizda (masalan `web/src/pages/teacher/a/`) yozing va hisobotda ayting. Yangi paket o'rnatmang.

## Agentlararo API kelishuvlari (egasi yozadi, boshqasi chaqiradi)
- **admin-b** → `GET /api/admin/students?q=&groupId=&status=&page=&pageSize=` → `{ items: [{ id, fullName, code, status, phone, groups:[{id,name}], parents:[{id,fullName,phone}] }], total, page, pageSize, pages }`
- **admin-b** → `POST /api/admin/students/:id/enrollments { groupId, status?: "ACTIVE"|"WAITING" }` va `DELETE /api/admin/students/:id/enrollments/:groupId` (guruhga qo'shish/chiqarish, audit bilan). admin-a guruh sahifasidagi "Oʻquvchi qoʻshish" shu endpointlarni chaqiradi.
- **admin-a** → `GET /api/admin/lookups` → `{ levels:[{id,code,name}], rooms:[{id,name,location,capacity}], teachers:[{id,fullName}], groups:[{id,code,name,status,teacherId}] }` (admin-b formalardagi selectlar uchun ishlatadi).
- **teacher-b** → `POST /api/teacher/homework { groupId, lessonId?, topicId?, title, description?, type, dueAt, content?, fileIds? }` → homework. teacher-a dars sahifasidagi "Uyga vazifa berish" shuni chaqiradi.
- **teacher-b** → `POST /api/teacher/materials { title, type, fileId?, url?, groupId?, lessonId?, topicId?, levelId?, description? }` → material. teacher-a dars sahifasidagi "Material biriktirish" shuni chaqiradi (fayl avval `POST /api/files`).
- **teacher-b** → `GET /api/teacher/homework?groupId=&lessonId=` → ro'yxat (teacher-a dars sahifasida ko'rsatish uchun).
- Xabarlar hamma uchun umumiy: `/api/messages/*` (tayyor). Ota-ona dars tafsilotidan savol: `POST /api/messages { toUserId, studentId, lessonId, isQuestion: true, body }`.

## Ish tartibi
1. O'qing: `docs/API-KONVENSIYA.md`, `design-system/KANON.md`, `api/prisma/schema.prisma`, `api/src/lib/*.ts`, sizga tegishli mockuplar (`stitch_urfon_edtech_teacher_dashboard/<papka>/code.html` + `screen.png`).
2. **Backend avval.** Sxema va lib tayyor — endpointlarni hoziroq yozishingiz mumkin.
3. **Frontend** faqat `D:\urfon\platforma\web\FOUNDATION_READY` fayli paydo bo'lgandan keyin (web poydevori — UI kit, shell, api client — shu paytgacha quriladi). Keyin `web/FRONTEND-KONVENSIYA.md` ni o'qing va faqat `@/components/ui`, `@/lib/*` dan foydalaning. Tayyor bo'lmasa, backend testlari bilan davom eting va vaqti-vaqti bilan tekshiring.
4. **Demo ma'lumotli baza** `D:\urfon\platforma\.seed-ready` fayli paydo bo'lganda sizning bazangiz (`urfon_<agent>`, masalan `urfon_teacher_a`) tayyor bo'ladi. Demo loginlar o'sha faylda. Undan oldin kodni yozing, `tsc` bilan tekshiring.
5. Mockupni **ko'rinish** manbai sifatida oling, lekin hamma raqam/ro'yxat API'dan keladi (hardcode yo'q). Mockupdagi har bir tugma ishlashi kerak yoki olib tashlanadi — "o'lik" tugma qoldirmang.
6. Har bir o'zgartiruvchi endpoint: zod validatsiya, ko'lam tekshiruvi (`assert*`), tranzaksiya, audit, kerak bo'lsa tanga/bildirishnoma.
7. Test: `npx tsc --noEmit` (api/ va web/), o'z portingizda API'ni ko'tarib curl bilan — ijobiy va **salbiy RBAC** holatlar (boshqa ustozning guruhi / boshqa ota-onaning farzandi → 404, boshqa rol → 403). Sahifalarni `platforma/tools/shot.mjs` (web poydevori agenti yozadi; bo'lmasa `design-system/tools/screenshot.mjs` namunasi bo'yicha) bilan suratga olib, mockup `screen.png` bilan solishtiring. Mobil kenglikni (400px) ham tekshiring.
8. Tugatganda ishlagan serverlaringizni to'xtating.

## Portlar va bazalar
| Agent | API PORT | WEB_PORT | DATABASE_URL |
|---|---|---|---|
| admin-a | 3011 | 5181 | postgresql://urfon:urfon@localhost:5433/urfon_admin_a |
| admin-b | 3012 | 5182 | …/urfon_admin_b |
| teacher-a | 3013 | 5183 | …/urfon_teacher_a |
| teacher-b | 3014 | 5184 | …/urfon_teacher_b |
| parent | 3015 | 5185 | …/urfon_parent |
| student | 3016 | 5186 | …/urfon_student |

API: `cd D:\urfon\platforma\api && PORT=30xx DATABASE_URL=… UPLOAD_DIR=D:\urfon\platforma\api\uploads npx tsx src/index.ts` (fon rejimida). Web: `cd D:\urfon\platforma && WEB_PORT=51xx VITE_API_PROXY=http://localhost:30xx npm run dev -w web`.
Demo fayllar hammasi bitta `api/uploads` papkasida (seed shu yerga yozadi) — o'chirmang.

## Yakuniy hisobot (qisqa)
Qilingan endpointlar ro'yxati (metod, yo'l, 1 qator), sahifalar, test natijalari (RBAC salbiy testlar bilan), mockupdan farqlar va sababi, umumiy fayllarga kerak bo'lgan o'zgarishlar (agar bo'lsa).
