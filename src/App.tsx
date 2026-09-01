import React, { useState } from 'react';
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

const AppContent: React.FC = () => {
  const { currentPage, selectedRoad, setSelectedRoad } = useHydro();
  const [showRiskExplainer, setShowRiskExplainer] = useState(false);
  const [showEmergencySOS, setShowEmergencySOS] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden select-none selection:bg-blue-600 selection:text-white">
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
  );
};

export default function App() {
  return (
    <HydroProvider>
      <AppContent />
    </HydroProvider>
  );
}
