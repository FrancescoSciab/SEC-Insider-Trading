import { useState, useEffect, useCallback } from 'react';

/**
 * Generic paginated data hook
 * fetcher: async (page) => { data: [], pagination: { pages, total } }
 */
export function usePaginatedData(fetcher, deps = []) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (pageNum = 1, append = false) => {
    if (loading && pageNum > 1) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(pageNum);
      const newData = result.data || [];
      setData(prev => (append ? [...prev, ...newData] : newData));
      setTotalPages(result.pagination?.pages || 1);
      setTotal(result.pagination?.total || 0);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetcher]);

  useEffect(() => {
    setData([]);
    setPage(1);
    load(1, false);
  }, deps);

  const loadMore = useCallback(() => {
    if (!loading && page < totalPages) {
      load(page + 1, true);
    }
  }, [loading, page, totalPages, load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load(1, false);
  }, [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    page,
    totalPages,
    total,
    loadMore,
    refresh,
    hasMore: page < totalPages,
  };
}
