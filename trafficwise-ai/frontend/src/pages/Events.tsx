import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import { Panel } from '../components/ui/KPICard';
import EventsTable from '../components/table/EventsTable';
import { getEvents, getFilterOptions } from '../services/api';
import type { TrafficEvent, FilterOptions } from '../types';

const PAGE_SIZE = 25;

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<FilterOptions | null>(null);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    zone: searchParams.get('zone') || '',
    event_type: searchParams.get('event_type') || '',
    priority: searchParams.get('priority') || '',
    status: searchParams.get('status') || '',
    requires_road_closure: searchParams.get('requires_road_closure') || '',
  });

  useEffect(() => { getFilterOptions().then(setOptions).catch(console.error); }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (search) params.search = search;
      if (filters.zone) params.zone = filters.zone;
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.priority) params.priority = filters.priority;
      if (filters.status) params.status = filters.status;
      if (filters.requires_road_closure === 'true') params.requires_road_closure = true;
      if (filters.requires_road_closure === 'false') params.requires_road_closure = false;

      const res = await getEvents(params);
      setEvents(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [page, search, filters]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    setSearchParams(params);
    fetchEvents();
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({ zone: '', event_type: '', priority: '', status: '', requires_road_closure: '' });
    setPage(0);
    setSearchParams({});
  };

  const selectClass = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-cyan/50';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-accent-cyan" /> Event Registry
        </h2>
        <p className="text-sm text-slate-400 mt-1">Search, filter, and browse all traffic events</p>
      </motion.div>

      <Panel title="Search & Filters">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by ID, zone, junction, corridor, cause, station..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-cyan/50"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan rounded-lg text-sm font-medium hover:bg-accent-cyan/30 transition-colors">
              Search
            </button>
            <button type="button" onClick={clearFilters} className="px-3 py-2.5 border border-white/10 text-slate-400 rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3 h-3" /> Filters
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: 'zone', label: 'Zone', opts: options?.zones },
              { key: 'event_type', label: 'Type', opts: options?.event_types },
              { key: 'priority', label: 'Priority', opts: options?.priorities },
              { key: 'status', label: 'Status', opts: options?.statuses },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-widest text-slate-500">{f.label}</label>
                <select
                  className={`${selectClass} w-full mt-1`}
                  value={filters[f.key as keyof typeof filters]}
                  onChange={e => { setFilters(prev => ({ ...prev, [f.key]: e.target.value })); setPage(0); }}
                >
                  <option value="">All</option>
                  {f.opts?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Road Closure</label>
              <select
                className={`${selectClass} w-full mt-1`}
                value={filters.requires_road_closure}
                onChange={e => { setFilters(prev => ({ ...prev, requires_road_closure: e.target.value })); setPage(0); }}
              >
                <option value="">All</option>
                <option value="true">Required</option>
                <option value="false">Not Required</option>
              </select>
            </div>
          </div>
        </form>
      </Panel>

      <Panel title={`Events (${total.toLocaleString()})`}>
        <EventsTable
          data={events}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          loading={loading}
        />
      </Panel>
    </div>
  );
}
