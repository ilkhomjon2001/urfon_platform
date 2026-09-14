import { useRouteError } from "react-router-dom";
import { Button, buttonVariants, Card, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";

const CHUNK_RE = /dynamically imported module|Importing a module script failed|error loading dynamically/i;

/** Router errorElement. `inline` — qobiq ichida (sidebar/header qoladi). */
export function RouteError({ inline }: { inline?: boolean }) {
  const err = useRouteError();
  const chunk = err instanceof Error && CHUNK_RE.test(err.message);
  if (import.meta.env.DEV) console.error(err);
  return (
    <div className={cn("flex items-center justify-center", inline ? "min-h-[60vh]" : "min-h-dvh bg-background p-4")}>
      <Card className="w-full max-w-md">
        <EmptyState
          icon={chunk ? "sync_problem" : "error"}
          title={chunk ? "Ilova yangilandi" : "Kutilmagan xatolik"}
          description={
            chunk
              ? "Yangi versiyani yuklash uchun sahifani yangilang."
              : "Sahifani koʻrsatishda xatolik yuz berdi. Sahifani yangilab, qayta urinib koʻring."
          }
          action={
            <>
              <Button icon="refresh" onClick={() => window.location.reload()}>
                Sahifani yangilash
              </Button>
              <a href="/" className={buttonVariants({ variant: "outline" })}>
                Bosh sahifa
              </a>
            </>
          }
        />
      </Card>
    </div>
  );
}
