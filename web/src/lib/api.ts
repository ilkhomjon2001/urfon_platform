// HTTP qatlami: barcha so'rovlar shu yerdan. Access token faqat xotirada, refresh — httpOnly cookie.
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ApiErrorBody, AuthResponse } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorBody["error"];

  constructor(status: number, code: string, message: string, details?: ApiErrorBody["error"]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

// ---------------------------------------------------------------- sessiya holati

let accessToken: string | null = null;
export const getAccessToken = () => accessToken;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

type SessionListener = {
  /** Refresh muvaffaqiyatli bo'lganda (yangi user maʼlumoti bilan). */
  onRefreshed?: (res: AuthResponse) => void;
  /** Sessiya tiklanmadi — AuthProvider holatni "guest" ga o'tkazadi, RequireRole /login ga yo'naltiradi. */
  onExpired?: () => void;
};
let listener: SessionListener = {};
/** Faqat AuthProvider chaqiradi. */
export function setSessionListener(l: SessionListener) {
  listener = l;
}

function expireSession() {
  accessToken = null;
  if (listener.onExpired) listener.onExpired();
  else if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
}

let refreshPromise: Promise<AuthResponse | null> | null = null;

/**
 * POST /api/auth/refresh (cookie). Parallel chaqiruvlar bitta so'rovga birlashtiriladi.
 * Muvaffaqiyatsiz bo'lsa null qaytaradi (tarmoq xatosida ham).
 */
export function refreshSession(): Promise<AuthResponse | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          accessToken = null;
          return null;
        }
        const data = (await res.json()) as AuthResponse;
        accessToken = data.accessToken;
        listener.onRefreshed?.(data);
        return data;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

// ---------------------------------------------------------------- so'rovlar

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  /** ?key=value (null/undefined/"" tashlab yuboriladi) */
  params?: QueryParams;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Javobni o'qimasdan Response qaytarish (blob, stream uchun). */
  raw?: boolean;
}

/** "/groups" → "/api/groups?x=1". "/api/..." bilan boshlansa prefiks qo'shilmaydi. */
export function apiUrl(path: string, params?: QueryParams) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = p === "/api" || p.startsWith("/api/") ? p : `/api${p}`;
  if (!params) return base;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `${base}${base.includes("?") ? "&" : "?"}${s}` : base;
}

const AUTH_PATHS = ["/auth/login", "/auth/refresh", "/auth/logout"];
/** 401 kodlari: sessiya/token muammosi (refresh + qayta urinish). HTTP_401 — body bo'lmagan javob. */
const SESSION_CODES = new Set(["UNAUTHORIZED", "TOKEN_EXPIRED", "HTTP_401"]);
const isAuthPath = (path: string) => AUTH_PATHS.some((a) => path.replace(/^\/api/, "").startsWith(a));

const FALLBACK_MESSAGE: Record<number, string> = {
  400: "Soʻrov notoʻgʻri",
  401: "Tizimga qayta kiring",
  403: "Bu amal uchun ruxsat yoʻq",
  404: "Maʼlumot topilmadi",
  409: "Bunday yozuv allaqachon mavjud",
  413: "Fayl hajmi juda katta",
  429: "Juda koʻp urinish. Birozdan keyin qayta urinib koʻring",
};

async function toError(res: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> | null = null;
  try {
    body = (await res.json()) as Partial<ApiErrorBody>;
  } catch {
    /* JSON emas */
  }
  const e = body?.error;
  const message = e?.message || FALLBACK_MESSAGE[res.status] || "Serverda xatolik yuz berdi";
  return new ApiError(res.status, e?.code || `HTTP_${res.status}`, message, e);
}

const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError";

async function request<T>(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  const url = apiUrl(path, opts.params);
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const send = async () => {
    const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };
    if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    try {
      return await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
        credentials: "include",
        signal: opts.signal,
      });
    } catch (e) {
      if (isAbort(e)) throw e;
      throw new ApiError(0, "NETWORK", "Server bilan aloqa yoʻq. Internet aloqasini tekshiring");
    }
  };

  let res = await send();
  if (res.status === 401 && !isAuthPath(path)) {
    // Faqat token muammosida refresh qilamiz. Boshqa 401 (masalan, joriy parol noto'g'ri) — oddiy xato.
    const first = await toError(res.clone());
    if (!SESSION_CODES.has(first.code)) throw first;
    const refreshed = await refreshSession();
    if (!refreshed) {
      const err = await toError(res);
      expireSession();
      throw err;
    }
    res = await send();
    if (res.status === 401) {
      const err = await toError(res);
      expireSession();
      throw err;
    }
  }
  if (!res.ok) throw await toError(res);
  if (opts.raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  const text = await res.text();
  return (text === "" ? undefined : text) as T;
}

/**
 * API mijozi. Yo'l `/api` siz yoziladi: api.get<Group[]>("/teacher/groups", { params: { q } }).
 * Xatolar ApiError { status, code, message } sifatida tashlanadi (xabarlar o'zbekcha, UI'da to'g'ridan-to'g'ri ko'rsatsa bo'ladi).
 */
export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PUT", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PATCH", path, body, opts),
  delete: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("DELETE", path, body, opts),
  /** multipart/form-data: const fd = new FormData(); fd.append("file", f); api.upload("/homework/1/submit", fd) */
  upload: <T>(path: string, formData: FormData, opts?: RequestOptions & { method?: "POST" | "PUT" | "PATCH" }) =>
    request<T>(opts?.method ?? "POST", path, formData, opts),
};

// ---------------------------------------------------------------- fayllar (auth bilan himoyalangan)

/** Fayl manzili. <img src> ga to'g'ridan-to'g'ri bermang (Bearer kerak) — useFileObjectUrl ishlating. */
export const fileUrl = (fileId: string) => `/api/files/${encodeURIComponent(fileId)}`;

/** Faylni Bearer token bilan Blob sifatida oladi. */
export async function fetchFileBlob(fileId: string, signal?: AbortSignal): Promise<Blob> {
  const res = await request<Response>("GET", fileUrl(fileId), undefined, { raw: true, signal, headers: { Accept: "*/*" } });
  return res.blob();
}

/** Faylni yuklab olish (brauzer "Saqlash" oynasi). */
export async function downloadFile(fileId: string, name: string) {
  const blob = await fetchFileBlob(fileId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Faylni yangi tabda ochish (PDF, rasm). */
export async function openFile(fileId: string) {
  const win = window.open("about:blank", "_blank");
  try {
    const blob = await fetchFileBlob(fileId);
    const url = URL.createObjectURL(blob);
    if (win) win.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    win?.close();
    throw e;
  }
}

/**
 * <img>/<audio>/<video> uchun object URL. Blob react-query keshida saqlanadi (bir fayl bir marta yuklanadi).
 *   const { url, loading } = useFileObjectUrl(file?.id);  <audio src={url ?? undefined} controls />
 */
export function useFileObjectUrl(fileId: string | null | undefined) {
  const q = useQuery({
    queryKey: ["file-blob", fileId],
    queryFn: ({ signal }) => fetchFileBlob(fileId as string, signal),
    enabled: !!fileId,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!q.data) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(q.data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [q.data]);
  return { url, loading: q.isLoading, error: q.error as Error | null };
}
