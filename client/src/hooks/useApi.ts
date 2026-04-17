import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Generic data-fetching hook.
 * Calls `fetcher` on mount and whenever `deps` change.
 * Returns { data, loading, error, reload }.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: any[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "An error occurred");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return { data, loading, error, reload: load };
}

/**
 * Paginated data-fetching hook.
 * Returns page/setPage in addition to standard useApi fields.
 */
export function usePaginatedApi<T>(
  fetcher: (page: number, filters: Record<string, string>) => Promise<T>,
  filters: Record<string, string> = {},
  initialPage = 1
) {
  const [page, setPage] = useState(initialPage);
  const filterKey = JSON.stringify(filters);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const result = useApi<T>(
    () => fetcher(page, filters),
    [page, filterKey]
  );

  return { ...result, page, setPage };
}
