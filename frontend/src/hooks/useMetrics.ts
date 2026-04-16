import { useQuery } from '@tanstack/react-query';
import { getMetrics } from '../api/metrics';
import { Metric } from '../types';

/**
 * useMetrics Hook - Custom hook for fetching and managing metrics data
 * 
 * Provides reactive metrics data from the backend API with automatic
 * caching, loading states, and error handling via React Query.
 * 
 * @returns React Query result object containing:
 *   - data: Metric object with aggregated order statistics
 *   - isLoading: Boolean indicating if data is being fetched
 *   - isError: Boolean indicating if an error occurred
 *   - error: Error object if isError is true
 *   - refetch: Function to manually refetch metrics data
 *   - isFetching: Boolean indicating if a fetch is in progress (including background refetches)
 *   - isSuccess: Boolean indicating if data was successfully fetched
 * 
 * @example
 * const { data, isLoading, error, refetch } = useMetrics();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * 
 * return (
 *   <div>
 *     <p>Total Orders: {data.total_orders}</p>
 *     <button onClick={refetch}>Refresh</button>
 *   </div>
 * );
 */
export function useMetrics() {
  return useQuery<Metric, Error>({
    queryKey: ['metrics'],
    queryFn: getMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes - metrics don't change frequently
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
