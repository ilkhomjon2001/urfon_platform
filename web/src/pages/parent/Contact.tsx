// /ota-ona/aloqa — ustoz bilan aloqa. Umumiy ChatView + /api/messages/*.
//   ?t=<threadId> — suhbatni ochadi; ?to=<teacherId> — shu ustoz bilan suhbat (yo'q bo'lsa "Yangi suhbat" oynasi).
// GROUP (e'lonlar) suhbatlari faqat o'qish uchun.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Dialog, EmptyState, Icon, PageHeader, Textarea } from "@/components/ui";
import { ChatView, type ChatMessage, type ChatThread } from "@/components/chat/ChatView";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { fmtDayMonth } from "@/lib/format";
import { useSelectedChild } from "@/lib/parent-child";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { TeacherAvatar } from "./p/shared";
import type { FileInfo } from "./p/types";

interface Person {
  id: string;
  fullName: string;
  role: "ADMIN" | "TEACHER" | "PARENT" | "STUDENT";
  title: string | null;
  avatarUrl: string | null;
}

interface ThreadRow {
  id: string;
  kind: "DIRECT" | "GROUP";
  subject: string | null;
  title: string;
  participants: Person[];
  group: { id: string; name: string } | null;
  student: { id: string; fullName: string } | null;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  lastMessageAt: string;
  unread: number;
}

interface MessageRow {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  lessonId: string | null;
  isQuestion: boolean;
  createdAt: string;
  sender: Person;
  files: FileInfo[];
  lesson: { id: string; title: string | null; startsAt: string } | null;
}

interface ContactTeacher extends Person {
  teacherProfile: { responseTime: string | null } | null;
  teachingGroups: { id: string; name: string }[];
}

interface Contacts {
  teachers: ContactTeacher[];
  admins: Person[];
}

const QUICK = [
  "Farzandim darsda qanday qatnashdi?",
  "Uyga vazifa nima edi?",
  "Qaysi mavzularni takrorlash kerak?",
  "Keyingi darsga nima tayyorlash kerak?",
  "Farzandim bugun darsga kela olmaydi.",
];

/** /api/files/:id suratlari <img> bilan ochilmaydi (Bearer kerak) — bosh harflarga qaytamiz. */
const plainAvatar = (url: string | null | undefined) => (url && !url.startsWith("/api/files/") ? url : null);

const roleLabel = (p?: Person | null) =>
  !p ? null : p.role === "TEACHER" ? (p.title ?? "Ustoz") : p.role === "ADMIN" ? (p.title ?? "Maʼmuriyat") : p.role === "PARENT" ? "Ota-ona" : "Oʻquvchi";

type Filter = "all" | "child" | "group";

export default function ParentContact() {
  const user = useCurrentUser();
  const { child } = useSelectedChild();
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const activeId = sp.get("t");
  const toParam = sp.get("to");
  const [filter, setFilter] = useState<Filter>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [preselect, setPreselect] = useState<string | null>(null);

  const threadsQ = useApiQuery<ThreadRow[]>(["messages", "threads"], "/messages/threads", { refetchInterval: 10_000 });
  const msgsQ = useApiQuery<MessageRow[]>(["messages", "thread", activeId], activeId ? `/messages/threads/${activeId}` : null, { refetchInterval: 10_000 });
  const contactsQ = useApiQuery<Contacts>(["messages", "contacts"], "/messages/contacts", { staleTime: 5 * 60_000 });

  const threads = threadsQ.data ?? [];
  const active = threads.find((t) => t.id === activeId) ?? null;

  const select = (id: string) => {
    const next = new URLSearchParams(sp);
    next.set("t", id);
    next.delete("to");
    setSp(next, { replace: true });
  };

  // ?to=<teacherId> — mavjud suhbatni ochish yoki yangi suhbat oynasi
  useEffect(() => {
    if (!toParam || !threadsQ.data) return;
    const withTeacher = threadsQ.data.filter((t) => t.kind === "DIRECT" && t.participants.some((p) => p.id === toParam));
    const existing = withTeacher.find((t) => (t.student?.id ?? null) === (child?.id ?? null)) ?? withTeacher[0];
    const next = new URLSearchParams(sp);
    next.delete("to");
    if (existing) next.set("t", existing.id);
    else {
      setPreselect(toParam);
      setNewOpen(true);
    }
    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toParam, threadsQ.data]);

  // O'qilmagan suhbat ochilganda sidebar badge'i va ro'yxat yangilanadi
  const activeUnread = active?.unread ?? 0;
  useEffect(() => {
    if (activeUnread > 0 && msgsQ.dataUpdatedAt) {
      void qc.invalidateQueries({ queryKey: ["messages", "threads"] });
      void qc.invalidateQueries({ queryKey: ["me", "nav-badges"] });
    }
  }, [activeUnread, msgsQ.dataUpdatedAt, qc]);

  const send = useApiMutation(
    async ({ text, files }: { text: string; files: File[] }) => {
      let fileIds: string[] | undefined;
      if (files.length) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        const r = await api.upload<{ files: { id: string }[] }>("/files", fd);
        fileIds = r.files.map((f) => f.id);
      }
      return api.post(`/messages/threads/${activeId}/messages`, { body: text, fileIds });
    },
    { invalidate: [["messages", "thread", activeId], ["messages", "threads"]] },
  );

  const filtered = useMemo(
    () =>
      threads.filter((t) =>
        filter === "all" ? true : filter === "group" ? t.kind === "GROUP" : t.kind === "DIRECT" && t.student?.id === child?.id,
      ),
    [threads, filter, child?.id],
  );

  const chatThreads: ChatThread[] = filtered.map((t) => {
    const other = t.participants[0];
    const isGroup = t.kind === "GROUP";
    const last = t.lastMessage;
    return {
      id: t.id,
      title: isGroup ? (t.group?.name ?? t.title) : t.title,
      subtitle: isGroup
        ? `Guruh eʼlonlari${t.subject && t.subject !== t.group?.name ? ` · ${t.subject}` : ""}`
        : [roleLabel(other), t.student ? `${t.student.fullName} haqida` : null].filter(Boolean).join(" · "),
      avatarUrl: isGroup ? null : plainAvatar(other?.avatarUrl),
      icon: isGroup ? "campaign" : undefined,
      lastMessage: last ? `${last.senderId === user.id ? "Siz: " : ""}${last.body || "Fayl"}` : null,
      lastAt: last?.createdAt ?? t.lastMessageAt,
      unread: t.unread,
    };
  });

  const messages: ChatMessage[] = (msgsQ.data ?? []).map((m) => ({
    id: m.id,
    authorId: m.senderId,
    authorName: m.sender.fullName,
    authorAvatarUrl: plainAvatar(m.sender.avatarUrl),
    authorRole: roleLabel(m.sender),
    text: m.body,
    createdAt: m.createdAt,
    attachments: m.files.map((f) => ({ id: f.id, name: f.originalName, size: f.size, mime: f.mime, fileId: f.id })),
    badge: m.isQuestion ? (m.lesson ? `Savol · ${fmtDayMonth(m.lesson.startsAt)} darsi` : "Savol") : m.lesson ? `${fmtDayMonth(m.lesson.startsAt)} darsi` : undefined,
  }));

  const isGroup = active?.kind === "GROUP";
  const groupTeacher = isGroup ? contactsQ.data?.teachers.find((t) => t.teachingGroups.some((g) => g.id === active?.group?.id)) : null;
  const directTeacher = !isGroup && active ? contactsQ.data?.teachers.find((t) => active.participants.some((p) => p.id === t.id)) : null;

  const openNew = (teacherId: string | null = null) => {
    setPreselect(teacherId);
    setNewOpen(true);
  };

  const chips: { value: Filter; label: string }[] = [
    { value: "all", label: "Barchasi" },
    ...(child ? [{ value: "child" as const, label: child.fullName.split(" ")[0] }] : []),
    { value: "group", label: "Eʼlonlar" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ustoz bilan aloqa"
        subtitle={child ? `${child.fullName}ning ustozlari bilan yozishmalar va guruh eʼlonlari` : "Ustozlar bilan yozishmalar"}
        actions={
          <Button icon="edit_square" onClick={() => openNew(null)}>
            Yangi suhbat
          </Button>
        }
        className="mb-0"
      />

      <div>
        <ChatView
          readOnly={isGroup}
          readOnlyNote="Guruh eʼlonlari faqat oʻqish uchun. Savolingizni ustozga shaxsiy xabarda yozing."
          threads={chatThreads}
          activeId={activeId}
          onSelect={select}
          messages={messages}
          currentUserId={user.id}
          onSend={(text, files) => {
            if (isGroup) return Promise.reject(new Error("readonly"));
            return send.mutateAsync({ text, files });
          }}
          threadsLoading={threadsQ.isLoading}
          messagesLoading={msgsQ.isLoading && !!activeId}
          sending={send.isPending}
          quickReplies={QUICK}
          allowAttachments
          accept="image/*,audio/*,.pdf,.doc,.docx"
          placeholder="Ustozga xabar yozing…"
          // sahifa sarlavhasi + "Yangi suhbat" tugmasi mobilda balandroq — composer pastki panel ostida qolmasin
          className="h-[calc(100dvh-21.5rem)] min-h-[420px] sm:h-[calc(100dvh-17rem)] lg:h-[calc(100dvh-13rem)]"
          threadFilters={
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFilter(c.value)}
                  className={cn(
                    "rounded-full px-3 py-1 font-label-md text-label-md transition-colors",
                    filter === c.value ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          }
          headerActions={
            isGroup ? (
              <>
                <Badge tone="neutral" icon="visibility">
                  Faqat oʻqish
                </Badge>
                {groupTeacher ? (
                  <Button size="sm" variant="outline" icon="chat" onClick={() => openNew(groupTeacher.id)}>
                    <span className="hidden sm:inline">Ustozga yozish</span>
                  </Button>
                ) : null}
              </>
            ) : directTeacher?.teacherProfile?.responseTime ? (
              <Badge tone="primary" icon="bolt" className="hidden sm:inline-flex">
                Javob: {directTeacher.teacherProfile.responseTime}
              </Badge>
            ) : null
          }
          composerNote={
            <p className="flex items-center gap-1.5 text-[11px] text-on-surface-muted">
              <Icon name="lock" size={14} />
              Yozishmalar faqat siz va ustoz oʻrtasida koʻrinadi
            </p>
          }
          emptyThreads={
            <EmptyState
              compact
              icon="forum"
              title={filter === "group" ? "Eʼlonlar yoʻq" : "Suhbatlar yoʻq"}
              description={filter === "group" ? undefined : "Ustozga birinchi xabaringizni yozing."}
              action={
                filter === "group" ? undefined : (
                  <Button size="sm" icon="edit_square" onClick={() => openNew(null)}>
                    Yangi suhbat
                  </Button>
                )
              }
            />
          }
        />
      </div>

      <NewConversationDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        contacts={contactsQ.data}
        loading={contactsQ.isLoading}
        preselect={preselect}
        studentId={child?.id ?? null}
        childName={child?.fullName ?? null}
        onStarted={(threadId) => {
          setNewOpen(false);
          select(threadId);
        }}
      />
    </div>
  );
}

function NewConversationDialog({
  open,
  onOpenChange,
  contacts,
  loading,
  preselect,
  studentId,
  childName,
  onStarted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contacts: Contacts | undefined;
  loading: boolean;
  preselect: string | null;
  studentId: string | null;
  childName: string | null;
  onStarted: (threadId: string) => void;
}) {
  const [to, setTo] = useState<string | null>(null);
  const [text, setText] = useState("");
  useEffect(() => {
    if (open) {
      setTo(preselect ?? contacts?.teachers[0]?.id ?? null);
      setText("");
    }
  }, [open, preselect, contacts]);

  const start = useApiMutation(
    () => api.post<{ threadId: string }>("/messages", { toUserId: to, studentId, body: text.trim() }),
    { invalidate: [["messages"]], success: "Xabar yuborildi", onSuccess: (r) => onStarted(r.threadId) },
  );

  const people: (Person & { groups?: string; response?: string | null; kind: "teacher" | "admin" })[] = [
    ...(contacts?.teachers ?? []).map((t) => ({ ...t, kind: "teacher" as const, groups: t.teachingGroups.map((g) => g.name).join(", "), response: t.teacherProfile?.responseTime })),
    ...(contacts?.admins ?? []).map((a) => ({ ...a, kind: "admin" as const })),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Yangi suhbat"
      description={childName ? `${childName} haqida xabar` : undefined}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button iconRight="send" loading={start.isPending} disabled={!to || !text.trim()} onClick={() => start.mutate()}>
            Yuborish
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 font-label-md text-label-md text-on-surface">Kimga</p>
          {loading ? (
            <p className="text-body-md text-on-surface-variant">Yuklanmoqda…</p>
          ) : people.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">Yozish mumkin boʻlgan ustoz topilmadi.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {people.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTo(p.id)}
                  aria-pressed={to === p.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    to === p.id ? "border-primary bg-primary-light" : "border-outline-variant/70 hover:border-primary/50",
                  )}
                >
                  <TeacherAvatar teacher={p} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-label-lg text-label-lg text-on-surface">{p.fullName}</span>
                    <span className="block truncate text-body-sm text-on-surface-variant">
                      {p.kind === "teacher" ? p.groups || (p.title ?? "Ustoz") : (p.title ?? "Maʼmuriyat")}
                    </span>
                    {p.response ? <span className="block truncate text-[11px] text-on-surface-muted">Javob: {p.response}</span> : null}
                  </span>
                  {to === p.id ? <Icon name="check_circle" className="shrink-0 text-primary" filled /> : null}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 font-label-md text-label-md text-on-surface">Tezkor savollar</p>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setText(q)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-body-sm transition-colors",
                  text === q ? "border-primary bg-primary-light text-primary" : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary hover:text-primary",
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="new-msg" className="mb-2 block font-label-md text-label-md text-on-surface">
            Xabar
          </label>
          <Textarea id="new-msg" rows={4} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Savol yoki xabaringizni yozing…" />
        </div>
      </div>
    </Dialog>
  );
}
