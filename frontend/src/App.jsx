import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

// Page Views
import AuthScreen from './pages/AuthScreen';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import SkillGap from './pages/SkillGap';
import Roadmap from './pages/Roadmap';
import CompanyInsights from './pages/CompanyInsights';
import MockInterview from './pages/MockInterview';
import Progress from './pages/Progress';
import SkillVerification from './pages/SkillVerification';
import CodingLab from './pages/CodingLab';
import PlacementSimulator from './pages/PlacementSimulator';
import DailyMission from './pages/DailyMission';
import ProjectAnalyzer from './pages/ProjectAnalyzer';
import RiskAnalyzer from './pages/RiskAnalyzer';
import WhatIfSimulator from './pages/WhatIfSimulator';
import CompanyMatcher from './pages/CompanyMatcher';
import ReadinessIndex from './pages/ReadinessIndex';
import PlacementBlockers from './pages/PlacementBlockers';
import ResumeJdMatcher from './pages/ResumeJdMatcher';
import ProjectDefense from './pages/ProjectDefense';
import CompanyDiscovery from './pages/CompanyDiscovery';
import CompanyProfile from './pages/CompanyProfile';
import CompanyComparison from './pages/CompanyComparison';
import PlacementOpportunities from './pages/PlacementOpportunities';
import CompanyAdmin from './pages/CompanyAdmin';

function MainAppContent() {
  const { token, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState('tcs');
  const [compareList, setCompareList] = useState([]);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

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
      {renderView()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
