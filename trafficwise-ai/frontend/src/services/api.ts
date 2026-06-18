import axios from 'axios';
import type {
  KPISummary, DistributionItem, ZoneIncident, JunctionRisk, StationWorkload,
  CorridorImpact, TrendItem, TimelineItem, LiveFeedItem, MapEvent,
  ForecastResponse, SimulateResponse, OptimizeResponse, CopilotResponse,
  AlertItem, InsightItem, FilterOptions, TrafficEvent,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_BASE });

export const getKPIs = () => api.get<KPISummary>('/analytics/kpi-summary').then(r => r.data);
export const getEventTypeDist = () => api.get<DistributionItem[]>('/analytics/event-type-distribution').then(r => r.data);
export const getCauseAnalysis = () => api.get<DistributionItem[]>('/analytics/cause-analysis').then(r => r.data);
export const getPriorityDist = () => api.get<DistributionItem[]>('/analytics/priority-distribution').then(r => r.data);
export const getStatusDist = () => api.get<DistributionItem[]>('/analytics/status-distribution').then(r => r.data);
export const getZoneIncidents = () => api.get<ZoneIncident[]>('/analytics/zone-incidents').then(r => r.data);
export const getCorridorImpact = () => api.get<CorridorImpact[]>('/analytics/corridor-impact').then(r => r.data);
export const getJunctionRisk = () => api.get<JunctionRisk[]>('/analytics/junction-risk').then(r => r.data);
export const getStationWorkload = () => api.get<StationWorkload[]>('/analytics/station-workload').then(r => r.data);
export const getHourlyTrends = () => api.get<TrendItem[]>('/analytics/hourly-trends').then(r => r.data);
export const getIncidentTrends = () => api.get<TrendItem[]>('/analytics/incident-trends').then(r => r.data);
export const getTimeline = () => api.get<TimelineItem[]>('/analytics/timeline').then(r => r.data);
export const getLiveFeed = () => api.get<LiveFeedItem[]>('/analytics/live-feed').then(r => r.data);
export const getMapEvents = (params?: Record<string, string>) =>
  api.get<MapEvent[]>('/analytics/map-events', { params }).then(r => r.data);
export const getEvents = (params?: Record<string, string | number | boolean>) =>
  api.get<{ total: number; items: TrafficEvent[] }>('/events', { params }).then(r => r.data);
export const getFilterOptions = () => api.get<FilterOptions>('/events/filters/options').then(r => r.data);
export const getAlerts = () => api.get<AlertItem[]>('/alerts/active-alerts').then(r => r.data);
export const getInsights = () => api.get<InsightItem[]>('/ai/insights').then(r => r.data);

export const forecast = (data: Record<string, unknown>) =>
  api.post<ForecastResponse>('/ai/forecast', data).then(r => r.data);

export const simulate = (data: Record<string, unknown>) =>
  api.post<SimulateResponse>('/ai/simulate', data).then(r => r.data);

export const optimizeResources = (data: Record<string, unknown>) =>
  api.post<OptimizeResponse>('/ai/optimize-resources', data).then(r => r.data);

export const copilotQuery = (query: string) =>
  api.post<CopilotResponse>('/ai/copilot', { query }).then(r => r.data);

export const downloadCSV = (zone?: string) => {
  const url = `${API_BASE}/reports/export-csv${zone ? `?zone=${encodeURIComponent(zone)}` : ''}`;
  window.open(url, '_blank');
};

export const downloadExcel = (zone?: string) => {
  const url = `${API_BASE}/reports/export-excel${zone ? `?zone=${encodeURIComponent(zone)}` : ''}`;
  window.open(url, '_blank');
};

export const downloadPDF = async (reportType: string, zone?: string) => {
  const res = await api.post('/reports/generate-pdf', { report_type: reportType, zone }, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `trafficwise_${reportType}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};
