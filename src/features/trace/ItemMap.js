import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const LIFECYCLE_COLOR = '#2e7d32';
export const ACTIVITY_LINE_COLOR = '#2f80c8';

// Keeps every point in view whenever the set of points changes.
function FitToPoints({ points }) {
  const map = useMap();
  // Re-fit only when the points themselves change, so the map does not jump
  // back while the user is looking around.
  const signature = JSON.stringify(points);
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 5);
    } else {
      map.fitBounds(points, { padding: [30, 30], maxZoom: 8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);
  return null;
}

// Where a product's story happened, on an OpenStreetMap map (used when no
// Google Maps key is configured — see GoogleItemMap for the same picture on
// Google Maps). Two layers, each oldest/first to newest/last:
//   lifecycle — the steps the brand entered (materials, made, shipped):
//               green dots joined by a solid green line;
//   points    — what was actually recorded (scans, work steps, transfers):
//               dots in each event's colour joined by a dashed blue line.
// Each point: { lat, lng, label, color }. Loaded lazily.
export default function ItemMap({ points = [], lifecycle = [], height = 360 }) {
  const activity = points.map((p) => [p.lat, p.lng]);
  const planned = lifecycle.map((p) => [p.lat, p.lng]);
  const all = [...planned, ...activity];
  return (
    <MapContainer
      center={all[0] || [20, 0]}
      zoom={2}
      scrollWheelZoom={false}
      style={{ height, width: '100%', borderRadius: 8 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {planned.length > 1 && <Polyline positions={planned} pathOptions={{ color: LIFECYCLE_COLOR, weight: 3 }} />}
      {lifecycle.map((p, i) => (
        <CircleMarker
          key={`l${i}`}
          center={[p.lat, p.lng]}
          radius={8}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: LIFECYCLE_COLOR, fillOpacity: 1 }}
        >
          <Tooltip>{p.label}</Tooltip>
        </CircleMarker>
      ))}
      {activity.length > 1 && <Polyline positions={activity} pathOptions={{ color: ACTIVITY_LINE_COLOR, weight: 2, dashArray: '6 6' }} />}
      {points.map((p, i) => (
        <CircleMarker
          key={`a${i}`}
          center={[p.lat, p.lng]}
          radius={i === points.length - 1 ? 9 : 6}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: p.color, fillOpacity: 1 }}
        >
          <Tooltip>{p.label}</Tooltip>
        </CircleMarker>
      ))}
      <FitToPoints points={all} />
    </MapContainer>
  );
}
