import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, Layers } from 'lucide-react';
import TrafficMap from '../components/map/TrafficMap';
import { Panel } from '../components/ui/KPICard';
import { getMapEvents, getFilterOptions } from '../services/api';
import type { MapEvent, FilterOptions } from '../types';

export default function DigitalTwin() {
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [filters, setFilters] = useState({
    zone: '', junction: '', event_type: '', priority: '', status: '', requires_road_closure: '',
  });
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showClosures, setShowClosures] = useState(true);
  const [showClustering, setShowClustering] = useState(true);

  useEffect(() => {
    getMapEvents().then(setEvents).catch(console.error);
    getFilterOptions().then(setOptions).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (filters.zone && e.zone !== filters.zone) return false;
      if (filters.junction && e.junction !== filters.junction) return false;
      if (filters.event_type && e.event_type !== filters.event_type) return false;
      if (filters.priority && e.priority !== filters.priority) return false;
      if (filters.status && e.status !== filters.status) return false;
      if (filters.requires_road_closure === 'true' && !e.requires_road_closure) return false;
      if (filters.requires_road_closure === 'false' && e.requires_road_closure) return false;
      return true;
    });
  }, [events, filters]);

  const selectClass = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-cyan/50";

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Digital Twin Map</h2>
          <p className="text-sm text-slate-400 mt-1">Interactive city map with real-time event intelligence</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-1 rounded bg-white/5">{filtered.length} events displayed</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Panel title="Map Filters" className="lg:col-span-1">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Filter className="w-3 h-3" /> Filter Controls
            </div>
            {[
              { key: 'zone', label: 'Zone', opts: options?.zones },
              { key: 'junction', label: 'Junction', opts: options?.junctions?.slice(0, 50) },
              { key: 'event_type', label: 'Event Type', opts: options?.event_types },
              { key: 'priority', label: 'Priority', opts: options?.priorities },
              { key: 'status', label: 'Status', opts: options?.statuses },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-widest text-slate-500">{f.label}</label>
                <select className={`${selectClass} w-full mt-1`} value={filters[f.key as keyof typeof filters]}
                  onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}>
                  <option value="">All</option>
                  {f.opts?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Road Closure</label>
              <select className={`${selectClass} w-full mt-1`} value={filters.requires_road_closure}
                onChange={e => setFilters(prev => ({ ...prev, requires_road_closure: e.target.value }))}>
                <option value="">All</option>
                <option value="true">Required</option>
                <option value="false">Not Required</option>
              </select>
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Layers className="w-3 h-3" /> Layers
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 mb-2 cursor-pointer">
                <input type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} className="accent-accent-cyan" />
                Congestion Heatmap
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 mb-2 cursor-pointer">
                <input type="checkbox" checked={showClustering} onChange={e => setShowClustering(e.target.checked)} className="accent-accent-cyan" />
                Marker Clustering
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={showClosures} onChange={e => setShowClosures(e.target.checked)} className="accent-accent-cyan" />
                Road Closure Overlays
              </label>
            </div>
            <button onClick={() => setFilters({ zone: '', junction: '', event_type: '', priority: '', status: '', requires_road_closure: '' })}
              className="w-full py-2 text-xs text-accent-cyan border border-accent-cyan/30 rounded-lg hover:bg-accent-cyan/10 transition-colors">
              Reset Filters
            </button>
          </div>
        </Panel>

        <div className="lg:col-span-3">
          <TrafficMap events={filtered} showHeatmap={showHeatmap} showClosures={showClosures} showClustering={showClustering} height="calc(100vh - 200px)" />
          <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> High Priority</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-cyan" /> Low Priority</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Road Closure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
