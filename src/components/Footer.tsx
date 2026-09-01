import React from 'react';
import { useHydro } from '../context/HydroContext';
import {
  Compass,
  Gauge,
  Heart,
  HelpCircle,
  Navigation,
  PhoneCall,
  Shield,
  ShieldAlert,
  Waves,
} from 'lucide-react';

interface FooterProps {
  onOpenRiskExplainer: () => void;
  onOpenEmergencySOS: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenRiskExplainer, onOpenEmergencySOS }) => {
  const { setCurrentPage } = useHydro();

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Waves className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight font-display">
                HYDRO<span className="text-blue-400">NAV</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              HydroNav is a smart-city disaster-management application engineered to help citizens, emergency first-responders, and transport operators identify flood-risk roads, avoid submerged bottlenecks, and choose verified safe routes during extreme urban flooding.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Live Telemetry Active
              </span>
              <span>&bull;</span>
              <span>Metro Flood Safety Protocol v3.4</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Application Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setCurrentPage('home')}
                  className="hover:text-white transition flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-blue-400" /> Home Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('safe-route')}
                  className="hover:text-white transition flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Safe Route Engine
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('report-flood')}
                  className="hover:text-white transition flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Citizen Flood Reporting
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="hover:text-white transition flex items-center gap-1.5"
                >
                  <Gauge className="w-3.5 h-3.5 text-amber-400" /> Disaster Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Safety & Emergency Hotline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Emergency & Protocols
            </h4>
            <div className="space-y-2 text-xs">
              <button
                onClick={onOpenEmergencySOS}
                className="w-full py-2 px-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-lg font-bold hover:bg-rose-900 transition flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                Emergency Hotline (911)
              </button>

              <button
                onClick={onOpenRiskExplainer}
                className="w-full py-2 px-3 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 hover:text-white transition flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                Risk Engine Calculation Details
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              In immediate life-threatening situations, dial 911 immediately. Never attempt to drive through standing water of unknown depth.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            &copy; {new Date().getFullYear()} HYDRONAV Smart-City Disaster Mitigation System.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Open Source Data</span>
            <span className="hover:text-slate-400 cursor-pointer">Privacy & Telemetry</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
