// Admin → Tizim jurnali (Audit log) — mockup: urfon_admin_tizim_jurnali_audit_log.
// Faqat oʻqish: yozuvlarni oʻzgartirish/oʻchirish imkoniyati yoʻq (API'da ham, DB trigger'da ham).
import { Fragment, useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Badge, Button, Card, EmptyState, Icon, IconButton, Input, PageHeader, SearchInput, Select, Skeleton, StatCard, Table, TBody, TD, TH, THead, TR } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtDate, fmtDateShort, fmtNum, fmtRelDateTime, fmtTime } from "@/lib/format";
import { useDebouncedValue, useSearchParamState } from "@/lib/hooks";
import { useApiQuery } from "@/lib/query";
import type { Tone } from "@/lib/types";
import { copyText, ExportButton, ROLE_TONE, ROLE_UZ } from "./b/shared";
import type { AuditChange, AuditDetail, AuditFacets, AuditPage, AuditRow, AuditStats, AuditVerify } from "./b/types";

const LIMIT = 30;

// ─────────── Formatlash ───────────

const VERB: { test: RegExp; label: string; tone: Tone }[] = [
  { test: /login_failed$/, label: "kirish xatosi", tone: "danger" },
  { test: /\.login$/, label: "kirish", tone: "gold" },
  { test: /\.(create|add)$/, label: "yaratildi", tone: "primary" },
  { test: /\.pay$/, label: "qabul qilindi", tone: "success" },
  { test: /\.(cancel)$/, label: "bekor qilindi", tone: "danger" },
  { test: /\.(delete|remove)$/, label: "oʻchirildi", tone: "danger" },
  { test: /\.(unlink)$/, label: "uzildi", tone: "danger" },
  { test: /\.(unenroll)$/, label: "chiqarildi", tone: "danger" },
  { test: /\.(deactivate|block)$/, label: "bloklandi", tone: "danger" },
  { test: /\.(activate|unblock)$/, label: "faollashtirildi", tone: "success" },
  { test: /\.(enroll|link|assign[a-z_]*)$/, label: "biriktirildi", tone: "primary" },
  { test: /reset_password$/, label: "parol tiklandi", tone: "warning" },
  { test: /\.status$/, label: "holat", tone: "gold" },
  { test: /\.generate$/, label: "hisoblandi", tone: "navy" },
  { test: /\.remind$/, label: "eslatma", tone: "neutral" },
  { test: /\.overdue$/, label: "muddati oʻtdi", tone: "danger" },
  { test: /\.(update|edit|change[a-z_]*)$/, label: "oʻzgartirildi", tone: "primary" },
  { test: /\.(submit|upload)$/, label: "qoʻshildi", tone: "primary" },
  { test: /\.(review|grade)$/, label: "tekshirildi", tone: "success" },
  { test: /\.sent$/, label: "yuborildi", tone: "primary" },
  { test: /\.draft$/, label: "qoralama", tone: "neutral" },
  { test: /\.view$/, label: "koʻrildi", tone: "neutral" },
];
const verbOf = (action: string) => VERB.find((v) => v.test.test(action)) ?? { label: action.split(".").slice(1).join(".") || action, tone: "neutral" as Tone };

const PREFIX_LABEL: Record<string, string> = {
  auth: "Kirish va sessiyalar",
  grade: "Baholar",
  payment: "Toʻlovlar",
  student: "Oʻquvchilar",
  parent: "Ota-onalar",
  teacher: "Ustozlar",
  group: "Guruhlar",
  attendance: "Davomat",
  homework: "Uyga vazifalar",
  submission: "Topshiriqlar",
  coin: "Tangalar",
  coins: "Tangalar",
  lesson: "Darslar",
  topic: "Mavzular bazasi",
  exam: "Imtihonlar",
  material: "Materiallar",
  message: "Xabarlar",
  user: "Foydalanuvchilar",
  report: "Hisobotlar",
};

const ENTITY_ICON: Record<string, string> = {
  Grade: "grade",
  Payment: "payments",
  Student: "school",
  User: "person",
  Teacher: "person_apron",
  Parent: "family_restroom",
  Group: "groups",
  Homework: "assignment",
  Submission: "assignment_turned_in",
  Lesson: "event",
  Attendance: "how_to_reg",
  Topic: "menu_book",
  Exam: "quiz",
  Material: "folder",
  Message: "chat",
};
const ENTITY_UZ: Record<string, string> = {
  Grade: "Baho",
  Payment: "Toʻlov",
  Student: "Oʻquvchi",
  User: "Foydalanuvchi",
  Group: "Guruh",
  Homework: "Uyga vazifa",
  Submission: "Topshiriq",
  Lesson: "Dars",
  Attendance: "Davomat",
  Topic: "Mavzu",
  Exam: "Imtihon",
  Material: "Material",
  GroupStudent: "Guruh aʼzoligi",
  Notification: "Bildirishnoma",
  Room: "Xona",
  CoinTransaction: "Tanga",
  Session: "Sessiya",
};

const FIELD_UZ: Record<string, string> = {
  status: "Holat",
  amount: "Summa",
  value: "Baho",
  method: "Usul",
  receiptNo: "Kvitansiya",
  paidAt: "Toʻlangan vaqt",
  fullName: "Ism",
  phone: "Telefon",
  login: "Login",
  isActive: "Faol",
  groupId: "Guruh",
  teacherId: "Ustoz",
  roomId: "Xona",
  note: "Izoh",
  reason: "Sabab",
  period: "Davr",
  dueDate: "Muddat",
  relation: "Qarindoshlik",
  comment: "Izoh",
  score: "Ball",
  room: "Xona",
  teacher: "Ustoz",
  group: "Guruh",
  title: "Nomi",
};

function shortUa(ua: string | null) {
  if (!ua) return null;
  // seed/eski yozuvlar: allaqachon odam oʻqiydigan matn ("Windows 11 · Edge 125")
  if (!/Mozilla\/|node|undici|curl/i.test(ua)) return ua.length > 40 ? `${ua.slice(0, 40)}…` : ua;
  const b = /Edg\/(\d+)/.exec(ua) ? `Edge ${/Edg\/(\d+)/.exec(ua)![1]}` : /Firefox\/(\d+)/.exec(ua) ? `Firefox ${/Firefox\/(\d+)/.exec(ua)![1]}` : /Chrome\/(\d+)/.exec(ua) ? `Chrome ${/Chrome\/(\d+)/.exec(ua)![1]}` : /Safari\//.test(ua) ? "Safari" : /node|undici|curl/i.test(ua) ? "API mijoz" : "Brauzer";
  const os = /Windows NT 10/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? (/(iPhone|iPad)/.test(ua) ? "iOS" : "macOS") : /Android/.test(ua) ? "Android" : /Linux/.test(ua) ? "Linux" : null;
  return [b, os].filter(Boolean).join(" · ");
}

/** Toshkent vaqti "HH:MM:SS" (audit aniqligi uchun soniya bilan). */
const timeSec = (d: string) => new Date(new Date(d).getTime() + 5 * 3_600_000).toISOString().slice(11, 19);

const ENUM_UZ: Record<string, string> = {
  PAID: "Toʻlangan", PENDING: "Kutilmoqda", OVERDUE: "Muddati oʻtgan", CANCELLED: "Bekor qilingan",
  CASH: "Naqd", CARD: "Karta", CLICK: "Click", PAYME: "Payme", TRANSFER: "Bank oʻtkazmasi",
  ACTIVE: "Faol", ACADEMIC_LEAVE: "Akademik taʼtil", GRADUATED: "Bitirgan", LEFT: "Ketgan", WAITING: "Kutmoqda",
  PRESENT: "Keldi", LATE: "Kechikdi", EXCUSED: "Sababli", ABSENT: "Kelmadi",
  DRAFT: "Qoralama", SUBMITTED: "Topshirilgan", REVIEWED: "Tekshirilgan", RETURNED: "Qaytarilgan",
  ADMIN: "Admin", TEACHER: "Ustoz", PARENT: "Ota-ona", STUDENT: "Oʻquvchi", ENROLLING: "Qabul", FINISHED: "Yakunlangan",
};

function fmtVal(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" && ENUM_UZ[v]) return ENUM_UZ[v];
  if (typeof v === "boolean") return v ? "ha" : "yoʻq";
  if (typeof v === "number") return fmtNum(v);
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return `${fmtDateShort(v)} ${fmtTime(v)}`;
    return v;
  }
  return JSON.stringify(v);
}
const fieldName = (path: string) => {
  const last = path.split(".").pop() ?? path;
  return FIELD_UZ[last] ? `${FIELD_UZ[last]}${path.includes(".") ? ` (${path})` : ""}` : path;
};

// ─────────── Sahifa ───────────

export default function AdminAuditPage() {
  const [q, setQ] = useSearchParamState("q");
  const [role, setRole] = useSearchParamState("role");
  const [action, setAction] = useSearchParamState("action");
  const [entityType, setEntityType] = useSearchParamState("type");
  const [from, setFrom] = useSearchParamState("from");
  const [to, setTo] = useSearchParamState("to");
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [open, setOpen] = useState<string | null>(null);
  const dq = useDebouncedValue(q, 350);

  const filters = { q: dq || undefined, actorRole: role || undefined, action: action || undefined, entityType: entityType || undefined, from: from || undefined, to: to || undefined };
  const fKey = JSON.stringify(filters);
  useEffect(() => {
    setCursors([undefined]);
    setOpen(null);
  }, [fKey]);
  const cursor = cursors[cursors.length - 1];
  const pageNo = cursors.length;

  const list = useApiQuery<AuditPage>(["admin", "audit", "list"], "/admin/audit", {
    params: { ...filters, cursor, limit: LIMIT },
    placeholderData: (p) => p,
    refetchInterval: pageNo === 1 ? 30_000 : false,
  });
  const stats = useApiQuery<AuditStats>(["admin", "audit", "stats"], "/admin/audit/stats", { refetchInterval: 30_000 });
  const verify = useApiQuery<AuditVerify>(["admin", "audit", "verify"], "/admin/audit/verify", { staleTime: 5 * 60_000 });
  const facets = useApiQuery<AuditFacets>(["admin", "audit", "facets"], "/admin/audit/facets", { staleTime: 5 * 60_000 });

  const prefixes = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of facets.data?.actions ?? []) {
      const p = a.action.split(".")[0];
      m.set(p, (m.get(p) ?? 0) + a.count);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [facets.data]);

  const s = stats.data;
  const v = verify.data;
  const d = list.data;
  const hasFilters = Object.values(filters).some(Boolean);
  const clear = () => {
    setQ(null);
    setRole(null);
    setAction(null);
    setEntityType(null);
    setFrom(null);
    setTo(null);
  };
  const start = (pageNo - 1) * LIMIT;

  const chips: { label: string; clear: () => void }[] = [];
  if (role) chips.push({ label: `Rol: ${ROLE_UZ[role as keyof typeof ROLE_UZ] ?? role}`, clear: () => setRole(null) });
  if (action) chips.push({ label: `Amal: ${action.endsWith(".") ? PREFIX_LABEL[action.slice(0, -1)] ?? action : action}`, clear: () => setAction(null) });
  if (entityType) chips.push({ label: `Obyekt: ${ENTITY_UZ[entityType] ?? entityType}`, clear: () => setEntityType(null) });
  if (from || to) chips.push({ label: `Sana: ${from ? fmtDateShort(`${from}T12:00:00+05:00`) : "…"} — ${to ? fmtDateShort(`${to}T12:00:00+05:00`) : "…"}`, clear: () => (setFrom(null), setTo(null)) });
  if (dq) chips.push({ label: `Qidiruv: ${dq}`, clear: () => setQ(null) });

  return (
    <>
      <PageHeader
        title="Tizim jurnali (Audit log)"
        documentTitle="Tizim jurnali"
        subtitle="Barcha operatsiyalar, baholar oʻzgarishi, toʻlovlar va foydalanuvchilar faolligining toʻliq xronologik qaydnomasi"
        breadcrumbs={[{ label: "Boshqaruv markazi", to: "/admin" }, { label: "Xavfsizlik & Nazorat" }, { label: "Tizim jurnali (Audit log)" }]}
        actions={
          <>
            <ChainBadge v={v} loading={verify.isFetching} />
            <Button variant="secondary" icon="verified_user" loading={verify.isFetching} onClick={() => verify.refetch()}>
              Kriptografik tekshiruv
            </Button>
          </>
        }
      />

      {/* Kafolat banneri */}
      <Card className="mb-6 flex flex-col gap-4 border-l-4 border-l-primary p-5 sm:flex-row sm:items-start">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
          <Icon name="lock" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-label-lg text-label-lg text-on-surface">
            Tamper-evident audit xavfsizlik kafolati <Badge tone="primary" size="sm">SHA-256 IMMUTABLE</Badge>
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Tizim jurnali yozuvlarini oʻzgartirib yoki oʻchirib boʻlmaydi — bu maʼlumotlar bazasi darajasida taqiqlangan. Har bir yozuv oldingisining xeshi
            bilan SHA-256 zanjiriga bogʻlanadi: birorta yozuv oʻzgartirilsa, «Kriptografik tekshiruv» buzilgan joyni aniq koʻrsatadi.
          </p>
        </div>
        {s?.last ? (
          <button
            type="button"
            onClick={() => copyText(s.last!.hash, "Toʻliq xesh nusxalandi")}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-surface-container-low px-3 py-1.5 font-mono text-[12px] text-on-surface-variant hover:text-primary"
            title="Oxirgi yozuv xeshi — nusxalash"
          >
            <Icon name="fingerprint" size={16} /> chain-hash: #{s.last.hash.slice(0, 8)}…{s.last.hash.slice(-8)}
          </button>
        ) : null}
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jami yozuvlar" value={fmtNum(s?.total)} unit="ta" icon="dataset" loading={stats.isLoading} sub={s?.firstAt ? `${fmtDate(s.firstAt)} dan buyon` : undefined} subIcon="history" />
        <StatCard
          label="Bugungi amallar"
          value={fmtNum(s?.today)}
          unit="ta"
          icon="bolt"
          loading={stats.isLoading}
          delta={s?.changePercent != null ? { value: `${s.changePercent > 0 ? "+" : ""}${fmtNum(s.changePercent)}%`, positive: s.changePercent >= 0 } : undefined}
          sub={s?.changePercent != null ? "kechagiga nisbatan" : `Kecha: ${fmtNum(s?.yesterday ?? 0)} ta`}
        />
        <StatCard
          label="Xavfsizlik ogohlantirishlari"
          value={<span className={s?.securityAlertsToday ? "text-error" : undefined}>{fmtNum(s?.securityAlertsToday)}</span>}
          unit="ta"
          icon="shield"
          iconTone={s?.securityAlertsToday ? "danger" : "primary"}
          loading={stats.isLoading}
          onClick={s?.securityAlertsToday ? () => (setAction("auth.login_failed"), setFrom(new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10))) : undefined}
          subIcon={s?.securityAlertsToday ? "warning" : "check_circle"}
          subTone={s?.securityAlertsToday ? "danger" : undefined}
          sub={s?.securityAlertsToday ? "Bugungi muvaffaqiyatsiz kirishlar" : "Xavf aniqlanmadi"}
        />
        <StatCard
          label="Oxirgi yozuv"
          value={s?.last ? fmtTime(s.last.at) : "—"}
          icon="sync"
          loading={stats.isLoading}
          subIcon="autorenew"
          sub={s?.last ? `${fmtRelDateTime(s.last.at)} · #${s.last.id} · jonli (30 s)` : "Yozuv yoʻq"}
        />
      </div>

      {/* Filtrlar */}
      <Card className="mb-6 flex flex-col gap-3 p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-12">
          <SearchInput value={q} onValueChange={(x) => setQ(x)} placeholder="ID, foydalanuvchi, tafsilot, obyekt ID yoki IP boʻyicha qidiruv…" wrapperClassName="sm:col-span-2 xl:col-span-6" />
          <Select
            aria-label="Rol"
            wrapperClassName="xl:col-span-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[{ value: "", label: "Rol: Barchasi" }, ...(["ADMIN", "TEACHER", "PARENT", "STUDENT", "SYSTEM"] as const).map((r) => ({ value: r, label: ROLE_UZ[r] }))]}
          />
          <Select aria-label="Amal turi" wrapperClassName="xl:col-span-2" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">Amal turi: Barchasi</option>
            {prefixes.map(([p, c]) => (
              <optgroup key={p} label={`${PREFIX_LABEL[p] ?? p} (${fmtNum(c)})`}>
                <option value={`${p}.`}>{PREFIX_LABEL[p] ?? p} — hammasi</option>
                {(facets.data?.actions ?? [])
                  .filter((a) => a.action.startsWith(`${p}.`))
                  .map((a) => (
                    <option key={a.action} value={a.action}>
                      {a.action} ({fmtNum(a.count)})
                    </option>
                  ))}
              </optgroup>
            ))}
          </Select>
          <Select
            aria-label="Obyekt turi"
            wrapperClassName="xl:col-span-2"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            options={[{ value: "", label: "Obyekt: Barchasi" }, ...(facets.data?.entityTypes ?? []).map((t) => ({ value: t.entityType, label: `${ENTITY_UZ[t.entityType] ?? t.entityType} (${fmtNum(t.count)})` }))]}
          />
          <div className="flex min-w-0 max-w-md items-center gap-1 sm:col-span-2 xl:col-span-12">
            <Input type="date" aria-label="Boshlanish sanasi" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} size="md" className="px-2" />
            <span className="text-on-surface-muted">—</span>
            <Input type="date" aria-label="Tugash sanasi" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} size="md" className="px-2" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-body-sm">
            <span className="text-on-surface-variant">Faol filtrlar:</span>
            {chips.length ? (
              <>
                {chips.map((c) => (
                  <button key={c.label} type="button" onClick={c.clear} className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 font-label-md text-label-md text-on-surface hover:bg-surface-container-high">
                    {c.label} <Icon name="close" size={14} />
                  </button>
                ))}
                <Button variant="link" size="sm" onClick={clear}>
                  Filtrlarni tozalash
                </Button>
              </>
            ) : (
              <span className="text-on-surface-muted">yoʻq</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" icon="refresh" loading={list.isFetching && !list.isLoading} onClick={() => (list.refetch(), stats.refetch())}>
              Yangilash
            </Button>
            <ExportButton path="/admin/audit/export.csv" params={filters} filename="tizim-jurnali.csv" label="Excelʼga eksport (CSV)" size="sm" variant="outline" />
          </div>
        </div>
      </Card>

      {/* Jadval */}
      <Card className="overflow-hidden">
        <Table>
          <THead>
            <tr>
              <TH>Vaqt</TH>
              <TH>Foydalanuvchi</TH>
              <TH className="px-3">Amal</TH>
              <TH className="hidden px-3 md:table-cell">Obyekt</TH>
              <TH className="hidden px-3 lg:table-cell">Tafsilot</TH>
              <TH className="hidden px-3 xl:table-cell">IP / Qurilma</TH>
              <TH className="text-right">Batafsil</TH>
            </tr>
          </THead>
          <TBody>
            {list.isLoading ? (
              Array.from({ length: 8 }, (_, i) => (
                <TR key={i}>
                  {Array.from({ length: 7 }, (_, j) => (
                    <TD key={j} className={cn(j === 3 && "hidden md:table-cell", j === 4 && "hidden lg:table-cell", j === 5 && "hidden xl:table-cell")}>
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </TD>
                  ))}
                </TR>
              ))
            ) : !d?.items.length ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState compact icon="manage_search" title={hasFilters ? "Mos yozuv topilmadi" : "Jurnal boʻsh"} description={hasFilters ? "Filtrlarni oʻzgartirib koʻring" : undefined} />
                </td>
              </tr>
            ) : (
              d.items.map((r) => (
                <Fragment key={r.id}>
                  <AuditTableRow r={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} />
                  {open === r.id ? (
                    <tr className="bg-surface-container-low/60">
                      <td colSpan={7} className="px-3 py-4 sm:px-5">
                        <AuditDetailView id={r.id} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </TBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 px-5 py-3">
          <span className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
            <span className={cn("h-2 w-2 rounded-full", pageNo === 1 ? "animate-pulse bg-primary" : "bg-outline")} />
            {pageNo === 1 ? "Jonli audit yozuvi faol" : "Arxiv sahifasi"}
            {d ? (
              <span className="pl-2">
                · Koʻrsatilmoqda: {fmtNum(d.items.length ? start + 1 : 0)}–{fmtNum(start + d.items.length)} dan {fmtNum(d.total)} ta yozuv
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon="chevron_left" disabled={pageNo === 1} onClick={() => (setCursors((c) => c.slice(0, -1)), setOpen(null))}>
              Oldingi
            </Button>
            <span className="min-w-8 rounded-lg bg-primary px-2.5 py-1 text-center font-label-md text-label-md text-on-primary">{pageNo}</span>
            <Button variant="outline" size="sm" iconRight="chevron_right" disabled={!d?.nextCursor} onClick={() => (setCursors((c) => [...c, d!.nextCursor!]), setOpen(null))}>
              Keyingi
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}

function ChainBadge({ v, loading }: { v: AuditVerify | undefined; loading: boolean }) {
  if (loading && !v)
    return (
      <Badge tone="neutral" icon="hourglass_top" size="md">
        Tekshirilmoqda…
      </Badge>
    );
  if (!v) return null;
  return v.ok ? (
    <Badge tone="success" icon="verified" size="md" title={`${fmtNum(v.checked)} ta yozuv tekshirildi (${fmtNum(v.tookMs)} ms)`}>
      Zanjir butun · {fmtNum(v.checked)}
    </Badge>
  ) : (
    <Badge tone="danger" variant="solid" icon="gpp_bad" size="md">
      Buzilish aniqlandi (#{v.brokenAt})
    </Badge>
  );
}

function AuditTableRow({ r, open, onToggle }: { r: AuditRow; open: boolean; onToggle: () => void }) {
  const verb = verbOf(r.action);
  const roleKey = (r.actorRole ?? "SYSTEM") as keyof typeof ROLE_UZ;
  return (
    <TR className={cn("cursor-pointer hover:bg-surface-container-low", open && "bg-surface-container-low")} onClick={onToggle}>
      <TD className="whitespace-nowrap font-mono text-[12px] leading-5 text-on-surface">
        {fmtDateShort(r.at)}
        <br />
        <span className="text-on-surface-variant">{timeSec(r.at)}</span>
      </TD>
      <TD>
        <div className="flex min-w-[150px] items-center gap-2.5">
          {r.actor ? (
            <Avatar name={r.actor.fullName} size="sm" tone={roleKey === "ADMIN" ? "solid" : "soft"} />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
              <Icon name="smart_toy" size={18} />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-label-md text-label-md text-on-surface">{r.actor?.fullName ?? "URFON tizimi"}</p>
            <Badge tone={ROLE_TONE[roleKey]} size="sm" shape="square">
              {ROLE_UZ[roleKey]}
            </Badge>
          </div>
        </div>
      </TD>
      <TD className="px-3">
        <Badge tone={verb.tone} dot className="whitespace-nowrap">
          {verb.label}
        </Badge>
        <p className="mt-1 font-mono text-[11px] text-on-surface-muted">{r.action}</p>
      </TD>
      <TD className="hidden px-3 md:table-cell">
        <div className="flex max-w-[200px] items-start gap-2">
          <Icon name={ENTITY_ICON[r.entityType] ?? "description"} size={18} className="mt-0.5 shrink-0 text-on-surface-variant" />
          <div className="min-w-0">
            <p className="truncate text-body-sm font-medium text-on-surface">{r.entityLabel ?? ENTITY_UZ[r.entityType] ?? r.entityType}</p>
            <p className="truncate font-mono text-[11px] text-on-surface-muted">{r.entitySub ?? (r.entityId ? `${r.entityType} · ${r.entityId.slice(0, 10)}` : r.entityType)}</p>
          </div>
        </div>
      </TD>
      <TD className="hidden max-w-[320px] px-3 lg:table-cell">
        {r.preview.length ? (
          <div className="flex flex-col gap-1">
            {r.preview.map((c) => (
              <ChangeInline key={c.path} c={c} />
            ))}
          </div>
        ) : null}
        <p className={cn("text-body-sm text-on-surface-variant", r.preview.length ? "mt-1 line-clamp-1" : "line-clamp-2")}>{r.summary ?? "—"}</p>
      </TD>
      <TD className="hidden px-3 xl:table-cell">
        <p className="font-mono text-[12px] text-on-surface">{r.ip ?? "—"}</p>
        <p className="text-[11px] text-on-surface-muted">{shortUa(r.userAgent) ?? (r.actor ? "—" : "Rejali ish")}</p>
      </TD>
      <TD className="text-right">
        <IconButton icon={open ? "expand_less" : "expand_more"} label={open ? "Yopish" : "Batafsil"} size="sm" variant={open ? "secondary" : "ghost"} onClick={(e) => (e.stopPropagation(), onToggle())} />
      </TD>
    </TR>
  );
}

function ChangeInline({ c }: { c: AuditChange }) {
  return (
    <span className="flex flex-wrap items-center gap-1 text-body-sm">
      <span className="text-on-surface-variant">{fieldName(c.path)}:</span>
      <span className="rounded bg-error-container px-1.5 font-mono text-[12px] text-on-error-container line-through decoration-1">{fmtVal(c.before)}</span>
      <Icon name="arrow_forward" size={14} className="text-on-surface-muted" />
      <span className="rounded bg-primary-fixed px-1.5 font-mono text-[12px] text-on-primary-fixed-variant">{fmtVal(c.after)}</span>
    </span>
  );
}

function AuditDetailView({ id }: { id: string }) {
  const { data: d, isLoading, error } = useApiQuery<AuditDetail>(["admin", "audit", "detail", id], `/admin/audit/${id}`, { staleTime: Infinity });
  if (isLoading)
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  if (error || !d) return <Alert tone="danger">{error?.message ?? "Yozuv topilmadi"}</Alert>;
  const json = (v: unknown) => (v == null ? "—" : JSON.stringify(v, null, 2));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-surface-container-lowest px-4 py-3 text-body-sm">
        <span className="flex items-center gap-1.5">
          <Icon name="tag" size={16} className="text-on-surface-variant" /> Hodisa ID: <b className="font-mono text-primary">#{d.id}</b>
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="schedule" size={16} className="text-on-surface-variant" /> {fmtDate(d.at)}, {timeSec(d.at)}
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="category" size={16} className="text-on-surface-variant" /> {d.entityType}
          {d.entityId ? <span className="font-mono text-[12px] text-on-surface-muted">{d.entityId}</span> : null}
        </span>
        <Badge tone={d.integrity.hashValid ? "success" : "danger"} icon={d.integrity.hashValid ? "verified" : "gpp_bad"}>
          Xesh {d.integrity.hashValid ? "toʻgʻri" : "mos emas"}
        </Badge>
        <Badge tone={d.integrity.linkValid ? "success" : "danger"} icon={d.integrity.linkValid ? "link" : "link_off"}>
          Zanjir {d.integrity.linkValid ? "bogʻlangan" : "uzilgan"}
        </Badge>
        <button type="button" onClick={() => copyText(d.hash, "Xesh nusxalandi")} className="flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-surface-container px-2 py-1 font-mono text-[11px] text-on-surface-variant hover:text-primary" title="Toʻliq xeshni nusxalash">
          <span className="truncate">sha256: {d.hash}</span>
          <Icon name="content_copy" size={14} />
        </button>
      </div>

      {d.summary ? (
        <div className="rounded-xl bg-surface-container-lowest px-4 py-3">
          <p className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface">
            <Icon name="help" size={16} /> Tafsilot
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">{d.summary}</p>
        </div>
      ) : null}

      {d.changes.length ? (
        <div className="overflow-x-auto rounded-xl bg-surface-container-lowest">
          <table className="w-full min-w-[520px] text-left text-body-sm">
            <thead>
              <tr className="border-b border-outline-variant/60 text-on-surface-variant">
                <th className="px-4 py-2 font-label-sm text-label-sm uppercase tracking-wider">Maydon</th>
                <th className="px-4 py-2 font-label-sm text-label-sm uppercase tracking-wider text-error">Oldingi qiymat</th>
                <th className="px-4 py-2 font-label-sm text-label-sm uppercase tracking-wider text-primary">Yangi qiymat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {d.changes.map((c) => (
                <tr key={c.path}>
                  <td className="px-4 py-2 font-medium text-on-surface">{fieldName(c.path)}</td>
                  <td className="px-4 py-2 font-mono text-[12px] text-on-surface-variant">{c.kind === "added" ? <span className="text-on-surface-muted">—</span> : <span className="text-error line-through decoration-1">{fmtVal(c.before)}</span>}</td>
                  <td className="px-4 py-2 font-mono text-[12px] text-on-surface">{c.kind === "removed" ? <span className="text-on-surface-muted">oʻchirildi</span> : fmtVal(c.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {d.hasDiff ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <JsonPanel title="Oldingi qiymat (before)" dot="bg-error" body={json(d.before)} />
          <JsonPanel title="Yangi qiymat (after)" dot="bg-primary" body={json(d.after)} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl bg-surface-container-lowest px-4 py-3 text-body-sm">
          <p className="font-label-md text-label-md">Manba</p>
          <p className="mt-1 text-on-surface-variant">
            IP: <span className="font-mono">{d.ip ?? "—"}</span> · {d.actor ? `${d.actor.fullName} (${ROLE_UZ[d.actor.role]})` : "Tizim (rejali ish)"}
          </p>
          <p className="mt-1 font-mono text-[11px] text-on-surface-muted">prevHash: {d.prevHash ?? "— (zanjir boshi)"}</p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest px-4 py-3 text-body-sm">
          <p className="flex items-center gap-1.5 font-label-md text-label-md">
            <Icon name="devices" size={16} /> Toʻliq mijoz User-Agent
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-on-surface-variant">{d.userAgent ?? "—"}</p>
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-on-surface-muted">
        <Icon name="lock" size={14} /> Yozuv faqat oʻqish uchun — oʻzgartirib ham, oʻchirib ham boʻlmaydi. Parol va tokenlar jurnalga yozilmaydi.
      </p>
    </div>
  );
}

function JsonPanel({ title, dot, body }: { title: string; dot: string; body: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl bg-surface-container-lowest p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-label-md text-label-md">
          <span className={cn("h-2 w-2 rounded-full", dot)} /> {title}
        </span>
      </div>
      <pre className="max-h-72 overflow-auto rounded-lg bg-surface-container-low p-3 font-mono text-[12px] leading-5 text-on-surface">{body}</pre>
    </div>
  );
}
