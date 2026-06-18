export interface TrafficEvent {
  id: string;
  event_type: string;
  event_cause: string;
  latitude: number;
  longitude: number;
  start_datetime: string;
  end_datetime?: string;
  status: string;
  priority: string;
  corridor?: string;
  police_station?: string;
  zone?: string;
  junction?: string;
  requires_road_closure: boolean;
  description?: string;
  address?: string;
}

export interface KPISummary {
  total_events: number;
  active_events: number;
  planned_events: number;
  unplanned_events: number;
  high_priority_events: number;
  road_closures: number;
  avg_congestion_risk: number;
  city_impact_score: number;
  traffic_severity_index: number;
}

export interface DistributionItem {
  name: string;
  value: number;
  percentage?: number;
}

export interface ZoneIncident {
  zone: string;
  count: number;
  high_priority: number;
  road_closures: number;
  avg_risk: number;
}

export interface JunctionRisk {
  junction: string;
  zone?: string;
  count: number;
  risk_score: number;
  high_priority_count: number;
}

export interface StationWorkload {
  police_station: string;
  total_events: number;
  active_events: number;
  high_priority: number;
  workload_score: number;
}

export interface CorridorImpact {
  corridor: string;
  count: number;
  avg_duration_hours: number;
  impact_score: number;
}

export interface TrendItem {
  period: string;
  count: number;
}

export interface TimelineItem {
  id: string;
  event_type: string;
  event_cause: string;
  zone?: string;
  junction?: string;
  priority: string;
  status: string;
  start_datetime: string;
  requires_road_closure: boolean;
}

export interface LiveFeedItem {
  id: string;
  event_type: string;
  event_cause: string;
  zone?: string;
  junction?: string;
  priority: string;
  status: string;
  start_datetime: string;
  requires_road_closure: boolean;
  risk_score: number;
}

export interface MapEvent {
  id: string;
  lat: number;
  lng: number;
  event_type: string;
  event_cause: string;
  priority: string;
  status: string;
  zone?: string;
  junction?: string;
  requires_road_closure: boolean;
  corridor?: string;
}

export interface ForecastResponse {
  congestion_risk_score: number;
  risk_category: string;
  estimated_delay_minutes: number;
  traffic_severity: string;
  impact_radius_km: number;
  confidence_score: number;
  reasoning: string[];
}

export interface SimulateResponse {
  scenario_type: string;
  predicted_congestion_spread: { radius_km: number; congestion_level: number; affected_junctions_estimate: number }[];
  delay_forecast_minutes: number;
  resource_requirements: { traffic_police: number; barricades: number; diversion_routes: number };
  recommended_diversions: string[];
  expected_impact_zones: string[];
  compounded_risk_score: number;
  reasoning: string[];
}

export interface OptimizeResponse {
  traffic_police_required: number;
  barricades_required: number;
  diversion_routes: string[];
  emergency_corridors: string[];
  signal_timing_recommendations: string[];
  public_advisory_messages: string[];
  reasoning: string[];
}

export interface CopilotResponse {
  intent: string;
  answer: string;
  reasoning: string[];
  supporting_data: unknown;
}

export interface AlertItem {
  id: string;
  severity: string;
  title: string;
  message: string;
  zone?: string;
  recommended_action: string;
  created_at: string;
}

export interface InsightItem {
  category: string;
  title: string;
  description: string;
  metric?: string;
  trend?: string;
}

export interface FilterOptions {
  zones: string[];
  junctions: string[];
  event_types: string[];
  priorities: string[];
  statuses: string[];
  corridors: string[];
  police_stations: string[];
  event_causes: string[];
}
