import React from 'react';
import { useHydro } from '../../context/HydroContext';
import { InteractiveMap } from '../InteractiveMap';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  CloudLightning,
  CloudRain,
  Compass,
  Gauge,
  Layers,
  LifeBuoy,
  MapPin,
  Mountain,
  Navigation,
  PhoneCall,
  Radio,
  RotateCcw,
  Route,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Waves,
  Zap,
} from 'lucide-react';

interface HomePageProps {
  onOpenRiskExplainer: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenRiskExplainer }) => {
  const {
    citySummary,
    setCurrentPage,
    rainfallMmHr,
    setRainfallMmHr,
    triggerPresetSimulation,
    roads,
    setSelectedRoad,
  } = useHydro();

  // Find the highest risk road and the safest road for quick showcase
  const highestRiskRoad = [...roads].sort((a, b) => b.riskScore - a.riskScore)[0];
  const safestRoad = [...roads].sort((a, b) => a.riskScore - b.riskScore)[0];

  return (
    <div id="hydro-home-page" className="space-y-12 pb-12 animate-in fade-in duration-200">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-10 lg:p-12 border border-slate-800 shadow-2xl">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/90 border border-blue-700/60 text-blue-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Smart-City Urban Disaster Mitigation System
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Waves className="w-7 h-7" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-display">
                  HYDRO<span className="text-blue-400">NAV</span>
                </h1>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight leading-snug">
                &ldquo;Don't just find a route.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400">
                  Find a safe route.
                </span>
                &rdquo;
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                During urban flooding, standard GPS apps route you straight into submerged underpasses and waterlogged bottlenecks. HydroNav analyzes live rainfall telemetry, elevation LiDAR, drainage capacity, and citizen reports to calculate safe, flood-resistant routes.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                id="hero-find-safe-route-btn"
                onClick={() => setCurrentPage('safe-route')}
                className="py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center justify-center gap-2 group"
              >
                <Navigation className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                Find Safe Route
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                id="hero-report-flood-btn"
                onClick={() => setCurrentPage('report-flood')}
                className="py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 hover:border-slate-600 transition flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Report Flood Hazard
              </button>

              <button
                id="hero-view-dashboard-btn"
                onClick={() => setCurrentPage('dashboard')}
                className="py-3.5 px-4 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Gauge className="w-4 h-4 text-amber-400" />
                Disaster Dashboard
              </button>
            </div>

            {/* Quick Live Status Ticker */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong className="text-white">{citySummary.safeRoadsCount}</strong> Safe Corridors
                </span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>
                  <strong className="text-white">{citySummary.highRiskRoadsCount}</strong> High Risk Roadblocks
                </span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>
                  <strong className="text-white">{citySummary.totalCitizenReports}</strong> Citizen Reports
                </span>
              </div>
            </div>
          </div>

          {/* Hero Right: Current City Flood-Risk Card */}
          <div className="lg:col-span-5">
            <div
              id="city-flood-risk-card"
              className="bg-slate-950/90 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    City Flood Risk Index
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  REAL-TIME
                </span>
              </div>

              {/* Main Circular Score & Status */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center gap-4">
                  {/* Gauge Circle */}
                  <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={
                          citySummary.overallScore > 60
                            ? 'text-rose-500'
                            : citySummary.overallScore > 30
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }
                        strokeDasharray={`${citySummary.overallScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white leading-none">
                        {citySummary.overallScore}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">/ 100</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Current Urban Status</div>
                    <div
                      className={`text-lg font-black uppercase tracking-tight ${
                        citySummary.riskLevel === 'high'
                          ? 'text-rose-400'
                          : citySummary.riskLevel === 'moderate'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {citySummary.riskLevel} Flood Hazard
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Rainfall: <span className="text-white font-semibold">{citySummary.rainfallIntensityMmHr} mm/h</span> ({citySummary.rainfallStatus})
                    </div>
                  </div>
                </div>
              </div>

              {/* Rainfall Slider Control inside Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                    Simulate Precipitation
                  </span>
                  <span className="font-mono text-blue-400 font-bold">{rainfallMmHr} mm/h</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  step={5}
                  value={rainfallMmHr}
                  onChange={(e) => setRainfallMmHr(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Drizzle (10)</span>
                  <span>Storm (50)</span>
                  <span>Cloudburst (90)</span>
                </div>
              </div>

              {/* Quick simulation buttons */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={() => triggerPresetSimulation('flash_flood_downtown')}
                  className="flex-1 py-2 px-2.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-[11px] font-bold text-rose-200 transition flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  Simulate Flash Flood
                </button>
                <button
                  onClick={onOpenRiskExplainer}
                  className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition"
                  title="View formula"
                >
                  Formula &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 FEATURE CARDS SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Disaster Management Pillars
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Intelligent Flood Navigation Features
            </h3>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Engineered for high-stress flood emergencies with verifiable data and real-time hazard avoidance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Feature 1: Safe Route Engine */}
          <div
            id="feature-card-safe-route"
            onClick={() => setCurrentPage('safe-route')}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Navigation className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                1. Safe Route Engine
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prioritizes elevated bypasses and open culvert bridges over direct low-lying expressways to prevent vehicle stranding.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-700 gap-1">
              <span>Launch Navigator</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Feature 2: AI & Dynamic Risk Analysis */}
          <div
            id="feature-card-ai-risk"
            onClick={onOpenRiskExplainer}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                2. AI Risk Analysis
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-variable scoring synthesizing rainfall intensity, terrain elevation LiDAR, and drainage capacity in real-time.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-blue-700 gap-1">
              <span>Inspect Math Formula</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Feature 3: Citizen Reports */}
          <div
            id="feature-card-citizen-reports"
            onClick={() => setCurrentPage('report-flood')}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                3. Citizen Reports
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Crowd-sourced flood depth reporting with instant risk propagation to alert fellow drivers within seconds.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-rose-700 gap-1">
              <span>Submit Road Report</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Feature 4: Emergency Alerts */}
          <div
            id="feature-card-emergency-alerts"
            onClick={() => setCurrentPage('dashboard')}
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Radio className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                4. Emergency Alerts
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct integration with municipal disaster centers, open emergency evacuation shelters, and water rescue teams.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-amber-700 gap-1">
              <span>View Active Alerts</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE CITY THREAT MAP PREVIEW */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Live Geographic Telemetry
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Interactive Metro Flood Risk Map
            </h3>
          </div>
          <button
            onClick={() => setCurrentPage('safe-route')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            Open Full Route Navigator &rarr;
          </button>
        </div>

        <InteractiveMap interactive={true} title="Metro City Live Flood Telemetry Map" />
      </section>

      {/* QUICK COMPARISON SHOWCASE: Shortest vs Safest Route */}
      <section className="bg-gradient-to-br from-slate-900 to-navy-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Core HydroNav Innovation
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Why the Shortest Route Can Be Deadly
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Standard navigation algorithms calculate ETA purely by distance and speed limits. During urban flash floods, low-elevation underpasses become traps. HydroNav routes you through verified elevated corridors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Dangerous Route A preview */}
          <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-rose-900/80 text-rose-200 text-xs font-bold">
                Route A (Direct / Shortest)
              </span>
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> High Risk (85/100)
              </span>
            </div>
            <div className="text-slate-200 text-sm font-semibold">
              via Downtown Expressway & Canal Basin (Elev. 2.2m)
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 bg-slate-900/80 rounded-lg">
                <div className="text-slate-400 text-[10px]">Distance</div>
                <div className="font-bold text-white">8.2 km</div>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-lg">
                <div className="text-slate-400 text-[10px]">Est. Time</div>
                <div className="font-bold text-rose-400">18 - 55 min</div>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-lg">
                <div className="text-slate-400 text-[10px]">Water Depth</div>
                <div className="font-bold text-rose-400">0.65m Submerged</div>
              </div>
            </div>
            <p className="text-xs text-rose-300">
              ⚠ <strong>Impasse Warning:</strong> Underpass submerged. Stalled vehicles reported.
            </p>
          </div>

          {/* Recommended Safe Route B preview */}
          <div className="p-5 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/80 shadow-lg shadow-emerald-500/10 space-y-3 relative">
            <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              HydroNav Recommended
            </div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-emerald-900/80 text-emerald-200 text-xs font-bold">
                Route B (Elevated Safe Bypass)
              </span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Safe (25/100)
              </span>
            </div>
            <div className="text-slate-200 text-sm font-semibold">
              via Skyline Elevated Flyover (Elev. +24m)
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 bg-slate-900/80 rounded-lg">
                <div className="text-slate-400 text-[10px]">Distance</div>
                <div className="font-bold text-white">9.1 km (+0.9 km)</div>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-lg">
                <div className="text-slate-400 text-[10px]">Est. Time</div>
                <div className="font-bold text-emerald-400">23 min Steady</div>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-lg">
                <div className="text-slate-400 text-[10px]">Flood Risk</div>
                <div className="font-bold text-emerald-400">0% Submerged</div>
              </div>
            </div>
            <p className="text-xs text-emerald-300">
              ★ <strong>Continuous Viaduct:</strong> High clearance above flood basin. 100% dry transit.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            onClick={() => setCurrentPage('safe-route')}
            className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2"
          >
            Try the Interactive Route Comparison Engine
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
