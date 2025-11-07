// client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient global, com defaults seguros para app PWA:
 * - evita refetch ao focar janela
 * - backoff exponencial leve
 * - não tenta quando offline
 * - sem 'p-limit' (evitamos dependência)
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mantém dados "frescos" por 30s
      staleTime: 30_000,
      // Tempo de coleta de cache (garbage collect)
      gcTime: 5 * 60 * 1000,
      // Evita refetch ao focar a aba
      refetchOnWindowFocus: false,
      // Refaz ao reconectar
      refetchOnReconnect: true,
      // Modo online (queries não rodam quando offline)
      networkMode: "online",
      // NÃO duplicar a chave 'retry' — definimos apenas uma vez
      retry(failureCount, _error) {
        // Se estiver offline, não tente
        if (typeof navigator !== "undefined" && !navigator.onLine) return false;
        // Até 2 tentativas no total (1 retry)
        return failureCount < 2;
      },
      // Pequeno backoff exponencial com teto
      retryDelay(attemptIndex) {
        const base = 1000; // 1s
        const delay = base * Math.pow(2, attemptIndex); // 1s, 2s, 4s...
        return Math.min(delay, 10_000); // teto 10s
      },
    },
    mutations: {
      networkMode: "online",
      retry(failureCount, _error) {
        if (typeof navigator !== "undefined" && !navigator.onLine) return false;
        // Mutations são mais delicadas: 1 retry no máx.
        return failureCount < 2;
      },
      retryDelay: 1500,
    },
  },
});
