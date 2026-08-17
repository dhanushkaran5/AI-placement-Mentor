import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Sparkles, 
  Target, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  Code2, 
  MessageSquareCode, 
  Trophy, 
  FileText,
  Calendar,
  CheckSquare,
  TrendingUp,
  Zap,
  Clock,
  Building2,
  AlertOctagon,
  Award,
  BookOpen,
  FolderGit2,
  Sliders,
  Activity
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const Dashboard = ({ setCurrentView }) => {
  const { profile, updateTarget } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [selectedOptionId, setSelectedOptionId] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchOptions();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await api.get('/company/options');
      setOptions(res);
      if (profile?.target_role && profile?.target_company) {
        const matchingId = res.find(
          o => o.role === profile.target_role && o.company === profile.target_company
        )?.id;
        if (matchingId) setSelectedOptionId(matchingId);
      }
    } catch (err) {
      console.error('Error fetching company options:', err);
    }
  };

  const handleTargetChange = async (e) => {
    const val = e.target.value;
    setSelectedOptionId(val);
    if (!val) return;
    const opt = options.find(o => o.id === Number(val));
    if (opt) {
      try {
        await updateTarget(opt.role, opt.company);
        await fetchDashboardData();
      } catch (err) {
        console.error('Failed to update target:', err);
      }
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const { 
    readiness, 
    risks, 
    radar, 
    dailyMission, 
    blockers, 
    commandCenterSummary, 
    primaryCompanyMatch, 
    matchedCompanies, 
    fastestLevers 
  } = data || {};
  
  const overallReadiness = readiness?.overallReadiness || 0;
  const contributions = readiness?.contributions || {};

  const categoryBreakdownData = [
    { name: 'Tech Core', pts: contributions.technical || 18, max: 25, key: 'technical' },
    { name: 'DSA/Code', pts: contributions.dsa || 14, max: 20, key: 'dsa' },
    { name: 'Mock Intv', pts: contributions.mockInterview || 11, max: 15, key: 'mockInterview' },
    { name: 'Resume', pts: contributions.resume || 10, max: 15, key: 'resume' },
    { name: 'Aptitude', pts: contributions.aptitude || 8, max: 10, key: 'aptitude' },
    { name: 'Projects', pts: contributions.projects || 8, max: 10, key: 'projects' },
    { name: 'Comm', pts: contributions.communication || 4, max: 5, key: 'communication' }
  ];

  return (
    <div className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-surface border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
            <Sparkles size={14} /> Personal Placement Command Center
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            Welcome back, {data?.profile?.name || 'Student'}!
          </h1>
          <p className="text-text-secondary text-xs sm:text-sm mt-1">
            Targeting <strong className="text-text-primary">{profile?.target_role || 'SDE'}</strong> at <strong className="text-text-primary">{profile?.target_company || 'TCS'}</strong>
          </p>
        </div>

        {/* Target Switcher */}
        <div className="flex items-center gap-2 bg-background p-2 rounded-xl border border-border">
          <Target className="text-primary" size={18} />
          <select
            value={selectedOptionId}
            onChange={handleTargetChange}
            className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer pr-2"
          >
            <option value="">Select Target Role / Company</option>
            {options.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.role} @ {opt.company}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 6-Question Strategic Command Center Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Where am I now? */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Where Am I Now?</span>
            <span className="text-xs font-extrabold text-primary px-2.5 py-0.5 bg-primary/10 rounded-full">
              {readiness?.riskLevel || 'Moderate'}
            </span>
          </div>
          <div className="text-3xl font-black text-text-primary">
            {overallReadiness} <span className="text-sm font-semibold text-text-secondary">/ 100</span>
          </div>
          <p className="text-xs text-text-secondary">
            Weighted placement readiness across 7 core evaluation pillars.
          </p>
          <button
            onClick={() => setCurrentView && setCurrentView('readiness')}
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 pt-1"
          >
            Explain My Score <ArrowRight size={12} />
          </button>
        </div>

        {/* 2. What is preventing me? */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Top Blocker</span>
            <span className="text-xs font-extrabold text-red-600 px-2 py-0.5 bg-red-500/10 rounded-full">
              {blockers?.[0]?.impact || 'HIGH'} IMPACT
            </span>
          </div>
          <div className="text-sm font-bold text-text-primary truncate">
            {blockers?.[0]?.title || 'DSA & Coding Proficiency'}
          </div>
          <p className="text-xs text-text-secondary line-clamp-2">
            {blockers?.[0]?.reason || 'Problem solving accuracy needs focused practice.'}
          </p>
          <button
            onClick={() => setCurrentView && setCurrentView('blockers')}
            className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1 pt-1"
          >
            Diagnose All Blockers <ArrowRight size={12} />
          </button>
        </div>

        {/* 3. What should I practice today? */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Today's Practice</span>
            <span className="text-xs font-extrabold text-secondary px-2 py-0.5 bg-secondary/10 rounded-full">
              {dailyMission?.completedPercentage || 0}% Done
            </span>
          </div>
          <div className="text-sm font-bold text-text-primary">
            {dailyMission?.tasks?.[0]?.title || 'Solve 2 Binary Tree & Queue Coding Problems'}
          </div>
          <p className="text-xs text-text-secondary">
            Estimated total study time: <strong>90 mins</strong>
          </p>
          <button
            onClick={() => setCurrentView && setCurrentView('mission')}
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 pt-1"
          >
            Open Daily Mission <ArrowRight size={12} />
          </button>
        </div>

        {/* 4. Which companies can I target? */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Target Match</span>
            <span className="text-xs font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full">
              {primaryCompanyMatch?.matchPercentage || 74}% Match
            </span>
          </div>
          <div className="text-sm font-bold text-text-primary">
            {primaryCompanyMatch?.company || 'TCS'} ({primaryCompanyMatch?.status || 'Strong Match'})
          </div>
          <p className="text-xs text-text-secondary">
            Also matching: {matchedCompanies?.slice(0, 2).map(c => c.name).join(', ')}
          </p>
          <button
            onClick={() => setCurrentView && setCurrentView('matcher')}
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 pt-1"
          >
            Company Match Engine <ArrowRight size={12} />
          </button>
        </div>

        {/* 5. How long will it take? */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Timeline to Ready</span>
            <Clock size={15} className="text-text-secondary" />
          </div>
          <div className="text-xl font-extrabold text-text-primary">
            {commandCenterSummary?.timelineEstimate || '~3-4 Weeks'}
          </div>
          <p className="text-xs text-text-secondary">
            Based on {data?.profile?.daily_hours || 4} hours daily commitment to reach 85%+ readiness.
          </p>
          <button
            onClick={() => setCurrentView && setCurrentView('roadmap')}
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 pt-1"
          >
            View Adaptive Roadmap <ArrowRight size={12} />
          </button>
        </div>

        {/* 6. What increases score fastest? */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Fastest Lever</span>
            <Zap size={15} className="text-amber-500" />
          </div>
          <div className="text-sm font-bold text-text-primary truncate">
            {fastestLevers?.[0]?.suggestion || 'Improve DSA & Trees (+7 pts)'}
          </div>
          <p className="text-xs text-text-secondary">
            Highest return-on-effort practice item this week.
          </p>
          <button
            onClick={() => setCurrentView && setCurrentView('whatif')}
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 pt-1"
          >
            Run What-If Simulator <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Readiness Points Breakdown & Explainability */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-text-primary">Placement Readiness Point Attribution</h3>
            <p className="text-xs text-text-secondary">How your <strong>{overallReadiness}/100</strong> readiness score is calculated across categories:</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
            Total Points: {overallReadiness} / 100
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {categoryBreakdownData.map((cat, i) => (
            <div key={i} className="p-3 bg-background rounded-xl border border-border text-center space-y-1">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">{cat.name}</span>
              <div className="text-lg font-extrabold text-primary">+{cat.pts}</div>
              <span className="text-[10px] text-text-secondary">Max: {cat.max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Radar Chart & Fastest Score Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Skill Radar Chart */}
        <div className="lg:col-span-7 bg-surface border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary">Multi-Dimensional Skill Radar</h3>
            <span className="text-xs text-text-secondary">Evaluated across 9 dimensions</span>
          </div>

          <div className="h-72">
            {radar && radar.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Radar name="Score" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Fastest Score Increase Levers */}
        <div className="lg:col-span-5 bg-surface border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
              <Zap className="text-amber-500" size={18} />
              Fastest Score Boosters
            </h3>
            <span className="text-[11px] font-semibold text-text-secondary">High ROI</span>
          </div>

          <div className="space-y-3">
            {fastestLevers?.map((lever, idx) => (
              <div key={idx} className="p-3.5 bg-background rounded-xl border border-border space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-primary">{lever.category}</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    +{lever.potentialGain} Pts
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{lever.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Tool Launch Matrix */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Placement Suite Quick Launch</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'blockers', label: 'Placement Blockers', icon: AlertOctagon, desc: 'Root Cause Diagnosis' },
            { id: 'resume-jd', label: 'Resume ↔ JD Match', icon: FileText, desc: 'ATS Keyword Matcher' },
            { id: 'project-defense', label: 'Project Defense', icon: FolderGit2, desc: 'Simulate Round 2 Defense' },
            { id: 'whatif', label: 'What-If Simulator', icon: Sliders, desc: 'Strategy ROI Calculator' },
            { id: 'coding', label: 'Coding Lab', icon: Code2, desc: 'Topic Weakness Profiler' },
            { id: 'mock', label: 'Mock Interview', icon: MessageSquareCode, desc: 'Weakness Memory Tracker' },
            { id: 'companies', label: '30+ Company Intel', icon: Building2, desc: 'Hiring Patterns & Drives' },
            { id: 'simulator', label: 'Placement Simulator', icon: Trophy, desc: 'Full Company Drives' }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView && setCurrentView(item.id)}
                className="p-4 sm:p-5 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all text-left space-y-2 group shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Icon size={20} />
                </div>
                <div className="text-sm font-bold text-text-primary">{item.label}</div>
                <div className="text-xs text-text-secondary">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
