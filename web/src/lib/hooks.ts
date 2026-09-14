import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * URL query parametri holat sifatida (tab, filtr): const [tab, setTab] = useSearchParamState("t", "all");
 * Default qiymat URL'da yozilmaydi. history.replace ishlatiladi (orqaga tugmasi har tab uchun to'lmaydi).
 */
export function useSearchParamState(name: string, fallback = ""): [string, (value: string | null) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(name) ?? fallback;
  const set = useCallback(
    (v: string | null) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (v == null || v === "" || v === fallback) p.delete(name);
          else p.set(name, v);
          return p;
        },
        { replace: true },
      ),
    [name, fallback, setParams],
  );
  return [value, set];
}

/**
 * "?new=1" kabi bayroq: header'dagi "Yangi qoʻshish" → /admin/guruhlar?new=1 → sahifa dialogni ochadi.
 *   const [createOpen, setCreateOpen] = useFlagParam("new");
 *   <Dialog open={createOpen} onOpenChange={setCreateOpen} …/>
 */
export function useFlagParam(name = "new"): [boolean, (on: boolean) => void] {
  const [value, set] = useSearchParamState(name);
  const on = value === "1" || value === "true";
  const setOn = useCallback((v: boolean) => set(v ? "1" : null), [set]);
  return [on, setOn];
}

/** Brauzer tab sarlavhasi: "Guruhlar · URFON". PageHeader buni avtomatik chaqiradi. */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · URFON` : "URFON";
  }, [title]);
}

/** Qidiruv maydonlari uchun: const q = useDebouncedValue(search, 300) */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** const isDesktop = useMediaQuery("(min-width: 1024px)") */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const on = () => setMatches(mql.matches);
    on();
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, [query]);
  return matches;
}
