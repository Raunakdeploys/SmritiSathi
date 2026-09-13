import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CareCompassTelemetry, CareCompassConfig } from '../types';

interface LeafletLiveMapProps {
  telemetry: CareCompassTelemetry;
  config: CareCompassConfig;
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  zoomLevel: number;
  center: { lat: number; lng: number };
  onUpdateLocation?: (lat: number, lng: number) => void;
}

export const LeafletLiveMap: React.FC<LeafletLiveMapProps> = ({
  telemetry,
  config,
  mapType,
  zoomLevel,
  center,
  onUpdateLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const hybridOverlayRef = useRef<L.TileLayer | null>(null);

  // Layer groups for markers & geofence rings
  const geofenceLayerGroup = useRef<L.LayerGroup | null>(null);
  const breadcrumbsLayerGroup = useRef<L.LayerGroup | null>(null);
  const homeMarkerRef = useRef<L.Marker | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const connectionLineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;
    geofenceLayerGroup.current = L.layerGroup().addTo(map);
    breadcrumbsLayerGroup.current = L.layerGroup().addTo(map);

    // Map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onUpdateLocation) {
        onUpdateLocation(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layers when mapType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tiles
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (hybridOverlayRef.current) {
      map.removeLayer(hybridOverlayRef.current);
      hybridOverlayRef.current = null;
    }

    let url = '';
    let maxZoom = 19;
    let attribution = '';

    if (mapType === 'satellite') {
      // High-resolution real satellite imagery from space
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 19;
      attribution = 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, GeoEye';
    } else if (mapType === 'hybrid') {
      // Satellite base
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 19;
      attribution = 'Tiles © Esri & OpenStreetMap';

      // Roads & labels overlay
      const hybridOverlay = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 19,
          zIndex: 10,
        }
      ).addTo(map);
      hybridOverlayRef.current = hybridOverlay;
    } else if (mapType === 'terrain') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      maxZoom = 17;
      attribution = 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap';
    } else {
      // Normal Roadmap (OpenStreetMap)
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 19;
      attribution = '© OpenStreetMap contributors';
    }

    const tileLayer = L.tileLayer(url, {
      maxZoom,
      attribution,
    }).addTo(map);
    tileLayerRef.current = tileLayer;
  }, [mapType]);

  // Sync Center & Zoom
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], zoomLevel, { animate: true });
  }, [center.lat, center.lng, zoomLevel]);

  // Render Geofence Overlays, Home Base Pin, Elder Pin, and Vector Trail
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geofenceLayerGroup.current) return;

    geofenceLayerGroup.current.clearLayers();

    const homeLat = config.homeLocation.latitude;
    const homeLng = config.homeLocation.longitude;
    const elderLat = telemetry.latitude;
    const elderLng = telemetry.longitude;

    // 1. Safe Zone Circle (Green, 300m)
    L.circle([homeLat, homeLng], {
      radius: config.safeRadiusMeters,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.15,
      weight: 2.5,
      dashArray: '6, 6',
    })
      .bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;padding:4px">
          <strong style="color:#059669">🛡️ Safe Zone Perimeter (${config.safeRadiusMeters}m)</strong><br/>
          Centered at: ${config.homeLocation.label}
        </div>`
      )
      .addTo(geofenceLayerGroup.current);

    // 2. Alert Perimeter Circle (Red, 600m)
    L.circle([homeLat, homeLng], {
      radius: config.alertRadiusMeters,
      color: '#f43f5e',
      fillColor: '#f43f5e',
      fillOpacity: 0.08,
      weight: 2.5,
      dashArray: '8, 8',
    })
      .bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;padding:4px">
          <strong style="color:#e11d48">🚨 Alert Radar Boundary (${config.alertRadiusMeters}m)</strong><br/>
          Exceeding this boundary triggers automated WhatsApp SOS and emergency alarms.
        </div>`
      )
      .addTo(geofenceLayerGroup.current);

    // 3. Elder GPS Accuracy Circle
    if (telemetry.accuracy && telemetry.accuracy > 0) {
      L.circle([elderLat, elderLng], {
        radius: Math.min(100, telemetry.accuracy),
        color: '#38bdf8',
        fillColor: '#38bdf8',
        fillOpacity: 0.18,
        weight: 1.5,
      }).addTo(geofenceLayerGroup.current);
    }

    // 4. Directional Line from Home to Elder
    if (connectionLineRef.current) {
      map.removeLayer(connectionLineRef.current);
    }
    const connectionLine = L.polyline(
      [
        [homeLat, homeLng],
        [elderLat, elderLng],
      ],
      {
        color:
          telemetry.geofenceStatus === 'CRITICAL_BREACH'
            ? '#f43f5e'
            : telemetry.geofenceStatus === 'WARNING_BORDER'
            ? '#f59e0b'
            : '#0284c7',
        weight: 2.5,
        opacity: 0.85,
        dashArray: '5, 8',
      }
    ).addTo(geofenceLayerGroup.current);
    connectionLineRef.current = connectionLine;

    // 5. Pointed Custom Home Base Marker
    const homeIconHtml = `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#ff6321,#ea580c);border:2px solid #ffffff;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#ffffff;box-shadow:0 8px 20px rgba(0,0,0,0.4);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #ea580c;margin-top:-2px;"></div>
        <div style="margin-top:2px;background:#0f172a;color:#ffffff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;border:1px solid #334155;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.3);">
          ${config.homeLocation.city || 'Home Base'}
        </div>
      </div>
    `;

    const homeIcon = L.divIcon({
      html: homeIconHtml,
      className: 'custom-home-pin',
      iconSize: [40, 60],
      iconAnchor: [20, 44],
      popupAnchor: [0, -44],
    });

    if (homeMarkerRef.current) {
      homeMarkerRef.current.setLatLng([homeLat, homeLng]);
      homeMarkerRef.current.setIcon(homeIcon);
    } else {
      homeMarkerRef.current = L.marker([homeLat, homeLng], { icon: homeIcon })
        .bindPopup(
          `<div style="font-family:sans-serif;font-size:12px;padding:4px">
            <strong style="color:#ff6321">🏠 Fixed Radar Center: ${config.homeLocation.label}</strong><br/>
            <span>Area: ${config.homeLocation.area || 'Home Radar Origin'}</span><br/>
            <span>Coords: ${homeLat.toFixed(6)}, ${homeLng.toFixed(6)}</span><br/>
            <span style="color:#10b981">Safe Radius: ${config.safeRadiusMeters}m</span> | 
            <span style="color:#f43f5e">Alert: ${config.alertRadiusMeters}m</span>
          </div>`
        )
        .addTo(geofenceLayerGroup.current);
    }

    // 6. Pointed Custom Elder / Live Device Marker
    const isBreach = telemetry.geofenceStatus === 'CRITICAL_BREACH';
    const isWarn = telemetry.geofenceStatus === 'WARNING_BORDER';
    const markerColor = isBreach ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981';

    const patientIconHtml = `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <!-- Pulsing beacon wave -->
        <div style="position:absolute;width:48px;height:48px;border-radius:50%;background:${markerColor};opacity:0.35;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;top:-6px;"></div>
        
        <!-- Pointed Pin Box -->
        <div style="position:relative;width:38px;height:38px;background:${markerColor};border:2.5px solid #ffffff;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#ffffff;box-shadow:0 8px 24px rgba(0,0,0,0.5);">
          <!-- Heading orientation arrow -->
          <svg style="transform:rotate(${telemetry.bearingDegrees || 0}deg);transition:transform 0.4s ease;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${markerColor};margin-top:-2px;"></div>
        <div style="margin-top:2px;background:#0f172a;color:#ffffff;font-size:10px;font-weight:900;padding:2px 8px;border-radius:6px;border:1.5px solid ${markerColor};white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
          ${config.patientName} (${Math.round(telemetry.distanceMeters)}m)
        </div>
      </div>
    `;

    const patientIcon = L.divIcon({
      html: patientIconHtml,
      className: 'custom-patient-pin',
      iconSize: [44, 64],
      iconAnchor: [22, 46],
      popupAnchor: [0, -46],
    });

    if (patientMarkerRef.current) {
      patientMarkerRef.current.setLatLng([elderLat, elderLng]);
      patientMarkerRef.current.setIcon(patientIcon);
    } else {
      patientMarkerRef.current = L.marker([elderLat, elderLng], { icon: patientIcon })
        .bindPopup(
          `<div style="font-family:sans-serif;font-size:12px;padding:4px">
            <strong style="color:${markerColor}">📍 ${config.patientName} (Live GPS Position)</strong><br/>
            <span>Distance to Home: <strong>${Math.round(telemetry.distanceMeters)}m</strong> (${telemetry.bearingText})</span><br/>
            <span>Status: <strong>${telemetry.geofenceStatus}</strong></span><br/>
            <span>Accuracy: ±${telemetry.accuracy}m | Speed: ${telemetry.speedKmh || 0} km/h</span><br/>
            <span>Updated: ${telemetry.lastUpdated}</span>
          </div>`
        )
        .addTo(geofenceLayerGroup.current);
    }
  }, [
    config.homeLocation.latitude,
    config.homeLocation.longitude,
    config.homeLocation.label,
    config.homeLocation.city,
    config.safeRadiusMeters,
    config.alertRadiusMeters,
    telemetry.latitude,
    telemetry.longitude,
    telemetry.distanceMeters,
    telemetry.bearingDegrees,
    telemetry.bearingText,
    telemetry.geofenceStatus,
    telemetry.accuracy,
    telemetry.speedKmh,
    telemetry.lastUpdated,
  ]);

  // Render Historical Breadcrumb Dots
  useEffect(() => {
    if (!breadcrumbsLayerGroup.current) return;
    breadcrumbsLayerGroup.current.clearLayers();

    if (telemetry.breadcrumbs && telemetry.breadcrumbs.length > 0) {
      telemetry.breadcrumbs.forEach((crumb) => {
        L.circleMarker([crumb.latitude, crumb.longitude], {
          radius: 4,
          color: crumb.status === 'CRITICAL_BREACH' ? '#f43f5e' : '#38bdf8',
          fillColor: crumb.status === 'CRITICAL_BREACH' ? '#f43f5e' : '#0284c7',
          fillOpacity: 0.7,
          weight: 1.5,
        })
          .bindPopup(
            `<div style="font-size:11px">
              <strong>Breadcrumb (${crumb.timestamp})</strong><br/>
              Distance: ${Math.round(crumb.distanceMeters)}m<br/>
              Status: ${crumb.status}
            </div>`
          )
          .addTo(breadcrumbsLayerGroup.current!);
      });
    }
  }, [telemetry.breadcrumbs]);

  return (
    <div
      ref={mapContainerRef}
      id="leaflet-live-map-container"
      className="w-full h-full min-h-[460px] bg-slate-950 z-0"
    />
  );
};
