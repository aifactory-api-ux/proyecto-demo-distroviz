/**
 * React Query hook for fetching trend data from the DistroViz API
 * Provides loading, error, and data states for trend visualization
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { TrendResponse, TrendPoint } from '../types';
import { getTrends, TrendQueryParams } from '../api/trends';

/**
 * Query key factory for trend-related queries
 * Enables easy cache invalidation and query management
 */
export const trendKeys = {
  all: ['trends'] as const,
  lists: () => [...trendKeys.all, 'list'] as const,
  list: (filters: TrendQueryParams) => [...trendKeys.lists(), filters] as const,
  details: () => [...trendKeys.all, 'detail'] as const,
  detail: (id: number) => [...trendKeys.details(), id] as const,
};

/**
 * Hook configuration options for useTrends
 */
export interface UseTrendsOptions {
  fromDate?: string;
  toDate?: string;
  enabled?: boolean;
  staleTime?: number;
  retry?: number | boolean;
}

/**
 * Custom hook for fetching trend data
 * 
 * @param options - Configuration options for the query
 * @returns React Query result object with trend data and states
 * 
 * @example
 * const { data, isLoading, isError, error, refetch } = useTrends({
 *   fromDate: '2024-01-01',
 *   toDate: '2024-12-31',
 *   staleTime: 300000,
 * });
 */
export function useTrends(options: UseTrendsOptions = {}): UseQueryResult<TrendResponse, Error> {
  const {
    fromDate,
    toDate,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    retry = 3,
  } = options;

  // Build query parameters object
  const params: GetTrendsParams = {};
  if (fromDate) {
    params.from_date = fromDate;
  }
  if (toDate) {
    params.to_date = toDate;
  }

  return useQuery<TrendResponse, Error>({
    queryKey: trendKeys.list(params),
    queryFn: () => getTrends(params),
    enabled,
    staleTime,
    retry,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook for fetching trend data for the last N days
 * 
 * @param days - Number of days to look back (default: 30)
 * @param options - Additional query options
 * @returns React Query result object
 * 
 * @example
 * const { data, isLoading } = useTrendsLastDays(7);
 */
export function useTrendsLastDays(
  days: number = 30,
  options: Omit<UseTrendsOptions, 'fromDate' | 'toDate'> = {}
): UseQueryResult<TrendResponse, Error> {
  const toDate = new Date().toISOString().split('T')[0];
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return useTrends({
    fromDate,
    toDate,
    ...options,
  });
}

/**
 * Hook for calculating aggregated trend statistics
 * 
 * @param trends - Array of trend points
 * @returns Object with aggregated statistics
 * 
 * @example
 * const stats = useTrendStats(data?.trend);
 * // Returns: { totalDelivered, totalPending, avgDeliveredPerDay, avgPendingPerDay }
 */
export function useTrendStats(trends: TrendPoint[] | undefined) {
  if (!trends || trends.length === 0) {
    return {
      totalDelivered: 0,
      totalPending: 0,
      avgDeliveredPerDay: 0,
      avgPendingPerDay: 0,
      trendLength: 0,
    };
  }

  const totalDelivered = trends.reduce((sum, point) => sum + point.delivered, 0);
  const totalPending = trends.reduce((sum, point) => sum + point.pending, 0);
  const trendLength = trends.length;

  return {
    totalDelivered,
    totalPending,
    avgDeliveredPerDay: Math.round(totalDelivered / trendLength),
    avgPendingPerDay: Math.round(totalPending / trendLength),
    trendLength,
  };
}

/**
 * Hook for extracting chart-ready data from trends
 * Useful for passing data to charting libraries
 * 
 * @param trends - Array of trend points
 * @returns Object with separate arrays for labels and datasets
 * 
 * @example
 * const chartData = useTrendChartData(data?.trend);
 * // Returns: { labels: ['2024-01-01', ...], deliveredData: [10, ...], pendingData: [5, ...] }
 */
export function useTrendChartData(trends: TrendPoint[] | undefined) {
  if (!trends || trends.length === 0) {
    return {
      labels: [] as string[],
      deliveredData: [] as number[],
      pendingData: [] as number[],
    };
  }

  const labels = trends.map((point) => point.date);
  const deliveredData = trends.map((point) => point.delivered);
  const pendingData = trends.map((point) => point.pending);

  return {
    labels,
    deliveredData,
    pendingData,
  };
}

/**
 * Hook for getting the latest trend data point
 * Useful for displaying "current status" information
 * 
 * @param trends - Array of trend points
 * @returns Latest trend point or null
 * 
 * @example
 * const latestTrend = useLatestTrend(data?.trend);
 */
export function useLatestTrend(trends: TrendPoint[] | undefined): TrendPoint | null {
  if (!trends || trends.length === 0) {
    return null;
  }

  // Find the most recent date
  return trends.reduce((latest, current) => {
    const latestDate = new Date(latest.date);
    const currentDate = new Date(current.date);
    return currentDate > latestDate ? current : latest;
  });
}

export default useTrends;
