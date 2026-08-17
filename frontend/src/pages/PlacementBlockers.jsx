import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  AlertOctagon, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  Sparkles,
  Code2,
  FileCheck,
  Cpu,
  RefreshCw,
  FolderGit2,
  FileText
} from 'lucide-react';

export const PlacementBlockers = ({ setCurrentView }) => {
  const [blockers, setBlockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlockers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/readiness/blockers');
      setBlockers(res.blockers || []);
    } catch (err) {
      console.error('Error fetching blockers:', err);
      setError(err.message || 'Failed to load placement blockers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockers();
  }, []);

  const handleResolveAction = (category) => {
    const catLower = category.toLowerCase();
    if (catLower.includes('coding') || catLower.includes('dsa')) {
      setCurrentView('coding');
    } else if (catLower.includes('tech') || catLower.includes('core')) {
      setCurrentView('verification');
    } else if (catLower.includes('interview')) {
      setCurrentView('mock');
    } else if (catLower.includes('project')) {
      setCurrentView('projects');
    } else if (catLower.includes('resume')) {
      setCurrentView('resume');
    } else {
      setCurrentView('mission');
    }
  };

  const getCategoryIcon = (category) => {
    const catLower = category.toLowerCase();
    if (catLower.includes('coding') || catLower.includes('dsa')) return <Code2 size={20} className="text-amber-500" />;
    if (catLower.includes('tech') || catLower.includes('core')) return <Cpu size={20} className="text-indigo-500" />;
    if (catLower.includes('interview')) return <FileCheck size={20} className="text-purple-500" />;
    if (catLower.includes('project')) return <FolderGit2 size={20} className="text-emerald-500" />;
    return <FileText size={20} className="text-blue-500" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 border border-red-500/20 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <AlertOctagon size={14} />
            AI Root Cause Diagnosis
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            What Is Blocking My Placement?
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            The AI Placement Engine analyzed your verified skills, mock scores, project depth, and resume to isolate the top root-cause bottlenecks preventing top-tier tech offers.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-2xl border border-border">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-3"></div>
          <p className="text-sm font-medium text-text-secondary">Analyzing skill profiles & placement risk patterns...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            onClick={fetchBlockers}
            className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2"
          >
            <RefreshCw size={14} /> Retry Diagnosis
          </button>
        </div>
      ) : blockers.length === 0 ? (
        <div className="p-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-lg font-bold text-text-primary">No Critical Blockers Detected!</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Your readiness score is solid across all core categories. Keep up the daily practice and run full placement simulations.
          </p>
          <button
            onClick={() => setCurrentView('simulator')}
            className="px-5 py-2.5 bg-secondary text-white rounded-xl text-xs font-bold shadow-md hover:bg-secondary/90 transition-colors"
          >
            Launch Placement Simulator
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-500" />
              Active Placement Blockers ({blockers.length})
            </h2>
            <span className="text-xs text-text-secondary">
              Ranked by Hiring Impact
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {blockers.map((blocker, index) => {
              const isCritical = blocker.impact === 'CRITICAL';
              const gap = blocker.required - blocker.current;

              return (
                <div
                  key={blocker.id || index}
                  className="bg-surface border border-border hover:border-primary/40 rounded-2xl p-5 sm:p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-background rounded-xl border border-border flex-shrink-0">
                        {getCategoryIcon(blocker.category)}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-text-secondary">
                            #{index + 1}
                          </span>
                          <h3 className="text-base font-bold text-text-primary">
                            {blocker.title}
                          </h3>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isCritical
                                ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            }`}
                          >
                            {blocker.impact} IMPACT
                          </span>
                        </div>

                        <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                          {blocker.reason}
                        </p>

                        <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-primary">
                          <Zap size={14} className="text-amber-500 flex-shrink-0" />
                          <span>Recommended Action: {blocker.action}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats and Action CTA */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center border-t lg:border-t-0 pt-3 lg:pt-0 border-border gap-3 min-w-[200px]">
                      <div className="text-left lg:text-right">
                        <div className="flex items-center lg:justify-end gap-2 text-xs">
                          <span className="text-text-secondary">Current:</span>
                          <span className="font-bold text-text-primary">{blocker.current}%</span>
                          <span className="text-text-secondary">/ Need:</span>
                          <span className="font-bold text-emerald-600">{blocker.required}%</span>
                        </div>
                        <div className="flex items-center lg:justify-end gap-1.5 text-[11px] text-text-secondary mt-0.5">
                          <Clock size={12} />
                          <span>~{blocker.estimatedDaysToClear} days to resolve</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleResolveAction(blocker.category)}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
                      >
                        Resolve Blocker Now
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementBlockers;
