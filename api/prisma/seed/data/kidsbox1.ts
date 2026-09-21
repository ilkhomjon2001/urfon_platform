// Cambridge Kid's Box 1, Pupil's Book (1-nashr) — URFON Starter leveli uchun darsma-dars rejalar.
// Markaz kitobni sotib olgan; hozircha faqat Pupil's Book bor (Activity Book, Teacher's Book va audio yoʻq),
// shuning uchun uy vazifalari Activity Book ga emas, uydagi topshiriqlarga tayanadi, audio boʻlmasa ustoz oʻzi oʻqib beradi.
// Sana: 2026-09-21.
//
// Kid's Box — bolalar kitobi, shuning uchun reja faqat 8–12 yosh uchun (bitta yoʻnalish).
// 12 unit, har biri 6 bet: 1-dars — lugʻat va chant, 2-dars — grammatika va qoʻshiq/oʻyin, 3-dars — Monty's phonics va hikoya.
// Har 2 unitdan keyingi Marie (fan) va Trevor (qadriyat) sahifalari — 1 dars; Review (4, 8, 12-unitdan keyin) — 1 dars;
// Mid-level test (6-unitdan keyin) va End-of-level test (12-unitdan keyin). Jami 47 dars, haftasiga 3 ta — ≈ 16 hafta.
//
// Mualliflik huquqi: kitobdan faqat bet, mashq va audio trek raqamlariga havola qilinadi; hikoya, qoʻshiq, chant
// va dialog matnlari koʻchirilmagan, topshiriqlar oʻz soʻzlarimiz bilan qisqa bayon qilingan.
import { checkBookMinutes, type BookUnit } from "./prepare1/types.js";
import { KB1_UNITS_01_04 } from "./kidsbox1/units-01-04.js";
import { KB1_UNITS_05_08 } from "./kidsbox1/units-05-08.js";
import { KB1_UNITS_09_12 } from "./kidsbox1/units-09-12.js";

/** Kitobning 12 ta uniti. checkBookMinutes har darsning 90 daqiqa ekanini import paytida tekshiradi. */
export const KIDSBOX1: { units: BookUnit[] } = {
  units: checkBookMinutes([...KB1_UNITS_01_04, ...KB1_UNITS_05_08, ...KB1_UNITS_09_12], "Kid's Box 1"),
};
