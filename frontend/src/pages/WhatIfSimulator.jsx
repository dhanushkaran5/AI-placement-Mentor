import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Calculator, 
  ArrowRight, 
  RefreshCw, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  Award, 
  Clock, 
  Sliders 
} from 'lucide-react';

export default function WhatIfSimulator() {
  const [scores, setScores] = useState({
    dsa: 75,
    technical: 80,
    mockInterview: 75,
    resume: 85,
    aptitude: 70,
    projects: 85,
    communication: 75
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial calculation on load
    handleSimulate();
  }, []);

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/readiness/whatif', scores);
      setResult(data);
    } catch (e) {
      console.error('What-If simulation error:', e);
      setError(e.message || 'Failed to calculate What-If simulation.');
    } finally {
      setLoading(false);
    }
  };

  const sliderConfig = [
    { key: 'dsa', label: 'DSA & Coding Score', weight: '20%', desc: 'Problem solving speed & algorithmic correctness' },
    { key: 'technical', label: 'Technical Core Knowledge', weight: '25%', desc: 'OOP, Java, DBMS, SQL, and Architecture' },
    { key: 'mockInterview', label: 'Technical Mock Interview', weight: '15%', desc: 'Technical articulation & depth' },
    { key: 'resume', label: 'Resume & ATS Quality', weight: '15%', desc: 'Keyword alignment & quantifiable impact' },
    { key: 'projects', label: 'Project Portfolio Depth', weight: '10%', desc: 'Architecture defense & implementation metrics' },
    { key: 'aptitude', label: 'Quantitative Aptitude', weight: '10%', desc: 'Cognitive & speed-accuracy tests' },
    { key: 'communication', label: 'Communication Rating', weight: '5%', desc: 'Clarity, conciseness & tone' }
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sliders size={14} />
            Mathematical ROI Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Placement What-If Simulator</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Adjust hypothetical category score targets in real time. The mathematical model calculates your projected overall readiness and ranks the <strong>Best Improvement Strategies</strong> based on score return per effort.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Form */}
        <div className="lg:col-span-7 bg-surface border border-border p-6 rounded-2xl space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Hypothetical Target Scores</h3>
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw size={12} /> Recalculate
            </button>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            {sliderConfig.map(item => (
              <div key={item.key} className="space-y-1.5 p-3.5 rounded-xl bg-background border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-text-primary font-bold">{item.label}</span>
                    <span className="text-text-secondary text-[11px] ml-1.5">({item.weight} weight)</span>
                  </div>
                  <span className="text-primary font-extrabold text-sm">{scores[item.key]}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={scores[item.key]}
                  onChange={(e) => {
                    const newScores = { ...scores, [item.key]: Number(e.target.value) };
                    setScores(newScores);
                  }}
                  className="w-full accent-primary cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <p className="text-[10px] text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-colors text-xs flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <Calculator size={15} />
                <span>Simulate Placement Readiness Impact</span>
              </>
            )}
          </button>
        </div>

        {/* Impact Output & Strategy Recommendations */}
        <div className="lg:col-span-5 space-y-6">
          {result && (
            <>
              {/* Score Projection Card */}
              <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm space-y-4 text-center">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Projected Placement Readiness</span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-background border border-border">
                    <div className="text-[10px] font-bold text-text-secondary uppercase">Current Score</div>
                    <div className="text-2xl font-extrabold text-text-primary mt-0.5">{result.currentReadiness} <span className="text-xs text-text-secondary">/ 100</span></div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="text-[10px] font-bold text-primary uppercase">Projected Score</div>
                    <div className="text-2xl font-extrabold text-primary mt-0.5">{result.projectedScore} <span className="text-xs text-primary/70">/ 100</span></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">Estimated Net Gain:</span>
                  <span className="text-base font-extrabold text-emerald-600">
                    {result.projectedGain >= 0 ? `+${result.projectedGain}` : result.projectedGain} Points
                  </span>
                </div>
              </div>

              {/* Best Improvement Strategy (Feature 13) */}
              <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={16} className="text-amber-500" />
                    Best Improvement Strategy
                  </h3>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Highest ROI
                  </span>
                </div>

                <div className="space-y-3">
                  {result.bestImprovementStrategies?.map((strategy, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-background border border-border space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center font-extrabold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-text-primary">{strategy.area}</span>
                        </div>
                        <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{strategy.gain} Pts
                        </span>
                      </div>

                      <p className="text-xs text-text-secondary pl-7">
                        {strategy.action}
                      </p>

                      <div className="flex items-center gap-1 text-[11px] text-text-secondary pl-7 pt-1">
                        <Clock size={12} />
                        <span>Effort: <strong>{strategy.effort}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
