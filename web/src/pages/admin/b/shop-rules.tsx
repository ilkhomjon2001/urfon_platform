// Admin → Tanga doʻkoni → «Qoidalar va mukofotlar»: XP/kumush jadvali (bosqich boʻyicha) va musobaqa, tanlov,
// taqdimot uchun qoʻlda mukofot berish. Barcha raqamlar API dan (api/src/config/gamification.ts).
import { useEffect, useState } from "react";
import { Button, Card, Dialog, Field, Icon, Input, SearchInput, Select, Skeleton, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtNum } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";

const KEY = ["admin", "shop"];
const INV = [KEY, ["me", "nav-badges"]];

type RuleRow = { key: string; title: string; xp: number; kumush: number[] };
type RulesData = { stages: number[]; activity: { min: number; max: number }; groups: { key: string; title: string; rules: RuleRow[] }[]; awardable: string[] };
type StudentHit = { id: string; fullName: string; code: string | null; balance: number };
type GroupHit = { id: string; code: string; name: string; students: number };

export function RulesTab() {
  const q = useApiQuery<RulesData>([...KEY, "rules"], "/admin/shop/rules", { staleTime: 10 * 60_000 });
  const [award, setAward] = useState(false);
  const d = q.data;
  if (q.isLoading || !d) return <Skeleton className="h-96 rounded-xl" />;
  return (
    <div className="flex flex-col gap-6">
      <Card className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <h2 className="font-headline-md text-headline-md text-on-surface">XP va kumush qanday ishlaydi</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              <b>XP (tajriba)</b> faqat oshadi va hech qachon sarflanmaydi — XP ga qarab bosqich (0–8) belgilanadi. <b>Kumush</b> doʻkonda sarflanadi: bir xil harakat uchun
              bosqich qancha yuqori boʻlsa, shuncha koʻp kumush beriladi. Dars va baholar uchun tizim oʻzi beradi; musobaqa, tanlov va taqdimot uchun shu yerdan qoʻlda berasiz.
            </p>
          </div>
          <Button icon="emoji_events" onClick={() => setAward(true)} className="shrink-0">
            Mukofot berish
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {d.stages.map((min, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1 text-body-sm">
              <b className="text-on-surface">{i}-bosqich</b>
              <span className="tabular-nums text-on-surface-muted">{fmtNum(min)}+ XP</span>
            </span>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-body-sm">
            <thead>
              <tr className="bg-surface-container-low text-left">
                <th className="sticky left-0 z-10 bg-surface-container-low px-4 py-3 font-label-md text-label-md text-on-surface-variant">Nima uchun</th>
                <th className="px-3 py-3 text-right font-label-md text-label-md text-on-surface-variant">XP</th>
                {d.stages.map((_, i) => (
                  <th key={i} className="px-2 py-3 text-right font-label-md text-label-md text-on-surface-variant" title={`${i}-bosqichda kumush`}>
                    {i}-bosq.
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.groups.map((g) => (
                <RuleGroupRows key={g.key} title={g.title} rules={g.rules} cols={d.stages.length} />
              ))}
              <tr className="border-t border-outline-variant bg-surface-container-lowest">
                <td className="sticky left-0 bg-surface-container-lowest px-4 py-2.5 text-on-surface">Darsdagi faollik (ustoz belgilaydi)</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-on-surface-muted">
                  {d.activity.min}…{d.activity.max}
                </td>
                <td colSpan={d.stages.length} className="px-2 py-2.5 text-on-surface-muted">
                  Barcha bosqichda +{d.activity.min}…+{d.activity.max} kumush
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="border-t border-outline-variant px-4 py-3 text-body-sm text-on-surface-muted">
          Ustunlar — bosqich boʻyicha kumush. 5+ baho faqat foizli imtihonda (95–100) beriladi, 3 dan past bahoga kumush berilmaydi. Darsga kechikib kelganga dars kumushi
          berilmaydi.
        </p>
      </Card>
      {award ? <AwardDialog data={d} onClose={() => setAward(false)} /> : null}
    </div>
  );
}

function RuleGroupRows({ title, rules, cols }: { title: string; rules: RuleRow[]; cols: number }) {
  return (
    <>
      <tr className="border-t border-outline-variant bg-surface-container-lowest">
        <td colSpan={cols + 2} className="px-4 pb-1 pt-3 font-label-sm text-label-sm uppercase tracking-wide text-primary">
          {title}
        </td>
      </tr>
      {rules.map((r) => (
        <tr key={r.key} className="bg-surface-container-lowest hover:bg-surface-container-low">
          <td className="sticky left-0 bg-inherit px-4 py-2 text-on-surface">{r.title}</td>
          <td className="px-3 py-2 text-right font-label-md text-label-md tabular-nums text-on-surface">{fmtNum(r.xp)}</td>
          {r.kumush.map((k, i) => (
            <td key={i} className="px-2 py-2 text-right tabular-nums text-on-surface-variant">
              {fmtNum(k)}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function AwardDialog({ data, onClose }: { data: RulesData; onClose: () => void }) {
  const awardGroups = data.groups.filter((g) => g.rules.some((r) => data.awardable.includes(r.key)));
  const [groupKey, setGroupKey] = useState(awardGroups[0]?.key ?? "");
  const rulesOf = awardGroups.find((g) => g.key === groupKey)?.rules ?? [];
  const [ruleKey, setRuleKey] = useState(rulesOf[0]?.key ?? "");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"students" | "group">("students");
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 250);
  const [picked, setPicked] = useState<StudentHit[]>([]);
  const [groupId, setGroupId] = useState("");
  const studentsQ = useApiQuery<{ items: StudentHit[] }>([...KEY, "students"], mode === "students" ? "/admin/shop/students" : null, { params: { q: dq } });
  const groupsQ = useApiQuery<{ items: GroupHit[] }>([...KEY, "groups"], mode === "group" ? "/admin/shop/groups" : null);
  const rule = rulesOf.find((r) => r.key === ruleKey);

  // tadbir turi almashsa — birinchi natija tanlanadi
  useEffect(() => {
    if (!rulesOf.some((r) => r.key === ruleKey)) setRuleKey(rulesOf[0]?.key ?? "");
  }, [groupKey, rulesOf, ruleKey]);

  const give = useApiMutation(
    () =>
      api.post<{ given: { fullName: string; kumush: number; xp: number }[] }>("/admin/shop/awards", {
        rule: ruleKey,
        note: note.trim(),
        studentIds: mode === "students" ? picked.map((p) => p.id) : [],
        groupId: mode === "group" ? groupId : null,
      }),
    { invalidate: INV, success: (r) => `Mukofot berildi: ${r.given.length} ta oʻquvchi`, onSuccess: onClose },
  );
  const ready = !!rule && note.trim().length >= 2 && (mode === "students" ? picked.length > 0 : !!groupId);
  const toggle = (s: StudentHit) => setPicked((p) => (p.some((x) => x.id === s.id) ? p.filter((x) => x.id !== s.id) : [...p, s]));

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Mukofot berish"
      description="Musobaqa, tanlov yoki taqdimot uchun XP va kumush — har bir oʻquvchiga oʻz bosqichiga qarab"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button icon="emoji_events" disabled={!ready} loading={give.isPending} onClick={() => give.mutate()}>
            Mukofot berish
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tadbir turi">
            <Select value={groupKey} onChange={(e) => setGroupKey(e.target.value)} options={awardGroups.map((g) => ({ value: g.key, label: g.title }))} />
          </Field>
          <Field label="Natija">
            <Select value={ruleKey} onChange={(e) => setRuleKey(e.target.value)} options={rulesOf.map((r) => ({ value: r.key, label: r.title.replace(/^.*— /, "") }))} />
          </Field>
        </div>
        {rule ? (
          <p className="rounded-lg bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant">
            <b className="text-on-surface">+{fmtNum(rule.xp)} XP</b> va kumush bosqichga qarab: {fmtNum(rule.kumush[0])} (0-bosqich) … {fmtNum(rule.kumush[rule.kumush.length - 1])} (8-bosqich)
          </p>
        ) : null}
        <Field label="Tadbir nomi" required hint="Oʻquvchi va ota-onaga bildirishnomada koʻrinadi">
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Masalan: Spelling Bee — kuzgi bosqich" />
        </Field>
        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} variant="segmented">
          <TabsList>
            <TabsTrigger value="students">Oʻquvchilarni tanlash</TabsTrigger>
            <TabsTrigger value="group">Butun guruh</TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === "students" ? (
          <div className="flex flex-col gap-2">
            {picked.length ? (
              <div className="flex flex-wrap gap-1.5">
                {picked.map((p) => (
                  <button key={p.id} type="button" onClick={() => toggle(p)} className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2.5 py-1 text-body-sm text-on-primary-fixed-variant">
                    {p.fullName}
                    <Icon name="close" size={14} />
                  </button>
                ))}
              </div>
            ) : null}
            <SearchInput value={q} onValueChange={setQ} placeholder="Ism yoki ST-kod" />
            <ul className="flex max-h-56 flex-col divide-y divide-outline-variant overflow-y-auto rounded-lg border border-outline-variant">
              {studentsQ.isLoading ? (
                <li className="p-3">
                  <Skeleton className="h-8" />
                </li>
              ) : !studentsQ.data?.items.length ? (
                <li className="p-4 text-center text-body-sm text-on-surface-muted">Oʻquvchi topilmadi</li>
              ) : (
                studentsQ.data.items.map((s) => {
                  const on = picked.some((x) => x.id === s.id);
                  return (
                    <li key={s.id}>
                      <button type="button" onClick={() => toggle(s)} aria-pressed={on} className={cn("flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-container-low", on && "bg-primary-fixed/40")}>
                        <span className="text-body-md text-on-surface">
                          {s.fullName} <span className="text-on-surface-muted">{s.code}</span>
                        </span>
                        <Icon name={on ? "check_box" : "check_box_outline_blank"} size={20} className={on ? "text-primary" : "text-outline"} />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : (
          <Field label="Guruh" hint="Guruhdagi barcha faol oʻquvchilarga beriladi (masalan, 3 oylik taqdimot)">
            <Select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              placeholder="Guruhni tanlang"
              options={(groupsQ.data?.items ?? []).map((g) => ({ value: g.id, label: `${g.code} · ${g.name} (${g.students} oʻquvchi)` }))}
            />
          </Field>
        )}
      </div>
    </Dialog>
  );
}
