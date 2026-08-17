import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Code2, 
  Play, 
  CheckCircle, 
  Clock, 
  Zap, 
  ArrowRight, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  BrainCircuit,
  Award
} from 'lucide-react';

export default function CodingLab({ setCurrentView }) {
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [weaknessProfile, setWeaknessProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProblems();
    fetchWeaknessProfile();
  }, []);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const data = await api.get('/coding/problems');
      setProblems(data || []);
      if (data && data.length > 0) {
        setSelectedProblem(data[0]);
        setCode(data[0].starterJava);
      }
    } catch (e) {
      console.error('Fetch problems error:', e);
      setError(e.message || 'Failed to load coding problems.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeaknessProfile = async () => {
    try {
      const data = await api.get('/coding/weakness-profile');
      setWeaknessProfile(data);
    } catch (e) {
      console.warn('Weakness profile fetch fallback:', e);
    }
  };

  const handleSelectProblem = (prob) => {
    setSelectedProblem(prob);
    setResult(null);
    setCode(language === 'java' ? prob.starterJava : prob.starterPython);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (selectedProblem) {
      setCode(lang === 'java' ? selectedProblem.starterJava : selectedProblem.starterPython);
    }
  };

  const handleRunCode = async () => {
    if (!selectedProblem || !code || evaluating) return;
    setEvaluating(true);
    setResult(null);
    setError(null);
    try {
      const data = await api.post('/coding/submit', {
        problemId: selectedProblem.id,
        problemTitle: selectedProblem.title,
        code,
        language
      });
      setResult(data);
      // Refresh weakness profile after submission
      await fetchWeaknessProfile();
    } catch (e) {
      console.error('Submit code error:', e);
      setError(e.message || 'Failed to evaluate code submission.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
            <Code2 size={14} /> AI Coding Intelligence & DSA Lab
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Algorithmic Problem Solving & Weakness Tracker</h1>
          <p className="text-text-secondary text-xs sm:text-sm mt-1">
            Practice placement coding challenges. The engine tracks runtime complexity, topic error rates, and updates your DSA readiness profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLanguageChange('java')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              language === 'java' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-background border-border text-text-secondary'
            }`}
          >
            Java 17
          </button>
          <button
            onClick={() => handleLanguageChange('python')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              language === 'python' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-background border-border text-text-secondary'
            }`}
          >
            Python 3
          </button>
        </div>
      </div>

      {/* Coding Weakness Profile (Feature 18) */}
      {weaknessProfile && (
        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <BrainCircuit size={18} className="text-primary" />
                Topic-by-Topic Coding Weakness Profile
              </h3>
              <p className="text-xs text-text-secondary">Your algorithmic mastery measured across top interview DSA topics:</p>
            </div>
            <span className="text-xs font-bold text-text-secondary">
              Target Threshold: ≥ 75%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {weaknessProfile.topicBreakdown?.map((topic, i) => {
              const isWeak = topic.score < 50;
              const isModerate = topic.score >= 50 && topic.score < 75;

              return (
                <div key={i} className="p-3 bg-background rounded-xl border border-border text-center space-y-1">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight block truncate" title={topic.topic}>
                    {topic.topic.split(' ')[0]}
                  </span>
                  <div className={`text-base font-extrabold ${isWeak ? 'text-red-500' : (isModerate ? 'text-amber-500' : 'text-emerald-600')}`}>
                    {topic.score}%
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isWeak ? 'bg-red-50 text-red-600' : (isModerate ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600')}`}>
                    {topic.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Recommended Problem Strip */}
          {weaknessProfile.recommendedNextProblems?.length > 0 && (
            <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-primary font-bold">
                <Flame size={14} className="text-orange-500" />
                <span>Next Targeted DSA Drill:</span>
                <span className="text-text-primary font-semibold">{weaknessProfile.recommendedNextProblems[0]?.title}</span>
              </div>
              <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {weaknessProfile.recommendedNextProblems[0]?.impact}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Problem List & Problem Description */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface border border-border p-5 rounded-2xl space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Problem Catalog</h3>
            <div className="space-y-2">
              {problems.map(prob => (
                <button
                  key={prob.id}
                  onClick={() => handleSelectProblem(prob)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedProblem?.id === prob.id
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                      : 'bg-background border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{prob.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      prob.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {prob.difficulty}
                    </span>
                  </div>
                  <div className="text-[10px] text-text-secondary mt-1">{prob.category} • {prob.timeLimit}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedProblem && (
            <div className="bg-surface border border-border p-5 rounded-2xl space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary">{selectedProblem.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{selectedProblem.description}</p>
              
              <div className="border-t border-border pt-3 space-y-2">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Sample Test Cases</h4>
                {selectedProblem.sampleTestCases?.map((tc, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-background border border-border text-[11px] font-mono space-y-1">
                    <div><span className="text-text-secondary font-bold">Input:</span> {tc.input}</div>
                    <div><span className="text-emerald-600 font-bold">Expected:</span> {tc.expectedOutput}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Columns: Code Editor & Evaluation */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-[480px]">
            {/* Editor Bar */}
            <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                <FileCode size={16} className="text-primary" />
                <span>solution.{language === 'java' ? 'java' : 'py'}</span>
              </div>

              <button
                onClick={handleRunCode}
                disabled={evaluating || !code}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20"
              >
                <Play size={14} />
                {evaluating ? 'Evaluating Test Cases...' : 'Run & Submit Code'}
              </button>
            </div>

            {/* Code Input Area */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full flex-1 bg-[#1e1e2e] text-[#cdd6f4] font-mono text-xs p-4 focus:outline-none resize-none leading-relaxed custom-scrollbar"
              placeholder="// Write your code solution here..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Test Case Evaluation Output */}
          {result && (
            <div className="bg-surface border border-border p-6 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-emerald-500" size={20} />
                  <h3 className="text-base font-bold text-text-primary">Submission Status: {result.evaluation?.status}</h3>
                </div>
                <div className="text-sm font-extrabold text-primary">{result.evaluation?.score}% Score</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-background border border-border text-center">
                  <div className="text-[10px] font-bold text-text-secondary uppercase">Test Cases</div>
                  <div className="text-base font-extrabold text-emerald-600 mt-0.5">
                    {result.evaluation?.testCasesPassed} / {result.evaluation?.totalTestCases}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border text-center">
                  <div className="text-[10px] font-bold text-text-secondary uppercase">Runtime</div>
                  <div className="text-base font-extrabold text-text-primary mt-0.5">{result.evaluation?.runtimeMs} ms</div>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border text-center">
                  <div className="text-[10px] font-bold text-text-secondary uppercase">Time Complexity</div>
                  <div className="text-base font-extrabold text-primary mt-0.5">{result.evaluation?.timeComplexity}</div>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border text-center">
                  <div className="text-[10px] font-bold text-text-secondary uppercase">Space Complexity</div>
                  <div className="text-base font-extrabold text-primary mt-0.5">{result.evaluation?.spaceComplexity}</div>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed bg-background p-3.5 rounded-xl border border-border">
                {result.evaluation?.feedback}
              </p>

              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary flex items-center justify-between">
                <span>Placement Readiness Updated: <strong>{result.updatedReadiness}%</strong></span>
                <button
                  onClick={() => setCurrentView && setCurrentView('readiness')}
                  className="font-bold underline flex items-center gap-1 hover:opacity-80"
                >
                  View Readiness Index <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
