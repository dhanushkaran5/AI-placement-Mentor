import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded Views for Fast Initial Load and Optimized Route Code-Splitting
const AuthScreen = lazy(() => import('./pages/AuthScreen'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ResumeUpload = lazy(() => import('./pages/ResumeUpload'));
const SkillGap = lazy(() => import('./pages/SkillGap'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const CompanyInsights = lazy(() => import('./pages/CompanyInsights'));
const MockInterview = lazy(() => import('./pages/MockInterview'));
const Progress = lazy(() => import('./pages/Progress'));
const SkillVerification = lazy(() => import('./pages/SkillVerification'));
const CodingLab = lazy(() => import('./pages/CodingLab'));
const PlacementSimulator = lazy(() => import('./pages/PlacementSimulator'));
const DailyMission = lazy(() => import('./pages/DailyMission'));
const ProjectAnalyzer = lazy(() => import('./pages/ProjectAnalyzer'));
const RiskAnalyzer = lazy(() => import('./pages/RiskAnalyzer'));
const WhatIfSimulator = lazy(() => import('./pages/WhatIfSimulator'));
const CompanyMatcher = lazy(() => import('./pages/CompanyMatcher'));
const ReadinessIndex = lazy(() => import('./pages/ReadinessIndex'));
const PlacementBlockers = lazy(() => import('./pages/PlacementBlockers'));
const ResumeJdMatcher = lazy(() => import('./pages/ResumeJdMatcher'));
const ProjectDefense = lazy(() => import('./pages/ProjectDefense'));
const CompanyDiscovery = lazy(() => import('./pages/CompanyDiscovery'));
const CompanyProfile = lazy(() => import('./pages/CompanyProfile'));
const CompanyComparison = lazy(() => import('./pages/CompanyComparison'));
const PlacementOpportunities = lazy(() => import('./pages/PlacementOpportunities'));
const CompanyAdmin = lazy(() => import('./pages/CompanyAdmin'));

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
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <AuthScreen />
      </Suspense>
    );
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
