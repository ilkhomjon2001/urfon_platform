// Admin: dars rejalari — har bir darsning toʻliq rejasini katta, oʻqishga qulay koʻrinishda koʻrish va chop etish.
import { Link } from "react-router-dom";
import { buttonVariants, PageHeader } from "@/components/ui";
import { PlanReader } from "@/components/lesson-plan/PlanReader";
import { useApiQuery } from "@/lib/query";
import { SUBJECT_LABEL, type LevelStat, type Subject } from "./a/types";

export default function AdminLessonPlansPage() {
  const q = useApiQuery<{ items: LevelStat[] }>(["admin", "curriculum", "levels"], "/admin/curriculum/levels");
  const items = q.data?.items ?? [];
  // standart: rejasi bor Beginner, boʻlmasa guruhlari koʻp level
  const subjects = new Set(items.map((l) => l.subject ?? "ENGLISH"));
  // bir nechta fan boʻlsa, level nomi oldida fan koʻrsatiladi
  const label = (l: LevelStat) => (subjects.size > 1 ? `${SUBJECT_LABEL[(l.subject ?? "ENGLISH") as Subject]} · ${l.label ?? l.name}` : (l.label ?? l.name));
  const beginner = items.find((l) => l.code === "BEGINNER");
  const byGroups = beginner ?? [...items].sort((a, b) => b.groupsCount - a.groupsCount || a.order - b.order)[0];
  return (
    <>
      <PageHeader
        title="Dars rejalari"
        breadcrumbs={[{ label: "Boshqaruv markazi", to: "/admin" }, { label: "Oʻquv dasturi" }, { label: "Dars rejalari" }]}
        subtitle="Levelni tanlang, keyin unit ichidagi darsni bosing — toʻliq reja ochiladi"
        actions={
          <Link to="/admin/mavzular" className={buttonVariants({ variant: "outline" })}>
            Mavzular bazasi
          </Link>
        }
      />
      <PlanReader
        levels={items.map((l) => ({ id: l.id, label: label(l), audience: l.audience, cefr: l.cefr }))}
        loadingLevels={q.isLoading}
        defaultLevelId={byGroups?.id}
        planPath={(id, track) => `/admin/curriculum/levels/${id}/plan?track=${track}`}
        queryKey={["admin", "curriculum", "plan"]}
      />
    </>
  );
}
