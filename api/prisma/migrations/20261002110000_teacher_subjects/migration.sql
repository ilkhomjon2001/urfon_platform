-- Ustoz qaysi fanlarda dars beradi (mavjud ustozlar — ingliz tili)
ALTER TABLE "TeacherProfile" ADD COLUMN "subjects" "Subject"[] DEFAULT ARRAY['ENGLISH']::"Subject"[];
UPDATE "TeacherProfile" SET "subjects" = ARRAY['ENGLISH']::"Subject"[] WHERE "subjects" IS NULL;
ALTER TABLE "TeacherProfile" ALTER COLUMN "subjects" SET NOT NULL;
