import { RiskBreakdown, RiskLevel, RoadCondition, RoadSegment, WaterLevel } from '../types';

/**
 * HYDRONAV Multi-Factor Urban Flood Risk Engine
 * 
 * Transparent Mathematical Formulation:
 * 1. Rainfall Intensity Factor (30% weight) - Scaled from current city/neighborhood precipitation (0-100 mm/h)
 * 2. Historical Flood Risk Factor (25% weight) - Based on terrain elevation, drainage catchment, and historical flood frequencies
 * 3. Road Condition Factor (15% weight) - Surface integrity, pothole/crack vulnerability, and drainage capacity
 * 4. Citizen Live Ground Reports & Water Depth (30% weight) - Real-time crowd-sourced water level telemetry
 * + Blocked Road Override: If road is reported blocked or water level is 'high', triggers high risk penalty (capped at 100).
 */

export const RISK_THRESHOLDS = {
  LOW_MAX: 30,
  MODERATE_MAX: 60,
  HIGH_MAX: 100,
};

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'low';
  if (score <= 60) return 'moderate';
  return 'high';
}

export function getRiskColorClasses(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  badgeText: string;
  hex: string;
  lightBg: string;
} {
  switch (level) {
    case 'low':
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-700',
        border: 'border-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        badgeText: 'text-emerald-700',
        hex: '#10B981',
        lightBg: 'bg-emerald-50',
      };
    case 'moderate':
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-700',
        border: 'border-amber-500',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        badgeText: 'text-amber-700',
        hex: '#F59E0B',
        lightBg: 'bg-amber-50',
      };
    case 'high':
      return {
        bg: 'bg-rose-600',
        text: 'text-rose-700',
        border: 'border-rose-600',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        badgeText: 'text-rose-700',
        hex: '#EF4444',
        lightBg: 'bg-rose-50',
      };
  }
}

export function calculateRoadRisk(
  road: {
    historicalFloodRisk: number;
    roadCondition: RoadCondition;
    elevationMeters: number;
    waterLevel: WaterLevel;
    isBlocked: boolean;
    reportsCount: number;
  },
  rainfallMmHr: number
): RiskBreakdown {
  const explanation: string[] = [];

  // 1. Rainfall Intensity Score (0 - 100 scaled)
  // Low: 0-20 mm/hr -> 0-35 pts
  // Moderate: 20-50 mm/hr -> 35-70 pts
  // Heavy: >50 mm/hr -> 70-100 pts
  const rawRainfallScore = Math.min(100, Math.round((rainfallMmHr / 70) * 100));
  const rainfallContribution = Math.round(rawRainfallScore * 0.30);
  explanation.push(`Rainfall telemetry (${rainfallMmHr} mm/h) contributes ${rainfallContribution} pts (weight 30%)`);

  // 2. Historical & Elevation Catchment Score (0 - 100)
  // Lower elevation (< 5m) adds vulnerability
  let elevationAdjustment = 0;
  if (road.elevationMeters <= 3) elevationAdjustment = 20;
  else if (road.elevationMeters <= 7) elevationAdjustment = 10;
  else if (road.elevationMeters >= 18) elevationAdjustment = -15;

  const adjustedHistorical = Math.min(100, Math.max(0, road.historicalFloodRisk + elevationAdjustment));
  const historicalContribution = Math.round(adjustedHistorical * 0.25);
  explanation.push(`Historical flood risk (${road.historicalFloodRisk}%) & elevation (${road.elevationMeters}m) contributes ${historicalContribution} pts (weight 25%)`);

  // 3. Road Condition Factor (15% weight)
  let conditionBase = 15;
  if (road.roadCondition === 'good') conditionBase = 20;
  if (road.roadCondition === 'fair') conditionBase = 55;
  if (road.roadCondition === 'poor') conditionBase = 90;
  const roadConditionContribution = Math.round(conditionBase * 0.15);
  explanation.push(`Pavement & drainage condition (${road.roadCondition}) contributes ${roadConditionContribution} pts (weight 15%)`);

  // 4. Citizen Live Reports & Water Level (30% weight)
  let waterLevelScore = 5;
  if (road.waterLevel === 'low') waterLevelScore = 40;
  if (road.waterLevel === 'medium') waterLevelScore = 75;
  if (road.waterLevel === 'high') waterLevelScore = 100;

  // Add weight if multiple verified reports exist
  const reportMultiplier = Math.min(1.2, 1 + (road.reportsCount * 0.05));
  const effectiveCitizenScore = Math.min(100, Math.round(waterLevelScore * reportMultiplier));
  const citizenReportsContribution = Math.round(effectiveCitizenScore * 0.30);
  explanation.push(`Live citizen water level reports (${road.waterLevel.toUpperCase()}, ${road.reportsCount} reports) contributes ${citizenReportsContribution} pts (weight 30%)`);

  // Blockage override penalty
  let blockagePenalty = 0;
  if (road.isBlocked) {
    blockagePenalty = 35;
    explanation.push(`CRITICAL: Road reported blocked/submerged! Added emergency penalty of +${blockagePenalty} pts`);
  } else if (road.waterLevel === 'high') {
    blockagePenalty = 20;
    explanation.push(`High water level warning adds critical hazard penalty of +${blockagePenalty} pts`);
  }

  let totalScore = rainfallContribution + historicalContribution + roadConditionContribution + citizenReportsContribution + blockagePenalty;
  totalScore = Math.min(100, Math.max(5, Math.round(totalScore)));

  const riskLevel = getRiskLevel(totalScore);

  return {
    rainfallContribution,
    historicalContribution,
    roadConditionContribution,
    citizenReportsContribution,
    blockagePenalty,
    totalScore,
    riskLevel,
    explanation,
  };
}

/**
 * Calculates a route's aggregated risk score based on the road segments in that route
 */
export function calculateRouteRisk(
  roadSegments: RoadSegment[],
  routeRoadIds: string[]
): {
  averageRisk: number;
  maxSegmentRisk: number;
  riskScore: number;
  riskLevel: RiskLevel;
  hasBlockedSegment: boolean;
  maxWaterLevel: WaterLevel;
} {
  const selectedRoads = roadSegments.filter((r) => routeRoadIds.includes(r.id));
  if (selectedRoads.length === 0) {
    return {
      averageRisk: 0,
      maxSegmentRisk: 0,
      riskScore: 0,
      riskLevel: 'low',
      hasBlockedSegment: false,
      maxWaterLevel: 'none',
    };
  }

  let totalWeightedRisk = 0;
  let totalLength = 0;
  let maxRisk = 0;
  let hasBlocked = false;
  let maxWaterLevel: WaterLevel = 'none';

  const waterLevelPriority: Record<WaterLevel, number> = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
  };

  selectedRoads.forEach((r) => {
    totalWeightedRisk += r.riskScore * r.lengthKm;
    totalLength += r.lengthKm;
    if (r.riskScore > maxRisk) maxRisk = r.riskScore;
    if (r.isBlocked) hasBlocked = true;
    if (waterLevelPriority[r.waterLevel] > waterLevelPriority[maxWaterLevel]) {
      maxWaterLevel = r.waterLevel;
    }
  });

  const avgRisk = totalLength > 0 ? Math.round(totalWeightedRisk / totalLength) : 0;
  
  // Route score heavily penalizes the worst road on that path (bottleneck risk principle)
  let routeScore = Math.round(avgRisk * 0.45 + maxRisk * 0.55);
  if (hasBlocked) {
    routeScore = Math.max(routeScore, 85);
  }
  routeScore = Math.min(100, Math.max(5, routeScore));

  return {
    averageRisk: avgRisk,
    maxSegmentRisk: maxRisk,
    riskScore: routeScore,
    riskLevel: getRiskLevel(routeScore),
    hasBlockedSegment: hasBlocked,
    maxWaterLevel,
  };
}
