import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, Calendar, MapPin, Shield, Construction,
  TrendingUp, Zap, Clock, Radio,
} from 'lucide-react';
import KPICard, { Panel, SeverityBadge, PriorityBadge } from '../components/ui/KPICard';
import { TrendLine } from '../components/charts/Charts';
import { getKPIs, getLiveFeed, getAlerts, getTimeline, getZoneIncidents } from '../services/api';
import type { KPISummary, LiveFeedItem, AlertItem, TimelineItem, ZoneIncident } from '../types';

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPISummary | null>(null);
  const [feed, setFeed] = useState<LiveFeedItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [zones, setZones] = useState<ZoneIncident[]>([]);

  useEffect(() => {
    Promise.all([getKPIs(), getLiveFeed(), getAlerts(), getTimeline(), getZoneIncidents()])
      .then(([k, f, a, t, z]) => { setKpis(k); setFeed(f); setAlerts(a.slice(0, 5)); setTimeline(t.slice(0, 8)); setZones(z.slice(0, 5)); })
      .catch(console.error);
  }, []);

  if (!kpis) return <div className="flex items-center justify-center h-64 text-slate-400">Loading command center...</div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-white">Command Center Dashboard</h2>
        <p className="text-sm text-slate-400 mt-1">Real-time traffic intelligence for Bengaluru Metropolitan Region</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPICard label="Total Events" value={kpis.total_events.toLocaleString()} icon={Activity} delay={0} />
        <KPICard label="Active Events" value={kpis.active_events} icon={Radio} color="text-green-400" delay={1} />
        <KPICard label="Planned" value={kpis.planned_events.toLocaleString()} icon={Calendar} delay={2} />
        <KPICard label="Unplanned" value={kpis.unplanned_events.toLocaleString()} icon={Zap} color="text-amber-400" delay={3} />
        <KPICard label="High Priority" value={kpis.high_priority_events.toLocaleString()} icon={AlertTriangle} color="text-red-400" delay={4} />
        <KPICard label="Road Closures" value={kpis.road_closures} icon={Construction} color="text-orange-400" delay={5} />
        <KPICard label="Avg Risk" value={`${kpis.avg_congestion_risk}%`} icon={TrendingUp} delay={6} />
        <KPICard label="City Impact" value={kpis.city_impact_score.toFixed(1)} icon={Shield} delay={7} subtitle={`Severity: ${kpis.traffic_severity_index}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Live Event Feed" className="lg:col-span-1">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {feed.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white">{item.event_cause.replace(/_/g, ' ')}</span>
                  <PriorityBadge priority={item.priority} />
                </div>
                <p className="text-[10px] text-slate-400">{item.zone} {item.junction ? `• ${item.junction}` : ''}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-500">{item.status}</span>
                  <span className="text-[10px] text-accent-cyan font-mono">Risk: {item.risk_score}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>

        <Panel title="Risk Alerts" className="lg:col-span-1">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-xs font-medium text-white truncate">{alert.title}</span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">{alert.message}</p>
                <p className="text-[10px] text-accent-amber mt-1">{alert.recommended_action}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top Congested Zones" className="lg:col-span-1">
          <div className="space-y-3">
            {zones.map((z, i) => (
              <div key={z.zone} className="flex items-center gap-3">
                <span className="text-lg font-bold text-accent-cyan/50 w-6">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-white">{z.zone}</span>
                    <span className="text-xs text-accent-cyan font-mono">{z.avg_risk}%</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${z.avg_risk}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-accent-cyan to-accent-amber rounded-full" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{z.count} events • {z.high_priority} high priority</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Incident Timeline">
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {timeline.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{item.event_cause.replace(/_/g, ' ')} — {item.junction || item.zone}</p>
                  <p className="text-[10px] text-slate-500">{new Date(item.start_datetime).toLocaleString('en-IN')}</p>
                </div>
                <PriorityBadge priority={item.priority} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Traffic Severity Index">
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }}
                className="text-6xl font-bold text-accent-cyan">{kpis.traffic_severity_index}</motion.div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mt-2">Severity Index</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Bengaluru Metropolitan Region</span>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
