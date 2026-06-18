import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import DigitalTwin from './pages/DigitalTwin';
import ForecastEngine from './pages/ForecastEngine';
import WhatIfSimulator from './pages/WhatIfSimulator';
import ResourceOptimizer from './pages/ResourceOptimizer';
import Copilot from './pages/Copilot';
import Insights from './pages/Insights';
import AlertCenter from './pages/AlertCenter';
import Reports from './pages/Reports';
import Events from './pages/Events';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/map" element={<DigitalTwin />} />
        <Route path="/events" element={<Events />} />
        <Route path="/forecast" element={<ForecastEngine />} />
        <Route path="/simulator" element={<WhatIfSimulator />} />
        <Route path="/resources" element={<ResourceOptimizer />} />
        <Route path="/copilot" element={<Copilot />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/alerts" element={<AlertCenter />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Layout>
  );
}
