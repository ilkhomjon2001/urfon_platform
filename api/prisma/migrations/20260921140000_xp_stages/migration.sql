-- XP (tajriba) va bosqichlar: kumush bosqichga qarab beriladi (config/gamification.ts)
ALTER TYPE "CoinReason" ADD VALUE IF NOT EXISTS 'GRADE';
ALTER TYPE "CoinReason" ADD VALUE IF NOT EXISTS 'CONTEST';
ALTER TYPE "CoinReason" ADD VALUE IF NOT EXISTS 'PRESENTATION';

ALTER TABLE "CoinTransaction" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StudentProfile" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;

-- Oldin yigʻilgan tangalar tajriba sifatida ham hisoblanadi (sarflanganlari emas)
UPDATE "CoinTransaction" SET "xp" = "amount" WHERE "amount" > 0;
UPDATE "StudentProfile" p SET "xp" = COALESCE((SELECT SUM(t."xp") FROM "CoinTransaction" t WHERE t."studentId" = p."userId"), 0);
