import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FolderGit2, 
  ShieldCheck, 
  Send, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw,
  Award,
  Layers,
  Cpu
} from 'lucide-react';

export const ProjectDefense = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [roundsHistory, setRoundsHistory] = useState([]);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);

  // Custom project input state
  const [customName, setCustomName] = useState('AI Placement Mentor Agent');
  const [customStack, setCustomStack] = useState('React, Node.js, Express, JSON DB, TailwindCSS, Anthropic Claude');
  const [customDesc, setCustomDesc] = useState('An intelligent 24/7 placement mentor and career coaching operating system with automated skill verification, RAG company intelligence, and adaptive roadmaps.');

  useEffect(() => {
    fetchProjectHistory();
  }, []);

  const fetchProjectHistory = async () => {
    try {
      const res = await api.get('/projects/history');
      if (res && res.length > 0) {
        setProjects(res);
        setSelectedProject(res[0]);
      } else {
        // Fallback default project
        const defaultProj = {
          project_name: customName,
          tech_stack: customStack,
          description: customDesc
        };
        setSelectedProject(defaultProj);
      }
    } catch (err) {
      console.warn('Using default project context:', err);
      setSelectedProject({
        project_name: customName,
        tech_stack: customStack,
        description: customDesc
      });
    }
  };

  const startDefenseRound = async () => {
    if (!selectedProject) return;

    try {
      setLoadingQuestion(true);
      setError(null);
      setCurrentEvaluation(null);
      setUserAnswer('');

      const res = await api.post('/projects/defense-question', {
        project: selectedProject,
        previousRounds: roundsHistory
      });

      setCurrentQuestion(res);
    } catch (err) {
      console.error('Error fetching defense question:', err);
      setError(err.message || 'Failed to generate defense question.');
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || evaluating) return;

    try {
      setEvaluating(true);
      setError(null);

      const res = await api.post('/projects/evaluate-defense', {
        project: selectedProject,
        question: currentQuestion.question,
        answer: userAnswer.trim()
      });

      setCurrentEvaluation(res);
      setRoundsHistory(prev => [
        ...prev,
        {
          question: currentQuestion.question,
          answer: userAnswer,
          evaluation: res
        }
      ]);
    } catch (err) {
      console.error('Error evaluating defense answer:', err);
      setError(err.message || 'Failed to evaluate answer.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck size={14} />
            Round 2 Technical Interview Simulator
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Project Interview Defense Simulator
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            In top tech interviews, 40-50% of the discussion revolves around defending architectural decisions, concurrency trade-offs, and scalability bottlenecks. Practice answering tough interviewer probing questions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Project Selector & Details */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <FolderGit2 size={16} className="text-primary" />
              Target Project Portfolio
            </h3>

            {projects.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Select Stored Project</label>
                <select
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const found = projects.find(p => p.id === Number(e.target.value));
                    if (found) setSelectedProject(found);
                  }}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-3.5 bg-background rounded-xl border border-border space-y-2 text-xs">
              <div>
                <span className="font-bold text-text-secondary">Project: </span>
                <span className="font-semibold text-text-primary">{selectedProject?.project_name}</span>
              </div>
              <div>
                <span className="font-bold text-text-secondary">Tech Stack: </span>
                <span className="font-mono text-primary text-[11px]">{selectedProject?.tech_stack}</span>
              </div>
              <div>
                <span className="font-bold text-text-secondary">Overview: </span>
                <p className="text-text-secondary mt-0.5 leading-relaxed">{selectedProject?.description}</p>
              </div>
            </div>

            <button
              onClick={startDefenseRound}
              disabled={loadingQuestion}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              {loadingQuestion ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{currentQuestion ? 'Next Defense Question' : 'Start Defense Simulation'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Question & Answer Area */}
        <div className="lg:col-span-8 space-y-4">
          {!currentQuestion ? (
            <div className="h-full flex flex-col items-center justify-center p-10 bg-surface border border-border rounded-2xl text-center space-y-3 min-h-[300px]">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-base font-bold text-text-primary">Ready to Defend Your Project</h3>
              <p className="text-xs text-text-secondary max-w-sm">
                Click "Start Defense Simulation" to have the AI interviewer ask a deep architectural question tailored to your tech stack.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Interviewer Question Box */}
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2.5 py-1 bg-indigo-500/10 text-primary border border-indigo-500/20 rounded-full uppercase tracking-wider">
                    Interviewer Question (Round #{currentQuestion.roundNumber})
                  </span>
                  <span className="text-xs text-text-secondary font-medium">
                    Aspect: {currentQuestion.aspect}
                  </span>
                </div>

                <p className="text-sm font-bold text-text-primary leading-relaxed">
                  "{currentQuestion.question}"
                </p>

                {currentQuestion.expectedPoints?.length > 0 && (
                  <div className="pt-2 border-t border-border flex items-center gap-2 text-[11px] text-text-secondary">
                    <span className="font-semibold text-primary">Interviewer is evaluating:</span>
                    <span>{currentQuestion.expectedPoints.join(' • ')}</span>
                  </div>
                )}
              </div>

              {/* Answer Input */}
              <form onSubmit={handleSubmitAnswer} className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-primary">Your Technical Explanation</label>
                  <span className="text-[11px] text-text-secondary">Be structured and mention trade-offs</span>
                </div>

                <textarea
                  rows={5}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Explain your architectural reasoning, database schema design, caching strategies, or handling of edge cases..."
                  className="w-full bg-background border border-border rounded-xl p-3.5 text-xs text-text-primary focus:outline-none focus:border-primary/50 font-sans leading-relaxed"
                />

                {error && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={evaluating || !userAnswer.trim()}
                    className="px-5 py-2.5 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                  >
                    {evaluating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Evaluating Response...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Submit Answer to Interviewer</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Evaluation Results */}
              {currentEvaluation && (
                <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Award size={14} className="text-amber-500" />
                      Interviewer Evaluation
                    </h4>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {currentEvaluation.verdict} ({currentEvaluation.scores?.overallScore}%)
                    </span>
                  </div>

                  {/* Score Matrix */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-background rounded-xl border border-border text-center">
                      <span className="text-[10px] font-bold text-text-secondary uppercase">Technical Depth</span>
                      <div className="text-sm font-extrabold text-primary mt-0.5">
                        {currentEvaluation.scores?.technicalDepth}
                      </div>
                    </div>
                    <div className="p-3 bg-background rounded-xl border border-border text-center">
                      <span className="text-[10px] font-bold text-text-secondary uppercase">Clarity</span>
                      <div className="text-sm font-extrabold text-secondary mt-0.5">
                        {currentEvaluation.scores?.clarity}
                      </div>
                    </div>
                    <div className="p-3 bg-background rounded-xl border border-border text-center">
                      <span className="text-[10px] font-bold text-text-secondary uppercase">Architecture</span>
                      <div className="text-sm font-extrabold text-indigo-600 mt-0.5">
                        {currentEvaluation.scores?.architectureUnderstanding}
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="space-y-2 text-xs">
                    {currentEvaluation.strengths?.map((s, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-emerald-700">
                        <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                    {currentEvaluation.areasForImprovement?.map((a, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-text-secondary">
                        <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>

                  {/* Follow-up Question */}
                  {currentEvaluation.followUpQuestion && (
                    <div className="p-3.5 bg-primary-light rounded-xl border border-primary/20 space-y-1">
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                        Interviewer Follow-Up Probing Question:
                      </span>
                      <p className="text-xs font-semibold text-text-primary">
                        "{currentEvaluation.followUpQuestion}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDefense;
