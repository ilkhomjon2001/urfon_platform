import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface ShellSearchValue {
  query: string;
  setQuery: (q: string) => void;
}

const Ctx = createContext<ShellSearchValue>({ query: "", setQuery: () => {} });

/** Header qidiruv satri holati. Sahifa almashganda tozalanadi. */
export function ShellSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const { pathname } = useLocation();
  useEffect(() => setQuery(""), [pathname]);
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Header'dagi qidiruv matni — sahifa o'z ro'yxatini filtrlashi uchun (ixtiyoriy):
 *   const { query } = useShellSearch();
 *   const rows = groups.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()));
 */
export const useShellSearch = () => useContext(Ctx);
