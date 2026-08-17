import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  Award, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export const Progress = () => {
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res);
    } catch (err) {
      console.error('Error fetching progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { profile: userProfile, roadmapProgress, mockHistory = [], recentLogs = [] } = data;

  // Calculate stats
  const averageMockScore = mockHistory.length > 0
    ? Math.round((mockHistory.reduce((sum, h) => sum + h.overall_score, 0) / mockHistory.length) * 10) / 10
    : 0;

  // Chart data formatting
  const chartData = mockHistory.map((item, idx) => ({
    name: `Session ${idx + 1} (${item.target_company})`,
    score: item.overall_score,
  }));

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">Progress Analytics</h2>
        <p className="text-text-secondary mt-1">
          Monitor your skill readiness gains, mock scores, and roadmap achievements.
        </p>
      </div>

      {/* High Level Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Readiness */}
        <div className="bg-surface border border-border p-6 rounded-card shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Readiness Score</span>
            <span className="text-2xl font-extrabold text-text-primary mt-0.5">{userProfile?.readiness_score || 0}%</span>
            <span className="text-[10px] text-secondary font-semibold block mt-0.5">Target: {userProfile?.target_role || 'SDE'}</span>
          </div>
        </div>

        {/* Metric 2: Tasks completed */}
        <div className="bg-surface border border-border p-6 rounded-card shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
            <CheckCircle size={22} />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Tasks Completed</span>
            <span className="text-2xl font-extrabold text-text-primary mt-0.5">
              {roadmapProgress?.tasksCompleted || 0}/{roadmapProgress?.totalTasks || 0}
            </span>
            <span className="text-[10px] text-text-secondary font-semibold block mt-0.5">
              Completion: {roadmapProgress?.completionPercentage || 0}%
            </span>
          </div>
        </div>

        {/* Metric 3: Average Mock Score */}
        <div className="bg-surface border border-border p-6 rounded-card shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center text-warning">
            <Award size={22} />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Average Mock Score</span>
            <span className="text-2xl font-extrabold text-text-primary mt-0.5">
              {averageMockScore > 0 ? `${averageMockScore}/10` : 'N/A'}
            </span>
            <span className="text-[10px] text-text-secondary font-semibold block mt-0.5">
              Sessions: {mockHistory.length}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Charts left, recent activities right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart (2 cols) */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-card p-6 shadow-subtle flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-text-primary text-base">Mock Interview Performance</h3>
            <p className="text-xs text-text-secondary mt-0.5">Trend analysis of your latest 5 mock rounds.</p>
          </div>

          <div className="h-64 w-full text-xs">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis domain={[0, 10]} stroke="#94A3B8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderRadius: '8px', 
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4F46E5" 
                    strokeWidth={3} 
                    activeDot={{ r: 6 }} 
                    dot={{ strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary border border-dashed border-border rounded-xl">
                No mock data logs found. Start mock sessions to plot results.
              </div>
            )}
          </div>
        </div>

        {/* Activity log summary list (1 col) */}
        <div className="bg-surface border border-border rounded-card p-6 shadow-subtle space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-text-primary text-base">Prep Timeline</h3>
            <p className="text-xs text-text-secondary mt-0.5">Latest actions performed.</p>
          </div>

          <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs leading-relaxed">
                  <Calendar size={14} className="text-text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-text-primary block">{log.description}</span>
                    <span className="text-[10px] text-text-secondary block mt-0.5">
                      {new Date(log.created_at).toLocaleDateString()} at {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-secondary">
                No activity logs registered.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
