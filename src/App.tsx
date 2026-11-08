import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { HydroProvider, useHydro } from './context/HydroContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomePage } from './components/pages/HomePage';
import { SafeRoutePage } from './components/pages/SafeRoutePage';
import { ReportFloodPage } from './components/pages/ReportFloodPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { RoadDetailModal } from './components/RoadDetailModal';
import { RiskEngineExplainer } from './components/RiskEngineExplainer';
import { EmergencySOSModal } from './components/EmergencySOSModal';

const ENV_GOOGLE_MAPS_API_KEY =
  ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) || '';

const AppContent: React.FC = () => {
  const { currentPage, selectedRoad, setSelectedRoad } = useHydro();
  const [showRiskExplainer, setShowRiskExplainer] = useState(false);
  const [showEmergencySOS, setShowEmergencySOS] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden select-none selection:bg-blue-600 selection:text-white flex-col">
      {/* Sticky Google Maps Quota Warning Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-1.5">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <div className="flex flex-1 w-full overflow-hidden">
        {/* Dark Slate Left Sidebar */}

      <Sidebar
        onOpenRiskExplainer={() => setShowRiskExplainer(true)}
        onOpenEmergencySOS={() => setShowEmergencySOS(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Backdrop for mobile drawer */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Workspace Area (Top Header + Scrollable Main Content) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenRiskExplainer={() => setShowRiskExplainer(true)}
          onOpenEmergencySOS={() => setShowEmergencySOS(true)}
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto w-full">
            {currentPage === 'dashboard' && (
              <DashboardPage
                onOpenRiskExplainer={() => setShowRiskExplainer(true)}
                onOpenEmergencySOS={() => setShowEmergencySOS(true)}
              />
            )}
            {currentPage === 'safe-route' && <SafeRoutePage />}
            {currentPage === 'report-flood' && <ReportFloodPage />}
            {currentPage === 'home' && (
              <HomePage onOpenRiskExplainer={() => setShowRiskExplainer(true)} />
            )}
          </div>
        </main>
      </div>

      {/* Road Inspector Modal */}
      {selectedRoad && (
        <RoadDetailModal road={selectedRoad} onClose={() => setSelectedRoad(null)} />
      )}

      {/* Risk Engine Formula Inspector Modal */}
      {showRiskExplainer && (
        <RiskEngineExplainer onClose={() => setShowRiskExplainer(false)} />
      )}

      {/* Emergency SOS Modal */}
      {showEmergencySOS && (
        <EmergencySOSModal onClose={() => setShowEmergencySOS(false)} />
      )}
      </div>
    </div>
  );
};

export default function App() {
  const [apiKey, setApiKey] = useState<string>(ENV_GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    if (!apiKey) {
      fetch('/api/config')
        .then((res) => res.json())
        .then((data) => {
          if (data?.googleMapsApiKey) {
            setApiKey(data.googleMapsApiKey);
          }
        })
        .catch(() => {});
    }
  }, [apiKey]);

  return (
    <APIProvider
      apiKey={apiKey}
      libraries={['places', 'geometry', 'marker']}
      language="en"
      region="US"
    >
      <HydroProvider>
        <AppContent />
      </HydroProvider>
    </APIProvider>
  );
}
