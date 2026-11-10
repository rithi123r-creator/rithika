export type RiskLevel = 'low' | 'moderate' | 'high';
export type WaterLevel = 'none' | 'low' | 'medium' | 'high';
export type RoadCondition = 'good' | 'fair' | 'poor';
export type AppPage = 'home' | 'safe-route' | 'report-flood' | 'dashboard';

export interface LocationPoint {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  sourceType?: 'preset' | 'map_click' | 'gps' | 'custom_search';
  address?: string;
  elevationMeters?: number;
}

export interface RoadSegment {
  id: string;
  name: string;
  code: string;
  category: 'arterial' | 'highway' | 'residential' | 'tunnel' | 'bridge';
  fromLocation: string;
  toLocation: string;
  lengthKm: number;
  normalSpeedKmh: number;
  elevationMeters: number; // Low elevation = higher flood tendency
  drainageCapacity: 'high' | 'medium' | 'low';
  historicalFloodRisk: number; // 0 - 100
  roadCondition: RoadCondition;
  waterLevel: WaterLevel;
  isBlocked: boolean;
  blockageReason?: string;
  reportsCount: number;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  // SVG coordinates on map (normalized 0-1000 viewBox)
  pathCoordinates: { x: number; y: number }[];
  midpoint: { x: number; y: number };
  lastUpdated: string;
}

export interface CitizenReport {
  id: string;
  roadId: string;
  roadName: string;
  locationDescription: string;
  waterLevel: WaterLevel;
  isBlocked: boolean;
  photoUrl?: string;
  photoCaption?: string;
  timestamp: string;
  verified: boolean;
  upvotes: number;
  reporterName: string;
  waterDepthCm: number;
  notes?: string;
}

export interface RouteStep {
  instruction: string;
  roadName: string;
  distanceKm: number;
  riskScore: number;
  riskLevel: RiskLevel;
  hazardNote?: string;
  elevationMeters: number;
  points?: { lat: number; lng: number }[];
  isBlocked?: boolean;
  waterLevel?: WaterLevel;
  startLocation?: { lat: number; lng: number };
  endLocation?: { lat: number; lng: number };
}

export interface RouteOption {
  id: string;
  name: string;
  via: string;
  distanceKm: number;
  estimatedMinutes: number;
  riskScore: number;
  riskLevel: RiskLevel;
  isRecommended: boolean;
  recommendationReason: string;
  hasBlockedRoad: boolean;
  maxWaterLevel?: WaterLevel;
  roadIds?: string[];
  steps: RouteStep[];
  pathD?: string;
  tag?: string;
  points?: { lat: number; lng: number }[];
  bounds?: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } };
}

export interface EmergencyResource {
  id: string;
  name: string;
  type: 'shelter' | 'hospital' | 'fire_station';
  address: string;
  distance: string;
  contactNumber: string;
  status: 'operational' | 'high_capacity' | 'full';
  capacityTotal: number;
  capacityUsed: number;
  coordinates: { x: number; y: number };
  amenities: string[];
}

export interface EmergencyAlert {
  id: string;
  title: string;
  severity: 'high' | 'moderate' | 'advisory';
  area: string;
  issuedAt: string;
  message: string;
  affectedRoads: string[];
}

export interface CityRiskSummary {
  overallScore: number;
  riskLevel: RiskLevel;
  rainfallIntensityMmHr: number;
  rainfallStatus: 'Light' | 'Moderate' | 'Heavy' | 'Extreme Cloudburst';
  totalRoadsCount: number;
  safeRoadsCount: number;
  moderateRiskRoadsCount: number;
  highRiskRoadsCount: number;
  blockedRoadsCount: number;
  totalCitizenReports: number;
  activeAlertsCount: number;
  activeSheltersCount: number;
}

export interface RiskBreakdown {
  rainfallContribution: number;
  historicalContribution: number;
  roadConditionContribution: number;
  citizenReportsContribution: number;
  blockagePenalty: number;
  totalScore: number;
  riskLevel: RiskLevel;
  explanation: string[];
}

export interface CachedOfflineRoute {
  id: string;
  savedAt: string;
  origin: LocationPoint;
  destination: LocationPoint;
  route: RouteOption;
  pointCount: number;
  stepCount: number;
  rainfallMmHr: number;
  sizeBytesApprox: number;
  notes?: string;
}
