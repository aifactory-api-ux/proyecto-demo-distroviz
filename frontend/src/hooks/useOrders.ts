/**
 * useOrders Hook - React Query hook for managing distribution orders
 * 
 * Provides comprehensive order management including:
 * - Fetching orders with optional filters and pagination
 * - Creating new orders
 * - Updating existing orders
 * - Deleting orders
 * - Automatic cache invalidation and refetching
 * 
 * Uses React Query for caching, error handling, and loading states.
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrders,
  getOrder as getOrderById,
  createOrder as apiCreateOrder,
  updateOrder as apiUpdateOrder,
  deleteOrder as apiDeleteOrder,
} from '../api/orders';
import {
  DistributionOrder,
  DistributionOrderCreate,
  DistributionOrderFilter,
} from '../types';

// Default pagination settings
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Pagination state interface
 */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Order hook return type
 */
export interface UseOrdersReturn {
  // Data
  orders: DistributionOrder[] | undefined;
  selectedOrder: DistributionOrder | undefined;
  
  // Pagination
  pagination: PaginationState;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  
  // Filters
  filters: DistributionOrderFilter;
  setFilters: (filters: DistributionOrderFilter) => void;
  clearFilters: () => void;
  
  // Query states
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  
  // Mutations
  createOrder: (order: DistributionOrderCreate) => Promise<DistributionOrder | undefined>;
  updateOrder: (id: number, order: DistributionOrderCreate) => Promise<DistributionOrder | undefined>;
  deleteOrder: (id: number) => Promise<boolean>;
  
  // Actions
  refetch: () => void;
  selectOrder: (id: number) => void;
  clearSelectedOrder: () => void;
}

/**
 * useOrders Hook - Main hook for order management
 * 
 * @param initialFilters - Optional initial filters for fetching orders
 * @param initialPage - Optional initial page number (default: 1)
 * @param initialLimit - Optional initial limit per page (default: 10)
 * 
 * @returns Object containing orders data, pagination, filters, and CRUD functions
 */
export function useOrders(
  initialFilters?: DistributionOrderFilter,
  initialPage: number = DEFAULT_PAGE,
  initialLimit: number = DEFAULT_LIMIT
): UseOrdersReturn {
  const queryClient = useQueryClient();
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: Math.min(initialLimit, MAX_LIMIT),
    total: 0,
    totalPages: 0,
  });
  
  // Filters state
  const [filters, setFilters] = useState<DistributionOrderFilter>(() => initialFilters || {});
  
  // Selected order for viewing/editing
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  // Build query key with filters and pagination
  const ordersQueryKey = useMemo(
    () => ['orders', { ...filters, page: pagination.page, limit: pagination.limit }] as const,
    [filters, pagination.page, pagination.limit]
  );
  
  // Fetch orders query
  const ordersQuery = useQuery({
    queryKey: ordersQueryKey,
    queryFn: async () => {
      // getOrders does not support pagination in the provided API, so we ignore page/limit here
      // If backend supports pagination, pass pagination.page, pagination.limit
      // For now, just fetch all and simulate pagination client-side
      const data = await getOrders(filters);
      // Simulate headers for total count
      const total = data.length;
      const totalPages = Math.ceil(total / pagination.limit);
      setPagination(prev => ({
        ...prev,
        total,
        totalPages,
      }));
      // Simulate paginated data
      const start = (pagination.page - 1) * pagination.limit;
      const paginatedData = data.slice(start, start + pagination.limit);
      return paginatedData;
    },
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true, // Keep previous data while fetching new page
  });
  
  // Fetch single order by ID
  const selectedOrderQuery = useQuery({
    queryKey: ['order', selectedOrderId] as const,
    queryFn: async () => {
      if (!selectedOrderId) return undefined;
      return getOrderById(selectedOrderId);
    },
    enabled: !!selectedOrderId, // Only fetch when ID is provided
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (newOrder: DistributionOrderCreate) => {
      return apiCreateOrder(newOrder);
    },
    onSuccess: () => {
      // Invalidate orders cache to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Also invalidate metrics as order counts may have changed
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    },
  });
  
  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, order }: { id: number; order: DistributionOrderCreate }) => {
      return apiUpdateOrder(id, order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    },
  });
  
  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiDeleteOrder(id);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    },
  });

  // Pagination setters
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);
  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit: Math.min(limit, MAX_LIMIT), page: 1 }));
  }, []);

  // Filters setters
  const setFiltersFn = useCallback((newFilters: DistributionOrderFilter) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Select order
  const selectOrder = useCallback((id: number) => {
    setSelectedOrderId(id);
  }, []);
  const clearSelectedOrder = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  // Mutations
  const createOrder = useCallback(async (order: DistributionOrderCreate) => {
    return createOrderMutation.mutateAsync(order);
  }, [createOrderMutation]);

  const updateOrder = useCallback(async (id: number, order: DistributionOrderCreate) => {
    return updateOrderMutation.mutateAsync({ id, order });
  }, [updateOrderMutation]);

  const deleteOrder = useCallback(async (id: number) => {
    return deleteOrderMutation.mutateAsync(id);
  }, [deleteOrderMutation]);

  // Refetch
  const refetch = useCallback(() => {
    ordersQuery.refetch();
    selectedOrderQuery.refetch();
  }, [ordersQuery, selectedOrderQuery]);

  return {
    orders: ordersQuery.data,
    selectedOrder: selectedOrderQuery.data,
    pagination,
    setPage,
    setLimit,
    filters,
    setFilters: setFiltersFn,
    clearFilters,
    isLoading: ordersQuery.isLoading,
    isFetching: ordersQuery.isFetching,
    isError: ordersQuery.isError,
    error: ordersQuery.error ?? null,
    createOrder,
    updateOrder,
    deleteOrder,
    refetch,
    selectOrder,
    clearSelectedOrder,
  };
}
