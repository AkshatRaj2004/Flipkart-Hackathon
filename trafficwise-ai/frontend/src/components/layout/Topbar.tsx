import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock, Search } from 'lucide-react';

export default function Topbar() {
  const [time, setTime] = useState(new Date());
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/events?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="h-14 border-b border-white/10 bg-navy-dark/80 backdrop-blur-md flex items-center justify-between px-6 gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <Activity className="w-4 h-4 text-accent-cyan" />
        <span className="text-xs uppercase tracking-widest text-slate-400 font-medium hidden md:inline">
          Traffic Operations Command Center
        </span>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Global search — zones, junctions, events..."
            className="w-full pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-cyan/50"
          />
        </div>
      </form>

      <div className="flex items-center gap-6 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">
            {time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            {' '}
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        <div className="px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-[10px] uppercase tracking-widest font-semibold">
          Live
        </div>
      </div>
    </header>
  );
}
