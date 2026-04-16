export interface TrendPoint {
  date: string;
  delivered: number;
  pending: number;
}

export interface TrendResponse {
  trend: TrendPoint[];
}

// Added interfaces from SPEC.md §2

export interface DistributionOrder {
  id: number;
  recipient: string;
  address: string;
  items: string[];
  status: 'pending' | 'delivered';
  created_at: string;
  delivered_at?: string | null;
}

export interface DistributionOrderCreate {
  recipient: string;
  address: string;
  items: string[];
}

export interface DistributionOrderFilter {
  status?: 'pending' | 'delivered';
  recipient?: string;
  date_from?: string;
  date_to?: string;
}

export interface Metric {
  total_orders: number;
  delivered_orders: number;
  pending_orders: number;
  delivery_rate: number;
}
