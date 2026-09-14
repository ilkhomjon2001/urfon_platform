import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Dialog, EmptyState, Field, PageHeader, Select, Textarea } from "@/components/ui";
import { ChatView, type ChatMessage, type ChatThread } from "@/components/chat/ChatView";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { useMediaQuery, useSearchParamState } from "@/lib/hooks";
import { useApiMutation, useApiQuery } from "@/lib/query";
import type { FileMeta } from "@/lib/types";
import { ErrorState } from "./components/common";
import type { MessageRow, StudentContacts, ThreadRow } from "./components/types";

const POLL = 10_000;
const THREADS_KEY = ["student", "chat", "threads"];

export default function StudentChatPage() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [active, setActive] = useSearchParamState("t");
  const [params, setParams] = useSearchParams();
  const to = params.get("to");
  const [newOpen, setNewOpen] = useState(false);
  const [newTo, setNewTo] = useState("");
  const [newBody, setNewBody] = useState("");

  const threadsQ = useApiQuery<ThreadRow[]>(THREADS_KEY, "/messages/threads", { refetchInterval: POLL });
  const msgsQ = useApiQuery<MessageRow[]>(["student", "chat", "messages", active], active ? `/messages/threads/${active}` : null, { refetchInterval: POLL });
  const contactsQ = useApiQuery<StudentContacts>(["student", "chat", "contacts"], "/messages/contacts", { staleTime: 5 * 60_000 });
  const teachers = contactsQ.data?.teachers ?? [];

  // Suhbat ochilganda (xabarlar o'qildi deb belgilanadi) — ro'yxatdagi va sidebar'dagi o'qilmaganlar yangilanadi
  useEffect(() => {
    if (!active || !msgsQ.dataUpdatedAt) return;
    qc.setQueryData<ThreadRow[]>(THREADS_KEY, (old) => old?.map((t) => (t.id === active ? { ...t, unread: 0 } : t)));
    void qc.invalidateQueries({ queryKey: ["me", "nav-badges"] });
  }, [active, msgsQ.dataUpdatedAt, qc]);

  // ?to=<ustozId> (bosh sahifa / vazifa sahifasidan "Ustozga savol berish").
  // URL bitta yangilanishda o'zgartiriladi: ketma-ket ikki setSearchParams chaqiruvida ikkinchisi eski
  // parametrlardan boshlanib, birinchisini (t=) o'chirib yuboradi.
  useEffect(() => {
    if (!to || !threadsQ.data) return;
    const th = threadsQ.data.find((t) => t.kind === "DIRECT" && t.participants.some((p) => p.id === to));
    if (!th) {
      setNewTo(to);
      setNewOpen(true);
    }
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("to");
        if (th) next.set("t", th.id);
        return next;
      },
      { replace: true },
    );
  }, [to, threadsQ.data, setParams]);

  // Kompyuterda birinchi suhbat avtomatik ochiladi
  useEffect(() => {
    if (isDesktop && !active && !to && threadsQ.data?.length) setActive(threadsQ.data[0].id);
  }, [isDesktop, active, to, threadsQ.data, setActive]);

  const threads: ChatThread[] = useMemo(
    () =>
      (threadsQ.data ?? []).map((t) => {
        const other = t.participants[0];
        const last = t.lastMessage;
        return {
          id: t.id,
          title: t.title,
          subtitle: t.kind === "GROUP" ? `${t.group?.name ?? "Guruh"} · Eʼlonlar` : (other?.title ?? (other?.role === "TEACHER" ? "Ustoz" : null)),
          avatarUrl: t.kind === "GROUP" || other?.role === "STUDENT" ? null : (other?.avatarUrl ?? null),
          icon: t.kind === "GROUP" ? "campaign" : undefined,
          lastMessage: last ? `${last.senderId === user.id ? "Siz: " : ""}${last.body || "Fayl yuborildi"}` : null,
          lastAt: t.lastMessageAt,
          unread: t.unread,
        };
      }),
    [threadsQ.data, user.id],
  );

  const messages: ChatMessage[] = useMemo(
    () =>
      (msgsQ.data ?? []).map((m) => ({
        id: m.id,
        authorId: m.senderId,
        authorName: m.sender.fullName,
        authorAvatarUrl: m.sender.role === "STUDENT" ? null : m.sender.avatarUrl,
        authorRole: m.sender.role === "TEACHER" ? (m.sender.title ?? "Ustoz") : m.sender.role === "ADMIN" ? "Administrator" : null,
        text: m.body || null,
        createdAt: m.createdAt,
        attachments: m.files.map((f) => ({ id: f.id, name: f.originalName, size: f.size, mime: f.mime, fileId: f.id })),
      })),
    [msgsQ.data],
  );

  const activeThread = threadsQ.data?.find((t) => t.id === active) ?? null;

  const uploadAll = async (files: File[]) => {
    if (!files.length) return undefined;
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return (await api.upload<{ files: FileMeta[] }>("/files", fd)).files.map((f) => f.id);
  };

  const send = useApiMutation(
    async ({ text, files }: { text: string; files: File[] }) => {
      const fileIds = await uploadAll(files);
      return api.post<MessageRow>(`/messages/threads/${active}/messages`, { body: text, fileIds });
    },
    { invalidate: [["student", "chat"]] },
  );

  const start = useApiMutation(() => api.post<{ threadId: string }>("/messages", { toUserId: newTo, body: newBody.trim() }), {
    invalidate: [["student", "chat"]],
    success: "Xabar yuborildi",
    onSuccess: (r) => {
      setNewOpen(false);
      setNewBody("");
      setActive(r.threadId);
    },
  });

  const openNew = () => {
    setNewTo(teachers.length === 1 ? teachers[0].id : "");
    setNewOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Ustoz bilan chat"
        subtitle="Dars va vazifalar boʻyicha savollaringizni ustozingizga yozing"
        actions={
          teachers.length ? (
            <Button icon="edit_square" onClick={openNew}>
              Yangi xabar
            </Button>
          ) : undefined
        }
      />
      {threadsQ.error ? (
        <ErrorState error={threadsQ.error} onRetry={() => void threadsQ.refetch()} />
      ) : (
        <ChatView
          // ChatView mobil panelni mount paytida tanlaydi: ?to=/?t= orqali suhbat keyinroq tanlansa, qayta mount qilib yozishma paneli ochiladi
          key={active || "none"}
          threads={threads}
          activeId={active || null}
          onSelect={(id) => setActive(id)}
          messages={messages}
          currentUserId={user.id}
          onSend={(text, files) => send.mutateAsync({ text, files })}
          threadsLoading={threadsQ.isLoading}
          messagesLoading={msgsQ.isLoading && !!active}
          sending={send.isPending}
          quickReplies={["Vazifa boʻyicha savolim bor", "Darsda tushunmagan joyim bor", "Rahmat, ustoz!"]}
          accept="image/*,audio/*,.pdf,.doc,.docx"
          placeholder="Ustozga xabar yozing…"
          composerNote={
            activeThread?.kind === "GROUP" ? (
              <p className="text-body-sm text-on-surface-muted">Bu eʼlonlar kanali — savolingizni ustozga shaxsiy xabar orqali yozing.</p>
            ) : undefined
          }
          emptyThreads={
            <EmptyState
              compact
              icon="forum"
              title="Hali suhbat yoʻq"
              description="Ustozingizga birinchi savolingizni yozing."
              action={
                teachers.length ? (
                  <Button size="sm" icon="edit_square" onClick={openNew}>
                    Ustozga yozish
                  </Button>
                ) : undefined
              }
            />
          }
        />
      )}

      <Dialog
        open={newOpen}
        onOpenChange={setNewOpen}
        title="Ustozga yangi xabar"
        description="Savolingizni aniq yozing — ustoz imkon qadar tez javob beradi."
        footer={
          <>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              Bekor qilish
            </Button>
            <Button icon="send" loading={start.isPending} disabled={!newTo || !newBody.trim()} onClick={() => start.mutate()}>
              Yuborish
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Ustoz" required>
            <Select
              value={newTo}
              onChange={(e) => setNewTo(e.target.value)}
              placeholder="Ustozni tanlang"
              options={teachers.map((t) => ({ value: t.id, label: `${t.fullName}${t.teachingGroups.length ? ` · ${t.teachingGroups.map((g) => g.name).join(", ")}` : ""}` }))}
            />
          </Field>
          <Field label="Xabar" required hint="Masalan: Unit 4 vazifasidagi 2-bosqichni tushunmadim.">
            <Textarea rows={4} maxLength={4000} value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Savolingizni yozing…" />
          </Field>
        </div>
      </Dialog>
    </>
  );
}
