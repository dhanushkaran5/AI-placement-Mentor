import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RiskAnalyzer({ setCurrentView }) {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const data = await api.get('/readiness');
      setRisks(data.risks || []);
    } catch (e) {
      console.error('Fetch risks error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-600 rounded-full text-xs font-bold mb-2">
          <ShieldAlert size={14} /> Diagnostic Placement Risk Engine
        </div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Placement Risk Analyzer</h1>
        <p className="text-text-secondary text-sm mt-1">
          Identifies critical and high-risk skill gaps derived from actual user assessment scores, providing clear evidence and actionable remediation steps.
        </p>
      </div>

      {/* Risks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-text-secondary">Analyzing placement risks...</div>
        ) : risks.length === 0 ? (
          <div className="bg-surface border border-border p-12 rounded-2xl text-center flex flex-col items-center gap-3">
            <ShieldCheck size={40} className="text-emerald-500" />
            <h3 className="text-base font-bold text-text-primary">No Placement Risks Detected</h3>
            <p className="text-xs text-text-secondary">All your performance metrics are well above critical thresholds.</p>
          </div>
        ) : (
          risks.map((risk, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border transition-all ${
                risk.risk_level === 'HIGH' || risk.risk_level === 'CRITICAL'
                  ? 'bg-red-500/5 border-red-500/30'
                  : 'bg-amber-500/5 border-amber-500/30'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      risk.risk_level === 'HIGH' || risk.risk_level === 'CRITICAL'
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {risk.risk_level} RISK — {risk.category}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-text-primary">{risk.reason}</p>
                  <p className="text-xs text-text-secondary"><strong className="text-text-primary">Evidence:</strong> {risk.evidence}</p>
                  <p className="text-xs text-primary font-semibold"><strong className="text-text-primary">Recommended Action:</strong> {risk.recommended_action}</p>
                </div>

                <button
                  onClick={() => setCurrentView && setCurrentView('roadmap')}
                  className="px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary hover:bg-background flex items-center gap-1.5 whitespace-nowrap self-start md:self-auto"
                >
                  View Roadmap Remedy <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
