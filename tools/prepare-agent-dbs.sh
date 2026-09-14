#!/usr/bin/env bash
# Dev: demo seed'ni shablon bazaga yozib, har bir agent uchun nusxa oladi va .seed-ready yaratadi.
# Foydalanish (platforma/ dan): bash tools/prepare-agent-dbs.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
BASE=postgresql://urfon:urfon@localhost:5433
export UPLOAD_DIR="$ROOT/api/uploads"

cd api
echo "== urfon_tpl: migratsiya + seed"
DATABASE_URL=$BASE/urfon_tpl npx prisma migrate deploy >/dev/null
DATABASE_URL=$BASE/urfon_tpl npx tsx prisma/seed/index.ts
if [ -f prisma/seed/verify.ts ]; then DATABASE_URL=$BASE/urfon_tpl npx tsx prisma/seed/verify.ts | tail -5; fi

echo "== asosiy baza (urfon): seed"
DATABASE_URL=$BASE/urfon npx prisma migrate deploy >/dev/null
DATABASE_URL=$BASE/urfon npx tsx prisma/seed/index.ts >/dev/null

cd "$ROOT"
echo "== agent bazalari"
node tools/clone-db.mjs urfon_tpl urfon_admin_a urfon_admin_b urfon_teacher_a urfon_teacher_b urfon_parent urfon_student urfon_qa

cat > .seed-ready <<'EOF'
Demo baza tayyor. Har bir agentning bazasi: postgresql://urfon:urfon@localhost:5433/urfon_<agent>
Fayllar: platforma/api/uploads (UPLOAD_DIR). Parol hamma uchun: urfon2024

Rol       | Login          | Kim
ADMIN     | +998901000001  | Sanjar Rahimov (Bosh administrator)
TEACHER   | +998901000002  | Alisher Qosimov (IELTS katta ustozi, 5 guruh)
TEACHER   | +998901000003  | Shahzodbek Saidov (salbiy RBAC testlari uchun)
TEACHER   | +998901000007  | Kamola Tursunova (guruhsiz)
PARENT    | +998901234567  | Rustam Valiyev (Ali va Fotima)
STUDENT   | ST-8492        | Ali Valiyev (IELTS Foundation #3)
Boshqa loginlar: api/prisma/seed/data/canon.ts
EOF
echo "OK: .seed-ready yozildi"
