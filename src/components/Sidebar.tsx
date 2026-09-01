import React from 'react';
import { useHydro } from '../context/HydroContext';
import { AppPage } from '../types';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Compass,
  Gauge,
  HelpCircle,
  LifeBuoy,
  MapPin,
  Navigation,
  PhoneCall,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  onOpenRiskExplainer: () => void;
  onOpenEmergencySOS: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenRiskExplainer,
  onOpenEmergencySOS,
  mobileOpen = false,
  onCloseMobile,
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

  const navItems: { id: AppPage; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Gauge className="w-5 h-5" />,
      badge: `${citySummary.highRiskRoadsCount} High`,
    },
    {
      id: 'safe-route',
      label: 'Safe Route',
      icon: <Navigation className="w-5 h-5" />,
      badge: 'Optimized',
    },
    {
      id: 'report-flood',
      label: 'Report Flood',
      icon: <ShieldAlert className="w-5 h-5" />,
      badge: 'Live',
    },
    {
      id: 'home',
      label: 'City Overview',
      icon: <Compass className="w-5 h-5" />,
    },
  ];

  const handleNavClick = (page: AppPage) => {
    setCurrentPage(page);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const activeAlert = alerts[0] || {
    title: 'Flash Flood Watch',
    message: 'Heavy rain forecast for North & Downtown corridors. Avoid low-lying underpasses.',
    level: 'high',
  };

  return (
    <aside
      id="hydro-sidebar"
      className={`w-64 bg-slate-900 text-white flex flex-col shrink-0 h-full border-r border-slate-800 transition-all duration-300 z-30 ${
        mobileOpen
          ? 'fixed inset-y-0 left-0 shadow-2xl flex'
          : 'hidden md:flex relative'
      }`}
    >
      {/* Brand Header */}
      <div
        className="p-6 flex items-center gap-3 cursor-pointer select-none"
        onClick={() => handleNavClick('home')}
      >
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shadow-sm shadow-blue-500/40">
          <Waves className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight uppercase font-display text-white">
            HydroNav
          </span>
          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
            Disaster Command
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
          Navigation
        </div>

        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <div
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition text-sm ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-blue-800 text-blue-100'
                      : item.id === 'report-flood'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}

        {/* Disaster Scenarios Quick Bar */}
        <div className="pt-4 mt-2 border-t border-slate-800/80">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1 mb-1">
            Simulate Scenarios
          </div>

          <div className="space-y-1">
            <button
              onClick={() => triggerPresetSimulation('flash_flood_downtown')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-300 hover:bg-rose-950/50 hover:text-rose-100 transition flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Downtown Flash Flood</span>
            </button>

            <button
              onClick={() => triggerPresetSimulation('harbor_surge')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-950/50 hover:text-amber-100 transition flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Harbor Tidal Surge</span>
            </button>

            <button
              onClick={() => triggerPresetSimulation('heavy_cloudburst')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-blue-300 hover:bg-blue-950/50 hover:text-blue-100 transition flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>85 mm/h Cloudburst</span>
            </button>

            <button
              onClick={resetDemoData}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {/* Telemetry Indicator */}
        <div className="pt-3">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-300 font-medium">Sensors Active</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-400">{rainfallMmHr} mm/h</span>
          </div>
        </div>
      </nav>

      {/* Critical Alert Card at Sidebar Bottom */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-red-500/20 border border-red-500/50 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Critical Alert
            </p>
            <span className="text-[9px] bg-red-500 text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
              Live
            </span>
          </div>
          <p className="text-xs text-white leading-relaxed font-normal">
            {activeAlert.message}
          </p>
        </div>
      </div>
    </aside>
  );
};
