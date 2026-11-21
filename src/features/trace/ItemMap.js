import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const LIFECYCLE_COLOR = '#1b4f72';

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

// Place names that would cover one another are hidden (the first one
// stays); zooming in brings them back.
function Declutter() {
  const map = useMap();
  useEffect(() => {
    const run = () => {
      const kept = [];
      map.getContainer().querySelectorAll('.map-place-label').forEach((el) => {
        el.style.visibility = 'visible';
        const r = el.getBoundingClientRect();
        const hit = kept.some((k) => r.left < k.right + 4 && r.right > k.left - 4 && r.top < k.bottom + 2 && r.bottom > k.top - 2);
        if (hit) el.style.visibility = 'hidden';
        else kept.push(r);
      });
    };
    const id = setTimeout(run, 300);
    map.on('zoomend moveend', run);
    return () => { clearTimeout(id); map.off('zoomend moveend', run); };
  }, [map]);
  return null;
}

// Where a product's story happened, on an OpenStreetMap map (used when no
// Google Maps key is configured — see GoogleItemMap for the same picture on
// Google Maps). Two layers, each oldest/first to newest/last:
//   lifecycle — the steps the brand entered (materials, made, shipped):
//               green dots joined by a solid green line;
//   points    — what was actually recorded (scans, work steps, transfers):
//               a dot in each event's colour, with no line between them
//               (only the lifecycle is a journey).
// Each point: { lat, lng, label, color, place }. The place ("Tokyo, Japan")
// is written beside the dot, once per place; a click shows the full label.
// Loaded lazily.
export default function ItemMap({ points = [], lifecycle = [], height = 360 }) {
  const named = new Set();
  const placeLabel = (p) => {
    const key = String(p.place || '').trim();
    if (!key || named.has(key.toLowerCase())) return null;
    named.add(key.toLowerCase());
    return (
      <Tooltip permanent direction="right" offset={[8, 0]} className="map-place-label">{key}</Tooltip>
    );
  };
  const activity = points.map((p) => [p.lat, p.lng]);
  const planned = lifecycle.map((p) => [p.lat, p.lng]);
  const all = [...planned, ...activity];
  return (
    <>
    {/* The place names beside the dots: small white labels. */}
    <style>{'.map-place-label{background:rgba(255,255,255,0.94);border:0;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.18);color:#1c1c1e;font-size:13px;padding:3px 8px}.map-place-label:before{display:none}'}</style>
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
          {placeLabel(p)}
          <Popup>{p.label}</Popup>
        </CircleMarker>
      ))}
      {points.map((p, i) => (
        <CircleMarker
          key={`a${i}`}
          center={[p.lat, p.lng]}
          radius={i === points.length - 1 ? 9 : 6}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: p.color, fillOpacity: 1 }}
        >
          {placeLabel(p)}
          <Popup>{p.label}</Popup>
        </CircleMarker>
      ))}
      <FitToPoints points={all} />
      <Declutter />
    </MapContainer>
    </>
  );
}
