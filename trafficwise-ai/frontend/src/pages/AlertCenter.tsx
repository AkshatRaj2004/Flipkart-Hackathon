import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle } from 'lucide-react';
import { Panel, SeverityBadge } from '../components/ui/KPICard';
import { getAlerts } from '../services/api';
import type { AlertItem } from '../types';

export default function AlertCenter() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { getAlerts().then(setAlerts).catch(console.error); }, []);

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);
  const counts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-400" /> AI Alert Center
        </h2>
        <p className="text-sm text-slate-400 mt-1">Automated alerts with severity levels and recommended actions</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Critical', count: counts.critical, color: 'border-red-500/30 bg-red-500/10' },
          { label: 'High', count: counts.high, color: 'border-orange-500/30 bg-orange-500/10' },
          { label: 'Medium', count: counts.medium, color: 'border-amber-500/30 bg-amber-500/10' },
        ].map(s => (
          <button key={s.label} onClick={() => setFilter(s.label.toLowerCase())}
            className={`glass-panel p-4 border ${s.color} transition-all hover:scale-[1.02]`}>
            <p className="text-3xl font-bold text-white">{s.count}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">{s.label} Alerts</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {['all', 'critical', 'high', 'medium'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors ${
              filter === f ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30' : 'bg-white/5 text-slate-400 border border-white/10'
            }`}>{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((alert, i) => (
          <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-panel p-4 border-l-4 border-l-red-500/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'high' ? 'text-orange-400' : 'text-amber-400'
                }`} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-sm font-medium text-white">{alert.title}</span>
                  </div>
                  <p className="text-xs text-slate-400">{alert.message}</p>
                  {alert.zone && <p className="text-[10px] text-slate-500 mt-1">Zone: {alert.zone}</p>}
                  <div className="mt-2 p-2 rounded bg-accent-amber/5 border border-accent-amber/20">
                    <p className="text-[10px] uppercase tracking-widest text-accent-amber mb-0.5">Recommended Action</p>
                    <p className="text-xs text-slate-300">{alert.recommended_action}</p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                {new Date(alert.created_at).toLocaleString('en-IN')}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
