// Cambridge Prepare 2nd edition, Level 1 (A1) — URFON oʻquv markazi uchun darsma-dars rejalar.
// Manba: Student Book (SB), Workbook (WB) va Teacher Book (TB). Markaz kitobni litsenziya asosida sotib olgan.
// Sana: 2026-09-16 (chuqurlashtirilgan format).
//
// Har dars 90 daqiqa, haftasiga 3 marta. Reja ustoz dars oʻtayotganda ekranda ochiladi, shuning uchun
// har bir darsda: maqsad, lugʻat, kerakli materiallar, daqiqalarga boʻlingan bosqichlar (jami 90 daqiqa),
// uy vazifasi va ustozga metodik eslatma bor. Tuzilishi: ./prepare1/types.ts
//
// Kitob ikki URFON darajasiga boʻlingan:
//   Teens 13–16 (tezroq): L1 = Starter + Unit 1–10 (31 dars), L2 = Unit 11–20 (30 dars). Unitga 2–3 dars.
//   Kids 8–12 (sekinroq, daraja 3+ oy): K1 (L1 mazmuni, 44 dars), K2 (L2 mazmuni, 43 dars). Unitga 3–4 dars.
//     Kids darslarida koʻproq drilling, TPR, flashcard, qoʻshiq va oʻyinlar, phonics; yozma ishlar qisqartiriladi
//     yoki ustoz bilan birga bajariladi; har dars takrordan boshlanadi.
// Platforma "unit"i = kitob uniti; Culture / Life Skills / Review / testlar oʻzidan oldingi unitga qoʻshilgan.
//
// Mualliflik huquqi: kitobdan faqat sahifa raqamlari, boʻlim nomlari, mashq va audio raqamlari hamda
// video nomlariga havola qilinadi; mashqlar oʻz soʻzlarimiz bilan qisqa bayon qilingan. Oʻqish matnlari,
// dialoglar, audioskriptlar va javoblar koʻchirilmagan.
import { checkMinutes, type PlanUnit } from "./prepare1/types.js";
import { UNITS_00_05 } from "./prepare1/units-00-05.js";
import { UNITS_06_10 } from "./prepare1/units-06-10.js";
import { UNITS_11_15 } from "./prepare1/units-11-15.js";
import { UNITS_16_20 } from "./prepare1/units-16-20.js";

export type { PlanBlock, PlanLesson, PlanUnit } from "./prepare1/types.js";

/** Kitobning 21 ta uniti (Starter = 0). checkMinutes har darsning 90 daqiqa ekanini import paytida tekshiradi. */
export const PREPARE1: { units: PlanUnit[] } = {
  units: checkMinutes([...UNITS_00_05, ...UNITS_06_10, ...UNITS_11_15, ...UNITS_16_20], "Prepare 2e L1"),
};
