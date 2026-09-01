import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Flame,
  Hospital,
  LifeBuoy,
  Phone,
  PhoneCall,
  ShieldAlert,
  Waves,
  X,
} from 'lucide-react';
import { useHydro } from '../context/HydroContext';

interface EmergencySOSModalProps {
  onClose: () => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({ onClose }) => {
  const { emergencyResources, setCurrentPage } = useHydro();

  return (
    <div
      id="emergency-sos-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="emergency-sos-card"
        className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-xl w-full overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-800 flex items-center justify-center text-white">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Disaster Emergency Assistance</h3>
              <p className="text-xs text-rose-100">Immediate 24/7 Urban Rescue & Relief Directory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-rose-800/80 text-rose-200 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Critical Flood Safety Rules */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-900 uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Life-Saving Flood Safety Protocol
            </div>
            <ul className="text-xs text-rose-800 space-y-1.5 list-disc list-inside">
              <li>
                <strong>Turn Around, Don't Drown:</strong> Just 15 cm of rushing water can knock you down, and 30 cm can carry away most cars.
              </li>
              <li>
                <strong>Avoid Low-Lying Underpasses:</strong> Never enter dips, tunnels, or flooded depressions where water depth is hidden.
              </li>
              <li>
                <strong>Stay on Elevated Corridors:</strong> Utilize Skyline Flyover & Highland Ridges marked in green on HydroNav.
              </li>
            </ul>
          </div>

          {/* Quick Dial Emergency Numbers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Direct Emergency Contacts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href="tel:911"
                className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between hover:bg-slate-800 transition"
              >
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Immediate Life Threat</div>
                  <div className="text-base font-extrabold text-white">Emergency Services: 911</div>
                </div>
                <Phone className="w-4 h-4 text-rose-400" />
              </a>

              <a
                href="tel:18005550199"
                className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl flex items-center justify-between hover:bg-blue-100 transition"
              >
                <div>
                  <div className="text-[10px] uppercase text-blue-700 font-bold">Flood Rescue Hotline</div>
                  <div className="text-sm font-bold text-blue-950">1-800-555-0199</div>
                </div>
                <LifeBuoy className="w-4 h-4 text-blue-600" />
              </a>

              <a
                href="tel:18005553473"
                className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center justify-between hover:bg-amber-100 transition"
              >
                <div>
                  <div className="text-[10px] uppercase text-amber-700 font-bold">Water Rescue & Boats</div>
                  <div className="text-sm font-bold text-amber-950">1-800-555-FIRE</div>
                </div>
                <Flame className="w-4 h-4 text-amber-600" />
              </a>

              <a
                href="tel:18005559911"
                className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between hover:bg-emerald-100 transition"
              >
                <div>
                  <div className="text-[10px] uppercase text-emerald-700 font-bold">Hospital Dispatch</div>
                  <div className="text-sm font-bold text-emerald-950">1-800-555-MED1</div>
                </div>
                <Hospital className="w-4 h-4 text-emerald-600" />
              </a>
            </div>
          </div>

          {/* Nearest Active Shelters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Verified Open Evacuation Centers
              </h4>
              <button
                onClick={() => {
                  onClose();
                  setCurrentPage('dashboard');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View on Dashboard &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {emergencyResources.slice(0, 3).map((res) => (
                <div
                  key={res.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      {res.type === 'shelter' ? '⛺' : res.type === 'hospital' ? '🏥' : '🚒'}
                      {res.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {res.address} &bull; Capacity: {res.capacityTotal - res.capacityUsed} slots left
                    </div>
                  </div>
                  <a
                    href={`tel:${res.contactNumber}`}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    title={`Call ${res.contactNumber}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Close Emergency Panel
          </button>
        </div>
      </div>
    </div>
  );
};
