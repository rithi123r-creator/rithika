import React from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  CloudRain,
  Flame,
  Gauge,
  Layers,
  MapPin,
  Mountain,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useHydro } from '../context/HydroContext';

interface RiskEngineExplainerProps {
  onClose: () => void;
}

export const RiskEngineExplainer: React.FC<RiskEngineExplainerProps> = ({ onClose }) => {
  const { rainfallMmHr, setRainfallMmHr } = useHydro();

  return (
    <div
      id="risk-explainer-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="risk-explainer-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">HydroNav Dynamic Risk Engine</h3>
              <p className="text-xs text-slate-400">Transparent Multi-Factor Risk Score Formulation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Formula summary */}
          <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-100">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
              Core Scoring Formula
            </div>
            <div className="text-xs font-mono text-blue-950 bg-white p-3 rounded-lg border border-blue-200/60 leading-relaxed font-semibold">
              Risk Score (0-100) = (0.30 × Rainfall) + (0.25 × Historical/Elevation) + (0.15 × Road Condition) + (0.30 × Citizen Depth Reports) + Blockage Penalty
            </div>
          </div>

          {/* Risk Level Thresholds */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Standardized Risk Thresholds
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">0 - 30: LOW (SAFE)</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Elevated bypasses, unflooded terrain, clear storm drains. Safe for all vehicles.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-900">31 - 60: MODERATE</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Curb ponding, moderate rainfall runoff. Sedans proceed with caution.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-900">61 - 100: HIGH RISK</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Submerged roadways, blocked underpasses, life-threatening flash surge. Reroute required.
                </p>
              </div>
            </div>
          </div>

          {/* 4 Pillars Breakdown */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              The 4 Risk Calculation Weights
            </h4>

            {/* Pillar 1 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">
                30%
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-slate-900">1. Rainfall Intensity Telemetry</strong>
                  <CloudRain className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Real-time precipitation rate (mm/h). Scaled from 0 mm/h (0 pts) to &gt;70 mm/h (100 pts). High intensity rain dramatically increases instant surface runoff before storm sewers can discharge.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">
                25%
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-slate-900">2. Historical Flood Risk & Topography</strong>
                  <Mountain className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Historical inundation frequency calibrated with topographic LiDAR elevation. Low elevation underpasses (e.g. &lt;3m) receive high baseline vulnerability, while elevated flyovers (+24m) are flood-resistant.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
                15%
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-slate-900">3. Road Condition & Culvert Capacity</strong>
                  <Layers className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Pavement integrity, curb height, and drainage grate capacity. Damaged roads with clogged drains deteriorate rapidly during storm events.
                </p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold text-xs">
                30%
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-slate-900">4. Live Citizen Ground Reports & Depth</strong>
                  <Users className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Crowd-sourced ground truth observations. When citizens upload water depth (Low, Medium, High) or report a blocked road, HydroNav immediately applies risk boosts and updates route alternatives.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive rainfall simulation inside modal */}
          <div className="p-4 bg-slate-900 text-white rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Interactive Rainfall Simulator
                </span>
              </div>
              <span className="text-sm font-bold text-blue-400 font-mono">
                {rainfallMmHr} mm/h
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={95}
              step={5}
              value={rainfallMmHr}
              onChange={(e) => setRainfallMmHr(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>Light (10 mm/h)</span>
              <span>Moderate (45 mm/h)</span>
              <span>Cloudburst (90 mm/h)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
