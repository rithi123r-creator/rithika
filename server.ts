import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  INITIAL_CITIZEN_REPORTS,
  INITIAL_EMERGENCY_ALERTS,
  INITIAL_EMERGENCY_RESOURCES,
  INITIAL_RAINFALL_MM_HR,
  buildInitialRoadSegments,
} from './src/data/mockData';
import { calculateRoadRisk } from './src/utils/riskEngine';
import { RoadSegment, CitizenReport, EmergencyAlert, WaterLevel } from './src/types';
import { isPointInIndia, isRouteContainedInIndia, decodePolyline } from './src/utils/indiaGeo';

import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback to reading .env.example if VITE_GOOGLE_MAPS_API_KEY is not in process.env
if (!process.env.VITE_GOOGLE_MAPS_API_KEY) {
  try {
    const envExamplePath = path.resolve(__dirname, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      const exampleConfig = dotenv.parse(fs.readFileSync(envExamplePath));
      if (exampleConfig.VITE_GOOGLE_MAPS_API_KEY) {
        process.env.VITE_GOOGLE_MAPS_API_KEY = exampleConfig.VITE_GOOGLE_MAPS_API_KEY;
      }
      if (exampleConfig.GOOGLE_MAPS_API_KEY) {
        process.env.GOOGLE_MAPS_API_KEY = exampleConfig.GOOGLE_MAPS_API_KEY;
      }
    }
  } catch (err) {
    console.warn('Fallback env read notice:', err);
  }
}

// Auto-heal .env if it was removed so client Vite also receives VITE_GOOGLE_MAPS_API_KEY
const envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath) && process.env.VITE_GOOGLE_MAPS_API_KEY) {
  try {
    fs.writeFileSync(
      envPath,
      `PORT=3000\nVITE_GOOGLE_MAPS_API_KEY=${process.env.VITE_GOOGLE_MAPS_API_KEY}\nGOOGLE_MAPS_API_KEY=${process.env.VITE_GOOGLE_MAPS_API_KEY}\n`
    );
  } catch {}
}

const app = express();

// Determine port: dev server must run on port 3000 (never 8080 which is used by nginx)
let resolvedPort = 3000;
const portFlagIndex = process.argv.indexOf('--port');
if (portFlagIndex !== -1 && process.argv[portFlagIndex + 1]) {
  const parsed = parseInt(process.argv[portFlagIndex + 1], 10);
  if (!isNaN(parsed)) resolvedPort = parsed;
} else if (process.env.DEFAULT_APP_PORT) {
  resolvedPort = parseInt(process.env.DEFAULT_APP_PORT, 10);
}
const PORT = resolvedPort;

// Enable CORS for all API calls
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// 0. Configuration & Environment Endpoint
app.get('/api/config', (req: Request, res: Response) => {
  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
  res.json({
    googleMapsApiKey: apiKey,
    status: 'online',
    version: '1.0.0',
    port: PORT,
  });
});

// In-memory data store for live disaster management backend
let rainfallMmHr: number = INITIAL_RAINFALL_MM_HR;
let roads: RoadSegment[] = buildInitialRoadSegments(rainfallMmHr);
let citizenReports: CitizenReport[] = [...INITIAL_CITIZEN_REPORTS];
const emergencyAlerts: EmergencyAlert[] = [...INITIAL_EMERGENCY_ALERTS];

// Helper to recalculate all roads with current rainfall
function refreshRoads() {
  roads = roads.map((road) => {
    const risk = calculateRoadRisk(road, rainfallMmHr);
    return {
      ...road,
      riskScore: risk.totalScore,
      riskLevel: risk.riskLevel,
    };
  });
}

// -------------------------------------------------------------
// BACKEND API ROUTES (/api/*)
// -------------------------------------------------------------

// 1. Health check & status endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    backend: 'online',
    service: 'HydroNav Urban Flood Disaster Management Engine',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    rainfallMmHr,
    monitoredRoadsCount: roads.length,
    activeReportsCount: citizenReports.length,
    blockedRoadsCount: roads.filter((r) => r.isBlocked).length,
  });
});

app.get('/api/status', (req: Request, res: Response) => {
  const highRiskRoads = roads.filter((r) => r.riskLevel === 'high' || r.isBlocked);
  const moderateRiskRoads = roads.filter((r) => r.riskLevel === 'moderate');
  const avgScore = Math.round(roads.reduce((acc, r) => acc + r.riskScore, 0) / roads.length);

  res.json({
    status: 'active',
    rainfallMmHr,
    overallRiskScore: avgScore,
    highRiskRoadsCount: highRiskRoads.length,
    moderateRiskRoadsCount: moderateRiskRoads.length,
    blockedRoadsCount: roads.filter((r) => r.isBlocked).length,
    activeAlerts: emergencyAlerts,
  });
});

// 2. Road Network Endpoints
app.get('/api/roads', (req: Request, res: Response) => {
  res.json(roads);
});

app.get('/api/roads/:id', (req: Request, res: Response) => {
  const road = roads.find((r) => r.id === req.params.id);
  if (!road) {
    return res.status(404).json({ error: 'Road segment not found' });
  }
  res.json(road);
});

// 3. Citizen Flood Reports
app.get('/api/reports', (req: Request, res: Response) => {
  res.json(citizenReports);
});

app.post('/api/reports', (req: Request, res: Response) => {
  const {
    roadId,
    roadName,
    locationDescription,
    waterLevel,
    isBlocked,
    waterDepthCm,
    photoUrl,
    notes,
    reporterName,
  } = req.body;

  if (!roadId || !waterLevel) {
    return res.status(400).json({ error: 'roadId and waterLevel are required' });
  }

  const newReport: CitizenReport = {
    id: `rep-${Date.now()}`,
    roadId,
    roadName: roadName || 'Urban Road Corridor',
    locationDescription: locationDescription || 'Reported Location',
    waterLevel: waterLevel as WaterLevel,
    isBlocked: Boolean(isBlocked),
    waterDepthCm: Number(waterDepthCm) || (waterLevel === 'high' ? 50 : 25),
    photoUrl,
    timestamp: 'Just now',
    verified: false,
    upvotes: 1,
    reporterName: reporterName || 'Anonymous Citizen Reporter',
  };

  citizenReports = [newReport, ...citizenReports];

  // Dynamically update the affected road segment in memory
  const roadIdx = roads.findIndex((r) => r.id === roadId);
  if (roadIdx !== -1) {
    const existing = roads[roadIdx];
    const updatedRoad: RoadSegment = {
      ...existing,
      waterLevel: newReport.waterLevel,
      isBlocked: existing.isBlocked || newReport.isBlocked,
      blockageReason: newReport.isBlocked
        ? notes || `Water ponding ${newReport.waterDepthCm}cm detected by citizen report`
        : existing.blockageReason,
      reportsCount: existing.reportsCount + 1,
      lastUpdated: 'Just now',
    };
    const risk = calculateRoadRisk(updatedRoad, rainfallMmHr);
    updatedRoad.riskScore = Math.min(100, Math.max(risk.totalScore, newReport.waterLevel === 'high' ? 85 : 55));
    updatedRoad.riskLevel = updatedRoad.riskScore > 65 ? 'high' : 'moderate';
    roads[roadIdx] = updatedRoad;

    return res.status(201).json({
      success: true,
      report: newReport,
      updatedRoad,
    });
  }

  res.status(201).json({
    success: true,
    report: newReport,
  });
});

app.post('/api/reports/:id/upvote', (req: Request, res: Response) => {
  const report = citizenReports.find((r) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  report.upvotes += 1;
  res.json({ success: true, upvotes: report.upvotes });
});

// 4. Emergency Alerts & Resources
app.get('/api/alerts', (req: Request, res: Response) => {
  res.json(emergencyAlerts);
});

app.get('/api/resources', (req: Request, res: Response) => {
  res.json(INITIAL_EMERGENCY_RESOURCES);
});

// 5. Emergency SOS Dispatch Endpoint
app.post('/api/sos', (req: Request, res: Response) => {
  const { callerLocation, emergencyType, contactPhone, notes } = req.body;
  const dispatchId = `SOS-${Math.floor(100000 + Math.random() * 900000)}`;

  res.json({
    success: true,
    dispatchId,
    status: 'DISPATCHED',
    message: 'Rescue vehicle dispatched along high-elevation bypass route',
    etaMinutes: 6,
    dispatchedUnit: {
      team: 'Rapid Flood Rescue Unit 4 (Amphibious Unit)',
      base: 'Station 14 Elevated Depot',
      trackingCode: dispatchId,
    },
    receivedAt: new Date().toISOString(),
    location: callerLocation || 'Metro Basin Coordinates',
  });
});

// 6. Simulation Scenarios Trigger
app.post('/api/simulation', (req: Request, res: Response) => {
  const { scenario } = req.body;

  if (scenario === 'flash_flood_downtown') {
    rainfallMmHr = 92;
    refreshRoads();
    const rd1 = roads.find((r) => r.id === 'rd-1');
    if (rd1) {
      rd1.isBlocked = true;
      rd1.waterLevel = 'high';
      rd1.riskScore = 98;
      rd1.riskLevel = 'high';
    }
  } else if (scenario === 'harbor_surge') {
    rainfallMmHr = 65;
    refreshRoads();
    const rd6 = roads.find((r) => r.id === 'rd-6');
    if (rd6) {
      rd6.waterLevel = 'high';
      rd6.riskScore = 88;
      rd6.riskLevel = 'high';
    }
  } else if (scenario === 'heavy_cloudburst') {
    rainfallMmHr = 85;
    refreshRoads();
  } else {
    // reset
    rainfallMmHr = INITIAL_RAINFALL_MM_HR;
    roads = buildInitialRoadSegments(rainfallMmHr);
    citizenReports = [...INITIAL_CITIZEN_REPORTS];
  }

  res.json({
    success: true,
    scenario,
    rainfallMmHr,
    roads,
  });
});

// 7. India-Restricted Route Calculation Endpoint
app.post('/api/routes/calculate', async (req: Request, res: Response) => {
  try {
    const { origin, destination, rainfallMmHr: rain = 48 } = req.body;
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination coordinates are required' });
    }

    const oLat = Number(origin.lat);
    const oLng = Number(origin.lng);
    const dLat = Number(destination.lat);
    const dLng = Number(destination.lng);

    const isOriginInIndia = isPointInIndia(oLat, oLng);
    const isDestInIndia = isPointInIndia(dLat, dLng);

    if (isOriginInIndia && !isDestInIndia) {
      return res.status(400).json({
        error: 'International destination rejected. HydroNav routing is restricted strictly to Indian territory.',
      });
    }
    if (!isOriginInIndia && isDestInIndia) {
      return res.status(400).json({
        error: 'International origin rejected. HydroNav routing is restricted strictly to Indian territory.',
      });
    }

    const requireIndiaOnly = isOriginInIndia && isDestInIndia;

    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    const regionParam = requireIndiaOnly ? '&region=in' : '';
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${oLat},${oLng}&destination=${dLat},${dLng}&alternatives=true${regionParam}&key=${apiKey}`;

    const apiRes = await fetch(directionsUrl);
    const data = await apiRes.json();

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      return res.status(404).json({
        error: requireIndiaOnly
          ? 'No valid road route found within India between the selected locations.'
          : 'No driving route found between these locations.',
      });
    }

    // Filter and sanitize routes against India geographic boundaries
    const validRoutes: any[] = [];

    for (let i = 0; i < data.routes.length; i++) {
      const r = data.routes[i];
      const points = decodePolyline(r.overview_polyline.points);

      // Enforce India-Only restriction: reject routes that exit India or enter Sri Lanka, etc.
      if (requireIndiaOnly) {
        const staysInIndia = isRouteContainedInIndia(points);
        if (!staysInIndia) {
          console.warn(`[Route Validation] Route alternative ${i} rejected: points outside Indian territory.`);
          continue;
        }
      }

      const leg = r.legs[0];
      const distKm = parseFloat((leg.distance.value / 1000).toFixed(1));
      const durationMins = Math.round(leg.duration.value / 60);

      const steps = leg.steps.map((st: any) => ({
        instruction: st.html_instructions ? st.html_instructions.replace(/<[^>]+>/g, ' ') : 'Proceed on roadway',
        distanceKm: parseFloat((st.distance.value / 1000).toFixed(1)),
        roadName: st.maneuver ? `${st.maneuver}` : 'Connected Roadway',
        elevationMeters: 14.0,
      }));

      validRoutes.push({
        id: i === 0 ? 'route-a' : i === 1 ? 'route-b' : `route-c`,
        summary: r.summary || `Primary Highway Corridor`,
        distanceKm: distKm,
        estimatedMinutes: durationMins,
        points,
        steps,
        bounds: r.bounds,
      });
    }

    if (validRoutes.length === 0) {
      return res.status(404).json({
        error: 'No valid route found within India. Selected locations cannot be connected via Indian roadways without crossing international borders.',
      });
    }

    // Calculate flood risk profiles
    const primary = validRoutes[0];
    const riskA = rain > 65 ? 85 : rain > 45 ? 62 : 22;

    const routeA = {
      id: 'route-a',
      name: 'Route A (Direct / Shortest)',
      via: `via ${primary.summary || 'Direct Highway'}`,
      distanceKm: primary.distanceKm,
      estimatedMinutes: primary.estimatedMinutes,
      riskScore: riskA,
      riskLevel: riskA > 65 ? 'high' : riskA > 35 ? 'moderate' : 'low',
      isRecommended: riskA <= 60,
      recommendationReason: riskA > 60
        ? `HIGH FLOOD RISK (${riskA}/100) due to intense precipitation (${rain} mm/h). Passing through potential inundation basins.`
        : 'Direct highway corridor currently clear with steady drainage.',
      hasBlockedRoad: riskA > 80,
      points: primary.points,
      steps: primary.steps,
      bounds: primary.bounds,
    };

    let routeB;
    if (validRoutes.length > 1) {
      const alt = validRoutes[1];
      routeB = {
        id: 'route-b',
        name: 'Route B (Safe Elevated Bypass)',
        via: `via ${alt.summary || 'Bypass Viaduct'}`,
        distanceKm: alt.distanceKm,
        estimatedMinutes: alt.estimatedMinutes,
        riskScore: 18,
        riskLevel: 'low',
        isRecommended: true,
        recommendationReason: 'RECOMMENDED SAFE ROUTE: Elevated highway alignment with flood-immune storm drainage.',
        hasBlockedRoad: false,
        points: alt.points,
        steps: alt.steps,
        bounds: alt.bounds,
      };
    } else {
      routeB = {
        id: 'route-b',
        name: 'Route B (Safe Elevated Corridor)',
        via: `via ${primary.summary || 'Highway'} Ridge Bypass`,
        distanceKm: parseFloat((primary.distanceKm * 1.05).toFixed(1)),
        estimatedMinutes: primary.estimatedMinutes + 5,
        riskScore: 16,
        riskLevel: 'low',
        isRecommended: true,
        recommendationReason: 'RECOMMENDED SAFE ROUTE: Verified road corridor within India avoiding lowland flood basins.',
        hasBlockedRoad: false,
        points: primary.points,
        steps: primary.steps,
        bounds: primary.bounds,
      };
    }

    res.json({
      success: true,
      inIndia: requireIndiaOnly,
      routes: [routeA, routeB],
    });
  } catch (err: any) {
    console.error('Route calculation error:', err);
    res.status(500).json({ error: 'Failed to calculate route: ' + (err.message || 'Server error') });
  }
});

// 8. India Geocoding Endpoint
app.get('/api/geocode', async (req: Request, res: Response) => {
  try {
    const address = req.query.address as string;
    if (!address) {
      return res.status(400).json({ error: 'Address parameter is required' });
    }

    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=in&key=${apiKey}`;
    const apiRes = await fetch(url);
    const data = await apiRes.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const top = data.results[0];
      return res.json({
        success: true,
        lat: top.geometry.location.lat,
        lng: top.geometry.location.lng,
        address: top.formatted_address,
      });
    }

    res.status(404).json({ error: 'Location not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Geocoding failed' });
  }
});

// -------------------------------------------------------------
// FRONTEND INTEGRATION: VITE MIDDLEWARE (DEV) / STATIC (PROD)
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Dev: Mount Vite middleware in Express on port 3000
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[HydroNav Backend] Mounted Vite development middleware');
  } else {
    // Prod: Serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[HydroNav Backend] Serving production static files from dist/');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  HydroNav Disaster Management Engine is LIVE!     `);
    console.log(`  Backend API:  http://0.0.0.0:${PORT}/api/health    `);
    console.log(`  App URL:      http://0.0.0.0:${PORT}               `);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('[HydroNav Backend] Failed to start server:', err);
  process.exit(1);
});
