import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllDatasets } from "@/services/carApi";
import type { SearchHistoryItem } from "@/types/Dataset";
import {
  clearSearchHistory,
  loadSearchHistory,
  pushSearchHistory,
} from "@/utils/searchHistory";
import {
  isValidCarNumber,
  normalizeCarNumber,
} from "@/utils/formatters";
import { getVisibleResults } from "@/utils/export";

export function useCarSearch(initialPlate?: string) {
  const queryClient = useQueryClient();
  const [carNumber, setCarNumber] = useState(initialPlate ?? "");
  const [submittedNumber, setSubmittedNumber] = useState(
    initialPlate && isValidCarNumber(initialPlate)
      ? normalizeCarNumber(initialPlate)
      : "",
  );
  const [history, setHistory] = useState<SearchHistoryItem[]>(() =>
    loadSearchHistory(),
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const query = useQuery({
    queryKey: ["car-search", submittedNumber],
    queryFn: async ({ signal }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Merge React Query signal with our controller
      const onAbort = () => controller.abort();
      signal.addEventListener("abort", onAbort);

      try {
        return await fetchAllDatasets(submittedNumber, controller.signal);
      } finally {
        signal.removeEventListener("abort", onAbort);
      }
    },
    enabled: Boolean(submittedNumber),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const search = useCallback(
    (value?: string) => {
      const raw = value ?? carNumber;
      const normalized = normalizeCarNumber(raw);

      if (!isValidCarNumber(normalized)) {
        setValidationError(
          "Enter a valid Israeli vehicle number (5–8 digits).",
        );
        return;
      }

      setValidationError(null);
      setCarNumber(normalized);
      setSubmittedNumber(normalized);
      setHistory(pushSearchHistory(normalized));

      // Update shareable URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set("plate", normalized);
      window.history.replaceState({}, "", url.toString());
    },
    [carNumber],
  );

  const clearHistory = useCallback(() => {
    clearSearchHistory();
    setHistory([]);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    queryClient.cancelQueries({ queryKey: ["car-search", submittedNumber] });
  }, [queryClient, submittedNumber]);

  // Sync from URL on mount / back-forward
  useEffect(() => {
    const onPop = () => {
      const plate = new URLSearchParams(window.location.search).get("plate");
      if (plate && isValidCarNumber(plate)) {
        const n = normalizeCarNumber(plate);
        setCarNumber(n);
        setSubmittedNumber(n);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const visible = useMemo(
    () => getVisibleResults(query.data),
    [query.data],
  );

  return {
    carNumber,
    setCarNumber,
    submittedNumber,
    search,
    cancel,
    history,
    clearHistory,
    validationError,
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    data: query.data,
    successResults: visible.success,
    errorResults: visible.errors,
    hasSearched: Boolean(submittedNumber),
  };
}
