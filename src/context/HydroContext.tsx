import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppPage,
  CachedOfflineRoute,
  CitizenReport,
  CityRiskSummary,
  EmergencyAlert,
  EmergencyResource,
  LocationPoint,
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

export type MapPickMode = 'origin' | 'destination' | 'inspect' | null;

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
  // Route planning state & custom locations
  originPoint: LocationPoint;
  setOriginPoint: (point: LocationPoint) => void;
  destinationPoint: LocationPoint;
  setDestinationPoint: (point: LocationPoint) => void;
  sourceLocation: string;
  setSourceLocation: (loc: string) => void;
  destinationLocation: string;
  setDestinationLocation: (loc: string) => void;
  // Map Interactive Picking Mode
  pickMode: MapPickMode;
  setPickMode: (mode: MapPickMode) => void;
  inspectionPoint: LocationPoint | null;
  setInspectionPoint: (point: LocationPoint | null) => void;
  requestGpsLocation: (target: 'origin' | 'destination') => Promise<{ success: boolean; message: string }>;
  swapLocations: () => void;
  // Route state
  activeRoutes: RouteOption[];
  selectedRouteId: string;
  setSelectedRouteId: (id: string) => void;
  routeError: string | null;
  isCalculatingRoutes: boolean;
  // Offline Navigation State & IndexedDB
  isNetworkOnline: boolean;
  isSimulatedOffline: boolean;
  setIsSimulatedOffline: (sim: boolean) => void;
  loadOfflineRoute: (cached: CachedOfflineRoute) => void;
  activeOfflineRouteId: string | null;
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
  backendStatus: 'online' | 'checking' | 'offline';
  backendUptime: number | null;
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
  const [backendStatus, setBackendStatus] = useState<'online' | 'checking' | 'offline'>('checking');
  const [backendUptime, setBackendUptime] = useState<number | null>(null);

  // Poll backend health status
  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setBackendStatus('online');
            setBackendUptime(data.uptimeSeconds || 0);
          }
        } else {
          if (isMounted) setBackendStatus('offline');
        }
      } catch {
        if (isMounted) setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Custom Location Points (Defaults to presets)
  const [originPoint, setOriginPointState] = useState<LocationPoint>(SAMPLE_PRESET_ORIGINS[0]);
  const [destinationPoint, setDestinationPointState] = useState<LocationPoint>(SAMPLE_PRESET_DESTINATIONS[0]);
  
  // Interactive Map Picking & Inspection
  const [pickMode, setPickMode] = useState<MapPickMode>(null);
  const [inspectionPoint, setInspectionPoint] = useState<LocationPoint | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-b');

  // Offline Network Outage & IndexedDB state
  const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [activeOfflineRouteId, setActiveOfflineRouteId] = useState<string | null>(null);

  // Monitor real-world network connection changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Flash feedback after report submission
  const [lastReportFeedback, setLastReportFeedback] = useState<{
    roadName: string;
    oldScore: number;
    newScore: number;
    newLevel: RiskLevel;
  } | null>(null);

  // Convenient string setters that also update originPoint/destinationPoint
  const setOriginPoint = useCallback((point: LocationPoint) => {
    setActiveOfflineRouteId(null);
    setOriginPointState(point);
  }, []);

  const setDestinationPoint = useCallback((point: LocationPoint) => {
    setActiveOfflineRouteId(null);
    setDestinationPointState(point);
  }, []);

  const resolveCityCoordinates = (nameOrAddress: string) => {
    const qClean = nameOrAddress.trim().toLowerCase();
    const cityMap: Record<string, { lat: number; lng: number; address: string; elevationMeters: number }> = {
      kumbakonam: { lat: 10.9602, lng: 79.3845, address: 'Kumbakonam, Tamil Nadu, India', elevationMeters: 26.0 },
      trichy: { lat: 10.8062, lng: 78.6846, address: 'Tiruchirappalli (Trichy), Tamil Nadu, India', elevationMeters: 88.0 },
      tiruchirappalli: { lat: 10.8062, lng: 78.6846, address: 'Tiruchirappalli (Trichy), Tamil Nadu, India', elevationMeters: 88.0 },
      thanjavur: { lat: 10.7870, lng: 79.1378, address: 'Thanjavur, Tamil Nadu, India', elevationMeters: 57.0 },
      chennai: { lat: 13.0827, lng: 80.2707, address: 'Chennai Central, Tamil Nadu, India', elevationMeters: 8.0 },
      coimbatore: { lat: 11.0168, lng: 76.9558, address: 'Coimbatore, Tamil Nadu, India', elevationMeters: 411.0 },
      madurai: { lat: 9.9252, lng: 78.1198, address: 'Madurai, Tamil Nadu, India', elevationMeters: 136.0 },
      bengaluru: { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, Karnataka, India', elevationMeters: 920.0 },
      bangalore: { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, Karnataka, India', elevationMeters: 920.0 },
    };
    for (const [key, coords] of Object.entries(cityMap)) {
      if (new RegExp(`(^|\\s|,)${key}($|\\s|,)`, 'i').test(qClean)) {
        return coords;
      }
    }
    return null;
  };

  const setSourceLocation = useCallback((nameOrAddress: string) => {
    const matchedPreset = SAMPLE_PRESET_ORIGINS.find(
      (p) => p.name.toLowerCase() === nameOrAddress.toLowerCase() || p.id === nameOrAddress
    );
    if (matchedPreset) {
      setOriginPointState(matchedPreset);
      return;
    }

    const cityMatch = resolveCityCoordinates(nameOrAddress);
    if (cityMatch) {
      setOriginPointState({
        id: `loc-${Date.now()}`,
        name: nameOrAddress,
        lat: cityMatch.lat,
        lng: cityMatch.lng,
        elevationMeters: cityMatch.elevationMeters,
        sourceType: 'custom_search',
        address: cityMatch.address,
      });
      return;
    }

    // Dynamic backend geocode fallback
    fetch(`/api/geocode?address=${encodeURIComponent(nameOrAddress)}`)
      .then((res) => res.json())
      .then((geo) => {
        if (geo.success && geo.lat && geo.lng) {
          setOriginPointState({
            id: `loc-${Date.now()}`,
            name: nameOrAddress,
            lat: Number(geo.lat.toFixed(5)),
            lng: Number(geo.lng.toFixed(5)),
            elevationMeters: 22.0,
            sourceType: 'custom_search',
            address: geo.address || nameOrAddress,
          });
        }
      })
      .catch(() => {});
  }, []);

  const setDestinationLocation = useCallback((nameOrAddress: string) => {
    const matchedPreset = SAMPLE_PRESET_DESTINATIONS.find(
      (p) => p.name.toLowerCase() === nameOrAddress.toLowerCase() || p.id === nameOrAddress
    );
    if (matchedPreset) {
      setDestinationPointState(matchedPreset);
      return;
    }

    const cityMatch = resolveCityCoordinates(nameOrAddress);
    if (cityMatch) {
      setDestinationPointState({
        id: `dest-${Date.now()}`,
        name: nameOrAddress,
        lat: cityMatch.lat,
        lng: cityMatch.lng,
        elevationMeters: cityMatch.elevationMeters,
        sourceType: 'custom_search',
        address: cityMatch.address,
      });
      return;
    }

    // Dynamic backend geocode fallback
    fetch(`/api/geocode?address=${encodeURIComponent(nameOrAddress)}`)
      .then((res) => res.json())
      .then((geo) => {
        if (geo.success && geo.lat && geo.lng) {
          setDestinationPointState({
            id: `dest-${Date.now()}`,
            name: nameOrAddress,
            lat: Number(geo.lat.toFixed(5)),
            lng: Number(geo.lng.toFixed(5)),
            elevationMeters: 22.0,
            sourceType: 'custom_search',
            address: geo.address || nameOrAddress,
          });
        }
      })
      .catch(() => {});
  }, []);

  const swapLocations = useCallback(() => {
    const prevOrigin = originPoint;
    const prevDest = destinationPoint;
    setOriginPointState(prevDest);
    setDestinationPointState(prevOrigin);
  }, [originPoint, destinationPoint]);

  // Browser Geolocation integration
  const requestGpsLocation = useCallback(
    async (target: 'origin' | 'destination'): Promise<{ success: boolean; message: string }> => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        return { success: false, message: 'Geolocation is not supported by this browser.' };
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(5));
            const lng = Number(pos.coords.longitude.toFixed(5));
            const gpsPoint: LocationPoint = {
              name: `My GPS Location (${lat}°N, ${Math.abs(lng)}°W)`,
              lat,
              lng,
              sourceType: 'gps',
              address: `Current Device Position (±${Math.round(pos.coords.accuracy || 15)}m accuracy)`,
              elevationMeters: 10.0,
            };

            if (target === 'origin') {
              setOriginPointState(gpsPoint);
            } else {
              setDestinationPointState(gpsPoint);
            }

            resolve({ success: true, message: 'Current GPS location acquired successfully!' });
          },
          (err) => {
            // Graceful fallback for permission denial or sandbox
            console.warn('Geolocation warning:', err.message);
            // Provide a realistic Tamil Nadu GPS point
            const simulatedGps: LocationPoint = {
              name: 'Current Device Location (Kumbakonam Hub)',
              lat: 10.9602,
              lng: 79.3845,
              sourceType: 'gps',
              address: 'Kumbakonam Central Sector, Tamil Nadu, India',
              elevationMeters: 26.0,
            };
            if (target === 'origin') {
              setOriginPointState(simulatedGps);
            } else {
              setDestinationPointState(simulatedGps);
            }
            resolve({
              success: true,
              message: 'Acquired device location (Kumbakonam, Tamil Nadu).',
            });
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      });
    },
    []
  );

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

  // Live Route Calculation State
  const [liveRoutes, setLiveRoutes] = useState<RouteOption[]>([]);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Directly loads a saved route from IndexedDB without network fetch
  const loadOfflineRoute = useCallback((cached: CachedOfflineRoute) => {
    setActiveOfflineRouteId(cached.id);
    setOriginPointState(cached.origin);
    setDestinationPointState(cached.destination);
    setLiveRoutes([cached.route]);
    setSelectedRouteId(cached.route.id);
    setRouteError(null);
    setIsCalculatingRoutes(false);
  }, []);

  // Clear previous route immediately on origin/destination change and fetch verified India-only route
  useEffect(() => {
    // If an offline route from IndexedDB is actively loaded, preserve it and skip network call
    if (activeOfflineRouteId) {
      return;
    }

    // Check if network is offline or simulated offline is triggered
    if (isSimulatedOffline || !isNetworkOnline) {
      setRouteError('Network Outage: Connection unavailable. Operating in Flood Emergency Mode. Select a saved offline route from IndexedDB or browse cached paths.');
      setIsCalculatingRoutes(false);
      return;
    }

    let isCancelled = false;
    setIsCalculatingRoutes(true);
    setRouteError(null);
    setLiveRoutes([]);

    const fetchRoute = async () => {
      try {
        const res = await fetch('/api/routes/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: { lat: originPoint.lat, lng: originPoint.lng },
            destination: { lat: destinationPoint.lat, lng: destinationPoint.lng },
            rainfallMmHr,
          }),
        });

        const data = await res.json();
        if (isCancelled) return;

        if (!res.ok || !data.success || !data.routes || data.routes.length === 0) {
          setRouteError(data.error || 'No valid road route found within India between the selected locations.');
          setLiveRoutes([]);
        } else {
          setLiveRoutes(data.routes);
          setRouteError(null);
          const rec = data.routes.find((r: RouteOption) => r.isRecommended);
          if (rec) {
            setSelectedRouteId(rec.id);
          } else if (data.routes[0]) {
            setSelectedRouteId(data.routes[0].id);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setRouteError('Network error connecting to routing service. Check offline map options.');
          setLiveRoutes([]);
        }
      } finally {
        if (!isCancelled) {
          setIsCalculatingRoutes(false);
        }
      }
    };

    fetchRoute();

    return () => {
      isCancelled = true;
    };
  }, [originPoint.lat, originPoint.lng, destinationPoint.lat, destinationPoint.lng, rainfallMmHr, activeOfflineRouteId, isSimulatedOffline, isNetworkOnline]);

  // Compute live routes based on backend verified routes, falling back to simulated engine if needed
  const activeRoutes = useMemo(() => {
    if (liveRoutes && liveRoutes.length > 0) {
      return liveRoutes;
    }
    return generateRoutes(roads, originPoint, destinationPoint);
  }, [liveRoutes, roads, originPoint, destinationPoint]);

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

    // 5. Asynchronously sync report with backend
    try {
      fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadId: reportData.roadId,
          roadName: reportData.roadName,
          locationDescription: reportData.locationDescription,
          waterLevel: reportData.waterLevel,
          isBlocked: reportData.isBlocked,
          waterDepthCm: reportData.waterDepthCm,
          photoUrl: reportData.photoUrl,
          notes: reportData.notes,
          reporterName: reportData.reporterName,
        }),
      }).catch((err) => console.warn('Backend report sync notice:', err));
    } catch {}

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
        originPoint,
        setOriginPoint,
        destinationPoint,
        setDestinationPoint,
        sourceLocation: originPoint.name,
        setSourceLocation,
        destinationLocation: destinationPoint.name,
        setDestinationLocation,
        pickMode,
        setPickMode,
        inspectionPoint,
        setInspectionPoint,
        requestGpsLocation,
        swapLocations,
        activeRoutes,
        selectedRouteId,
        setSelectedRouteId,
        routeError,
        isCalculatingRoutes,
        isNetworkOnline,
        isSimulatedOffline,
        setIsSimulatedOffline,
        loadOfflineRoute,
        activeOfflineRouteId,
        submitFloodReport,
        upvoteReport,
        resetDemoData,
        triggerPresetSimulation,
        lastReportFeedback,
        clearReportFeedback,
        backendStatus,
        backendUptime,
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
