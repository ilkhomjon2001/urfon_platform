# URFON — serverga oʻrnatish (Ubuntu VPS, Docker)

Bu qoʻllanma platformani bitta Ubuntu serverga oʻrnatishni bosqichma-bosqich tushuntiradi. Natijada quyidagi uchta konteyner ishlaydi:

| Konteyner | Vazifasi |
|---|---|
| `db` | PostgreSQL 17. Maʼlumotlar `db-data` volumeʼda saqlanadi. |
| `app` | API, web ilova, Telegram bot va rejali ishlar. Hammasi bitta Node jarayonida ishlaydi. Yuklangan fayllar `uploads` volumeʼda. |
| `caddy` | HTTPS sertifikatini avtomatik oladi (Let's Encrypt) va soʻrovlarni `app:3000` ga uzatadi. |

Tashqaridan faqat 80 va 443 portlar ochiq boʻladi. Bazaga internetdan kirib boʻlmaydi.

---

## 0. Talablar

- Ubuntu 22.04 yoki 24.04, kamida 2 GB RAM. 1 GB boʻlsa, swap qoʻshing — build vaqtida xotira yetmay qolishi mumkin.
- 20 GB disk.
- Domen, masalan `platforma.urfon.uz`. Uning DNS A-yozuvi serverning IP manziliga qaragan boʻlishi kerak.
- Telegram bot tokeni (7-bosqich) va turniket kaliti (8-bosqich). Ikkalasi ham ixtiyoriy, ularni keyin qoʻshsa ham boʻladi.

## 1. Docker oʻrnatish

```bash
sudo apt update && sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER      # keyin serverdan chiqib, qayta kiring
docker compose version             # v2.x chiqishi kerak

# Firewall: faqat SSH, HTTP va HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw allow 443/udp
sudo ufw enable
```

## 2. Kodni serverga olish

```bash
sudo mkdir -p /opt/urfon && sudo chown $USER /opt/urfon
cd /opt/urfon
git clone <repozitoriy-manzili> .      # yoki kompyuterdan: rsync -av --exclude node_modules platforma/ server:/opt/urfon/platforma/
cd platforma
```

Keyingi barcha buyruqlar `/opt/urfon/platforma` papkasida bajariladi, chunki `docker-compose.yml` shu yerda.

## 3. `.env` faylini tayyorlash

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Quyidagilarni toʻldiring:

| Oʻzgaruvchi | Qiymat |
|---|---|
| `DOMAIN` | `platforma.urfon.uz`. `http://` va oxiridagi `/` belgisisiz yoziladi. |
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` natijasi. Faqat harf va raqam boʻlsin, chunki parol URL ichiga tushadi. |
| `JWT_SECRET` | `openssl rand -base64 48 \| tr -d '\n/+='` natijasi. Kamida 32 belgi. |
| `ADMIN_LOGIN`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Birinchi administrator maʼlumotlari (5-bosqich). Parol kamida 8 belgi. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` | 7-bosqichda olinadi. Hozircha boʻsh qolsa ham boʻladi. |
| `TURNSTILE_API_KEY` | 8-bosqichda qoʻyiladi. Boʻsh boʻlsa, turniket endpointi oʻchiq turadi. |

> `DATABASE_URL`, `APP_ORIGIN`, `PORT`, `UPLOAD_DIR`, `WEB_DIST` qiymatlarini `docker-compose.yml` oʻzi `DOMAIN` va `POSTGRES_PASSWORD` asosida belgilaydi. `.env` dagi eski qiymatlari eʼtiborga olinmaydi.
>
> `POSTGRES_PASSWORD` baza **birinchi marta** yaratilganda qoʻllanadi. Uni keyin oʻzgartirish uchun baza ichida `ALTER USER urfon PASSWORD '…'` buyrugʻini bajarib, `.env` ni ham yangilash kerak.

### 3a. Umumiy server (80/443 boshqa xizmat bilan band, domen yoʻq)

Joriy URFON serveri shu rejimda ishlaydi: `/opt/urfon-platforma`, `http://169.58.130.201:4900`. Oʻz Caddy'miz ishga tushmaydi, ilova toʻgʻridan-toʻgʻri portda ochiladi:

```
APP_ORIGIN=http://SERVER_IP:4900
APP_BIND=0.0.0.0
APP_PORT=4900
TRUST_PROXY=false
COMPOSE_PROFILES=
```

`APP_ORIGIN` `http://` bilan boshlansa, Secure cookie va HSTS avtomatik oʻchadi, aks holda brauzer sessiyani saqlamaydi.

### 3b. Umumiy server + domen (serverdagi boshqa Caddy orqali)

Serverdagi Caddy konteynerda ishlaydi (`coach-caddy-1`, tarmoq `coach_default`), shuning uchun `127.0.0.1` uning oʻzi. Hostdagi xizmatlarga u docker bridge gateway orqali murojaat qiladi: `172.18.0.1:<port>`. Serverdagi boshqa loyihalar ham shunday ulangan. Tartib:

1. DNS: `@` va `app` uchun A yozuv → server IP. `nslookup app.domen 8.8.8.8` yangi IP ni koʻrsatguncha kuting. Aks holda Let's Encrypt urinishlari muvaffaqiyatsiz boʻlib, keyingi urinish kechikadi.
2. [`shared-caddy-urfon.caddy`](shared-caddy-urfon.caddy) blokini `/opt/coach/deploy/Caddyfile` oxiriga qoʻshing (avval nusxa oling):
   ```bash
   docker exec coach-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
   docker exec coach-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
   ```
3. `https://app.domen/api/health` ishlagach, `.env` ni oʻzgartiring va `docker compose up -d` ni bajaring:
   ```
   APP_ORIGIN=https://app.domen
   APP_BIND=172.18.0.1      # ilova faqat Caddy orqali ochiladi, :4900 internetga yopiladi
   APP_PORT=4900
   # TRUST_PROXY qatorini olib tashlang — standart qiymat xususiy tarmoqdagi proxy'ga ishonadi
   ```
   `APP_ORIGIN` `https://` bilan boshlangani uchun Secure cookie va HSTS oʻzi yoqiladi. Shu paytgacha kirilgan `http://IP:4900` sessiyalari bekor boʻladi, foydalanuvchilar yangi manzilda qayta kiradi.

## 4. Ishga tushirish

```bash
docker compose up -d --build        # birinchi build 3–6 daqiqa davom etadi
docker compose ps                   # app va db holati "healthy" boʻlishi kerak
docker compose logs -f app          # migratsiyalar qoʻllandi, "Server listening" va "Rejali ishlar yoqildi" chiqishi kerak
curl -fsS https://$(grep ^DOMAIN .env | cut -d= -f2)/api/health
```

Har safar `app` ishga tushganda migratsiyalar avtomatik qoʻllanadi (`prisma migrate deploy`). Migratsiya xato bersa, server ishga tushmaydi — sababini `docker compose logs app` da koʻrasiz.

## 5. Birinchi administrator

```bash
docker compose exec app npm run admin:create -w api
# → OK: administrator yaratildi — +998900000000 (Bosh administrator)
```

Skript `ADMIN_LOGIN`, `ADMIN_PASSWORD` va `ADMIN_NAME` qiymatlarini `.env` dan oladi. Ularni argument sifatida ham berish mumkin:

```bash
docker compose exec app npm run admin:create -w api -- +998901112233 'KuchliParol123' "Sanjar Rahimov"
```

Parolni unutsangiz, xuddi shu buyruqni `--reset-password` bilan ishga tushiring.

Agar repozitoriyda `api/prisma/seed/prod.ts` boʻlsa, uni ham bir marta bajaring. U administrator bilan birga boshlangʻich maʼlumotlarni yaratadi:

```bash
docker compose exec app npm run db:seed:prod -w api
```

Tizimga kirib, parolni oʻzgartirgandan keyin `.env` dagi `ADMIN_PASSWORD` qatorini boʻshating va `docker compose up -d` ni qayta bajaring.

### Demo maʼlumotlar (ixtiyoriy)

Faqat demo yoki staging server uchun. **Haqiqiy maʼlumotlar bor bazada ishlatmang.**

```bash
# seed production muhitida himoyalangan — ataylab SEED_FORCE=1 berish kerak (bazadagi HAMMA maʼlumotni oʻchiradi!)
docker compose exec -e SEED_FORCE=1 app npm run db:seed -w api
```

Demo akkauntlar paroli — `.env` dagi `DEMO_PASSWORD`. Demo serverni internetga ochsangiz, `DEMO_PASSWORD` ni `urfon2024` dan boshqa qiymatga oʻzgartiring.

## 5a. Xavfsizlik boʻyicha majburiy qadamlar

- `JWT_SECRET`, `POSTGRES_PASSWORD`, `TURNSTILE_API_KEY` — faqat tasodifiy qiymatlar (`openssl rand …`). Namunaviy `JWT_SECRET` bilan server production'da ishga tushmaydi.
- `.env` — `chmod 600`; birinchi kirishdan keyin `ADMIN_PASSWORD` qatorini oʻchiring.
- 3000-portni tashqariga ochmang: faqat Caddy (80/443) orqali. `TRUST_PROXY` shunga tayanadi (login cheklovi mijoz IP'si boʻyicha ishlaydi).
- Zaxira nusxalarni shifrlab, server tashqarisida saqlang.
- Kirish himoyasi: IP boshiga 15 daqiqada 10 urinish, akkaunt boshiga 15 daqiqada 10 notoʻgʻri urinishdan keyin vaqtincha qulf. Vaqtinchalik parol bilan kirgan foydalanuvchi parolni almashtirmaguncha API'dan foydalana olmaydi. Parol almashganda boshqa qurilmalardagi sessiyalar bekor qilinadi.
- Keyingi bosqich (tavsiya): API'ni jadval egasi boʻlmagan alohida Postgres rolida ishga tushirish (`AuditLog` ga faqat INSERT/SELECT) — shunda ilova ham audit trigger'ini oʻchira olmaydi.

## 6. Tekshirish roʻyxati

- `https://DOMAIN` ochiladi va kirish sahifasi koʻrinadi. Sertifikat Caddy tomonidan avtomatik olinadi.
- Admin bilan tizimga kira olasiz.
- `docker compose logs app | grep -i telegram` buyrugʻi "Telegram bot ishga tushdi" yoki "bot oʻchiq" deb chiqaradi.

## 7. Telegram bot

1. Telegramda [@BotFather](https://t.me/BotFather) ga yozing va `/newbot` buyrugʻini yuboring. Nom, masalan, "URFON oʻquv markazi", username esa `urfon_markaz_bot` kabi boʻlishi mumkin. BotFather tokenni beradi.
2. Bot faqat shaxsiy chatda ishlashi uchun BotFatherʼda quyidagilarni sozlang:
   - `/setprivacy` → **Enable**
   - `/setjoingroups` → **Disable** — botni guruhga qoʻshib boʻlmaydi.
   - Xohlasangiz: `/setdescription`, `/setuserpic`.
3. `.env` ga yozing:
   ```
   TELEGRAM_BOT_TOKEN=123456789:AA…
   TELEGRAM_BOT_USERNAME=urfon_markaz_bot     # @ belgisisiz, aynan BotFather bergan nom
   ```
4. `docker compose up -d` buyrugʻini bajaring — konteyner yangi sozlama bilan qayta yaratiladi. Soʻng loglarni tekshiring: `Telegram bot ishga tushdi: @urfon_markaz_bot (long polling)`.
   Username mos kelmasa, logda ogohlantirish chiqadi. Bunday holda ulash havolalari notoʻgʻri boʻladi.

Bot qanday ishlaydi:

- **Ulash.** Foydalanuvchi platformada Sozlamalar → "Telegram botni ulash" tugmasini bosadi va ochilgan `t.me/<bot>?start=<kod>` havolasida **Start** ni bosadi. Kod 30 daqiqa amal qiladi va faqat bir marta ishlatiladi. Uzish uchun botga `/uzish` yoziladi.
- **Menyu rolga bogʻliq:**
  - ota-ona: Bugun, Jadval, Toʻlovlar, Baholar, Farzandlar;
  - oʻquvchi: Bugun, Jadval, Vazifalar, Tangalar;
  - ustoz: Bugungi darslar, Tekshiruv;
  - admin: Bugun.

  Ulanmagan chatga hech qanday maʼlumot berilmaydi — faqat ulash yoʻriqnomasi yuboriladi.
- **Bildirishnomalar.** Platformadagi hodisalar (baho, davomat, tekshirilgan vazifa, toʻlov, hisobot) navbatga yoziladi. Worker har 5 soniyada ularni Telegramga yuboradi. Tezlik chegarasi: jami ~25 xabar/s, bitta chatga 1 xabar/s. Xato boʻlsa, 5 martagacha qayta uriniladi. Foydalanuvchi botni bloklasa, ulanish oʻchiriladi. Server oʻchiq turgan paytda yigʻilgan va 24 soatdan eski boʻlib qolgan xabarlar yuborilmaydi.
- **Bir token — bitta jarayon.** Bitta token bilan faqat bitta jarayon ishlashi mumkin. Aks holda Telegram `409 Conflict` qaytaradi. Production tokenini lokal kompyuterda ishlatmang — test uchun alohida bot oching.
- **Webhook ishlatilmaydi.** Hozircha long polling yetarli, qoʻshimcha port ochish ham kerak emas. Webhook rejimi keyinchalik `TELEGRAM_WEBHOOK_URL` orqali qoʻshilishi mumkin.

### Rejali ishlar (Asia/Tashkent vaqti)

| Vaqt | Ish | Buyruq (qoʻlda ishga tushirish) |
|---|---|---|
| har kuni 20:30 | Ota-onalarga kunlik hisobot (oʻsha kuni darsi boʻlgan oʻquvchilar uchun) | `npm run job -w api -- daily-report [YYYY-MM-DD]` |
| har oyning 1-sanasi, 10:00 | Oʻtgan oy uchun oylik hisobot: ota-onalarga va adminlarga | `npm run job -w api -- monthly-report [YYYY-MM-DD]` |
| har kuni 10:00 | Toʻlov eslatmasi (muddati ertaga); muddati oʻtganlarga `OVERDUE` holati | `npm run job -w api -- payments [YYYY-MM-DD]` |
| har kuni 03:00 | Eski sessiyalar va ulash kodlarini tozalash | `npm run job -w api -- cleanup` |

Buyruqlar oldiga `docker compose exec app` qoʻshib bajariladi. Barcha ishlar idempotent: qayta ishga tushirilsa, hisobot ham, xabar ham takrorlanmaydi. Server rejali vaqtda oʻchiq boʻlgan boʻlsa, qayta yoqilganda oʻsha kungi oʻtkazib yuborilgan ish avtomatik bajariladi.

## 8. Turniket integratsiyasi

1. Kalit yarating: `openssl rand -hex 32`. Uni `.env` ga `TURNSTILE_API_KEY=…` qilib yozing va `docker compose up -d` ni bajaring.
2. Har bir oʻquvchi profilida **Turniket ID** (`TURN-8492`) toʻldirilgan boʻlishi kerak. Bu ID admin panelidagi oʻquvchi profilida kiritiladi.
3. Turniket yoki uning oraliq dasturi har bir oʻtishda quyidagi soʻrovni yuboradi:

```bash
curl -X POST https://DOMAIN/api/integrations/turnstile \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $TURNSTILE_API_KEY" \
  -d '{"turnstileId":"TURN-8492","at":"2024-05-24T13:55:00+05:00","direction":"in"}'
```

- `at` ixtiyoriy, berilmasa hozirgi vaqt olinadi. Vaqt mintaqasi koʻrsatilmasa, Toshkent vaqti deb hisoblanadi. 3 kundan eski yoki kelajakdagi vaqt qabul qilinmaydi.
- `direction`: `in` (standart) yoki `out`. `out` hozircha faqat qabul qilinadi, hech narsa yozilmaydi.

Javoblar:

| Javob | Maʼnosi |
|---|---|
| `{"ok":true,"matched":true,"action":"created","status":"PRESENT"}` | Davomat yozildi. `status` — `PRESENT` yoki `LATE`. |
| `"action":"duplicate"` | Takroriy oʻtish. |
| `"action":"kept_manual"` | Ustoz davomatni qoʻlda belgilagan. Bu belgi **hech qachon oʻzgartirilmaydi**. |
| `"action":"no_lesson"` | Hozir oʻquvchining darsi yoʻq. |
| `401` | Kalit notoʻgʻri. |
| `404` | Turniket ID topilmadi yoki `TURNSTILE_API_KEY` sozlanmagan. |

Qoidalar:

- Oʻtish darsga bogʻlanadi, agar u dars boshlanishidan 60 daqiqa oldin va dars tugaguncha boʻlgan oraliqqa tushsa.
- Boshlanishdan 10 daqiqadan keyin oʻtgan oʻquvchiga `LATE` qoʻyiladi.
- Har bir kelish uchun +5 kumush tanga beriladi va seriya hisoblanadi.
- Ota-onaga "Ali Valiyev 13:55 da markazga keldi" xabari yuboriladi.
- Hodisa audit jurnaliga yoziladi.

## 9. Zaxira nusxa

```bash
bash deploy/backup.sh                     # qoʻlda
sudo crontab -e                           # har kuni 02:30 da avtomatik:
30 2 * * * cd /opt/urfon/platforma && bash deploy/backup.sh >> /var/log/urfon-backup.log 2>&1
```

- Nusxalar `deploy/backups/` papkasiga tushadi: `db-YYYYMMDD-HHMM.dump` (baza) va `uploads-….tar.gz` (fayllar).
- 14 kundan eski nusxalar avtomatik oʻchiriladi. Muddatni `KEEP_DAYS=30` bilan oʻzgartirish mumkin.
- **Nusxani server tashqarisida ham saqlang**: `RCLONE_REMOTE=s3:urfon-backup` (rclone kerak) yoki `scp` orqali boshqa kompyuterga.

### Zaxiradan tiklash

```bash
docker compose stop app
docker compose exec -T db dropdb -U urfon urfon
docker compose exec -T db createdb -U urfon -T template0 -E UTF8 --locale=C urfon
docker compose exec -T db pg_restore -U urfon -d urfon --no-owner < deploy/backups/db-20240524-0230.dump

# fayllar
docker compose run --rm --no-deps -T app sh -c 'rm -rf /data/uploads/* && tar -xzf - -C /data' < deploy/backups/uploads-20240524-0230.tar.gz

docker compose start app
```

> Audit jurnali (`AuditLog`) oʻzgartirib boʻlmaydigan qilib qurilgan: UPDATE, DELETE va TRUNCATE amallari trigger bilan bloklangan. Shuning uchun uni tozalab boʻlmaydi — tiklash doim **yangi bazaga** qilinadi (yuqoridagi `dropdb` + `createdb`).

## 10. Yangilash

```bash
cd /opt/urfon/platforma
bash deploy/backup.sh                     # avval zaxira oling
git pull
docker compose up -d --build              # migratsiyalar avtomatik qoʻllanadi
docker image prune -f
```

Postgres va Caddy imageʼlarini yangilash: `docker compose pull db caddy && docker compose up -d`. Postgres **major** versiyasini (masalan, 17 → 18) oʻzgartirishdan oldin pg_dump orqali zaxira olib, bazani yangi versiyaga tiklash kerak.

## 11. Loglar va holat

```bash
docker compose ps                         # holat va healthcheck
docker compose logs -f app                # API, bot, rejali ishlar
docker compose logs --since 1h caddy      # HTTPS va sertifikat
docker compose exec db psql -U urfon urfon
```

Foydalanuvchilar amallari (baho, toʻlov, davomat, Telegram ulash) admin panelidagi "Tizim jurnali" boʻlimida koʻrinadi.

## 12. Muammolar

| Belgi | Sababi va yechimi |
|---|---|
| Sertifikat olinmayapti | DNS A-yozuvini, 80 va 443 portlar ochiqligini tekshiring. Tafsilotlar: `docker compose logs caddy`. |
| `JWT_SECRET kamida 32 belgi` | `.env` dagi `JWT_SECRET` qiymatini uzaytiring. |
| `POSTGRES_PASSWORD .env faylida boʻlishi kerak` | `.env` compose bilan bir papkada, yaʼni `platforma/` da turishi kerak. |
| Telegram: `409 Conflict` | Shu token bilan boshqa jarayon (lokal dev yoki ikkinchi server) ishlayapti. |
| Telegram havolasi boshqa botni ochadi | `TELEGRAM_BOT_USERNAME` BotFather bergan nomga mos emas. |
| Kunlik hisobot kelmadi | Oʻquvchining oʻsha kuni darsi boʻlmagan boʻlishi yoki ota-onaning bot ulanmagan boʻlishi mumkin. Qoʻlda tekshirish: `npm run job -w api -- daily-report`. |
| Build paytida xotira yetmadi | Swap qoʻshing: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`. |
