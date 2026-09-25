// Admin → Kirish maʼlumotlari: oʻquvchi va ota-onalarning login/parollari.
// Parollar shifrlangan holda saqlanadi — eskisini koʻrsatib boʻlmaydi, faqat yangi vaqtinchalik parol beriladi.
// Yangilangan parollar shu sahifada bir marta koʻrsatiladi: CSV (Excel) ga yuklash, nusxalash yoki chop etish mumkin.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Icon,
  PageHeader,
  SearchInput,
  Select,
  Skeleton,
  StatCard,
} from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtNum, fmtRelDateTime } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks";
import { useApiQuery, toastError } from "@/lib/query";
import { copyText } from "./b/shared";

const KEY = ["admin", "credentials"];

type Person = { userId: string; fullName: string; login: string; neverLoggedIn: boolean; pending: boolean; lastLoginAt: string | null; code?: string | null; relation?: string };
type Family = { student: Person; group: { id: string; code: string; name: string; status: string } | null; parents: Person[] };
type ListData = { families: Family[]; stats: { students: number; parents: number; neverLoggedIn: number; active: number } };
type NewCred = { userId: string; role: "STUDENT" | "PARENT"; fullName: string; login: string; password: string; student: string | null };

/** Oilaning belgilanadigan aʼzolari (faqat hali kirmaganlar rejimida — kirmaganlari). */
const familyIds = (f: Family, onlyPending: boolean) => [f.student, ...f.parents].filter((p) => !onlyPending || p.neverLoggedIn).map((p) => p.userId);

export default function AdminCredentialsPage() {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [group, setGroup] = useState("");
  const [onlyPending, setOnlyPending] = useState(true);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [issued, setIssued] = useState<NewCred[] | null>(null);
  const [busy, setBusy] = useState(false);

  const listQ = useApiQuery<ListData>(KEY, "/admin/credentials", { params: { q: dq || undefined, groupId: group || undefined } });
  const groupsQ = useApiQuery<{ items: { id: string; code: string; name: string }[] }>([...KEY, "groups"], "/admin/shop/groups", { staleTime: 5 * 60_000 });

  const families = useMemo(() => {
    const all = listQ.data?.families ?? [];
    return onlyPending ? all.filter((f) => f.student.neverLoggedIn || f.parents.some((p) => p.neverLoggedIn)) : all;
  }, [listQ.data, onlyPending]);

  const everyone = useMemo(() => families.flatMap((f) => [f.student, ...f.parents]), [families]);
  const selectable = everyone.filter((p) => !onlyPending || p.neverLoggedIn);
  const allPicked = selectable.length > 0 && selectable.every((p) => picked.has(p.userId));
  const pickedActive = everyone.filter((p) => picked.has(p.userId) && !p.neverLoggedIn).length;

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleFamily = (f: Family) => {
    const ids = familyIds(f, onlyPending);
    setPicked((s) => {
      const n = new Set(s);
      const on = ids.every((id) => n.has(id));
      for (const id of ids) (on ? n.delete(id) : n.add(id));
      return n;
    });
  };
  const toggleAll = () => setPicked(allPicked ? new Set() : new Set(selectable.map((p) => p.userId)));

  const issue = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ count: number; skipped: number; credentials: NewCred[] }>("/admin/credentials/reset", {
        userIds: [...picked],
        includeActive: pickedActive > 0,
      });
      setIssued(r.credentials);
      setPicked(new Set());
      await listQ.refetch();
      toast.success(`${r.count} ta akkauntga yangi parol berildi`);
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  const s = listQ.data?.stats;

  return (
    <>
      <PageHeader
        title="Kirish maʼlumotlari"
        documentTitle="Kirish maʼlumotlari"
        breadcrumbs={[{ label: "Boshqaruv markazi", to: "/admin" }, { label: "Oʻquvchilar va ota-onalar", to: "/admin/oquvchilar" }, { label: "Kirish maʼlumotlari" }]}
        subtitle="Oʻquvchi va ota-onalarning loginlari; kerakli kishilarga bir yoʻla yangi vaqtinchalik parol berib, roʻyxatni chop etasiz"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Oʻquvchilar" value={fmtNum(s?.students)} icon="school" loading={listQ.isLoading} />
        <StatCard label="Ota-onalar" value={fmtNum(s?.parents)} icon="family_restroom" loading={listQ.isLoading} />
        <StatCard label="Hali kirmagan" value={fmtNum(s?.neverLoggedIn)} icon="lock" iconTone={s?.neverLoggedIn ? "warning" : "neutral"} sub="parol berish kerak" loading={listQ.isLoading} />
        <StatCard label="Kabinetdan foydalanmoqda" value={fmtNum(s?.active)} icon="how_to_reg" iconTone="success" loading={listQ.isLoading} />
      </div>

      {issued ? <IssuedCard creds={issued} onClose={() => setIssued(null)} /> : null}

      <Alert tone="primary" icon="info" className="mb-6" title="Parollar haqida">
        Parollar bazada shifrlangan holda saqlanadi, shuning uchun eski parolni koʻrsatib boʻlmaydi. Kerakli kishilarni belgilab, <b>«Parol berish»</b> ni bossangiz,
        ularga yangi vaqtinchalik parol yaratiladi va shu yerda bir marta koʻrsatiladi. Birinchi kirishda tizim parolni almashtirishni soʻraydi.
      </Alert>

      <Card className="overflow-hidden">
        <CardHeader
          title="Oʻquvchilar va ota-onalar"
          description={`${families.length} ta oila · belgilangan: ${picked.size}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Barcha guruhlar" wrapperClassName="w-48" options={(groupsQ.data?.items ?? []).map((g) => ({ value: g.id, label: `${g.code} · ${g.name}` }))} />
              <SearchInput value={q} onValueChange={setQ} placeholder="Ism yoki login" className="w-56" />
              <Button icon="key" disabled={!picked.size || busy} loading={busy} onClick={() => setConfirm(true)}>
                Parol berish ({picked.size})
              </Button>
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-4 border-y border-outline-variant bg-surface-container-low px-5 py-3">
          <Checkbox checked={allPicked} onChange={toggleAll} label={allPicked ? "Belgilashni bekor qilish" : "Hammasini belgilash"} />
          <Checkbox checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} label="Faqat hali kirmaganlar" description="Kabinetdan foydalanayotganlarning paroli tegilmaydi" />
        </div>
        <CardContent className="p-0">
          {listQ.isLoading ? (
            <div className="flex flex-col gap-2 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : !families.length ? (
            <EmptyState icon="how_to_reg" title="Roʻyxat boʻsh" description={onlyPending ? "Hamma kabinetga kirgan — yangi parol kerak emas." : "Oʻquvchi topilmadi."} />
          ) : (
            <ul className="divide-y divide-outline-variant">
              {families.map((f) => (
                <li key={f.student.userId} className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Checkbox checked={familyIds(f, onlyPending).length > 0 && familyIds(f, onlyPending).every((id) => picked.has(id))} onChange={() => toggleFamily(f)} />
                    <PersonRow p={f.student} role="Oʻquvchi" picked={picked.has(f.student.userId)} onToggle={() => toggle(f.student.userId)} extra={f.group ? `${f.group.code} · ${f.group.name}` : "guruhsiz"} />
                  </div>
                  <div className="ml-9 mt-2 flex flex-col gap-2">
                    {f.parents.map((p) => (
                      <PersonRow key={p.userId} p={p} role={`Ota-ona · ${p.relation ?? ""}`.trim()} picked={picked.has(p.userId)} onToggle={() => toggle(p.userId)} />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`${picked.size} ta akkauntga yangi parol berilsinmi?`}
        description={
          pickedActive
            ? `Belgilanganlardan ${pickedActive} tasi kabinetdan foydalanmoqda — ularning hozirgi paroli ishlamay qoladi va ular tizimdan chiqariladi.`
            : "Yangi vaqtinchalik parollar roʻyxati shu sahifada bir marta koʻrsatiladi — chop eting yoki yuklab oling."
        }
        confirmLabel="Ha, parol berish"
        tone={pickedActive ? "danger" : "primary"}
        onConfirm={issue}
      />
    </>
  );
}

function PersonRow({ p, role, picked, onToggle, extra }: { p: Person; role: string; picked: boolean; onToggle: () => void; extra?: string }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={picked} className={cn("flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1.5 text-left hover:bg-surface-container-low", picked && "bg-primary-fixed/40")}>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-label-lg text-label-lg text-on-surface">{p.fullName}</span>
        <span className="block truncate text-body-sm text-on-surface-muted">
          {role}
          {extra ? ` · ${extra}` : ""}
        </span>
      </span>
      <span className="font-mono text-body-sm text-on-surface-variant">{p.login}</span>
      {p.neverLoggedIn ? (
        <Badge tone="warning" icon="lock" size="sm">
          Hali kirmagan
        </Badge>
      ) : (
        <Badge tone="success" icon="how_to_reg" size="sm">
          {p.lastLoginAt ? fmtRelDateTime(p.lastLoginAt) : "Kirgan"}
        </Badge>
      )}
    </button>
  );
}

function IssuedCard({ creds, onClose }: { creds: NewCred[]; onClose: () => void }) {
  const text = creds.map((c) => `${c.role === "STUDENT" ? "Oʻquvchi" : "Ota-ona"}: ${c.fullName} — login: ${c.login}, parol: ${c.password}`).join("\n");
  const csv = ["Kim;Ism;Oʻquvchi;Login;Vaqtinchalik parol"]
    .concat(creds.map((c) => [c.role === "STUDENT" ? "Oʻquvchi" : "Ota-ona", c.fullName, c.student ?? "", c.login, c.password].join(";")))
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
    <Card className="mb-6 border-success/40">
      <CardHeader
        icon="key"
        title={`${creds.length} ta yangi parol`}
        description="Bu parollar faqat hozir koʻrinadi. Yuklab oling yoki chop eting — sahifani yopgach, faqat qayta parol berish mumkin."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon="download" onClick={download}>
              CSV (Excel)
            </Button>
            <Button variant="outline" icon="content_copy" onClick={() => copyText(text, "Kirish maʼlumotlari nusxalandi")}>
              Nusxalash
            </Button>
            <Button variant="outline" icon="print" onClick={() => window.print()}>
              Chop etish
            </Button>
            <Button variant="ghost" icon="close" onClick={onClose}>
              Yopish
            </Button>
          </div>
        }
      />
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-body-sm">
            <thead className="sticky top-0 bg-surface-container-low">
              <tr className="text-left">
                <th className="px-5 py-2 font-label-sm text-label-sm text-on-surface-variant">Kim</th>
                <th className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">Ism</th>
                <th className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">Oʻquvchi</th>
                <th className="px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">Login</th>
                <th className="px-5 py-2 font-label-sm text-label-sm text-on-surface-variant">Vaqtinchalik parol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {creds.map((c) => (
                <tr key={c.userId}>
                  <td className="whitespace-nowrap px-5 py-2 text-on-surface-muted">
                    <Icon name={c.role === "STUDENT" ? "school" : "family_restroom"} size={16} className="mr-1 align-text-bottom" />
                    {c.role === "STUDENT" ? "Oʻquvchi" : "Ota-ona"}
                  </td>
                  <td className="px-3 py-2 text-on-surface">{c.fullName}</td>
                  <td className="px-3 py-2 text-on-surface-muted">{c.role === "PARENT" ? c.student : "—"}</td>
                  <td className="px-3 py-2 font-mono text-on-surface">{c.login}</td>
                  <td className="px-5 py-2 font-mono font-semibold text-on-surface">{c.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
