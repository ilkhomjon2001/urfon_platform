// Kichik, lekin haqiqiy (ochiladigan) fayllar: 1 sahifali PDF, jim MP3, PNG, DOCX/ZIP.
// Diskka src/lib/storage.ts → saveBuffer orqali yoziladi.
import { crc32, deflateSync } from "node:zlib";
import type { Db } from "../../src/db.js";
import { saveBuffer } from "../../src/lib/storage.js";

// ─────────────── PDF ───────────────

// WinAnsi (Helvetica) ga o'girish: oʻ/gʻ → ‘, tutuq → ’
const WINANSI: Record<string, number> = { "ʻ": 0x91, "ʼ": 0x92, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "—": 0x97, "–": 0x96, "·": 0xb7, "«": 0xab, "»": 0xbb, "•": 0x95 };
function pdfText(s: string) {
  let out = "";
  for (const ch of s) {
    const code = WINANSI[ch] ?? (ch.charCodeAt(0) <= 0xff ? ch.charCodeAt(0) : 0x3f);
    const c = String.fromCharCode(code);
    out += c === "(" || c === ")" || c === "\\" ? `\\${c}` : c;
  }
  return out;
}

export function makePdf(title: string, lines: string[] = [], targetBytes = 0): Buffer {
  const content = [
    "BT /F1 22 Tf 56 770 Td (" + pdfText(title) + ") Tj ET",
    "BT /F2 11 Tf 56 748 Td (" + pdfText("URFON taʼlim markazi · Chilonzor filiali") + ") Tj ET",
    "0.12 0.31 0.76 RG 2 w 56 736 m 539 736 l S",
    ...lines.slice(0, 40).map((l, i) => `BT /F2 12 Tf 56 ${712 - i * 18} Td (${pdfText(l)}) Tj ET`),
  ].join("\n");
  const objs: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ];
  const parts: Buffer[] = [Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "latin1")];
  const offsets: number[] = [];
  let pos = parts[0].length;
  const push = (b: Buffer) => {
    parts.push(b);
    pos += b.length;
  };
  objs.forEach((o, i) => {
    offsets.push(pos);
    push(Buffer.from(`${i + 1} 0 obj\n${o}\nendobj\n`, "latin1"));
  });
  // hajmni real ko'rinishga keltirish uchun ishlatilmaydigan to'ldiruvchi oqim
  const base = pos + 200;
  if (targetBytes > base) {
    offsets.push(pos);
    const n = targetBytes - base;
    push(Buffer.from(`${objs.length + 1} 0 obj\n<< /Length ${n} >>\nstream\n`, "latin1"));
    push(Buffer.alloc(n, 0x20));
    push(Buffer.from("\nendstream\nendobj\n", "latin1"));
  }
  const xref = pos;
  const size = offsets.length + 1;
  let x = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (const o of offsets) x += `${String(o).padStart(10, "0")} 00000 n \n`;
  x += `trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  push(Buffer.from(x, "latin1"));
  return Buffer.concat(parts);
}

// ─────────────── MP3 (jim, MPEG-1 Layer III, 44.1 kHz, mono) ───────────────

function id3(title: string, padding: number) {
  const text = Buffer.concat([Buffer.from([0x01, 0xff, 0xfe]), Buffer.from(title, "utf16le")]);
  const frame = Buffer.alloc(10 + text.length);
  frame.write("TIT2", 0, "latin1");
  frame.writeUInt32BE(text.length, 4);
  text.copy(frame, 10);
  const body = Buffer.concat([frame, Buffer.alloc(Math.max(0, padding))]);
  const n = body.length;
  const head = Buffer.from([0x49, 0x44, 0x33, 3, 0, 0, (n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f]);
  return Buffer.concat([head, body]);
}

export function makeMp3(title: string, seconds: number, targetBytes = 0, kbps: 32 | 128 | 320 = 128): Buffer {
  const idx = kbps === 320 ? 14 : kbps === 32 ? 1 : 9;
  const frameLen = Math.floor((144 * kbps * 1000) / 44100);
  const frames = Math.ceil(seconds / (1152 / 44100));
  const frame = Buffer.alloc(frameLen);
  frame[0] = 0xff;
  frame[1] = 0xfb;
  frame[2] = idx << 4;
  frame[3] = 0xc4;
  const audio = Buffer.alloc(frameLen * frames);
  for (let i = 0; i < frames; i++) frame.copy(audio, i * frameLen);
  const tag0 = id3(title, 0);
  const pad = targetBytes > audio.length + tag0.length ? targetBytes - audio.length - tag0.length : 0;
  return Buffer.concat([pad ? id3(title, pad) : tag0, audio]);
}

// ─────────────── PNG ───────────────

function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}

/** Oddiy "daftar varag'i" rasmi: oq fon, ko'k chiziqlar. raw=true bo'lsa siqilmaydi (katta hajm uchun). */
export function makePng(w = 480, h = 320, raw = false): Buffer {
  const row = 1 + w * 3;
  const px = Buffer.alloc(row * h);
  for (let y = 0; y < h; y++) {
    px[y * row] = 0;
    const line = y % 24 === 0;
    for (let x = 0; x < w; x++) {
      const o = y * row + 1 + x * 3;
      const margin = x === 48 || x === 49;
      const [r, g, b] = margin ? [220, 38, 38] : line ? [30, 79, 194] : [250, 251, 254];
      px[o] = r;
      px[o + 1] = g;
      px[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(px, { level: raw ? 0 : 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ─────────────── ZIP (stored) va DOCX ───────────────

export function makeZip(entries: { name: string; data: Buffer }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  const DOS_TIME = 0x6000; // 12:00
  const DOS_DATE = ((2024 - 1980) << 9) | (5 << 5) | 22;
  for (const e of entries) {
    const name = Buffer.from(e.name, "utf8");
    const crc = crc32(e.data) >>> 0;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(0, 8);
    lh.writeUInt16LE(DOS_TIME, 10);
    lh.writeUInt16LE(DOS_DATE, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(e.data.length, 18);
    lh.writeUInt32LE(e.data.length, 22);
    lh.writeUInt16LE(name.length, 26);
    lh.writeUInt16LE(0, 28);
    locals.push(lh, name, e.data);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(DOS_TIME, 12);
    ch.writeUInt16LE(DOS_DATE, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(e.data.length, 20);
    ch.writeUInt32LE(e.data.length, 24);
    ch.writeUInt16LE(name.length, 28);
    ch.writeUInt32LE(offset, 42);
    centrals.push(ch, name);
    offset += 30 + name.length + e.data.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function makeDocx(title: string, paragraphs: string[] = []): Buffer {
  const p = (t: string, bold = false) =>
    `<w:p><w:r>${bold ? "<w:rPr><w:b/><w:sz w:val=\"32\"/></w:rPr>" : ""}<w:t xml:space="preserve">${xmlEsc(t)}</w:t></w:r></w:p>`;
  const doc =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>` +
    p(title, true) + p("URFON taʼlim markazi · Chilonzor filiali") + paragraphs.map((t) => p(t)).join("") +
    `</w:body></w:document>`;
  return makeZip([
    {
      name: "[Content_Types].xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
      ),
    },
    {
      name: "_rels/.rels",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
      ),
    },
    { name: "word/document.xml", data: Buffer.from(doc, "utf8") },
  ]);
}

// ─────────────── Yaratish + saqlash ───────────────

const MAX_REAL = 10 * 1024 * 1024; // 10 MB dan kattalarini to'liq hajmda yozmaymiz

export type FileKind = "pdf" | "mp3" | "png" | "docx" | "zip";
export type FileSpec = {
  name: string; // ko'rinadigan nom (kengaytma bilan)
  title?: string; // fayl ichidagi sarlavha
  lines?: string[];
  bytes?: number; // taxminiy real hajm (PDF/MP3/PNG uchun to'ldiriladi, ≤10 MB)
  seconds?: number; // audio davomiyligi
  lowBitrate?: boolean; // o'quvchi yozuvlari uchun 32 kbps (kichik hajm)
};

export function buildFile(spec: FileSpec): Buffer {
  const ext = spec.name.slice(spec.name.lastIndexOf(".") + 1).toLowerCase();
  const title = spec.title ?? spec.name.replace(/\.[^.]+$/, "");
  const target = spec.bytes && spec.bytes <= MAX_REAL ? spec.bytes : 0;
  switch (ext) {
    case "pdf":
      return makePdf(title, spec.lines ?? [], target);
    case "mp3":
      return makeMp3(title, spec.seconds ?? 20, target, spec.lowBitrate ? 32 : 128);
    case "png":
      if (target > 400_000) {
        const side = Math.floor(Math.sqrt(target / 3 / 1.5));
        return makePng(Math.floor(side * 1.5), side, true);
      }
      return makePng();
    case "docx":
      return makeDocx(title, spec.lines ?? []);
    case "zip":
      return makeZip([
        { name: "README.txt", data: Buffer.from(`${title}\nURFON taʼlim markazi — faqat ustozlar uchun.\n`, "utf8") },
        { name: "answer-sheet.pdf", data: makePdf(title, spec.lines ?? []) },
      ]);
    default:
      throw new Error(`Nomaʼlum fayl turi: ${spec.name}`);
  }
}

/**
 * Faylni UPLOAD_DIR ga yozadi va File qatorini yaratadi (saveBuffer). saveBuffer nomni xavfsiz
 * ko'rinishga keltiradi ("—" → "_"), shuning uchun ko'rinadigan nom va vaqt qaytadan yoziladi.
 */
export async function storeFile(
  db: Db,
  spec: FileSpec,
  meta: { uploadedById: string; createdAt: Date; submissionId?: string; homeworkId?: string; messageId?: string },
) {
  const f = await saveBuffer(db, buildFile(spec), {
    originalName: spec.name,
    uploadedById: meta.uploadedById,
    submissionId: meta.submissionId,
    homeworkId: meta.homeworkId,
    messageId: meta.messageId,
  });
  return db.file.update({ where: { id: f.id }, data: { originalName: spec.name, createdAt: meta.createdAt } });
}
