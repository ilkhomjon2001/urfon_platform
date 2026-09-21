-- Har level alohida kitob; bitta level ichida 13–16 va 8–12 yosh uchun alohida darsma-dars reja.
CREATE TYPE "AgeGroup" AS ENUM ('TEENS', 'KIDS');

ALTER TABLE "Group" ADD COLUMN "ageGroup" "AgeGroup" NOT NULL DEFAULT 'TEENS';
ALTER TABLE "Topic" ADD COLUMN "kidsPlan" JSONB;

-- Mavjud guruhlar: eski K1/K2/KIDS levellaridagilar va nomida "kids" boʻlganlar — 8–12 yosh
UPDATE "Group" g SET "ageGroup" = 'KIDS'
  FROM "Level" l
 WHERE l."id" = g."levelId" AND l."code" ~ '^(KIDS|K[0-9]+)$';
UPDATE "Group" SET "ageGroup" = 'KIDS' WHERE "name" ILIKE '%kids%';
