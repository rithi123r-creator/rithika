import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  AppPage,
  CitizenReport,
  CityRiskSummary,
  EmergencyAlert,
  EmergencyResource,
  RiskLevel,
  RoadSegment,
  RouteOption,
  WaterLevel,
} from '../types';
import {
  buildInitialRoadSegments,
  INITIAL_CITIZEN_REPORTS,
  INITIAL_EMERGENCY_ALERTS,
  INITIAL_EMERGENCY_RESOURCES,
  INITIAL_RAINFALL_MM_HR,
  SAMPLE_PRESET_DESTINATIONS,
  SAMPLE_PRESET_ORIGINS,
} from '../data/mockData';
import { calculateRoadRisk, getRiskLevel } from '../utils/riskEngine';
import { generateRoutes } from '../utils/routeGenerator';

interface FloodReportSubmission {
  roadId: string;
  roadName: string;
  locationDescription: string;
  waterLevel: WaterLevel;
  isBlocked: boolean;
  waterDepthCm: number;
  photoUrl?: string;
  notes?: string;
  reporterName?: string;
}

interface HydroContextType {
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  roads: RoadSegment[];
  citizenReports: CitizenReport[];
  emergencyResources: EmergencyResource[];
  alerts: EmergencyAlert[];
  rainfallMmHr: number;
  setRainfallMmHr: (mm: number) => void;
  citySummary: CityRiskSummary;
  selectedRoad: RoadSegment | null;
  setSelectedRoad: (road: RoadSegment | null) => void;
  // Route planning state
  sourceLocation: string;
  setSourceLocation: (loc: string) => void;
  destinationLocation: string;
  setDestinationLocation: (loc: string) => void;
  activeRoutes: RouteOption[];
  selectedRouteId: string;
  setSelectedRouteId: (id: string) => void;
  // Actions
  submitFloodReport: (report: FloodReportSubmission) => { success: boolean; updatedRoad: RoadSegment };
  upvoteReport: (reportId: string) => void;
  resetDemoData: () => void;
  triggerPresetSimulation: (preset: 'flash_flood_downtown' | 'heavy_cloudburst' | 'clear_weather' | 'harbor_surge') => void;
  lastReportFeedback: {
    roadName: string;
    oldScore: number;
    newScore: number;
    newLevel: RiskLevel;
  } | null;
  clearReportFeedback: () => void;
}

const HydroContext = createContext<HydroContextType | undefined>(undefined);

export const HydroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [rainfallMmHr, setRainfallMmHrState] = useState<number>(INITIAL_RAINFALL_MM_HR);
  const [roads, setRoads] = useState<RoadSegment[]>(() => buildInitialRoadSegments(INITIAL_RAINFALL_MM_HR));
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>(INITIAL_CITIZEN_REPORTS);
  const [emergencyResources] = useState<EmergencyResource[]>(INITIAL_EMERGENCY_RESOURCES);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(INITIAL_EMERGENCY_ALERTS);
  const [selectedRoad, setSelectedRoad] = useState<RoadSegment | null>(null);

  // Routing presets
  const [sourceLocation, setSourceLocation] = useState<string>(SAMPLE_PRESET_ORIGINS[0].name);
  const [destinationLocation, setDestinationLocation] = useState<string>(SAMPLE_PRESET_DESTINATIONS[0].name);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-b');

  // Flash feedback after report submission
  const [lastReportFeedback, setLastReportFeedback] = useState<{
    roadName: string;
    oldScore: number;
    newScore: number;
    newLevel: RiskLevel;
  } | null>(null);

  // Re-calculate all road risk scores whenever rainfall slider moves
  const setRainfallMmHr = useCallback((newRainfall: number) => {
    setRainfallMmHrState(newRainfall);
    setRoads((prevRoads) =>
      prevRoads.map((road) => {
        const risk = calculateRoadRisk(road, newRainfall);
        return {
          ...road,
          riskScore: risk.totalScore,
          riskLevel: risk.riskLevel,
          lastUpdated: 'Just now (Rainfall updated)',
        };
      })
    );
  }, []);

  // Compute live routes based on current roads state
  const activeRoutes = useMemo(() => {
    return generateRoutes(roads, sourceLocation, destinationLocation);
  }, [roads, sourceLocation, destinationLocation]);

  // Overall City Risk Summary computation
  const citySummary: CityRiskSummary = useMemo(() => {
    const totalRoads = roads.length;
    const safeCount = roads.filter((r) => r.riskLevel === 'low').length;
    const moderateCount = roads.filter((r) => r.riskLevel === 'moderate').length;
    const highCount = roads.filter((r) => r.riskLevel === 'high').length;
    const blockedCount = roads.filter((r) => r.isBlocked).length;

    const avgScore = Math.round(
      roads.reduce((sum, r) => sum + r.riskScore, 0) / (totalRoads || 1)
    );

    let rainfallStatus: CityRiskSummary['rainfallStatus'] = 'Moderate';
    if (rainfallMmHr < 25) rainfallStatus = 'Light';
    else if (rainfallMmHr < 55) rainfallStatus = 'Moderate';
    else if (rainfallMmHr < 80) rainfallStatus = 'Heavy';
    else rainfallStatus = 'Extreme Cloudburst';

    return {
      overallScore: avgScore,
      riskLevel: getRiskLevel(avgScore),
      rainfallIntensityMmHr: rainfallMmHr,
      rainfallStatus,
      totalRoadsCount: totalRoads,
      safeRoadsCount: safeCount,
      moderateRiskRoadsCount: moderateCount,
      highRiskRoadsCount: highCount,
      blockedRoadsCount: blockedCount,
      totalCitizenReports: citizenReports.length,
      activeAlertsCount: alerts.length,
      activeSheltersCount: emergencyResources.filter((e) => e.type === 'shelter' && e.status === 'operational').length,
    };
  }, [roads, rainfallMmHr, citizenReports, alerts, emergencyResources]);

  // Submit flood report action
  const submitFloodReport = useCallback((reportData: FloodReportSubmission) => {
    let oldScore = 0;
    let newScore = 0;
    let newLevel: RiskLevel = 'high';
    let targetRoad: RoadSegment | null = null;

    // 1. Update the road's water level, blocked status, report count & risk score
    setRoads((prevRoads) =>
      prevRoads.map((road) => {
        if (road.id === reportData.roadId || road.name.toLowerCase() === reportData.roadName.toLowerCase()) {
          oldScore = road.riskScore;
          
          const updatedWaterLevel = reportData.waterLevel;
          const updatedBlocked = reportData.isBlocked || reportData.waterLevel === 'high';
          const updatedReportsCount = road.reportsCount + 1;

          const updatedRoadProps = {
            ...road,
            waterLevel: updatedWaterLevel,
            isBlocked: updatedBlocked,
            reportsCount: updatedReportsCount,
            blockageReason: reportData.isBlocked
              ? reportData.notes || `Blocked: Water depth ${reportData.waterDepthCm}cm`
              : road.blockageReason,
          };

          const calculatedRisk = calculateRoadRisk(updatedRoadProps, rainfallMmHr);
          
          // Guarantee high risk level for demonstration when high water is reported
          const finalScore = reportData.waterLevel === 'high' || reportData.isBlocked
            ? Math.max(78, calculatedRisk.totalScore)
            : calculatedRisk.totalScore;
          
          newScore = finalScore;
          newLevel = getRiskLevel(finalScore);

          targetRoad = {
            ...updatedRoadProps,
            riskScore: finalScore,
            riskLevel: newLevel,
            lastUpdated: 'Just now (New Citizen Report)',
          };

          return targetRoad;
        }
        return road;
      })
    );

    // 2. Add citizen report to the top of list
    const newReport: CitizenReport = {
      id: `rep-${Date.now()}`,
      roadId: reportData.roadId,
      roadName: reportData.roadName,
      locationDescription: reportData.locationDescription || `${reportData.roadName} corridor`,
      waterLevel: reportData.waterLevel,
      isBlocked: reportData.isBlocked,
      photoUrl: reportData.photoUrl || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      photoCaption: `Live Citizen Upload: ${reportData.waterLevel.toUpperCase()} water level reported (${reportData.waterDepthCm} cm depth)`,
      timestamp: 'Just now',
      verified: true,
      upvotes: 1,
      reporterName: reportData.reporterName || 'Verified Citizen (Live)',
      waterDepthCm: reportData.waterDepthCm,
      notes: reportData.notes || (reportData.isBlocked ? 'Road impassable, traffic diverted.' : 'Passable with caution.'),
    };

    setCitizenReports((prev) => [newReport, ...prev]);

    // 3. If high risk, add or update emergency alert
    if (reportData.waterLevel === 'high' || reportData.isBlocked) {
      const newAlert: EmergencyAlert = {
        id: `alt-${Date.now()}`,
        title: `URGENT FLOOD ALERT: ${reportData.roadName} High Water`,
        severity: 'high',
        area: reportData.roadName,
        issuedAt: 'Just now via Citizen Telemetry',
        message: `High water hazard reported (${reportData.waterDepthCm} cm). ${reportData.isBlocked ? 'ROAD IS BLOCKED.' : 'Avoid this route.'} Take recommended elevated alternatives.`,
        affectedRoads: [reportData.roadName],
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }

    // 4. Set feedback
    setLastReportFeedback({
      roadName: reportData.roadName,
      oldScore: oldScore || 45,
      newScore: newScore || 85,
      newLevel: newLevel || 'high',
    });

    return {
      success: true,
      updatedRoad: targetRoad || roads[0],
    };
  }, [rainfallMmHr, roads]);

  const upvoteReport = useCallback((reportId: string) => {
    setCitizenReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r))
    );
  }, []);

  const clearReportFeedback = useCallback(() => {
    setLastReportFeedback(null);
  }, []);

  const resetDemoData = useCallback(() => {
    setRainfallMmHrState(INITIAL_RAINFALL_MM_HR);
    setRoads(buildInitialRoadSegments(INITIAL_RAINFALL_MM_HR));
    setCitizenReports(INITIAL_CITIZEN_REPORTS);
    setAlerts(INITIAL_EMERGENCY_ALERTS);
    setSelectedRoad(null);
    setLastReportFeedback(null);
  }, []);

  const triggerPresetSimulation = useCallback(
    (preset: 'flash_flood_downtown' | 'heavy_cloudburst' | 'clear_weather' | 'harbor_surge') => {
      switch (preset) {
        case 'flash_flood_downtown':
          submitFloodReport({
            roadId: 'rd-1',
            roadName: 'Downtown Expressway (Underpass Segment)',
            locationDescription: '5th Avenue underpass basin',
            waterLevel: 'high',
            isBlocked: true,
            waterDepthCm: 70,
            notes: 'Flash flood torrent rushing into underpass. Complete roadblock in effect.',
            reporterName: 'Emergency Response Squad',
          });
          break;
        case 'heavy_cloudburst':
          setRainfallMmHr(85);
          break;
        case 'clear_weather':
          setRainfallMmHr(10);
          setRoads((prev) =>
            prev.map((r) => {
              const cleaned = { ...r, waterLevel: 'none' as WaterLevel, isBlocked: false };
              const risk = calculateRoadRisk(cleaned, 10);
              return { ...cleaned, riskScore: risk.totalScore, riskLevel: risk.riskLevel };
            })
          );
          break;
        case 'harbor_surge':
          submitFloodReport({
            roadId: 'rd-6',
            roadName: 'Harbor Causeway & Tunnel',
            locationDescription: 'Causeway seawall approach',
            waterLevel: 'high',
            isBlocked: true,
            waterDepthCm: 50,
            notes: 'High tidal surge breaching barrier. Seawater on roadway.',
            reporterName: 'Harbor Patrol Unit',
          });
          break;
      }
    },
    [submitFloodReport, setRainfallMmHr]
  );

  return (
    <HydroContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        roads,
        citizenReports,
        emergencyResources,
        alerts,
        rainfallMmHr,
        setRainfallMmHr,
        citySummary,
        selectedRoad,
        setSelectedRoad,
        sourceLocation,
        setSourceLocation,
        destinationLocation,
        setDestinationLocation,
        activeRoutes,
        selectedRouteId,
        setSelectedRouteId,
        submitFloodReport,
        upvoteReport,
        resetDemoData,
        triggerPresetSimulation,
        lastReportFeedback,
        clearReportFeedback,
      }}
    >
      {children}
    </HydroContext.Provider>
  );
};

export const useHydro = () => {
  const context = useContext(HydroContext);
  if (!context) {
    throw new Error('useHydro must be used within a HydroProvider');
  }
  return context;
};
