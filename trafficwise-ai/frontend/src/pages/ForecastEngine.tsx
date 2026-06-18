import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send } from 'lucide-react';
import { Panel, RiskGauge } from '../components/ui/KPICard';
import { forecast, getFilterOptions } from '../services/api';
import type { ForecastResponse, FilterOptions } from '../types';

export default function ForecastEngine() {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [form, setForm] = useState({
    event_type: 'unplanned', event_cause: 'accident', zone: 'East Zone 1',
    junction: '', priority: 'High', requires_road_closure: false, duration_hours: 2,
  });
  const [result, setResult] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getFilterOptions().then(setOptions).catch(console.error); }, []);

  const handleForecast = async () => {
    setLoading(true);
    try {
      const res = await forecast(form);
      setResult(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectClass = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-accent-cyan/50";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent-cyan" /> AI Congestion Forecast Engine
        </h2>
        <p className="text-sm text-slate-400 mt-1">Predict congestion impact using historical patterns and weighted risk calculations</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Forecast Inputs">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'event_type', label: 'Event Type', opts: options?.event_types || ['planned', 'unplanned'] },
              { key: 'event_cause', label: 'Event Cause', opts: options?.event_causes || [] },
              { key: 'zone', label: 'Zone', opts: options?.zones || [] },
              { key: 'priority', label: 'Priority', opts: options?.priorities || ['High', 'Low'] },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-widest text-slate-500">{f.label}</label>
                <select className={`${selectClass} mt-1`} value={form[f.key as keyof typeof form] as string}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}>
                  {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Junction</label>
              <select className={`${selectClass} mt-1`} value={form.junction}
                onChange={e => setForm(prev => ({ ...prev, junction: e.target.value }))}>
                <option value="">None</option>
                {options?.junctions?.slice(0, 30).map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Duration (hours)</label>
              <input type="number" min={0.5} max={24} step={0.5} className={`${selectClass} mt-1`}
                value={form.duration_hours} onChange={e => setForm(prev => ({ ...prev, duration_hours: +e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.requires_road_closure}
                  onChange={e => setForm(prev => ({ ...prev, requires_road_closure: e.target.checked }))}
                  className="accent-accent-cyan" />
                Requires Road Closure
              </label>
            </div>
          </div>
          <button onClick={handleForecast} disabled={loading}
            className="mt-6 w-full py-3 bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan rounded-lg font-medium text-sm hover:bg-accent-cyan/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" /> {loading ? 'Computing...' : 'Generate Forecast'}
          </button>
        </Panel>

        <Panel title="Forecast Results">
          {result ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <RiskGauge score={result.congestion_risk_score} size={140} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Risk Category', value: result.risk_category },
                  { label: 'Est. Delay', value: `${result.estimated_delay_minutes} min` },
                  { label: 'Severity', value: result.traffic_severity },
                  { label: 'Impact Radius', value: `${result.impact_radius_km} km` },
                  { label: 'Confidence', value: `${result.confidence_score}%` },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">{item.label}</p>
                    <p className="text-sm font-semibold text-white mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">AI Reasoning</p>
                <ul className="space-y-1">
                  {result.reasoning.map((r, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-accent-cyan mt-0.5">›</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
              Configure parameters and generate a forecast
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
