import { CachedOfflineRoute, LocationPoint, RouteOption } from '../types';

const DB_NAME = 'HydroNavOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offlineRoutes';
const LOCAL_STORAGE_FALLBACK_KEY = 'hydronav_offline_routes_backup';

/**
 * Initializes and returns the IndexedDB database instance.
 */
export function initOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('savedAt', 'savedAt', { unique: false });
        store.createIndex('originName', 'origin.name', { unique: false });
        store.createIndex('destinationName', 'destination.name', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Saves a route and its coordinate points into IndexedDB for offline flood emergency access.
 */
export async function saveOfflineRoute(
  origin: LocationPoint,
  destination: LocationPoint,
  route: RouteOption,
  rainfallMmHr: number,
  notes?: string
): Promise<CachedOfflineRoute> {
  const routePoints = route.points || [];
  const serialized = JSON.stringify({ origin, destination, route, rainfallMmHr });
  const sizeBytesApprox = new Blob([serialized]).size;

  const cachedRecord: CachedOfflineRoute = {
    id: `offline-${encodeURIComponent(origin.name.split(',')[0].trim().toLowerCase())}-to-${encodeURIComponent(
      destination.name.split(',')[0].trim().toLowerCase()
    )}-${route.id}`,
    savedAt: new Date().toISOString(),
    origin: {
      name: origin.name,
      lat: origin.lat,
      lng: origin.lng,
      address: origin.address,
      elevationMeters: origin.elevationMeters,
    },
    destination: {
      name: destination.name,
      lat: destination.lat,
      lng: destination.lng,
      address: destination.address,
      elevationMeters: destination.elevationMeters,
    },
    route: {
      ...route,
      points: routePoints,
      steps: route.steps || [],
    },
    pointCount: routePoints.length,
    stepCount: route.steps ? route.steps.length : 0,
    rainfallMmHr,
    sizeBytesApprox,
    notes: notes || `Cached for offline disaster navigation during network disruption.`,
  };

  try {
    const db = await initOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(cachedRecord);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (idbErr) {
    console.warn('IndexedDB write warning, attempting localStorage fallback:', idbErr);
    // LocalStorage fallback
    try {
      const existing = getLocalStorageBackup();
      const filtered = existing.filter((r) => r.id !== cachedRecord.id);
      filtered.unshift(cachedRecord);
      localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(filtered.slice(0, 10)));
    } catch (lsErr) {
      console.error('LocalStorage write failed:', lsErr);
    }
  }

  return cachedRecord;
}

/**
 * Retrieves all cached offline routes from IndexedDB (or fallback).
 */
export async function getAllOfflineRoutes(): Promise<CachedOfflineRoute[]> {
  try {
    const db = await initOfflineDB();
    return new Promise<CachedOfflineRoute[]>((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getAllReq = store.getAll();

      getAllReq.onsuccess = () => {
        const results = (getAllReq.result as CachedOfflineRoute[]) || [];
        results.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        resolve(results);
      };

      getAllReq.onerror = () => reject(getAllReq.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for offline routes retrieval:', err);
    return getLocalStorageBackup();
  }
}

/**
 * Retrieves a single cached offline route by ID.
 */
export async function getOfflineRouteById(id: string): Promise<CachedOfflineRoute | null> {
  try {
    const db = await initOfflineDB();
    return new Promise<CachedOfflineRoute | null>((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        resolve((getReq.result as CachedOfflineRoute) || null);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    const backup = getLocalStorageBackup();
    return backup.find((r) => r.id === id) || null;
  }
}

/**
 * Deletes a cached offline route from IndexedDB.
 */
export async function deleteOfflineRoute(id: string): Promise<boolean> {
  try {
    const db = await initOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delReq = store.delete(id);

      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
    });

    // Also remove from fallback
    const backup = getLocalStorageBackup();
    const updated = backup.filter((r) => r.id !== id);
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.warn('Failed to delete route from IndexedDB:', err);
    return false;
  }
}

/**
 * Clears all cached routes from IndexedDB.
 */
export async function clearAllOfflineRoutes(): Promise<boolean> {
  try {
    const db = await initOfflineDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const clearReq = store.clear();

      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    localStorage.removeItem(LOCAL_STORAGE_FALLBACK_KEY);
    return true;
  } catch (err) {
    console.warn('Failed to clear IndexedDB:', err);
    return false;
  }
}

/**
 * Helper to get fallback cached routes from localStorage.
 */
function getLocalStorageBackup(): CachedOfflineRoute[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Computes storage statistics for the offline map database.
 */
export async function getOfflineStorageStats(): Promise<{
  count: number;
  totalEstimatedBytes: number;
  formattedSize: string;
}> {
  const routes = await getAllOfflineRoutes();
  const totalEstimatedBytes = routes.reduce((acc, r) => acc + (r.sizeBytesApprox || 0), 0);

  let formattedSize = '0 KB';
  if (totalEstimatedBytes > 1024 * 1024) {
    formattedSize = `${(totalEstimatedBytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    formattedSize = `${Math.round(totalEstimatedBytes / 1024)} KB`;
  }

  return {
    count: routes.length,
    totalEstimatedBytes,
    formattedSize,
  };
}

/**
 * Exports a cached offline route into standard GeoJSON FeatureCollection format for GIS and external tools.
 */
export function exportRouteAsGeoJSON(cached: CachedOfflineRoute): string {
  const coordinates = (cached.route.points || []).map((pt) => [pt.lng, pt.lat]);

  const geojson = {
    type: 'FeatureCollection',
    properties: {
      id: cached.id,
      name: `${cached.origin.name} to ${cached.destination.name}`,
      savedAt: cached.savedAt,
      distanceKm: cached.route.distanceKm,
      estimatedMinutes: cached.route.estimatedMinutes,
      riskLevel: cached.route.riskLevel,
      riskScore: cached.route.riskScore,
      rainfallMmHr: cached.rainfallMmHr,
      source: 'HydroNav Flood Emergency Routing Engine',
    },
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          name: cached.route.name,
          via: cached.route.via,
          distanceKm: cached.route.distanceKm,
          estimatedMinutes: cached.route.estimatedMinutes,
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [cached.origin.lng, cached.origin.lat],
        },
        properties: {
          title: 'Start Location',
          name: cached.origin.name,
          elevationMeters: cached.origin.elevationMeters,
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [cached.destination.lng, cached.destination.lat],
        },
        properties: {
          title: 'Destination Location',
          name: cached.destination.name,
          elevationMeters: cached.destination.elevationMeters,
        },
      },
    ],
  };

  return JSON.stringify(geojson, null, 2);
}

/**
 * Triggers a browser download of the cached route in JSON or GeoJSON format.
 */
export function downloadOfflineRouteFile(
  cached: CachedOfflineRoute,
  format: 'json' | 'geojson' = 'json'
): void {
  if (typeof window === 'undefined') return;

  const content =
    format === 'geojson'
      ? exportRouteAsGeoJSON(cached)
      : JSON.stringify(cached, null, 2);

  const cleanName = `${cached.origin.name.split(',')[0].trim()}_to_${cached.destination.name
    .split(',')[0]
    .trim()}_route`.replace(/[^a-zA-Z0-9_-]/g, '_');

  const filename = `${cleanName}_offline.${format}`;
  const blob = new Blob([content], {
    type: format === 'geojson' ? 'application/geo+json' : 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
