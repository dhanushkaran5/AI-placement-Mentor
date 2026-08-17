import React from 'react';
import Sidebar from '../components/Sidebar';
import ChatPanel from '../components/ChatPanel';
import SystemHealthModal from '../components/SystemHealthModal';

export const DashboardLayout = ({
  currentView,
  setCurrentView,
  isDiagnosticsOpen,
  setIsDiagnosticsOpen,
  children
}) => {
  return (
    <div className="flex bg-background min-h-screen">
      {/* Left Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      {/* Workspace Main Panel */}
      <main className="flex-1 min-w-0 overflow-hidden relative">
        {children}
      </main>

      {/* Floating AI Mentor Chat Panel */}
      <ChatPanel />

      {/* Developer & Student System Health Modal */}
      <SystemHealthModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;
