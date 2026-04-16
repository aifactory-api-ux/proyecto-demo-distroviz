/**
 * Trends API Client for DistroViz
 * 
 * Provides functions to fetch trend data from the backend API.
 * Uses React Query for data fetching and caching.
 */

import axios from 'axios';
import { TrendResponse } from '../types';

// Get API URL from environment variables (Vite-specific)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('[API] Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('[API] No response received:', error.message);
    } else {
      // Error in setting up request
      console.error('[API] Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Interface for trend query parameters
 */
export interface TrendQueryParams {
  from_date?: string;
  to_date?: string;
}

/**
 * Fetch trend data from the API
 * 
 * Retrieves trend data showing delivered and pending orders
 * over a specified date range.
 * 
 * @param params - Query parameters for filtering trends
 * @returns Promise resolving to TrendResponse
 * @throws Error if the API request fails
 */
export async function getTrends(params?: TrendQueryParams): Promise<TrendResponse> {
  try {
    const response = await apiClient.get<TrendResponse>('/api/trends', {
      params: params,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Handle specific HTTP error codes
        switch (error.response.status) {
          case 400:
            throw new Error('Parámetros de fecha inválidos');
          case 404:
            throw new Error('Datos de tendencias no encontrados');
          case 500:
            throw new Error('Error del servidor al obtener tendencias');
          default:
            throw new Error(`Error al obtener tendencias: ${error.response.status}`);
        }
      } else if (error.request) {
        throw new Error('No se pudo conectar al servidor de tendencias');
      }
    }
    // Re-throw unknown errors
    throw error;
  }
}

/**
 * Fetch trend data for the last N days
 * 
 * @param days - Number of days to look back (default: 30)
 * @returns Promise resolving to TrendResponse
 */
export async function getTrendsForLastDays(days: number = 30): Promise<TrendResponse> {
  const toDate = new Date().toISOString().split('T')[0];
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return getTrends({ from_date: fromDate, to_date: toDate });
}

/**
 * Fetch trend data for current month
 * 
 * @returns Promise resolving to TrendResponse
 */
export async function getTrendsThisMonth(): Promise<TrendResponse> {
  const now = new Date();
  const toDate = now.toISOString().split('T')[0];
  const fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  return getTrends({ from_date: fromDate, to_date: toDate });
}

/**
 * Fetch trend data for current week
 * 
 * @returns Promise resolving to TrendResponse
 */
export async function getTrendsThisWeek(): Promise<TrendResponse> {
  const now = new Date();
  const toDate = now.toISOString().split('T')[0];
  
  // Get start of week (Monday)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() + mondayOffset);
  
  return getTrends({ 
    from_date: fromDate.toISOString().split('T')[0], 
    to_date: toDate 
  });
}

/**
 * Calculate summary statistics from trend data
 * 
 * @param trendData - Trend response data
 * @returns Object with total delivered, total pending, and averages
 */
export function calculateTrendStats(trendData: TrendResponse): {
  totalDelivered: number;
  totalPending: number;
  averageDelivered: number;
  averagePending: number;
} {
  if (!trendData.trend || trendData.trend.length === 0) {
    return {
      totalDelivered: 0,
      totalPending: 0,
      averageDelivered: 0,
      averagePending: 0,
    };
  }

  const totals = trendData.trend.reduce(
    (acc, point) => ({
      delivered: acc.delivered + point.delivered,
      pending: acc.pending + point.pending,
    }),
    { delivered: 0, pending: 0 }
  );

  const count = trendData.trend.length;

  return {
    totalDelivered: totals.delivered,
    totalPending: totals.pending,
    averageDelivered: Math.round((totals.delivered / count) * 100) / 100,
    averagePending: Math.round((totals.pending / count) * 100) / 100,
  };
}

/**
 * Export all API functions
 */
export default {
  getTrends,
  getTrendsForLastDays,
  getTrendsThisMonth,
  getTrendsThisWeek,
  calculateTrendStats,
};
