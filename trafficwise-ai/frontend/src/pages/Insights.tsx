import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertTriangle, Clock, MapPin, Users } from 'lucide-react';
import { Panel } from '../components/ui/KPICard';
import { getInsights } from '../services/api';
import type { InsightItem } from '../types';

const categoryIcons: Record<string, typeof Lightbulb> = {
  Congestion: MapPin,
  'Junction Risk': AlertTriangle,
  'Event Causes': TrendingUp,
  'Peak Periods': Clock,
  'Road Closures': AlertTriangle,
  'Emerging Risk': AlertTriangle,
  'Resource Utilization': Users,
};

const categoryColors: Record<string, string> = {
  Congestion: 'text-accent-cyan',
  'Junction Risk': 'text-red-400',
  'Event Causes': 'text-purple-400',
  'Peak Periods': 'text-accent-amber',
  'Road Closures': 'text-orange-400',
  'Emerging Risk': 'text-red-400',
  'Resource Utilization': 'text-green-400',
};

export default function Insights() {
  const [insights, setInsights] = useState<InsightItem[]>([]);

  useEffect(() => { getInsights().then(setInsights).catch(console.error); }, []);

  if (!insights.length) return <div className="flex items-center justify-center h-64 text-slate-400">Generating insights...</div>;

  const grouped = insights.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InsightItem[]>);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent-amber" /> Smart Insights Engine
        </h2>
        <p className="text-sm text-slate-400 mt-1">AI-generated operational intelligence and trend analysis</p>
      </motion.div>

      {Object.entries(grouped).map(([category, items]) => {
        const Icon = categoryIcons[category] || Lightbulb;
        const color = categoryColors[category] || 'text-accent-cyan';
        return (
          <div key={category}>
            <h3 className={`section-title mb-3 flex items-center gap-2 ${color}`}>
              <Icon className="w-4 h-4" /> {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }} className="glass-panel-hover p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-white">{item.title}</h4>
                    {item.metric && (
                      <span className="text-xs font-mono text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">{item.metric}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{item.description}</p>
                  {item.trend && (
                    <span className={`inline-block mt-2 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${
                      item.trend === 'rising' || item.trend === 'emerging' || item.trend === 'high'
                        ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-slate-500'
                    }`}>{item.trend}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
