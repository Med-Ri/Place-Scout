import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { hasValidCoordinates } from '../utils.js';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

function businessKey(business) {
  return business._id ?? business.id ?? business.name;
}

export function ResultsMap({ businesses, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const layerRef = useRef(null);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const mappable = (businesses || []).filter(hasValidCoordinates);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    map.setView([36.8065, 10.1815], 6);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markersRef.current = new Map();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersRef.current = new Map();

    const points = (businesses || []).filter(hasValidCoordinates);

    if (points.length === 0) {
      map.setView([36.8065, 10.1815], 6);
      return;
    }

    const bounds = L.latLngBounds([]);

    points.forEach((business) => {
      const id = businessKey(business);
      const marker = L.marker([business.latitude, business.longitude], {
        title: business.name,
      });

      marker.bindPopup(
        `<strong>${escapeHtml(business.name)}</strong>${
          business.category
            ? `<br/><span>${escapeHtml(business.category)}</span>`
            : ''
        }`,
      );

      marker.on('click', () => {
        onSelectRef.current?.(business);
      });

      marker.addTo(layer);
      markersRef.current.set(id, marker);
      bounds.extend([business.latitude, business.longitude]);
    });

    map.fitBounds(bounds.pad(0.2));
    map.invalidateSize();
  }, [businesses]);

  useEffect(() => {
    if (!selectedId) return;
    const marker = markersRef.current.get(selectedId);
    const map = mapRef.current;
    if (!marker || !map) return;

    const { lat, lng } = marker.getLatLng();
    map.panTo([lat, lng], { animate: true });
    marker.openPopup();
  }, [selectedId]);

  return (
    <div className="map-panel">
      {mappable.length === 0 ? (
        <p className="map-panel__banner" role="status">
          No businesses in this search have map coordinates.
        </p>
      ) : null}
      <div
        ref={containerRef}
        className="map-panel__canvas"
        role="region"
        aria-label="Map of search results"
      />
    </div>
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
