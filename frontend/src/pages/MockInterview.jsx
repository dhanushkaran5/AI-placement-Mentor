import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Briefcase, 
  ChevronRight, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Trophy,
  Award
} from 'lucide-react';

export const MockInterview = () => {
  const { profile } = useAuth();
  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailedSession, setDetailedSession] = useState(null);
  const [weaknessMemory, setWeaknessMemory] = useState(null);

  useEffect(() => {
    fetchHistory();
    fetchWeaknessMemory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/mock/history');
      setHistory(res || []);
    } catch (err) {
      console.error('Error fetching mock history:', err);
    }
  };

  const fetchWeaknessMemory = async () => {
    try {
      const res = await api.get('/mock/weakness-memory');
      setWeaknessMemory(res);
    } catch (err) {
      console.warn('Weakness memory fetch error:', err);
    }
  };

  const handleStartSession = async () => {
    try {
      setLoading(true);
      setSession(null);
      setCompleted(false);
      setEvaluation(null);
      setCurrentIndex(0);
      setDetailedSession(null);
      
      const res = await api.post('/mock/start');
      setSession(res);
    } catch (err) {
      console.error('Error starting session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || !session) return;

    try {
      setSubmitting(true);
      const question = session.questions[currentIndex];
      
      const res = await api.post('/mock/submit', {
        sessionId: session.sessionId,
        questionId: question.id,
        answer: userAnswer.trim()
      });

      // Cache evaluation to display immediately
      setEvaluation(res.evaluation);
      
      // Update local session state with answer
      const updatedQuestions = [...session.questions];
      updatedQuestions[currentIndex].userAnswer = userAnswer.trim();
      updatedQuestions[currentIndex].score = res.evaluation.score;
      updatedQuestions[currentIndex].rating = res.evaluation.rating;
      updatedQuestions[currentIndex].feedback = res.evaluation.feedback;
      setSession({ ...session, questions: updatedQuestions });

      if (res.isCompleted) {
        setCompleted(true);
        setOverallScore(res.overallScore);
        await fetchHistory();
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setEvaluation(null);
    setUserAnswer('');
    setCurrentIndex((prev) => prev + 1);
  };

  const handleFetchDetails = async (id) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/mock/${id}`);
      setDetailedSession(res);
    } catch (err) {
      console.error('Error loading session details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Helper colors for score rating
  const getRatingStyle = (rating) => {
    switch (rating) {
      case 'Strong':
        return 'bg-success/10 text-success border-success/30';
      case 'Good':
        return 'bg-secondary/10 text-secondary border-secondary/30';
      default:
        return 'bg-warning/10 text-warning border-warning/30';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Active Session view
  if (session && !completed) {
    const question = session.questions[currentIndex];
    const hasFeedback = !!evaluation;

    return (
      <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto space-y-6">
        {/* Progress Header */}
        <div className="flex justify-between items-center bg-surface border border-border px-5 py-3 rounded-xl shadow-subtle">
          <span className="text-xs font-semibold text-text-secondary">
            Question {currentIndex + 1} of {session.questions.length}
          </span>
          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
            {question.category} Round
          </span>
        </div>

        {/* Split screen: left question/answer input, right feedback (if submitted) */}
        <div className="grid grid-cols-1 gap-6">
          {/* Question & Input */}
          <div className="bg-surface border border-border rounded-card p-6 shadow-subtle space-y-4">
            <h3 className="font-bold text-text-primary text-lg leading-snug">
              {question.text}
            </h3>
            
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={hasFeedback || submitting}
                placeholder="Type your response here... Try to explain your concepts, mention specific algorithms, or state a project scenario."
                rows="6"
                className="w-full bg-background border border-border rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:border-primary/50"
              />
              
              {!hasFeedback && (
                <button
                  type="submit"
                  disabled={submitting || !userAnswer.trim()}
                  className="py-2.5 px-5 bg-primary text-white hover:bg-primary-hover font-semibold rounded-button text-sm shadow-md transition-colors flex items-center gap-2 ml-auto"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Evaluating response...
                    </>
                  ) : (
                    <>
                      Submit Answer
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              )}
            </form>
          </div>

          {/* AI Feedback split panel (Only visible when evaluated) */}
          {hasFeedback && (
            <div className="space-y-6 animate-fadeIn">
              {/* Score rating summary */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${getRatingStyle(evaluation.rating)}`}>
                <span className="text-sm font-bold flex items-center gap-2">
                  <Award size={16} />
                  Answer Rating: {evaluation.rating}
                </span>
                <span className="text-base font-extrabold font-mono">Score: {evaluation.score}/10</span>
              </div>

              {/* Split Card Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Strengths & Weaknesses */}
                <div className="bg-surface border border-border rounded-card p-6 shadow-subtle space-y-5">
                  <h4 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                    <TrendingUp size={16} className="text-secondary" />
                    Areas Analyzed
                  </h4>
                  
                  {/* Strengths list */}
                  <div className="space-y-2 bg-secondary/5 border border-secondary/15 rounded-xl p-3.5">
                    <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Strengths</span>
                    <ul className="space-y-1.5 mt-2">
                      {evaluation.feedback.strengths.map((str, idx) => (
                        <li key={idx} className="text-xs text-text-primary font-medium flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-secondary mt-0.5 flex-shrink-0" />
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses list */}
                  <div className="space-y-2 bg-warning/5 border border-warning/15 rounded-xl p-3.5">
                    <span className="text-[10px] text-warning font-bold uppercase tracking-wider">Improvement Areas</span>
                    <ul className="space-y-1.5 mt-2">
                      {evaluation.feedback.weaknesses.map((weak, idx) => (
                        <li key={idx} className="text-xs text-text-primary font-medium flex items-start gap-2">
                          <AlertTriangle size={13} className="text-warning mt-0.5 flex-shrink-0" />
                          {weak}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Card: AI Suggestion */}
                <div className="bg-surface border border-border rounded-card p-6 shadow-subtle space-y-3">
                  <h4 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                    <BookOpen size={16} className="text-primary" />
                    Suggested Response
                  </h4>
                  <div className="text-xs text-text-secondary leading-relaxed bg-background/50 border border-border rounded-xl p-4 whitespace-pre-line h-[240px] overflow-y-auto custom-scrollbar">
                    {evaluation.feedback.suggestedAnswer}
                  </div>
                </div>
              </div>

              {/* Stepper controls */}
              <div className="flex justify-end pt-2">
                {currentIndex < session.questions.length - 1 ? (
                  <button
                    onClick={handleNextQuestion}
                    className="py-2.5 px-5 bg-primary text-white hover:bg-primary-hover font-semibold rounded-button text-sm flex items-center gap-2 shadow-md transition-colors"
                  >
                    Next Question
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => setCompleted(true)}
                    className="py-2.5 px-5 bg-secondary text-white hover:bg-secondary/90 font-semibold rounded-button text-sm flex items-center gap-2 shadow-md transition-colors"
                  >
                    Finish Interview
                    <Trophy size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Interview Completed Summary view
  if (completed && session) {
    return (
      <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto space-y-8">
        {/* Banner */}
        <div className="bg-surface border border-border rounded-card p-8 shadow-subtle text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-secondary/15 rounded-full flex items-center justify-center text-secondary">
            <Trophy size={32} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-2xl">Mock Interview Completed!</h3>
            <p className="text-text-secondary mt-1">
              You've successfully answered all technical and behavioral mock rounds for <strong className="text-text-primary">{session.target_role} @ {session.target_company}</strong>.
            </p>
          </div>
          <div className="bg-background border border-border px-6 py-2.5 rounded-full text-base font-extrabold text-text-primary font-mono">
            Overall Session Score: {overallScore}/10
          </div>
          
          <button
            onClick={handleStartSession}
            className="mt-2 py-2.5 px-5 bg-primary text-white hover:bg-primary-hover font-semibold rounded-button text-sm shadow-md transition-colors"
          >
            Practice Another Session
          </button>
        </div>

        {/* Review Checklist details */}
        <div className="space-y-4">
          <h4 className="font-bold text-text-primary text-lg">Interview Review Details</h4>
          <div className="space-y-6">
            {session.questions.map((q, idx) => (
              <div key={q.id} className="bg-surface border border-border rounded-card p-6 shadow-subtle space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-xs font-bold text-text-secondary uppercase">Round {idx+1}: {q.category}</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getRatingStyle(q.rating)}`}>
                    Score: {q.score}/10
                  </span>
                </div>
                
                <div>
                  <h4 className="font-bold text-text-primary text-sm">Question:</h4>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">{q.text}</p>
                </div>

                {/* Split card reviews */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-background/50 border border-border rounded-xl text-xs space-y-1.5">
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Your Response</span>
                    <p className="text-text-primary italic whitespace-pre-line leading-relaxed">"{q.userAnswer}"</p>
                  </div>
                  
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-xs space-y-1.5">
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">AI Suggestion</span>
                    <p className="text-text-primary whitespace-pre-line leading-relaxed">{q.feedback?.suggestedAnswer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Pre-Start History Screen
  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-surface border border-border rounded-card p-8 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <h3 className="font-bold text-text-primary text-2xl">Placement Mock Sandbox</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Run a simulated 5-question interview loop based on your matched resume skills and target expectations for <strong className="text-text-primary">{profile?.target_role} @ {profile?.target_company}</strong>.
          </p>
        </div>
        
        <button
          onClick={handleStartSession}
          className="py-3 px-6 bg-primary text-white hover:bg-primary-hover font-semibold rounded-button text-sm shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Briefcase size={16} />
          Start New Practice
        </button>
      </div>

      {/* Interview Weakness Memory (Feature 15) */}
      {weaknessMemory?.repeatedWeaknesses?.length > 0 && (
        <div className="bg-surface border border-border rounded-card p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Interview Weakness Memory & Remediation
            </h3>
            <span className="text-xs font-semibold text-text-secondary">Tracked Across Past Sessions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {weaknessMemory.repeatedWeaknesses.map((w, idx) => (
              <div key={idx} className="p-3.5 bg-background rounded-xl border border-border space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">{w.topic}</span>
                  <span className="text-[10px] font-extrabold text-red-600 bg-red-500/10 px-2 py-0.5 rounded">
                    Seen {w.detectedCount}x
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  <strong>Mistake:</strong> {w.lastMistake}
                </p>
                <div className="text-[11px] text-primary font-medium pt-1 border-t border-border/60">
                  <strong>Fix:</strong> {w.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Grid Table */}
      <div className="bg-surface border border-border rounded-card p-6 shadow-subtle space-y-4">
        <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
          <Trophy size={18} className="text-secondary" />
          Mock Score Logbook
        </h3>
        
        {history.length > 0 ? (
          <div className="border border-border rounded-xl overflow-hidden text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="p-3.5 font-bold text-text-primary">Target Company / Role</th>
                  <th className="p-3.5 font-bold text-text-primary text-center">Score</th>
                  <th className="p-3.5 font-bold text-text-primary text-center">Date Taken</th>
                  <th className="p-3.5 font-bold text-text-primary text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-background/20 transition-colors">
                    <td className="p-3.5 font-semibold text-text-primary">
                      {h.target_company} — {h.target_role}
                    </td>
                    <td className="p-3.5 text-center font-bold text-secondary">
                      {h.overall_score > 0 ? `${h.overall_score}/10` : 'Incomplete'}
                    </td>
                    <td className="p-3.5 text-center text-xs text-text-secondary">
                      {new Date(h.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleFetchDetails(h.id)}
                        className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 mx-auto"
                      >
                        Review Q&A <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-text-secondary">
            No mock interview logs completed yet. Take your first session!
          </div>
        )}
      </div>

      {/* Selected Session Detail review (if requested) */}
      {detailedSession && (
        <div className="bg-surface border border-border rounded-card p-6 shadow-subtle space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h4 className="font-bold text-text-primary text-lg">
              Review details: {detailedSession.target_company} — {detailedSession.target_role}
            </h4>
            <span className="text-sm font-bold text-secondary bg-secondary/15 px-3 py-1 rounded-full">
              Score: {detailedSession.overall_score}/10
            </span>
          </div>

          <div className="space-y-6">
            {detailedSession.questions.map((q, idx) => (
              <div key={q.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-text-secondary uppercase">Round {idx+1}: {q.category}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getRatingStyle(q.rating)}`}>
                    Rating: {q.rating} ({q.score}/10)
                  </span>
                </div>
                <p className="text-sm font-bold text-text-primary">{q.text}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-background border border-border rounded-xl text-xs space-y-1">
                    <span className="text-[10px] text-text-secondary font-bold uppercase">Your Answer</span>
                    <p className="italic">"{q.userAnswer || 'No answer submitted'}"</p>
                  </div>
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] text-primary font-bold uppercase">Suggested Answer</span>
                    <p>{q.feedback?.suggestedAnswer || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterview;
