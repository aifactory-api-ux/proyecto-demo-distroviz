import Dashboard from './components/Dashboard';

/**
 * App Component - Root component for DistroViz Dashboard
 */
export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">DistroViz</h1>
        </div>
      </header>
      
      <main className="app-main">
        <Dashboard />
      </main>
      
      <footer className="app-footer">
        <p>© 2024 DistroViz - Dashboard de Distribución</p>
      </footer>
    </div>
  );
}
