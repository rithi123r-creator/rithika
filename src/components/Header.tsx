import React, { useState } from 'react';
import { useHydro } from '../context/HydroContext';
import { AppPage } from '../types';
import {
  AlertCircle,
  AlertTriangle,
  CloudRain,
  Compass,
  Gauge,
  HelpCircle,
  Menu,
  Navigation,
  PhoneCall,
  RotateCcw,
  ShieldAlert,
  Waves,
  X,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  onOpenRiskExplainer: () => void;
  onOpenEmergencySOS: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRiskExplainer,
  onOpenEmergencySOS,
  onToggleMobileMenu,
}) => {
  const {
    currentPage,
    setCurrentPage,
    citySummary,
    rainfallMmHr,
    triggerPresetSimulation,
    resetDemoData,
    alerts,
  } = useHydro();

  const [showSimMenu, setShowSimMenu] = useState(false);

  // Derive dynamic page titles and risk badges
  const getPageTitle = (page: AppPage) => {
    switch (page) {
      case 'dashboard':
        return 'City Disaster Dashboard';
      case 'safe-route':
        return 'Flood-Resilient Safe Route Finder';
      case 'report-flood':
        return 'Report Urban Flood Hazard';
      case 'home':
      default:
        return 'Disaster Command Center Overview';
    }
  };

  const getRiskBadge = () => {
    if (citySummary.highRiskRoadsCount > 1 || citySummary.overallCityRiskScore > 50) {
      return {
        label: `Risk: High (${citySummary.overallCityRiskScore}/100)`,
        classes: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    } else if (citySummary.overallCityRiskScore > 25 || citySummary.moderateRiskRoadsCount > 0) {
      return {
        label: `Risk: Moderate (${citySummary.overallCityRiskScore}/100)`,
        classes: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    }
    return {
      label: `Risk: Low (${citySummary.overallCityRiskScore}/100)`,
      classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  };

  const riskBadge = getRiskBadge();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 shrink-0 select-none">
      {/* Left side: Mobile button + Title + Status badge */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
        {/* Mobile menu toggle button */}
        <button
          id="mobile-sidebar-toggle-btn"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate tracking-tight">
            {getPageTitle(currentPage)}
          </h1>
          <span
            className={`hidden sm:inline-flex px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider border ${riskBadge.classes}`}
          >
            {riskBadge.label}
          </span>
        </div>
      </div>

      {/* Right side: Action buttons, Simulation trigger, User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Simulator dropdown */}
        <div className="relative hidden md:block">
          <button
            id="header-sim-trigger-btn"
            onClick={() => setShowSimMenu(!showSimMenu)}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5"
            title="Simulate flood scenarios"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulate</span>
          </button>

          {showSimMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1"
              onClick={() => setShowSimMenu(false)}
            >
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Telemetry Scenarios
              </div>
              <button
                onClick={() => triggerPresetSimulation('flash_flood_downtown')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-rose-950 text-rose-300 transition"
              >
                Trigger Flash Flood (Downtown)
              </button>
              <button
                onClick={() => triggerPresetSimulation('harbor_surge')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-amber-950 text-amber-300 transition"
              >
                Trigger Harbor Tidal Surge
              </button>
              <button
                onClick={() => triggerPresetSimulation('heavy_cloudburst')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-950 text-blue-300 transition"
              >
                Simulate 85mm/h Cloudburst
              </button>
              <button
                onClick={resetDemoData}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5 border-t border-slate-800 mt-1 pt-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Data
              </button>
            </div>
          )}
        </div>

        {/* Risk formula modal button */}
        <button
          id="header-formula-btn"
          onClick={onOpenRiskExplainer}
          className="hidden sm:flex p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold border border-slate-200 transition"
          title="Risk Engine Formula"
        >
          <HelpCircle className="w-4 h-4 text-blue-600" />
        </button>

        {/* Primary CTA: Report New Flood */}
        <button
          id="header-report-btn"
          onClick={() => setCurrentPage('report-flood')}
          className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition shadow-xs flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Report New Flood</span>
          <span className="sm:hidden">Report</span>
        </button>

        {/* Emergency Hotline SOS Button */}
        <button
          id="header-sos-btn"
          onClick={onOpenEmergencySOS}
          className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SOS</span>
        </button>

        {/* User / Operator Badge */}
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs sm:text-sm shadow-2xs shrink-0 cursor-pointer"
          title="City Operations Command (Operator: JD)"
        >
          JD
        </div>
      </div>
    </header>
  );
};
