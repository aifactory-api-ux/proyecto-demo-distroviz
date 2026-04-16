import { Metric } from '../types';

/**
 * MetricCards Component - Displays summary metric cards
 * Shows total orders, total quantity, delivered orders, and pending orders
 * Used on the Dashboard page to provide quick KPI visibility
 * 
 * @param metrics - Metric data object containing aggregated order statistics
 * @param isLoading - Boolean flag indicating if data is being fetched
 */
export default function MetricCards({ metrics, isLoading }: { metrics: Metric | undefined; isLoading: boolean }) {
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
