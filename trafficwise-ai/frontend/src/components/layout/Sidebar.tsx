import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Map, Brain, FlaskConical,
  Users, MessageSquare, Lightbulb, Bell, FileText, Radio, List,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/map', icon: Map, label: 'Digital Twin' },
  { to: '/events', icon: List, label: 'Event Registry' },
  { to: '/forecast', icon: Brain, label: 'AI Forecast' },
  { to: '/simulator', icon: FlaskConical, label: 'What-If' },
  { to: '/resources', icon: Users, label: 'Resources' },
  { to: '/copilot', icon: MessageSquare, label: 'AI Copilot' },
  { to: '/insights', icon: Lightbulb, label: 'Insights' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-navy-dark border-r border-white/10 flex flex-col">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
            <Radio className="w-5 h-5 text-accent-cyan" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">TrafficWise AI</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Bengaluru Police</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="glass-panel p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-slate-400">System Online</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Smart City C&C v1.0</p>
        </div>
      </div>
    </aside>
  );
}
