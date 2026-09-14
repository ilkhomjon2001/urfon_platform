import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { FullScreenSpinner } from "@/components/ui/Spinner";
import { api, refreshSession, setAccessToken, setSessionListener } from "./api";
import { roleHome, settingsPath } from "./roles";
import type { AuthResponse, Role, User } from "./types";

export type AuthStatus = "loading" | "authed" | "guest";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  /** Nima sababdan guest bo'ldi: "logout" bo'lsa /login ga ?next= qo'shilmaydi. */
  endReason: "logout" | "expired" | null;
}

export interface AuthContextValue extends AuthState {
  login: (login: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  /** GET /api/me — profil o'zgargandan keyin (parol, Telegram) chaqiring. */
  refreshMe: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [state, setState] = useState<AuthState>({ user: null, status: "loading", endReason: null });

  useEffect(() => {
    setSessionListener({
      onRefreshed: (res) => setState((s) => ({ ...s, user: res.user, status: "authed" })),
      onExpired: () => {
        qc.clear();
        setState({ user: null, status: "guest", endReason: "expired" });
      },
    });
    let cancelled = false;
    // Sahifa ochilganda cookie orqali sessiyani tiklash
    refreshSession().then((res) => {
      if (cancelled) return;
      setState({ user: res?.user ?? null, status: res ? "authed" : "guest", endReason: null });
    });
    return () => {
      cancelled = true;
    };
  }, [qc]);

  const login = useCallback(
    async (login: string, password: string) => {
      const res = await api.post<AuthResponse>("/auth/login", { login, password });
      setAccessToken(res.accessToken);
      qc.clear();
      setState({ user: res.user, status: "authed", endReason: null });
      return res.user;
    },
    [qc],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* server javob bermasa ham lokal sessiya tozalanadi */
    }
    setAccessToken(null);
    qc.clear();
    setState({ user: null, status: "guest", endReason: "logout" });
  }, [qc]);

  const refreshMe = useCallback(async () => {
    const user = await api.get<User>("/me");
    setState((s) => ({ ...s, user, status: "authed" }));
    return user;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ ...state, login, logout, refreshMe }), [state, login, logout, refreshMe]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Joriy foydalanuvchi va sessiya amallari. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}

/** Kirgan foydalanuvchi (RequireRole ichidagi sahifalarda har doim mavjud). */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser faqat RequireRole ichida ishlatiladi");
  return user;
}

/**
 * Rol himoyasi: mehmon → /login?next=…, boshqa rol → o'z bosh sahifasi,
 * mustChangePassword → rolning Sozlamalar sahifasi.
 */
export function RequireRole({ role, children }: { role: Role | Role[]; children: ReactNode }) {
  const { status, user, endReason } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullScreenSpinner />;
  if (!user) {
    const next = endReason === "logout" ? "" : `?next=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={`/login${next}`} replace />;
  }
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  if (user.mustChangePassword && location.pathname !== settingsPath(user.role)) {
    return <Navigate to={settingsPath(user.role)} replace />;
  }
  return <>{children}</>;
}
