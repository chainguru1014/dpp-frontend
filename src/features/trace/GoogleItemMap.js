import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { LIFECYCLE_COLOR } from './ItemMap';

// Set REACT_APP_GOOGLE_MAPS_KEY (a Google Cloud "Maps JavaScript API" key) to
// show Product Activity on Google Maps. Without it the page uses the
// OpenStreetMap map (ItemMap) instead.
export const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || '';

// The Google Maps script is added to the page once, the first time a map is shown.
let loading = null;
const loadGoogleMaps = () => {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&v=weekly`;
      script.async = true;
      script.onload = () => (window.google?.maps ? resolve(window.google.maps) : reject(new Error('Google Maps did not load')));
      script.onerror = () => {
        loading = null;
        reject(new Error('Google Maps did not load'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
};

// The same picture as ItemMap, on Google Maps: the lifecycle steps the brand
// entered (green dots joined by a line, in order) and what was actually
// recorded (a dot in each event's colour, no line). Each point: { lat, lng, label, color }.
export default function GoogleItemMap({ points = [], lifecycle = [], height = 360 }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  // Redraw only when the points themselves change, not on every render of the page.
  const signature = JSON.stringify([points, lifecycle]);

  useEffect(() => {
    let cancelled = false;
    const drawn = [];
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !ref.current) return;
        const map = new maps.Map(ref.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        });
        const bounds = new maps.LatLngBounds();
        const dot = (p, scale, color) => {
          const position = { lat: p.lat, lng: p.lng };
          bounds.extend(position);
          drawn.push(new maps.Marker({
            map,
            position,
            title: p.label,
            icon: { path: maps.SymbolPath.CIRCLE, scale, fillColor: color, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
          }));
        };

        if (lifecycle.length > 1) {
          drawn.push(new maps.Polyline({ map, path: lifecycle.map((p) => ({ lat: p.lat, lng: p.lng })), strokeColor: LIFECYCLE_COLOR, strokeWeight: 3 }));
        }
        lifecycle.forEach((p) => dot(p, 8, LIFECYCLE_COLOR));

        points.forEach((p, i) => dot(p, i === points.length - 1 ? 9 : 6, p.color));

        const count = lifecycle.length + points.length;
        if (count === 1) {
          map.setCenter(bounds.getCenter());
          map.setZoom(5);
        } else if (count > 1) {
          map.fitBounds(bounds, 40);
        }
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      drawn.forEach((item) => item.setMap(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  if (failed) {
    return <Alert severity="warning">Google Maps could not be loaded. Check the map key and your connection.</Alert>;
  }
  return <Box ref={ref} sx={{ height, width: '100%', borderRadius: 2, overflow: 'hidden', bgcolor: '#eef1f6' }} />;
}
