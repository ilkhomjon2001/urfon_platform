// Tanga doʻkoni (oʻquvchi): yigʻilgan kumush tangalarni sovgʻalarga almashtirish.
// Buyurtmani markaz administratori topshiradi; topshirilguncha bekor qilinsa, tanga toʻliq qaytadi.
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { buttonVariants, Card, CardContent, CardHeader, ConfirmDialog, Icon, PageHeader, Skeleton } from "@/components/ui";
import { BuyDialog, CatalogGrid, CatalogSkeleton, Coin, OrderList, type Catalog, type CatalogItem, type ShopOrder } from "@/components/shop/shop";
import { api } from "@/lib/api";
import { fmtNum } from "@/lib/format";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { ErrorState } from "./components/common";

const KEY = ["student", "shop"];
const INV = [KEY, ["student", "achievements"], ["student", "dashboard"], ["me"]];

export default function StudentShopPage() {
  const { data, isLoading, error, refetch } = useApiQuery<Catalog>(KEY, "/student/shop");
  const [buying, setBuying] = useState<CatalogItem | null>(null);
  const [cancelling, setCancelling] = useState<ShopOrder | null>(null);

  const buy = useApiMutation((i: CatalogItem) => api.post<ShopOrder>("/student/shop/orders", { itemId: i.id }), {
    invalidate: INV,
    onSuccess: (o) => {
      setBuying(null);
      toast.success(`“${o.item.title}” buyurtma qilindi (${o.no})`, { description: "Sovgʻani markaz administratoridan olib keting." });
    },
  });
  const cancel = useApiMutation((o: ShopOrder) => api.post(`/student/shop/orders/${o.id}/cancel`, {}), {
    invalidate: INV,
    success: "Buyurtma bekor qilindi, tangalar qaytarildi",
  });

  const pending = data?.orders.filter((o) => o.status === "PENDING") ?? [];

  return (
    <>
      <PageHeader
        title="Tanga doʻkoni"
        subtitle="Mehnat bilan yigʻilgan kumush tangalarni sovgʻalarga almashtiring."
        breadcrumbs={[{ label: "Bosh sahifa", to: "/oquvchi" }, { label: "Tanga doʻkoni" }]}
        actions={
          <Link to="/oquvchi/yutuqlar" className={buttonVariants({ variant: "outline" })}>
            <Icon name="military_tech" size={18} />
            Tanga qanday yigʻiladi?
          </Link>
        }
      />
      {isLoading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <CatalogSkeleton />
        </div>
      ) : error || !data ? (
        <Card>
          <ErrorState error={error} onRetry={() => void refetch()} />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-navy p-5 text-on-primary shadow-card sm:p-6">
            <div aria-hidden="true" className="bg-dots pointer-events-none absolute inset-0" />
            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-surface-container-lowest to-surface-container-high ring-4 ring-on-primary/20">
                  <Coin size={34} className="text-on-tertiary-fixed-variant" />
                </div>
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-primary/75">Almashtirish mumkin</p>
                  <p className="flex items-baseline gap-2">
                    <span className="font-display-sm text-display-sm tabular-nums">{fmtNum(data.balance)}</span>
                    <span className="font-headline-sm text-headline-sm text-gold">tanga</span>
                  </p>
                </div>
              </div>
              {pending.length ? (
                <a href="#buyurtmalar" className="inline-flex items-center gap-2 rounded-xl bg-on-primary/15 px-4 py-3 font-label-md text-label-md hover:bg-on-primary/20">
                  <Icon name="schedule" size={20} className="text-gold" />
                  {pending.length} ta sovgʻa sizni kutmoqda — markazdan olib keting
                </a>
              ) : (
                <p className="max-w-sm text-body-sm text-on-primary/80">
                  Tangalarni sarflash unvoningizga taʼsir qilmaydi — unvon jami yigʻilgan tangalar boʻyicha beriladi.
                </p>
              )}
            </div>
          </section>

          <CatalogGrid catalog={data} onBuy={setBuying} />

          <Card id="buyurtmalar">
            <CardHeader title="Mening buyurtmalarim" description="Topshirilmagan buyurtmani bekor qilsangiz, tangalar qaytadi" />
            <CardContent>
              <OrderList orders={data.orders} onCancel={setCancelling} cancellingId={cancel.isPending ? cancel.variables?.id : null} />
            </CardContent>
          </Card>
        </div>
      )}

      <BuyDialog item={buying} balance={data?.balance ?? 0} onClose={() => setBuying(null)} onConfirm={(i) => buy.mutate(i)} pending={buy.isPending} />
      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Buyurtma bekor qilinsinmi?"
        description={cancelling ? `“${cancelling.item.title}” uchun ${fmtNum(cancelling.price)} tanga hisobingizga qaytadi.` : undefined}
        confirmLabel="Ha, bekor qilish"
        onConfirm={() => cancelling && cancel.mutateAsync(cancelling)}
      />
    </>
  );
}
