-- Fan (yoʻnalish): har level bitta fanga tegishli. Mavjud levellar — ingliz tili.
CREATE TYPE "Subject" AS ENUM ('ENGLISH', 'MATH');
ALTER TABLE "Level" ADD COLUMN "subject" "Subject" NOT NULL DEFAULT 'ENGLISH';
