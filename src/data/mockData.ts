import { CitizenReport, EmergencyAlert, EmergencyResource, RoadSegment, RouteOption } from '../types';
import { calculateRoadRisk } from '../utils/riskEngine';

export const INITIAL_RAINFALL_MM_HR = 48; // Moderate to Heavy urban rain

export const INITIAL_ROADS_DATA: Omit<RoadSegment, 'riskScore' | 'riskLevel'>[] = [
  {
    id: 'rd-1',
    name: 'Downtown Expressway (Underpass Segment)',
    code: 'EX-101',
    category: 'highway',
    fromLocation: 'Central Station',
    toLocation: 'Financial Hub',
    lengthKm: 3.8,
    normalSpeedKmh: 65,
    elevationMeters: 2.2, // Low-lying underpass prone to flooding
    drainageCapacity: 'low',
    historicalFloodRisk: 78,
    roadCondition: 'fair',
    waterLevel: 'high',
    isBlocked: true,
    blockageReason: 'Submerged underpass (0.65m water depth) - 2 vehicles stalled',
    reportsCount: 14,
    pathCoordinates: [
      { x: 260, y: 380 },
      { x: 380, y: 390 },
      { x: 500, y: 410 },
      { x: 620, y: 440 }
    ],
    midpoint: { x: 440, y: 400 },
    lastUpdated: '3 mins ago'
  },
  {
    id: 'rd-2',
    name: 'Riverfront Boulevard',
    code: 'RF-20',
    category: 'arterial',
    fromLocation: 'Old Bridge',
    toLocation: 'Harbor Gate',
    lengthKm: 4.2,
    normalSpeedKmh: 45,
    elevationMeters: 1.8,
    drainageCapacity: 'low',
    historicalFloodRisk: 85,
    roadCondition: 'poor',
    waterLevel: 'medium',
    isBlocked: false,
    blockageReason: undefined,
    reportsCount: 9,
    pathCoordinates: [
      { x: 200, y: 280 },
      { x: 350, y: 290 },
      { x: 480, y: 310 },
      { x: 600, y: 350 },
      { x: 700, y: 400 }
    ],
    midpoint: { x: 430, y: 300 },
    lastUpdated: '12 mins ago'
  },
  {
    id: 'rd-3',
    name: 'Skyline Elevated Flyover & Bypass',
    code: 'SK-50',
    category: 'highway',
    fromLocation: 'Metro Center',
    toLocation: 'Eastridge Tech Park',
    lengthKm: 5.5,
    normalSpeedKmh: 75,
    elevationMeters: 24.0, // High elevated bridge, unaffected by surface runoff
    drainageCapacity: 'high',
    historicalFloodRisk: 8,
    roadCondition: 'good',
    waterLevel: 'none',
    isBlocked: false,
    reportsCount: 1,
    pathCoordinates: [
      { x: 250, y: 320 },
      { x: 380, y: 220 },
      { x: 540, y: 210 },
      { x: 680, y: 250 },
      { x: 800, y: 320 }
    ],
    midpoint: { x: 500, y: 215 },
    lastUpdated: '1 min ago'
  },
  {
    id: 'rd-4',
    name: 'North Highland Avenue',
    code: 'HL-04',
    category: 'arterial',
    fromLocation: 'Highland Park',
    toLocation: 'North Medical City',
    lengthKm: 3.5,
    normalSpeedKmh: 50,
    elevationMeters: 28.5,
    drainageCapacity: 'high',
    historicalFloodRisk: 12,
    roadCondition: 'good',
    waterLevel: 'none',
    isBlocked: false,
    reportsCount: 0,
    pathCoordinates: [
      { x: 400, y: 140 },
      { x: 520, y: 130 },
      { x: 650, y: 150 },
      { x: 760, y: 180 }
    ],
    midpoint: { x: 580, y: 140 },
    lastUpdated: 'Just now'
  },
  {
    id: 'rd-5',
    name: 'Oakridge Ring Road',
    code: 'OK-88',
    category: 'arterial',
    fromLocation: 'West Interchange',
    toLocation: 'Southern Valley',
    lengthKm: 4.8,
    normalSpeedKmh: 55,
    elevationMeters: 14.0,
    drainageCapacity: 'medium',
    historicalFloodRisk: 34,
    roadCondition: 'good',
    waterLevel: 'low',
    isBlocked: false,
    reportsCount: 3,
    pathCoordinates: [
      { x: 180, y: 440 },
      { x: 280, y: 520 },
      { x: 440, y: 560 },
      { x: 620, y: 550 }
    ],
    midpoint: { x: 360, y: 540 },
    lastUpdated: '8 mins ago'
  },
  {
    id: 'rd-6',
    name: 'Harbor Causeway & Tunnel',
    code: 'HB-12',
    category: 'tunnel',
    fromLocation: 'Docklands',
    toLocation: 'Airport South Gate',
    lengthKm: 4.0,
    normalSpeedKmh: 40,
    elevationMeters: 3.0,
    drainageCapacity: 'medium',
    historicalFloodRisk: 62,
    roadCondition: 'fair',
    waterLevel: 'medium',
    isBlocked: false,
    reportsCount: 7,
    pathCoordinates: [
      { x: 640, y: 460 },
      { x: 740, y: 520 },
      { x: 840, y: 560 }
    ],
    midpoint: { x: 740, y: 510 },
    lastUpdated: '5 mins ago'
  },
  {
    id: 'rd-7',
    name: 'University Campus Link',
    code: 'UN-09',
    category: 'residential',
    fromLocation: 'Student Village',
    toLocation: 'Civic Center',
    lengthKm: 2.4,
    normalSpeedKmh: 35,
    elevationMeters: 18.0,
    drainageCapacity: 'high',
    historicalFloodRisk: 15,
    roadCondition: 'good',
    waterLevel: 'none',
    isBlocked: false,
    reportsCount: 1,
    pathCoordinates: [
      { x: 260, y: 380 },
      { x: 280, y: 280 },
      { x: 380, y: 220 }
    ],
    midpoint: { x: 290, y: 290 },
    lastUpdated: '15 mins ago'
  },
  {
    id: 'rd-8',
    name: 'Grand Central Canal Road',
    code: 'CC-03',
    category: 'arterial',
    fromLocation: 'Market Square',
    toLocation: 'East Terminal',
    lengthKm: 3.1,
    normalSpeedKmh: 40,
    elevationMeters: 4.5,
    drainageCapacity: 'low',
    historicalFloodRisk: 72,
    roadCondition: 'poor',
    waterLevel: 'high',
    isBlocked: false,
    blockageReason: 'Water depth 0.40m over curb',
    reportsCount: 11,
    pathCoordinates: [
      { x: 500, y: 410 },
      { x: 550, y: 320 },
      { x: 680, y: 250 }
    ],
    midpoint: { x: 580, y: 330 },
    lastUpdated: '4 mins ago'
  },
  {
    id: 'rd-9',
    name: 'Airport Perimeter Highway',
    code: 'AP-01',
    category: 'highway',
    fromLocation: 'East Terminal',
    toLocation: 'City Airport Hub',
    lengthKm: 3.6,
    normalSpeedKmh: 70,
    elevationMeters: 20.0,
    drainageCapacity: 'high',
    historicalFloodRisk: 10,
    roadCondition: 'good',
    waterLevel: 'none',
    isBlocked: false,
    reportsCount: 0,
    pathCoordinates: [
      { x: 680, y: 250 },
      { x: 780, y: 270 },
      { x: 880, y: 340 }
    ],
    midpoint: { x: 770, y: 270 },
    lastUpdated: '10 mins ago'
  }
];

export function buildInitialRoadSegments(rainfallMmHr: number): RoadSegment[] {
  return INITIAL_ROADS_DATA.map((base) => {
    const risk = calculateRoadRisk(base, rainfallMmHr);
    return {
      ...base,
      riskScore: risk.totalScore,
      riskLevel: risk.riskLevel,
    };
  });
}

export const INITIAL_CITIZEN_REPORTS: CitizenReport[] = [
  {
    id: 'rep-1',
    roadId: 'rd-1',
    roadName: 'Downtown Expressway (Underpass Segment)',
    locationDescription: 'Underpass under 5th Ave overpass near Mile Marker 4',
    waterLevel: 'high',
    isBlocked: true,
    photoUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
    photoCaption: 'Underpass fully submerged, 2 sedans waterlogged up to windshield.',
    timestamp: '8 mins ago',
    verified: true,
    upvotes: 42,
    reporterName: 'Carlos M. (City Transit Volunteer)',
    waterDepthCm: 65,
    notes: 'Do not attempt! Police barricades being set up. High velocity water flow from storm culvert.'
  },
  {
    id: 'rep-2',
    roadId: 'rd-2',
    roadName: 'Riverfront Boulevard',
    locationDescription: 'Intersection with Old Pier Road, lane 1 & 2',
    waterLevel: 'medium',
    isBlocked: false,
    photoUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
    photoCaption: 'Water overflowing from river embankment onto lower roadway.',
    timestamp: '19 mins ago',
    verified: true,
    upvotes: 27,
    reporterName: 'Elena Rostova',
    waterDepthCm: 25,
    notes: 'Sedans scraping water, SUVs can pass slowly with extreme caution.'
  },
  {
    id: 'rep-3',
    roadId: 'rd-8',
    roadName: 'Grand Central Canal Road',
    locationDescription: 'Near East Wholesale Market Gate 3',
    waterLevel: 'high',
    isBlocked: false,
    photoUrl: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=600&q=80',
    photoCaption: 'Heavy ponding due to clogged storm sewer drain grates.',
    timestamp: '34 mins ago',
    verified: true,
    upvotes: 19,
    reporterName: 'Dr. Aaron Vance',
    waterDepthCm: 40,
    notes: 'Trash clogging drainage grates. Water level rising fast with incoming rain.'
  },
  {
    id: 'rep-4',
    roadId: 'rd-5',
    roadName: 'Oakridge Ring Road',
    locationDescription: 'Valley Curve near South Forest reserve',
    waterLevel: 'low',
    isBlocked: false,
    photoUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80',
    photoCaption: 'Minor puddle build-up on curb edge, center lanes completely dry.',
    timestamp: '45 mins ago',
    verified: true,
    upvotes: 11,
    reporterName: 'Priya Sharma',
    waterDepthCm: 8,
    notes: 'Safe for all passenger cars. Maintain speed under 45 km/h.'
  }
];

export const INITIAL_EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    id: 'em-1',
    name: 'Central Civic Evacuation Shelter',
    type: 'shelter',
    address: '450 North Hillside Terrace, District 2',
    distance: '2.4 km from Downtown',
    contactNumber: '+1 (800) 555-0199',
    status: 'operational',
    capacityTotal: 450,
    capacityUsed: 140,
    coordinates: { x: 420, y: 160 },
    amenities: ['Emergency Power', 'Hot Meals', 'Medical Staff', 'Pet Accommodations', 'Fresh Water']
  },
  {
    id: 'em-2',
    name: 'St. Jude Metropolitan Trauma Center',
    type: 'hospital',
    address: '880 Summit Medical Ridge, North Sector',
    distance: '3.8 km',
    contactNumber: '+1 (800) 555-9911',
    status: 'operational',
    capacityTotal: 180,
    capacityUsed: 125,
    coordinates: { x: 740, y: 160 },
    amenities: ['24/7 Level 1 Trauma', 'Helipad Operational', 'Flood-Resistant Generator', 'Oxygen Supply']
  },
  {
    id: 'em-3',
    name: 'Metro Fire & Water Rescue Station #7',
    type: 'fire_station',
    address: '12 Harbor Marine Boulevard',
    distance: '1.9 km',
    contactNumber: '+1 (800) 555-3473',
    status: 'operational',
    capacityTotal: 60,
    capacityUsed: 42,
    coordinates: { x: 310, y: 260 },
    amenities: ['Inflatable Rescue Boats', 'High-Clearance 4x4s', 'Water Pumps', 'Amphibious Unit']
  },
  {
    id: 'em-4',
    name: 'Eastridge High School Emergency Shelter',
    type: 'shelter',
    address: '102 Eastridge Park Way',
    distance: '5.1 km',
    contactNumber: '+1 (800) 555-7744',
    status: 'operational',
    capacityTotal: 300,
    capacityUsed: 65,
    coordinates: { x: 780, y: 280 },
    amenities: ['Dry Cots', 'Baby Formula', 'First Aid', 'Satellite Communications']
  }
];

export const INITIAL_EMERGENCY_ALERTS: EmergencyAlert[] = [
  {
    id: 'alt-1',
    title: 'FLASH FLOOD EMERGENCY: Downtown Expressway Underpass Closed',
    severity: 'high',
    area: 'Downtown Financial Corridor & Central Expressway',
    issuedAt: '8 mins ago by Metro Disaster Office',
    message: 'Extreme runoff has inundated the lower underpass at 0.65m depth. Traffic rerouted to Skyline Elevated Flyover. DO NOT drive into submerged roadways.',
    affectedRoads: ['Downtown Expressway', 'Grand Central Canal Road']
  },
  {
    id: 'alt-2',
    title: 'RIVER SURGE ADVISORY: High Tide & Storm Drain Overflow',
    severity: 'moderate',
    area: 'Riverfront Boulevard & Old Bridge District',
    issuedAt: '25 mins ago',
    message: 'Water levels on Riverfront Blvd currently at 0.25m. Low clearance vehicles advised to take Oakridge Ring Road or Skyline Flyover.',
    affectedRoads: ['Riverfront Boulevard', 'Harbor Causeway']
  }
];

export const SAMPLE_PRESET_ORIGINS = [
  { id: 'loc-1', name: 'Downtown Central Station (Lowland)' },
  { id: 'loc-2', name: 'West Valley Residential' },
  { id: 'loc-3', name: 'Harbor Gate Commercial' },
  { id: 'loc-4', name: 'Metro University Hub' }
];

export const SAMPLE_PRESET_DESTINATIONS = [
  { id: 'dest-1', name: 'City Airport Terminal Hub' },
  { id: 'dest-2', name: 'North Medical City & Trauma Hospital' },
  { id: 'dest-3', name: 'Central Civic Evacuation Shelter' },
  { id: 'dest-4', name: 'Eastridge Tech & Relief Center' }
];
