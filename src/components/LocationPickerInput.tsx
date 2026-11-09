import React, { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useHydro } from '../context/HydroContext';
import { LocationPoint } from '../types';
import { SAMPLE_PRESET_ORIGINS, SAMPLE_PRESET_DESTINATIONS } from '../data/mockData';
import {
  MapPin,
  Crosshair,
  Navigation,
  Search,
  Check,
  X,
  Compass,
  ArrowRight,
  Sparkles,
  Mountain,
} from 'lucide-react';

interface LocationPickerInputProps {
  type: 'origin' | 'destination';
  label: string;
  placeholder?: string;
  onFocusMap?: () => void;
}

export const LocationPickerInput: React.FC<LocationPickerInputProps> = ({
  type,
  label,
  placeholder = 'Type address, landmark, or pick on map...',
  onFocusMap,
}) => {
  const {
    originPoint,
    setOriginPoint,
    destinationPoint,
    setDestinationPoint,
    pickMode,
    setPickMode,
    requestGpsLocation,
  } = useHydro();

  const currentPoint = type === 'origin' ? originPoint : destinationPoint;
  const isPickingThis = pickMode === type;

  const [inputValue, setInputValue] = useState<string>(currentPoint.name);
  const [isOpen, setIsOpen] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [placesSuggestions, setPlacesSuggestions] = useState<
    { description: string; placeId?: string; lat?: number; lng?: number }[]
  >([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Sync input text when current point changes from map clicks or GPS
  useEffect(() => {
    setInputValue(currentPoint.name);
  }, [currentPoint.name]);

  // Handle outside click to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions via Google Places Autocomplete API or local database
  useEffect(() => {
    if (!inputValue.trim() || inputValue === currentPoint.name) {
      setPlacesSuggestions([]);
      return;
    }

    let isCancelled = false;

    // 1. Try modern Google Maps Places API AutocompleteSuggestion if available
    if (placesLib && placesLib.AutocompleteSuggestion && placesLib.AutocompleteSessionToken) {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }

        const request: google.maps.places.AutocompleteRequest = {
          input: inputValue,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ['IN'],
        };

        placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
          .then((response: { suggestions?: google.maps.places.AutocompleteSuggestion[] }) => {
            if (isCancelled) return;
            if (response?.suggestions && response.suggestions.length > 0) {
              const mapped = response.suggestions.map((s) => {
                const pred = s.placePrediction as any;
                const text =
                  (typeof pred?.text?.text === 'string' && pred.text.text) ||
                  (typeof pred?.text === 'string' && pred.text) ||
                  (typeof pred?.mainText?.text === 'string' && pred.mainText.text) ||
                  (typeof pred?.mainText === 'string' && pred.mainText) ||
                  'Suggested Location';
                return {
                  description: text,
                  placeId: pred?.placeId,
                };
              });
              setPlacesSuggestions(mapped);
            }
          })
          .catch(() => {
            // Silently fall back to rich local suggestions
          });
      } catch {
        // Fall back to local filtering
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [inputValue, placesLib, currentPoint.name]);

  // Combined quick landmark options for flood-safe routing (India & Tamil Nadu focus)
  const landmarkOptions = [
    ...SAMPLE_PRESET_ORIGINS,
    ...SAMPLE_PRESET_DESTINATIONS,
    {
      id: 'lm-kumbakonam',
      name: 'Kumbakonam, Tamil Nadu',
      lat: 10.9602,
      lng: 79.3845,
      elevationMeters: 26.0,
      address: 'Kumbakonam Central, Tamil Nadu, India',
      sourceType: 'preset' as const,
    },
    {
      id: 'lm-trichy',
      name: 'Trichy (Tiruchirappalli), Tamil Nadu',
      lat: 10.8062,
      lng: 78.6846,
      elevationMeters: 88.0,
      address: 'Tiruchirappalli Junction, Tamil Nadu, India',
      sourceType: 'preset' as const,
    },
    {
      id: 'lm-thanjavur',
      name: 'Thanjavur, Tamil Nadu',
      lat: 10.7870,
      lng: 79.1378,
      elevationMeters: 57.0,
      address: 'Thanjavur Highway Corridor, Tamil Nadu, India',
      sourceType: 'preset' as const,
    },
    {
      id: 'lm-chennai',
      name: 'Chennai Central, Tamil Nadu',
      lat: 13.0827,
      lng: 80.2707,
      elevationMeters: 8.0,
      address: 'Chennai Central Station Area, Tamil Nadu, India',
      sourceType: 'preset' as const,
    },
    {
      id: 'lm-coimbatore',
      name: 'Coimbatore, Tamil Nadu',
      lat: 11.0168,
      lng: 76.9558,
      elevationMeters: 411.0,
      address: 'Coimbatore Urban Core, Tamil Nadu, India',
      sourceType: 'preset' as const,
    },
    {
      id: 'lm-madurai',
      name: 'Madurai, Tamil Nadu',
      lat: 9.9252,
      lng: 78.1198,
      elevationMeters: 136.0,
      address: 'Madurai Bypass Junction, Tamil Nadu, India',
      sourceType: 'preset' as const,
    },
    {
      id: 'lm-bengaluru',
      name: 'Bengaluru (Bangalore), Karnataka',
      lat: 12.9716,
      lng: 77.5946,
      elevationMeters: 920.0,
      address: 'Bengaluru Central, Karnataka, India',
      sourceType: 'preset' as const,
    },
  ];

  const filteredLandmarks = landmarkOptions.filter(
    (lm) =>
      lm.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      (lm.address && lm.address.toLowerCase().includes(inputValue.toLowerCase()))
  );

  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  // Helper to resolve coordinates for any address, place name, or placeId
  const resolveLocationCoordinates = async (
    queryOrDescription: string,
    placeId?: string
  ): Promise<{ lat: number; lng: number; address: string } | null> => {
    const qClean = queryOrDescription.trim().toLowerCase();

    // 1. Direct dictionary lookup for major Indian cities to avoid substring mis-matches
    const majorCities: Record<string, { lat: number; lng: number; address: string }> = {
      kumbakonam: { lat: 10.9602, lng: 79.3845, address: 'Kumbakonam, Tamil Nadu, India' },
      trichy: { lat: 10.8062, lng: 78.6846, address: 'Tiruchirappalli (Trichy), Tamil Nadu, India' },
      tiruchirappalli: { lat: 10.8062, lng: 78.6846, address: 'Tiruchirappalli (Trichy), Tamil Nadu, India' },
      tiruchi: { lat: 10.8062, lng: 78.6846, address: 'Tiruchirappalli (Trichy), Tamil Nadu, India' },
      thanjavur: { lat: 10.7870, lng: 79.1378, address: 'Thanjavur, Tamil Nadu, India' },
      tanjore: { lat: 10.7870, lng: 79.1378, address: 'Thanjavur, Tamil Nadu, India' },
      chennai: { lat: 13.0827, lng: 80.2707, address: 'Chennai Central, Tamil Nadu, India' },
      madras: { lat: 13.0827, lng: 80.2707, address: 'Chennai Central, Tamil Nadu, India' },
      coimbatore: { lat: 11.0168, lng: 76.9558, address: 'Coimbatore, Tamil Nadu, India' },
      kovai: { lat: 11.0168, lng: 76.9558, address: 'Coimbatore, Tamil Nadu, India' },
      madurai: { lat: 9.9252, lng: 78.1198, address: 'Madurai, Tamil Nadu, India' },
      bengaluru: { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, Karnataka, India' },
      bangalore: { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, Karnataka, India' },
      salem: { lat: 11.6643, lng: 78.1460, address: 'Salem, Tamil Nadu, India' },
      tirunelveli: { lat: 8.7139, lng: 77.7567, address: 'Tirunelveli, Tamil Nadu, India' },
      vellore: { lat: 12.9165, lng: 79.1325, address: 'Vellore, Tamil Nadu, India' },
      puducherry: { lat: 11.9416, lng: 79.8083, address: 'Puducherry, India' },
      pondicherry: { lat: 11.9416, lng: 79.8083, address: 'Puducherry, India' },
    };

    for (const [key, coords] of Object.entries(majorCities)) {
      const reg = new RegExp(`(^|\\s|,)${key}($|\\s|,)`, 'i');
      if (reg.test(qClean)) {
        return coords;
      }
    }

    // 2. Direct exact or prefix match in preset landmarks
    const matched = landmarkOptions.find((lm) => {
      const lmName = lm.name.toLowerCase();
      return lmName === qClean || lmName.startsWith(qClean) || qClean.startsWith(lmName);
    });
    if (matched) {
      return {
        lat: matched.lat,
        lng: matched.lng,
        address: matched.address || matched.name,
      };
    }

    // 3. Query backend geocode endpoint (/api/geocode?address=...) which uses official Google Geocoding API with region=in
    try {
      const resp = await fetch(`/api/geocode?address=${encodeURIComponent(queryOrDescription)}`);
      if (resp.ok) {
        const geoData = await resp.json();
        if (geoData.success && geoData.lat && geoData.lng) {
          return {
            lat: Number(geoData.lat.toFixed(5)),
            lng: Number(geoData.lng.toFixed(5)),
            address: geoData.address || queryOrDescription,
          };
        }
      }
    } catch (e) {
      console.warn('Backend geocode fetch notice:', e);
    }

    // 4. Fallback: Google Maps client-side Geocoder if loaded
    if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const request: google.maps.GeocoderRequest = placeId
          ? { placeId }
          : { address: `${queryOrDescription}, India`, region: 'in', componentRestrictions: { country: 'IN' } };
        const res = await geocoder.geocode(request);
        if (res.results && res.results[0] && res.results[0].geometry) {
          const loc = res.results[0].geometry.location;
          return {
            lat: Number(loc.lat().toFixed(5)),
            lng: Number(loc.lng().toFixed(5)),
            address: res.results[0].formatted_address,
          };
        }
      } catch (err) {
        console.warn('Client geocoder error:', err);
      }
    }

    return null;
  };

  const handleSelectLocation = (loc: LocationPoint) => {
    if (type === 'origin') {
      setOriginPoint(loc);
    } else {
      setDestinationPoint(loc);
    }
    setInputValue(loc.name);
    setIsOpen(false);
    if (sessionTokenRef.current) {
      sessionTokenRef.current = null;
    }
  };

  const handleCustomTextSubmit = async () => {
    if (!inputValue.trim()) return;
    setIsResolvingLocation(true);
    const query = inputValue.trim();
    const resolved = await resolveLocationCoordinates(query);
    setIsResolvingLocation(false);

    if (resolved) {
      const elev = Math.max(
        12.0,
        Math.round((28 + Math.sin(resolved.lat * 10) * 8 + Math.cos(resolved.lng * 10) * 6) * 10) / 10
      );

      const customPoint: LocationPoint = {
        name: query,
        lat: resolved.lat,
        lng: resolved.lng,
        sourceType: 'custom_search',
        address: resolved.address,
        elevationMeters: elev,
      };
      handleSelectLocation(customPoint);
    }
  };

  const handleSelectSuggestion = async (sug: { description: string; placeId?: string }) => {
    setIsResolvingLocation(true);
    const resolved = await resolveLocationCoordinates(sug.description, sug.placeId);
    setIsResolvingLocation(false);

    if (resolved) {
      const elev = Math.max(
        12.0,
        Math.round((28 + Math.sin(resolved.lat * 10) * 8 + Math.cos(resolved.lng * 10) * 6) * 10) / 10
      );

      handleSelectLocation({
        name: sug.description,
        lat: resolved.lat,
        lng: resolved.lng,
        sourceType: 'custom_search',
        address: resolved.address || sug.description,
        elevationMeters: elev,
      });
    } else {
      // If direct resolution was inconclusive, keep name and attempt backend geocoding
      handleCustomTextSubmit();
    }
  };

  const handlePickOnMap = () => {
    if (isPickingThis) {
      setPickMode(null);
    } else {
      setPickMode(type);
      if (onFocusMap) onFocusMap();
    }
  };

  const handleGpsClick = async () => {
    setIsGpsLoading(true);
    await requestGpsLocation(type);
    setIsGpsLoading(false);
  };

  return (
    <div className="relative space-y-1.5" ref={dropdownRef}>
      {/* Label & Actions Bar */}
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
        <span className="flex items-center gap-1.5">
          {type === 'origin' ? (
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />
          ) : (
            <span className="text-emerald-600 font-black">🏁</span>
          )}
          {label}
        </span>

        {/* Quick GPS & Map Pick Buttons */}
        <div className="flex items-center gap-1">
          {type === 'origin' && (
            <button
              type="button"
              onClick={handleGpsClick}
              disabled={isGpsLoading}
              title="Use current device GPS location"
              className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold flex items-center gap-1 transition"
            >
              <Crosshair className={`w-3 h-3 ${isGpsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Use GPS</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePickOnMap}
            title={`Click on map to choose ${label}`}
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition border ${
              isPickingThis
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs animate-pulse ring-2 ring-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <MapPin className="w-3 h-3 text-current" />
            <span>{isPickingThis ? 'Click Map...' : 'Pick on Map'}</span>
          </button>
        </div>
      </div>

      {/* Main Input Control */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleCustomTextSubmit();
            }
          }}
          placeholder={placeholder}
          className={`w-full pl-9 pr-24 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-900 transition focus:outline-hidden focus:bg-white ${
            isPickingThis
              ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/30'
              : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
          }`}
        />

        {/* Elevation Pill / Clear inside input */}
        <div className="absolute right-2 flex items-center gap-1">
          {currentPoint.elevationMeters !== undefined && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 ${
                currentPoint.elevationMeters < 5
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : currentPoint.elevationMeters > 15
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
              title="Ground elevation relative to sea level"
            >
              <Mountain className="w-2.5 h-2.5" />
              {currentPoint.elevationMeters}m
            </span>
          )}

          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                setIsOpen(true);
              }}
              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-md transition"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Picking Notice Banner when Pick Mode is active */}
      {isPickingThis && (
        <div className="text-[11px] bg-amber-50 text-amber-900 border border-amber-300 rounded-lg px-2.5 py-1.5 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="font-semibold">Map picking active:</span> Click any road, intersection, or point on the map!
          </div>
          <button
            type="button"
            onClick={() => setPickMode(null)}
            className="text-amber-800 font-bold hover:underline text-[10px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Suggestion Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50">
          {/* Custom typed option if user entered new text */}
          {inputValue.trim() && inputValue !== currentPoint.name && (
            <div
              onClick={handleCustomTextSubmit}
              className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs bg-slate-50/60"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-bold text-slate-900">
                    Use custom location: "{inputValue.trim()}"
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Set this as your exact custom {label.toLowerCase()}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                Select
              </span>
            </div>
          )}

          {/* Resolving coordinates spinner indicator */}
          {isResolvingLocation && (
            <div className="p-3 text-center text-xs text-blue-600 font-bold flex items-center justify-center gap-2 bg-blue-50/70">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Locating coordinates on map...</span>
            </div>
          )}

          {/* Google Places API suggestions */}
          {placesSuggestions.length > 0 && (
            <div className="p-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Places & Addresses (Google Maps)
              </div>
              {placesSuggestions.map((sug, idx) => (
                <div
                  key={sug.placeId || idx}
                  onClick={() => handleSelectSuggestion(sug)}
                  className="px-2.5 py-2 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center gap-2 text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{sug.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Local High-Ground & Preset Locations */}
          <div className="p-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
              <span>Recommended Corridors & High-Ground Hubs</span>
              <span className="text-[9px] text-slate-400 font-normal">Elevation info</span>
            </div>
            {filteredLandmarks.map((loc) => {
              const isSelected = currentPoint.name === loc.name;
              return (
                <div
                  key={loc.id || loc.name}
                  onClick={() => handleSelectLocation(loc)}
                  className={`px-2.5 py-2 hover:bg-blue-50 rounded-lg cursor-pointer flex items-center justify-between text-xs transition ${
                    isSelected ? 'bg-blue-50/70 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin
                      className={`w-3.5 h-3.5 shrink-0 ${
                        loc.elevationMeters && loc.elevationMeters > 15
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    />
                    <div className="truncate">
                      <div className="text-slate-900 font-medium truncate">{loc.name}</div>
                      {loc.address && (
                        <div className="text-[10px] text-slate-500 truncate">{loc.address}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {loc.elevationMeters !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          loc.elevationMeters < 5
                            ? 'bg-rose-100 text-rose-700'
                            : loc.elevationMeters > 15
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        +{loc.elevationMeters}m
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
