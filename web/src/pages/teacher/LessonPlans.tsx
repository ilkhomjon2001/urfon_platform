// Ustoz: dars rejalari — darsga tayyorlanish va dars paytida ekranda ochib qoʻyish uchun.
import { PageHeader } from "@/components/ui";
import { PlanReader, type ReaderLevel } from "@/components/lesson-plan/PlanReader";
import { useApiQuery } from "@/lib/query";

interface TeacherPlanLevels {
  items: (ReaderLevel & { code: string; order: number; units: number; lessons: number })[];
  /** ustozning faol guruhlari oʻqiyotgan bosqichlar */
  mine: string[];
}

export default function TeacherLessonPlansPage() {
  const q = useApiQuery<TeacherPlanLevels>(["teacher", "curriculum", "levels"], "/teacher/curriculum/levels");
  const items = q.data?.items ?? [];
  const mine = new Set(q.data?.mine ?? []);
  // oʻz guruhlarining bosqichlari roʻyxat boshida
  const levels = [...items.filter((l) => mine.has(l.id)), ...items.filter((l) => !mine.has(l.id))];
  return (
    <>
      <PageHeader
        title="Dars rejalari"
        breadcrumbs={[{ label: "Bosh sahifa", to: "/ustoz" }, { label: "Dars rejalari" }]}
        subtitle="Har bir darsning toʻliq rejasi: maqsad, lugʻat, 90 daqiqalik bosqichlar, uy vazifasi va eslatmalar"
      />
      <PlanReader
        levels={levels.map((l) => ({ ...l, label: mine.has(l.id) ? `${l.label} (mening guruhim)` : l.label }))}
        loadingLevels={q.isLoading}
        defaultLevelId={q.data?.mine[0]}
        planPath={(id) => `/teacher/curriculum/levels/${id}/plan`}
        queryKey={["teacher", "curriculum", "plan"]}
      />
    </>
  );
}
