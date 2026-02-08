/**
 * Shared hooks for fetching and caching Flyway data
 * Eliminates duplicate API calls across widgets
 */

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../apiClient';

// In-memory cache with timestamps
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Retry a fetch operation with exponential backoff
 */
async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1)));
    return fetchWithRetry(fetcher, retries - 1);
  }
}

/**
 * Generic cached data fetcher
 */
function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  cacheDuration: number = CACHE_DURATION
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Check cache first
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await fetchWithRetry(fetcher);
      
      // Update cache
      cache.set(key, { data: result, timestamp: Date.now() });
      
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error(`Error fetching ${key}:`, err);
      setError(err.message || `Failed to load ${key}`);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, cacheDuration]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook to fetch migration history (shared across multiple widgets)
 */
export function useMigrationHistory() {
  return useCachedData(
    'migration-history',
    () => apiGet<any[]>('/api/flyway/history/all'),
    30000 // Cache for 30 seconds
  );
}

/**
 * Hook to fetch user-defined metrics (baseline/non-Flyway)
 */
export function useUserMetrics() {
  return useCachedData(
    'user-metrics',
    () => apiGet<any>('/api/user-defined-metrics'),
    60000 // Cache for 1 minute (changes less frequently)
  );
}

/**
 * Hook to fetch lead times
 */
export function useLeadTimes() {
  return useCachedData(
    'lead-times',
    () => apiGet<any>('/api/metrics/lead-times'),
    30000
  );
}

/**
 * Hook to fetch deployments per quarter
 */
export function useDeploymentsPerQuarter() {
  return useCachedData(
    'deployments-per-quarter',
    () => apiGet<any>('/api/metrics/deployments-per-quarter'),
    30000
  );
}

/**
 * Hook to fetch lead time history
 */
export function useLeadTimeHistory() {
  return useCachedData(
    'lead-time-history',
    () => apiGet<any>('/api/metrics/lead-time-history/refresh'),
    30000
  );
}

/**
 * Clear all cached data (useful when user updates metrics)
 */
export function clearDataCache() {
  cache.clear();
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(key: string) {
  cache.delete(key);
}

/**
 * Combined hook for dashboard overview data
 * Fetches all commonly needed data in one hook
 */
export function useDashboardData() {
  const migrations = useMigrationHistory();
  const userMetrics = useUserMetrics();
  const leadTimes = useLeadTimes();
  const deployments = useDeploymentsPerQuarter();

  const loading = migrations.loading || userMetrics.loading || leadTimes.loading || deployments.loading;
  const error = migrations.error || userMetrics.error || leadTimes.error || deployments.error;

  const refetchAll = useCallback(() => {
    migrations.refetch();
    userMetrics.refetch();
    leadTimes.refetch();
    deployments.refetch();
  }, [migrations, userMetrics, leadTimes, deployments]);

  return {
    migrations: migrations.data,
    userMetrics: userMetrics.data,
    leadTimes: leadTimes.data,
    deployments: deployments.data,
    loading,
    error,
    refetchAll
  };
}
