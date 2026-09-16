-- Level tavsifi: kimga moʻljallangan, CEFR darajasi, davomiyligi va izoh.
ALTER TABLE "Level" ADD COLUMN "audience" TEXT;
ALTER TABLE "Level" ADD COLUMN "cefr" TEXT;
ALTER TABLE "Level" ADD COLUMN "weeks" INTEGER;
ALTER TABLE "Level" ADD COLUMN "description" TEXT;
