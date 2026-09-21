// Tanga doʻkoni — oʻquvchi, ota-ona va admin sahifalari uchun umumiy turlar va komponentlar.
import { useState, type ReactNode } from "react";
import { Badge, Button, Checkbox, Dialog, EmptyState, Icon, SearchInput, Select, Skeleton } from "@/components/ui";
import { useFileObjectUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtNum, fmtRelDateTime } from "@/lib/format";
import type { FileMeta, Role, Tone } from "@/lib/types";

// ─────────────────────────── turlar ───────────────────────────

export type ShopCategory = "STATIONERY" | "SWAG" | "PRIVILEGE" | "GIFT";
export type ShopOrderStatus = "PENDING" | "DELIVERED" | "CANCELLED";

export interface ShopItem {
  id: string;
  title: string;
  description: string | null;
  category: ShopCategory;
  categoryLabel: string;
  price: number;
  /** null — cheksiz */
  stock: number | null;
  perStudentLimit: number | null;
  isActive: boolean;
  sort: number;
  image: FileMeta | null;
  createdAt: string;
}

/** Vitrinadagi narsa (oʻquvchi / ota-ona uchun) — "olsa boʻladimi" holati bilan. */
export interface CatalogItem extends ShopItem {
  bought: number;
  canBuy: boolean;
  blocked: string | null;
  missing: number;
}

export interface ShopOrder {
  id: string;
  number: number;
  no: string;
  status: ShopOrderStatus;
  statusLabel: string;
  price: number;
  note: string | null;
  cancelReason: string | null;
  createdAt: string;
  handledAt: string | null;
  item: { id: string; title: string; category: ShopCategory; image: FileMeta | null };
  student: { id: string; fullName: string; code: string | null };
  requestedBy: { id: string; fullName: string; role: Role };
  handledBy: { id: string; fullName: string } | null;
}

export interface Catalog {
  balance: number;
  items: CatalogItem[];
  orders: ShopOrder[];
}

// ─────────────────────────── nomlar ───────────────────────────

export const CATEGORY_META: Record<ShopCategory, { label: string; icon: string; tile: string }> = {
  STATIONERY: { label: "Oʻquv qurollari", icon: "edit", tile: "bg-primary-fixed text-on-primary-fixed-variant" },
  SWAG: { label: "URFON mahsulotlari", icon: "apparel", tile: "bg-primary-container text-on-primary" },
  PRIVILEGE: { label: "Imtiyozlar", icon: "workspace_premium", tile: "bg-success-container text-on-success-container" },
  GIFT: { label: "Sovgʻalar", icon: "redeem", tile: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
};
export const CATEGORY_ORDER: ShopCategory[] = ["GIFT", "STATIONERY", "SWAG", "PRIVILEGE"];

export const STATUS_META: Record<ShopOrderStatus, { label: string; tone: Tone; icon: string }> = {
  PENDING: { label: "Olib ketish kutilmoqda", tone: "warning", icon: "schedule" },
  DELIVERED: { label: "Topshirildi", tone: "success", icon: "check_circle" },
  CANCELLED: { label: "Bekor qilindi", tone: "neutral", icon: "undo" },
};

export const REQUESTER: Record<Role, string> = { STUDENT: "oʻzi", PARENT: "ota-onasi", ADMIN: "administrator", TEACHER: "ustoz" };

// ─────────────────────────── kichik komponentlar ───────────────────────────

/** Kumush tanga belgisi. */
export function Coin({ size = 18, className }: { size?: number; className?: string }) {
  return <Icon name="toll" filled size={size} className={cn("text-tertiary", className)} />;
}

/** Narx: "120 tanga" */
export function Price({ value, size = "md", className }: { value: number; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-tertiary-fixed font-label-md text-on-tertiary-fixed-variant tabular-nums",
        size === "sm" ? "px-2 py-0.5 text-label-sm" : size === "lg" ? "px-3 py-1 text-label-lg" : "px-2.5 py-0.5 text-label-md",
        className,
      )}
    >
      <Coin size={size === "lg" ? 18 : 15} className="text-on-tertiary-fixed-variant" />
      {fmtNum(value)}
    </span>
  );
}

/** Narsa rasmi; rasm boʻlmasa — kategoriya ikonkasi. */
export function ItemImage({ image, category, alt, className, iconSize = 44 }: { image: FileMeta | null; category: ShopCategory; alt: string; className?: string; iconSize?: number }) {
  const { url, error } = useFileObjectUrl(image?.id);
  const meta = CATEGORY_META[category];
  if (image && !error && !url) return <Skeleton className={cn("rounded-none", className)} />;
  if (image && url) return <img src={url} alt={alt} className={cn("object-cover", className)} />;
  return (
    <div className={cn("flex items-center justify-center", meta.tile, className)} aria-hidden="true">
      <Icon name={meta.icon} size={iconSize} />
    </div>
  );
}

export function StatusBadge({ status, className }: { status: ShopOrderStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <Badge tone={m.tone} icon={m.icon} className={className}>
      {m.label}
    </Badge>
  );
}

// ─────────────────────────── vitrina ───────────────────────────

/** Kategoriya filtri (chiplar). */
export function CategoryFilter({ items, value, onChange }: { items: { category: ShopCategory }[]; value: ShopCategory | "all"; onChange: (v: ShopCategory | "all") => void }) {
  const present = CATEGORY_ORDER.filter((c) => items.some((i) => i.category === c));
  if (present.length < 2) return null;
  const chip = (v: ShopCategory | "all", label: string, count: number, icon?: string) => (
    <button
      key={v}
      type="button"
      onClick={() => onChange(v)}
      aria-pressed={value === v}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 font-label-md text-label-md transition-colors",
        value === v
          ? "border-primary bg-primary text-on-primary"
          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
      )}
    >
      {icon ? <Icon name={icon} size={17} /> : null}
      {label}
      <span className={cn("tabular-nums", value === v ? "text-on-primary/80" : "text-on-surface-muted")}>{count}</span>
    </button>
  );
  return (
    <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {chip("all", "Barchasi", items.length)}
      {present.map((c) => chip(c, CATEGORY_META[c].label, items.filter((i) => i.category === c).length, CATEGORY_META[c].icon))}
    </div>
  );
}

/** Vitrinadagi bitta narsa kartasi. */
export function CatalogCard({ item, balance, onBuy, buyLabel = "Almashtirish" }: { item: CatalogItem; balance: number; onBuy: (i: CatalogItem) => void; buyLabel?: string }) {
  const progress = item.price > 0 ? Math.min(100, Math.round((balance / item.price) * 100)) : 100;
  const few = item.stock != null && item.stock > 0 && item.stock <= 5;
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xs transition-shadow hover:shadow-card">
      <div className={cn("relative w-full overflow-hidden bg-surface-container-low", item.image ? "aspect-[16/10]" : "h-28")}>
        <ItemImage image={item.image} category={item.category} alt={item.title} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]" iconSize={item.image ? 56 : 44} />
        <span className="absolute left-3 top-3 rounded-full bg-surface-container-lowest/90 px-2.5 py-0.5 font-label-sm text-label-sm text-on-surface-variant backdrop-blur-sm">
          {item.categoryLabel}
        </span>
        {item.stock === 0 ? (
          <span className="absolute inset-0 flex items-center justify-center bg-inverse-surface/55 font-headline-sm text-headline-sm text-inverse-on-surface">Tugagan</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-headline-sm text-headline-sm text-on-surface [text-wrap:balance]">{item.title}</h3>
          <Price value={item.price} className="mt-0.5 shrink-0" />
        </div>
        {item.description ? <p className="line-clamp-3 text-body-sm text-on-surface-variant">{item.description}</p> : null}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-body-sm text-on-surface-muted">
          {few ? (
            <span className="inline-flex items-center gap-1 text-warning">
              <Icon name="inventory_2" size={15} /> {item.stock} ta qoldi
            </span>
          ) : null}
          {item.perStudentLimit ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="person" size={15} /> {item.perStudentLimit === 1 ? "Bir marta olinadi" : `${item.perStudentLimit} martagacha`}
            </span>
          ) : null}
          {item.bought > 0 ? (
            <span className="inline-flex items-center gap-1 text-success">
              <Icon name="check" size={15} /> {item.bought} marta olingan
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-1">
          {!item.canBuy && item.missing > 0 && item.stock !== 0 ? (
            <div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-container" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Tanga yigʻilishi">
                <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(4, progress)}%` }} />
              </div>
              <p className="mt-1.5 text-body-sm text-on-surface-variant">
                Yana <b className="tabular-nums text-on-surface">{fmtNum(item.missing)}</b> tanga yigʻing
              </p>
            </div>
          ) : null}
          <Button className="w-full" icon={item.canBuy ? "shopping_bag" : undefined} disabled={!item.canBuy} variant={item.canBuy ? "primary" : "secondary"} onClick={() => onBuy(item)}>
            {item.canBuy ? buyLabel : item.missing > 0 && item.blocked?.startsWith("Yana") ? "Tanga yetarli emas" : (item.blocked ?? "Mavjud emas")}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-80 rounded-xl" />
      ))}
    </div>
  );
}

/** Vitrina: filtr + kartalar toʻri. */
export function CatalogGrid({ catalog, onBuy, buyLabel, empty }: { catalog: Catalog; onBuy: (i: CatalogItem) => void; buyLabel?: string; empty?: ReactNode }) {
  const [cat, setCat] = useState<ShopCategory | "all">("all");
  const [q, setQ] = useState("");
  const [affordable, setAffordable] = useState(false);
  const [sort, setSort] = useState<"default" | "cheap" | "expensive">("default");
  if (!catalog.items.length) {
    return <>{empty ?? <EmptyState icon="storefront" title="Doʻkon hali boʻsh" description="Tez orada markaz bu yerga sovgʻalar qoʻshadi. Hozircha tangalarni yigʻishda davom eting!" />}</>;
  }
  const needle = q.trim().toLocaleLowerCase("uz");
  const list = catalog.items
    .filter((i) => cat === "all" || i.category === cat)
    .filter((i) => !needle || i.title.toLocaleLowerCase("uz").includes(needle) || (i.description ?? "").toLocaleLowerCase("uz").includes(needle))
    .filter((i) => !affordable || i.canBuy)
    .sort((a, b) => (sort === "cheap" ? a.price - b.price : sort === "expensive" ? b.price - a.price : 0));
  const filtered = cat !== "all" || !!needle || affordable;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CategoryFilter items={catalog.items} value={cat} onChange={setCat} />
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={q} onValueChange={setQ} placeholder="Sovgʻa nomi" className="w-full sm:w-56" wrapperClassName="w-full sm:w-auto" />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Saralash"
            wrapperClassName="w-40"
            options={[
              { value: "default", label: "Tavsiya etilgan" },
              { value: "cheap", label: "Avval arzonlari" },
              { value: "expensive", label: "Avval qimmatlari" },
            ]}
          />
          <Checkbox checked={affordable} onChange={(e) => setAffordable(e.target.checked)} label="Tangam yetadiganlari" />
        </div>
      </div>
      {list.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((i) => (
            <CatalogCard key={i.id} item={i} balance={catalog.balance} onBuy={onBuy} buyLabel={buyLabel} />
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          icon={affordable ? "toll" : "search_off"}
          title={affordable && !needle && cat === "all" ? "Hozircha tanga yetadigan sovgʻa yoʻq" : "Mos sovgʻa topilmadi"}
          description={affordable ? "Darsga oʻz vaqtida keling va yaxshi baho oling — tangalar tez yigʻiladi." : "Filtrni oʻzgartirib koʻring."}
          action={
            filtered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCat("all");
                  setQ("");
                  setAffordable(false);
                }}
              >
                Filtrni tozalash
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}

/** Almashtirishni tasdiqlash: balans oldin → keyin. */
export function BuyDialog({
  item,
  balance,
  onClose,
  onConfirm,
  pending,
  forWhom,
}: {
  item: CatalogItem | null;
  balance: number;
  onClose: () => void;
  onConfirm: (item: CatalogItem) => void;
  pending: boolean;
  /** "Aziz uchun" — ota-ona oynasida */
  forWhom?: string;
}) {
  return (
    <Dialog
      open={!!item}
      onOpenChange={(o) => !o && onClose()}
      title="Tangalarni almashtirasizmi?"
      description={forWhom ? `${forWhom} yigʻgan tangalar hisobidan` : "Buyurtmani markaz administratori topshiradi"}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Bekor qilish
          </Button>
          <Button icon="shopping_bag" loading={pending} onClick={() => item && onConfirm(item)}>
            Ha, almashtirish
          </Button>
        </>
      }
    >
      {item ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <ItemImage image={item.image} category={item.category} alt={item.title} className="h-16 w-16 shrink-0 rounded-lg" iconSize={28} />
            <div className="min-w-0">
              <p className="font-label-lg text-label-lg text-on-surface">{item.title}</p>
              <p className="text-body-sm text-on-surface-muted">{item.categoryLabel}</p>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-2 rounded-lg bg-surface-container-low p-3 text-center">
            <div>
              <dt className="text-body-sm text-on-surface-muted">Hozir</dt>
              <dd className="font-headline-sm text-headline-sm tabular-nums text-on-surface">{fmtNum(balance)}</dd>
            </div>
            <div>
              <dt className="text-body-sm text-on-surface-muted">Narxi</dt>
              <dd className="font-headline-sm text-headline-sm tabular-nums text-error">−{fmtNum(item.price)}</dd>
            </div>
            <div>
              <dt className="text-body-sm text-on-surface-muted">Qoladi</dt>
              <dd className="font-headline-sm text-headline-sm tabular-nums text-success">{fmtNum(balance - item.price)}</dd>
            </div>
          </dl>
          <p className="flex gap-2 text-body-sm text-on-surface-variant">
            <Icon name="info" size={18} className="mt-px shrink-0 text-primary" />
            Sovgʻani markazdan olib ketasiz. Topshirilguncha buyurtmani bekor qilsangiz, tangalar toʻliq qaytadi.
          </p>
        </div>
      ) : null}
    </Dialog>
  );
}

// ─────────────────────────── buyurtmalar ───────────────────────────

/** Oʻquvchi / ota-ona uchun buyurtmalar roʻyxati. */
export function OrderList({ orders, onCancel, cancellingId, showRequester = true }: { orders: ShopOrder[]; onCancel?: (o: ShopOrder) => void; cancellingId?: string | null; showRequester?: boolean }) {
  if (!orders.length) {
    return <EmptyState compact icon="shopping_bag" title="Hali buyurtma yoʻq" description="Almashtirilgan sovgʻalar shu yerda koʻrinadi." />;
  }
  return (
    <ul className="flex flex-col divide-y divide-outline-variant">
      {orders.map((o) => (
        <li key={o.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
          <ItemImage image={o.item.image} category={o.item.category} alt={o.item.title} className="h-12 w-12 shrink-0 rounded-lg" iconSize={22} />
          <div className="min-w-0 flex-1">
            <p className="font-label-lg text-label-lg text-on-surface">
              {o.item.title} <span className="font-normal text-on-surface-muted tabular-nums">{o.no}</span>
            </p>
            <p className="text-body-sm text-on-surface-muted">
              {fmtRelDateTime(o.createdAt)}
              {showRequester ? ` · buyurtma bergan: ${REQUESTER[o.requestedBy.role]}` : ""}
              {o.status === "CANCELLED" && o.cancelReason ? ` · sabab: ${o.cancelReason}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-label-md text-label-md tabular-nums text-on-surface-variant">
              {o.status === "CANCELLED" ? "" : "−"}
              {fmtNum(o.price)} tanga
            </span>
            <StatusBadge status={o.status} />
            {o.status === "PENDING" && onCancel ? (
              <Button size="sm" variant="ghost" icon="undo" loading={cancellingId === o.id} onClick={() => onCancel(o)}>
                Bekor qilish
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
