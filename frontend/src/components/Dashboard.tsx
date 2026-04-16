import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMetrics as getMetricsApi } from '../api/metrics';
import { getTrends as getTrendsApi } from '../api/trends';
import { getOrders, createOrder } from '../api/orders';
import { Metric, TrendResponse, DistributionOrder, DistributionOrderCreate } from '../types';
import { formatDateTime } from '../utils/date';

/**
 * MetricCards Component - Displays summary metric cards
 * Shows total orders, total quantity, delivered orders, and pending orders
 */
function MetricCards({ metrics, isLoading }: { metrics: Metric | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="metrics-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="metric-card loading">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-value"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return <div className="metric-error">No hay datos disponibles</div>;
  }

  const cards = [
    { title: 'Total de Órdenes', value: metrics.total_orders, icon: '📦', color: '#3b82f6' },
    { title: 'Cantidad Total', value: metrics.total_quantity, icon: '📊', color: '#8b5cf6' },
    { title: 'Órdenes Entregadas', value: metrics.delivered_orders, icon: '✅', color: '#10b981' },
    { title: 'Órdenes Pendientes', value: metrics.pending_orders, icon: '⏳', color: '#f59e0b' },
  ];

  return (
    <div className="metrics-grid">
      {cards.map((card, index) => (
        <div key={index} className="metric-card" style={{ borderLeftColor: card.color }}>
          <div className="metric-icon">{card.icon}</div>
          <div className="metric-content">
            <h3 className="metric-title">{card.title}</h3>
            <p className="metric-value">{card.value.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * TrendChart Component - Displays trend visualization
 * Shows delivered and pending orders over time
 */
function TrendChart({ trends, isLoading }: { trends: TrendResponse | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="chart-container loading">
        <div className="skeleton chart-skeleton"></div>
      </div>
    );
  }

  if (!trends || trends.trend.length === 0) {
    return <div className="chart-container empty">No hay datos de tendencias disponibles</div>;
  }

  const maxValue = Math.max(
    ...trends.trend.map((t) => Math.max(t.delivered, t.pending))
  );

  return (
    <div className="chart-container">
      <h2 className="chart-title">Tendencias de Distribución</h2>
      <div className="chart-wrapper">
        <div className="chart-y-axis">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <span key={ratio} className="y-label">
              {Math.round(maxValue * ratio)}
            </span>
          ))}
        </div>
        <div className="chart-bars">
          {trends.trend.map((point, index) => (
            <div key={index} className="bar-group">
              <div className="bars-container">
                <div
                  className="bar delivered"
                  style={{ height: `${(point.delivered / maxValue) * 100}%` }}
                  title={`Entregadas: ${point.delivered}`}
                />
                <div
                  className="bar pending"
                  style={{ height: `${(point.pending / maxValue) * 100}%` }}
                  title={`Pendientes: ${point.pending}`}
                />
              </div>
              <span className="bar-label">{point.date}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-color delivered"></span>
          Entregadas
        </span>
        <span className="legend-item">
          <span className="legend-color pending"></span>
          Pendientes
        </span>
      </div>
    </div>
  );
}

/**
 * OrderList Component - Displays orders table with filtering
 */
function OrderList({
  orders,
  isLoading,
  onDelete,
}: {
  orders: DistributionOrder[] | undefined;
  isLoading: boolean;
  onDelete: (id: number) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredOrders = orders?.filter((order) => {
    const matchesStatus = !filterStatus || order.status === filterStatus;
    const matchesSearch =
      !searchTerm ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.destination.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      pending: 'status-pending',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
    };
    return `status-badge ${statusClasses[status] || 'status-default'}`;
  };

  if (isLoading) {
    return (
      <div className="orders-container">
        <div className="skeleton table-skeleton"></div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2 className="orders-title">Órdenes de Distribución</h2>
        <div className="orders-filters">
          <input
            type="text"
            placeholder="Buscar órdenes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {filteredOrders && filteredOrders.length > 0 ? (
        <div className="table-responsive">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Número de Orden</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Destino</th>
                <th>Estado</th>
                <th>Enviado</th>
                <th>Entregado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="order-number">{order.order_number}</td>
                  <td>{order.product_name}</td>
                  <td className="quantity">{order.quantity.toLocaleString()}</td>
                  <td>{order.destination}</td>
                  <td>
                    <span className={getStatusBadge(order.status)}>
                      {order.status === 'pending' && 'Pendiente'}
                      {order.status === 'shipped' && 'Enviado'}
                      {order.status === 'delivered' && 'Entregado'}
                      {order.status === 'cancelled' && 'Cancelado'}
                    </span>
                  </td>
                  <td className="date">{formatDateTime(order.shipped_at)}</td>
                  <td className="date">{formatDateTime(order.delivered_at)}</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => onDelete(order.id)}
                      title="Eliminar orden"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>No se encontraron órdenes</p>
        </div>
      )}
    </div>
  );
}

/**
 * OrderForm Component - Form to create new distribution orders
 */
function OrderForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<DistributionOrderCreate>({
    order_number: '',
    product_name: '',
    quantity: 0,
    destination: '',
    status: 'pending',
    shipped_at: null,
    delivered_at: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
      setIsOpen(false);
      setFormData({
        order_number: '',
        product_name: '',
        quantity: 0,
        destination: '',
        status: 'pending',
        shipped_at: null,
        delivered_at: null,
      });
      setErrors({});
      onSuccess();
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message || 'Error al crear la orden' });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.order_number.trim()) {
      newErrors.order_number = 'El número de orden es requerido';
    }
    if (!formData.product_name.trim()) {
      newErrors.product_name = 'El nombre del producto es requerido';
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }
    if (!formData.destination.trim()) {
      newErrors.destination = 'El destino es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) {
    return (
      <button className="btn-open-form" onClick={() => setIsOpen(true)}>
        + Nueva Orden
      </button>
    );
  }

  return (
    <div className="form-overlay">
      <div className="order-form-container">
        <div className="form-header">
          <h2>Nueva Orden de Distribución</h2>
          <button className="btn-close" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-group">
            <label htmlFor="order_number">Número de Orden *</label>
            <input
              type="text"
              id="order_number"
              name="order_number"
              value={formData.order_number}
              onChange={handleChange}
              className={`form-input ${errors.order_number ? 'error' : ''}`}
              placeholder="ORD-20240401-001"
            />
            {errors.order_number && (
              <span className="error-message">{errors.order_number}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="product_name">Producto *</label>
            <input
              type="text"
              id="product_name"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              className={`form-input ${errors.product_name ? 'error' : ''}`}
              placeholder="Nombre del producto"
            />
            {errors.product_name && (
              <span className="error-message">{errors.product_name}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Cantidad *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`form-input ${errors.quantity ? 'error' : ''}`}
                min="1"
              />
              {errors.quantity && (
                <span className="error-message">{errors.quantity}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="destination">Destino *</label>
              <input
                type="text"
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className={`form-input ${errors.destination ? 'error' : ''}`}
                placeholder="Ciudad de destino"
              />
              {errors.destination && (
                <span className="error-message">{errors.destination}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">Estado</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-select"
            >
              <option value="pending">Pendiente</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {errors.submit && (
            <div className="form-error">{errors.submit}</div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando...' : 'Crear Orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Dashboard Component - Main dashboard view
 * Combines metrics, trends, orders list, and order creation form
 */
export default function Dashboard() {
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => getMetricsApi(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: trends,
    isLoading: trendsLoading,
    error: trendsError,
  } = useQuery({
    queryKey: ['trends'],
    queryFn: () => getTrendsApi(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
    staleTime: 2 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/orders/${id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        throw new Error('Error al eliminar la orden');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
      setNotification({ type: 'success', message: 'Orden eliminada correctamente' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error: Error) => {
      setNotification({ type: 'error', message: error.message });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOrderCreated = () => {
    setNotification({ type: 'success', message: 'Orden creada correctamente' });
    setTimeout(() => setNotification(null), 3000);
  };

  const isLoading = metricsLoading || trendsLoading || ordersLoading;
  const hasError = metricsError || trendsError || ordersError;

  return (
    <div className="dashboard">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="dashboard-header">
        <h1>Dashboard de Distribución</h1>
        <p className="dashboard-subtitle">
          Monitorea tus métricas, tendencias y órdenes de distribución
        </p>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando datos del dashboard...</p>
        </div>
      ) : hasError ? (
        <div className="error-container">
          <h2>Error al cargar los datos</h2>
          <p>Por favor, verifica que el backend esté funcionando correctamente.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-retry"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <section className="metrics-section">
            <h2 className="section-title">Métricas Resumen</h2>
            <MetricCards metrics={metrics} isLoading={metricsLoading} />
          </section>

          <section className="trends-section">
            <TrendChart trends={trends} isLoading={trendsLoading} />
          </section>

          <section className="orders-section">
            <div className="orders-section-header">
              <OrderList
                orders={orders}
                isLoading={ordersLoading}
                onDelete={handleDelete}
              />
              <OrderForm onSuccess={handleOrderCreated} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
