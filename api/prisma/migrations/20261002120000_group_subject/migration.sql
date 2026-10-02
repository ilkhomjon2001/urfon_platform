-- Guruhning fani: bosqichsiz guruhlar ham fanga ega boʻlsin (masalan, matematika)
ALTER TABLE "Group" ADD COLUMN "subject" "Subject" NOT NULL DEFAULT 'ENGLISH';
-- Bosqichi bor guruhlar fanni oʻsha bosqichdan oladi
UPDATE "Group" g SET "subject" = l."subject" FROM "Level" l WHERE g."levelId" = l."id";
