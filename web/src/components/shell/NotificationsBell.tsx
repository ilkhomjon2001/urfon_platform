import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, EmptyState, IconButton, Popover, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtRelDateTime } from "@/lib/format";
import { useApiMutation, useApiQuery } from "@/lib/query";
import type { AppNotification } from "@/lib/types";

/** API: { items (oxirgi 30 ta), unread (jami o'qilmagan) }. Massiv ham qabul qilinadi. */
type NotifResponse = AppNotification[] | { items: AppNotification[]; unread?: number };
const KEY = ["me", "notifications"];

const listOf = (d: NotifResponse | undefined) => (Array.isArray(d) ? d : (d?.items ?? []));
/** Server `unread` (ro'yxatdan tashqaridagilar ham) asosiy; bo'lmasa ro'yxatdan sanaladi. */
const unreadOf = (d: NotifResponse | undefined, items: AppNotification[]) =>
  d && !Array.isArray(d) && typeof d.unread === "number" ? d.unread : items.filter((n) => !n.readAt).length;

/** Header qo'ng'iroqchasi: GET /api/me/notifications (60 s), bosilganda o'qildi + link'ga o'tish. */
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useApiQuery<NotifResponse>(KEY, "/me/notifications", { refetchInterval: 60_000 });
  const items = useMemo(() => listOf(data), [data]);
  const unread = unreadOf(data, items);

  const markRead = useApiMutation((body: { ids?: string[]; all?: boolean }) => api.post("/me/notifications/read", body), {
    silentError: true,
    onMutate: (body) => {
      const now = new Date().toISOString();
      const hit = (n: AppNotification) => !n.readAt && (body.all || body.ids?.includes(n.id));
      const mark = (n: AppNotification) => (hit(n) ? { ...n, readAt: now } : n);
      qc.setQueryData<NotifResponse>(KEY, (old) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.map(mark);
        const marked = old.items.filter(hit).length;
        const nextUnread = body.all ? 0 : typeof old.unread === "number" ? Math.max(0, old.unread - marked) : undefined;
        return { ...old, items: old.items.map(mark), unread: nextUnread };
      });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: ["me", "nav-badges"] });
    },
  });

  const openItem = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate({ ids: [n.id] });
    setOpen(false);
    if (n.link) {
      if (/^https?:\/\//.test(n.link)) window.open(n.link, "_blank", "noopener");
      else navigate(n.link);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="w-[min(380px,calc(100vw-1.5rem))] p-0"
      trigger={
        <IconButton
          icon="notifications"
          label="Bildirishnomalar"
          dot={unread > 0}
          className="bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
        />
      }
    >
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-headline-sm text-headline-sm text-on-surface">Bildirishnomalar</span>
          {unread > 0 ? <Badge tone="danger">{unread}</Badge> : null}
        </div>
      </div>
      <div className="scrollbar-thin max-h-[min(420px,60dvh)] overflow-y-auto p-1.5">
        {isLoading ? (
          <div className="space-y-3 p-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState compact icon="notifications_off" title="Bildirishnomalar yoʻq" description="Yangi xabarlar shu yerda koʻrinadi." />
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openItem(n)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-surface-container-low",
                !n.readAt && "bg-primary-light/70",
              )}
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-primary")} />
              <span className="min-w-0 flex-1">
                <span className="block font-label-lg text-label-lg text-on-surface">{n.title}</span>
                {n.body ? <span className="mt-0.5 line-clamp-2 block text-body-sm text-on-surface-variant">{n.body}</span> : null}
                <span className="mt-1 block font-label-sm text-label-sm text-on-surface-muted">{fmtRelDateTime(n.createdAt)}</span>
              </span>
            </button>
          ))
        )}
      </div>
      <div className="flex justify-end border-t border-outline-variant px-4 py-2.5">
        <Button variant="link" size="sm" disabled={unread === 0} onClick={() => markRead.mutate({ all: true })}>
          Hammasini oʻqildi deb belgilash
        </Button>
      </div>
    </Popover>
  );
}
