import React, { useState, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import {
  Navigation,
  Home,
  Layers,
  Share2,
  ExternalLink,
  Key,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Compass,
  MapPin,
  CheckCircle,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Locate,
  Send,
  Phone,
  Crosshair,
  Satellite,
  Globe,
  Mountain,
  Map as MapIcon,
  Search,
  Loader2,
} from 'lucide-react';
import type {
  CareCompassTelemetry,
  CareCompassConfig,
  GeofenceZoneStatus,
} from '../types';
import {
  INITIAL_CARE_COMPASS_CONFIG,
  INITIAL_CARE_COMPASS_TELEMETRY,
} from '../services/storeService';
import {
  calculateHaversineDistanceMeters,
  calculateBearingDegrees,
  degreesToCompassText,
  determineGeofenceStatus,
  generateWhatsAppSOSUrl,
  searchGeocodeAddress,
} from '../utils/geoUtils';
import { GoogleMapsGeofenceOverlays } from './GoogleMapsGeofenceOverlays';
import { LeafletLiveMap } from './LeafletLiveMap';
import {
  deviceLocationService,
  DeviceLocationState,
} from '../services/deviceLocationService';
import { sosDispatchService } from '../services/sosDispatchService';

interface MapModuleProps {
  telemetry?: CareCompassTelemetry;
  config?: CareCompassConfig;
  onUpdateLocation?: (lat: number, lng: number) => void;
  onOpenKeyModal?: () => void;
  className?: string;
  isSimulating?: boolean;
}

export type GoogleMapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
export type ViewMode = 'live_map' | 'google_maps' | 'radar_hud';

export const MapModule: React.FC<MapModuleProps> = ({
  telemetry: propTelemetry,
  config: propConfig,
  onUpdateLocation,
  onOpenKeyModal,
  className = '',
  isSimulating = false,
}) => {
  const telemetry = propTelemetry || INITIAL_CARE_COMPASS_TELEMETRY;
  const config = propConfig || INITIAL_CARE_COMPASS_CONFIG;

  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
      config.googleMapsApiKey ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('cc_google_maps_api_key') || ''
        : '')
    );
  });

  const [viewMode, setViewMode] = useState<ViewMode>(apiKey ? 'google_maps' : 'live_map');
  const [googleMapType, setGoogleMapType] = useState<GoogleMapType>('hybrid');
  const [copiedLink, setCopiedLink] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(16);
  const [sosSuccessBanner, setSosSuccessBanner] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: telemetry.latitude,
    lng: telemetry.longitude,
  });

  // Address search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Marker Info Window state
  const [activeMarkerInfo, setActiveMarkerInfo] = useState<'home' | 'patient' | null>(null);

  // Live Device GPS state
  const [deviceGpsState, setDeviceGpsState] = useState<DeviceLocationState>(() =>
    deviceLocationService.getState()
  );

  // Sync with deviceLocationService
  useEffect(() => {
    const unsub = deviceLocationService.subscribe((state) => {
      setDeviceGpsState(state);
    });
    return () => unsub();
  }, []);

  // Synchronize API key changes
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('cc_google_maps_api_key');
      const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
      const active = stored || envKey || config.googleMapsApiKey || '';
      setApiKey(active);
      if (active) setViewMode('google_maps');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cc_maps_key_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cc_maps_key_updated', handleStorageChange);
    };
  }, [config.googleMapsApiKey]);

  // Keep mapCenter synchronized when telemetry coordinates change substantially
  useEffect(() => {
    setMapCenter({
      lat: telemetry.latitude,
      lng: telemetry.longitude,
    });
  }, [telemetry.latitude, telemetry.longitude]);

  const handleToggleDeviceGps = async () => {
    if (deviceGpsState.isWatching) {
      deviceLocationService.stopTracking();
    } else {
      await deviceLocationService.startTracking();
    }
  };

  const handleSetCurrentAsHomeBase = () => {
    const success = deviceLocationService.setCurrentLocationAsHomeBase(
      `Calibrated Device Home Base (${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})`
    );
    if (!success && onUpdateLocation) {
      // Fallback: set current telemetry coordinates as home
      const newHome = {
        label: 'Calibrated Device Home Base',
        city: config.homeLocation.city || 'Local Area',
        area: 'Calibrated Physical Location',
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
      };
      // Trigger update
      window.dispatchEvent(
        new CustomEvent('cc_set_home_base', { detail: newHome })
      );
    }
  };

  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchingAddress(true);
    setSearchError(null);
    try {
      const result = await searchGeocodeAddress(searchQuery.trim());
      if (result) {
        setMapCenter({ lat: result.lat, lng: result.lng });
        setZoomLevel(17);
        if (onUpdateLocation) {
          onUpdateLocation(result.lat, result.lng);
        }
        window.dispatchEvent(
          new CustomEvent('cc_set_home_base', {
            detail: {
              label: `Home Base (${result.city})`,
              city: result.city,
              area: result.displayName.split(',').slice(0, 2).join(', '),
              latitude: result.lat,
              longitude: result.lng,
            },
          })
        );
        setSearchQuery('');
      } else {
        setSearchError(`Location "${searchQuery}" not found. Try a city or street name.`);
      }
    } catch (err) {
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleCenterOnPatient = () => {
    setMapCenter({
      lat: telemetry.latitude,
      lng: telemetry.longitude,
    });
    setZoomLevel(17);
  };

  const handleCenterOnHome = () => {
    setMapCenter({
      lat: config.homeLocation.latitude,
      lng: config.homeLocation.longitude,
    });
    setZoomLevel(16);
  };

  const handleShareLiveUrl = () => {
    const url = `https://maps.google.com/?q=${telemetry.latitude.toFixed(6)},${telemetry.longitude.toFixed(6)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleDispatchAutomatedSOS = () => {
    const sosData = generateWhatsAppSOSUrl({
      caregiverPhone: config.caregiverPhone,
      patientName: config.patientName,
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      distanceMeters: telemetry.distanceMeters,
      homeLabel: config.homeLocation.label,
      batteryLevel: telemetry.batteryLevel,
      cause: 'Tactical Map Module Automated SOS Dispatched',
    });

    // Auto-open WhatsApp with pre-composed coordinates and alert details
    try {
      window.open(sosData.url, '_blank');
    } catch (e) {
      console.warn('WhatsApp auto open error:', e);
    }

    // Auto-trigger native phone dialer
    try {
      window.location.href = sosData.telUrl;
    } catch (e) {
      console.warn('Phone dialer trigger error:', e);
    }

    sosDispatchService
      .dispatchAutomatedSOSMessage({
        patientName: config.patientName,
        caregiverPhone: config.caregiverPhone,
        caregiverName: config.caregiverName,
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        distanceMeters: telemetry.distanceMeters,
        homeLabel: config.homeLocation.label,
        batteryLevel: telemetry.batteryLevel,
        cause: 'Tactical Map Module Automated SOS Dispatched',
      })
      .then((res) => {
        setSosSuccessBanner(`Automated SOS Triggered: WhatsApp & Call to ${config.caregiverName} (${config.caregiverPhone}) • Ref: ${res.dispatchId}`);
        setTimeout(() => setSosSuccessBanner(null), 6000);
      })
      .catch((e) => {
        console.warn('Map SOS dispatch handled:', e);
      });
  };

  const openGoogleDirections = () => {
    const origin = `${telemetry.latitude},${telemetry.longitude}`;
    const destination = `${config.homeLocation.latitude},${config.homeLocation.longitude}`;
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`,
      '_blank'
    );
  };

  const getStatusBadge = (status: GeofenceZoneStatus) => {
    switch (status) {
      case 'SAFE_ZONE':
        return {
          label: `SAFE ZONE (< ${config.safeRadiusMeters}m)`,
          bg: 'bg-emerald-600',
          border: 'border-emerald-400',
          text: 'text-emerald-100',
          icon: ShieldCheck,
        };
      case 'WARNING_BORDER':
        return {
          label: `WARNING BORDER (< ${config.alertRadiusMeters}m)`,
          bg: 'bg-amber-600',
          border: 'border-amber-400',
          text: 'text-amber-100',
          icon: AlertTriangle,
        };
      case 'CRITICAL_BREACH':
        return {
          label: 'CRITICAL PERIMETER BREACH',
          bg: 'bg-rose-600 animate-pulse',
          border: 'border-rose-400',
          text: 'text-rose-100',
          icon: Radio,
        };
    }
  };

  const statusBadge = getStatusBadge(telemetry.geofenceStatus);
  const StatusIcon = statusBadge.icon;

  return (
    <div
      id="carecompass-live-map-container"
      className={`relative w-full rounded-3xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-2xl flex flex-col ${className}`}
    >
      {/* Top Map Toolbar: Mode, Status, and Controls */}
      <div className="bg-slate-900/95 backdrop-blur-md px-3.5 sm:px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 z-20">
        {/* Left: Geofence Status and Radar Anchor */}
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 flex items-center justify-center shadow-inner">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>Fixed Radar Center:</span>
                <span className="text-[#FF6321]">{config.homeLocation.city || 'Home Radar Base'}</span>
              </h3>
              {isSimulating && (
                <span className="text-[9px] font-extrabold uppercase tracking-wider bg-indigo-900/90 text-indigo-200 border border-indigo-500/50 px-1.5 py-0.5 rounded-full">
                  Simulating
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-[320px]">
              {config.homeLocation.label}
            </p>
          </div>
        </div>

        {/* Center: Live Status Badge */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-black shadow-md ${statusBadge.bg} ${statusBadge.border} ${statusBadge.text}`}
        >
          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{statusBadge.label}</span>
          <span className="font-mono text-xs opacity-90 pl-1">
            • {Math.round(telemetry.distanceMeters)}m
          </span>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center space-x-1.5 flex-wrap">
          {/* Live Device GPS Tracking Toggle Button */}
          <button
            onClick={handleToggleDeviceGps}
            title={
              deviceGpsState.isWatching
                ? 'Device GPS active - click to stop'
                : 'Start tracking actual device GPS location'
            }
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              deviceGpsState.isWatching
                ? 'bg-emerald-600/90 border-emerald-400 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Locate className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {deviceGpsState.isWatching
                ? `GPS Active (±${deviceGpsState.accuracy || telemetry.accuracy}m)`
                : 'Track My Device'}
            </span>
          </button>

          {/* Set Device Location as Home Base */}
          <button
            onClick={handleSetCurrentAsHomeBase}
            title="Calibrate: Set current device GPS location as Fixed Home Radar Base"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Set Home to Here</span>
          </button>

          {/* Center on Elder */}
          <button
            onClick={handleCenterOnPatient}
            title="Center View on Elder (Dadaji)"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Elder</span>
          </button>

          {/* Center on Home */}
          <button
            onClick={handleCenterOnHome}
            title="Center View on Fixed Radar Home Base"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
          >
            <Home className="w-3.5 h-3.5 text-[#FF6321]" />
            <span className="hidden sm:inline">Home</span>
          </button>

          {/* Automated SOS (0 Taps Required) */}
          <button
            onClick={handleDispatchAutomatedSOS}
            title="Dispatch Instant Automated SOS with Coordinates (0 Manual Taps Required)"
            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Automated SOS</span>
          </button>

          {/* Share Live Link */}
          <button
            onClick={handleShareLiveUrl}
            title="Copy Live Google Maps Coordinates Link"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            {copiedLink ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          {/* Open Google Directions */}
          <button
            onClick={openGoogleDirections}
            title="Open Walking Directions to Home on Google Maps"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-sky-400" />
          </button>

          {/* Key Modal Button */}
          {onOpenKeyModal && (
            <button
              onClick={onOpenKeyModal}
              title="Configure Google Maps API Key"
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                apiKey
                  ? 'bg-sky-950 border-sky-500/50 text-sky-300 hover:bg-sky-900'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Key className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Address Search & Real-Time Geolocation Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/90 px-3.5 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs z-15">
        <form onSubmit={handleSearchAddress} className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any city or address to center map (e.g., Delhi, Mumbai, New York, London)..."
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingAddress}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            {isSearchingAddress ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Locate</span>
          </button>
        </form>

        {searchError && (
          <span className="text-rose-400 text-[11px] font-medium animate-pulse">{searchError}</span>
        )}

        {/* Live Location Quick Connect Chip */}
        <div className="flex items-center gap-2 shrink-0">
          {!deviceGpsState.isWatching ? (
            <button
              onClick={handleToggleDeviceGps}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Locate className="w-3.5 h-3.5" />
              <span>Connect Live GPS</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-xl text-emerald-300 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Live GPS: ±{deviceGpsState.accuracy || telemetry.accuracy}m</span>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Map Type Selector Bar: Normal, Satellite, Hybrid, Terrain, Tactical Radar */}
      <div className="bg-slate-950/90 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto text-xs z-10">
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] hidden sm:inline mr-1">
            Map Layer:
          </span>

          {/* Normal / Roadmap */}
          <button
            onClick={() => {
              if (viewMode === 'radar_hud') setViewMode(apiKey ? 'google_maps' : 'live_map');
              setGoogleMapType('roadmap');
            }}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              viewMode !== 'radar_hud' && googleMapType === 'roadmap'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Normal (Roadmap)</span>
          </button>

          {/* Satellite Imagery */}
          <button
            onClick={() => {
              if (viewMode === 'radar_hud') setViewMode(apiKey ? 'google_maps' : 'live_map');
              setGoogleMapType('satellite');
            }}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              viewMode !== 'radar_hud' && googleMapType === 'satellite'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>

          {/* Hybrid (Satellite + Labels) */}
          <button
            onClick={() => {
              if (viewMode === 'radar_hud') setViewMode(apiKey ? 'google_maps' : 'live_map');
              setGoogleMapType('hybrid');
            }}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              viewMode !== 'radar_hud' && googleMapType === 'hybrid'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Hybrid</span>
          </button>

          {/* Terrain */}
          <button
            onClick={() => {
              if (viewMode === 'radar_hud') setViewMode(apiKey ? 'google_maps' : 'live_map');
              setGoogleMapType('terrain');
            }}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              viewMode !== 'radar_hud' && googleMapType === 'terrain'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Terrain</span>
          </button>

          {/* Tactical Vector Radar */}
          <button
            onClick={() => setViewMode('radar_hud')}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'radar_hud'
                ? 'bg-[#002045] text-sky-300 border border-sky-400 shadow-sm'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
            <span>Tactical Radar HUD</span>
          </button>
        </div>

        {/* Live Coordinates Readout */}
        <div className="font-mono text-[11px] text-slate-400 hidden xl:flex items-center space-x-2">
          <span>Lat: {telemetry.latitude.toFixed(6)}</span>
          <span>•</span>
          <span>Lng: {telemetry.longitude.toFixed(6)}</span>
        </div>
      </div>

      {/* Main Geofence Map Viewport */}
      <div className="relative w-full h-[460px] sm:h-[540px] bg-slate-950 overflow-hidden">
        {viewMode === 'google_maps' && apiKey ? (
          <APIProvider apiKey={apiKey}>
            <Map
              center={mapCenter}
              zoom={zoomLevel}
              mapTypeId={googleMapType}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              gestureHandling="greedy"
              disableDefaultUI={false}
              className="w-full h-full"
              onClick={(e) => {
                if (e.detail.latLng && onUpdateLocation) {
                  onUpdateLocation(e.detail.latLng.lat, e.detail.latLng.lng);
                }
              }}
            >
              {/* Native Google Maps Geofencing Circles (Safe Zone 300m, Alert Perimeter 600m) */}
              <GoogleMapsGeofenceOverlays
                homeLat={config.homeLocation.latitude}
                homeLng={config.homeLocation.longitude}
                currentLat={telemetry.latitude}
                currentLng={telemetry.longitude}
                safeRadiusMeters={config.safeRadiusMeters}
                alertRadiusMeters={config.alertRadiusMeters}
                accuracyMeters={telemetry.accuracy}
                breadcrumbs={telemetry.breadcrumbs}
              />

              {/* Pointed Location: Home Base Fixed Radar Center Marker */}
              <AdvancedMarker
                position={{
                  lat: config.homeLocation.latitude,
                  lng: config.homeLocation.longitude,
                }}
                onClick={() => setActiveMarkerInfo('home')}
                title={`Home Base: ${config.homeLocation.label}`}
              >
                <div className="relative group cursor-pointer flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6321] to-[#EA580C] border-2 border-white shadow-2xl flex items-center justify-center text-white transition-transform hover:scale-110">
                    <Home className="w-5 h-5" />
                  </div>
                  {/* Pointed Bottom Arrow */}
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#EA580C] -mt-0.5" />
                  <span className="mt-1 text-[10px] font-black text-white bg-slate-950/95 px-2 py-0.5 rounded-md border border-slate-700 whitespace-nowrap shadow-lg">
                    Fixed Radar Center
                  </span>
                </div>
              </AdvancedMarker>

              {/* Pointed Location: Elder / Live Device Location Marker */}
              <AdvancedMarker
                position={{
                  lat: telemetry.latitude,
                  lng: telemetry.longitude,
                }}
                onClick={() => setActiveMarkerInfo('patient')}
                title={`${config.patientName} (${Math.round(telemetry.distanceMeters)}m from Home)`}
              >
                <div className="relative group cursor-pointer flex flex-col items-center">
                  {/* Pulsing Beacon Wave */}
                  <div
                    className={`absolute w-12 h-12 rounded-full animate-ping pointer-events-none -top-1 ${
                      telemetry.geofenceStatus === 'CRITICAL_BREACH'
                        ? 'bg-rose-500/70'
                        : telemetry.geofenceStatus === 'WARNING_BORDER'
                        ? 'bg-amber-500/60'
                        : 'bg-emerald-500/60'
                    }`}
                  />

                  {/* Pointed Marker Box with Heading Arrow */}
                  <div
                    style={{ transform: `rotate(${telemetry.bearingDegrees}deg)` }}
                    className={`w-10 h-10 rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center text-white transition-transform duration-300 ${
                      telemetry.geofenceStatus === 'CRITICAL_BREACH'
                        ? 'bg-rose-600'
                        : telemetry.geofenceStatus === 'WARNING_BORDER'
                        ? 'bg-amber-600'
                        : 'bg-emerald-600'
                    }`}
                  >
                    <Navigation className="w-5 h-5 -rotate-45" />
                  </div>

                  {/* Pointed Bottom Arrow */}
                  <div
                    className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-0.5 ${
                      telemetry.geofenceStatus === 'CRITICAL_BREACH'
                        ? 'border-t-rose-600'
                        : telemetry.geofenceStatus === 'WARNING_BORDER'
                        ? 'border-t-amber-600'
                        : 'border-t-emerald-600'
                    }`}
                  />

                  {/* Coordinates & Name Badge */}
                  <div className="mt-1 text-[10px] font-black text-white bg-slate-950/95 px-2.5 py-0.5 rounded-md border border-slate-600 whitespace-nowrap shadow-xl flex items-center gap-1">
                    <span>{config.patientName}</span>
                    <span className="font-mono text-emerald-400">
                      {Math.round(telemetry.distanceMeters)}m
                    </span>
                  </div>
                </div>
              </AdvancedMarker>

              {/* Info Window for Home Base */}
              {activeMarkerInfo === 'home' && (
                <InfoWindow
                  position={{
                    lat: config.homeLocation.latitude,
                    lng: config.homeLocation.longitude,
                  }}
                  onCloseClick={() => setActiveMarkerInfo(null)}
                >
                  <div className="p-2 text-slate-900 space-y-1">
                    <h4 className="font-black text-sm text-[#FF6321] flex items-center gap-1">
                      <Home className="w-4 h-4" />
                      <span>{config.homeLocation.label}</span>
                    </h4>
                    <p className="text-xs text-slate-600">
                      Fixed Radar Anchor: {config.homeLocation.area}, {config.homeLocation.city}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Safe Radius: {config.safeRadiusMeters}m | Alert Radius: {config.alertRadiusMeters}m
                    </p>
                  </div>
                </InfoWindow>
              )}

              {/* Info Window for Patient */}
              {activeMarkerInfo === 'patient' && (
                <InfoWindow
                  position={{
                    lat: telemetry.latitude,
                    lng: telemetry.longitude,
                  }}
                  onCloseClick={() => setActiveMarkerInfo(null)}
                >
                  <div className="p-2 text-slate-900 space-y-1">
                    <h4 className="font-black text-sm text-emerald-700 flex items-center gap-1">
                      <Radio className="w-4 h-4" />
                      <span>{config.patientName} - Live GPS Point</span>
                    </h4>
                    <p className="text-xs text-slate-700">
                      Distance to Home: <strong>{Math.round(telemetry.distanceMeters)}m</strong> ({telemetry.bearingText})
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      Accuracy: ±{telemetry.accuracy}m | Speed: {telemetry.speedKmh || 0} km/h
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Updated: {telemetry.lastUpdated}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        ) : viewMode === 'radar_hud' ? (
          /* High-Fidelity Tactical Vector Radar Engine */
          <InteractiveGeofenceEngine
            telemetry={telemetry}
            config={config}
            viewMode={viewMode}
            onUpdateLocation={onUpdateLocation}
            onOpenKeyModal={onOpenKeyModal}
          />
        ) : (
          /* Authentic Live Satellite & Normal Street Map */
          <LeafletLiveMap
            telemetry={telemetry}
            config={config}
            mapType={googleMapType}
            zoomLevel={zoomLevel}
            center={mapCenter}
            onUpdateLocation={onUpdateLocation}
          />
        )}

        {/* Floating Zoom & Center Controls */}
        <div className="absolute top-4 left-4 flex flex-col space-y-1.5 z-20">
          <button
            onClick={() => setZoomLevel((prev) => Math.min(20, prev + 1))}
            className="w-9 h-9 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-slate-700 shadow-lg flex items-center justify-center font-bold text-lg cursor-pointer transition-all active:scale-95"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((prev) => Math.max(10, prev - 1))}
            className="w-9 h-9 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-slate-700 shadow-lg flex items-center justify-center font-bold text-lg cursor-pointer transition-all active:scale-95"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleCenterOnPatient}
            className="w-9 h-9 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-slate-700 shadow-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all active:scale-95"
            title="Recenter Map on Elder"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        {/* Floating Compass & Coordinate HUD */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 text-xs text-slate-300 shadow-xl space-y-1 z-20 pointer-events-none">
          <div className="flex items-center space-x-2 font-mono font-bold text-white">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>
              Heading: {telemetry.bearingText} ({telemetry.bearingDegrees}°)
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-300">
            Lat: {telemetry.latitude.toFixed(6)} • Lng: {telemetry.longitude.toFixed(6)}
          </div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
            <span>Accuracy: ±{telemetry.accuracy}m</span>
            {deviceGpsState.isWatching && (
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40">
                Live Sensor
              </span>
            )}
          </div>
        </div>

        {/* Floating Automated SOS Success Toast */}
        {sosSuccessBanner && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-950/95 border-2 border-emerald-400 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sosSuccessBanner}</span>
          </div>
        )}

        {/* Floating Fixed Radar Legend */}
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 text-xs shadow-xl space-y-2 z-20">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500/40 border-2 border-emerald-400 inline-block" />
            <span className="text-slate-200 text-[11px] font-bold">
              Safe Zone: {config.safeRadiusMeters}m
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/30 border-2 border-rose-400 inline-block" />
            <span className="text-slate-200 text-[11px] font-bold">
              Alert Perimeter: {config.alertRadiusMeters}m
            </span>
          </div>
          <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
            <span className="w-3 h-3 rounded-full bg-sky-400 inline-block animate-ping" />
            <span className="text-sky-300 text-[11px] font-black">
              {config.patientName} (Pointed GPS)
            </span>
          </div>
          <p className="text-[10px] text-amber-300/90 font-medium italic pt-0.5">
            Click map to set simulated coordinates
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Tactical Vector Radar Engine (Canvas & SVG)
 * Operates reliably with concentric radar rings and sweeping scanner beam
 */
const InteractiveGeofenceEngine: React.FC<{
  telemetry: CareCompassTelemetry;
  config: CareCompassConfig;
  viewMode: ViewMode;
  onUpdateLocation?: (lat: number, lng: number) => void;
  onOpenKeyModal?: () => void;
}> = ({
  telemetry,
  config,
  viewMode,
  onUpdateLocation,
  onOpenKeyModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scaled coordinate calculation: Home is center (50%, 50%)
  const maxMetersRange = Math.max(900, config.alertRadiusMeters * 1.5);
  const homeLat = config.homeLocation.latitude;
  const homeLng = config.homeLocation.longitude;

  const deltaLatMeters = (telemetry.latitude - homeLat) * 111139;
  const deltaLngMeters =
    (telemetry.longitude - homeLng) *
    111139 *
    Math.cos((homeLat * Math.PI) / 180);

  // Position relative to canvas center
  const posXPercent = 50 + (deltaLngMeters / maxMetersRange) * 42;
  const posYPercent = 50 - (deltaLatMeters / maxMetersRange) * 42;

  const safeRadiusPercent = (config.safeRadiusMeters / maxMetersRange) * 42;
  const alertRadiusPercent = (config.alertRadiusMeters / maxMetersRange) * 42;

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !onUpdateLocation) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = (clickX / rect.width) * 100 - 50;
    const percentY = (clickY / rect.height) * 100 - 50;

    const metersX = (percentX / 42) * maxMetersRange;
    const metersY = -(percentY / 42) * maxMetersRange;

    const newLat = homeLat + metersY / 111139;
    const newLng =
      homeLng + metersX / (111139 * Math.cos((homeLat * Math.PI) / 180));

    onUpdateLocation(newLat, newLng);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleCanvasClick}
      className="relative w-full h-full bg-[#080E1A] flex items-center justify-center select-none overflow-hidden cursor-crosshair"
    >
      {/* High-Contrast Tactical Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-45" />

      {/* Street & City Vector Overlay Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
        <defs>
          <pattern id="city-streets" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M 0 60 L 120 60 M 60 0 L 60 120" stroke="#334155" strokeWidth="2" />
            <path d="M 0 30 L 120 30 M 0 90 L 120 90 M 30 0 L 30 120 M 90 0 L 90 120" stroke="#1e293b" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#city-streets)" />
      </svg>

      {/* Tactical Radar HUD Scan Beam */}
      <div className="absolute w-[650px] h-[650px] rounded-full border border-emerald-500/20 pointer-events-none animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(16,185,129,0.18)_50deg,transparent_51deg)]" />

      {/* Outer Metric Distance Ring (1000m) */}
      <div
        style={{
          width: `${(1000 / maxMetersRange) * 84}%`,
          height: `${(1000 / maxMetersRange) * 84}%`,
          left: `${50 - (1000 / maxMetersRange) * 42}%`,
          top: `${50 - (1000 / maxMetersRange) * 42}%`,
        }}
        className="absolute rounded-full border border-slate-700/60 pointer-events-none"
      >
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500">
          1000m Outer Range
        </span>
      </div>

      {/* 600m Critical Alert Perimeter Circle (Red/Amber Zone) */}
      <div
        style={{
          width: `${alertRadiusPercent * 2}%`,
          height: `${alertRadiusPercent * 2}%`,
          left: `${50 - alertRadiusPercent}%`,
          top: `${50 - alertRadiusPercent}%`,
        }}
        className="absolute rounded-full border-3 border-dashed border-rose-500/80 bg-rose-500/10 pointer-events-none transition-all duration-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
      >
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-black text-rose-300 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-rose-500/60 shadow">
          CRITICAL ALERT PERIMETER ({config.alertRadiusMeters}m)
        </span>
      </div>

      {/* 300m Safe Zone Perimeter Circle (Green Zone) */}
      <div
        style={{
          width: `${safeRadiusPercent * 2}%`,
          height: `${safeRadiusPercent * 2}%`,
          left: `${50 - safeRadiusPercent}%`,
          top: `${50 - safeRadiusPercent}%`,
        }}
        className="absolute rounded-full border-3 border-emerald-400 bg-emerald-500/15 pointer-events-none transition-all duration-300 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
      >
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-black text-emerald-300 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-emerald-500/60 shadow">
          SAFE HOME ZONE ({config.safeRadiusMeters}m)
        </span>
      </div>

      {/* Historical Breadcrumb GPS Tracking Trail */}
      {telemetry.breadcrumbs && telemetry.breadcrumbs.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline
            points={telemetry.breadcrumbs
              .map((b) => {
                const dx = (b.longitude - homeLng) * 111139 * Math.cos((homeLat * Math.PI) / 180);
                const dy = (b.latitude - homeLat) * 111139;
                const px = 50 + (dx / maxMetersRange) * 42;
                const py = 50 - (dy / maxMetersRange) * 42;
                return `${px}%,${py}%`;
              })
              .join(' ')}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      )}

      {/* Center Fixed Home Base Anchor */}
      <div
        style={{
          left: '50%',
          top: '50%',
        }}
        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-20"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6321] to-[#EA580C] border-2 border-white shadow-2xl flex items-center justify-center text-white">
          <Home className="w-5 h-5" />
        </div>
        <span className="mt-1.5 text-[11px] font-black text-white bg-slate-950/95 px-2.5 py-0.5 rounded-md border border-slate-700 whitespace-nowrap shadow-lg">
          {config.homeLocation.label} (Fixed Radar Center)
        </span>
      </div>

      {/* Live Patient Beacon with Direction Heading Arrow */}
      <div
        style={{
          left: `${Math.min(95, Math.max(5, posXPercent))}%`,
          top: `${Math.min(95, Math.max(5, posYPercent))}%`,
        }}
        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30 transition-all duration-300"
      >
        {/* Pulsing Beacon Waves */}
        <div
          className={`absolute w-14 h-14 rounded-full animate-ping pointer-events-none ${
            telemetry.geofenceStatus === 'CRITICAL_BREACH'
              ? 'bg-rose-500/60'
              : telemetry.geofenceStatus === 'WARNING_BORDER'
              ? 'bg-amber-500/50'
              : 'bg-emerald-500/50'
          }`}
        />

        <div
          style={{ transform: `rotate(${telemetry.bearingDegrees}deg)` }}
          className={`w-11 h-11 rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center text-white transition-transform duration-300 ${
            telemetry.geofenceStatus === 'CRITICAL_BREACH'
              ? 'bg-rose-600'
              : telemetry.geofenceStatus === 'WARNING_BORDER'
              ? 'bg-amber-600'
              : 'bg-emerald-600'
          }`}
        >
          <Navigation className="w-6 h-6 -rotate-45" />
        </div>

        <div className="mt-1.5 text-[11px] font-black text-white bg-slate-950/95 px-3 py-1 rounded-lg border border-slate-600 whitespace-nowrap shadow-xl flex items-center gap-1.5">
          <span>{config.patientName}</span>
          <span className="font-mono text-emerald-400 font-extrabold">
            ({Math.round(telemetry.distanceMeters)}m)
          </span>
        </div>
      </div>
    </div>
  );
};
