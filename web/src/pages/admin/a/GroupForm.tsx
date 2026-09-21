// Guruh yaratish / tahrirlash dialogi (mockup: "Yangi guruh ochish va ustoz biriktirish").
import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Checkbox, Dialog, Field, Input, SearchInput, Select, Skeleton, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { fmtDays, fmtMoney, fmtNum, todayYmd, toYmd } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import type { Paginated } from "@/lib/types";
import { DayPicker, isTime, keys, MOBILE_FULL_CLASS, RoomPickList, TeacherPickList, useLookups } from "./shared";
import { toast } from "sonner";
import type { AdminStudentItem, GroupDetail, GroupRow } from "./types";

interface FormState {
  name: string;
  levelId: string;
  ageGroup: "TEENS" | "KIDS";
  roomId: string | null;
  teacherId: string | null;
  days: number[];
  startTime: string;
  endTime: string;
  capacity: string;
  monthlyFee: string;
  startDate: string;
  totalLessons: string;
  status: "ENROLLING" | "ACTIVE";
}

const empty = (): FormState => ({
  name: "",
  levelId: "",
  ageGroup: "TEENS",
  roomId: null,
  teacherId: null,
  days: [1, 3, 5],
  startTime: "14:00",
  endTime: "15:30",
  capacity: "16",
  monthlyFee: "200000",
  startDate: todayYmd(),
  totalLessons: "48",
  status: "ENROLLING",
});

const fromGroup = (g: GroupRow): FormState => ({
  name: g.name,
  levelId: g.level?.id ?? "",
  ageGroup: g.ageGroup ?? "TEENS",
  roomId: g.room?.id ?? null,
  teacherId: g.teacher?.id ?? null,
  days: g.days,
  startTime: g.startTime,
  endTime: g.endTime,
  capacity: String(g.capacity),
  monthlyFee: String(g.monthlyFee),
  startDate: toYmd(g.startDate),
  totalLessons: String(g.totalLessons),
  status: g.status === "FINISHED" ? "ACTIVE" : g.status,
});

type Errors = Partial<Record<keyof FormState, string>>;

// 24 soatlik vaqt (KANON: "14:00"), 07:00–21:45, 15 daqiqa qadam. Native time input brauzer lokaliga
// qarab "02:00 PM" ko'rsatishi mumkin, shuning uchun select.
const TIME_STEPS = Array.from({ length: (22 - 7) * 4 }, (_, i) => {
  const m = 7 * 60 + i * 15;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const timeOptions = (current: string) =>
  (TIME_STEPS.includes(current) || !current ? TIME_STEPS : [...TIME_STEPS, current].sort()).map((t) => ({ value: t, label: t }));

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Guruh nomini kiriting";
  if (!f.days.length) e.days = "Kamida bitta dars kunini tanlang";
  if (!isTime(f.startTime)) e.startTime = "HH:MM koʻrinishida";
  if (!isTime(f.endTime)) e.endTime = "HH:MM koʻrinishida";
  else if (isTime(f.startTime) && f.endTime <= f.startTime) e.endTime = "Tugash vaqti boshlanishdan keyin boʻlsin";
  const cap = Number(f.capacity);
  if (!Number.isInteger(cap) || cap < 1 || cap > 100) e.capacity = "1 dan 100 gacha";
  const fee = Number(f.monthlyFee);
  if (!Number.isInteger(fee) || fee < 0) e.monthlyFee = "Summani soʻmda kiriting";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.startDate)) e.startDate = "Sanani tanlang";
  const tl = Number(f.totalLessons);
  if (!Number.isInteger(tl) || tl < 1 || tl > 500) e.totalLessons = "1 dan 500 gacha";
  return e;
}

export function GroupFormDialog({
  open,
  onOpenChange,
  group,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash */
  group?: GroupRow | GroupDetail | null;
  onCreated?: (id: string) => void;
}) {
  const editing = !!group;
  const lookups = useLookups();
  const [f, setF] = useState<FormState>(empty);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [students, setStudents] = useState<AdminStudentItem[]>([]);

  useEffect(() => {
    if (open) {
      setF(group ? fromGroup(group) : empty());
      setTouched(false);
      setServerError(null);
      setStudents([]);
    }
  }, [open, group]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const errors = validate(f);
  const hasErrors = Object.keys(errors).length > 0;
  const err = (k: keyof FormState) => (touched ? errors[k] : undefined);

  const slot = { days: f.days, startTime: f.startTime, endTime: f.endTime, startDate: f.startDate, excludeGroupId: group?.id };
  const scheduleChanged =
    editing &&
    group &&
    (f.days.join(",") !== group.days.join(",") ||
      f.startTime !== group.startTime ||
      f.endTime !== group.endTime ||
      f.startDate !== toYmd(group.startDate) ||
      Number(f.totalLessons) !== group.totalLessons);

  const create = useApiMutation(
    (body: object) => api.post<{ id: string; code: string; lessonsCreated: number }>("/admin/groups", body),
    { invalidate: keys("groups"), silentError: true },
  );
  const update = useApiMutation(
    (body: object) => api.put<{ ok: true; lessons: { rescheduled: number; created: number } | null; activated: number }>(`/admin/groups/${group?.id}`, body),
    { invalidate: keys("groups"), silentError: true },
  );
  const pending = create.isPending || update.isPending;

  const submit = async () => {
    setTouched(true);
    setServerError(null);
    if (hasErrors) return;
    const body = {
      name: f.name.trim(),
      levelId: f.levelId || null,
      ageGroup: f.ageGroup,
      roomId: f.roomId,
      days: f.days,
      startTime: f.startTime,
      endTime: f.endTime,
      capacity: Number(f.capacity),
      monthlyFee: Number(f.monthlyFee),
      startDate: f.startDate,
      totalLessons: Number(f.totalLessons),
      status: f.status,
    };
    try {
      if (!editing) {
        const res = await create.mutateAsync({ ...body, teacherId: f.teacherId });
        let enrolled = 0;
        const failed: string[] = [];
        for (const s of students) {
          try {
            await api.post(`/admin/students/${s.id}/enrollments`, { groupId: res.id, status: f.status === "ENROLLING" ? "WAITING" : "ACTIVE" });
            enrolled++;
          } catch (e) {
            failed.push(`${s.fullName}: ${e instanceof ApiError ? e.message : "xato"}`);
          }
        }
        toast.success(`Guruh ochildi: ${res.code} · ${res.lessonsCreated} ta dars rejalashtirildi${enrolled ? ` · ${enrolled} ta oʻquvchi qoʻshildi` : ""}`);
        if (failed.length) toast.error(`Baʼzi oʻquvchilar qoʻshilmadi: ${failed.join("; ")}`);
        onOpenChange(false);
        onCreated?.(res.id);
      } else if (group) {
        // faqat o'zgargan maydonlar
        const initial = fromGroup(group);
        const changed = Object.fromEntries(
          Object.entries(body).filter(([k, v]) => {
            const before = k === "days" ? initial.days : (initial as unknown as Record<string, unknown>)[k];
            const norm = (x: unknown) => (typeof x === "number" ? String(x) : Array.isArray(x) ? x.join(",") : x ?? "");
            return norm(v) !== norm(k === "levelId" ? initial.levelId || null : before);
          }),
        );
        if (!Object.keys(changed).length) {
          onOpenChange(false);
          return;
        }
        const res = await update.mutateAsync(changed);
        const n = res.lessons ? res.lessons.rescheduled + res.lessons.created : 0;
        toast.success(`Guruh saqlandi${n ? ` · kelajakdagi ${n} ta dars qayta rejalandi` : ""}${res.activated ? ` · ${res.activated} ta oʻquvchi faollashtirildi` : ""}`);
        onOpenChange(false);
      }
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Saqlab boʻlmadi");
    }
  };

  const levels = lookups.data?.levels ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !pending && onOpenChange(o)}
      size="lg"
      className={MOBILE_FULL_CLASS}
      title={editing ? `${group?.name} — tahrirlash` : "Yangi guruh ochish va ustoz biriktirish"}
      description={editing ? `${group?.code} · akademik reja va dars jadvali` : "Akademik reja, dars jadvali va masʼul ustozni belgilang"}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Bekor qilish
          </Button>
          <Button icon="verified" onClick={submit} loading={pending} disabled={touched && hasErrors}>
            {editing ? "Saqlash" : "Saqlash va guruhni ochish"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {serverError ? <Alert tone="danger" title="Saqlanmadi">{serverError}</Alert> : null}
        <Field label="Guruh nomi" required error={err("name")} hint="Oʻquvchilar kabineti va toʻlov kvitansiyalarida koʻrinadi">
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Masalan: IELTS Foundation #5" maxLength={80} autoFocus={!editing} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Bosqich (Level)">
            {lookups.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={f.levelId}
                onChange={(e) => set("levelId", e.target.value)}
                placeholder="Levelsiz"
                options={levels.map((l) => ({ value: l.id, label: l.label ?? l.name }))}
              />
            )}
          </Field>
          <Field label="Yosh toifasi" hint="Dars rejasi va darslar soni shunga qarab tanlanadi">
            <Tabs value={f.ageGroup} onValueChange={(v) => set("ageGroup", v as FormState["ageGroup"])} variant="segmented">
              <TabsList className="w-full">
                <TabsTrigger value="TEENS" className="flex-1 justify-center">
                  13–16 yosh
                </TabsTrigger>
                <TabsTrigger value="KIDS" className="flex-1 justify-center">
                  8–12 yosh
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </Field>
          <Field label="Guruh holati">
            <Tabs value={f.status} onValueChange={(v) => set("status", v as FormState["status"])} variant="segmented">
              <TabsList className="w-full">
                <TabsTrigger value="ENROLLING" className="flex-1 justify-center">
                  Yangi qabul
                </TabsTrigger>
                <TabsTrigger value="ACTIVE" className="flex-1 justify-center">
                  Faol
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </Field>
        </div>

        <Field label="Dars kunlari (haftalik jadval)" required error={err("days")} hint={f.days.length ? `${fmtDays(f.days, f.startTime, f.endTime)}` : undefined}>
          <DayPicker value={f.days} onChange={(d) => set("days", d)} invalid={!!err("days")} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Dars boshlanishi" required error={err("startTime")}>
            <Select value={f.startTime} onChange={(e) => set("startTime", e.target.value)} options={timeOptions(f.startTime)} />
          </Field>
          <Field label="Dars tugashi" required error={err("endTime")}>
            <Select value={f.endTime} onChange={(e) => set("endTime", e.target.value)} options={timeOptions(f.endTime)} />
          </Field>
          <Field label="Boshlanish sanasi" required error={err("startDate")}>
            <Input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="Jami darslar soni" required error={err("totalLessons")}>
            <Input type="number" inputMode="numeric" min={1} max={500} value={f.totalLessons} onChange={(e) => set("totalLessons", e.target.value)} />
          </Field>
          <Field label="Sigʻim (oʻrin)" required error={err("capacity")}>
            <Input type="number" inputMode="numeric" min={1} max={100} value={f.capacity} onChange={(e) => set("capacity", e.target.value)} />
          </Field>
          <Field label="Oylik toʻlov" required error={err("monthlyFee")} hint={Number(f.monthlyFee) > 0 ? fmtMoney(Number(f.monthlyFee)) : undefined}>
            <Input type="number" inputMode="numeric" min={0} step={10000} value={f.monthlyFee} onChange={(e) => set("monthlyFee", e.target.value)} rightSlot={<span className="pr-2 text-body-sm">soʻm</span>} />
          </Field>
        </div>
        {scheduleChanged ? (
          <Alert tone="primary" icon="event_repeat">
            Jadval oʻzgarsa, faqat <b>kelajakdagi rejalashtirilgan</b> darslar qayta tuziladi. Oʻtilgan va bekor qilingan darslarga tegilmaydi.
          </Alert>
        ) : !editing ? (
          <p className="-mt-2 text-body-sm text-on-surface-muted">
            Saqlanganda {fmtNum(Number(f.totalLessons) || 0)} ta dars jadvali avtomatik yaratiladi (boshlanish sanasidan, tanlangan kunlarda).
          </p>
        ) : null}

        <div className="rounded-xl bg-surface-container-low p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="font-label-lg text-label-lg text-on-surface">Auditoriya / xona</span>
            <span className="text-body-sm text-on-surface-muted">Tanlangan vaqt boʻyicha bandlik</span>
          </div>
          <RoomPickList slot={slot} capacity={Number(f.capacity) || undefined} value={f.roomId} onChange={(id) => set("roomId", id)} allowNone />
        </div>

        {!editing ? (
          <>
            <div className="rounded-xl bg-primary-light p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-label-lg text-label-lg text-on-surface">Masʼul ustoz biriktirish</span>
                <span className="text-body-sm text-primary">Boʻsh ustozlar yuqorida</span>
              </div>
              <TeacherPickList slot={slot} value={f.teacherId} onChange={(id) => set("teacherId", id)} allowNone />
            </div>
            <StudentPicker selected={students} onChange={setStudents} />
          </>
        ) : (
          <p className="text-body-sm text-on-surface-muted">Ustozni almashtirish guruh kartasidagi “Ustoz biriktirish” orqali amalga oshiriladi.</p>
        )}
      </form>
    </Dialog>
  );
}

/** Oʻquvchilarni tanlash (admin-b: GET /api/admin/students?q=). */
export function StudentPicker({
  selected,
  onChange,
  excludeIds,
  title = "Oʻquvchilarni guruhga qoʻshish",
}: {
  selected: AdminStudentItem[];
  onChange: (s: AdminStudentItem[]) => void;
  excludeIds?: string[];
  title?: string;
}) {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const res = useApiQuery<Paginated<AdminStudentItem>>(["admin", "students", "picker"], "/admin/students", {
    params: { q: dq, pageSize: 8, page: 1 },
    placeholderData: (p) => p,
  });
  const exclude = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);
  const items = (res.data?.items ?? []).filter((s) => !exclude.has(s.id));
  const isSel = (id: string) => selected.some((s) => s.id === id);
  const toggle = (s: AdminStudentItem) => onChange(isSel(s.id) ? selected.filter((x) => x.id !== s.id) : [...selected, s]);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-label-lg text-label-lg text-on-surface">{title}</span>
        <Badge tone="primary">Tanlandi: {selected.length} nafar</Badge>
      </div>
      <SearchInput value={q} onValueChange={setQ} placeholder="Ism, ID (ST-8501) yoki telefon…" size="sm" />
      <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto rounded-lg bg-surface-container-low p-2">
        {res.error ? (
          <p className="p-2 text-body-sm text-on-surface-muted">Oʻquvchilar roʻyxati hozircha yuklanmadi: {res.error.message}</p>
        ) : res.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-11 w-full" />)
        ) : items.length === 0 ? (
          <p className="p-2 text-body-sm text-on-surface-muted">Hech kim topilmadi</p>
        ) : (
          items.map((s) => (
            <label key={s.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-surface-container-lowest p-2 hover:bg-surface-container">
              <span className="flex min-w-0 items-center gap-2.5">
                <Checkbox checked={isSel(s.id)} onChange={() => toggle(s)} />
                <span className="min-w-0">
                  <span className="block truncate font-label-md text-label-md text-on-surface">{s.fullName}</span>
                  <span className="block truncate text-body-sm text-on-surface-variant">
                    #{s.code}
                    {s.groups.length ? ` · ${s.groups.map((g) => g.name).join(", ")}` : " · guruhsiz"}
                  </span>
                </span>
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
