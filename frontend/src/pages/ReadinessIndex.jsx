import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Target, Award, ShieldAlert, ArrowRight, TrendingUp, Zap, Sparkles } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ReadinessIndex({ setCurrentView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReadiness();
  }, []);

  const fetchReadiness = async () => {
    setLoading(true);
    try {
      const json = await api.get('/readiness');
      setData(json);
    } catch (e) {
      console.error('Fetch readiness error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
          <Target size={14} /> Multi-Dimensional Evaluation Engine
        </div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">AI Placement Readiness Index</h1>
        <p className="text-text-secondary text-sm mt-1">
          A real 0–100 score calculated across 7 measurable dimensions with dynamic risk classification and historical trend analytics.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-text-secondary">Calculating placement readiness index...</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-1">
              <div className="text-xs font-bold text-text-secondary">Overall Readiness</div>
              <div className="text-4xl font-black text-primary">{data.readiness.overallReadiness} / 100</div>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-1">
                <TrendingUp size={14} /> {data.readiness.scoreChange >= 0 ? `+${data.readiness.scoreChange}` : data.readiness.scoreChange} from last evaluation
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border space-y-1">
              <div className="text-xs font-bold text-text-secondary">Risk Level</div>
              <div className={`text-2xl font-extrabold mt-1 ${
                data.readiness.riskLevel === 'Critical' || data.readiness.riskLevel === 'High Risk' ? 'text-red-500' : 'text-amber-500'
              }`}>
                {data.readiness.riskLevel}
              </div>
              <div className="text-[11px] text-text-secondary">Based on current weakness thresholds</div>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border space-y-1">
              <div className="text-xs font-bold text-text-secondary">Strongest Area</div>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">{data.readiness.strongestArea}</div>
              <div className="text-[11px] text-text-secondary">Highest evaluated score</div>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border space-y-1">
              <div className="text-xs font-bold text-text-secondary">Weakest Area</div>
              <div className="text-xl font-extrabold text-red-500 mt-1">{data.readiness.weakestArea}</div>
              <div className="text-[11px] text-text-secondary">Priority target for preparation</div>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="bg-surface border border-border p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-text-primary">Weighted Category Score Breakdown</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Technical Skills', key: 'technical', weight: '25%' },
                { name: 'DSA / Coding', key: 'dsa', weight: '20%' },
                { name: 'Mock Interview', key: 'mockInterview', weight: '15%' },
                { name: 'Resume Quality', key: 'resume', weight: '15%' },
                { name: 'Aptitude', key: 'aptitude', weight: '10%' },
                { name: 'Projects', key: 'projects', weight: '10%' },
                { name: 'Communication', key: 'communication', weight: '5%' }
              ].map(cat => {
                const score = data.readiness.categories[cat.key];
                return (
                  <div key={cat.key} className="p-4 rounded-xl bg-background border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-text-primary">{cat.name}</span>
                      <span className="text-text-secondary">{cat.weight}</span>
                    </div>
                    <div className="text-2xl font-extrabold text-primary">{score}%</div>
                    <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Readiness Trend Chart */}
          {data.history && data.history.length > 0 && (
            <div className="bg-surface border border-border p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-text-primary">Historical Readiness Progression</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.history}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="created_at" tickFormatter={(t) => new Date(t).toLocaleDateString()} stroke="#888" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#888" fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="overall_score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
