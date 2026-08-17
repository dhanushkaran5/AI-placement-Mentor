import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Award, ArrowRight, RefreshCw, HelpCircle, AlertCircle, ShieldCheck } from 'lucide-react';

export default function SkillVerification({ setCurrentView }) {
  const [selectedSkill, setSelectedSkill] = useState('Java');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [verifiedList, setVerifiedList] = useState([]);

  const skillsList = ['Java', 'Python', 'SQL', 'Data Structures', 'React', 'System Design'];

  useEffect(() => {
    fetchVerifiedSkills();
    loadQuiz(selectedSkill);
  }, [selectedSkill]);

  const fetchVerifiedSkills = async () => {
    try {
      const data = await api.get('/verification/skills/verified');
      setVerifiedList(data || []);
    } catch (e) {
      console.error('Fetch verified skills error:', e);
    }
  };

  const loadQuiz = async (skill) => {
    setLoading(true);
    setResult(null);
    setUserAnswers({});
    try {
      const data = await api.get(`/verification/skills/quiz?skill=${encodeURIComponent(skill)}`);
      setQuiz(data);
    } catch (e) {
      console.error('Load quiz error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data = await api.post('/verification/skills/submit', { 
        skill: selectedSkill, 
        answers: userAnswers 
      });
      setResult(data);
      fetchVerifiedSkills();
    } catch (e) {
      console.error('Submit quiz error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-surface border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
            <ShieldCheck size={14} /> Resume Skill Verification Engine
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Verify Your Technical Skills</h1>
          <p className="text-text-secondary text-sm mt-1">
            Resume claims must be verified. Complete rigorous MCQs, conceptual, debugging, and output challenges to validate your skill status.
          </p>
        </div>

        {/* Verified skills summary badge */}
        <div className="flex items-center gap-2 bg-background p-3 rounded-xl border border-border">
          <Award className="text-primary" size={24} />
          <div>
            <div className="text-xs font-bold text-text-secondary">Verified Skills</div>
            <div className="text-base font-extrabold text-text-primary">{verifiedList.length} Verified</div>
          </div>
        </div>
      </div>

      {/* Skill Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {skillsList.map(skill => (
          <button
            key={skill}
            onClick={() => setSelectedSkill(skill)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedSkill === skill
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {skill}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assessment Runner */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-surface border border-border p-12 rounded-2xl flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
              <p className="text-sm font-semibold text-text-secondary">Generating Verification Assessment for {selectedSkill}...</p>
            </div>
          ) : result ? (
            /* Result Report Card */
            <div className="bg-surface border border-border p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{selectedSkill} Verification Report</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Verification Score: {result.verificationScore}%</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-extrabold ${
                  result.verificationScore >= 75 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {result.level} Level
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-background border border-border text-center">
                  <div className="text-xs font-bold text-text-secondary">Concept Score</div>
                  <div className="text-xl font-extrabold text-primary mt-1">{result.conceptScore}%</div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border text-center">
                  <div className="text-xs font-bold text-text-secondary">Coding Logic</div>
                  <div className="text-xl font-extrabold text-primary mt-1">{result.codingScore}%</div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border text-center">
                  <div className="text-xs font-bold text-text-secondary">Debugging Score</div>
                  <div className="text-xl font-extrabold text-primary mt-1">{result.debuggingScore}%</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-semibold flex items-center justify-between">
                <span>Placement Readiness Updated to: <strong>{result.updatedReadiness}%</strong></span>
                <button
                  onClick={() => setCurrentView && setCurrentView('readiness')}
                  className="inline-flex items-center gap-1 font-bold underline hover:opacity-80"
                >
                  View Readiness Index <ArrowRight size={12} />
                </button>
              </div>

              <button
                onClick={() => loadQuiz(selectedSkill)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                <RefreshCw size={14} /> Retake Assessment
              </button>
            </div>
          ) : quiz ? (
            /* Quiz Questions */
            <div className="bg-surface border border-border p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="text-base font-bold text-text-primary">{selectedSkill} Skill Verification Test</h2>
                <span className="text-xs font-bold text-text-secondary">{quiz.questions.length} Questions</span>
              </div>

              <div className="space-y-6">
                {quiz.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl bg-background border border-border space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-extrabold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                        Q{idx + 1} • {q.type}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-text-primary whitespace-pre-wrap">{q.question}</p>

                    <div className="space-y-2 pt-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[q.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                                : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-text-secondary/30'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 size={16} className="text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(userAnswers).length === 0}
                className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? 'Evaluating Verification Answers...' : 'Submit Assessment & Verify Skill'}
              </button>
            </div>
          ) : null}
        </div>

        {/* Right Col: Verified Skill List */}
        <div className="space-y-4">
          <div className="bg-surface border border-border p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={16} /> Verified Skills Matrix
            </h3>

            {verifiedList.length === 0 ? (
              <p className="text-xs text-text-secondary">No verified skills yet. Complete an assessment on the left to verify your resume claims.</p>
            ) : (
              <div className="space-y-3">
                {verifiedList.map((v, i) => (
                  <div key={i} className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-text-primary">{v.skill}</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">Status: {v.status || 'Verified'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-primary">{v.verification_score}%</div>
                      <div className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded mt-0.5 inline-block">
                        {v.level}
                      </div>
                    </div>
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
