// client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

/**
 * Query Client único da aplicação
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // dados não ficam obsoletos tão rápido
      staleTime: 30_000,
      // evita refetch chato ao focar a janela
      refetchOnWindowFocus: false,
      // tenta 1x em erros transitórios de rede/5xx
      retry: (failureCount, error: any) => {
        // Não tenta novamente se estiver offline
        if (typeof navigator !== "undefined" && !navigator.onLine) return false;
        // Evita retry em 4xx
        const status = (error as any)?.status ?? (error as any)?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Base da API:
 * - Se houver VITE_API_URL, usa como prefixo.
 * - Caso contrário, assume endpoints relativos (ex.: "/api/...").
 */
const BASE_URL =
  (import.meta as any)?.env?.VITE_API_URL && (import.meta as any).env.VITE_API_URL !== "undefined"
    ? (import.meta as any).env.VITE_API_URL
    : "";

/**
 * Helper para montar querystring de forma segura
 */
export function toQuery(params?: Record<string, string | number | boolean | null | undefined>) {
  if (!params) return "";
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    s.append(k, String(v));
  }
  const qs = s.toString();
  return qs ? `?${qs}` : "";
}

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
  // opcional: anexar params e deixo o helper montar a querystring
  params?: Record<string, string | number | boolean | null | undefined>;
};

/**
 * apiRequest — wrapper fino em cima de fetch com:
 * - base URL opcional (VITE_API_URL)
 * - JSON por padrão
 * - tratamento de erros com throw contendo status e payload
 */
export async function apiRequest<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const {
    method = "GET",
    headers = {},
    body,
    signal,
    params,
  } = opts;

  // monta URL completa
  let url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  if (params) url += toQuery(params);

  const isJsonBody =
    body !== undefined &&
    body !== null &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer);

  const finalHeaders: Record<string, string> = {
    ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
    ...headers,
  };

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: isJsonBody ? JSON.stringify(body) : (body as BodyInit | undefined),
    signal,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const err: any = new Error(
      (payload && (payload.message || payload.error)) ||
        `Request failed with status ${res.status}`
    );
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return (payload as T) ?? (undefined as T);
}
