import {
  MutationCache,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError, type QueryParams } from "./api";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** true bo'lsa global xato toast'i chiqmaydi (xato forma ichida ko'rsatiladi). */
      silentError?: boolean;
    };
  }
}

/** Xatoni toast qilib ko'rsatadi (ApiError xabari o'zbekcha keladi). */
export function toastError(e: unknown, fallback = "Xatolik yuz berdi") {
  const message = e instanceof ApiError ? e.message : e instanceof Error && e.message ? e.message : fallback;
  toast.error(message);
}

export const toastSuccess = (message: string) => toast.success(message);

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (mutation.options.meta?.silentError) return;
      toastError(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 4xx xatolarni qayta urinmaymiz; tarmoq/5xx — 1 marta.
      retry: (count, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return count < 1;
      },
    },
  },
});

type ApiQueryOptions<T> = Omit<UseQueryOptions<T, Error, T, QueryKey>, "queryKey" | "queryFn" | "enabled"> & {
  params?: QueryParams;
  enabled?: boolean;
};

/**
 * GET so'rov uchun qisqa hook. `path` null bo'lsa so'rov yuborilmaydi.
 *   const { data, isLoading } = useApiQuery<Group[]>(["teacher", "groups"], "/teacher/groups");
 *   useApiQuery<Paginated<Student>>(["admin", "students"], "/admin/students", { params: { page, q } });
 * `params` avtomatik ravishda queryKey oxiriga qo'shiladi.
 */
export function useApiQuery<T>(key: QueryKey, path: string | null, options: ApiQueryOptions<T> = {}) {
  const { params, enabled = true, ...rest } = options;
  return useQuery<T, Error, T, QueryKey>({
    queryKey: params ? [...key, params] : key,
    queryFn: ({ signal }) => api.get<T>(path as string, { signal, params }),
    enabled: path != null && enabled,
    ...rest,
  });
}

type ApiMutationOptions<TData, TVars> = Omit<UseMutationOptions<TData, Error, TVars>, "mutationFn"> & {
  /** Muvaffaqiyatdan keyin yangilanadigan query kalitlari (prefiks bo'yicha). */
  invalidate?: QueryKey[];
  /** Muvaffaqiyat toast'i. */
  success?: string | ((data: TData, vars: TVars) => string);
  /** Global xato toast'ini o'chirish (xatoni o'zingiz ko'rsatasiz). */
  silentError?: boolean;
};

/**
 * O'zgartiruvchi so'rov. Xato bo'lsa avtomatik toast (silentError bilan o'chiriladi).
 *   const save = useApiMutation((body: NewGroup) => api.post<Group>("/admin/groups", body), {
 *     invalidate: [["admin", "groups"]], success: "Guruh yaratildi",
 *   });
 *   save.mutate(form);  // yoki await save.mutateAsync(form)
 */
export function useApiMutation<TData = unknown, TVars = void>(
  mutationFn: (vars: TVars) => Promise<TData>,
  options: ApiMutationOptions<TData, TVars> = {},
) {
  const qc = useQueryClient();
  const { invalidate, success, silentError, onSuccess, meta, ...rest } = options;
  return useMutation<TData, Error, TVars>({
    mutationFn,
    meta: { ...meta, silentError },
    onSuccess: async (...args) => {
      const [data, vars] = args;
      if (invalidate?.length) await Promise.all(invalidate.map((queryKey) => qc.invalidateQueries({ queryKey })));
      if (success) toast.success(typeof success === "function" ? success(data, vars) : success);
      return onSuccess?.(...args);
    },
    ...rest,
  });
}
