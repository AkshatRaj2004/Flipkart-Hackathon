import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Route, Radio, Clock, Megaphone } from 'lucide-react';
import { Panel } from '../components/ui/KPICard';
import { optimizeResources, getFilterOptions, getEvents } from '../services/api';
import type { OptimizeResponse, FilterOptions, TrafficEvent } from '../types';

export default function ResourceOptimizer() {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [form, setForm] = useState({ zone: 'East Zone 1', event_cause: 'accident', priority: 'High', requires_road_closure: false, junction: '', event_id: '' });
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getFilterOptions().then(setOptions).catch(console.error);
    getEvents({ status: 'active', limit: 20 }).then(r => setEvents(r.items)).catch(console.error);
  }, []);

  const handleOptimize = async () => {
    setLoading(true);
    try { setResult(await optimizeResources(form)); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectClass = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-accent-cyan/50";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-accent-cyan" /> AI Resource Optimization
        </h2>
        <p className="text-sm text-slate-400 mt-1">Intelligent resource allocation with reasoning for every recommendation</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Configuration">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Active Event (optional)</label>
              <select className={`${selectClass} mt-1`} value={form.event_id}
                onChange={e => setForm(prev => ({ ...prev, event_id: e.target.value }))}>
                <option value="">Manual Configuration</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.id} - {e.event_cause} ({e.zone})</option>)}
              </select>
            </div>
            {[
              { key: 'zone', label: 'Zone', opts: options?.zones },
              { key: 'event_cause', label: 'Cause', opts: options?.event_causes },
              { key: 'priority', label: 'Priority', opts: ['High', 'Low'] },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-widest text-slate-500">{f.label}</label>
                <select className={`${selectClass} mt-1`} value={form[f.key as keyof typeof form] as string}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}>
                  {f.opts?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.requires_road_closure}
                onChange={e => setForm(prev => ({ ...prev, requires_road_closure: e.target.checked }))}
                className="accent-accent-cyan" /> Road Closure Required
            </label>
            <button onClick={handleOptimize} disabled={loading}
              className="w-full py-3 bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan rounded-lg font-medium text-sm hover:bg-accent-cyan/30 transition-colors disabled:opacity-50">
              {loading ? 'Optimizing...' : 'Generate Recommendations'}
            </button>
          </div>
        </Panel>

        <div className="lg:col-span-2">
          {result ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="glass-panel p-4 text-center">
                  <Shield className="w-5 h-5 text-accent-cyan mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{result.traffic_police_required}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Police Required</p>
                </div>
                <div className="glass-panel p-4 text-center">
                  <Route className="w-5 h-5 text-accent-amber mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{result.barricades_required}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Barricades</p>
                </div>
                <div className="glass-panel p-4 text-center">
                  <Radio className="w-5 h-5 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{result.diversion_routes.length}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Diversions</p>
                </div>
                <div className="glass-panel p-4 text-center">
                  <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{result.signal_timing_recommendations.length}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Signal Adjustments</p>
                </div>
              </div>

              {[
                { title: 'Diversion Routes', items: result.diversion_routes, icon: Route },
                { title: 'Emergency Corridors', items: result.emergency_corridors, icon: Radio },
                { title: 'Signal Timing', items: result.signal_timing_recommendations, icon: Clock },
                { title: 'Public Advisories', items: result.public_advisory_messages, icon: Megaphone },
              ].map(section => (
                <Panel key={section.title} title={section.title}>
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <section.icon className="w-3 h-3 text-accent-cyan mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </Panel>
              ))}

              <Panel title="AI Reasoning">
                <ul className="space-y-1">
                  {result.reasoning.map((r, i) => (
                    <li key={i} className="text-xs text-slate-400">› {r}</li>
                  ))}
                </ul>
              </Panel>
            </motion.div>
          ) : (
            <div className="glass-panel flex items-center justify-center h-96 text-slate-500 text-sm">
              Configure parameters and generate resource recommendations
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
