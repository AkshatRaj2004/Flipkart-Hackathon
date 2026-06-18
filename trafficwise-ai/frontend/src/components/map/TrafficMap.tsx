import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { MapEvent } from '../../types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946];

function createIcon(priority: string, isClosure: boolean) {
  const color = isClosure ? '#ef4444' : priority === 'High' ? '#f97316' : '#00d4ff';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px ${color}"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function HeatmapLayer({ events }: { events: MapEvent[] }) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!events.length) return;

    import('leaflet.heat/dist/leaflet-heat.js').then(() => {
      const Lheat = L as typeof L & {
        heatLayer: (points: [number, number, number][], options?: Record<string, unknown>) => L.Layer;
      };
      const points = events.map(e => [e.lat, e.lng, e.priority === 'High' ? 1.0 : 0.5] as [number, number, number]);
      const heat = Lheat.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: { 0.2: '#00d4ff', 0.5: '#fbbf24', 0.8: '#f97316', 1.0: '#ef4444' },
      });
      heat.addTo(map);
      layerRef.current = heat;
    });

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [events, map]);

  return null;
}

interface TrafficMapProps {
  events: MapEvent[];
  showHeatmap?: boolean;
  showClosures?: boolean;
  showClustering?: boolean;
  height?: string;
  className?: string;
}

export default function TrafficMap({
  events,
  showHeatmap = true,
  showClosures = true,
  showClustering = true,
  height = '500px',
  className = '',
}: TrafficMapProps) {
  const filtered = useMemo(() => events.filter(e => e.lat && e.lng), [events]);

  const markers = filtered.map(event => (
    <Marker
      key={event.id}
      position={[event.lat, event.lng]}
      icon={createIcon(event.priority, event.requires_road_closure)}
    >
      <Popup>
        <div className="text-xs text-slate-800">
          <strong>{event.event_cause}</strong><br />
          Zone: {event.zone || 'N/A'}<br />
          Junction: {event.junction || 'N/A'}<br />
          Priority: {event.priority}<br />
          Status: {event.status}
        </div>
      </Popup>
    </Marker>
  ));

  return (
    <div className={`rounded-xl overflow-hidden border border-white/10 ${className}`} style={{ height }}>
      <MapContainer center={BENGALURU_CENTER} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {showHeatmap && <HeatmapLayer events={filtered} />}
        {showClustering ? (
          <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
            {markers}
          </MarkerClusterGroup>
        ) : (
          markers
        )}
        {showClosures && filtered.filter(e => e.requires_road_closure).map(event => (
          <Circle
            key={`closure-${event.id}`}
            center={[event.lat, event.lng]}
            radius={500}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 2, dashArray: '5 5' }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

export { BENGALURU_CENTER };
