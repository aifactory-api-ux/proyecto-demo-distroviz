/**
 * Orders API Client for DistroViz Dashboard
 * 
 * Provides HTTP client functions for all order-related API endpoints.
 * Uses Vite environment variable for API base URL and handles all
 * error responses with proper TypeScript types.
 */

import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type {
  DistributionOrder,
  DistributionOrderCreate,
  DistributionOrderFilter,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Type for API error response
 */
interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

/**
 * Type for delete success response
 */
interface DeleteSuccessResponse {
  success: boolean;
}

/**
 * Build query string from filter options
 * 
 * @param filter - Filter options for orders
 * @returns URLSearchParams with filter parameters
 */
function buildFilterParams(filter?: DistributionOrderFilter): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filter) {
    if (filter.from_date) {
      params.append('from_date', filter.from_date);
    }
    if (filter.to_date) {
      params.append('to_date', filter.to_date);
    }
    if (filter.status) {
      params.append('status', filter.status);
    }
  }
  
  return params;
}

/**
 * Get all distribution orders with optional filtering
 * 
 * @param filter - Optional filter parameters (from_date, to_date, status)
 * @returns Promise resolving to array of DistributionOrder
 * @throws AxiosError with error details if request fails
 */
export async function getOrders(
  filter?: DistributionOrderFilter
): Promise<DistributionOrder[]> {
  try {
    const params = buildFilterParams(filter);
    const config: AxiosRequestConfig = {};
    
    if (params.toString()) {
      config.params = Object.fromEntries(params);
    }
    
    const response = await apiClient.get<DistributionOrder[]>(
      '/orders',
      config
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.detail 
        || axiosError.response?.data?.message 
        || axiosError.message;
      throw new Error(`Error fetching orders: ${message}`);
    }
    throw error;
  }
}

/**
 * Get a single distribution order by ID
 * 
 * @param id - Order ID to retrieve
 * @returns Promise resolving to DistributionOrder
 * @throws AxiosError with error details if order not found or request fails
 */
export async function getOrder(id: number): Promise<DistributionOrder> {
  try {
    const response = await apiClient.get<DistributionOrder>(`/orders/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.status === 404) {
        throw new Error('Order not found');
      }
      const message = axiosError.response?.data?.detail 
        || axiosError.response?.data?.message 
        || axiosError.message;
      throw new Error(`Error fetching order: ${message}`);
    }
    throw error;
  }
}

/**
 * Create a new distribution order
 * 
 * @param order - Order data for creation
 * @returns Promise resolving to created DistributionOrder
 * @throws AxiosError with validation or server error details
 */
export async function createOrder(
  order: DistributionOrderCreate
): Promise<DistributionOrder> {
  try {
    const response = await apiClient.post<DistributionOrder>(
      '/orders',
      order
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.detail 
        || axiosError.response?.data?.message 
        || axiosError.message;
      throw new Error(`Error creating order: ${message}`);
    }
    throw error;
  }
}

/**
 * Update an existing distribution order
 * 
 * @param id - Order ID to update
 * @param order - Updated order data
 * @returns Promise resolving to updated DistributionOrder
 * @throws AxiosError with validation or server error details
 */
export async function updateOrder(
  id: number,
  order: DistributionOrderCreate
): Promise<DistributionOrder> {
  try {
    const response = await apiClient.put<DistributionOrder>(
      `/orders/${id}`,
      order
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.status === 404) {
        throw new Error('Order not found');
      }
      const message = axiosError.response?.data?.detail 
        || axiosError.response?.data?.message 
        || axiosError.message;
      throw new Error(`Error updating order: ${message}`);
    }
    throw error;
  }
}

/**
 * Delete a distribution order
 * 
 * @param id - Order ID to delete
 * @returns Promise resolving to success response
 * @throws AxiosError with error details if deletion fails
 */
export async function deleteOrder(id: number): Promise<DeleteSuccessResponse> {
  try {
    const response = await apiClient.delete<DeleteSuccessResponse>(
      `/orders/${id}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.status === 404) {
        throw new Error('Order not found');
      }
      const message = axiosError.response?.data?.detail 
        || axiosError.response?.data?.message 
        || axiosError.message;
      throw new Error(`Error deleting order: ${message}`);
    }
    throw error;
  }
}

export default {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
};
