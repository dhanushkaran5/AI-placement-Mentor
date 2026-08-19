import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatPanel from '../components/ChatPanel';
import SystemHealthModal from '../components/SystemHealthModal';
import { Menu, GraduationCap, Sparkles, Activity } from 'lucide-react';

export const DashboardLayout = ({
  currentView,
  setCurrentView,
  isDiagnosticsOpen,
  setIsDiagnosticsOpen,
  children
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row bg-background min-h-screen">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-surface border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 -ml-1 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors cursor-pointer"
            title="Open Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary flex items-center justify-center rounded-lg text-white shadow-xs">
              <GraduationCap size={16} />
            </div>
            <span className="font-extrabold text-sm text-text-primary tracking-tight">Placement Mentor</span>
          </div>
        </div>

        <button
          onClick={() => setIsDiagnosticsOpen(true)}
          title="System Diagnostics"
          className="p-1.5 text-text-secondary hover:text-primary hover:bg-background rounded-lg border border-border/60 transition-colors"
        >
          <Activity size={16} />
        </button>
      </header>

      {/* Left Sidebar Navigation (Desktop & Mobile Drawer) */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Workspace Main Panel */}
      <main className="flex-1 min-w-0 overflow-y-auto relative">
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
