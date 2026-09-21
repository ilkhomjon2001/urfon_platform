// URFON brendli sovgʻalarni tanga doʻkoniga rasmi bilan qoʻshadi (prisma/seed/shop/*.png).
// Idempotent: shu nomli sovgʻa bor boʻlsa qayta yaratilmaydi (rasmi yoʻq boʻlsa — rasm biriktiriladi).
// Narx, zaxira va tavsifni keyin admin paneldan oʻzgartirish mumkin — skript ularni qayta yozmaydi,
// faqat --prices berilsa mavjud sovgʻalarning narxi va vitrinadagi tartibi shu roʻyxatga tenglashtiriladi.
//   npm run shop:import -w api [-- --dry] [-- --prices]
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ShopCategory } from "@prisma/client";
import { prisma } from "../src/db.js";
import { writeAudit } from "../src/lib/audit.js";
import { saveBuffer } from "../src/lib/storage.js";

const dry = process.argv.includes("--dry");
const syncPrices = process.argv.includes("--prices");
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../prisma/seed/shop");

// Narxlar markaz egasi bergan oʻrtacha narxlar asosida (2026-09-21): ruchka 100, bloknot va gilamcha 375,
// kepka 625, krujka va termos 875, futbolka 1000 tanga.
const ITEMS: { title: string; description: string; category: ShopCategory; price: number; stock: number | null; perStudentLimit: number | null; image: string }[] = [
  { title: "Stikerlar toʻplami", description: "URFON va ingliz tilidagi rangli stikerlar — daftar, telefon va noutbuk uchun.", category: "GIFT", price: 100, stock: 40, perStudentLimit: null, image: "stickers.png" },
  { title: "URFON ruchkasi", description: "Logotipli koʻk ruchka — darsda va uyda yozish uchun.", category: "STATIONERY", price: 100, stock: 50, perStudentLimit: null, image: "pen.png" },
  { title: "URFON daftari", description: "«My Vocabulary» — yangi soʻzlarni yozib borish uchun 48 varaqli daftar.", category: "STATIONERY", price: 250, stock: 30, perStudentLimit: null, image: "notebook.png" },
  { title: "URFON breloki", description: "Kalit yoki sumkaga taqiladigan URFON logotipli brelok.", category: "GIFT", price: 250, stock: 30, perStudentLimit: null, image: "keychain.png" },
  { title: "URFON bloknoti", description: "Qattiq muqovali, lentali brendli bloknot.", category: "STATIONERY", price: 375, stock: 20, perStudentLimit: null, image: "planner.png" },
  { title: "Sichqoncha gilamchasi", description: "Kompyuter sichqonchasi uchun URFON logotipli gilamcha.", category: "SWAG", price: 375, stock: 15, perStudentLimit: null, image: "mousepad.png" },
  { title: "URFON kepkasi", description: "Toʻq koʻk kepka, oldida URFON belgisi. Oʻlcham sozlanadi.", category: "SWAG", price: 625, stock: 15, perStudentLimit: 1, image: "cap.png" },
  { title: "URFON sumkasi", description: "Kitob va daftarlar uchun matoli sumka (shopper).", category: "SWAG", price: 750, stock: 15, perStudentLimit: 1, image: "tote.png" },
  { title: "URFON krujkasi", description: "Logotipli oq krujka — choy va kofe uchun.", category: "SWAG", price: 875, stock: 15, perStudentLimit: null, image: "mug.png" },
  { title: "URFON termosi", description: "Issiq va sovuqni saqlaydigan metall termos, URFON logotipi bilan.", category: "SWAG", price: 875, stock: 10, perStudentLimit: 1, image: "thermos.png" },
  { title: "URFON futbolkasi", description: "Oq futbolka, koʻkragida URFON logotipi. Oʻlchamni administratorga ayting.", category: "SWAG", price: 1000, stock: 10, perStudentLimit: 1, image: "tshirt.png" },
];

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!admin) throw new Error("Faol administrator topilmadi");
  let created = 0, imaged = 0, skipped = 0, repriced = 0;
  const changes: string[] = [];

  if (syncPrices) {
    for (const [i, it] of ITEMS.entries()) {
      const row = await prisma.shopItem.findFirst({ where: { title: it.title }, select: { id: true, price: true, sort: true } });
      if (!row || (row.price === it.price && row.sort === (i + 1) * 10)) continue;
      if (row.price !== it.price) changes.push(`${it.title}: ${row.price} → ${it.price}`);
      if (!dry) await prisma.shopItem.update({ where: { id: row.id }, data: { price: it.price, sort: (i + 1) * 10 } });
      repriced++;
    }
  }

  for (const [i, it] of ITEMS.entries()) {
    const existing = await prisma.shopItem.findFirst({ where: { title: it.title }, select: { id: true, imageFileId: true } });
    if (existing?.imageFileId) {
      skipped++;
      continue;
    }
    if (dry) {
      console.log(existing ? `rasm biriktiriladi: ${it.title}` : `yaratiladi: ${it.title} (${it.price} tanga)`);
      continue;
    }
    const buf = await readFile(path.join(DIR, it.image));
    await prisma.$transaction(async (tx) => {
      const file = await saveBuffer(tx, buf, { originalName: it.image, mime: "image/png", uploadedById: admin.id });
      if (existing) {
        await tx.shopItem.update({ where: { id: existing.id }, data: { imageFileId: file.id } });
        imaged++;
      } else {
        const { image: _image, ...data } = it;
        await tx.shopItem.create({ data: { ...data, imageFileId: file.id, sort: (i + 1) * 10 } });
        created++;
      }
    });
  }

  if (!dry && repriced) {
    await writeAudit(prisma, {
      actorId: null,
      actorRole: null,
      action: "shop.reprice",
      entityType: "ShopItem",
      entityId: "import",
      summary: `Tanga doʻkoni narxlari yangilandi: ${changes.join("; ") || "faqat tartib"}`,
    });
  }
  if (!dry && (created || imaged)) {
    await writeAudit(prisma, {
      actorId: null,
      actorRole: null,
      action: "shop.import",
      entityType: "ShopItem",
      entityId: "import",
      summary: `Tanga doʻkoniga URFON sovgʻalari qoʻshildi: ${created} ta yangi, ${imaged} tasiga rasm biriktirildi`,
    });
  }
  for (const c of changes) console.log(`narx: ${c}`);
  console.log(`${dry ? "[dry] " : ""}yangi: ${created}, rasm biriktirildi: ${imaged}, narxi yangilandi: ${repriced}, oʻtkazib yuborildi: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
