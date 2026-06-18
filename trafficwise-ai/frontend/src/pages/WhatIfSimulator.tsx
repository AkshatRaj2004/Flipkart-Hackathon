import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Play } from 'lucide-react';
import { Panel, RiskGauge } from '../components/ui/KPICard';
import { simulate, getFilterOptions } from '../services/api';
import type { SimulateResponse, FilterOptions } from '../types';

const SCENARIOS = ['New Event', 'Rally', 'Festival', 'Accident', 'Construction', 'VIP Movement'];

export default function WhatIfSimulator() {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [form, setForm] = useState({
    scenario_type: 'Accident', event_cause: 'accident', zone: 'East Zone 1',
    junction: '', priority: 'High', requires_road_closure: false, duration_hours: 3, corridor: 'ORR East 1',
  });
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getFilterOptions().then(setOptions).catch(console.error); }, []);

  const handleSimulate = async () => {
    setLoading(true);
    try { setResult(await simulate(form)); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectClass = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-accent-cyan/50";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-accent-amber" /> What-If Simulator
        </h2>
        <p className="text-sm text-slate-400 mt-1">Simulate future traffic events and predict city-wide impact</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {SCENARIOS.map(s => (
          <button key={s} onClick={() => setForm(prev => ({ ...prev, scenario_type: s }))}
            className={`p-3 rounded-lg border text-xs font-medium transition-all ${
              form.scenario_type === s
                ? 'bg-accent-amber/20 border-accent-amber/40 text-accent-amber'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
            }`}>{s}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Simulation Parameters">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'zone', label: 'Zone', opts: options?.zones },
              { key: 'corridor', label: 'Corridor', opts: options?.corridors },
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
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Duration (hrs)</label>
              <input type="number" className={`${selectClass} mt-1`} value={form.duration_hours}
                onChange={e => setForm(prev => ({ ...prev, duration_hours: +e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.requires_road_closure}
                  onChange={e => setForm(prev => ({ ...prev, requires_road_closure: e.target.checked }))}
                  className="accent-accent-amber" /> Requires Road Closure
              </label>
            </div>
          </div>
          <button onClick={handleSimulate} disabled={loading}
            className="mt-6 w-full py-3 bg-accent-amber/20 border border-accent-amber/40 text-accent-amber rounded-lg font-medium text-sm hover:bg-accent-amber/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Play className="w-4 h-4" /> {loading ? 'Simulating...' : 'Run Simulation'}
          </button>
        </Panel>

        <Panel title="Simulation Results">
          {result ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-6">
                <RiskGauge score={result.compounded_risk_score} size={100} />
                <div>
                  <p className="text-sm font-semibold text-white">{result.scenario_type} Scenario</p>
                  <p className="text-xs text-slate-400 mt-1">Delay Forecast: {result.delay_forecast_minutes.toFixed(0)} min</p>
                  <p className="text-xs text-slate-400">Police: {result.resource_requirements.traffic_police} | Barricades: {result.resource_requirements.barricades}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Congestion Spread</p>
                {result.predicted_congestion_spread.map(s => (
                  <div key={s.radius_km} className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-slate-400 w-16">{s.radius_km} km</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-amber rounded-full" style={{ width: `${s.congestion_level}%` }} />
                    </div>
                    <span className="text-xs text-accent-amber font-mono w-10">{s.congestion_level}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Recommended Diversions</p>
                {result.recommended_diversions.map((d, i) => (
                  <p key={i} className="text-xs text-slate-300">› {d}</p>
                ))}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Impact Zones</p>
                <div className="flex flex-wrap gap-2">
                  {result.expected_impact_zones.map(z => (
                    <span key={z} className="px-2 py-1 rounded bg-white/5 text-xs text-slate-300">{z}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Select a scenario and run simulation</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
