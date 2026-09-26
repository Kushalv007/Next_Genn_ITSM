import { useEffect, useState, useCallback } from 'react';
import { healthApi } from '../services/api.js';

/**
 * Fetches GET /api/health once on mount and exposes { data, loading, error, retry }.
 */
export function useApiHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await healthApi.getHealth();
      setData(res);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Network error';
      setError(new Error(message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    run().finally(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, [run]);

  return { data, loading, error, retry: run };
}

// Placeholder for future hooks (custom hooks go here.
export function usePlaceholder() {
  return null;
}
