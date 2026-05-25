import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic hook for API calls with loading/error state.
 * @param {Function} apiFn - The API function to call
 * @param {Array}    deps  - Dependencies that trigger a re-fetch (default: fetch once on mount)
 * @param {boolean}  immediate - Whether to call on mount (default: true)
 */
export function useApi(apiFn, deps = [], immediate = true) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError]     = useState(null);
  const mountedRef            = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn(...args);
      const result   = response.data?.data ?? response.data;
      if (mountedRef.current) setData(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? 'Erreur serveur';
      if (mountedRef.current) setError(msg);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [apiFn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (immediate) execute();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, execute, setData };
}

/**
 * Hook for mutations (POST/PUT/DELETE) without auto-fetch.
 */
export function useMutation(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn(...args);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? 'Erreur serveur';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { mutate, loading, error };
}
