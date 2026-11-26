import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const LIFECYCLE_COLOR = '#1b4f72';

// What a place on the map is about (the bubble's colour), as in the
// client's example map.
export const MAP_KINDS = {
  genuine: { color: '#4cd964', label: 'Genuine scan' },
  problem: { color: '#e5484d', label: 'Problem found (failed check)' },
  staff: { color: '#2f80c8', label: 'Staff work record' },
  transfer: { color: '#a46fd8', label: 'Ownership change' },
  mixed: { color: '#8e7cc3', label: 'Several kinds of activity' },
  lifecycle: { color: LIFECYCLE_COLOR, label: 'Product lifecycle (where it was made)' },
};

// Places closer than this are one bubble (about a city).
const key = (lat, lng) => `${lat.toFixed(1)},${lng.toFixed(1)}`;

// One bubble: the count inside (• = GPS position, IP = from the internet
// address), its size growing with the count, a ring in its colour.
const bubbleIcon = (count, color, viaIp, problem) => {
  const size = Math.round(Math.min(64, 24 + Math.sqrt(count) * 7));
  const mark = viaIp ? 'IP' : '•';
  const text = count > 1 ? `${count >= 1000 ? `${Math.round(count / 100) / 10}k` : count}${viaIp ? ' IP' : ''}` : mark;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color}55;border:3px solid ${problem ? '#e5484d' : color};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.25);font:600 ${size > 34 ? 12 : 11}px -apple-system,Segoe UI,Roboto,sans-serif;color:#1c2430;cursor:pointer">${text}</div>`,
  });
};

// Keeps every point in view whenever the set of points changes; the reset
// button (⟲) brings this view back.
function FitToPoints({ points, resetTick }) {
  const map = useMap();
  const signature = JSON.stringify(points);
  // Never zoomed out past the world's height (no grey band above or below).
  useEffect(() => {
    const fill = () => {
      const h = map.getSize().y;
      map.setMinZoom(Math.max(1, Math.ceil(Math.log2(h / 256) * 4) / 4));
    };
    map.setMaxBounds([[-85, -540], [85, 540]]);
    map.options.maxBoundsViscosity = 1;
    map.options.zoomSnap = 0.25;
    fill();
    map.on('resize', fill);
    return () => { map.off('resize', fill); };
  }, [map]);
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 5);
    else map.fitBounds(points, { padding: [40, 40], maxZoom: 7 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature, resetTick]);
  return null;
}

// Zoom in / out and reset, as round buttons top left.
function Controls({ onReset }) {
  const map = useMap();
  const btn = { width: 30, height: 30, borderRadius: 15, border: '1px solid #9aa3ad', background: '#fff', fontSize: 17, lineHeight: '26px', cursor: 'pointer', color: '#333', padding: 0 };
  return (
    <div className="leaflet-top leaflet-left dpp-map-ctl" style={{ pointerEvents: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 10 }} onDoubleClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Zoom in" style={btn} onClick={() => map.zoomIn()}>+</button>
        <button type="button" aria-label="Zoom out" style={btn} onClick={() => map.zoomOut()}>−</button>
        <button type="button" aria-label="Show everything" title="Show everything" style={btn} onClick={onReset}>⟲</button>
      </div>
    </div>
  );
}

function Legend({ showLifecycle = true }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="leaflet-bottom leaflet-left dpp-map-ctl" style={{ pointerEvents: 'auto' }}>
      <style>{'.dpp-life-label{background:rgba(255,255,255,.95);border:0;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.25);padding:2px 8px;font:12px -apple-system,Segoe UI,Roboto,sans-serif;color:#1c2430;white-space:nowrap}.dpp-life-label:before{display:none}'}</style>
      <div style={{ margin: 10, background: 'rgba(255,255,255,0.95)', border: '1px solid #d5dbe3', borderRadius: 8, padding: open ? '8px 10px' : '4px 8px', font: '12px -apple-system,Segoe UI,Roboto,sans-serif', color: '#333', maxWidth: 260 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setOpen((v) => !v)} role="button" aria-expanded={open}>
          <b>Legend</b><span>{open ? '×' : '+'}</span>
        </div>
        {open && (
          <div style={{ marginTop: 6, display: 'grid', gap: 4 }}>
            {Object.entries(MAP_KINDS).filter(([key]) => showLifecycle || key !== 'lifecycle').map(([, k]) => (
              <div key={k.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: `${k.color}55`, border: `2px solid ${k.color}`, display: 'inline-block' }} />{k.label}
              </div>
            ))}
            <div style={{ borderTop: '1px solid #e3e7ec', marginTop: 4, paddingTop: 4 }}>• Position from the phone&apos;s GPS</div>
            <div><b>IP</b> Position from the internet address</div>
            <div>Number: how many records at that place</div>
          </div>
        )}
      </div>
    </div>
  );
}

// A bubble: a click flies the map to it and zooms in, and lists what
// happened there.
function Bubble({ group }) {
  const map = useMap();
  return (
    <Marker
      position={[group.lat, group.lng]}
      icon={bubbleIcon(group.items.length, MAP_KINDS[group.kind].color, group.viaIp, group.problem)}
      eventHandlers={{ click: () => map.flyTo([group.lat, group.lng], Math.max(map.getZoom() + 3, 7), { duration: 0.8 }) }}
    >
      <Popup>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{group.place || 'Here'}</div>
        <div style={{ maxHeight: 180, overflowY: 'auto' }}>
          {group.items.slice(0, 12).map((it, i) => <div key={i} style={{ fontSize: 12, padding: '2px 0' }}>{it.label}</div>)}
          {group.items.length > 12 && <div style={{ fontSize: 12, color: '#6b7280' }}>…and {group.items.length - 12} more</div>}
        </div>
      </Popup>
    </Marker>
  );
}

const escHtml = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// The product lifecycle, as on the app's Journey map: one numbered circle
// per place (steps in the same place share it), the place's name written
// beside it, and dashed lines as goods move: each material to the factory,
// then the factory onward. Every place's name is shown: each takes the
// first spot (right / left / above / below its circle, then a little
// further out) clear of other names, lifecycle circles and the map's
// buttons; activity bubbles may sit under a name. With no clear spot it
// goes to the right anyway. A click on a
// circle flies the map there and lists what happened there.
function LifecycleLayer({ steps }) {
  const map = useMap();
  const signature = JSON.stringify(steps);
  useEffect(() => {
    if (!steps.length) return undefined;
    const group = L.layerGroup().addTo(map);
    const line = (a, b) => L.polyline([a, b], { color: LIFECYCLE_COLOR, weight: 3, opacity: 0.85, dashArray: '6 6' }).addTo(group);
    const mats = steps.filter((p) => p.stage === 'materials');
    const rest = steps.filter((p) => p.stage !== 'materials');
    if (rest.length && mats.length) mats.forEach((m) => line([m.lat, m.lng], [rest[0].lat, rest[0].lng]));
    const chain = rest.length ? rest : steps;
    for (let i = 1; i < chain.length; i += 1) line([chain[i - 1].lat, chain[i - 1].lng], [chain[i].lat, chain[i].lng]);

    const places = [];
    const byKey = {};
    steps.forEach((p) => {
      const k = `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`;
      if (!byKey[k]) { byKey[k] = { lat: p.lat, lng: p.lng, n: places.length + 1, place: p.place, labels: [] }; places.push(byKey[k]); }
      byKey[k].labels.push(p.label);
    });
    const markers = places.map((s) => {
      const m = L.marker([s.lat, s.lng], {
        zIndexOffset: 1000,
        icon: L.divIcon({
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          html: `<div style="width:24px;height:24px;border-radius:12px;background:${LIFECYCLE_COLOR};color:#fff;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font:600 11px -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:pointer">${s.n}</div>`,
        }),
      }).addTo(group);
      if (s.place) m.bindTooltip(escHtml(s.place), { permanent: true, direction: 'right', offset: [12, 0], className: 'dpp-life-label' });
      m.bindPopup(`<b>${s.n}. ${escHtml(s.place || '')}</b><br>${s.labels.map(escHtml).join('<br>')}`);
      m.on('click', () => map.flyTo([s.lat, s.lng], Math.max(map.getZoom() + 3, 6), { duration: 0.8 }));
      return m;
    });

    const DIRS = [['right', [12, 0]], ['left', [-12, 0]], ['top', [0, -14]], ['bottom', [0, 14]], ['right', [12, -18]], ['right', [12, 18]], ['left', [-12, -18]], ['left', [-12, 18]], ['top', [0, -34]], ['bottom', [0, 34]]];
    const hit = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    const shrink = (r, d) => ({ left: r.left + d, right: r.right - d, top: r.top + d, bottom: r.bottom - d });
    const layout = () => {
      const container = map.getContainer();
      const box = container.getBoundingClientRect();
      const placed = [];
      // The lifecycle circles, and the map's own buttons and legend.
      markers.forEach((m) => { const e = m.getElement(); if (e) placed.push(shrink((e.firstChild || e).getBoundingClientRect(), 2)); });
      container.querySelectorAll('.leaflet-control, .dpp-map-ctl > div').forEach((c) => placed.push(c.getBoundingClientRect()));
      markers.forEach((m) => {
        const tt = m.getTooltip();
        if (!tt) return;
        let ok = false;
        for (let i = 0; i < DIRS.length && !ok; i += 1) {
          tt.options.direction = DIRS[i][0];
          tt.options.offset = DIRS[i][1];
          m.closeTooltip();
          m.openTooltip();
          const el = tt.getElement();
          if (el) {
            const r = el.getBoundingClientRect();
            const inside = r.left >= box.left + 2 && r.right <= box.right - 2 && r.top >= box.top + 2 && r.bottom <= box.bottom - 2;
            if (inside && !placed.some((q) => hit(r, q))) { placed.push(r); ok = true; }
          }
        }
        if (!ok) {
          // No clear spot: to the right anyway (a name is never left out).
          tt.options.direction = 'right';
          tt.options.offset = [12, 0];
          m.closeTooltip();
          m.openTooltip();
          const el = tt.getElement();
          if (el) placed.push(el.getBoundingClientRect());
        }
      });
    };
    let timer = null;
    const relayout = () => { clearTimeout(timer); timer = setTimeout(layout, 80); };
    map.on('zoomend moveend resize', relayout);
    relayout();
    return () => {
      clearTimeout(timer);
      map.off('zoomend moveend resize', relayout);
      group.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);
  return null;
}

// Where a product's story happened (OpenStreetMap). Recorded activity is
// grouped by place into bubbles (count inside, coloured by what happened,
// • for GPS or IP for an internet-address position); the lifecycle the
// brand entered is a numbered line of navy dots. Each point:
// { lat, lng, label, kind?, viaIp?, place }.
export default function ItemMap({ points = [], lifecycle = [], height = 360 }) {
  const [resetTick, setResetTick] = useState(0);
  const groups = useMemo(() => {
    const m = new Map();
    points.forEach((p) => {
      const k = key(p.lat, p.lng);
      if (!m.has(k)) m.set(k, { lat: p.lat, lng: p.lng, place: p.place, items: [], kinds: new Set(), viaIp: true, problem: false });
      const g = m.get(k);
      g.items.push(p);
      g.kinds.add(p.kind || 'genuine');
      if (!p.viaIp) g.viaIp = false;
      if (p.kind === 'problem') g.problem = true;
    });
    return [...m.values()].map((g) => ({ ...g, kind: g.kinds.size > 1 ? (g.problem && g.kinds.size === 1 ? 'problem' : 'mixed') : [...g.kinds][0] }));
  }, [points]);
  const planned = lifecycle.map((p) => [p.lat, p.lng]);
  const all = [...planned, ...groups.map((g) => [g.lat, g.lng])];
  return (
    <MapContainer center={all[0] || [20, 150]} zoom={2} zoomControl={false} scrollWheelZoom={false} worldCopyJump style={{ height, width: '100%', borderRadius: 8 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {groups.map((g) => <Bubble key={key(g.lat, g.lng)} group={g} />)}
      <LifecycleLayer steps={lifecycle} />
      <FitToPoints points={all} resetTick={resetTick} />
      <Controls onReset={() => setResetTick((n) => n + 1)} />
      <Legend showLifecycle={lifecycle.length > 0} />
    </MapContainer>
  );
}
