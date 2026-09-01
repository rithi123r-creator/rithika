import React, { useState } from 'react';
import { useHydro } from '../context/HydroContext';
import { RoadSegment, RouteOption } from '../types';
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle,
  Eye,
  Flame,
  Hospital,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface InteractiveMapProps {
  highlightRouteId?: string;
  showAllRoutes?: boolean;
  interactive?: boolean;
  className?: string;
  title?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  highlightRouteId,
  showAllRoutes = false,
  interactive = true,
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
  } = useHydro();

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeLayer, setActiveLayer] = useState<'all' | 'high_risk' | 'routes' | 'shelters'>('all');
  const [hoveredRoad, setHoveredRoad] = useState<RoadSegment | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Determine which routes to display
  const targetRouteId = highlightRouteId || selectedRouteId;
  const routeB = activeRoutes.find((r) => r.id === 'route-b');
  const routeA = activeRoutes.find((r) => r.id === 'route-a');
  const selectedRoute = activeRoutes.find((r) => r.id === targetRouteId) || routeB;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.6, z + 0.2));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.8, z - 0.2));
  const handleResetZoom = () => setZoomLevel(1);

  // Color mapper
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

  return (
    <div
      id="hydro-interactive-map-container"
      className={`relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col ${className}`}
    >
      {/* Map Top Bar */}
      <div className="bg-slate-950/90 backdrop-blur-md px-4 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {title}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800 font-medium">
            Telemetry: {rainfallMmHr} mm/h rain
          </span>
        </div>

        {/* Layer Filter Toggles */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px]">
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
            <ShieldAlert className="w-3 h-3" />
            High Risk Only
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
            Shelters & ER
          </button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] bg-[#0c1322] overflow-hidden flex items-center justify-center select-none">
        {/* Map Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#1e293b 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Water Texture and Lowland Basin Area Overlay */}
        <div className="absolute top-[40%] left-[20%] w-[500px] h-[180px] bg-blue-900/15 blur-3xl pointer-events-none rounded-full" />

        <svg
          viewBox="0 0 1000 680"
          className="w-full h-full object-cover transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* Animated Striped Pattern for Blocked Roads */}
            <pattern
              id="hazardStripe"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="10" height="20" fill="#EF4444" />
              <rect x="10" width="10" height="20" fill="#7F1D1D" />
            </pattern>

            {/* Glowing filter for Recommended Route */}
            <filter id="glow-safe" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Red Danger glow */}
            <filter id="glow-danger" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradient for River */}
            <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#075985" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* BACKGROUND TOPOGRAPHY & DISTRICTS */}
          {/* North Highland Ridge (+28m Elevation) */}
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

          {/* Central Low-Lying Flood Catchment Basin (2.2m Elevation) */}
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

          {/* Grand Metro River / Waterway Channel */}
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
          <text x="180" y="240" fill="#7dd3fc" fontSize="10" fontWeight="600" opacity="0.8">
            Grand Metro Riverway (High Surge Risk)
          </text>

          {/* HARBOR & COASTAL BAY (Bottom Right) */}
          <path
            d="M 700 500 Q 820 480 950 510 L 980 660 L 680 660 Z"
            fill="#0c4a6e"
            fillOpacity="0.35"
            stroke="#0369a1"
            strokeWidth="1.5"
          />
          <text x="800" y="620" fill="#38bdf8" fontSize="12" fontWeight="700" letterSpacing="1.5">
            HARBOR & PORT BAY
          </text>

          {/* BASE ROAD SEGMENTS */}
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
                id={`map-road-group-${road.id}`}
                className="cursor-pointer transition-opacity duration-200"
                opacity={isDim ? 0.25 : 1}
                onMouseEnter={(e) => {
                  setHoveredRoad(road);
                  setTooltipPos({ x: road.midpoint.x, y: road.midpoint.y });
                }}
                onMouseLeave={() => setHoveredRoad(null)}
                onClick={() => setSelectedRoad(road)}
              >
                {/* Thick background click/hover target */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isHovered ? '#60a5fa' : '#1e293b'}
                  strokeWidth={isHovered ? 18 : 14}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isHovered ? 0.4 : 0.6}
                />

                {/* Actual Color-Coded Road Line (Green, Yellow, Red) */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={road.category === 'highway' ? 7 : 5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={road.category === 'tunnel' ? '8 6' : undefined}
                />

                {/* Blocked Road Pattern Overlay */}
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

                {/* Elevation/Road Code Label Badge */}
                <circle
                  cx={road.midpoint.x}
                  cy={road.midpoint.y}
                  r={isHovered ? 15 : 12}
                  fill={strokeColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all"
                />
                <text
                  cx={road.midpoint.x}
                  cy={road.midpoint.y}
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

                {/* Blocked Warning Icon indicator */}
                {road.isBlocked && (
                  <g transform={`translate(${road.midpoint.x + 10}, ${road.midpoint.y - 18})`}>
                    <rect width="20" height="20" rx="4" fill="#E11D48" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="10" y="14" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                      ✕
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ACTIVE ROUTE OVERLAYS (When viewing Safe Route page or ShowAllRoutes) */}
          {(showAllRoutes || selectedRoute) && (
            <g id="map-routes-layer">
              {/* If Route A is selected or showAllRoutes, show Route A */}
              {(showAllRoutes || targetRouteId === 'route-a') && routeA && (
                <g id="route-a-path-group" opacity={targetRouteId === 'route-a' ? 1 : 0.4}>
                  <path
                    d={routeA.pathD}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth={targetRouteId === 'route-a' ? 8 : 4}
                    strokeLinecap="round"
                    strokeDasharray="10 8"
                    filter={targetRouteId === 'route-a' ? 'url(#glow-danger)' : undefined}
                  />
                  {/* Danger waypoint tags */}
                  <g transform="translate(480, 420)">
                    <rect width="130" height="24" rx="6" fill="#991B1B" stroke="#F87171" strokeWidth="1" />
                    <text x="65" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                      ⚠ HIGH RISK (85/100)
                    </text>
                  </g>
                </g>
              )}

              {/* If Route B is selected or showAllRoutes, show Route B (RECOMMENDED ELEVATED ROUTE) */}
              {(showAllRoutes || targetRouteId === 'route-b') && routeB && (
                <g id="route-b-path-group" opacity={targetRouteId === 'route-b' ? 1 : 0.6}>
                  {/* Glowing Safe Background */}
                  <path
                    d={routeB.pathD}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth={targetRouteId === 'route-b' ? 9 : 5}
                    strokeLinecap="round"
                    filter="url(#glow-safe)"
                  />
                  <path
                    d={routeB.pathD}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeDasharray="12 10"
                    className="animate-pulse"
                  />
                  {/* Recommended Safe Badge Tag on Path */}
                  <g transform="translate(510, 185)">
                    <rect width="180" height="26" rx="8" fill="#065F46" stroke="#34D399" strokeWidth="1.5" />
                    <text x="90" y="17" textAnchor="middle" fill="#ECFDF5" fontSize="11" fontWeight="800">
                      ★ RECOMMENDED SAFE (25/100)
                    </text>
                  </g>
                </g>
              )}
            </g>
          )}

          {/* EMERGENCY SHELTERS & HOSPITALS ICONS */}
          {emergencyResources.map((res) => {
            const isShelter = res.type === 'shelter';
            const isHospital = res.type === 'hospital';
            const isDimmed = activeLayer === 'high_risk';

            return (
              <g
                key={res.id}
                id={`map-resource-${res.id}`}
                transform={`translate(${res.coordinates.x}, ${res.coordinates.y})`}
                opacity={isDimmed ? 0.3 : 1}
                className="cursor-pointer"
              >
                <circle
                  r="16"
                  fill={isShelter ? '#3b82f6' : isHospital ? '#059669' : '#f97316'}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="drop-shadow-md"
                />
                <text
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {isShelter ? '⛺' : isHospital ? '🏥' : '🚒'}
                </text>
                <text
                  y="28"
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="600"
                  className="bg-slate-900 px-1"
                >
                  {res.name.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* CITIZEN REPORT LIVE PINS */}
          {citizenReports.slice(0, 5).map((rep) => {
            const road = roads.find((r) => r.id === rep.roadId);
            if (!road) return null;
            const x = road.midpoint.x - 15;
            const y = road.midpoint.y - 30;

            return (
              <g key={rep.id} transform={`translate(${x}, ${y})`} className="cursor-pointer">
                <circle r="11" fill="#DC2626" stroke="#ffffff" strokeWidth="2" />
                <text y="3" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                  !
                </text>
              </g>
            );
          })}

          {/* ORIGIN & DESTINATION PINS */}
          {/* Origin Pin: Downtown Central Station */}
          <g transform="translate(260, 380)">
            <circle r="18" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="3" />
            <circle r="6" fill="#FFFFFF" />
            <rect x="-45" y="-34" width="90" height="20" rx="4" fill="#1E293B" stroke="#3B82F6" strokeWidth="1" />
            <text x="0" y="-21" textAnchor="middle" fill="#93C5FD" fontSize="10" fontWeight="bold">
              START (Origin)
            </text>
          </g>

          {/* Destination Pin: City Airport Hub */}
          <g transform="translate(880, 340)">
            <circle r="18" fill="#10B981" stroke="#FFFFFF" strokeWidth="3" />
            <text y="4" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
              🏁
            </text>
            <rect x="-45" y="-34" width="90" height="20" rx="4" fill="#1E293B" stroke="#10B981" strokeWidth="1" />
            <text x="0" y="-21" textAnchor="middle" fill="#6EE7B7" fontSize="10" fontWeight="bold">
              DESTINATION
            </text>
          </g>
        </svg>

        {/* Hover Tooltip Card */}
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
            {hoveredRoad.isBlocked && (
              <div className="mt-1 text-[10px] text-rose-400 font-bold flex items-center gap-1">
                <AlertOctagon className="w-3 h-3" />
                BLOCKED: {hoveredRoad.blockageReason || 'Submerged'}
              </div>
            )}
            <div className="mt-1.5 text-[9px] text-blue-300 text-center font-medium bg-slate-800/80 py-0.5 rounded">
              Click road to inspect breakdown
            </div>
          </div>
        )}

        {/* Map Control Buttons (Bottom Left) */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 z-20">
          <button
            id="map-zoom-in-btn"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center transition shadow-lg"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="map-zoom-out-btn"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center transition shadow-lg"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            id="map-reset-zoom-btn"
            onClick={handleResetZoom}
            className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center transition shadow-lg text-[10px] font-bold"
            title="Reset view"
          >
            1x
          </button>
        </div>
      </div>

      {/* Map Footer Legend */}
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
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs" />
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
            <span>🚒 Fire/Rescue</span>
          </div>
        </div>
      </div>
    </div>
  );
};
