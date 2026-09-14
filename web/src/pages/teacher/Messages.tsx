// Ustoz: Xabarlar va muloqot markazi (mockup: urfon_xabarlar_va_muloqot_markazi_mukammal_dizayn).
// Suhbatlar /api/messages/*, guruh e'lonlari /api/teacher/announcements (ota-onalar faqat o'qiydi).
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ChatView, type ChatMessage, type ChatThread } from "@/components/chat/ChatView";
import { Avatar, Badge, Button, Card, Dialog, EmptyState, Field, Icon, IconButton, PageHeader, SearchInput, Select, Skeleton, Textarea, buttonVariants } from "@/components/ui";
import { api, downloadFile } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { fmtDays, fmtFileSize, fmtNum, fmtRelDateTime } from "@/lib/format";
import { useSearchParamState } from "@/lib/hooks";
import { toastError, useApiMutation, useApiQuery } from "@/lib/query";
import { ACCEPT_ALL, INV, MAX_UPLOAD_MB, TB, tooLarge, uploadFiles } from "./b/api";
import type { Announcement, MsgUser, TeacherContacts, TeacherGroup, ThreadItem, ThreadMessage } from "./b/types";
import { KpiCard, QueryError } from "./b/ui";

const QUICK_REPLIES = [
  "Topshiriq qabul qilindi va tekshirilmoqda.",
  "Uyga vazifani soat 20:00 gacha yuklang.",
  "Ertangi dars vaqti va xonasi oʻzgardi.",
  "Rahmat, maʼlumot uchun!",
  "Darsdan keyin batafsil gaplashamiz.",
];

type Filter = "all" | "unread" | "parents" | "students" | "groups";
const relWord = (r: string | null | undefined) => (r === "Ota" ? "otasi" : r === "Ona" ? "onasi" : "ota-onasi");
const roleLabel = (u: MsgUser) => (u.role === "STUDENT" ? "Oʻquvchi" : u.role === "ADMIN" ? (u.title ?? "Administrator") : u.role === "PARENT" ? (u.title ?? "Ota-ona") : (u.title ?? "Ustoz"));

export default function TeacherMessagesPage() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [active, setActive] = useSearchParamState("t", "");
  const [filter, setFilter] = useSearchParamState("f", "all");
  const [toParam, setToParam] = useSearchParamState("to", "");
  const [newOpen, setNewOpen] = useState(false);
  const [ann, setAnn] = useState<{ groupId?: string } | null>(null);

  const threadsQ = useApiQuery<ThreadItem[]>([TB, "b-threads"], "/messages/threads", { refetchInterval: 10_000 });
  const msgsQ = useApiQuery<ThreadMessage[]>([TB, "b-thread", active], active ? `/messages/threads/${active}` : null, { refetchInterval: 10_000 });
  const groupsQ = useApiQuery<TeacherGroup[]>([TB, "ann-groups"], "/teacher/announcements/groups");

  const threads = useMemo(() => threadsQ.data ?? [], [threadsQ.data]);
  const groups = useMemo(() => groupsQ.data ?? [], [groupsQ.data]);
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
  const activeThread = threads.find((t) => t.id === active) ?? null;

  // ?to=<userId> — boshqa sahifalardan "Ota-onaga yozish"
  useEffect(() => {
    if (toParam) setNewOpen(true);
  }, [toParam]);

  // suhbat ochilganda (o'qildi deb belgilanadi) ro'yxat va sidebar badge'ini yangilash
  const unreadActive = activeThread?.unread ?? 0;
  useEffect(() => {
    if (msgsQ.dataUpdatedAt && unreadActive > 0) {
      void qc.invalidateQueries({ queryKey: [TB, "b-threads"] });
      void qc.invalidateQueries({ queryKey: ["me", "nav-badges"] });
    }
  }, [msgsQ.dataUpdatedAt, unreadActive, qc]);

  const counts = useMemo(
    () => ({
      all: threads.length,
      unread: threads.filter((t) => t.unread > 0).length,
      parents: threads.filter((t) => t.kind === "DIRECT" && t.participants[0]?.role === "PARENT").length,
      students: threads.filter((t) => t.kind === "DIRECT" && t.participants[0]?.role === "STUDENT").length,
      groups: threads.filter((t) => t.kind === "GROUP").length,
    }),
    [threads],
  );

  const chatThreads: ChatThread[] = useMemo(() => {
    const f = filter as Filter;
    return threads
      .filter((t) =>
        f === "unread"
          ? t.unread > 0
          : f === "parents"
            ? t.kind === "DIRECT" && t.participants[0]?.role === "PARENT"
            : f === "students"
              ? t.kind === "DIRECT" && t.participants[0]?.role === "STUDENT"
              : f === "groups"
                ? t.kind === "GROUP"
                : true,
      )
      .map((t) => {
        const last = t.lastMessage ? `${t.lastMessage.senderId === me.id ? "Siz: " : ""}${t.lastMessage.body || "Fayl yuborildi"}` : null;
        if (t.kind === "GROUP") {
          const g = t.group ? groupById.get(t.group.id) : undefined;
          return {
            id: t.id,
            title: t.group?.name ?? t.title,
            subtitle: `${g?.code ? `${g.code} • ` : ""}Eʼlonlar kanali · ${g?.parents ?? t.participants.length} ota-ona`,
            icon: "campaign",
            lastMessage: last,
            lastAt: t.lastMessage?.createdAt ?? t.lastMessageAt,
            unread: t.unread,
          };
        }
        const o = t.participants[0];
        const subtitle = !o
          ? null
          : o.role === "PARENT"
            ? t.student
              ? `${t.student.fullName}ning ${relWord(o.title)}`
              : (o.title ?? "Ota-ona")
            : o.role === "STUDENT"
              ? (o.title ?? "Oʻquvchi")
              : roleLabel(o);
        return {
          id: t.id,
          title: o?.fullName ?? t.title,
          subtitle,
          avatarUrl: o && o.role !== "STUDENT" ? o.avatarUrl : null,
          lastMessage: last,
          lastAt: t.lastMessage?.createdAt ?? t.lastMessageAt,
          unread: t.unread,
        };
      });
  }, [threads, filter, groupById, me.id]);

  const messages: ChatMessage[] = useMemo(
    () =>
      (msgsQ.data ?? []).map((m) => ({
        id: m.id,
        authorId: m.senderId,
        authorName: m.sender.fullName,
        authorAvatarUrl: m.sender.role === "STUDENT" ? null : m.sender.avatarUrl,
        authorRole: m.sender.id === me.id ? null : roleLabel(m.sender),
        text: m.body || null,
        createdAt: m.createdAt,
        badge: m.isQuestion ? (m.lesson ? "Dars haqida savol" : "Savol") : undefined,
        attachments: m.files.map((f) => ({ id: f.id, name: f.originalName, size: f.size, mime: f.mime, fileId: f.id })),
      })),
    [msgsQ.data, me.id],
  );

  const send = useApiMutation(
    async ({ text, files }: { text: string; files: File[] }) => {
      if (tooLarge(files)) throw new Error(`Fayl hajmi ${MAX_UPLOAD_MB} MB dan oshmasin`);
      const up = await uploadFiles(files);
      const fileIds = up.map((f) => f.id);
      if (activeThread?.kind === "GROUP" && activeThread.group) {
        return api.post("/teacher/announcements", { groupId: activeThread.group.id, body: text, fileIds });
      }
      return api.post(`/messages/threads/${active}/messages`, { body: text, fileIds });
    },
    { invalidate: [[TB, "b-threads"], [TB, "b-thread", active], [TB, "ann-list"]] },
  );

  // KPI
  const unreadTotal = threads.reduce((a, t) => a + t.unread, 0);
  const weekAgo = Date.now() - 7 * 86_400_000;
  const activeWeek = threads.filter((t) => new Date(t.lastMessageAt).getTime() >= weekAgo).length;
  const parentsTotal = groups.reduce((a, g) => a + g.parents, 0);
  const parentsTg = groups.reduce((a, g) => a + g.parentsTelegram, 0);

  const otherUser = activeThread?.kind === "DIRECT" ? activeThread.participants[0] : undefined;
  const activeGroup = activeThread?.kind === "GROUP" && activeThread.group ? groupById.get(activeThread.group.id) : undefined;

  const filterChips: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Hammasi", count: counts.all },
    { key: "unread", label: "Oʻqilmagan", count: counts.unread },
    { key: "parents", label: "Ota-onalar", count: counts.parents },
    { key: "students", label: "Oʻquvchilar", count: counts.students },
    { key: "groups", label: "Eʼlonlar", count: counts.groups },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: "/ustoz" }, { label: "Xabarlar" }]}
        title="Xabarlar va muloqot markazi"
        documentTitle="Xabarlar"
        badge={
          <Badge tone="success" dot>
            Jonli rejim
          </Badge>
        }
        subtitle="Oʻquvchilar va ota-onalar bilan tezkor aloqa hamda guruh eʼlonlari"
        actions={
          <>
            <Button variant="outline" icon="campaign" onClick={() => setAnn({})}>
              Guruhlarga eʼlon yuborish
            </Button>
            <Button icon="add_comment" onClick={() => setNewOpen(true)}>
              Yangi xabar yozish
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Oʻqilmagan xabarlar"
          value={fmtNum(unreadTotal)}
          unit="ta yangi"
          icon="mark_chat_unread"
          loading={threadsQ.isLoading}
          footer={`${counts.unread} ta suhbatda`}
          onClick={counts.unread ? () => setFilter("unread") : undefined}
        />
        <KpiCard label="Faol muloqotlar" value={fmtNum(activeWeek)} unit="ta suhbat" icon="forum" loading={threadsQ.isLoading} footer="Oxirgi 7 kunda" />
        <KpiCard
          label="Eʼlonlar kanallari"
          value={fmtNum(counts.groups)}
          unit={`/ ${groups.length} guruh`}
          icon="campaign"
          tone="gold"
          loading={threadsQ.isLoading || groupsQ.isLoading}
          footer={`${fmtNum(parentsTotal)} ta ota-ona obuna`}
          onClick={() => setFilter("groups")}
        />
        <KpiCard
          label="Telegram bot"
          value={parentsTotal ? `${Math.round((parentsTg / parentsTotal) * 100)}%` : "—"}
          unit="ota-ona ulangan"
          icon="send"
          tone="primary"
          loading={groupsQ.isLoading}
          footer={`${fmtNum(parentsTg)} / ${fmtNum(parentsTotal)} ta ota-ona`}
          chip={parentsTotal && parentsTg < parentsTotal ? `${parentsTotal - parentsTg} ta ulanmagan` : undefined}
          chipTone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {threadsQ.error ? (
            <Card>
              <QueryError error={threadsQ.error} onRetry={() => threadsQ.refetch()} />
            </Card>
          ) : (
            <ChatView
              className="lg:h-[calc(100dvh-14rem)] lg:min-h-[600px]"
              threads={chatThreads}
              activeId={active || null}
              onSelect={(id) => setActive(id)}
              messages={messages}
              currentUserId={me.id}
              onSend={(text, files) => send.mutateAsync({ text, files })}
              threadsLoading={threadsQ.isLoading}
              messagesLoading={msgsQ.isLoading}
              sending={send.isPending}
              quickReplies={QUICK_REPLIES}
              accept={ACCEPT_ALL}
              placeholder={activeThread?.kind === "GROUP" ? "Eʼlon matni… (guruhdagi barcha ota-onalarga yuboriladi)" : "Xabar yozing…"}
              threadFilters={
                <div className="scrollbar-none -mx-0.5 flex items-center gap-1.5 overflow-x-auto px-0.5 pb-0.5 text-[12px]">
                  {filterChips.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      aria-pressed={filter === c.key}
                      onClick={() => setFilter(c.key)}
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold transition-colors",
                        filter === c.key ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:bg-surface-container-low",
                      )}
                    >
                      {c.label}
                      {c.count ? (
                        <span
                          className={cn(
                            "min-w-4 rounded-full px-1 text-[10px] font-bold",
                            filter === c.key ? "bg-on-primary/20" : c.key === "unread" ? "bg-primary text-on-primary" : "bg-surface-container",
                          )}
                        >
                          {c.count}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              }
              headerActions={
                activeGroup ? (
                  <Link to={`/ustoz/guruhlar/${activeGroup.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })} title="Guruh sahifasi">
                    <Icon name="groups" size={18} />
                    <span className="hidden sm:inline">Guruh</span>
                  </Link>
                ) : null
              }
              composerNote={
                activeThread ? (
                  <p className="flex items-center gap-1.5 px-1 text-[11.5px] text-on-surface-muted">
                    <Icon name="send" size={14} className="text-primary" />
                    {activeThread.kind === "GROUP"
                      ? `Eʼlon ${activeGroup?.parents ?? "barcha"} ota-onaga yuboriladi · ${activeGroup?.parentsTelegram ?? 0} tasi Telegram bot orqali oladi`
                      : "Xabar ilovada va Telegram bot orqali (ulangan boʻlsa) yetkaziladi"}
                  </p>
                ) : null
              }
              emptyThreads={
                <EmptyState
                  compact
                  icon="forum"
                  title={filter === "all" ? "Suhbatlar yoʻq" : "Bu boʻlimda suhbat yoʻq"}
                  description={filter === "all" ? "Ota-ona yoki oʻquvchiga birinchi xabarni yozing." : undefined}
                  action={
                    <Button size="sm" icon="add_comment" onClick={() => setNewOpen(true)}>
                      Yangi xabar
                    </Button>
                  }
                />
              }
            />
          )}
        </div>

        <aside className="hidden min-w-0 flex-col gap-5 xl:flex">
          {activeGroup ? (
            <GroupProfile g={activeGroup} onAnnounce={() => setAnn({ groupId: activeGroup.id })} />
          ) : otherUser ? (
            <ContactCard u={otherUser} student={activeThread?.student ?? null} />
          ) : (
            <Card className="p-5">
              <h2 className="mb-3 font-display text-[15.5px] font-bold text-on-surface">Eʼlonlar kanallari</h2>
              {groupsQ.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <ul className="space-y-2">
                  {groups.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-2 rounded-lg border border-outline-variant/70 p-2.5">
                      <span className="min-w-0">
                        <span className="block truncate font-label-lg text-label-lg text-on-surface">{g.name}</span>
                        <span className="block text-[11.5px] text-on-surface-muted">
                          {g.code} · {g.parents} ota-ona
                        </span>
                      </span>
                      <IconButton icon="campaign" label="Eʼlon yozish" size="sm" className="text-primary" onClick={() => setAnn({ groupId: g.id })} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
          {active ? <SharedFiles messages={msgsQ.data ?? []} loading={msgsQ.isLoading} /> : null}
        </aside>
      </div>

      <NewMessageDialog
        open={newOpen}
        initialTo={toParam || null}
        onOpenChange={(o) => {
          setNewOpen(o);
          if (!o && toParam) setToParam(null);
        }}
        onStarted={(threadId) => {
          setNewOpen(false);
          if (toParam) setToParam(null);
          setFilter("all");
          setActive(threadId);
        }}
      />
      <AnnouncementDialog
        open={!!ann}
        initialGroupId={ann?.groupId}
        groups={groups}
        onOpenChange={(o) => !o && setAnn(null)}
        onSent={(threadId) => {
          setAnn(null);
          setActive(threadId);
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------- o'ng panel

function GroupProfile({ g, onAnnounce }: { g: TeacherGroup; onAnnounce: () => void }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-[15.5px] font-bold text-on-surface">Guruh profili</h2>
        <Badge tone="primary" shape="square">
          {g.code}
        </Badge>
      </div>
      <dl className="space-y-2.5 rounded-xl border border-outline-variant/70 bg-surface-container-low p-3.5 text-body-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-on-surface-muted">Dars vaqtlari</dt>
          <dd className="text-right font-semibold text-on-surface">{fmtDays(g.days, g.startTime, g.endTime)}</dd>
        </div>
        {g.room ? (
          <div className="flex justify-between gap-3">
            <dt className="text-on-surface-muted">Auditoriya</dt>
            <dd className="text-right font-semibold text-on-surface">
              {g.room.name}
              {g.room.location ? ` · ${g.room.location}` : ""}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-on-surface-muted">Oʻquvchilar</dt>
          <dd className="font-semibold text-on-surface">{g.activeStudents} nafar</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-on-surface-muted">Ota-onalar</dt>
          <dd className="font-semibold text-on-surface">
            {g.parents} · <span className="text-primary">{g.parentsTelegram} Telegram</span>
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" icon="campaign" onClick={onAnnounce}>
          Eʼlon yozish
        </Button>
        <Link to={`/ustoz/guruhlar/${g.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Guruh jurnali
        </Link>
      </div>
    </Card>
  );
}

function ContactCard({ u, student }: { u: MsgUser; student: { id: string; fullName: string } | null }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-display text-[15.5px] font-bold text-on-surface">Suhbatdosh</h2>
      <div className="flex items-center gap-3">
        <Avatar name={u.fullName} src={u.role === "STUDENT" ? null : u.avatarUrl} size="lg" />
        <div className="min-w-0">
          <div className="truncate font-label-lg text-label-lg text-on-surface">{u.fullName}</div>
          <div className="text-body-sm text-on-surface-muted">{roleLabel(u)}</div>
        </div>
      </div>
      {student ? (
        <div className="mt-4 rounded-xl border border-outline-variant/70 bg-surface-container-low p-3.5 text-body-sm">
          <div className="text-on-surface-muted">Suhbat mavzusi</div>
          <div className="mt-0.5 flex items-center gap-2 font-semibold text-on-surface">
            <Avatar name={student.fullName} size="xs" />
            {student.fullName}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function SharedFiles({ messages, loading }: { messages: ThreadMessage[]; loading: boolean }) {
  const files = messages.flatMap((m) => m.files.map((f) => ({ ...f, at: m.createdAt }))).reverse();
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[15.5px] font-bold text-on-surface">Ulashilgan fayllar</h2>
        {files.length ? <span className="font-label-md text-label-md text-primary">{files.length} ta</span> : null}
      </div>
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : files.length ? (
        <ul className="space-y-2">
          {files.slice(0, 8).map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border border-outline-variant/70 p-2.5">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  f.mime === "application/pdf" ? "bg-error-container text-error" : f.mime.startsWith("audio/") ? "bg-tertiary-fixed text-tertiary" : "bg-primary-fixed text-primary",
                )}
              >
                <Icon name={f.mime === "application/pdf" ? "picture_as_pdf" : f.mime.startsWith("audio/") ? "graphic_eq" : f.mime.startsWith("image/") ? "image" : "description"} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-sm font-semibold text-on-surface">{f.originalName}</span>
                <span className="text-[11px] text-on-surface-muted">
                  {fmtFileSize(f.size)} · {fmtRelDateTime(f.at)}
                </span>
              </span>
              <IconButton icon="download" label="Yuklab olish" size="sm" className="text-primary" onClick={() => downloadFile(f.id, f.originalName).catch(toastError)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-on-surface-muted">Bu suhbatda fayl yoʻq.</p>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- yangi suhbat

type Pick = { id: string; name: string; sub: string; studentId?: string; group?: string | null; avatarUrl?: string | null; child?: boolean };

function NewMessageDialog({
  open,
  initialTo,
  onOpenChange,
  onStarted,
}: {
  open: boolean;
  initialTo: string | null;
  onOpenChange: (o: boolean) => void;
  onStarted: (threadId: string) => void;
}) {
  const contactsQ = useApiQuery<TeacherContacts>([TB, "b-contacts"], "/messages/contacts", { enabled: open, staleTime: 60_000 });
  const [tab, setTab] = useState<"parents" | "students" | "admins">("parents");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Pick | null>(null);
  const [body, setBody] = useState("");
  const inited = useRef(false);

  const lists = useMemo(() => {
    const c = contactsQ.data;
    const parents: Pick[] = (c?.parents ?? []).map((p) => ({
      id: p.id,
      name: p.fullName,
      sub: `${p.about.studentName}ning ${relWord(p.about.relation)}`,
      studentId: p.about.studentId,
      group: p.group?.name ?? null,
      avatarUrl: p.avatarUrl,
    }));
    const students: Pick[] = (c?.students ?? []).map((s) => ({ id: s.id, name: s.fullName, sub: s.title ?? "Oʻquvchi", group: s.group?.name ?? null, child: true }));
    const admins: Pick[] = (c?.admins ?? []).map((a) => ({ id: a.id, name: a.fullName, sub: a.title ?? "Administrator", avatarUrl: a.avatarUrl }));
    return { parents, students, admins };
  }, [contactsQ.data]);

  useEffect(() => {
    if (!open) {
      inited.current = false;
      setSel(null);
      setBody("");
      setQ("");
      return;
    }
    if (initialTo && contactsQ.data && !inited.current) {
      inited.current = true;
      for (const k of ["parents", "students", "admins"] as const) {
        const hit = lists[k].find((x) => x.id === initialTo);
        if (hit) {
          setTab(k);
          setSel(hit);
          break;
        }
      }
    }
  }, [open, initialTo, contactsQ.data, lists]);

  const items = lists[tab].filter((x) => `${x.name} ${x.sub} ${x.group ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));
  const grouped = useMemo(() => {
    const m = new Map<string, Pick[]>();
    for (const it of items) {
      const k = it.group ?? (tab === "admins" ? "Administratsiya" : "Guruhsiz");
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(it);
    }
    return [...m.entries()];
  }, [items, tab]);

  const send = useApiMutation(
    (b: { toUserId: string; body: string; studentId?: string }) => api.post<{ threadId: string }>("/messages", b),
    { invalidate: [[TB, "b-threads"], ["me", "nav-badges"]] },
  );

  const submit = async () => {
    if (!sel || !body.trim()) return;
    const r = await send.mutateAsync({ toUserId: sel.id, body: body.trim(), ...(sel.studentId ? { studentId: sel.studentId } : {}) });
    toast.success(`${sel.name}ga xabar yuborildi`);
    onStarted(r.threadId);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Yangi xabar"
      description="Oʻquvchilaringiz, ularning ota-onalari yoki administratsiyaga"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon="send" disabled={!sel || !body.trim()} loading={send.isPending} onClick={() => void submit().catch(() => {})}>
            Yuborish
          </Button>
        </>
      }
    >
      {sel ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary-light p-3">
            <span className="flex min-w-0 items-center gap-3">
              <Avatar name={sel.name} src={sel.child ? null : sel.avatarUrl} />
              <span className="min-w-0">
                <span className="block truncate font-label-lg text-label-lg text-on-surface">{sel.name}</span>
                <span className="block truncate text-body-sm text-on-surface-muted">
                  {sel.sub}
                  {sel.group ? ` · ${sel.group}` : ""}
                </span>
              </span>
            </span>
            <Button size="sm" variant="ghost" icon="swap_horiz" onClick={() => setSel(null)}>
              Almashtirish
            </Button>
          </div>
          <Field label="Xabar">
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Assalomu alaykum…" maxLength={4000} autoFocus />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setBody((b) => (b.trim() ? `${b.trim()} ${r}` : r))}
                className="rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-[11.5px] text-on-surface-variant hover:border-primary hover:text-primary"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex shrink-0 rounded-lg bg-surface-container-low p-1">
              {(
                [
                  ["parents", "Ota-onalar"],
                  ["students", "Oʻquvchilar"],
                  ["admins", "Administratsiya"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={cn(
                    "h-8 rounded-md px-3 font-label-md text-label-md transition-colors",
                    tab === k ? "bg-surface-container-lowest text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  {label} <span className="text-on-surface-muted">{lists[k].length}</span>
                </button>
              ))}
            </div>
            <SearchInput value={q} onValueChange={setQ} placeholder="Ism, farzand yoki guruh…" size="sm" />
          </div>
          {contactsQ.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : contactsQ.error ? (
            <QueryError error={contactsQ.error} onRetry={() => contactsQ.refetch()} compact />
          ) : !items.length ? (
            <EmptyState compact icon="person_search" title="Hech kim topilmadi" />
          ) : (
            <div className="scrollbar-thin max-h-[50dvh] space-y-4 overflow-y-auto pr-1">
              {grouped.map(([gname, arr]) => (
                <div key={gname}>
                  <div className="mb-1.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-muted">{gname}</div>
                  <ul className="space-y-1">
                    {arr.map((x) => (
                      <li key={`${x.id}-${x.studentId ?? ""}`}>
                        <button type="button" onClick={() => setSel(x)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-surface-container-low">
                          <Avatar name={x.name} src={x.child ? null : x.avatarUrl} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-label-lg text-label-lg text-on-surface">{x.name}</span>
                            <span className="block truncate text-body-sm text-on-surface-muted">{x.sub}</span>
                          </span>
                          <Icon name="chevron_right" className="text-outline" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------- guruhga e'lon

function AnnouncementDialog({
  open,
  initialGroupId,
  groups,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  initialGroupId?: string;
  groups: TeacherGroup[];
  onOpenChange: (o: boolean) => void;
  onSent: (threadId: string) => void;
}) {
  const [groupId, setGroupId] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setGroupId(initialGroupId ?? (groups.length === 1 ? groups[0].id : ""));
      setBody("");
      setFiles([]);
    }
  }, [open, initialGroupId, groups]);

  const g = groups.find((x) => x.id === groupId);
  const history = useApiQuery<Announcement[]>([TB, "ann-list", groupId], groupId ? "/teacher/announcements" : null, { params: { groupId, limit: 5 }, enabled: open });

  const send = useApiMutation(
    async () => {
      if (tooLarge(files)) throw new Error(`Fayl hajmi ${MAX_UPLOAD_MB} MB dan oshmasin`);
      const up = await uploadFiles(files);
      return api.post<{ threadId: string; recipients: number }>("/teacher/announcements", { groupId, body: body.trim(), fileIds: up.map((f) => f.id) });
    },
    { invalidate: INV },
  );

  const submit = async () => {
    const r = await send.mutateAsync();
    toast.success(`Eʼlon ${r.recipients} ta ota-onaga yuborildi`, { description: g ? g.name : undefined });
    onSent(r.threadId);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Guruhga eʼlon"
      description="Guruhdagi faol oʻquvchilarning barcha ota-onalariga. Ota-onalar javob yoza olmaydi — savollar shaxsiy xabarda."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button icon="campaign" disabled={!groupId || (!body.trim() && !files.length)} loading={send.isPending} onClick={() => void submit().catch(() => {})}>
            Eʼlonni yuborish
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Guruh" required>
          <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="Guruhni tanlang…" options={groups.map((x) => ({ value: x.id, label: `${x.name} (${x.code})` }))} />
        </Field>
        {g ? (
          <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
            <Badge tone="primary" icon="family_restroom">
              {g.parents} ta ota-ona
            </Badge>
            <Badge tone={g.parentsTelegram === g.parents ? "success" : "warning"} icon="send">
              {g.parentsTelegram} tasi Telegram botga ulangan
            </Badge>
          </div>
        ) : null}
        <Field label="Eʼlon matni">
          <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Masalan: Shanba kuni soat 09:00 da Markaz Mock imtihoni boʻladi…" maxLength={4000} />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ACCEPT_ALL}
            className="hidden"
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              e.target.value = "";
              setFiles((f) => [...f, ...list].slice(0, 5));
            }}
          />
          <Button variant="outline" size="sm" icon="attach_file" disabled={files.length >= 5} onClick={() => fileRef.current?.click()}>
            Fayl biriktirish
          </Button>
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-surface-container px-2 py-1 text-body-sm text-on-surface">
              <Icon name="attach_file" size={16} />
              <span className="max-w-[180px] truncate">{f.name}</span>
              <button type="button" aria-label="Olib tashlash" className="text-on-surface-variant hover:text-error" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}>
                <Icon name="close" size={16} />
              </button>
            </span>
          ))}
        </div>

        {groupId ? (
          <div className="rounded-xl border border-outline-variant/70 bg-surface-container-low/60 p-3.5">
            <div className="mb-2 font-label-md text-label-md uppercase tracking-wider text-on-surface-muted">Soʻnggi eʼlonlar</div>
            {history.isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : history.data?.length ? (
              <ul className="space-y-2.5">
                {history.data.map((a) => (
                  <li key={a.id} className="text-body-sm">
                    <p className="line-clamp-2 text-on-surface">{a.body || (a.files.length ? `${a.files.length} ta fayl` : "")}</p>
                    <span className="text-[11px] text-on-surface-muted">
                      {fmtRelDateTime(a.createdAt)} · Oʻqildi: {a.readCount}/{a.recipients}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-sm text-on-surface-muted">Bu guruhga hali eʼlon yuborilmagan.</p>
            )}
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
