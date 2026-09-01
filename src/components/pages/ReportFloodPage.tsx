import React, { useState } from 'react';
import { useHydro } from '../../context/HydroContext';
import { WaterLevel } from '../../types';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Droplets,
  FileImage,
  Flame,
  Info,
  MapPin,
  Navigation,
  Send,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Waves,
  X,
  Zap,
} from 'lucide-react';

const PHOTO_PRESETS = [
  {
    id: 'photo-1',
    label: 'Submerged Road & Floating Cars',
    url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
    depth: 65,
    level: 'high' as WaterLevel,
    isBlocked: true,
  },
  {
    id: 'photo-2',
    label: 'River Embankment Overflow',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
    depth: 35,
    level: 'medium' as WaterLevel,
    isBlocked: false,
  },
  {
    id: 'photo-3',
    label: 'Drainage Clogged with Runoff',
    url: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=600&q=80',
    depth: 45,
    level: 'high' as WaterLevel,
    isBlocked: false,
  },
  {
    id: 'photo-4',
    label: 'Minor Curb Puddle & Splash',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80',
    depth: 10,
    level: 'low' as WaterLevel,
    isBlocked: false,
  },
];

export const ReportFloodPage: React.FC = () => {
  const {
    roads,
    submitFloodReport,
    setCurrentPage,
    lastReportFeedback,
    clearReportFeedback,
  } = useHydro();

  const [selectedRoadId, setSelectedRoadId] = useState<string>(roads[0]?.id || 'rd-1');
  const [locationDescription, setLocationDescription] = useState<string>('');
  const [waterLevel, setWaterLevel] = useState<WaterLevel>('high');
  const [isBlocked, setIsBlocked] = useState<boolean>(true);
  const [waterDepthCm, setWaterDepthCm] = useState<number>(60);
  const [photoUrl, setPhotoUrl] = useState<string>(PHOTO_PRESETS[0].url);
  const [notes, setNotes] = useState<string>('Heavy water accumulation. Water level touching car bumpers.');
  const [reporterName, setReporterName] = useState<string>('Citizen Volunteer');
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [lastSubmittedRoadName, setLastSubmittedRoadName] = useState<string>('');

  const targetRoad = roads.find((r) => r.id === selectedRoadId) || roads[0];

  const handleSelectPresetPhoto = (preset: typeof PHOTO_PRESETS[0]) => {
    setPhotoUrl(preset.url);
    setWaterLevel(preset.level);
    setIsBlocked(preset.isBlocked);
    setWaterDepthCm(preset.depth);
  };

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = submitFloodReport({
      roadId: selectedRoadId,
      roadName: targetRoad.name,
      locationDescription: locationDescription || `${targetRoad.name} corridor near ${targetRoad.fromLocation}`,
      waterLevel,
      isBlocked,
      waterDepthCm,
      photoUrl,
      notes,
      reporterName: reporterName || 'Verified Citizen',
    });

    if (result.success) {
      setLastSubmittedRoadName(targetRoad.name);
      setSubmittedSuccess(true);
    }
  };

  return (
    <div id="hydro-report-flood-page" className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-200">
      {/* PAGE HEADER */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5" />
          Citizen Ground-Truth Telemetry
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Report Urban Flood Hazard
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Your live submission immediately updates HydroNav&apos;s city risk engine, adjusts flood safety maps, and reroutes traffic around submerged roads.
        </p>
      </div>

      {/* POST-SUBMISSION SUCCESS BANNER & LIVE REACTION */}
      {submittedSuccess && (
        <div
          id="report-success-banner"
          className="p-6 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl shadow-2xl border-2 border-emerald-400 space-y-4 animate-in zoom-in-95 duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                ✓
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">
                  Report Verified &amp; Broadcasted
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  Risk Data Updated for {lastSubmittedRoadName}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSubmittedSuccess(false)}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="text-slate-300 font-medium">
              ★ <strong>Live System Reaction:</strong>
            </div>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              <li>
                Road status escalated to <strong className="text-rose-400 font-bold uppercase">{waterLevel} Hazard (High Risk)</strong>.
              </li>
              <li>
                Disaster Dashboard metrics recalculated with new citizen report.
              </li>
              <li>
                Safe Route Engine rerouted all nearby vehicles to the{' '}
                <strong className="text-emerald-400">Skyline Elevated Flyover</strong> bypass.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              id="view-recalculated-route-btn"
              onClick={() => setCurrentPage('safe-route')}
              className="flex-1 py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              <Navigation className="w-4 h-4 text-slate-950" />
              View Recalculated Safe Route (Skyline Bypass) &rarr;
            </button>

            <button
              id="view-updated-dashboard-btn"
              onClick={() => setCurrentPage('dashboard')}
              className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
            >
              Check Disaster Dashboard
            </button>
          </div>
        </div>
      )}

      {/* REPORT FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6"
      >
        {/* Step 1: Location Input */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600" />
            1. Select Flooded Road / Corridor
          </label>
          <select
            id="report-road-select"
            value={selectedRoadId}
            onChange={(e) => setSelectedRoadId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          >
            {roads.map((road) => (
              <option key={road.id} value={road.id}>
                {road.code} - {road.name} (Current Risk: {road.riskScore}/100, {road.riskLevel.toUpperCase()})
              </option>
            ))}
          </select>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Specific Landmark or Cross-Street (Optional)
            </label>
            <input
              id="report-landmark-input"
              type="text"
              placeholder="e.g. Near 5th Ave underpass, near Mile Marker 4, in front of Metro station"
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Step 2: Water Level Selector (Low / Medium / High) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-600" />
            2. Observed Water Depth Level
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Low Water Level */}
            <div
              id="water-level-low-card"
              onClick={() => {
                setWaterLevel('low');
                setWaterDepthCm(10);
                setIsBlocked(false);
              }}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-1.5 ${
                waterLevel === 'low'
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold text-xs">
                Low
              </div>
              <div className="font-extrabold text-sm text-slate-900">Ankle / Curb Depth</div>
              <p className="text-[11px] text-slate-500 leading-tight">
                &lt; 15 cm. Minor gutter overflow. Passable by all passenger cars.
              </p>
            </div>

            {/* Medium Water Level */}
            <div
              id="water-level-medium-card"
              onClick={() => {
                setWaterLevel('medium');
                setWaterDepthCm(35);
              }}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-1.5 ${
                waterLevel === 'medium'
                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center font-bold text-xs">
                Med
              </div>
              <div className="font-extrabold text-sm text-slate-900">Wheel Hub Depth</div>
              <p className="text-[11px] text-slate-500 leading-tight">
                15 - 40 cm. Sedans scrape water. SUVs proceed with caution.
              </p>
            </div>

            {/* High Water Level */}
            <div
              id="water-level-high-card"
              onClick={() => {
                setWaterLevel('high');
                setWaterDepthCm(65);
                setIsBlocked(true);
              }}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-1.5 ${
                waterLevel === 'high'
                  ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-600/20 shadow-md'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center font-bold text-xs">
                High
              </div>
              <div className="font-extrabold text-sm text-rose-950">Waist / Engine Deep</div>
              <p className="text-[11px] text-rose-700 leading-tight font-medium">
                &gt; 40 cm. Extreme hazard! Vehicle flotation danger. Road impassable.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Road Blocked Toggle (Yes / No) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            3. Is the Road Completely Blocked?
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="road-blocked-no-btn"
              onClick={() => setIsBlocked(false)}
              className={`py-3 px-4 rounded-xl border-2 font-extrabold text-sm transition flex items-center justify-center gap-2 ${
                !isBlocked
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              NO (Passable with Caution)
            </button>

            <button
              type="button"
              id="road-blocked-yes-btn"
              onClick={() => setIsBlocked(true)}
              className={`py-3 px-4 rounded-xl border-2 font-extrabold text-sm transition flex items-center justify-center gap-2 ${
                isBlocked
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
              YES (Road Blocked / Submerged)
            </button>
          </div>
        </div>

        {/* Step 4: Photo Upload & Visual Proof */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              4. Photo Evidence &amp; Visual Verification
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Optional / Test Presets Available</span>
          </label>

          {/* Quick Realistic Photo Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PHOTO_PRESETS.map((preset) => {
              const isSelected = photoUrl === preset.url;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPresetPhoto(preset)}
                  className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition group aspect-video ${
                    isSelected ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-1.5">
                    <span className="text-[10px] text-white font-bold truncate leading-tight">
                      {preset.label}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom File Upload Input */}
          <div className="flex items-center gap-3 pt-1">
            <label className="cursor-pointer py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload Custom Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomPhotoUpload}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-slate-400">JPG, PNG up to 10MB</span>
          </div>
        </div>

        {/* Step 5: Notes & Citizen Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Your Name / Handle
            </label>
            <input
              id="reporter-name-input"
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Volunteer Driver #12"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Estimated Water Depth (cm)
            </label>
            <input
              id="water-depth-cm-input"
              type="number"
              min={0}
              max={250}
              value={waterDepthCm}
              onChange={(e) => setWaterDepthCm(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Hazard Description &amp; Notes
          </label>
          <textarea
            id="report-notes-textarea"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            placeholder="Describe stalled vehicles, open storm grates, swift current..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="submit-flood-report-btn"
          className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base transition-all shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          Submit Flood Report &amp; Recalculate City Safe Routes
        </button>
      </form>
    </div>
  );
};
