import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import type { ChildSummary } from "./types";

const STORAGE_KEY = "urfon.parent.childId";

interface ParentChildValue {
  /** Tanlangan farzand (ota-ona bo'lmasa yoki farzand yo'q bo'lsa null). */
  child: ChildSummary | null;
  children: ChildSummary[];
  setChildId: (id: string) => void;
}

const Ctx = createContext<ParentChildValue>({ child: null, children: [], setChildId: () => {} });

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Ota-ona kabinetida tanlangan farzand. Almashtirish faqat sidebar'dagi tanlagichda (KANON §2). */
export function ParentChildProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const kids = useMemo(() => (user?.role === "PARENT" ? (user.children ?? []) : []), [user]);
  const [stored, setStored] = useState<string | null>(readStored);

  const child = kids.find((c) => c.id === stored) ?? kids[0] ?? null;

  const setChildId = useCallback((id: string) => {
    setStored(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* private rejim */
    }
  }, []);

  const value = useMemo(() => ({ child, children: kids, setChildId }), [child, kids, setChildId]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Ota-ona sahifalarida: const { child } = useSelectedChild();
 * So'rovlarda child.id ni queryKey'ga qo'shing: useApiQuery(["parent", "grades", child?.id], child ? `/parent/children/${child.id}/grades` : null)
 */
export function useSelectedChild() {
  return useContext(Ctx);
}
