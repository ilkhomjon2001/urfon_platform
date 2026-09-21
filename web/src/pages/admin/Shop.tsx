// Admin: Tanga doʻkoni — oʻquvchilar kumush tangalarini almashtiradigan sovgʻalar vitrinasi va buyurtmalar navbati.
// Buyurtma berilganda tanga darhol yechiladi; admin sovgʻani qoʻliga berib «Topshirildi» deydi yoki bekor qiladi (tanga qaytadi).
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  DataTable,
  Dialog,
  EmptyState,
  Field,
  Icon,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components/ui";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  Coin,
  ItemImage,
  Price,
  REQUESTER,
  StatusBadge,
  type Catalog,
  type CatalogItem,
  type ShopCategory,
  type ShopItem,
  type ShopOrder,
  type ShopOrderStatus,
} from "@/components/shop/shop";
import { api, useFileObjectUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtNum, fmtRelDateTime } from "@/lib/format";
import { useDebouncedValue, useSearchParamState } from "@/lib/hooks";
import { toastError, useApiMutation, useApiQuery } from "@/lib/query";
import type { FileMeta, Paginated } from "@/lib/types";
import { uploadFiles } from "./b/materials";
import { RulesTab } from "./b/shop-rules";

const KEY = ["admin", "shop"];
const INV = [KEY, ["me", "nav-badges"]];
const PAGE_SIZE = 15;

type AdminItem = ShopItem & { orders: { pending: number; delivered: number } };
type Summary = {
  pending: number;
  delivered: number;
  deliveredMonth: number;
  spentTotal: number;
  spentMonth: number;
  activeItems: number;
  outOfStock: number;
  circulating: number;
  top: { item: { id: string; title: string; price: number }; count: number }[];
};
type OrdersPage = Paginated<ShopOrder> & { counts: Record<ShopOrderStatus, number> };

/** Boʻsh doʻkon uchun namuna sovgʻalar (narxlar: oʻquvchi haftasiga ≈ 60 tanga yigʻadi). */
const SAMPLES: { title: string; description: string; category: ShopCategory; price: number; stock: number | null; perStudentLimit: number | null }[] = [
  { title: "Stikerlar toʻplami", description: "Rangli ingliz tilidagi stikerlar — daftar va noutbuk uchun.", category: "GIFT", price: 100, stock: 30, perStudentLimit: null },
  { title: "URFON ruchkasi", description: "Logotipli koʻk ruchka.", category: "STATIONERY", price: 100, stock: 50, perStudentLimit: null },
  { title: "Daftar (lugʻat uchun)", description: "Yangi soʻzlarni yozib borish uchun 48 varaqli daftar.", category: "STATIONERY", price: 250, stock: 30, perStudentLimit: null },
  { title: "Uy vazifasidan bir marta ozod", description: "Istalgan bitta uy vazifasini bajarmaslik huquqi (ustozga oldindan aytiladi).", category: "PRIVILEGE", price: 300, stock: null, perStudentLimit: 2 },
  { title: "Darsda musiqa tanlash", description: "Keyingi darsning tanaffusida guruh uchun qoʻshiq tanlaysiz.", category: "PRIVILEGE", price: 200, stock: null, perStudentLimit: null },
  { title: "URFON bloknoti", description: "Qattiq muqovali brendli bloknot.", category: "SWAG", price: 375, stock: 20, perStudentLimit: null },
  { title: "Ingliz tilida hikoyalar kitobi", description: "Darajangizga mos graded reader kitob.", category: "GIFT", price: 750, stock: 10, perStudentLimit: null },
  { title: "URFON futbolkasi", description: "Oʻlchamni administratorga ayting.", category: "SWAG", price: 1000, stock: 10, perStudentLimit: 1 },
];

export default function AdminShopPage() {
  const [tab, setTab] = useSearchParamState("t", "orders");
  const [itemDialog, setItemDialog] = useState<AdminItem | "new" | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const summaryQ = useApiQuery<Summary>([...KEY, "summary"], "/admin/shop/summary");
  const itemsQ = useApiQuery<{ items: AdminItem[] }>([...KEY, "items"], "/admin/shop/items");
  const s = summaryQ.data;

  return (
    <>
      <PageHeader
        title="Tanga doʻkoni"
        documentTitle="Tanga doʻkoni"
        breadcrumbs={[{ label: "Boshqaruv markazi", to: "/admin" }, { label: "Gamifikatsiya" }, { label: "Tanga doʻkoni" }]}
        subtitle="Oʻquvchilar yigʻgan kumush tangalarni sovgʻalarga almashtiradi — buyurtmalarni shu yerda topshirasiz"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon="person_add" onClick={() => setOrderOpen(true)}>
              Oʻquvchi nomidan
            </Button>
            <Button icon="add" onClick={() => setItemDialog("new")}>
              Sovgʻa qoʻshish
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Topshirilishi kerak"
          value={s ? fmtNum(s.pending) : "—"}
          icon="schedule"
          iconTone={s?.pending ? "warning" : "neutral"}
          sub={s?.pending ? "oʻquvchi sovgʻasini kutmoqda" : "navbat boʻsh"}
          loading={summaryQ.isLoading}
          onClick={() => setTab("orders")}
        />
        <StatCard label="Bu oy topshirildi" value={s ? fmtNum(s.deliveredMonth) : "—"} icon="check_circle" iconTone="success" sub={s ? `jami ${fmtNum(s.delivered)} ta` : undefined} loading={summaryQ.isLoading} />
        <StatCard label="Bu oy sarflangan" value={s ? fmtNum(s.spentMonth) : "—"} unit="tanga" icon="shopping_bag" iconTone="primary" sub={s ? `jami ${fmtNum(s.spentTotal)} tanga` : undefined} loading={summaryQ.isLoading} />
        <StatCard label="Oʻquvchilar qoʻlida" value={s ? fmtNum(s.circulating) : "—"} unit="tanga" icon="toll" iconTone="gold" sub="hali sarflanmagan tangalar" loading={summaryQ.isLoading} />
      </div>

      <Tabs value={tab === "items" || tab === "rules" ? tab : "orders"} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="orders" icon="receipt_long" count={s?.pending || undefined}>
            Buyurtmalar
          </TabsTrigger>
          <TabsTrigger value="items" icon="storefront" count={s ? s.activeItems : undefined}>
            Vitrina
          </TabsTrigger>
          <TabsTrigger value="rules" icon="emoji_events">
            Qoidalar va mukofotlar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-5">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="items" className="mt-5">
          <ItemsTab items={itemsQ.data?.items} loading={itemsQ.isLoading} onEdit={setItemDialog} top={s?.top ?? []} />
        </TabsContent>
        <TabsContent value="rules" className="mt-5">
          <RulesTab />
        </TabsContent>
      </Tabs>

      {itemDialog ? <ItemDialog item={itemDialog === "new" ? null : itemDialog} onClose={() => setItemDialog(null)} /> : null}
      {orderOpen ? <OrderForStudentDialog onClose={() => setOrderOpen(false)} /> : null}
    </>
  );
}

// ─────────────────────────── buyurtmalar ───────────────────────────

function OrdersTab() {
  const [status, setStatus] = useSearchParamState("status", "PENDING");
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 300);
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState<ShopOrder | null>(null);
  useEffect(() => setPage(1), [status, dq]);

  const listQ = useApiQuery<OrdersPage>([...KEY, "orders"], "/admin/shop/orders", {
    params: { status: status || "all", q: dq || undefined, page, pageSize: PAGE_SIZE },
    placeholderData: keepPreviousData,
  });
  const deliver = useApiMutation((o: ShopOrder) => api.post<ShopOrder>(`/admin/shop/orders/${o.id}/deliver`), {
    invalidate: INV,
    success: (o) => `${o.no} topshirildi — ${o.student.fullName}`,
  });
  const c = listQ.data?.counts;
  const statuses: { v: string; label: string; n?: number }[] = [
    { v: "PENDING", label: "Kutilmoqda", n: c?.PENDING },
    { v: "DELIVERED", label: "Topshirilgan", n: c?.DELIVERED },
    { v: "CANCELLED", label: "Bekor qilingan", n: c?.CANCELLED },
    { v: "all", label: "Barchasi", n: c ? c.PENDING + c.DELIVERED + c.CANCELLED : undefined },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-outline-variant p-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={status || "all"} onValueChange={setStatus} variant="segmented">
          <TabsList>
            {statuses.map((x) => (
              <TabsTrigger key={x.v} value={x.v} count={x.n}>
                {x.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <SearchInput value={q} onValueChange={setQ} placeholder="Oʻquvchi, sovgʻa yoki #raqam" className="md:w-72" />
      </div>
      <DataTable
        rows={listQ.data?.items}
        loading={listQ.isLoading}
        getRowId={(o) => o.id}
        empty={
          status === "PENDING"
            ? { icon: "task_alt", title: "Topshiriladigan buyurtma yoʻq", description: "Oʻquvchi yoki ota-ona sovgʻa tanlasa, shu yerda paydo boʻladi." }
            : { icon: "receipt_long", title: "Buyurtma topilmadi" }
        }
        columns={[
          { key: "no", header: "№", width: 72, cell: (o) => <span className="font-label-md text-label-md tabular-nums text-on-surface-variant">{o.no}</span> },
          {
            key: "student",
            header: "Oʻquvchi",
            cell: (o) => (
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface">{o.student.fullName}</p>
                <p className="text-body-sm text-on-surface-muted">
                  {o.student.code ? `${o.student.code} · ` : ""}buyurtma: {REQUESTER[o.requestedBy.role]}
                </p>
              </div>
            ),
          },
          {
            key: "item",
            header: "Sovgʻa",
            cell: (o) => (
              <div className="flex min-w-0 items-center gap-3">
                <ItemImage image={o.item.image} category={o.item.category} alt={o.item.title} className="h-10 w-10 shrink-0 rounded-lg" iconSize={20} />
                <div className="min-w-0">
                  <p className="text-body-md text-on-surface">{o.item.title}</p>
                  {o.note ? <p className="text-body-sm text-on-surface-muted">{o.note}</p> : null}
                </div>
              </div>
            ),
          },
          { key: "price", header: "Narx", align: "right", cell: (o) => <Price value={o.price} size="sm" /> },
          {
            key: "date",
            header: "Sana",
            hideBelow: "lg",
            cell: (o) => (
              <div className="text-body-sm">
                <p className="text-on-surface">{fmtRelDateTime(o.createdAt)}</p>
                {o.handledAt ? (
                  <p className="text-on-surface-muted">
                    {o.status === "DELIVERED" ? "topshirildi" : "bekor"} {fmtRelDateTime(o.handledAt)}
                  </p>
                ) : null}
              </div>
            ),
          },
          {
            key: "status",
            header: "Holat",
            cell: (o) => (
              <div>
                <StatusBadge status={o.status} />
                {o.status === "CANCELLED" && o.cancelReason ? <p className="mt-1 max-w-48 text-body-sm text-on-surface-muted">{o.cancelReason}</p> : null}
              </div>
            ),
          },
          {
            key: "act",
            header: "",
            align: "right",
            cell: (o) =>
              o.status === "PENDING" ? (
                <div className="flex justify-end gap-1">
                  <Button size="sm" icon="check" loading={deliver.isPending && deliver.variables?.id === o.id} onClick={() => deliver.mutate(o)}>
                    Topshirildi
                  </Button>
                  <IconButton icon="undo" label="Bekor qilish (tanga qaytadi)" size="sm" onClick={() => setCancelling(o)} />
                </div>
              ) : null,
          },
        ]}
      />
      {listQ.data && listQ.data.pages > 1 ? (
        <div className="border-t border-outline-variant p-4">
          <Pagination page={page} pageCount={listQ.data.pages} total={listQ.data.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      ) : null}
      {cancelling ? <CancelDialog order={cancelling} onClose={() => setCancelling(null)} /> : null}
    </Card>
  );
}

function CancelDialog({ order, onClose }: { order: ShopOrder; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const cancel = useApiMutation(() => api.post(`/admin/shop/orders/${order.id}/cancel`, { reason: reason.trim() || null }), {
    invalidate: INV,
    success: `${order.no} bekor qilindi, ${fmtNum(order.price)} tanga qaytarildi`,
    onSuccess: onClose,
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Buyurtma ${order.no} bekor qilinsinmi?`}
      description={`${order.student.fullName} — “${order.item.title}”. ${fmtNum(order.price)} tanga oʻquvchiga qaytadi, zaxira tiklanadi.`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Orqaga
          </Button>
          <Button variant="danger" icon="undo" loading={cancel.isPending} onClick={() => cancel.mutate()}>
            Bekor qilish
          </Button>
        </>
      }
    >
      <Field label="Sabab" hint="Oʻquvchi va ota-onaga bildirishnomada koʻrinadi (ixtiyoriy)">
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={300} placeholder="Masalan: bu oʻlcham qolmadi" />
      </Field>
    </Dialog>
  );
}

// ─────────────────────────── vitrina ───────────────────────────

function ItemsTab({ items, loading, onEdit, top }: { items: AdminItem[] | undefined; loading: boolean; onEdit: (i: AdminItem | "new") => void; top: Summary["top"] }) {
  const [delItem, setDelItem] = useState<AdminItem | null>(null);
  const [seeding, setSeeding] = useState(false);
  const qc = useQueryClient();
  const del = useApiMutation((i: AdminItem) => api.delete<{ archived: boolean }>(`/admin/shop/items/${i.id}`), {
    invalidate: INV,
    success: (r) => (r.archived ? "Sovgʻa arxivga olindi (buyurtmalar tarixi saqlanadi)" : "Sovgʻa oʻchirildi"),
  });
  const toggle = useApiMutation((i: AdminItem) => api.put(`/admin/shop/items/${i.id}`, { isActive: !i.isActive }), {
    invalidate: INV,
    success: (_, i) => (i.isActive ? "Vitrinadan olindi" : "Vitrinaga qaytarildi"),
  });
  const seed = async () => {
    setSeeding(true);
    try {
      for (const [i, s] of SAMPLES.entries()) await api.post("/admin/shop/items", { ...s, sort: i * 10 });
      toast.success(`${SAMPLES.length} ta namuna sovgʻa qoʻshildi — narx va zaxirani oʻzingizga moslang`);
    } catch (e) {
      toastError(e);
    } finally {
      setSeeding(false);
      await Promise.all(INV.map((queryKey) => qc.invalidateQueries({ queryKey })));
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  const active = items?.filter((i) => i.isActive) ?? [];
  const archived = items?.filter((i) => !i.isActive) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Alert tone="primary" icon="lightbulb" title="Doʻkon qanday ishlaydi?">
        <ul className="flex list-disc flex-col gap-1 pl-4">
          <li>
            Oʻquvchi darsga oʻz vaqtida kelish, baholar, musobaqa va tanlovlar uchun <b>XP</b> (tajriba) va <b>kumush</b> oladi. XP oshgan sari bosqich oshadi va har bir harakat uchun koʻproq kumush beriladi — batafsil «Qoidalar va mukofotlar» boʻlimida.
          </li>
          <li>
            Oʻquvchi <b>oʻz kabinetidan</b> yoki ota-onasi <b>ota-ona kabinetidan</b> sovgʻani tanlaydi — tanga darhol yechiladi, buyurtma «Buyurtmalar» navbatiga tushadi.
          </li>
          <li>
            Sovgʻani qoʻliga berganingizda <b>«Topshirildi»</b> ni bosing. Bekor qilsangiz, tanga va zaxira avtomatik qaytadi.
          </li>
        </ul>
      </Alert>

      {!items?.length ? (
        <Card>
          <EmptyState
            icon="storefront"
            title="Vitrina hali boʻsh"
            description="Birinchi sovgʻani qoʻshing yoki tayyor namunalardan boshlang — keyin narx va zaxirani markazingizga moslaysiz."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button icon="add" onClick={() => onEdit("new")}>
                  Sovgʻa qoʻshish
                </Button>
                <Button variant="outline" icon="auto_awesome" loading={seeding} onClick={() => void seed()}>
                  Namuna sovgʻalarni qoʻshish
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {active.map((i) => (
              <AdminItemCard key={i.id} item={i} onEdit={() => onEdit(i)} onToggle={() => toggle.mutate(i)} onDelete={() => setDelItem(i)} rank={top[0] && top[0].count >= 3 ? top.findIndex((t) => t.item.id === i.id) : -1} />
            ))}
            <button
              type="button"
              onClick={() => onEdit("new")}
              className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
            >
              <Icon name="add" size={28} />
              <span className="font-label-lg text-label-lg">Yangi sovgʻa</span>
            </button>
          </div>
          {archived.length ? (
            <section>
              <h2 className="mb-3 font-headline-sm text-headline-sm text-on-surface-variant">Arxiv · {archived.length}</h2>
              <div className="grid grid-cols-1 gap-4 opacity-75 md:grid-cols-2 xl:grid-cols-3">
                {archived.map((i) => (
                  <AdminItemCard key={i.id} item={i} onEdit={() => onEdit(i)} onToggle={() => toggle.mutate(i)} onDelete={() => setDelItem(i)} rank={-1} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={!!delItem}
        onOpenChange={(o) => !o && setDelItem(null)}
        title={`“${delItem?.title ?? ""}” oʻchirilsinmi?`}
        description={
          delItem && delItem.orders.pending + delItem.orders.delivered > 0
            ? "Bu sovgʻaga buyurtmalar bor — u oʻchirilmaydi, arxivga olinadi (tarix saqlanadi)."
            : "Sovgʻa vitrinadan butunlay oʻchiriladi."
        }
        confirmLabel={delItem && delItem.orders.pending + delItem.orders.delivered > 0 ? "Arxivga olish" : "Oʻchirish"}
        tone="danger"
        onConfirm={() => delItem && del.mutateAsync(delItem)}
      />
    </div>
  );
}

function AdminItemCard({ item, onEdit, onToggle, onDelete, rank }: { item: AdminItem; onEdit: () => void; onToggle: () => void; onDelete: () => void; rank: number }) {
  return (
    <article className="flex gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-xs">
      <ItemImage image={item.image} category={item.category} alt={item.title} className="h-24 w-24 shrink-0 rounded-lg" iconSize={36} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-label-lg text-label-lg text-on-surface">{item.title}</h3>
            <p className="text-body-sm text-on-surface-muted">{item.categoryLabel}</p>
          </div>
          <Price value={item.price} size="sm" className="shrink-0" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {!item.isActive ? (
            <Badge tone="neutral" icon="archive" size="sm">
              Arxivda
            </Badge>
          ) : item.stock === 0 ? (
            <Badge tone="danger" size="sm">
              Tugagan
            </Badge>
          ) : (
            <Badge tone={item.stock != null && item.stock <= 5 ? "warning" : "neutral"} size="sm">
              {item.stock == null ? "Zaxira cheksiz" : `${item.stock} ta qoldi`}
            </Badge>
          )}
          {item.perStudentLimit ? (
            <Badge tone="neutral" size="sm">
              {item.perStudentLimit === 1 ? "1 marta" : `${item.perStudentLimit} martagacha`}
            </Badge>
          ) : null}
          {rank === 0 ? (
            <Badge tone="gold" icon="star" size="sm">
              Eng koʻp olingan
            </Badge>
          ) : null}
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Topshirilgan: <b className="tabular-nums">{item.orders.delivered}</b>
          {item.orders.pending ? (
            <>
              {" "}
              · kutilmoqda: <b className="tabular-nums text-warning">{item.orders.pending}</b>
            </>
          ) : null}
        </p>
        <div className="mt-auto flex gap-1">
          <Button size="sm" variant="outline" icon="edit" onClick={onEdit}>
            Tahrirlash
          </Button>
          <IconButton size="sm" icon={item.isActive ? "visibility_off" : "unarchive"} label={item.isActive ? "Vitrinadan olish" : "Vitrinaga qaytarish"} onClick={onToggle} />
          <IconButton size="sm" icon="delete" label="Oʻchirish" onClick={onDelete} />
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────── sovgʻa oynasi ───────────────────────────

function ItemDialog({ item, onClose }: { item: AdminItem | null; onClose: () => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [category, setCategory] = useState<ShopCategory>(item?.category ?? "GIFT");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [unlimited, setUnlimited] = useState(item ? item.stock == null : false);
  const [stock, setStock] = useState(item?.stock != null ? String(item.stock) : "10");
  const [limit, setLimit] = useState(item?.perStudentLimit != null ? String(item.perStudentLimit) : "");
  const [sort, setSort] = useState(item ? String(item.sort) : "0");
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [image, setImage] = useState<FileMeta | null>(item?.image ?? null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = useFileObjectUrl(image?.id);

  const errors = {
    title: title.trim().length < 2 ? "Nomi kamida 2 belgi" : null,
    price: !/^\d+$/.test(price) || Number(price) < 1 ? "Narx — musbat butun son" : null,
    stock: !unlimited && !/^\d+$/.test(stock) ? "Zaxira — butun son" : null,
    limit: limit && (!/^\d+$/.test(limit) || Number(limit) < 1) ? "Butun son yoki boʻsh" : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const [touched, setTouched] = useState(false);

  const save = useApiMutation(
    () => {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        price: Number(price),
        stock: unlimited ? null : Number(stock),
        perStudentLimit: limit ? Number(limit) : null,
        sort: Number(sort) || 0,
        isActive,
        imageFileId: image?.id ?? null,
      };
      return item ? api.put(`/admin/shop/items/${item.id}`, body) : api.post("/admin/shop/items", body);
    },
    { invalidate: INV, success: item ? "Sovgʻa saqlandi" : "Sovgʻa vitrinaga qoʻshildi", onSuccess: onClose },
  );

  const pick = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Faqat rasm (JPG, PNG, WEBP) yuklang");
    if (f.size > 5 * 1024 * 1024) return toast.error("Rasm 5 MB dan oshmasin");
    setUploading(true);
    try {
      const [meta] = await uploadFiles([f]);
      setImage(meta ?? null);
    } catch (e) {
      toastError(e);
    } finally {
      setUploading(false);
    }
  };

  const err = (k: keyof typeof errors) => (touched ? errors[k] : null);

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={item ? "Sovgʻani tahrirlash" : "Yangi sovgʻa"}
      description="Oʻquvchi va ota-ona kabinetidagi vitrinada shunday koʻrinadi"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            icon="check"
            loading={save.isPending}
            disabled={uploading}
            onClick={() => {
              setTouched(true);
              if (valid) save.mutate();
            }}
          >
            Saqlash
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary hover:text-primary"
            aria-label="Rasm tanlash"
          >
            {uploading ? (
              <Skeleton className="h-full w-full" />
            ) : image && preview.url ? (
              <img src={preview.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 p-2 text-center">
                <Icon name={CATEGORY_META[category].icon} size={36} />
                <span className="text-body-sm">Rasm yuklash</span>
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => void pick(e.target.files?.[0])} />
          {image ? (
            <Button size="sm" variant="ghost" icon="delete" onClick={() => setImage(null)}>
              Rasmni olib tashlash
            </Button>
          ) : (
            <p className="text-center text-body-sm text-on-surface-muted">Rasm boʻlmasa, kategoriya belgisi chiqadi</p>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Nomi" required error={err("title")}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Masalan: URFON futbolkasi" />
          </Field>
          <Field label="Tavsif" hint="Oʻlcham, rang, qanday foydalaniladi — qisqacha">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={1000} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Kategoriya">
              <Select value={category} onChange={(e) => setCategory(e.target.value as ShopCategory)} options={CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_META[c].label }))} />
            </Field>
            <Field label="Narxi (tanga)" required error={err("price")} hint="Haftasiga ≈ 60 tanga yigʻiladi">
              <Input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="150" rightSlot={<Coin size={18} />} />
            </Field>
            <Field label="Zaxira" error={err("stock")}>
              <div className="flex flex-col gap-2">
                <Input value={unlimited ? "" : stock} disabled={unlimited} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder={unlimited ? "Cheksiz" : "10"} />
                <Checkbox checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} label="Cheksiz (imtiyozlar uchun)" />
              </div>
            </Field>
            <Field label="Bir oʻquvchiga limit" error={err("limit")} hint="Boʻsh — cheklovsiz">
              <Input value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Masalan: 1" />
            </Field>
          </div>
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
            <Field label="Tartib" hint="Kichik raqam vitrinada oldinroq">
              <Input value={sort} onChange={(e) => setSort(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
            </Field>
            <Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} label="Vitrinada koʻrinsin" description="Oʻchirilsa, oʻquvchilar koʻrmaydi" />
          </div>
        </div>
      </div>
    </Dialog>
  );
}

// ─────────────────────────── oʻquvchi nomidan buyurtma ───────────────────────────

type StudentHit = { id: string; fullName: string; code: string | null; balance: number };

function OrderForStudentDialog({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 250);
  const [student, setStudent] = useState<StudentHit | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [deliverNow, setDeliverNow] = useState(true);
  const studentsQ = useApiQuery<{ items: StudentHit[] }>([...KEY, "students"], student ? null : "/admin/shop/students", { params: { q: dq } });
  const catalogQ = useApiQuery<Catalog>([...KEY, "catalog", student?.id], student ? `/admin/shop/students/${student.id}/catalog` : null);
  const item: CatalogItem | undefined = catalogQ.data?.items.find((i) => i.id === itemId);

  const order = useApiMutation(() => api.post<ShopOrder>("/admin/shop/orders", { studentId: student?.id, itemId, deliverNow }), {
    invalidate: INV,
    success: (o) => `${o.no}: ${o.student.fullName} — “${o.item.title}”${deliverNow ? " topshirildi" : " navbatga qoʻshildi"}`,
    onSuccess: onClose,
  });

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Oʻquvchi nomidan almashtirish"
      description="Oʻquvchi markazga kelib sovgʻa tanlasa — tangasi shu yerdan yechiladi"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button icon="shopping_bag" disabled={!student || !item?.canBuy} loading={order.isPending} onClick={() => order.mutate()}>
            {item ? `${fmtNum(item.price)} tangaga almashtirish` : "Sovgʻani tanlang"}
          </Button>
        </>
      }
    >
      {!student ? (
        <div className="flex flex-col gap-3">
          <SearchInput value={q} onValueChange={setQ} placeholder="Ism yoki ST-kod" autoFocus />
          <ul className="flex max-h-80 flex-col divide-y divide-outline-variant overflow-y-auto rounded-lg border border-outline-variant">
            {studentsQ.isLoading ? (
              <li className="p-3">
                <Skeleton className="h-8" />
              </li>
            ) : !studentsQ.data?.items.length ? (
              <li className="p-4 text-center text-body-sm text-on-surface-muted">Oʻquvchi topilmadi</li>
            ) : (
              studentsQ.data.items.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => setStudent(s)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-surface-container-low">
                    <span className="min-w-0">
                      <span className="block font-label-lg text-label-lg text-on-surface">{s.fullName}</span>
                      <span className="text-body-sm text-on-surface-muted">{s.code}</span>
                    </span>
                    <Price value={s.balance} size="sm" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3">
            <div>
              <p className="font-label-lg text-label-lg text-on-surface">{student.fullName}</p>
              <p className="text-body-sm text-on-surface-muted">
                {student.code} · balans <b className="tabular-nums">{fmtNum(catalogQ.data?.balance ?? student.balance)}</b> tanga
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              icon="swap_horiz"
              onClick={() => {
                setStudent(null);
                setItemId(null);
              }}
            >
              Boshqa oʻquvchi
            </Button>
          </div>
          {catalogQ.isLoading ? (
            <Skeleton className="h-40" />
          ) : !catalogQ.data?.items.length ? (
            <p className="text-body-sm text-on-surface-muted">Vitrinada faol sovgʻa yoʻq.</p>
          ) : (
            <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {catalogQ.data.items.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  disabled={!i.canBuy}
                  onClick={() => setItemId(i.id)}
                  aria-pressed={itemId === i.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    itemId === i.id ? "border-primary bg-primary-fixed/50" : "border-outline-variant hover:bg-surface-container-low",
                  )}
                >
                  <ItemImage image={i.image} category={i.category} alt={i.title} className="h-11 w-11 shrink-0 rounded-md" iconSize={20} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-body-md text-on-surface">{i.title}</span>
                    <span className="text-body-sm text-on-surface-muted">{i.canBuy ? `${fmtNum(i.price)} tanga` : i.blocked}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          <Checkbox checked={deliverNow} onChange={(e) => setDeliverNow(e.target.checked)} label="Sovgʻa hozir qoʻliga berildi" description="Belgilanmasa, buyurtma «Kutilmoqda» navbatiga tushadi" />
        </div>
      )}
    </Dialog>
  );
}
