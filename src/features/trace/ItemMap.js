import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Keeps every point in view whenever the set of points changes.
function FitToPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 5);
    } else {
      map.fitBounds(points, { padding: [30, 30], maxZoom: 8 });
    }
  }, [map, points]);
  return null;
}

// Where an item's events happened. `points` are oldest first:
// [{ lat, lng, label, color }]. A line joins them in time order, so the
// route an item travelled is visible at a glance. Loaded lazily (the map
// library is only needed on the Find an item page).
export default function ItemMap({ points, height = 360 }) {
  const positions = points.map((p) => [p.lat, p.lng]);
  return (
    <MapContainer
      center={positions[0] || [20, 0]}
      zoom={2}
      scrollWheelZoom={false}
      style={{ height, width: '100%', borderRadius: 8 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: '#2f80c8', weight: 2, dashArray: '6 6' }} />}
      {points.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={i === points.length - 1 ? 9 : 6}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: p.color, fillOpacity: 1 }}
        >
          <Tooltip>{p.label}</Tooltip>
        </CircleMarker>
      ))}
      <FitToPoints points={positions} />
    </MapContainer>
  );
}
