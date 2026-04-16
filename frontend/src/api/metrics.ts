/**
 * Metrics API client for DistroViz Dashboard
 * Provides functions to fetch dashboard metrics from the backend API
 */

import axios from 'axios';
import { Metric } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Fetch dashboard metrics from the backend
 * Returns aggregated metrics including total orders, quantities, and status counts
 * 
 * @returns Promise resolving to Metric object with aggregated order statistics
 * @throws Error if API request fails or network is unavailable
 */
export async function getMetrics(): Promise<Metric> {
  try {
    const response = await apiClient.get<Metric>('/metrics');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.detail || 'Error fetching metrics';
        throw new Error(`Failed to fetch metrics: ${status} - ${message}`);
      } else if (error.request) {
        // Request made but no response received
        throw new Error('Network error: Unable to reach the metrics API endpoint');
      }
    }
    throw new Error('Unexpected error while fetching metrics');
  }
}

/**
 * Fetch metrics with optional date range filtering
 * 
 * @param fromDate - Optional start date for filtering (ISO date string)
 * @param toDate - Optional end date for filtering (ISO date string)
 * @returns Promise resolving to filtered Metric object
 */
export async function getMetricsByDateRange(
  fromDate?: string,
  toDate?: string
): Promise<Metric> {
  try {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    const queryString = params.toString();
    const url = queryString ? `/api/metrics?${queryString}` : '/api/metrics';
    
    const response = await apiClient.get<Metric>(url);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.detail || 'Error fetching metrics';
        throw new Error(`Failed to fetch metrics: ${status} - ${message}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to reach the metrics API endpoint');
      }
    }
    throw new Error('Unexpected error while fetching metrics');
  }
}

/**
 * Fetch metrics filtered by order status
 * 
 * @param status - Order status to filter by (e.g., 'pending', 'delivered', 'shipped')
 * @returns Promise resolving to status-filtered Metric object
 */
export async function getMetricsByStatus(status: string): Promise<Metric> {
  try {
    const response = await apiClient.get<Metric>(`/api/metrics?status=${encodeURIComponent(status)}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.detail || 'Error fetching metrics';
        throw new Error(`Failed to fetch metrics: ${status} - ${message}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to reach the metrics API endpoint');
      }
    }
    throw new Error('Unexpected error while fetching metrics');
  }
}

/**
 * Check if the metrics API is available
 * 
 * @returns Promise resolving to true if API is reachable, false otherwise
 */
export async function checkMetricsApiHealth(): Promise<boolean> {
  try {
    await apiClient.get('/api/metrics', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export default {
  getMetrics,
  getMetricsByDateRange,
  getMetricsByStatus,
  checkMetricsApiHealth,
};
