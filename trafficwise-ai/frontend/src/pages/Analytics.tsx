import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Panel } from '../components/ui/KPICard';
import { DistributionPie, DistributionBar, TrendLine, HorizontalBar } from '../components/charts/Charts';
import {
  getEventTypeDist, getCauseAnalysis, getPriorityDist, getStatusDist,
  getZoneIncidents, getCorridorImpact, getJunctionRisk, getStationWorkload,
  getHourlyTrends, getIncidentTrends,
} from '../services/api';

export default function Analytics() {
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    Promise.all([
      getEventTypeDist(), getCauseAnalysis(), getPriorityDist(), getStatusDist(),
      getZoneIncidents(), getCorridorImpact(), getJunctionRisk(), getStationWorkload(),
      getHourlyTrends(), getIncidentTrends(),
    ]).then(([eventTypes, causes, priorities, statuses, zones, corridors, junctions, stations, hourly, trends]) => {
      setData({ eventTypes, causes, priorities, statuses, zones, corridors, junctions, stations, hourly, trends });
    }).catch(console.error);
  }, []);

  if (!data.eventTypes) return <div className="flex items-center justify-center h-64 text-slate-400">Loading analytics...</div>;

  const junctionBar = (data.junctions as { junction: string; risk_score: number }[])?.slice(0, 10).map(j => ({ name: j.junction?.slice(0, 20) || '', value: j.risk_score }));
  const stationBar = (data.stations as { police_station: string; workload_score: number }[])?.slice(0, 10).map(s => ({ name: s.police_station, value: s.workload_score }));
  const zoneBar = (data.zones as { zone: string; count: number }[])?.map(z => ({ name: z.zone, value: z.count }));
  const corridorBar = (data.corridors as { corridor: string; impact_score: number }[])?.slice(0, 12).map(c => ({ name: c.corridor, value: c.impact_score }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-white">Advanced Traffic Analytics</h2>
        <p className="text-sm text-slate-400 mt-1">Comprehensive data analysis across Bengaluru traffic network</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Panel title="Event Type Distribution">
          <DistributionPie data={data.eventTypes as { name: string; value: number }[]} height={220} />
        </Panel>
        <Panel title="Priority Distribution">
          <DistributionPie data={data.priorities as { name: string; value: number }[]} height={220} />
        </Panel>
        <Panel title="Status Distribution">
          <DistributionPie data={data.statuses as { name: string; value: number }[]} height={220} />
        </Panel>
        <Panel title="Peak Disruption Hours">
          <DistributionBar data={data.hourly as Record<string, unknown>[]} height={220} xKey="period" />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Event Cause Analysis">
          <DistributionBar data={(data.causes as { name: string; value: number }[]).slice(0, 10)} height={280} />
        </Panel>
        <Panel title="Zone-wise Incidents">
          <DistributionBar data={zoneBar || []} height={280} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Corridor Impact Analysis">
          <DistributionBar data={corridorBar || []} height={280} dataKey="value" />
        </Panel>
        <Panel title="Junction Risk Ranking">
          <HorizontalBar data={junctionBar || []} height={300} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Police Station Workload">
          <HorizontalBar data={stationBar || []} height={300} />
        </Panel>
        <Panel title="Incident Trends Over Time">
          <TrendLine data={data.trends as { period: string; count: number }[]} height={300} />
        </Panel>
      </div>
    </div>
  );
}
