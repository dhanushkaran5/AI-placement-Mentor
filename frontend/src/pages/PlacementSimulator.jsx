import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, CheckCircle2, ArrowRight, Play, ShieldAlert, Award } from 'lucide-react';

export default function PlacementSimulator({ setCurrentView }) {
  const [selectedCompany, setSelectedCompany] = useState('TCS');
  const [config, setConfig] = useState(null);
  const [activeRound, setActiveRound] = useState(0);
  const [simulationId, setSimulationId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [completedRounds, setCompletedRounds] = useState([]);
  const [simulationResult, setSimulationResult] = useState(null);

  const companies = ['TCS', 'Infosys', 'Wipro', 'Amazon', 'Google', 'Juspay'];

  useEffect(() => {
    fetchConfig(selectedCompany);
  }, [selectedCompany]);

  const fetchConfig = async (company) => {
    try {
      const data = await api.get(`/simulation/config?company=${encodeURIComponent(company)}`);
      setConfig(data);
      setActiveRound(0);
      setCompletedRounds([]);
      setSimulationResult(null);
      setSimulationId(null);
    } catch (e) {
      console.error('Fetch config error:', e);
    }
  };

  const startSimulation = async () => {
    try {
      const data = await api.post('/simulation/start', { company: selectedCompany });
      setSimulationId(data.simulationId);
    } catch (e) {
      console.error('Start simulation error:', e);
    }
  };

  const submitRound = async () => {
    if (!config || !config.rounds[activeRound]) return;
    setSubmitting(true);
    const round = config.rounds[activeRound];

    // Simulated score for the round submission
    const score = Math.floor(Math.random() * 25) + 70;

    try {
      const data = await api.post('/simulation/submit-round', {
        simulationId: simulationId || 1,
        roundName: round.name,
        score,
        submissionDetails: { company: selectedCompany, round: round.name }
      });

      if (res.ok) {
        const data = await res.json();
        setCompletedRounds(prev => [...prev, { roundName: round.name, score, evalResult: data.evalResult }]);

        if (activeRound + 1 < config.rounds.length) {
          setActiveRound(prev => prev + 1);
        } else {
          setSimulationResult(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-bold mb-2">
            <Trophy size={14} /> Full Company Placement Simulator
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Company Recruitment Drive Simulator</h1>
          <p className="text-text-secondary text-sm mt-1">
            Simulate realistic multi-round recruitment drives (Aptitude $\rightarrow$ Coding $\rightarrow$ Technical $\rightarrow$ HR) tailored to company assessment patterns.
          </p>
        </div>

        {/* Company Selector */}
        <div className="flex items-center gap-2">
          {companies.map(comp => (
            <button
              key={comp}
              onClick={() => setSelectedCompany(comp)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                selectedCompany === comp
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {comp}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Round Stepper & Active Round */}
        <div className="lg:col-span-2 space-y-6">
          {config && (
            <div className="bg-surface border border-border p-6 rounded-2xl space-y-6">
              {/* Stepper */}
              <div className="flex items-center justify-between overflow-x-auto pb-2 border-b border-border">
                {config.rounds.map((r, idx) => {
                  const isDone = idx < activeRound || simulationResult;
                  const isCurrent = idx === activeRound && !simulationResult;
                  return (
                    <div key={r.id} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone ? 'bg-emerald-500 text-white' : (isCurrent ? 'bg-amber-500 text-white ring-4 ring-amber-500/20' : 'bg-background border border-border text-text-secondary')
                      }`}>
                        {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>
                      <span className={`text-xs font-bold whitespace-nowrap ${isCurrent ? 'text-amber-600' : 'text-text-secondary'}`}>
                        Round {idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>

              {simulationResult ? (
                /* Final Score Card */
                <div className="p-6 rounded-2xl bg-background border border-border space-y-6 text-center">
                  <Award className="mx-auto text-amber-500" size={48} />
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">{selectedCompany} Simulation Scorecard</h2>
                    <p className="text-sm font-extrabold text-amber-600 mt-1">{simulationResult.verdict}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-surface border border-border">
                      <div className="text-xs font-bold text-text-secondary">Overall Score</div>
                      <div className="text-2xl font-extrabold text-primary mt-1">{simulationResult.overallScore}%</div>
                    </div>
                    <div className="p-4 rounded-xl bg-surface border border-border">
                      <div className="text-xs font-bold text-text-secondary">Rounds Passed</div>
                      <div className="text-2xl font-extrabold text-emerald-600 mt-1">{completedRounds.length} / {config.rounds.length}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-surface border border-border col-span-2 md:col-span-1">
                      <div className="text-xs font-bold text-text-secondary">Readiness Impact</div>
                      <div className="text-2xl font-extrabold text-primary mt-1">+{Math.round(simulationResult.overallScore * 0.1)} Score</div>
                    </div>
                  </div>

                  <button
                    onClick={() => fetchConfig(selectedCompany)}
                    className="w-full py-3 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20"
                  >
                    Run Another Simulation Drive
                  </button>
                </div>
              ) : (
                /* Round Runner */
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-background border border-border space-y-3">
                    <span className="text-xs font-bold text-amber-600 uppercase bg-amber-500/10 px-2.5 py-1 rounded">
                      Active Round: {config.rounds[activeRound]?.name}
                    </span>
                    <h3 className="text-lg font-bold text-text-primary">{config.rounds[activeRound]?.name}</h3>
                    <div className="flex items-center gap-4 text-xs font-semibold text-text-secondary">
                      <span>Duration: {config.rounds[activeRound]?.duration}</span>
                      <span>•</span>
                      <span>Questions: {config.rounds[activeRound]?.questionCount}</span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed pt-2">
                      Complete this round by answering technical and aptitude questions tailored to {selectedCompany}'s recruitment standards.
                    </p>
                  </div>

                  <button
                    onClick={submitRound}
                    disabled={submitting}
                    className="w-full py-3.5 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Evaluating Round Results...' : 'Complete Round & Submit Evaluation'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Completed Rounds History */}
        <div className="space-y-4">
          <div className="bg-surface border border-border p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-text-primary">Completed Simulation Rounds</h3>
            {completedRounds.length === 0 ? (
              <p className="text-xs text-text-secondary">No rounds completed yet. Select a company and start the recruitment drive.</p>
            ) : (
              <div className="space-y-3">
                {completedRounds.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-background border border-border space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-text-primary">{r.roundName}</span>
                      <span className="text-amber-600">{r.score}%</span>
                    </div>
                    <p className="text-[11px] text-text-secondary">{r.evalResult?.feedback}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
