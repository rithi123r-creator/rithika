import React from 'react';
import { RoadSegment } from '../types';
import { calculateRoadRisk, getRiskColorClasses } from '../utils/riskEngine';
import { useHydro } from '../context/HydroContext';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Droplets,
  Layers,
  MapPin,
  Mountain,
  ShieldAlert,
  X,
} from 'lucide-react';

interface RoadDetailModalProps {
  road: RoadSegment | null;
  onClose: () => void;
}

export const RoadDetailModal: React.FC<RoadDetailModalProps> = ({ road, onClose }) => {
  const { rainfallMmHr, setCurrentPage } = useHydro();

  if (!road) return null;

  const riskBreakdown = calculateRoadRisk(road, rainfallMmHr);
  const colorClasses = getRiskColorClasses(road.riskLevel);

  return (
    <div
      id="road-detail-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="road-detail-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-semibold">
                {road.code}
              </span>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                {road.category} Corridor
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">{road.name}</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-400" />
              {road.fromLocation} &rarr; {road.toLocation} ({road.lengthKm} km)
            </p>
          </div>
          <button
            id="close-road-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Main Risk Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              road.riskLevel === 'high'
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : road.riskLevel === 'moderate'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white ${colorClasses.bg} shadow-xs`}
              >
                {road.riskScore}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Flood Risk
                </div>
                <div className="text-base font-extrabold capitalize flex items-center gap-1.5">
                  {road.riskLevel} Risk Road
                  {road.isBlocked && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold animate-pulse">
                      BLOCKED
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <span>Scale: 0 - 100</span>
              <div className="font-medium text-slate-700 mt-0.5">{road.lastUpdated}</div>
            </div>
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div className="flex justify-center mb-1 text-blue-600">
                <Droplets className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-500">Water Level</div>
              <div className="text-sm font-bold capitalize text-slate-800">
                {road.waterLevel === 'none' ? 'Clear' : road.waterLevel}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div className="flex justify-center mb-1 text-indigo-600">
                <Mountain className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-500">Elevation</div>
              <div className="text-sm font-bold text-slate-800">
                {road.elevationMeters} m
                <span className="text-[10px] block font-normal text-slate-400">
                  {road.elevationMeters <= 5 ? 'Low Basin' : road.elevationMeters >= 20 ? 'Elevated' : 'Mid'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div className="flex justify-center mb-1 text-slate-600">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-500">Road Quality</div>
              <div className="text-sm font-bold capitalize text-slate-800">{road.roadCondition}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div className="flex justify-center mb-1 text-amber-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-500">Reports</div>
              <div className="text-sm font-bold text-slate-800">{road.reportsCount} citizen logs</div>
            </div>
          </div>

          {/* Blockage Warning */}
          {road.isBlocked && road.blockageReason && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-rose-950">Impassable Road Hazard</strong>
                {road.blockageReason}
              </div>
            </div>
          )}

          {/* Multi-Factor Mathematical Breakdown */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <span>Risk Score Engine Breakdown</span>
            </h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>1. Current Rainfall (30% weight - {rainfallMmHr} mm/h)</span>
                  <span className="font-semibold text-slate-800">+{riskBreakdown.rainfallContribution} pts</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${(riskBreakdown.rainfallContribution / 30) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>2. Historical Flood & Elevation (25% weight)</span>
                  <span className="font-semibold text-slate-800">+{riskBreakdown.historicalContribution} pts</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${(riskBreakdown.historicalContribution / 25) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>3. Road Condition & Drainage (15% weight)</span>
                  <span className="font-semibold text-slate-800">+{riskBreakdown.roadConditionContribution} pts</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${(riskBreakdown.roadConditionContribution / 15) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>4. Citizen Reports & Depth (30% weight)</span>
                  <span className="font-semibold text-slate-800">+{riskBreakdown.citizenReportsContribution} pts</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${(riskBreakdown.citizenReportsContribution / 30) * 100}%` }}
                  />
                </div>
              </div>

              {riskBreakdown.blockagePenalty > 0 && (
                <div className="flex justify-between text-rose-700 font-bold bg-rose-50 p-2 rounded-lg">
                  <span>5. Emergency Obstruction Penalty</span>
                  <span>+{riskBreakdown.blockagePenalty} pts</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              id="report-on-road-btn"
              onClick={() => {
                onClose();
                setCurrentPage('report-flood');
              }}
              className="flex-1 py-2.5 px-4 bg-navy-900 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              Report Flood on this Road
            </button>
            <button
              id="view-safe-route-btn"
              onClick={() => {
                onClose();
                setCurrentPage('safe-route');
              }}
              className="py-2.5 px-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition flex items-center justify-center gap-1.5"
            >
              Plan Safe Route Around
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
