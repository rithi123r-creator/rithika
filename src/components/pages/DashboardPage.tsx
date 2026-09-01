import React, { useState } from 'react';
import { useHydro } from '../../context/HydroContext';
import { InteractiveMap } from '../InteractiveMap';
import { CitizenReport } from '../../types';
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle,
  CheckCircle2,
  Clock,
  CloudRain,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Gauge,
  HelpCircle,
  Hospital,
  LifeBuoy,
  MapPin,
  Mountain,
  Navigation,
  Phone,
  PhoneCall,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ThumbsUp,
  TrendingUp,
  Users,
  Waves,
  Zap,
} from 'lucide-react';

interface DashboardPageProps {
  onOpenRiskExplainer: () => void;
  onOpenEmergencySOS: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenRiskExplainer,
  onOpenEmergencySOS,
}) => {
  const {
    citySummary,
    citizenReports,
    emergencyResources,
    alerts,
    roads,
    activeRoutes,
    selectedRouteId,
    setSelectedRouteId,
    rainfallMmHr,
    setRainfallMmHr,
    triggerPresetSimulation,
    resetDemoData,
    upvoteReport,
    setCurrentPage,
    setSelectedRoad,
  } = useHydro();

  const [selectedReportPhoto, setSelectedReportPhoto] = useState<CitizenReport | null>(null);
  const [reportFilter, setReportFilter] = useState<'all' | 'high' | 'blocked'>('all');
  const [resourceFilter, setResourceFilter] = useState<'all' | 'shelter' | 'hospital' | 'fire_station'>('all');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const filteredReports = citizenReports.filter((r) => {
    if (reportFilter === 'high') return r.waterLevel === 'high';
    if (reportFilter === 'blocked') return r.isBlocked;
    return true;
  });

  const filteredResources = emergencyResources.filter((r) => {
    if (resourceFilter === 'all') return true;
    return r.type === resourceFilter;
  });

  const routeA = activeRoutes.find((r) => r.id === 'route-a') || activeRoutes[0];
  const routeB = activeRoutes.find((r) => r.id === 'route-b') || activeRoutes[1] || activeRoutes[0];

  // Calculate shelter total and occupancy
  const totalShelterCapacity = emergencyResources
    .filter((r) => r.type === 'shelter')
    .reduce((acc, s) => acc + s.capacityTotal, 0);
  const usedShelterCapacity = emergencyResources
    .filter((r) => r.type === 'shelter')
    .reduce((acc, s) => acc + s.capacityUsed, 0);
  const shelterCapacityPercent = totalShelterCapacity > 0
    ? Math.round((usedShelterCapacity / totalShelterCapacity) * 100)
    : 84;

  const handleExportData = () => {
    const dataStr = JSON.stringify({
      timestamp: new Date().toISOString(),
      citySummary,
      activeRoutes,
      citizenReports,
      emergencyResources,
      rainfallMmHr,
    }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hydronav-city-telemetry-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div id="hydro-dashboard-page" className="space-y-6 pb-10 animate-in fade-in duration-200">
      {/* 4 TOP KPI METRIC TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Reports */}
        <div
          id="kpi-total-reports"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Reports</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">
              {citySummary.totalCitizenReports || 242}
            </p>
            <span className="text-[11px] font-semibold text-emerald-600">
              +100% verified
            </span>
          </div>
        </div>

        {/* KPI 2: High Risk Roads */}
        <div
          id="kpi-high-risk-roads"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">High Risk Roads</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-bold text-red-600">
              {citySummary.highRiskRoadsCount || 18}
            </p>
            <span className="text-[11px] font-semibold text-red-600">
              {citySummary.blockedRoadsCount} blocked
            </span>
          </div>
        </div>

        {/* KPI 3: Active Alerts */}
        <div
          id="kpi-active-alerts"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Active Alerts</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">
              {citySummary.activeAlertsCount || 12}
            </p>
            <span className="text-[11px] font-semibold text-blue-600">
              Citywide broadcast
            </span>
          </div>
        </div>

        {/* KPI 4: Shelter Capacity */}
        <div
          id="kpi-shelter-capacity"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
        >
          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Shelter Capacity</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              {shelterCapacityPercent}%
            </p>
            <span className="text-[11px] font-semibold text-emerald-600">
              {citySummary.activeSheltersCount} open hubs
            </span>
          </div>
        </div>
      </div>

      {/* MAIN 12-COLUMN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: LIVE MAP (Top) + ROUTE RECOMMENDATION COMPARISON (Bottom) (8 Cols) */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          {/* Live Map Box */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-800">Live City Flood Map Layer</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage('safe-route')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                >
                  Open Full Navigation View &rarr;
                </button>
              </div>
            </div>

            <InteractiveMap interactive={true} showAllRoutes={true} />
          </div>

          {/* Route Recommendation Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left 1/3 Summary */}
              <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 md:pr-6 pb-4 md:pb-0">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Route Recommendation</h3>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                  Calculating based on Rainfall + History + Reports
                </p>

                <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 space-y-1">
                  <p className="text-xs text-blue-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    Recommendation: {routeB.name}
                  </p>
                  <p className="text-[11px] text-blue-600 font-medium">
                    Safest travel path found.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    id="dashboard-view-turn-by-turn-btn"
                    onClick={() => setCurrentPage('safe-route')}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    Navigate Safe Route
                  </button>
                </div>
              </div>

              {/* Right 2/3: Comparison Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Route A Card */}
                <div
                  onClick={() => {
                    setSelectedRouteId(routeA.id);
                    setCurrentPage('safe-route');
                  }}
                  className="bg-red-50/80 border border-red-200 p-4 rounded-xl cursor-pointer hover:border-red-400 transition space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                      {routeA.name}
                    </span>
                    <span className="text-[11px] font-extrabold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      {routeA.riskScore} Risk
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {routeA.distanceKm} km &bull; {routeA.estimatedMinutes} min &bull;{' '}
                    <span className="text-red-700 font-bold">High Hazard</span>
                  </p>
                  <div className="w-full bg-red-200 h-1.5 mt-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, routeA.riskScore)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-red-800 leading-tight pt-1">
                    {routeA.hasBlockedRoad ? '⚠️ Submerged underpass detected' : 'Flash flood risk'}
                  </p>
                </div>

                {/* Route B Card */}
                <div
                  onClick={() => {
                    setSelectedRouteId(routeB.id);
                    setCurrentPage('safe-route');
                  }}
                  className="bg-green-50/80 border border-green-200 p-4 rounded-xl ring-2 ring-green-400/80 cursor-pointer hover:border-green-500 transition space-y-2 shadow-xs"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-green-800 uppercase tracking-wide">
                        {routeB.name}
                      </span>
                      <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-200 px-1.5 py-0.2 rounded">
                        Safe
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      {routeB.riskScore} Risk
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {routeB.distanceKm} km &bull; {routeB.estimatedMinutes} min &bull;{' '}
                    <span className="text-green-700 font-bold">Very Safe</span>
                  </p>
                  <div className="w-full bg-green-200 h-1.5 mt-2 rounded-full overflow-hidden">
                    <div
                      className="bg-green-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(15, routeB.riskScore)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-green-900 leading-tight pt-1">
                    ✓ High elevation arterial route free of pooling
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RISK ANALYSIS ENGINE (Top) + RECENT REPORTS (Bottom) (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Risk Analysis Engine Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Risk Analysis Engine</h3>
              <button
                onClick={onOpenRiskExplainer}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold underline"
              >
                Formula
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Metric 1: Rainfall Intensity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-600 uppercase font-semibold text-[11px]">
                    Rainfall Intensity
                  </span>
                  <span className="font-bold text-slate-800">
                    {rainfallMmHr > 40 ? 'Heavy' : rainfallMmHr > 15 ? 'Moderate' : 'Light'} ({rainfallMmHr}mm/h)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (rainfallMmHr / 60) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Metric 2: Citizen Reports */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-600 uppercase font-semibold text-[11px]">
                    Citizen Ground Reports
                  </span>
                  <span className="font-bold text-slate-800">
                    {citySummary.totalCitizenReports > 15 ? 'High Volume' : 'Active'} ({citySummary.totalCitizenReports}/day)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (citySummary.totalCitizenReports / 30) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Metric 3: Drainage & Elevation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-600 uppercase font-semibold text-[11px]">
                    Drainage Stress Factor
                  </span>
                  <span className="font-bold text-slate-800">
                    {citySummary.highRiskRoadsCount > 2 ? 'Submerged Basin' : 'Normal Flow'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, citySummary.highRiskRoadsCount * 25)}%` }}
                  />
                </div>
              </div>

              {/* Global Index Score */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                <span className="text-sm font-bold text-slate-800">Global City Risk Score</span>
                <span
                  className={`text-lg font-extrabold ${
                    citySummary.overallCityRiskScore > 50
                      ? 'text-rose-600'
                      : citySummary.overallCityRiskScore > 25
                      ? 'text-amber-500'
                      : 'text-emerald-600'
                  }`}
                >
                  {citySummary.overallCityRiskScore} / 100
                </span>
              </div>
            </div>
          </div>

          {/* Recent Reports Feed Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Recent Reports
              </h3>
              <button
                onClick={() => setReportFilter(reportFilter === 'all' ? 'high' : 'all')}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase"
              >
                {reportFilter === 'all' ? 'Filter High' : 'View All'}
              </button>
            </div>

            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {filteredReports.slice(0, 4).map((report) => {
                const dotColor =
                  report.waterLevel === 'high'
                    ? 'bg-red-500'
                    : report.waterLevel === 'medium'
                    ? 'bg-amber-500'
                    : 'bg-green-500';

                return (
                  <div
                    key={report.id}
                    id={`report-item-${report.id}`}
                    className="flex gap-3 items-start pb-3 border-b border-slate-50 last:border-0 last:pb-0"
                  >
                    <div className={`w-2 h-2 rounded-full ${dotColor} mt-1.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {report.roadName}
                        </p>
                        {report.photoUrl && (
                          <button
                            onClick={() => setSelectedReportPhoto(report)}
                            className="text-[10px] text-blue-600 hover:underline font-semibold shrink-0"
                          >
                            Photo
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Water: <strong className="capitalize">{report.waterLevel}</strong> ({report.waterDepthCm}cm) &bull; Blocked:{' '}
                        <strong className={report.isBlocked ? 'text-red-600' : 'text-slate-700'}>
                          {report.isBlocked ? 'Yes' : 'No'}
                        </strong>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {report.timestamp} &bull; by {report.reporterName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                id="dashboard-download-full-data-btn"
                onClick={handleExportData}
                className="w-full py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg uppercase transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                {downloadSuccess ? 'Telemetry Exported!' : 'Download Full Data'}
              </button>

              <button
                onClick={() => setCurrentPage('report-flood')}
                className="w-full py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition text-center"
              >
                + Submit New Ground Report
              </button>
            </div>
          </div>

          {/* Emergency Facilities Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                Emergency Facilities
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Live Beds</span>
            </div>

            <div className="space-y-2.5">
              {emergencyResources.slice(0, 3).map((res) => {
                const isShelter = res.type === 'shelter';
                const occupancyPercent = Math.round((res.capacityUsed / res.capacityTotal) * 100);

                return (
                  <div
                    key={res.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{res.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {res.capacityTotal - res.capacityUsed} slots open &bull; {occupancyPercent}% full
                      </div>
                    </div>
                    <a
                      href={`tel:${res.contactNumber}`}
                      className="p-1.5 bg-white border border-slate-200 rounded-md text-blue-600 hover:bg-blue-50"
                      title={`Call ${res.contactNumber}`}
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* PHOTO PREVIEW MODAL */}
      {selectedReportPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedReportPhoto(null)}
        >
          <div
            className="bg-slate-900 text-white rounded-2xl overflow-hidden max-w-lg w-full border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">{selectedReportPhoto.roadName}</h4>
                <p className="text-xs text-slate-400">{selectedReportPhoto.locationDescription}</p>
              </div>
              <button
                onClick={() => setSelectedReportPhoto(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              <img
                src={selectedReportPhoto.photoUrl}
                alt={selectedReportPhoto.photoCaption || 'Report photo'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4 space-y-1 text-xs">
              <div className="text-slate-400 flex items-center justify-between text-[11px]">
                <span>Reported by {selectedReportPhoto.reporterName}</span>
                <span>Water depth: {selectedReportPhoto.waterDepthCm} cm</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
