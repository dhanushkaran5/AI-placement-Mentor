import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import AuthScreen from './pages/AuthScreen';

// Helper for resilient dynamic chunk loading (handles stale deployment chunks gracefully)
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasBeenRefreshed = JSON.parse(
      window.sessionStorage.getItem('chunk_reload_retry') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('chunk_reload_retry', 'false');
      return component;
    } catch (error) {
      console.error('Dynamic import chunk load error:', error);
      if (!pageHasBeenRefreshed) {
        window.sessionStorage.setItem('chunk_reload_retry', 'true');
        window.location.reload();
      }
      throw error;
    }
  });

// Lazy-loaded Views with Retry Resilience
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const ResumeUpload = lazyWithRetry(() => import('./pages/ResumeUpload'));
const SkillGap = lazyWithRetry(() => import('./pages/SkillGap'));
const Roadmap = lazyWithRetry(() => import('./pages/Roadmap'));
const CompanyInsights = lazyWithRetry(() => import('./pages/CompanyInsights'));
const MockInterview = lazyWithRetry(() => import('./pages/MockInterview'));
const Progress = lazyWithRetry(() => import('./pages/Progress'));
const SkillVerification = lazyWithRetry(() => import('./pages/SkillVerification'));
const CodingLab = lazyWithRetry(() => import('./pages/CodingLab'));
const PlacementSimulator = lazyWithRetry(() => import('./pages/PlacementSimulator'));
const DailyMission = lazyWithRetry(() => import('./pages/DailyMission'));
const ProjectAnalyzer = lazyWithRetry(() => import('./pages/ProjectAnalyzer'));
const RiskAnalyzer = lazyWithRetry(() => import('./pages/RiskAnalyzer'));
const WhatIfSimulator = lazyWithRetry(() => import('./pages/WhatIfSimulator'));
const CompanyMatcher = lazyWithRetry(() => import('./pages/CompanyMatcher'));
const ReadinessIndex = lazyWithRetry(() => import('./pages/ReadinessIndex'));
const PlacementBlockers = lazyWithRetry(() => import('./pages/PlacementBlockers'));
const ResumeJdMatcher = lazyWithRetry(() => import('./pages/ResumeJdMatcher'));
const ProjectDefense = lazyWithRetry(() => import('./pages/ProjectDefense'));
const CompanyDiscovery = lazyWithRetry(() => import('./pages/CompanyDiscovery'));
const CompanyProfile = lazyWithRetry(() => import('./pages/CompanyProfile'));
const CompanyComparison = lazyWithRetry(() => import('./pages/CompanyComparison'));
const PlacementOpportunities = lazyWithRetry(() => import('./pages/PlacementOpportunities'));
const CompanyAdmin = lazyWithRetry(() => import('./pages/CompanyAdmin'));

// Loading Fallback Component
const ViewLoadingFallback = () => (
  <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center space-y-3 p-8">
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
    <p className="text-xs font-bold text-text-secondary">Loading view...</p>
  </div>
);

function MainAppContent() {
  const { token, loading } = useAuth();
  
  // Read initial view from URL hash if present
  const getInitialView = () => {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    return hash || 'dashboard';
  };

  const [currentView, setCurrentView] = useState(getInitialView);
  const [selectedCompanyId, setSelectedCompanyId] = useState('tcs');
  const [compareList, setCompareList] = useState([]);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Sync state with URL hash
  useEffect(() => {
    if (token) {
      window.location.hash = currentView;
    }
  }, [currentView, token]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash && hash !== currentView) {
        setCurrentView(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
        <p className="text-xs font-semibold text-text-secondary">Initializing AI Placement Operating System...</p>
      </div>
    );
  }

  if (!token) {
    return <AuthScreen />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard setCurrentView={setCurrentView} />;
      case 'blockers':
        return <PlacementBlockers setCurrentView={setCurrentView} />;
      case 'readiness':
        return <ReadinessIndex setCurrentView={setCurrentView} />;
      case 'companies':
        return (
          <CompanyDiscovery
            setCurrentView={setCurrentView}
            setSelectedCompanyId={setSelectedCompanyId}
            compareList={compareList}
            setCompareList={setCompareList}
          />
        );
      case 'company-profile':
        return <CompanyProfile companyId={selectedCompanyId} setCurrentView={setCurrentView} />;
      case 'compare':
        return (
          <CompanyComparison
            compareList={compareList}
            setCompareList={setCompareList}
            setCurrentView={setCurrentView}
            setSelectedCompanyId={setSelectedCompanyId}
          />
        );
      case 'matrix':
        return <PlacementOpportunities setCurrentView={setCurrentView} setSelectedCompanyId={setSelectedCompanyId} />;
      case 'admin-companies':
        return <CompanyAdmin setCurrentView={setCurrentView} />;
      case 'resume':
        return <ResumeUpload setCurrentView={setCurrentView} />;
      case 'resume-jd':
        return <ResumeJdMatcher setCurrentView={setCurrentView} />;
      case 'verification':
        return <SkillVerification setCurrentView={setCurrentView} />;
      case 'skills':
        return <SkillGap setCurrentView={setCurrentView} />;
      case 'roadmap':
        return <Roadmap />;
      case 'mission':
        return <DailyMission setCurrentView={setCurrentView} />;
      case 'coding':
        return <CodingLab setCurrentView={setCurrentView} />;
      case 'mock':
        return <MockInterview />;
      case 'project-defense':
        return <ProjectDefense setCurrentView={setCurrentView} />;
      case 'projects':
        return <ProjectAnalyzer setCurrentView={setCurrentView} />;
      case 'simulator':
        return <PlacementSimulator setCurrentView={setCurrentView} />;
      case 'matcher':
        return <CompanyMatcher setCurrentView={setCurrentView} />;
      case 'risks':
        return <RiskAnalyzer setCurrentView={setCurrentView} />;
      case 'whatif':
        return <WhatIfSimulator />;
      case 'insights':
        return <CompanyInsights />;
      case 'progress':
        return <Progress />;
      default:
        return <Dashboard setCurrentView={setCurrentView} />;
    }
  };

  return (
    <DashboardLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      isDiagnosticsOpen={isDiagnosticsOpen}
      setIsDiagnosticsOpen={setIsDiagnosticsOpen}
    >
      <Suspense fallback={<ViewLoadingFallback />}>
        {renderView()}
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
