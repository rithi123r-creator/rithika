import React, { useState } from 'react';
import { useHydro } from '../../context/HydroContext';
import { InteractiveMap } from '../InteractiveMap';
import { SAMPLE_PRESET_DESTINATIONS, SAMPLE_PRESET_ORIGINS } from '../../data/mockData';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Clock,
  Compass,
  CornerDownRight,
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
  TrendingUp,
  Waves,
  Zap,
} from 'lucide-react';

export const SafeRoutePage: React.FC = () => {
  const {
    sourceLocation,
    setSourceLocation,
    destinationLocation,
    setDestinationLocation,
    activeRoutes,
    selectedRouteId,
    setSelectedRouteId,
    rainfallMmHr,
    setRainfallMmHr,
    triggerPresetSimulation,
    submitFloodReport,
    setCurrentPage,
  } = useHydro();

  const [activeTab, setActiveTab] = useState<'compare' | 'turn_by_turn' | 'elevation'>('compare');

  // Find currently selected route
  const currentRoute = activeRoutes.find((r) => r.id === selectedRouteId) || activeRoutes[0];
  const recommendedRoute = activeRoutes.find((r) => r.isRecommended) || activeRoutes[0];

  const handleSwapLocations = () => {
    const temp = sourceLocation;
    setSourceLocation(destinationLocation);
    setDestinationLocation(temp);
  };

  return (
    <div id="hydro-safe-route-page" className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Flood-Resilient Navigation
            </span>
            <span className="text-xs text-slate-400 font-medium">Telemetry: {rainfallMmHr} mm/h</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Safe Route Finder & Comparison
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Compare travel time, distance, elevation profiles, and live flood risks. HydroNav recommends the safest practical path.
          </p>
        </div>

        {/* Live Simulation Quick Trigger */}
        <button
          id="simulate-flood-on-route-btn"
          onClick={() => triggerPresetSimulation('flash_flood_downtown')}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold transition flex items-center gap-2 shadow-xs"
        >
          <Zap className="w-3.5 h-3.5 text-rose-600" />
          Test Reroute (Flood Downtown Expressway)
        </button>
      </div>

      {/* SEARCH / ORIGIN & DESTINATION CARD */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Origin Input */}
          <div className="md:col-span-5 relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Starting Location (Source)
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100" />
              <select
                id="source-location-select"
                value={sourceLocation}
                onChange={(e) => setSourceLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              >
                {SAMPLE_PRESET_ORIGINS.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center py-1 md:py-0">
            <button
              id="swap-locations-btn"
              onClick={handleSwapLocations}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200"
              title="Swap start and destination"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Input */}
          <div className="md:col-span-5 relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Destination Location
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-emerald-600 font-bold text-sm">🏁</div>
              <select
                id="destination-location-select"
                value={destinationLocation}
                onChange={(e) => setDestinationLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              >
                {SAMPLE_PRESET_DESTINATIONS.map((dest) => (
                  <option key={dest.id} value={dest.name}>
                    {dest.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKBENCH: Map on Left / Route Comparisons on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-7 space-y-4">
          <InteractiveMap
            highlightRouteId={selectedRouteId}
            showAllRoutes={true}
            title={`Active Route Navigation: ${sourceLocation.split(' ')[0]} → ${destinationLocation.split(' ')[0]}`}
          />

          {/* Map info bar */}
          <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center justify-between border border-slate-200">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Click on any road to inspect drainage telemetry and historical elevation.</span>
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
    </div>
  );
};
