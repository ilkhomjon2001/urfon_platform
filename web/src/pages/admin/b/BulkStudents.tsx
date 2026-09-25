// Admin → Oʻquvchilar → «Ommaviy qoʻshish»: Excel/Google Sheets jadvalidan koʻchirib qoʻyish yoki CSV yuklash,
// tekshirish (dryRun), keyin qoʻshish. Natijada har bir oila uchun login va vaqtinchalik parol chiqadi —
// nusxalash, CSV yuklab olish yoki chop etish mumkin (parollar keyin qayta koʻrsatilmaydi).
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, Badge, Button, Dialog, Icon, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtNum } from "@/lib/format";
import { toastError } from "@/lib/query";
import { copyText } from "./shared";
import type { Credential } from "./types";

type ColKeyName = "fullName" | "birthDate" | "phone" | "groupCode" | "enrollmentStatus" | "p1name" | "p1phone" | "p1rel" | "p2name" | "p2phone" | "p2rel";

/** Shablondagi ustunlar (tools/… bilan bir xil tartibda; sarlavha nomi boʻyicha ham topiladi). */
const COLUMNS: { key: ColKeyName; labels: string[] }[] = [
  { key: "fullName", labels: ["oʻquvchi f.i.sh", "oquvchi f.i.sh", "oʻquvchi", "oquvchi", "f.i.sh", "ism"] },
  { key: "birthDate", labels: ["tugʻilgan sana", "tugilgan sana", "sana"] },
  { key: "phone", labels: ["oʻquvchi telefoni", "oquvchi telefoni", "telefon"] },
  { key: "groupCode", labels: ["guruh", "guruh kodi"] },
  { key: "enrollmentStatus", labels: ["holat"] },
  { key: "p1name", labels: ["1-ota-ona f.i.sh", "ota-ona f.i.sh", "ota-ona"] },
  { key: "p1phone", labels: ["1-ota-ona telefoni", "ota-ona telefoni"] },
  { key: "p1rel", labels: ["1-ota-ona kimligi", "kimligi"] },
  { key: "p2name", labels: ["2-ota-ona f.i.sh"] },
  { key: "p2phone", labels: ["2-ota-ona telefoni"] },
  { key: "p2rel", labels: ["2-ota-ona kimligi"] },
];
type ColKey = ColKeyName;

type RawRow = Partial<Record<ColKey, string>>;
type CheckRow = { n: number; fullName: string; ok: boolean; error: string | null; warning: string | null; group: string | null };
type BulkResult = { dryRun: boolean; total: number; ok: number; failed: number; rows: CheckRow[]; credentials: (Credential & { student: string; code: string })[] };

/** Bitta satrni ustunlarga ajratadi: tab (Sheets dan koʻchirilganda) yoki nuqtali vergul/vergul (CSV). */
function splitLine(line: string, sep: string) {
  if (sep !== ",") return line.split(sep).map((c) => c.trim());
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** Matnni qatorlarga ajratadi. Birinchi qator sarlavha boʻlsa, ustunlar nomi boʻyicha moslanadi. */
export function parseTable(text: string): RawRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const cells = lines.map((l) => splitLine(l, sep));
  const head = cells[0].map((c) => c.toLowerCase().replace(/[*:]/g, "").trim());
  const isHeader = head.some((h) => COLUMNS.some((c) => c.labels.includes(h)));
  let order: ColKey[];
  if (isHeader) {
    order = head.map((h) => (COLUMNS.find((c) => c.labels.includes(h))?.key ?? "") as ColKey);
  } else {
    order = COLUMNS.map((c) => c.key);
  }
  return cells.slice(isHeader ? 1 : 0).map((row) => {
    const r: RawRow = {};
    row.forEach((v, i) => {
      const k = order[i];
      if (k && v) r[k] = v;
    });
    return r;
  });
}

function toApiRows(rows: RawRow[]) {
  return rows
    .filter((r) => (r.fullName ?? "").trim() || (r.p1phone ?? "").trim())
    .map((r) => ({
      fullName: r.fullName ?? "",
      phone: r.phone ?? null,
      birthDate: r.birthDate ?? null,
      groupCode: r.groupCode ?? null,
      enrollmentStatus: r.enrollmentStatus ?? null,
      parents: [
        { fullName: r.p1name ?? null, phone: r.p1phone ?? null, relation: r.p1rel ?? null },
        { fullName: r.p2name ?? null, phone: r.p2phone ?? null, relation: r.p2rel ?? null },
      ].filter((p) => (p.phone ?? "").trim()),
    }));
}

export function BulkStudentsDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [text, setText] = useState("");
  const [check, setCheck] = useState<BulkResult | null>(null);
  const [done, setDone] = useState<BulkResult | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const rows = useMemo(() => toApiRows(parseTable(text)), [text]);

  const reset = () => {
    setText("");
    setCheck(null);
    setDone(null);
  };
  const close = (o: boolean) => {
    if (!o) {
      if (done) onDone();
      reset();
    }
    onOpenChange(o);
  };

  const run = async (dryRun: boolean) => {
    setBusy(true);
    try {
      const r = await api.post<BulkResult>("/admin/students/bulk", { rows, dryRun });
      if (dryRun) setCheck(r);
      else {
        setDone(r);
        toast.success(`${r.ok} ta oʻquvchi qoʻshildi`);
      }
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast.error("Fayl 2 MB dan oshmasin");
    if (/\.xlsx?$/i.test(f.name)) {
      return toast.error("Excel faylni bevosita yuklab boʻlmaydi: jadvalni belgilab, nusxalab shu oynaga qoʻying (yoki CSV qilib saqlang)");
    }
    setText(await f.text());
    setCheck(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Oʻquvchilarni ommaviy qoʻshish"
      description="Excel yoki Google Sheets jadvalidagi qatorlarni belgilab, nusxalang va shu yerga qoʻying"
      size="xl"
      footer={
        done ? (
          <Button onClick={() => close(false)}>Tayyor</Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => close(false)} disabled={busy}>
              Bekor qilish
            </Button>
            {check ? (
              <>
                <Button variant="outline" icon="refresh" onClick={() => setCheck(null)} disabled={busy}>
                  Jadvalni tahrirlash
                </Button>
                <Button icon="group_add" disabled={!check.ok || busy} loading={busy} onClick={() => void run(false)}>
                  {check.ok} ta oʻquvchini qoʻshish
                </Button>
              </>
            ) : (
              <Button icon="fact_check" disabled={!rows.length || busy} loading={busy} onClick={() => void run(true)}>
                Tekshirish ({rows.length} qator)
              </Button>
            )}
          </>
        )
      }
    >
      {done ? (
        <CredentialsResult result={done} />
      ) : check ? (
        <CheckResult result={check} />
      ) : (
        <div className="flex flex-col gap-4">
          <Alert tone="primary" icon="table_view" title="Ustunlar tartibi">
            <p>
              <b>Oʻquvchi F.I.Sh</b> · Tugʻilgan sana · Oʻquvchi telefoni · Guruh · Holat · <b>1-ota-ona F.I.Sh</b> · <b>1-ota-ona telefoni</b> · Kimligi ·
              2-ota-ona F.I.Sh · 2-ota-ona telefoni · Kimligi
            </p>
            <p className="mt-1">
              Faqat ism va bitta ota-ona telefoni majburiy. Sarlavha qatorini ham birga koʻchirsangiz, ustunlar nomi boʻyicha oʻzi moslashadi. Sana:{" "}
              <span className="tabular-nums">12.03.2014</span> yoki <span className="tabular-nums">2014-03-12</span>. Kimligi: Ota / Ona / Vasiy. Holat: Faol yoki Navbatda.
            </p>
          </Alert>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="font-mono text-body-sm"
            placeholder={"Aziz Karimov\t12.03.2014\t\tGR-01\tFaol\tKarim Aliyev\t+998901234567\tOta"}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" icon="upload_file" onClick={() => fileRef.current?.click()}>
              CSV fayl yuklash
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.txt,text/csv" hidden onChange={(e) => void pickFile(e.target.files?.[0])} />
            <span className="text-body-sm text-on-surface-muted">{rows.length ? `${rows.length} qator oʻqildi` : "Hali qator yoʻq"}</span>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function CheckResult({ result }: { result: BulkResult }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Badge tone="success" icon="check_circle">
          Tayyor: {result.ok}
        </Badge>
        {result.failed ? (
          <Badge tone="danger" icon="error">
            Xato: {result.failed}
          </Badge>
        ) : null}
        <Badge tone="neutral">Jami: {result.total}</Badge>
      </div>
      {result.failed ? <Alert tone="warning" icon="info">Xatoli qatorlar qoʻshilmaydi. Ularni jadvalda tuzatib, qaytadan qoʻying.</Alert> : null}
      <RowsTable rows={result.rows} />
    </div>
  );
}

function RowsTable({ rows }: { rows: CheckRow[] }) {
  return (
    <div className="max-h-80 overflow-y-auto rounded-lg border border-outline-variant">
      <table className="w-full text-body-sm">
        <tbody className="divide-y divide-outline-variant">
          {rows.map((r) => (
            <tr key={r.n} className={cn(!r.ok && "bg-error-container/40")}>
              <td className="w-10 px-3 py-2 text-right tabular-nums text-on-surface-muted">{r.n}</td>
              <td className="px-2 py-2">
                <span className="text-on-surface">{r.fullName || "—"}</span>
                {r.group ? <span className="ml-2 text-on-surface-muted">{r.group}</span> : null}
              </td>
              <td className="px-3 py-2 text-right">
                {r.ok ? (
                  r.warning ? (
                    <span className="inline-flex items-center gap-1 text-warning">
                      <Icon name="warning" size={16} /> {r.warning}
                    </span>
                  ) : (
                    <Icon name="check_circle" size={18} className="text-success" />
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-error">
                    <Icon name="error" size={16} /> {r.error}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CredentialsResult({ result }: { result: BulkResult }) {
  const creds = result.credentials;
  const lines = creds
    .filter((c) => c.password)
    .map((c) => `${c.role === "STUDENT" ? "Oʻquvchi" : `Ota-ona (${c.relation ?? ""})`}: ${c.fullName} — login: ${c.login}, parol: ${c.password}`);
  const csv = ["Kim;Ism;Oʻquvchi;Login;Vaqtinchalik parol"]
    .concat(creds.map((c) => [c.role === "STUDENT" ? "Oʻquvchi" : `Ota-ona ${c.relation ?? ""}`.trim(), c.fullName, c.student, c.login, c.password ?? "(eski parol saqlandi)"].join(";")))
    .join("\n");

  const download = () => {
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kirish-malumotlari-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert tone={result.failed ? "warning" : "success"} icon={result.failed ? "warning" : "check_circle"} title={`${result.ok} ta oʻquvchi qoʻshildi`}>
        {result.failed ? `${result.failed} qatorda xato boʻldi — pastdagi roʻyxatni koʻring.` : "Barcha qatorlar muvaffaqiyatli qoʻshildi."}
        <b> Vaqtinchalik parollar faqat hozir koʻrsatiladi</b> — nusxalab yoki yuklab oling. Keyinroq faqat «Parolni tiklash» orqali yangisini berish mumkin.
      </Alert>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" icon="download" onClick={download}>
          CSV yuklab olish
        </Button>
        <Button variant="outline" icon="content_copy" onClick={() => copyText(lines.join("\n"), "Kirish maʼlumotlari nusxalandi")}>
          Hammasini nusxalash
        </Button>
        <Button variant="outline" icon="print" onClick={() => window.print()}>
          Chop etish
        </Button>
      </div>
      <div className="max-h-80 overflow-y-auto rounded-lg border border-outline-variant">
        <table className="w-full text-body-sm">
          <thead className="sticky top-0 bg-surface-container-low">
            <tr className="text-left">
              <th className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">Kim</th>
              <th className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">Ism</th>
              <th className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">Login</th>
              <th className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">Vaqtinchalik parol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {creds.map((c, i) => (
              <tr key={`${c.userId}-${i}`}>
                <td className="whitespace-nowrap px-3 py-2 text-on-surface-muted">{c.role === "STUDENT" ? "Oʻquvchi" : `Ota-ona · ${c.relation ?? ""}`}</td>
                <td className="px-3 py-2 text-on-surface">
                  {c.fullName}
                  {c.role === "PARENT" ? <span className="block text-on-surface-muted">{c.student}</span> : null}
                </td>
                <td className="px-3 py-2 font-mono text-on-surface">{c.login}</td>
                <td className="px-3 py-2 font-mono font-semibold text-on-surface">{c.password ?? <span className="font-sans font-normal text-on-surface-muted">eski parol saqlandi</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.failed ? <RowsTable rows={result.rows.filter((r) => !r.ok)} /> : null}
      <p className="text-body-sm text-on-surface-muted">Jami {fmtNum(creds.length)} ta akkaunt. Birinchi kirishda tizim parolni almashtirishni soʻraydi.</p>
    </div>
  );
}
