import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Avatar, Badge, Button, EmptyState, Icon, IconButton, Skeleton, Spinner } from "@/components/ui";
import { downloadFile, useFileObjectUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dayDiff, fmtDate, fmtDayMonth, fmtFileSize, fmtTime, relDayWord, toDate } from "@/lib/format";
import { toastError } from "@/lib/query";

// ---------------------------------------------------------------- turlar

export interface ChatThread {
  id: string;
  title: string;
  /** "GR-03 • Guruh chati", "Jasur Temirovning otasi (GR-09)" */
  subtitle?: string | null;
  /** Kattalar surati. Oʻquvchi (bola) uchun bermang — bosh harflar chiqadi. */
  avatarUrl?: string | null;
  /** Guruh chatlari uchun ikonka ("groups") — berilsa avatar o'rniga kvadrat ikonka */
  icon?: string;
  lastMessage?: string | null;
  lastAt?: string | null;
  unread?: number;
  online?: boolean;
}

export interface ChatAttachment {
  id: string;
  name: string;
  size?: number;
  mime?: string;
  /** /api/files/:id — yuklab olish/ko'rish shu orqali */
  fileId?: string;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  /** "Ustoz", "Ali Valiyevning otasi" */
  authorRole?: string | null;
  text?: string | null;
  createdAt: string;
  attachments?: ChatAttachment[];
  /** Optimistik yuborilayotgan xabar */
  pending?: boolean;
  failed?: boolean;
  /** Ism yonidagi chip ("Yangi") */
  badge?: string;
}

export interface ChatViewProps {
  threads: ChatThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /** Faol suhbat xabarlari (eski → yangi tartibda) */
  messages: ChatMessage[];
  currentUserId: string;
  /** Promise rad etilsa matn va fayllar composer'ga qaytariladi. */
  onSend: (text: string, files: File[]) => unknown | Promise<unknown>;
  threadsLoading?: boolean;
  messagesLoading?: boolean;
  sending?: boolean;
  /** Tezkor javob chiplari (bosilganda matn maydoniga yoziladi) */
  quickReplies?: string[];
  allowAttachments?: boolean;
  /** <input accept>: "image/*,audio/*,.pdf" */
  accept?: string;
  maxFiles?: number;
  placeholder?: string;
  /** Qidiruv ostidagi filtr chiplari slotі */
  threadFilters?: ReactNode;
  /** Suhbat sarlavhasi o'ng tomonidagi tugmalar */
  headerActions?: ReactNode;
  /** Composer ostidagi izoh (masalan Telegram sinxron belgisi) */
  composerNote?: ReactNode;
  emptyThreads?: ReactNode;
  searchable?: boolean;
  /** Berilmasa fileId orqali yuklab olinadi */
  onAttachmentClick?: (a: ChatAttachment) => void;
  /** Balandlik/joylashuvni sahifa belgilashi mumkin: className="h-[640px]" */
  className?: string;
  /** Faol suhbatga yozib bo'lmaydi (masalan guruh e'lonlari) — composer o'rniga izoh ko'rsatiladi */
  readOnly?: boolean;
  readOnlyNote?: ReactNode;
}

// ---------------------------------------------------------------- yordamchilar

function listTime(iso: string) {
  const w = relDayWord(iso);
  if (w === "Bugun") return fmtTime(iso);
  if (w === "Kecha") return "Kecha";
  return fmtDayMonth(iso);
}

function separatorLabel(iso: string) {
  const w = relDayWord(iso);
  return w ? `${w}, ${fmtDayMonth(iso)}` : fmtDate(iso);
}

const paneCls = "min-h-0 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-card";

// ---------------------------------------------------------------- asosiy komponent

/**
 * Ikki panelli chat (suhbatlar ro'yxati + yozishma). To'liq prop orqali boshqariladi — maʼlumotni sahifa beradi.
 * Mobil: bir vaqtda bitta panel (suhbat tanlansa yozishma, "orqaga" — ro'yxat).
 */
export function ChatView({
  threads,
  activeId,
  onSelect,
  messages,
  currentUserId,
  onSend,
  threadsLoading,
  messagesLoading,
  sending,
  quickReplies,
  allowAttachments = true,
  accept,
  maxFiles = 5,
  placeholder = "Xabar yozing…",
  threadFilters,
  headerActions,
  composerNote,
  emptyThreads,
  searchable = true,
  onAttachmentClick,
  className,
  readOnly = false,
  readOnlyNote = "Bu eʼlonlar kanali — javob yozib boʻlmaydi.",
}: ChatViewProps) {
  const [mobilePane, setMobilePane] = useState<"list" | "chat">(activeId ? "chat" : "list");
  const [search, setSearch] = useState("");
  const active = threads.find((t) => t.id === activeId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => `${t.title} ${t.subtitle ?? ""} ${t.lastMessage ?? ""}`.toLowerCase().includes(q));
  }, [threads, search]);

  const select = (id: string) => {
    onSelect(id);
    setMobilePane("chat");
  };

  const showChatOnMobile = mobilePane === "chat" && !!active;

  return (
    <div
      className={cn(
        "grid h-[calc(100dvh-15rem)] min-h-[460px] grid-cols-1 gap-5 lg:h-[calc(100dvh-12rem)] lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]",
        className,
      )}
    >
      {/* Suhbatlar ro'yxati */}
      <section aria-label="Suhbatlar" className={cn(paneCls, showChatOnMobile ? "hidden lg:flex" : "flex")}>
        {searchable || threadFilters ? (
          <div className="flex flex-col gap-2.5 border-b border-surface-container-low p-3.5">
            {searchable ? (
              <div className="relative">
                <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Qidiruv…"
                  aria-label="Suhbatlarni qidirish"
                  className="h-9 w-full rounded-xl border border-transparent bg-surface-container-low pl-9 pr-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:bg-surface-container-lowest focus:outline-none focus:ring-0"
                />
              </div>
            ) : null}
            {threadFilters}
          </div>
        ) : null}
        <div className="scrollbar-thin min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2.5">
          {threadsLoading ? (
            Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            (emptyThreads ?? (
              <EmptyState compact icon="forum" title={search ? "Hech narsa topilmadi" : "Suhbatlar yoʻq"} />
            ))
          ) : (
            filtered.map((t) => <ThreadItem key={t.id} thread={t} active={t.id === activeId} onClick={() => select(t.id)} />)
          )}
        </div>
      </section>

      {/* Yozishma */}
      <section aria-label="Yozishma" className={cn(paneCls, showChatOnMobile ? "flex" : "hidden lg:flex")}>
        {!active ? (
          <div className="flex flex-1 items-center justify-center bg-background">
            <EmptyState icon="forum" title="Suhbatni tanlang" description="Chap tomondagi roʻyxatdan suhbatni tanlang." />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-surface-container-low px-3 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <IconButton icon="arrow_back" label="Orqaga" size="sm" className="lg:hidden" onClick={() => setMobilePane("list")} />
                <ThreadAvatar thread={active} active />
                <div className="min-w-0">
                  <h2 className="truncate font-headline-sm text-headline-sm text-on-surface">{active.title}</h2>
                  {active.subtitle ? <p className="truncate text-body-sm text-on-surface-muted">{active.subtitle}</p> : null}
                </div>
              </div>
              {headerActions ? <div className="flex shrink-0 items-center gap-1">{headerActions}</div> : null}
            </div>
            <MessageList
              threadId={active.id}
              messages={messages}
              currentUserId={currentUserId}
              loading={messagesLoading}
              onAttachmentClick={onAttachmentClick}
            />
            {readOnly ? (
              <div className="flex items-center gap-2 border-t border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                <Icon name="campaign" size={18} />
                {readOnlyNote}
              </div>
            ) : (
              <Composer
                threadId={active.id}
                onSend={onSend}
                sending={sending}
                quickReplies={quickReplies}
                allowAttachments={allowAttachments}
                accept={accept}
                maxFiles={maxFiles}
                placeholder={placeholder}
                note={composerNote}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- suhbatlar ro'yxati

function ThreadAvatar({ thread, active }: { thread: ChatThread; active?: boolean }) {
  if (thread.icon) {
    return (
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          active ? "bg-primary text-on-primary" : "bg-primary-fixed text-primary",
        )}
      >
        <Icon name={thread.icon} />
      </span>
    );
  }
  return (
    <span className="relative shrink-0">
      <Avatar name={thread.title} src={thread.avatarUrl} className="h-10 w-10 text-[13px]" />
      {thread.online ? (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-surface-container-lowest" />
      ) : null}
    </span>
  );
}

function ThreadItem({ thread: t, active, onClick }: { thread: ChatThread; active: boolean; onClick: () => void }) {
  const unread = t.unread ?? 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors",
        active ? "border-l-4 border-primary bg-surface-container-low" : "border border-transparent hover:border-surface-container hover:bg-background",
      )}
    >
      <ThreadAvatar thread={t} active={active} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={cn("truncate font-label-lg text-label-lg", active ? "text-primary-container" : "text-on-surface")}>{t.title}</span>
          {t.lastAt ? (
            <span className={cn("shrink-0 text-[11px]", unread ? "font-semibold text-primary" : "text-outline")}>{listTime(t.lastAt)}</span>
          ) : null}
        </span>
        {t.subtitle ? <span className="mt-0.5 block truncate text-[11.5px] font-medium text-on-surface-muted">{t.subtitle}</span> : null}
        {t.lastMessage ? (
          <span className={cn("mt-1 block truncate text-body-sm", unread ? "font-medium text-on-surface" : "text-on-surface-variant")}>
            {t.lastMessage}
          </span>
        ) : null}
      </span>
      {unread > 0 ? (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center self-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </button>
  );
}

// ---------------------------------------------------------------- xabarlar

const GROUP_GAP_MS = 5 * 60_000;

function MessageList({
  threadId,
  messages,
  currentUserId,
  loading,
  onAttachmentClick,
}: {
  threadId: string;
  messages: ChatMessage[];
  currentUserId: string;
  loading?: boolean;
  onAttachmentClick?: (a: ChatAttachment) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, threadId, loading]);

  return (
    <div ref={ref} className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto bg-background p-4 sm:p-5">
      {loading ? (
        <div className="flex h-full items-center justify-center text-primary">
          <Spinner size={24} />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <EmptyState compact icon="chat" title="Hali xabar yoʻq" description="Birinchi xabarni yozing." />
        </div>
      ) : (
        messages.map((m, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || dayDiff(prev.createdAt, m.createdAt) !== 0;
          const compact =
            !!prev &&
            !newDay &&
            prev.authorId === m.authorId &&
            toDate(m.createdAt).getTime() - toDate(prev.createdAt).getTime() < GROUP_GAP_MS;
          return (
            <Fragment key={m.id}>
              {newDay ? (
                <div className="flex justify-center">
                  <span className="rounded-full border border-outline-variant bg-surface-container px-3 py-1 text-[11px] font-semibold text-on-surface-variant">
                    {separatorLabel(m.createdAt)}
                  </span>
                </div>
              ) : null}
              <MessageRow message={m} mine={m.authorId === currentUserId} compact={compact} onAttachmentClick={onAttachmentClick} />
            </Fragment>
          );
        })
      )}
    </div>
  );
}

function MessageRow({
  message: m,
  mine,
  compact,
  onAttachmentClick,
}: {
  message: ChatMessage;
  mine: boolean;
  compact: boolean;
  onAttachmentClick?: (a: ChatAttachment) => void;
}) {
  const attachments = m.attachments?.length ? (
    <div className={cn("flex w-full flex-col gap-1.5", mine ? "items-end" : "items-start", m.text && "mt-1.5")}>
      {m.attachments.map((a) => (
        <AttachmentView key={a.id} attachment={a} onClick={onAttachmentClick} />
      ))}
    </div>
  ) : null;

  if (mine) {
    return (
      <div className={cn("ml-auto flex max-w-[85%] flex-col items-end", compact && "-mt-2.5", m.pending && "opacity-70")}>
        {!compact ? (
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-[11px] text-outline">{fmtTime(m.createdAt)}</span>
            <span className="font-label-md text-label-md text-primary-container">Siz</span>
          </div>
        ) : null}
        {m.text ? (
          <div className="whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-body-md text-on-primary shadow-xs">
            {m.text}
          </div>
        ) : null}
        {attachments}
        {m.failed ? (
          <span className="mt-1 flex items-center gap-1 text-body-sm text-error">
            <Icon name="error" size={14} />
            Yuborilmadi
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex max-w-[85%] items-start gap-3", compact && "-mt-2.5")}>
      {compact ? <span className="w-8 shrink-0" /> : <Avatar name={m.authorName} src={m.authorAvatarUrl} size="sm" className="mt-0.5" />}
      <div className="flex min-w-0 flex-col items-start">
        {!compact ? (
          <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-label-md text-label-md text-on-surface">{m.authorName}</span>
            {m.authorRole ? <span className="text-[11px] text-on-surface-muted">{m.authorRole}</span> : null}
            <span className="text-[11px] text-outline">{fmtTime(m.createdAt)}</span>
            {m.badge ? (
              <Badge tone="primary" shape="square">
                {m.badge}
              </Badge>
            ) : null}
          </div>
        ) : null}
        {m.text ? (
          <div className="whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-body-md text-on-surface shadow-xs">
            {m.text}
          </div>
        ) : null}
        {attachments}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- biriktirmalar

function kindOf(a: ChatAttachment) {
  const mime = a.mime ?? "";
  if (mime.startsWith("image/")) return "image" as const;
  if (mime.startsWith("audio/")) return "audio" as const;
  if (mime === "application/pdf" || a.name.toLowerCase().endsWith(".pdf")) return "pdf" as const;
  return "file" as const;
}

function AttachmentView({ attachment: a, onClick }: { attachment: ChatAttachment; onClick?: (a: ChatAttachment) => void }) {
  const kind = kindOf(a);
  const download = () => {
    if (onClick) onClick(a);
    else if (a.fileId) downloadFile(a.fileId, a.name).catch(toastError);
  };
  if (kind === "audio" && a.fileId) return <AudioAttachment attachment={a} />;
  if (kind === "image" && a.fileId) return <ImageAttachment attachment={a} onOpen={download} />;
  return (
    <div className="flex w-full max-w-[340px] items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-xs">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          kind === "pdf" ? "bg-error-container text-error" : "bg-primary-fixed text-primary",
        )}
      >
        <Icon name={kind === "pdf" ? "picture_as_pdf" : "description"} size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-label-lg text-label-lg text-on-surface">{a.name}</span>
        {a.size != null ? <span className="text-body-sm text-on-surface-muted">{fmtFileSize(a.size)}</span> : null}
      </span>
      <IconButton icon="download" label="Yuklab olish" size="sm" className="text-primary" onClick={download} />
    </div>
  );
}

function AudioAttachment({ attachment: a }: { attachment: ChatAttachment }) {
  const { url } = useFileObjectUrl(a.fileId);
  return (
    <div className="w-full max-w-[340px] rounded-2xl border border-outline-variant bg-surface-container-lowest p-2.5 shadow-xs">
      <div className="mb-1.5 flex items-center gap-2 px-1 text-body-sm text-on-surface">
        <Icon name="graphic_eq" size={18} className="text-primary" />
        <span className="truncate">{a.name}</span>
      </div>
      {url ? <audio controls src={url} className="h-9 w-full" /> : <Skeleton className="h-9 w-full rounded-full" />}
    </div>
  );
}

function ImageAttachment({ attachment: a, onOpen }: { attachment: ChatAttachment; onOpen: () => void }) {
  const { url } = useFileObjectUrl(a.fileId);
  return (
    <button type="button" onClick={onOpen} className="overflow-hidden rounded-2xl border border-outline-variant" title={a.name}>
      {url ? (
        <img src={url} alt={a.name} className="max-h-60 max-w-[260px] object-cover" />
      ) : (
        <Skeleton className="h-40 w-60 rounded-none" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------- composer

function Composer({
  threadId,
  onSend,
  sending,
  quickReplies,
  allowAttachments,
  accept,
  maxFiles,
  placeholder,
  note,
}: {
  threadId: string;
  onSend: ChatViewProps["onSend"];
  sending?: boolean;
  quickReplies?: string[];
  allowAttachments: boolean;
  accept?: string;
  maxFiles: number;
  placeholder: string;
  note?: ReactNode;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText("");
    setFiles([]);
  }, [threadId]);

  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [text]);

  const canSend = (text.trim().length > 0 || files.length > 0) && !sending;

  const submit = async () => {
    if (!canSend) return;
    const t = text.trim();
    const f = files;
    setText("");
    setFiles([]);
    try {
      await onSend(t, f);
    } catch {
      setText(t);
      setFiles(f);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  const addFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...list].slice(0, maxFiles));
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2.5 border-t border-outline-variant bg-surface-container-lowest p-3 sm:p-3.5">
      {quickReplies?.length ? (
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {quickReplies.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setText(q);
                taRef.current?.focus();
              }}
              className="shrink-0 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-2 rounded-xl border border-outline-variant bg-background p-2 transition-colors focus-within:border-primary focus-within:bg-surface-container-lowest focus-within:ring-1 focus-within:ring-primary">
        {files.length ? (
          <div className="flex flex-wrap gap-1.5 px-1 pt-1">
            {files.map((f, i) => (
              <span
                key={`${f.name}-${i}`}
                className="inline-flex max-w-[220px] items-center gap-1.5 rounded-lg bg-surface-container px-2 py-1 text-body-sm text-on-surface"
              >
                <Icon name="attach_file" size={16} />
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  aria-label="Olib tashlash"
                  onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                  className="text-on-surface-variant hover:text-error"
                >
                  <Icon name="close" size={16} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Xabar matni"
          className="max-h-40 min-h-[40px] w-full resize-none border-0 bg-transparent p-1 text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            {allowAttachments ? (
              <>
                <input ref={fileRef} type="file" multiple accept={accept} className="hidden" onChange={addFiles} />
                <IconButton
                  icon="attach_file"
                  label="Fayl biriktirish"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={files.length >= maxFiles}
                />
              </>
            ) : null}
            <span className="hidden truncate text-[11px] text-outline sm:inline">Enter — yuborish, Shift+Enter — yangi qator</span>
          </div>
          <Button size="sm" iconRight="send" onClick={() => void submit()} disabled={!canSend} loading={sending}>
            Yuborish
          </Button>
        </div>
      </div>
      {note}
    </div>
  );
}
