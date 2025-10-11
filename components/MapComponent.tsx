import React, { useEffect, useRef } from 'react';
import type { Coordinates, PointOfInterest } from '../types.ts';
import { POI_CATEGORY_ICONS } from '../constants.tsx';

// Use a global L from the script in index.html
declare const L: any;

// Fix for default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapComponentProps {
  center: Coordinates;
  pois: PointOfInterest[];
  radius: number;
  selectedPoiId: number | null;
}

export default function MapComponent({ center, pois, radius, selectedPoiId }: MapComponentProps): React.ReactElement {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any | null>(null);
  const layerGroupRef = useRef<any | null>(null);
  const markerRefs = useRef<Record<number, any>>({});


  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([center.lat, center.lon], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
      layerGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }
  }, []); // Run only once

  // Update view, center marker, and radius circle
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo([center.lat, center.lon], 14);

      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
        markerRefs.current = {};
      }

      // Add center marker
      L.marker([center.lat, center.lon]).addTo(layerGroupRef.current)
        .bindPopup('Your Location');

      // Add radius circle
      L.circle([center.lat, center.lon], {
        radius: radius,
        color: '#3b82f6',
        fillColor: '#60a5fa',
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(layerGroupRef.current);

      // Re-add POIs
      pois.forEach(poi => {
        const iconHtml = `<div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">${POI_CATEGORY_ICONS[poi.category]}</div>`;
        const poiIcon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });
        const marker = L.marker([poi.lat, poi.lon], { icon: poiIcon })
          .addTo(layerGroupRef.current)
          .bindPopup(`<b>${poi.tags.name || 'Point of Interest'}</b><br>${poi.tags.amenity || poi.tags.shop || ''}`);
        markerRefs.current[poi.id] = marker;
      });
    }
  }, [center, radius, pois]);

  // Handle POI selection highlight
  useEffect(() => {
    Object.values(markerRefs.current).forEach((marker: any) => {
        marker._icon.classList.remove('ring-4', 'ring-yellow-400', 'z-50');
    });

    if (selectedPoiId && markerRefs.current[selectedPoiId]) {
      const selectedMarker = markerRefs.current[selectedPoiId];
      selectedMarker._icon.classList.add('ring-4', 'ring-yellow-400', 'z-50');
      mapRef.current.flyTo(selectedMarker.getLatLng(), 16);
    }
  }, [selectedPoiId]);


  return (
    <div ref={mapContainerRef} className="w-full h-64 md:h-full rounded-lg" />
  );
}