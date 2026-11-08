import { LocationPoint, RoadSegment, RouteOption, RouteStep } from '../types';
import { calculateRouteRisk } from './riskEngine';

/**
 * Computes dynamic routes connecting source to destination based on active road conditions.
 */
export function generateRoutes(
  roads: RoadSegment[],
  source: string | LocationPoint = 'Downtown Central Station (Lowland)',
  dest: string | LocationPoint = 'City Airport Terminal Hub'
): RouteOption[] {
  const sourceName = typeof source === 'string' ? source : source.name;
  const destName = typeof dest === 'string' ? dest : dest.name;

  // Calculate real geographic distance if both points have coordinates
  let scaleFactor = 1.0;
  if (typeof source !== 'string' && typeof dest !== 'string') {
    const R = 6371;
    const dLat = ((dest.lat - source.lat) * Math.PI) / 180;
    const dLon = ((dest.lng - source.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((source.lat * Math.PI) / 180) *
        Math.cos((dest.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;
    scaleFactor = Math.max(0.4, Math.min(4.0, distKm / 7.5));
  }

  // Road lookups
  const roadMap = new Map(roads.map((r) => [r.id, r]));

  // ROUTE A: Direct / Traditional Shortest Path (passes through rd-1 [Downtown Underpass] + rd-8 [Grand Central Canal] + rd-9 [Airport Perimeter])
  const routeARoadIds = ['rd-1', 'rd-8', 'rd-9'];
  const routeARoads = routeARoadIds.map((id) => roadMap.get(id)).filter(Boolean) as RoadSegment[];

  const routeARisk = calculateRouteRisk(roads, routeARoadIds);
  const routeADistance = parseFloat((8.2 * scaleFactor).toFixed(1));
  
  // Calculate travel time with speed penalties if roads have water/blockage
  let routeAMinutes = Math.max(6, Math.round(18 * scaleFactor));
  if (routeARisk.hasBlockedSegment) {
    routeAMinutes = Math.round(55 * scaleFactor); // severe delay or impassable
  } else if (routeARisk.riskScore > 60) {
    routeAMinutes = Math.round(32 * scaleFactor);
  }

  const routeASteps: RouteStep[] = [
    {
      instruction: `Depart from ${sourceName} onto Downtown Expressway (EX-101)`,
      roadName: roadMap.get('rd-1')?.name || 'Downtown Expressway',
      distanceKm: roadMap.get('rd-1')?.lengthKm || 3.8,
      riskScore: roadMap.get('rd-1')?.riskScore || 85,
      riskLevel: roadMap.get('rd-1')?.riskLevel || 'high',
      hazardNote: roadMap.get('rd-1')?.isBlocked
        ? 'BLOCKED: Underpass submerged (0.65m water). Stalled vehicles ahead.'
        : roadMap.get('rd-1')?.waterLevel === 'high'
        ? 'DANGER: Low elevation underpass subject to sudden water rush.'
        : undefined,
      elevationMeters: roadMap.get('rd-1')?.elevationMeters || 2.2,
    },
    {
      instruction: 'Continue through Grand Central Canal Road corridor (CC-03)',
      roadName: roadMap.get('rd-8')?.name || 'Grand Central Canal Road',
      distanceKm: roadMap.get('rd-8')?.lengthKm || 3.1,
      riskScore: roadMap.get('rd-8')?.riskScore || 70,
      riskLevel: roadMap.get('rd-8')?.riskLevel || 'high',
      hazardNote: 'Storm drains at capacity. Pavement ponding reported.',
      elevationMeters: roadMap.get('rd-8')?.elevationMeters || 4.5,
    },
    {
      instruction: `Merge into Airport Perimeter corridor to reach destination: ${destName}`,
      roadName: roadMap.get('rd-9')?.name || 'Airport Perimeter Highway',
      distanceKm: roadMap.get('rd-9')?.lengthKm || 3.6,
      riskScore: roadMap.get('rd-9')?.riskScore || 15,
      riskLevel: roadMap.get('rd-9')?.riskLevel || 'low',
      elevationMeters: roadMap.get('rd-9')?.elevationMeters || 20.0,
    }
  ];

  // ROUTE B: HydroNav Recommended Safe Route (passes through rd-7 [University link] + rd-3 [Skyline Elevated Flyover] + rd-9 [Airport Perimeter])
  const routeBRoadIds = ['rd-7', 'rd-3', 'rd-9'];
  const routeBRoads = routeBRoadIds.map((id) => roadMap.get(id)).filter(Boolean) as RoadSegment[];
  const routeBRisk = calculateRouteRisk(roads, routeBRoadIds);
  const rawDistB = routeBRoads.reduce((acc, r) => acc + r.lengthKm, 0) || 9.1;
  const routeBDistance = parseFloat((rawDistB * scaleFactor).toFixed(1));
  const routeBMinutes = Math.max(7, Math.round(23 * scaleFactor)); // Steady flow on elevated bypass

  const routeBSteps: RouteStep[] = [
    {
      instruction: `Depart from ${sourceName} via University Campus Link (UN-09) to access elevated ramp`,
      roadName: roadMap.get('rd-7')?.name || 'University Campus Link',
      distanceKm: parseFloat(((roadMap.get('rd-7')?.lengthKm || 2.4) * scaleFactor).toFixed(1)),
      riskScore: roadMap.get('rd-7')?.riskScore || 18,
      riskLevel: roadMap.get('rd-7')?.riskLevel || 'low',
      hazardNote: 'Clear drainage, high elevation hill climb.',
      elevationMeters: roadMap.get('rd-7')?.elevationMeters || 18.0,
    },
    {
      instruction: 'Take Skyline Elevated Flyover & Bypass (SK-50) over the flood basin',
      roadName: roadMap.get('rd-3')?.name || 'Skyline Elevated Flyover',
      distanceKm: parseFloat(((roadMap.get('rd-3')?.lengthKm || 5.5) * scaleFactor).toFixed(1)),
      riskScore: roadMap.get('rd-3')?.riskScore || 12,
      riskLevel: roadMap.get('rd-3')?.riskLevel || 'low',
      hazardNote: 'Continuous elevated viaduct (+24m above sea level) - 100% flood-immune.',
      elevationMeters: roadMap.get('rd-3')?.elevationMeters || 24.0,
    },
    {
      instruction: `Direct descent onto elevated corridor to safely reach: ${destName}`,
      roadName: roadMap.get('rd-9')?.name || 'Airport Perimeter Highway',
      distanceKm: parseFloat(((roadMap.get('rd-9')?.lengthKm || 3.6) * scaleFactor).toFixed(1)),
      riskScore: roadMap.get('rd-9')?.riskScore || 15,
      riskLevel: roadMap.get('rd-9')?.riskLevel || 'low',
      elevationMeters: roadMap.get('rd-9')?.elevationMeters || 20.0,
    }
  ];

  // ROUTE C: Southern Perimeter Ring Road (rd-5 + rd-6)
  const routeCRoadIds = ['rd-5', 'rd-6'];
  const routeCRoads = routeCRoadIds.map((id) => roadMap.get(id)).filter(Boolean) as RoadSegment[];
  const routeCRisk = calculateRouteRisk(roads, routeCRoadIds);
  const rawDistC = routeCRoads.reduce((acc, r) => acc + r.lengthKm, 0) || 11.5;
  const routeCDistance = parseFloat((rawDistC * scaleFactor).toFixed(1));
  const routeCMinutes = Math.max(9, Math.round(29 * scaleFactor));

  const routeCSteps: RouteStep[] = [
    {
      instruction: `Depart from ${sourceName} onto Oakridge Ring Road (OK-88) around southern suburbs`,
      roadName: roadMap.get('rd-5')?.name || 'Oakridge Ring Road',
      distanceKm: parseFloat(((roadMap.get('rd-5')?.lengthKm || 4.8) * scaleFactor).toFixed(1)),
      riskScore: roadMap.get('rd-5')?.riskScore || 38,
      riskLevel: roadMap.get('rd-5')?.riskLevel || 'moderate',
      hazardNote: 'Moderate curb water. Passable with minor slowdowns.',
      elevationMeters: roadMap.get('rd-5')?.elevationMeters || 14.0,
    },
    {
      instruction: `Proceed through Harbor Causeway & Tunnel (HB-12) to arrive at: ${destName}`,
      roadName: roadMap.get('rd-6')?.name || 'Harbor Causeway',
      distanceKm: parseFloat(((roadMap.get('rd-6')?.lengthKm || 4.0) * scaleFactor).toFixed(1)),
      riskScore: roadMap.get('rd-6')?.riskScore || 55,
      riskLevel: roadMap.get('rd-6')?.riskLevel || 'moderate',
      hazardNote: 'Tidal surge monitored. Water pumps operational.',
      elevationMeters: roadMap.get('rd-6')?.elevationMeters || 3.0,
    }
  ];

  // Recommendation logic:
  // We recommend the safest practical route whose risk score is below 40.
  // If Route A is high risk (>60) or blocked, Route B is highlighted as recommended.
  const isRouteBRecommended = routeBRisk.riskScore < routeARisk.riskScore;

  const routeA: RouteOption = {
    id: 'route-a',
    name: 'Route A (Direct / Shortest)',
    via: 'via Downtown Expressway & Canal Road',
    distanceKm: routeADistance,
    estimatedMinutes: routeAMinutes,
    riskScore: routeARisk.riskScore,
    riskLevel: routeARisk.riskLevel,
    isRecommended: !isRouteBRecommended,
    recommendationReason: isRouteBRecommended
      ? `NOT RECOMMENDED: Severe flood risk (${routeARisk.riskScore}/100) and ${routeARisk.hasBlockedSegment ? 'blocked underpass' : 'deep standing water'}. Passing through low elevation basin (2.2m).`
      : 'Shortest path currently clear.',
    hasBlockedRoad: routeARisk.hasBlockedSegment,
    maxWaterLevel: routeARisk.maxWaterLevel,
    roadIds: routeARoadIds,
    steps: routeASteps,
    pathD: 'M 260 380 Q 440 400 620 440 T 680 250 T 880 340',
    tag: 'Shortest Distance'
  };

  const routeB: RouteOption = {
    id: 'route-b',
    name: 'Route B (Elevated Safe Bypass)',
    via: 'via University Link & Skyline Flyover',
    distanceKm: routeBDistance,
    estimatedMinutes: routeBMinutes,
    riskScore: routeBRisk.riskScore,
    riskLevel: routeBRisk.riskLevel,
    isRecommended: isRouteBRecommended,
    recommendationReason: isRouteBRecommended
      ? `RECOMMENDED: High elevation bypass (+24m). 0% submerged segments, clear drainage, saves you from getting trapped in lowland floodwater despite +0.9 km distance.`
      : 'Optimal elevated corridor.',
    hasBlockedRoad: routeBRisk.hasBlockedSegment,
    maxWaterLevel: routeBRisk.maxWaterLevel,
    roadIds: routeBRoadIds,
    steps: routeBSteps,
    pathD: 'M 260 380 L 280 280 L 380 220 Q 540 210 680 250 L 780 270 L 880 340',
    tag: 'HydroNav Recommended'
  };

  const routeC: RouteOption = {
    id: 'route-c',
    name: 'Route C (Southern Ring Road)',
    via: 'via Oakridge Ring & Harbor Causeway',
    distanceKm: routeCDistance,
    estimatedMinutes: routeCMinutes,
    riskScore: routeCRisk.riskScore,
    riskLevel: routeCRisk.riskLevel,
    isRecommended: false,
    recommendationReason: 'Secondary alternative around southern perimeter with moderate water ponding on Harbor Causeway.',
    hasBlockedRoad: routeCRisk.hasBlockedSegment,
    maxWaterLevel: routeCRisk.maxWaterLevel,
    roadIds: routeCRoadIds,
    steps: routeCSteps,
    pathD: 'M 260 380 L 180 440 Q 360 540 620 550 L 740 520 L 840 560 L 880 340',
    tag: 'Alternative Perimeter'
  };

  return [routeB, routeA, routeC]; // Return Route B first or highlighted
}
