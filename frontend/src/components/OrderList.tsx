import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, deleteOrder } from '../api/orders';
import { DistributionOrder, DistributionOrderFilter } from '../types';
import { formatTableDate } from '../utils/date';

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  shipped: '#3b82f6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

interface OrderListProps {
  onEdit?: (order: DistributionOrder) => void;
  onCreate?: () => void;
}

/**
 * OrderList Component - Displays distribution orders with filtering, pagination, and actions
 * 
 * Features:
 * - Filter by date range and status
 * - Pagination with configurable page size
 * - Status badges with color coding
 * - Delete action with confirmation
 * - Loading and error states
 * - Responsive table design
 */
export default function OrderList({ onEdit, onCreate }: OrderListProps) {
  const queryClient = useQueryClient();
  
  // Filter state
  const [filters, setFilters] = useState<DistributionOrderFilter>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch orders with filters
  const { data: orders = [], isLoading, error, refetch } = useQuery<DistributionOrder[]>({
    queryKey: ['orders', filters],
    queryFn: () => getOrders(filters),
    staleTime: 5 * 60 * 1000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
    },
  });

  // Filter orders by search term (client-side search)
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(term) ||
        order.product_name.toLowerCase().includes(term) ||
        order.destination.toLowerCase().includes(term)
    );
  }, [orders, searchTerm]);

  // Paginate orders
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof DistributionOrderFilter, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  // Handle delete with confirmation
  const handleDelete = async (order: DistributionOrder) => {
    const confirmed = window.confirm(
      `¿Está seguro de eliminar la orden ${order.order_number}?`
    );
    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(order.id);
      } catch (err) {
        console.error('Error deleting order:', err);
      }
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const color = STATUS_COLORS[status] || '#6b7280';
    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: `${color}20`,
          color: color,
          borderColor: color,
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="order-list-container">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="order-list-container">
        <div className="error-message">
          <p>Error al cargar las órdenes</p>
          <button onClick={() => refetch()} className="btn-retry">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-list-container">
      {/* Header with filters */}
      <div className="order-list-header">
        <h2 className="order-list-title">Órdenes de Distribución</h2>
        
        {/* Search input */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por número, producto o destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Filter controls */}
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="from_date">Desde:</label>
            <input
              type="date"
              id="from_date"
              value={filters.from_date || ''}
              onChange={(e) => handleFilterChange('from_date', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="to_date">Hasta:</label>
            <input
              type="date"
              id="to_date"
              value={filters.to_date || ''}
              onChange={(e) => handleFilterChange('to_date', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="status">Estado:</label>
            <select
              id="status"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setFilters({});
              setSearchTerm('');
            }}
            className="btn-clear"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Orders table */}
      <div className="table-wrapper">
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
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  No se encontraron órdenes
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order.id}>
                  <td className="order-number">{order.order_number}</td>
                  <td>{order.product_name}</td>
                  <td className="quantity">{order.quantity.toLocaleString()}</td>
                  <td>{order.destination}</td>
                  <td>{renderStatusBadge(order.status)}</td>
                  <td className="date-cell">
                    {formatTableDate(order.shipped_at || null)}
                  </td>
                  <td className="date-cell">
                    {formatTableDate(order.delivered_at || null)}
                  </td>
                  <td className="actions-cell">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(order)}
                        className="btn-action btn-edit"
                        title="Editar"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(order)}
                      className="btn-action btn-delete"
                      title="Eliminar"
                      disabled={deleteMutation.isPending}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} de{' '}
            {filteredOrders.length} órdenes
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-pagination"
            >
              Anterior
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`btn-pagination ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-pagination"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
