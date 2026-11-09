import React, { useState, useRef, useEffect } from 'react';
import { useHydro } from '../../context/HydroContext';
import { InteractiveMap } from '../InteractiveMap';
import { LocationPickerInput } from '../LocationPickerInput';
import { SAMPLE_PRESET_DESTINATIONS, SAMPLE_PRESET_ORIGINS } from '../../data/mockData';
import {
  saveOfflineRoute,
  getAllOfflineRoutes,
  deleteOfflineRoute,
  clearAllOfflineRoutes,
  getOfflineStorageStats,
  downloadOfflineRouteFile,
} from '../../utils/offlineMapStorage';
import { CachedOfflineRoute } from '../../types';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  Compass,
  CornerDownRight,
  Crosshair,
  Database,
  Download,
  FileDown,
  HardDrive,
  Info,
  MapPin,
  Mountain,
  Navigation,
  RefreshCw,
  Route,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Waves,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';

export const SafeRoutePage: React.FC = () => {
  const {
    originPoint,
    setOriginPoint,
    destinationPoint,
    setDestinationPoint,
    sourceLocation,
    setSourceLocation,
    destinationLocation,
    setDestinationLocation,
    swapLocations,
    pickMode,
    setPickMode,
    activeRoutes,
    selectedRouteId,
    setSelectedRouteId,
    rainfallMmHr,
    setRainfallMmHr,
    triggerPresetSimulation,
    submitFloodReport,
    setCurrentPage,
    routeError,
    isCalculatingRoutes,
    isNetworkOnline,
    isSimulatedOffline,
    setIsSimulatedOffline,
    loadOfflineRoute,
    activeOfflineRouteId,
  } = useHydro();

  const [activeTab, setActiveTab] = useState<'compare' | 'turn_by_turn' | 'elevation'>('compare');
  const mapSectionRef = useRef<HTMLDivElement>(null);

  // IndexedDB Offline Routes state
  const [cachedRoutes, setCachedRoutes] = useState<CachedOfflineRoute[]>([]);
  const [storageStats, setStorageStats] = useState<{ count: number; formattedSize: string }>({
    count: 0,
    formattedSize: '0 KB',
  });
  const [isSavingOffline, setIsSavingOffline] = useState<boolean>(false);
  const [offlineToast, setOfflineToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isOfflineDrawerOpen, setIsOfflineDrawerOpen] = useState<boolean>(false);

  // Refresh saved routes from IndexedDB
  const refreshCachedRoutes = async () => {
    try {
      const routes = await getAllOfflineRoutes();
      setCachedRoutes(routes);
      const stats = await getOfflineStorageStats();
      setStorageStats({ count: stats.count, formattedSize: stats.formattedSize });
    } catch (e) {
      console.warn('Failed to refresh cached routes:', e);
    }
  };

  useEffect(() => {
    refreshCachedRoutes();
  }, [activeOfflineRouteId]);

  const scrollToMap = () => {
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Find currently selected route
  const currentRoute = activeRoutes.find((r) => r.id === selectedRouteId) || activeRoutes[0];
  const recommendedRoute = activeRoutes.find((r) => r.isRecommended) || activeRoutes[0];

  // Save current active route to IndexedDB
  const handleDownloadOfflineRoute = async () => {
    if (!currentRoute) return;
    setIsSavingOffline(true);
    setOfflineToast(null);

    try {
      const saved = await saveOfflineRoute(
        originPoint,
        destinationPoint,
        currentRoute,
        rainfallMmHr,
        `Emergency Flood Route cached on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`
      );

      await refreshCachedRoutes();

      setOfflineToast({
        type: 'success',
        message: `✓ Route Cached to IndexedDB! (${saved.pointCount} road coordinates saved for offline flood emergency use).`,
      });

      // Clear toast after 6 seconds
      setTimeout(() => {
        setOfflineToast(null);
      }, 6000);
    } catch (err: any) {
      setOfflineToast({
        type: 'error',
        message: `Failed to cache route: ${err.message || 'IndexedDB storage issue'}`,
      });
    } finally {
      setIsSavingOffline(false);
    }
  };

  // Load a cached route from IndexedDB directly into map & navigation
  const handleSelectCachedRoute = (cached: CachedOfflineRoute) => {
    loadOfflineRoute(cached);
    setIsOfflineDrawerOpen(false);
    scrollToMap();
    setOfflineToast({
      type: 'success',
      message: `✓ Loaded offline route: ${cached.origin.name.split(',')[0]} → ${cached.destination.name.split(',')[0]} (${cached.pointCount} cached road coordinates).`,
    });
    setTimeout(() => {
      setOfflineToast(null);
    }, 5000);
  };

  // Delete a route from IndexedDB
  const handleDeleteCachedRoute = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteOfflineRoute(id);
    await refreshCachedRoutes();
  };

  // Clear all routes
  const handleClearAllCached = async () => {
    if (window.confirm('Clear all offline cached routes from IndexedDB?')) {
      await clearAllOfflineRoutes();
      await refreshCachedRoutes();
    }
  };

  const isCurrentRouteCached = cachedRoutes.some(
    (c) =>
      c.origin.name === originPoint.name &&
      c.destination.name === destinationPoint.name &&
      c.route.id === currentRoute?.id
  );

  return (
    <div id="hydro-safe-route-page" className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Flood-Resilient Navigation (India)
            </span>
            <span className="text-xs text-slate-400 font-medium">Telemetry: {rainfallMmHr} mm/h</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Safe Route Finder & Comparison
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Compare travel time, distance, elevation profiles, and live flood risks. HydroNav calculates safe road routes restricted strictly within India.
          </p>
        </div>

        {/* Live Simulation Quick Trigger */}
        <button
          id="simulate-flood-on-route-btn"
          onClick={() => triggerPresetSimulation('flash_flood_downtown')}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold transition flex items-center gap-2 shadow-xs"
        >
          <Zap className="w-3.5 h-3.5 text-rose-600" />
          Test Reroute (High Precipitation)
        </button>
      </div>

      {/* SEARCH / ORIGIN & DESTINATION CARD */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Origin Location Input with Custom Search & Map Picking */}
          <div className="md:col-span-5">
            <LocationPickerInput
              type="origin"
              label="Starting Location (Source)"
              placeholder="Search address, use GPS, or pick on map..."
              onFocusMap={scrollToMap}
            />

            {/* Quick Origin Preset Chips */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                Presets:
              </span>
              {SAMPLE_PRESET_ORIGINS.map((loc) => {
                const isSelected = originPoint.name === loc.name;
                const shortLabel = loc.name.split(',')[0].replace(/\(.*?\)/g, '').trim();
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setOriginPoint(loc)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center pt-6 md:pt-7">
            <button
              id="swap-locations-btn"
              type="button"
              onClick={swapLocations}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition border border-slate-200 hover:border-blue-200 shadow-xs"
              title="Swap start and destination"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Location Input with Custom Search & Map Picking */}
          <div className="md:col-span-5">
            <LocationPickerInput
              type="destination"
              label="Destination Location"
              placeholder="Search destination in India..."
              onFocusMap={scrollToMap}
            />

            {/* Quick Destination Preset Chips */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                Presets:
              </span>
              {SAMPLE_PRESET_DESTINATIONS.map((dest) => {
                const isSelected = destinationPoint.name === dest.name;
                const shortLabel = dest.name.split(',')[0].replace(/\(.*?\)/g, '').trim();
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => setDestinationPoint(dest)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Route Navigation Summary Pill */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800">India Route Corridor:</span>
            <span>
              {originPoint.name.split(',')[0]} → {destinationPoint.name.split(',')[0]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
            <span>
              Origin Elev: <strong className="text-slate-800">+{originPoint.elevationMeters || 26}m</strong>
            </span>
            <span>
              Dest Elev: <strong className="text-slate-800">+{destinationPoint.elevationMeters || 88}m</strong>
            </span>
            <span className="text-blue-600 font-bold">
              {activeRoutes.length} India Road {activeRoutes.length === 1 ? 'Option' : 'Options'}
            </span>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION: Offline Caching or Loading Feedback */}
      {offlineToast && (
        <div
          id="offline-toast-notification"
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2 duration-200 ${
            offlineToast.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50 shadow-emerald-950/20'
              : 'bg-rose-950 text-rose-200 border-rose-500/50 shadow-rose-950/20'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {offlineToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="leading-snug">{offlineToast.message}</span>
          </div>
          <button
            onClick={() => setOfflineToast(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* EMERGENCY NETWORK OUTAGE ADVISORY BANNER (Real or Simulated) */}
      {(isSimulatedOffline || !isNetworkOnline) && (
        <div
          id="offline-outage-advisory"
          className="p-4 bg-gradient-to-r from-amber-950/95 via-amber-900/90 to-slate-900 border-2 border-amber-500 text-white rounded-2xl shadow-xl space-y-2.5 animate-in fade-in"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
              <WifiOff className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>Flood Emergency: Network Outage Detected</span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                {isSimulatedOffline ? 'Simulated Outage Mode' : 'Offline'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="open-offline-drawer-from-banner"
                onClick={() => setIsOfflineDrawerOpen(true)}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Open Cached Routes ({storageStats.count})</span>
              </button>

              {isSimulatedOffline && (
                <button
                  onClick={() => setIsSimulatedOffline(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition border border-slate-700"
                >
                  Exit Simulation
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-amber-200/90 leading-relaxed">
            Severe storms, cloudbursts, and urban flooding routinely cause telecom tower and cellular data outages.
            HydroNav is operating in <strong>IndexedDB Offline Emergency Mode</strong>. You can navigate safely along
            pre-cached road coordinates without requiring any active internet connection.
          </p>
        </div>
      )}

      {/* OFFLINE DISASTER RESILIENCE ACTION BAR */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* 1. Download Current Offline Map Button */}
          <button
            id="download-offline-map-btn"
            onClick={handleDownloadOfflineRoute}
            disabled={isSavingOffline || !currentRoute}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
              isCurrentRouteCached
                ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white ring-2 ring-emerald-500/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
            title="Cache current route coordinates to IndexedDB for offline disaster navigation"
          >
            {isSavingOffline ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Caching to IndexedDB...</span>
              </>
            ) : isCurrentRouteCached ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Update Cached Route (IndexedDB)</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Offline Map</span>
              </>
            )}
          </button>

          {/* 2. Open Saved Routes Drawer Button */}
          <button
            id="manage-offline-routes-btn"
            onClick={() => setIsOfflineDrawerOpen(true)}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 flex items-center gap-2"
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span>Saved Offline Routes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-[10px] font-black text-white">
              {storageStats.count}
            </span>
          </button>
        </div>

        {/* 3. Outage Simulation Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Storage: <strong className="text-slate-300 font-mono">{storageStats.formattedSize}</strong> in IndexedDB
          </span>

          <button
            id="toggle-offline-simulation-btn"
            onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              isSimulatedOffline
                ? 'bg-amber-600 text-white border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
            title="Simulate network blackout to verify offline cached navigation"
          >
            {isSimulatedOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                <span>Outage Active (Testing)</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulate Outage</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKBENCH: Map on Left / Route Comparisons on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-7 space-y-4" ref={mapSectionRef}>
          <InteractiveMap
            highlightRouteId={selectedRouteId}
            showAllRoutes={false}
            title={`Active Route Navigation: ${originPoint.name.split(',')[0]} → ${destinationPoint.name.split(',')[0]}`}
          />

          {/* Map info bar */}
          <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center justify-between border border-slate-200">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>
                {activeOfflineRouteId
                  ? 'Active route loaded directly from IndexedDB offline storage.'
                  : 'Displaying verified road route. Click "Download Offline Map" to cache coordinates.'}
              </span>
            </div>
            <button
              onClick={() => setCurrentPage('report-flood')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
            >
              Report road blocked &rarr;
            </button>
          </div>
        </div>

        {/* Right Column: Route Cards & Comparison Matrix */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Route className="w-5 h-5 text-blue-600" />
              Route Alternatives ({activeRoutes.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Sorted by Flood Safety</span>
          </div>

          {/* Route Calculation Error Message if no valid route in India */}
          {routeError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1.5 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>India-Only Route Constraint Notice</span>
              </div>
              <p className="text-slate-700 leading-relaxed">{routeError}</p>
            </div>
          )}

          {/* ROUTE COMPARISON CARDS */}
          <div className="space-y-4">
            {activeRoutes.map((route) => {
              const isSelected = selectedRouteId === route.id;
              const isRouteB = route.id === 'route-b';
              const isRouteA = route.id === 'route-a';

              return (
                <div
                  key={route.id}
                  id={`route-card-${route.id}`}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative ${
                    route.isRecommended
                      ? isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/20'
                        : 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-500'
                      : isSelected
                      ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Badge Tag */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                          route.isRecommended
                            ? 'bg-emerald-600 text-white'
                            : route.riskLevel === 'high'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {route.name}
                      </span>
                      {route.isRecommended && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-emerald-700" />
                          Recommended
                        </span>
                      )}
                    </div>

                    <div
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        route.riskLevel === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : route.riskLevel === 'moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {route.riskLevel === 'high' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      Risk: {route.riskScore}/100
                    </div>
                  </div>

                  {/* Via description */}
                  <div className="text-xs text-slate-500 font-medium mb-3">{route.via}</div>

                  {/* Key Metrics Comparison Grid (Distance, Time, Risk) */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-50/80 rounded-xl border border-slate-100 mb-3">
                    <div className="p-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Distance</div>
                      <div className="text-sm font-extrabold text-slate-800">{route.distanceKm} km</div>
                    </div>

                    <div className="p-1.5 border-x border-slate-200/60">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Est. Time</div>
                      <div
                        className={`text-sm font-extrabold ${
                          route.hasBlockedRoad ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        {route.estimatedMinutes} min
                      </div>
                    </div>

                    <div className="p-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Flood Risk</div>
                      <div
                        className={`text-sm font-extrabold capitalize ${
                          route.riskLevel === 'high'
                            ? 'text-rose-600'
                            : route.riskLevel === 'moderate'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {route.riskLevel}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation / Hazard Warning text */}
                  <div
                    className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                      route.isRecommended
                        ? 'bg-emerald-100/70 text-emerald-900 font-medium'
                        : route.riskLevel === 'high'
                        ? 'bg-rose-100/70 text-rose-900 font-medium'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {route.recommendationReason}
                  </div>

                  {/* Select button */}
                  <div className="mt-3 flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400 text-[11px]">
                      {isSelected ? '✓ Currently previewing on map' : 'Click card to view path'}
                    </span>
                    <button
                      className={`font-bold px-3 py-1 rounded-lg text-xs transition ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TURN BY TURN NAVIGATION DETAILS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-blue-600" />
                Turn-by-Turn Safety Breakdown ({currentRoute.name})
              </h4>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                {currentRoute.steps.length} Steps
              </span>
            </div>

            <div className="space-y-3">
              {currentRoute.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-bold text-slate-900">{step.instruction}</div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                      <span>Segment: {step.distanceKm} km</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Mountain className="w-3 h-3 text-slate-400" />
                        Elev: {step.elevationMeters}m
                      </span>
                      <span>&bull;</span>
                      <span
                        className={`font-semibold ${
                          step.riskLevel === 'high'
                            ? 'text-rose-600'
                            : step.riskLevel === 'moderate'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        Risk {step.riskScore}/100
                      </span>
                    </div>

                    {step.hazardNote && (
                      <div
                        className={`p-2 rounded-md text-[11px] font-medium mt-1 ${
                          step.riskLevel === 'high'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {step.hazardNote}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* INDEXEDDB OFFLINE MAPS MODAL / DRAWER */}
      {isOfflineDrawerOpen && (
        <div
          id="offline-maps-modal"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsOfflineDrawerOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 text-white space-y-5 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                    <Database className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    IndexedDB Offline Routes Cache
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Access navigation paths without cellular network or internet connectivity during flood disasters.
                </p>
              </div>

              <button
                id="close-offline-modal-btn"
                onClick={() => setIsOfflineDrawerOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Storage Usage Summary Bar */}
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>
                  Stored: <strong className="text-white font-mono">{storageStats.count}</strong> routes (
                  <span className="text-emerald-400 font-mono font-bold">{storageStats.formattedSize}</span>)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Target DB: <code className="text-slate-400 font-mono">HydroNavOfflineDB.offlineRoutes</code>
              </span>
            </div>

            {/* Cached Routes List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[160px]">
              {cachedRoutes.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3 border-2 border-dashed border-slate-800 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                    <Download className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-300">No Offline Routes Cached Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Click <strong>&quot;Download Offline Map&quot;</strong> on any calculated route to cache all road coordinates,
                      waypoints, and turn-by-turn guidance into IndexedDB for offline disaster use.
                    </p>
                  </div>
                </div>
              ) : (
                cachedRoutes.map((item) => {
                  const isCurrentlyActive = activeOfflineRouteId === item.id;
                  const dateStr = new Date(item.savedAt).toLocaleDateString();
                  const timeStr = new Date(item.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isCurrentlyActive
                          ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">
                              {item.origin.name.split(',')[0]} → {item.destination.name.split(',')[0]}
                            </span>
                            {isCurrentlyActive && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500 text-slate-950 text-[10px] font-black uppercase">
                                Active on Map
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {item.route.name} ({item.route.via})
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            item.route.riskLevel === 'high'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          Risk: {item.route.riskScore}/100
                        </span>
                      </div>

                      {/* Metrics Pill Grid */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 bg-slate-900/90 rounded-xl border border-slate-800/80">
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-500">Distance</div>
                          <div className="text-xs font-bold text-slate-200">{item.route.distanceKm} km</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-500">Duration</div>
                          <div className="text-xs font-bold text-slate-200">{item.route.estimatedMinutes} min</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-500">Road Points</div>
                          <div className="text-xs font-bold text-emerald-400 font-mono">{item.pointCount} pts</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-500">Saved</div>
                          <div className="text-[10px] font-medium text-slate-400">{timeStr}</div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {dateStr} · {Math.round(item.sizeBytesApprox / 1024)} KB
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectCachedRoute(item)}
                            className="py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Load Route Offline</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadOfflineRouteFile(item, 'geojson')}
                            className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center gap-1 border border-slate-700"
                            title="Export route coordinates as GeoJSON"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>GeoJSON</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteCachedRoute(item.id, e)}
                            className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white transition border border-rose-800/80"
                            title="Delete cached route from IndexedDB"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              {cachedRoutes.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearAllCached}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Stored Routes</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setIsOfflineDrawerOpen(false)}
                className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
