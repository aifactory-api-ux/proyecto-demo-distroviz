
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendResponse } from '../types';
import { formatChartDate } from '../utils/date';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * TrendChart Component - Displays trend data as a line chart
 * 
 * Visualizes delivered and pending orders over time using Chart.js.
 * Supports showing historical trend data with date-based x-axis.
 * 
 * @param trendData - TrendResponse containing trend data points
 * @param isLoading - Boolean flag indicating if data is being fetched
 */
export default function TrendChart({
  trendData,
  isLoading,
}: {
  trendData: TrendResponse | undefined;
  isLoading: boolean;
}) {
  // Loading state
  if (isLoading) {
    return (
      <div className="trend-chart-container">
        <div className="trend-chart-header">
          <h2 className="trend-chart-title">Tendencia de Órdenes</h2>
        </div>
        <div className="trend-chart-skeleton">
          <div className="skeleton skeleton-chart"></div>
          <div className="skeleton-legend-container">
            <div className="skeleton skeleton-legend"></div>
            <div className="skeleton skeleton-legend"></div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!trendData || !trendData.trend || trendData.trend.length === 0) {
    return (
      <div className="trend-chart-container">
        <div className="trend-chart-header">
          <h2 className="trend-chart-title">Tendencia de Órdenes</h2>
        </div>
        <div className="trend-chart-empty">
          <p>No hay datos de tendencia disponibles</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const labels = trendData.trend.map((point) => formatChartDate(point.date));
  const deliveredData = trendData.trend.map((point) => point.delivered);
  const pendingData = trendData.trend.map((point) => point.pending);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Entregadas',
        data: deliveredData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: 'Pendientes',
        data: pendingData,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: "'system-ui', 'Segoe UI', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          family: "'system-ui', 'Segoe UI', sans-serif",
        },
        bodyFont: {
          size: 13,
          family: "'system-ui', 'Segoe UI', sans-serif",
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            const label = context.dataset.label || '';
            return `${label}: ${context.parsed.y} órdenes`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            family: "'system-ui', 'Segoe UI', sans-serif",
          },
          color: '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
            family: "'system-ui', 'Segoe UI', sans-serif",
          },
          color: '#6b7280',
          precision: 0,
        },
        title: {
          display: true,
          text: 'Número de Órdenes',
          font: {
            size: 12,
            family: "'system-ui', 'Segoe UI', sans-serif",
          },
          color: '#6b7280',
        },
      },
    },
  };

  return (
    <div className="trend-chart-container">
      <div className="trend-chart-header">
        <h2 className="trend-chart-title">Tendencia de Órdenes</h2>
        <p className="trend-chart-subtitle">
          Evolución de órdenes entregadas vs pendientes
        </p>
      </div>
      <div className="trend-chart-wrapper">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
