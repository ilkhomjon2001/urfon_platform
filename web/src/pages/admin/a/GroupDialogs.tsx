// Guruh sahifasidagi kichik dialoglar: ustoz / xona biriktirish, xonalar boshqaruvi, o'quvchi qo'shish.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Alert, Badge, Button, ConfirmDialog, Dialog, EmptyState, Field, IconButton, Input, Select, Skeleton, Table, TBody, TD, TH, THead, TR,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { fmtNum, toYmd } from "@/lib/format";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { StudentPicker } from "./GroupForm";
import { keys, MOBILE_FULL_CLASS, RoomPickList, TeacherPickList } from "./shared";
import type { AdminStudentItem, GroupRow, RoomRow } from "./types";

type GroupSlot = Pick<GroupRow, "id" | "name" | "days" | "startTime" | "endTime" | "startDate" | "capacity" | "scheduleText"> & {
  teacher: { id: string; fullName: string } | null;
  room: { id: string; name: string } | null;
};

// ─── Ustoz biriktirish ───
export function AssignTeacherDialog({ group, onClose }: { group: GroupSlot | null; onClose: () => void }) {
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  useEffect(() => {
    setValue(group?.teacher?.id ?? null);
    setError(null);
  }, [group]);
  const save = useApiMutation((teacherId: string | null) => api.put(`/admin/groups/${group?.id}/teacher`, { teacherId }), {
    invalidate: keys("groups"),
    silentError: true,
  });
  const submit = async (teacherId: string | null) => {
    setError(null);
    try {
      await save.mutateAsync(teacherId);
      toast.success(teacherId ? "Ustoz biriktirildi. Ustozga bildirishnoma yuborildi" : "Ustoz guruhdan olib tashlandi");
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab boʻlmadi");
      throw e;
    }
  };
  return (
    <>
      <Dialog
        open={!!group}
        onOpenChange={(o) => !o && !save.isPending && onClose()}
        size="md"
        className={MOBILE_FULL_CLASS}
        title={`${group?.name ?? ""} guruhiga ustoz biriktirish`}
        description={group ? `Jadval: ${group.scheduleText}. Band ustozlarni tanlab boʻlmaydi.` : undefined}
        footer={
          <>
            {group?.teacher ? (
              <Button variant="ghost" icon="person_remove" className="mr-auto text-error" onClick={() => setConfirmRemove(true)} disabled={save.isPending}>
                Olib tashlash
              </Button>
            ) : null}
            <Button variant="outline" onClick={onClose} disabled={save.isPending}>
              Bekor qilish
            </Button>
            <Button
              variant="navy"
              icon="person_check"
              loading={save.isPending}
              disabled={!value || value === group?.teacher?.id}
              onClick={() => void submit(value).catch(() => {})}
            >
              Biriktirish
            </Button>
          </>
        }
      >
        {error ? <Alert tone="danger" title="Biriktirilmadi" className="mb-4">{error}</Alert> : null}
        {group ? (
          <TeacherPickList
            slot={{ days: group.days, startTime: group.startTime, endTime: group.endTime, startDate: toYmd(group.startDate), excludeGroupId: group.id }}
            value={value}
            onChange={setValue}
          />
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Ustoz guruhdan olib tashlansinmi?"
        description={`${group?.teacher?.fullName ?? ""} ${group?.name ?? ""} guruhidan olib tashlanadi. Guruh “Ustozsiz” holatiga oʻtadi.`}
        confirmLabel="Olib tashlash"
        onConfirm={() => submit(null)}
      />
    </>
  );
}

// ─── Xona biriktirish ───
export function AssignRoomDialog({ group, onClose }: { group: GroupSlot | null; onClose: () => void }) {
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setValue(group?.room?.id ?? null);
    setError(null);
  }, [group]);
  const save = useApiMutation((roomId: string | null) => api.put<{ lessonsUpdated: number }>(`/admin/groups/${group?.id}/room`, { roomId }), {
    invalidate: keys("groups"),
    silentError: true,
  });
  const submit = async () => {
    setError(null);
    try {
      const r = await save.mutateAsync(value);
      toast.success(`Xona saqlandi${r.lessonsUpdated ? ` · ${r.lessonsUpdated} ta kelajakdagi dars yangilandi` : ""}`);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab boʻlmadi");
    }
  };
  return (
    <Dialog
      open={!!group}
      onOpenChange={(o) => !o && !save.isPending && onClose()}
      size="md"
      className={MOBILE_FULL_CLASS}
      title={`${group?.name ?? ""} — xona biriktirish`}
      description={group ? `Jadval: ${group.scheduleText}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Bekor qilish
          </Button>
          <Button icon="meeting_room" loading={save.isPending} disabled={value === (group?.room?.id ?? null)} onClick={submit}>
            Saqlash
          </Button>
        </>
      }
    >
      {error ? <Alert tone="danger" title="Saqlanmadi" className="mb-4">{error}</Alert> : null}
      {group ? (
        <RoomPickList
          slot={{ days: group.days, startTime: group.startTime, endTime: group.endTime, startDate: toYmd(group.startDate), excludeGroupId: group.id }}
          capacity={group.capacity}
          value={value}
          onChange={setValue}
          allowNone
        />
      ) : null}
    </Dialog>
  );
}

// ─── Xonalar boshqaruvi ───
interface RoomForm {
  id: string | null;
  name: string;
  location: string;
  capacity: string;
  kind: string;
}
const emptyRoom: RoomForm = { id: null, name: "", location: "", capacity: "16", kind: "" };

export function RoomsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const rooms = useApiQuery<{ items: RoomRow[] }>(["admin", "rooms"], open ? "/admin/rooms" : null);
  const [form, setForm] = useState<RoomForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const save = useApiMutation(
    (f: RoomForm) => {
      const body = { name: f.name.trim(), location: f.location.trim() || null, capacity: Number(f.capacity), kind: f.kind.trim() || null };
      return f.id ? api.put(`/admin/rooms/${f.id}`, body) : api.post("/admin/rooms", body);
    },
    { invalidate: [["admin", "rooms"], ["admin", "lookups"]], silentError: true },
  );
  const submit = async () => {
    if (!form) return;
    if (!form.name.trim()) return setError("Xona nomini kiriting");
    const cap = Number(form.capacity);
    if (!Number.isInteger(cap) || cap < 1) return setError("Sigʻim musbat butun son boʻlsin");
    setError(null);
    try {
      await save.mutateAsync(form);
      toast.success(form.id ? "Xona saqlandi" : "Yangi xona qoʻshildi");
      setForm(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Saqlab boʻlmadi");
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      className={MOBILE_FULL_CLASS}
      title="Xonalar (auditoriyalar)"
      description="Xonalar sigʻimi va haftalik bandligi. Guruhga xona biriktirishda vaqt toʻqnashuvi avtomatik tekshiriladi."
      footer={
        form ? (
          <>
            <Button variant="outline" onClick={() => setForm(null)} disabled={save.isPending}>
              Bekor qilish
            </Button>
            <Button icon="save" onClick={submit} loading={save.isPending}>
              {form.id ? "Saqlash" : "Xonani qoʻshish"}
            </Button>
          </>
        ) : (
          <Button icon="add" onClick={() => setForm(emptyRoom)}>
            Yangi xona
          </Button>
        )
      }
    >
      {form ? (
        <div className="mb-5 rounded-xl bg-surface-container-low p-4">
          <div className="mb-3 font-label-lg text-label-lg">{form.id ? "Xonani tahrirlash" : "Yangi xona"}</div>
          {error ? <Alert tone="danger" className="mb-3">{error}</Alert> : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Field label="Nomi" required className="sm:col-span-1">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="204-xona" autoFocus />
            </Field>
            <Field label="Joylashuv" className="sm:col-span-1">
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bosh bino, 2-qavat" />
            </Field>
            <Field label="Sigʻim" required>
              <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </Field>
            <Field label="Turi">
              <Input value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} placeholder="Audio Lab" />
            </Field>
          </div>
        </div>
      ) : null}
      {rooms.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : rooms.error ? (
        <Alert tone="danger">{rooms.error.message}</Alert>
      ) : !rooms.data?.items.length ? (
        <EmptyState compact icon="meeting_room" title="Xonalar yoʻq" description="Birinchi xonani qoʻshing" />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Xona</TH>
              <TH className="text-right">Sigʻim</TH>
              <TH>Guruhlar</TH>
              <TH className="text-right">Haftalik</TH>
              <TH className="text-right">Amal</TH>
            </tr>
          </THead>
          <TBody>
            {rooms.data.items.map((r) => (
              <TR key={r.id}>
                <TD>
                  <div className="font-label-lg text-label-lg">{r.name}</div>
                  <div className="text-body-sm text-on-surface-variant">{[r.location, r.kind].filter(Boolean).join(" · ") || "—"}</div>
                </TD>
                <TD className="text-right tabular-nums">{fmtNum(r.capacity)}</TD>
                <TD>
                  {r.groups.length ? (
                    <div className="flex max-w-md flex-wrap gap-1">
                      {r.groups.map((g) => (
                        <Badge key={g.id} tone="neutral" shape="square" title={`${g.scheduleText}${g.teacherName ? ` · ${g.teacherName}` : ""}`}>
                          {g.name} · {g.scheduleText.split(", ")[1]}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-body-sm text-on-surface-muted">Boʻsh</span>
                  )}
                </TD>
                <TD className="text-right tabular-nums">{fmtNum(r.weeklyHours)} soat</TD>
                <TD className="text-right">
                  <IconButton
                    icon="edit"
                    label="Tahrirlash"
                    size="sm"
                    onClick={() => {
                      setError(null);
                      setForm({ id: r.id, name: r.name, location: r.location ?? "", capacity: String(r.capacity), kind: r.kind ?? "" });
                    }}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Dialog>
  );
}

// ─── Guruhga o'quvchi qo'shish (admin-b endpointi) ───
export function AddStudentsDialog({
  group,
  existingIds,
  onClose,
}: {
  group: { id: string; name: string; status: GroupRow["status"]; capacity: number; studentsCount: number } | null;
  existingIds: string[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<AdminStudentItem[]>([]);
  const [status, setStatus] = useState<"ACTIVE" | "WAITING">("ACTIVE");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const qcInvalidate = useApiMutation(async () => undefined, { invalidate: [...keys("groups"), ["admin", "students"]] });
  useEffect(() => {
    setSelected([]);
    setErrors([]);
    setStatus(group?.status === "ENROLLING" ? "WAITING" : "ACTIVE");
  }, [group]);
  const free = group ? group.capacity - group.studentsCount : 0;
  const submit = async () => {
    if (!group) return;
    setPending(true);
    const fails: string[] = [];
    let ok = 0;
    for (const s of selected) {
      try {
        await api.post(`/admin/students/${s.id}/enrollments`, { groupId: group.id, status });
        ok++;
      } catch (e) {
        fails.push(`${s.fullName}: ${e instanceof ApiError ? e.message : "xato"}`);
      }
    }
    setPending(false);
    await qcInvalidate.mutateAsync();
    if (ok) toast.success(`${ok} ta oʻquvchi guruhga qoʻshildi`);
    if (fails.length) setErrors(fails);
    else onClose();
  };
  return (
    <Dialog
      open={!!group}
      onOpenChange={(o) => !o && !pending && onClose()}
      size="md"
      className={MOBILE_FULL_CLASS}
      title={`${group?.name ?? ""} — oʻquvchi qoʻshish`}
      description={group ? `Boʻsh oʻrinlar: ${Math.max(0, free)} ta` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Yopish
          </Button>
          <Button icon="person_add" onClick={submit} loading={pending} disabled={!selected.length}>
            Qoʻshish ({selected.length})
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {errors.length ? (
          <Alert tone="danger" title="Baʼzi oʻquvchilar qoʻshilmadi">
            <ul className="list-disc pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Alert>
        ) : null}
        {status === "ACTIVE" && selected.length > free ? (
          <Alert tone="warning">Tanlanganlar soni boʻsh oʻrinlardan koʻp ({Math.max(0, free)} ta). “Kutish roʻyxati” holatini tanlang.</Alert>
        ) : null}
        <Field label="Holat">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as "ACTIVE" | "WAITING")}
            options={[
              { value: "ACTIVE", label: "Faol — darslarga qatnashadi" },
              { value: "WAITING", label: "Kutish roʻyxati — guruh boshlanishini kutadi" },
            ]}
          />
        </Field>
        <StudentPicker selected={selected} onChange={setSelected} excludeIds={existingIds} title="Oʻquvchilar" />
      </div>
    </Dialog>
  );
}
