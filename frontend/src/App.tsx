import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Dashboard from './components/Dashboard';
import { getMetrics } from './api/metrics';
import { getTrends } from './api/trends';
import { getOrders } from './api/orders';
import { TrendResponse, Metric } from './types';

/**
 * App Component - Root component for DistroViz Dashboard
 * 
 * Sets up routing and provides global data fetching context.
 * All route handlers are wrapped with React Query for automatic
 * caching and state management.
 */
export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">DistroViz</h1>
          <nav className="app-nav">
            <a href="/" className="nav-link active">Dashboard</a>
            <a href="/orders" className="nav-link">Órdenes</a>
            <a href="/metrics" className="nav-link">Métricas</a>
          </nav>
        </div>
      </header>
      
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Dashboard />} />
          <Route path="/metrics" element={<Dashboard />} />
        </Routes>
      </main>
      
      <footer className="app-footer">
        <p>© 2024 DistroViz - Dashboard de Distribución</p>
      </footer>
    </div>
  );
}
