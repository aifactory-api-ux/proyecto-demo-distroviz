export interface TrendPoint {
  date: string;
  delivered: number;
  pending: number;
}

export interface TrendResponse {
  trend: TrendPoint[];
}

export interface DistributionOrder {
  id: number;
  order_number: string;
  product_name: string;
  quantity: number;
  destination: string;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface DistributionOrderCreate {
  order_number: string;
  product_name: string;
  quantity: number;
  destination: string;
  status: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

export interface DistributionOrderFilter {
  from_date?: string;
  to_date?: string;
  status?: string;
}

export interface Metric {
  total_orders: number;
  total_quantity: number;
  delivered_orders: number;
  pending_orders: number;
}
