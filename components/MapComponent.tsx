import React, { useEffect, useRef } from 'react';
import type { Coordinates, PointOfInterest } from '../types.ts';
import { POI_CATEGORY_ICONS, POI_MAP_COLORS } from '../constants.tsx';

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
  const clusterGroupRef = useRef<any | null>(null);
  const centerMarkerRef = useRef<any | null>(null);
  const radiusCircleRef = useRef<any | null>(null);
  const markerRefs = useRef<Record<number, any>>({});

  // Initialize map (Run once)
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // CRITICAL FIX: preferCanvas forces vector layers (circles) to render on Canvas instead of SVG.
      // This solves the issue where html2canvas renders the circle offset from the marker.
      // We also disable animations to ensure the DOM state is simple and static for capture.
      mapRef.current = L.map(mapContainerRef.current, {
        preferCanvas: true,
        zoomAnimation: false,
        markerZoomAnimation: false,
        fadeAnimation: false
      }).setView([center.lat, center.lon], 14);

      const portugalBounds = L.latLngBounds(L.latLng(36.5, -10.0), L.latLng(42.5, -6.0));
      mapRef.current.setMaxBounds(portugalBounds);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 7,
        crossOrigin: true, 
      }).addTo(mapRef.current);
      
      clusterGroupRef.current = L.markerClusterGroup({
        iconCreateFunction: function(cluster: any) {
          const count = cluster.getChildCount();
          let size = ' w-10 h-10';
          if (count > 10) size = ' w-12 h-12';
          if (count > 100) size = ' w-14 h-14';
          return L.divIcon({
            html: `<div class="rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-lg${size}"><span>${count}</span></div>`,
            className: '',
            iconSize: L.point(40, 40, true),
          });
        }
      });
      mapRef.current.addLayer(clusterGroupRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect 1: Update View and Center Marker when center changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Use setView instead of flyTo when animations are disabled for instant snapping
    mapRef.current.setView([center.lat, center.lon], 14);

    if (!centerMarkerRef.current) {
        centerMarkerRef.current = L.marker([center.lat, center.lon]).addTo(mapRef.current).bindPopup('A sua morada');
    } else {
        centerMarkerRef.current.setLatLng([center.lat, center.lon]);
    }
  }, [center]);

  // Effect 2: Update Radius Circle when center or radius changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (!radiusCircleRef.current) {
        radiusCircleRef.current = L.circle([center.lat, center.lon], {
            radius: radius, color: '#3b82f6', fillColor: '#60a5fa', fillOpacity: 0.1, weight: 1,
        }).addTo(mapRef.current);
    } else {
        radiusCircleRef.current.setLatLng([center.lat, center.lon]);
        radiusCircleRef.current.setRadius(radius);
    }
  }, [center, radius]);

  // Effect 3: Update POI Markers only when POIs list changes
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    clusterGroupRef.current.clearLayers();
    markerRefs.current = {};

    pois.forEach(poi => {
        const bgColor = POI_MAP_COLORS[poi.category] || 'bg-gray-500';
        const iconHtml = `<div class="w-8 h-8 rounded-full ${bgColor} text-white flex items-center justify-center shadow-md p-1.5">${POI_CATEGORY_ICONS[poi.category]}</div>`;
        const poiIcon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });
        const marker = L.marker([poi.lat, poi.lon], { icon: poiIcon })
          .bindPopup(`<b>${poi.tags.name || poi.tags.ref || 'Ponto de Interesse'}</b><br>${poi.category}`);
        
        clusterGroupRef.current.addLayer(marker);
        markerRefs.current[poi.id] = marker;
      });
  }, [pois]);

  // Effect 4: Handle Selection Highlight
  useEffect(() => {
    Object.values(markerRefs.current).forEach((marker: any) => {
        if (marker._icon) {
            marker._icon.classList.remove('ring-4', 'ring-yellow-400', 'z-50');
        }
    });

    if (selectedPoiId && markerRefs.current[selectedPoiId] && clusterGroupRef.current) {
      const selectedMarker = markerRefs.current[selectedPoiId];
      clusterGroupRef.current.zoomToShowLayer(selectedMarker, () => {
          if (selectedMarker._icon) {
            selectedMarker._icon.classList.add('ring-4', 'ring-yellow-400', 'z-50');
          }
      });
    }
  }, [selectedPoiId]);

  return (
    <div ref={mapContainerRef} className="w-full h-64 md:h-full rounded-lg" />
  );
}