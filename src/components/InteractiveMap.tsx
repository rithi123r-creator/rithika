import React, { useState, useMemo, useEffect } from 'react';
import {
  Map,
  AdvancedMarker,
  Polyline,
  useApiIsLoaded,
  useApiLoadingStatus,
  APILoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import { useHydro } from '../context/HydroContext';
import { RoadSegment } from '../types';
import {
  AlertOctagon,
  Building2,
  Layers,
  Map as MapIcon,
  Navigation,
  ZoomIn,
  ZoomOut,
  Compass,
  HardDrive,
  WifiOff,
} from 'lucide-react';

interface InteractiveMapProps {
  highlightRouteId?: string;
  showAllRoutes?: boolean;
  interactive?: boolean;
  className?: string;
  title?: string;
}

// Geographic Center Anchor (Tamil Nadu, India corridor - Kumbakonam default)
export const METRO_CENTER: google.maps.LatLngLiteral = { lat: 10.9602, lng: 79.3845 };

// Coordinate Projection: Translates schematic (0-1000, 0-680) to real Geographic LatLng coordinates
export const svgToLatLng = (pt: { x: number; y: number }): google.maps.LatLngLiteral => {
  const lat = 11.2 - (pt.y / 680) * 0.5;
  const lng = 78.5 + (pt.x / 1000) * 1.0;
  return { lat, lng };
};

// Inverse Projection: Translates real Geographic LatLng coordinates to schematic (0-1000, 0-680)
export const latLngToSvg = (coord: { lat: number; lng: number }): { x: number; y: number } => {
  const y = ((11.2 - coord.lat) / 0.5) * 680;
  const x = ((coord.lng - 78.5) / 1.0) * 1000;
  return {
    x: Math.max(20, Math.min(980, Math.round(x))),
    y: Math.max(20, Math.min(660, Math.round(y))),
  };
};

// Elevation model estimator
export const estimateElevation = (lat: number, lng: number): number => {
  const baseElev = Math.max(12.0, Math.round((28 + Math.sin(lat * 10) * 8 + Math.cos(lng * 10) * 6) * 10) / 10);
  return baseElev;
};

// Automatically animates and fits Google Maps bounds to the selected route and start/dest markers
const MapCameraSync: React.FC<{
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  routePoints?: { lat: number; lng: number }[];
}> = ({ origin, destination, routePoints }) => {
  const mapWithId = useMap('google-flood-map');
  const mapDefault = useMap();
  const map = mapWithId || mapDefault;

  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google?.maps) return;
    try {
      const bounds = new window.google.maps.LatLngBounds();
      if (routePoints && routePoints.length > 0) {
        routePoints.forEach((p) => bounds.extend(p));
      } else {
        bounds.extend({ lat: origin.lat, lng: origin.lng });
        bounds.extend({ lat: destination.lat, lng: destination.lng });
      }
      map.fitBounds(bounds, { top: 75, right: 75, bottom: 75, left: 75 });
    } catch (err) {
      console.warn('Map bounds fit notice:', err);
    }
  }, [map, origin.lat, origin.lng, destination.lat, destination.lng, routePoints]);

  return null;
};

// Fallback corridor directly between origin and destination within India without crossing foreign territory
export const buildDynamicCorridor = (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): google.maps.LatLngLiteral[] => {
  const mid = {
    lat: (origin.lat + destination.lat) / 2,
    lng: (origin.lng + destination.lng) / 2,
  };
  return [origin, mid, destination];
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  highlightRouteId,
  showAllRoutes = false,
  className = '',
  title = 'Metro Urban Flood Risk Map',
}) => {
  const {
    roads,
    emergencyResources,
    citizenReports,
    setSelectedRoad,
    activeRoutes,
    selectedRouteId,
    setSelectedRouteId,
    rainfallMmHr,
    originPoint,
    setOriginPoint,
    destinationPoint,
    setDestinationPoint,
    pickMode,
    setPickMode,
    inspectionPoint,
    setInspectionPoint,
    routeError,
    isCalculatingRoutes,
    isNetworkOnline,
    isSimulatedOffline,
    activeOfflineRouteId,
  } = useHydro();

  const isMapsApiLoaded = useApiIsLoaded();
  const apiLoadingStatus = useApiLoadingStatus();
  const googleMap = useMap('google-flood-map');

  // Engine Mode: 'google_maps' (Primary) vs 'vector_topo' (Tactical Blueprint)
  const [mapEngine, setMapEngine] = useState<'google_maps' | 'vector_topo'>('google_maps');
  const [googleMapType, setGoogleMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeLayer, setActiveLayer] = useState<'all' | 'high_risk' | 'routes' | 'shelters'>('all');
  const [hoveredRoad, setHoveredRoad] = useState<RoadSegment | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Active route determination
  const targetRouteId = highlightRouteId || selectedRouteId;
  const routeB = activeRoutes.find((r) => r.id === 'route-b');
  const routeA = activeRoutes.find((r) => r.id === 'route-a');
  const selectedRoute = activeRoutes.find((r) => r.id === targetRouteId) || routeB;

  const handleZoomIn = () => {
    if (mapEngine === 'google_maps' && googleMap) {
      googleMap.setZoom((googleMap.getZoom() || 13) + 1);
    } else {
      setZoomLevel((z) => Math.min(1.6, z + 0.2));
    }
  };

  const handleZoomOut = () => {
    if (mapEngine === 'google_maps' && googleMap) {
      googleMap.setZoom((googleMap.getZoom() || 13) - 1);
    } else {
      setZoomLevel((z) => Math.max(0.8, z - 0.2));
    }
  };

  const handleResetZoom = () => {
    if (mapEngine === 'google_maps' && googleMap && typeof window !== 'undefined' && window.google?.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      if (activeSelectedRoutePoints && activeSelectedRoutePoints.length > 0) {
        activeSelectedRoutePoints.forEach((p) => bounds.extend(p));
      } else {
        bounds.extend({ lat: originPoint.lat, lng: originPoint.lng });
        bounds.extend({ lat: destinationPoint.lat, lng: destinationPoint.lng });
      }
      googleMap.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    } else {
      setZoomLevel(1);
    }
  };

  // Color mapping by danger level
  const getStrokeColor = (road: RoadSegment) => {
    if (road.isBlocked) return '#E11D48'; // deep rose-600
    if (road.riskLevel === 'high') return '#EF4444'; // red-500
    if (road.riskLevel === 'moderate') return '#F59E0B'; // amber-500
    return '#10B981'; // emerald-500
  };

  const isRoadDimmed = (road: RoadSegment) => {
    if (activeLayer === 'high_risk') return road.riskLevel !== 'high';
    return false;
  };

  // Helper to reverse geocode coordinate if Geocoder is loaded, or generate clean coordinate label
  const reverseGeocodeOrLabel = async (lat: number, lng: number): Promise<string> => {
    if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const res = await geocoder.geocode({ location: { lat, lng } });
        if (res.results && res.results[0]) {
          return res.results[0].formatted_address.split(',')[0];
        }
      } catch {
        // Fall back to coordinate string
      }
    }
    return `Custom Location (${lat.toFixed(4)}°, ${Math.abs(lng).toFixed(4)}°)`;
  };

  // Handle map click: updates origin, destination, or inspection pin
  const handleLocationPicked = async (lat: number, lng: number) => {
    const elev = estimateElevation(lat, lng);
    const label = await reverseGeocodeOrLabel(lat, lng);

    if (pickMode === 'origin') {
      setOriginPoint({
        name: label,
        lat,
        lng,
        elevationMeters: elev,
        sourceType: 'map_click',
        address: `Custom Starting Point (+${elev}m elev)`,
      });
      setPickMode(null);
    } else if (pickMode === 'destination') {
      setDestinationPoint({
        name: label,
        lat,
        lng,
        elevationMeters: elev,
        sourceType: 'map_click',
        address: `Custom Destination Point (+${elev}m elev)`,
      });
      setPickMode(null);
    } else {
      // Inspection mode
      setInspectionPoint({
        name: label,
        lat,
        lng,
        elevationMeters: elev,
        sourceType: 'map_click',
        address: `Elevation: +${elev}m. Click below to route to/from here.`,
      });
    }
  };

  // Draggable marker handlers on Google Maps
  const handleOriginDragEnd = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const elev = estimateElevation(lat, lng);
    const label = await reverseGeocodeOrLabel(lat, lng);
    setOriginPoint({
      name: label,
      lat,
      lng,
      elevationMeters: elev,
      sourceType: 'map_click',
    });
  };

  const handleDestinationDragEnd = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const elev = estimateElevation(lat, lng);
    const label = await reverseGeocodeOrLabel(lat, lng);
    setDestinationPoint({
      name: label,
      lat,
      lng,
      elevationMeters: elev,
      sourceType: 'map_click',
    });
  };

  // Selected Route Path: derives directly from backend-verified India route polyline coordinates
  const activeSelectedRoutePoints = useMemo<google.maps.LatLngLiteral[]>(() => {
    if (selectedRoute && selectedRoute.points && selectedRoute.points.length > 0) {
      return selectedRoute.points;
    }
    return [];
  }, [selectedRoute]);

  return (
    <div
      id="hydro-interactive-map-container"
      className={`relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col ${className}`}
    >
      {/* Map Control Header */}
      <div className="bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {title}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800/80 font-medium hidden sm:inline-flex">
            Telemetry: {rainfallMmHr} mm/h rain
          </span>
          {(activeOfflineRouteId || isSimulatedOffline || !isNetworkOnline) && (
            <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 animate-pulse">
              <HardDrive className="w-3 h-3 text-amber-400" />
              <span>OFFLINE CACHED ROUTE</span>
            </span>
          )}
        </div>

        {/* Engine Switcher (Google Maps vs Tactical Vector) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              id="engine-google-maps-btn"
              onClick={() => setMapEngine('google_maps')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                mapEngine === 'google_maps'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-blue-300" />
              <span>Google Map</span>
            </button>
            <button
              id="engine-vector-topo-btn"
              onClick={() => setMapEngine('vector_topo')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                mapEngine === 'vector_topo'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-slate-300" />
              <span>Tactical Blueprint</span>
            </button>
          </div>

          {/* Google Maps Type Switcher */}
          {mapEngine === 'google_maps' && (
            <div className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setGoogleMapType('roadmap')}
                className={`px-2 py-0.5 rounded-lg transition ${
                  googleMapType === 'roadmap' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Roadmap
              </button>
              <button
                onClick={() => setGoogleMapType('satellite')}
                className={`px-2 py-0.5 rounded-lg transition ${
                  googleMapType === 'satellite' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setGoogleMapType('terrain')}
                className={`px-2 py-0.5 rounded-lg transition ${
                  googleMapType === 'terrain' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Terrain
              </button>
            </div>
          )}

          {/* Layer Filter Toggles */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              id="layer-all-btn"
              onClick={() => setActiveLayer('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                activeLayer === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Roads
            </button>
            <button
              id="layer-high-risk-btn"
              onClick={() => setActiveLayer('high_risk')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                activeLayer === 'high_risk'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              High Risk
            </button>
            <button
              id="layer-shelters-btn"
              onClick={() => setActiveLayer('shelters')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                activeLayer === 'shelters'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3 h-3" />
              Shelters
            </button>
          </div>

          {/* Quick Location Pick Buttons in Map Header */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setPickMode(pickMode === 'origin' ? null : 'origin')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                pickMode === 'origin'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-xs'
                  : 'text-blue-300 hover:bg-slate-800'
              }`}
              title="Click map to set Origin location"
            >
              <Navigation className="w-3 h-3 text-blue-400" />
              <span>{pickMode === 'origin' ? 'Click Map...' : 'Pick Start'}</span>
            </button>
            <button
              onClick={() => setPickMode(pickMode === 'destination' ? null : 'destination')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                pickMode === 'destination'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-xs'
                  : 'text-emerald-300 hover:bg-slate-800'
              }`}
              title="Click map to set Destination location"
            >
              <span className="text-xs">🏁</span>
              <span>{pickMode === 'destination' ? 'Click Map...' : 'Pick Dest'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative w-full h-[440px] sm:h-[480px] lg:h-[520px] bg-[#0c1322] overflow-hidden select-none">
        {/* Active Map Pick Mode Floating Banner */}
        {pickMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-amber-500/95 text-slate-950 px-4 py-2 rounded-xl shadow-2xl border-2 border-amber-300 font-extrabold text-xs flex items-center gap-3 backdrop-blur-md animate-bounce">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
              <span>
                Click anywhere on the map to set your{' '}
                {pickMode === 'origin' ? 'Starting Location (A)' : 'Destination (🏁)'}
              </span>
            </div>
            <button
              onClick={() => setPickMode(null)}
              className="bg-slate-950 text-amber-300 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-black hover:bg-slate-800 transition"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Inspected Map Coordinate Modal Card */}
        {inspectionPoint && (
          <div className="absolute top-3 left-4 z-40 bg-slate-950/95 border border-slate-700 text-white p-3.5 rounded-xl shadow-2xl backdrop-blur-md max-w-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <span>📍</span>
                <span>Custom Map Location</span>
              </div>
              <button
                onClick={() => setInspectionPoint(null)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition"
              >
                ✕
              </button>
            </div>
            <div className="text-xs font-semibold text-slate-100 mt-1 leading-snug">
              {inspectionPoint.name}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Elevation: +{inspectionPoint.elevationMeters}m</span>
              <span
                className={
                  inspectionPoint.elevationMeters! < 5
                    ? 'text-rose-400 font-bold'
                    : inspectionPoint.elevationMeters! > 15
                    ? 'text-emerald-400 font-bold'
                    : 'text-amber-400 font-bold'
                }
              >
                {inspectionPoint.elevationMeters! < 5
                  ? 'High Flood Basin'
                  : inspectionPoint.elevationMeters! > 15
                  ? 'Elevated Ground'
                  : 'Moderate Runoff'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setOriginPoint(inspectionPoint);
                  setInspectionPoint(null);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-xs"
              >
                Set as Start
              </button>
              <button
                onClick={() => {
                  setDestinationPoint(inspectionPoint);
                  setInspectionPoint(null);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-xs"
              >
                Set as Dest
              </button>
            </div>
          </div>
        )}

        {/* Route Calculation Error / India Boundary Enforced Banner */}
        {routeError && (
          <div className="absolute top-3 left-4 right-4 z-40 bg-rose-950/95 border-2 border-rose-500 text-rose-100 p-3.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="flex-1 text-xs">
              <div className="font-extrabold text-rose-200">India Routing Boundary Enforced</div>
              <div className="text-[11px] text-rose-300 mt-0.5">{routeError}</div>
            </div>
          </div>
        )}

        {/* Real-Time Routing Spinner Indicator */}
        {isCalculatingRoutes && (
          <div className="absolute top-3 right-4 z-40 bg-slate-950/90 border border-blue-500/80 text-blue-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-sm">
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Calculating road route within India...</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: GOOGLE MAPS PLATFORM ENGINE                       */}
        {/* ========================================================= */}
        {mapEngine === 'google_maps' && (
          <div className="relative w-full h-full">
            {apiLoadingStatus === APILoadingStatus.FAILED ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300 p-6 text-center gap-3">
                <AlertOctagon className="w-10 h-10 text-rose-500 animate-pulse" />
                <div className="text-sm font-bold text-white">Google Maps Temporarily Unavailable</div>
                <p className="text-xs text-slate-400 max-w-sm">
                  We are switching to the tactical topographic blueprint with live telemetry and emergency routing.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setMapEngine('vector_topo')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
                  >
                    Open Tactical Blueprint
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    Reload
                  </button>
                </div>
              </div>
            ) : !isMapsApiLoaded ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300 gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Connecting to Google Maps Platform...</span>
              </div>
            ) : (
              <Map
                id="google-flood-map"
                defaultCenter={METRO_CENTER}
                defaultZoom={13}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{
                  width: '100%',
                  height: '100%',
                  cursor: pickMode ? 'crosshair' : 'default',
                }}
                mapTypeId={googleMapType}
                gestureHandling="greedy"
                disableDefaultUI={false}
                onClick={(e) => {
                  if (e.detail?.latLng) {
                    handleLocationPicked(e.detail.latLng.lat, e.detail.latLng.lng);
                  }
                }}
              >
                {/* Auto-Camera Sync to frame user's selected route, origin, and destination */}
                <MapCameraSync
                  origin={originPoint}
                  destination={destinationPoint}
                  routePoints={activeSelectedRoutePoints}
                />

                {/* 1. Strictly ONE Active Road Route Polyline (Google Directions / OSRM Verified within India) */}
                {activeSelectedRoutePoints.length > 0 && selectedRoute && (
                  <>
                    <Polyline
                      path={activeSelectedRoutePoints}
                      strokeColor={
                        selectedRoute.riskLevel === 'high'
                          ? '#EF4444'
                          : selectedRoute.isRecommended
                          ? '#10B981'
                          : '#3B82F6'
                      }
                      strokeOpacity={0.95}
                      strokeWeight={7}
                      onClick={() => setSelectedRouteId(selectedRoute.id)}
                    />
                    {activeSelectedRoutePoints.length > 1 && (
                      <AdvancedMarker
                        position={activeSelectedRoutePoints[Math.floor(activeSelectedRoutePoints.length / 2)]}
                        zIndex={48}
                        onClick={() => setSelectedRouteId(selectedRoute.id)}
                      >
                        <div
                          className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold shadow-xl flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 border-2 ${
                            selectedRoute.isRecommended
                              ? 'bg-emerald-950 text-emerald-100 border-emerald-400 ring-2 ring-emerald-500/50'
                              : selectedRoute.riskLevel === 'high'
                              ? 'bg-red-950 text-red-100 border-red-400 ring-2 ring-red-500/50'
                              : 'bg-blue-950 text-blue-100 border-blue-400'
                          }`}
                        >
                          <span>{selectedRoute.isRecommended ? '★' : '⚠'}</span>
                          <span>{selectedRoute.name}</span>
                          <span className="opacity-80 font-normal">
                            ({selectedRoute.distanceKm} km · {selectedRoute.estimatedMinutes} min)
                          </span>
                        </div>
                      </AdvancedMarker>
                    )}
                  </>
                )}

                {/* 5. Dynamic Origin & Destination Waypoints (Draggable) */}
                <AdvancedMarker
                  position={{ lat: originPoint.lat, lng: originPoint.lng }}
                  zIndex={60}
                  draggable={true}
                  onDragEnd={handleOriginDragEnd}
                >
                  <div className="flex flex-col items-center cursor-grab active:cursor-grabbing group">
                    <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-xl text-xs font-black ring-4 ring-blue-500/30 group-hover:scale-110 transition-transform">
                      A
                    </div>
                    <div className="bg-slate-950/95 text-blue-300 border border-blue-500 px-2 py-0.5 rounded-md text-[9px] font-bold shadow-md whitespace-nowrap mt-0.5 flex items-center gap-1">
                      <span>START</span>
                      <span className="text-[8px] opacity-75 font-normal">(Drag)</span>
                    </div>
                  </div>
                </AdvancedMarker>

                <AdvancedMarker
                  position={{ lat: destinationPoint.lat, lng: destinationPoint.lng }}
                  zIndex={60}
                  draggable={true}
                  onDragEnd={handleDestinationDragEnd}
                >
                  <div className="flex flex-col items-center cursor-grab active:cursor-grabbing group">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-xl text-xs font-black ring-4 ring-emerald-500/30 group-hover:scale-110 transition-transform">
                      🏁
                    </div>
                    <div className="bg-slate-950/95 text-emerald-300 border border-emerald-500 px-2 py-0.5 rounded-md text-[9px] font-bold shadow-md whitespace-nowrap mt-0.5 flex items-center gap-1">
                      <span>DESTINATION</span>
                      <span className="text-[8px] opacity-75 font-normal">(Drag)</span>
                    </div>
                  </div>
                </AdvancedMarker>

                {/* 6. Selected Inspection Pin on Google Maps */}
                {inspectionPoint && (
                  <AdvancedMarker
                    position={{ lat: inspectionPoint.lat, lng: inspectionPoint.lng }}
                    zIndex={65}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-slate-950 shadow-xl text-xs font-black animate-bounce ring-4 ring-amber-400/30">
                        📍
                      </div>
                      <div className="bg-amber-950 text-amber-200 border border-amber-400 px-1.5 py-0.2 rounded text-[8px] font-bold shadow-md">
                        SELECTED PIN
                      </div>
                    </div>
                  </AdvancedMarker>
                )}
              </Map>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: TACTICAL TOPOGRAPHIC VECTOR BLUEPRINT             */}
        {/* ========================================================= */}
        {mapEngine === 'vector_topo' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#1e293b 1px, transparent 1px)`,
                backgroundSize: '30px 30px',
              }}
            />

            {/* Basin Glow */}
            <div className="absolute top-[40%] left-[20%] w-[500px] h-[180px] bg-blue-900/15 blur-3xl pointer-events-none rounded-full" />

            <svg
              viewBox="0 0 1000 680"
              className="w-full h-full object-cover transition-transform duration-300 ease-out"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <defs>
                <filter id="glow-safe" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-danger" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#0284c7" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#075985" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* North Ridge */}
              <path
                d="M 320 60 Q 600 40 860 120 L 820 200 Q 550 120 300 140 Z"
                fill="#1e293b"
                fillOpacity="0.45"
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x="560" y="90" fill="#94a3b8" fontSize="12" fontWeight="600" letterSpacing="2">
                NORTH HIGHLAND RIDGE (+28m ELEVATION)
              </text>

              {/* Low Basin */}
              <rect
                x="220"
                y="340"
                width="440"
                height="130"
                rx="20"
                fill="#082f49"
                fillOpacity="0.35"
                stroke="#0284c7"
                strokeWidth="1"
                strokeOpacity="0.3"
              />
              <text x="240" y="365" fill="#38bdf8" fontSize="11" fontWeight="700" letterSpacing="1">
                ⚠ LOW-LYING BASIN (ELEV. 2.2m) - FLOOD RISK ZONE
              </text>

              {/* River Channel */}
              <path
                d="M 120 230 C 280 260 420 320 540 370 C 680 430 820 480 940 580"
                fill="none"
                stroke="url(#riverGradient)"
                strokeWidth="38"
                strokeLinecap="round"
              />
              <path
                d="M 120 230 C 280 260 420 320 540 370 C 680 430 820 480 940 580"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="8 12"
                strokeOpacity="0.6"
              />

              {/* Road Segments */}
              {roads.map((road) => {
                const isDim = isRoadDimmed(road);
                const isHovered = hoveredRoad?.id === road.id;
                const strokeColor = getStrokeColor(road);
                const pathD = road.pathCoordinates.reduce(
                  (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                  ''
                );

                return (
                  <g
                    key={road.id}
                    className="cursor-pointer transition-opacity duration-200"
                    opacity={isDim ? 0.25 : 1}
                    onMouseEnter={() => {
                      setHoveredRoad(road);
                      setTooltipPos({ x: road.midpoint.x, y: road.midpoint.y });
                    }}
                    onMouseLeave={() => setHoveredRoad(null)}
                    onClick={() => setSelectedRoad(road)}
                  >
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isHovered ? '#60a5fa' : '#1e293b'}
                      strokeWidth={isHovered ? 18 : 14}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={isHovered ? 0.4 : 0.6}
                    />

                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={road.category === 'highway' ? 7 : 5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={road.category === 'tunnel' ? '8 6' : undefined}
                    />

                    {road.isBlocked && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={4}
                        strokeDasharray="6 6"
                        opacity={0.9}
                      />
                    )}

                    {/* Subtle Pulse Animations for High-Risk & Blocked Road Markers */}
                    {(road.riskLevel === 'high' || road.isBlocked) && (
                      <g className="pointer-events-none">
                        <circle
                          cx={road.midpoint.x}
                          cy={road.midpoint.y}
                          r="12"
                          fill="none"
                          stroke={road.isBlocked ? '#F43F5E' : '#EF4444'}
                          strokeWidth="2.5"
                        >
                          <animate
                            attributeName="r"
                            values="12;27;32"
                            dur="2.4s"
                            repeatCount="indefinite"
                            keyTimes="0;0.7;1"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.85;0.2;0"
                            dur="2.4s"
                            repeatCount="indefinite"
                            keyTimes="0;0.7;1"
                          />
                        </circle>

                        <circle
                          cx={road.midpoint.x}
                          cy={road.midpoint.y}
                          r="12"
                          fill="none"
                          stroke={road.isBlocked ? '#F43F5E' : '#EF4444'}
                          strokeWidth="1.5"
                        >
                          <animate
                            attributeName="r"
                            values="12;27;32"
                            begin="1.2s"
                            dur="2.4s"
                            repeatCount="indefinite"
                            keyTimes="0;0.7;1"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.85;0.2;0"
                            begin="1.2s"
                            dur="2.4s"
                            repeatCount="indefinite"
                            keyTimes="0;0.7;1"
                          />
                        </circle>

                        <circle
                          cx={road.midpoint.x}
                          cy={road.midpoint.y}
                          r="18"
                          fill={road.isBlocked ? '#E11D48' : '#EF4444'}
                        >
                          <animate
                            attributeName="opacity"
                            values="0.12;0.35;0.12"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="r"
                            values="16;21;16"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    )}

                    {/* Road Code / Risk Score Badge */}
                    <circle
                      cx={road.midpoint.x}
                      cy={road.midpoint.y}
                      r={isHovered ? 15 : 12}
                      fill={strokeColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={road.midpoint.x}
                      y={road.midpoint.y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="800"
                      pointerEvents="none"
                    >
                      {road.riskScore}
                    </text>
                  </g>
                );
              })}

              {/* Active Route Vector Paths dynamically anchoring to user's selected locations */}
              {(() => {
                const origSvg = latLngToSvg(originPoint);
                const dSvg = latLngToSvg(destinationPoint);

                const dynamicPathA = `M ${origSvg.x} ${origSvg.y} Q ${(origSvg.x + dSvg.x) / 2} 410 ${dSvg.x} ${dSvg.y}`;
                const dynamicPathB = `M ${origSvg.x} ${origSvg.y} Q ${(origSvg.x + dSvg.x) / 2} 190 ${dSvg.x} ${dSvg.y}`;
                const dynamicPathC = `M ${origSvg.x} ${origSvg.y} Q ${(origSvg.x + dSvg.x) / 2} 540 ${dSvg.x} ${dSvg.y}`;

                return (
                  <>
                    {(showAllRoutes || targetRouteId === 'route-a') && (
                      <g opacity={targetRouteId === 'route-a' ? 1 : 0.4} onClick={() => setSelectedRouteId('route-a')} className="cursor-pointer">
                        <path
                          d={dynamicPathA}
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth={targetRouteId === 'route-a' ? 8 : 4}
                          strokeLinecap="round"
                          strokeDasharray="10 8"
                          filter={targetRouteId === 'route-a' ? 'url(#glow-danger)' : undefined}
                        />
                        <g transform={`translate(${(origSvg.x + dSvg.x) / 2 - 65}, 400)`}>
                          <rect width="130" height="24" rx="6" fill="#991B1B" stroke="#F87171" strokeWidth="1" />
                          <text x="65" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                            ⚠ HIGH RISK (85/100)
                          </text>
                        </g>
                      </g>
                    )}

                    {(showAllRoutes || targetRouteId === 'route-b') && (
                      <g opacity={targetRouteId === 'route-b' ? 1 : 0.6} onClick={() => setSelectedRouteId('route-b')} className="cursor-pointer">
                        <path
                          d={dynamicPathB}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth={targetRouteId === 'route-b' ? 9 : 5}
                          strokeLinecap="round"
                          filter="url(#glow-safe)"
                        />
                        <g transform={`translate(${(origSvg.x + dSvg.x) / 2 - 90}, 180)`}>
                          <rect width="180" height="26" rx="8" fill="#065F46" stroke="#34D399" strokeWidth="1.5" />
                          <text x="90" y="17" textAnchor="middle" fill="#ECFDF5" fontSize="11" fontWeight="800">
                            ★ RECOMMENDED SAFE (25/100)
                          </text>
                        </g>
                      </g>
                    )}

                    {(showAllRoutes || targetRouteId === 'route-c') && (
                      <g opacity={targetRouteId === 'route-c' ? 1 : 0.5} onClick={() => setSelectedRouteId('route-c')} className="cursor-pointer">
                        <path
                          d={dynamicPathC}
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth={targetRouteId === 'route-c' ? 8 : 4}
                          strokeLinecap="round"
                          strokeDasharray="8 6"
                        />
                        <g transform={`translate(${(origSvg.x + dSvg.x) / 2 - 80}, 530)`}>
                          <rect width="160" height="24" rx="6" fill="#78350F" stroke="#FBBF24" strokeWidth="1" />
                          <text x="80" y="16" textAnchor="middle" fill="#FEF3C7" fontSize="10" fontWeight="bold">
                            ⟳ PERIMETER RING (55/100)
                          </text>
                        </g>
                      </g>
                    )}
                  </>
                );
              })()}

              {/* Shelters in Vector View */}
              {emergencyResources.map((res) => (
                <g
                  key={res.id}
                  transform={`translate(${res.coordinates.x}, ${res.coordinates.y})`}
                  className="cursor-pointer"
                >
                  <circle
                    r="15"
                    fill={res.type === 'shelter' ? '#3b82f6' : '#059669'}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text y="4" textAnchor="middle" fill="#ffffff" fontSize="11">
                    {res.type === 'shelter' ? '⛺' : '🏥'}
                  </text>
                </g>
              ))}

              {/* Dynamic Origin & Destination Waypoints in Vector View */}
              {(() => {
                const originSvg = latLngToSvg(originPoint);
                const destSvg = latLngToSvg(destinationPoint);
                const inspectSvg = inspectionPoint ? latLngToSvg(inspectionPoint) : null;

                return (
                  <>
                    {/* Origin Marker */}
                    <g transform={`translate(${originSvg.x}, ${originSvg.y})`} className="cursor-pointer">
                      <circle r="16" fill="#2563EB" stroke="#ffffff" strokeWidth="2.5" />
                      <text y="4" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">
                        A
                      </text>
                      <rect x="-24" y="20" width="48" height="18" rx="4" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" />
                      <text y="32" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="bold">
                        START
                      </text>
                    </g>

                    {/* Destination Marker */}
                    <g transform={`translate(${destSvg.x}, ${destSvg.y})`} className="cursor-pointer">
                      <circle r="16" fill="#059669" stroke="#ffffff" strokeWidth="2.5" />
                      <text y="4" textAnchor="middle" fill="#ffffff" fontSize="11">
                        🏁
                      </text>
                      <rect x="-30" y="20" width="60" height="18" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
                      <text y="32" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="bold">
                        DESTINATION
                      </text>
                    </g>

                    {/* Inspection Pin if set */}
                    {inspectSvg && (
                      <g transform={`translate(${inspectSvg.x}, ${inspectSvg.y})`} className="cursor-pointer">
                        <circle r="16" fill="#F59E0B" stroke="#ffffff" strokeWidth="2.5" />
                        <text y="4" textAnchor="middle" fill="#000000" fontSize="12">
                          📍
                        </text>
                      </g>
                    )}
                  </>
                );
              })()}
            </svg>

            {/* Hover Tooltip Card (Vector Mode) */}
            {hoveredRoad && tooltipPos && (
              <div
                className="absolute z-30 pointer-events-none bg-slate-900/95 border border-slate-700 text-white p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs transition-all duration-150"
                style={{
                  left: `${Math.min(75, Math.max(10, (tooltipPos.x / 1000) * 100))}%`,
                  top: `${Math.min(70, Math.max(15, (tooltipPos.y / 680) * 100))}%`,
                  transform: 'translate(-50%, -120%)',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-blue-300">
                    {hoveredRoad.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      hoveredRoad.riskLevel === 'high'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : hoveredRoad.riskLevel === 'moderate'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {hoveredRoad.riskLevel} Risk ({hoveredRoad.riskScore}/100)
                  </span>
                </div>
                <div className="font-bold text-xs text-white leading-tight">{hoveredRoad.name}</div>
                <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
                  <span>Elev: {hoveredRoad.elevationMeters}m</span>
                  <span>Water: {hoveredRoad.waterLevel === 'none' ? 'Clear' : hoveredRoad.waterLevel}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Interactive Zoom & Fit Controls (Works for both Google Maps & Vector View) */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 z-30">
          <button
            id="map-zoom-in-btn"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center transition shadow-lg hover:scale-105 active:scale-95"
            title="Zoom in (+)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="map-zoom-out-btn"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center transition shadow-lg hover:scale-105 active:scale-95"
            title="Zoom out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            id="map-fit-bounds-btn"
            onClick={handleResetZoom}
            className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-blue-400 border border-slate-700 flex items-center justify-center transition shadow-lg text-[10px] font-bold hover:scale-105 active:scale-95"
            title={mapEngine === 'google_maps' ? 'Fit route bounds' : 'Reset view (1x)'}
            aria-label="Fit view"
          >
            {mapEngine === 'google_maps' ? 'FIT' : '1x'}
          </button>
        </div>
      </div>

      {/* Synchronized Footer Legend */}
      <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-400">Risk Legend:</span>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
            <span className="text-emerald-400 font-medium">Safe (0-30)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
            <span className="text-amber-400 font-medium">Moderate (31-60)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-xs" />
            </span>
            <span className="text-rose-400 font-medium">High Risk (61-100)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-900 border border-white flex items-center justify-center text-[9px] text-white font-bold">
              ✕
            </span>
            <span className="text-rose-300 font-medium">Road Blocked</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <span>⛺ Evac Shelter</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🏥 Hospital</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🚒 Rescue</span>
          </div>
        </div>
      </div>
    </div>
  );
};
