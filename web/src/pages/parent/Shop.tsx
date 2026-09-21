// Tanga doʻkoni (ota-ona): farzand yigʻgan kumush tangalar va ularni sovgʻaga almashtirish.
// Ota-ona farzand nomidan buyurtma bera oladi; sovgʻani farzand markazdan oladi.
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, ConfirmDialog, Icon, PageHeader } from "@/components/ui";
import { BuyDialog, CatalogGrid, Coin, OrderList, type Catalog, type CatalogItem, type ShopOrder } from "@/components/shop/shop";
import { api } from "@/lib/api";
import { fmtNum } from "@/lib/format";
import { useApiMutation } from "@/lib/query";
import { ErrorCard, NoChild, PageSkeleton, PARENT_BASE, useChildQuery } from "./p/shared";

type ParentCatalog = Catalog & { earned: number; child: { id: string; fullName: string } };

export default function ParentShop() {
  const { data, isLoading, error, refetch, child } = useChildQuery<ParentCatalog>(["shop"], "/parent/shop");
  const [buying, setBuying] = useState<CatalogItem | null>(null);
  const [cancelling, setCancelling] = useState<ShopOrder | null>(null);
  const inv = [["parent", "shop"], ["parent", "dashboard"]];

  const buy = useApiMutation((i: CatalogItem) => api.post<ShopOrder>("/parent/shop/orders", { studentId: child?.id, itemId: i.id }), {
    invalidate: inv,
    onSuccess: (o) => {
      setBuying(null);
      toast.success(`“${o.item.title}” buyurtma qilindi (${o.no})`, { description: "Farzandingiz sovgʻani markazdan olib ketadi." });
    },
  });
  const cancel = useApiMutation((o: ShopOrder) => api.post(`/parent/shop/orders/${o.id}/cancel`, {}, { params: { studentId: child?.id } }), {
    invalidate: inv,
    success: "Buyurtma bekor qilindi, tangalar qaytarildi",
  });

  if (!child) return <NoChild />;
  if (isLoading) return <PageSkeleton cards={1} blocks={2} />;
  if (error || !data) return <ErrorCard error={error} onRetry={() => void refetch()} />;

  const firstName = data.child.fullName.split(/\s+/)[0] ?? data.child.fullName;
  const spent = data.orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.price, 0);
  const pending = data.orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Bosh sahifa", to: PARENT_BASE }, { label: "Tanga doʻkoni" }]}
        title="Tanga doʻkoni"
        subtitle={`${data.child.fullName} darsga kelish, vazifa va faollik uchun kumush tanga yigʻadi — ularni sovgʻaga almashtirish mumkin`}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-primary to-navy p-5 text-on-primary shadow-card">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest">
            <Coin size={28} className="text-on-tertiary-fixed-variant" />
          </span>
          <div>
            <p className="text-body-sm text-on-primary/80">{firstName}ning tangalari</p>
            <p className="font-headline-xl text-headline-xl tabular-nums">{fmtNum(data.balance)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <p className="text-body-sm text-on-surface-muted">Jami yigʻilgan</p>
          <p className="font-headline-xl text-headline-xl tabular-nums text-on-surface">{fmtNum(data.earned)}</p>
          <p className="text-body-sm text-on-surface-muted">shundan {fmtNum(spent)} tanga sovgʻalarga sarflangan</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <p className="text-body-sm text-on-surface-muted">Olib ketilishi kutilmoqda</p>
          <p className="font-headline-xl text-headline-xl tabular-nums text-on-surface">{pending}</p>
          <p className="text-body-sm text-on-surface-muted">{pending ? "sovgʻa markazda tayyor" : "hozircha kutilayotgan sovgʻa yoʻq"}</p>
        </div>
      </section>

      <p className="flex gap-2 rounded-xl bg-primary-fixed/60 p-4 text-body-md text-on-primary-fixed-variant">
        <Icon name="lightbulb" size={20} className="mt-0.5 shrink-0" />
        <span>
          Sovgʻani farzandingiz bilan birga tanlang — bu uning mehnatiga munosib ragʻbat. Buyurtma berganingizda tanga darhol yechiladi,
          sovgʻani administrator markazda topshiradi. Topshirilguncha bekor qilsangiz, tangalar toʻliq qaytadi.
        </span>
      </p>

      <CatalogGrid catalog={data} onBuy={setBuying} buyLabel={`${firstName} uchun olish`} />

      <Card>
        <CardHeader title="Buyurtmalar tarixi" description={`${firstName} va siz bergan buyurtmalar`} />
        <CardContent>
          <OrderList orders={data.orders} onCancel={setCancelling} cancellingId={cancel.isPending ? cancel.variables?.id : null} />
        </CardContent>
      </Card>

      <BuyDialog item={buying} balance={data.balance} forWhom={firstName} onClose={() => setBuying(null)} onConfirm={(i) => buy.mutate(i)} pending={buy.isPending} />
      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Buyurtma bekor qilinsinmi?"
        description={cancelling ? `“${cancelling.item.title}” uchun ${fmtNum(cancelling.price)} tanga ${firstName}ning hisobiga qaytadi.` : undefined}
        confirmLabel="Ha, bekor qilish"
        onConfirm={() => cancelling && cancel.mutateAsync(cancelling)}
      />
    </div>
  );
}
