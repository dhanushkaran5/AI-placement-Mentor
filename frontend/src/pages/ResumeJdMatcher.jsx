import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Target, 
  BookOpen, 
  HelpCircle, 
  RefreshCw,
  Zap,
  TrendingUp
} from 'lucide-react';

export const ResumeJdMatcher = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [useStoredResume, setUseStoredResume] = useState(true);
  const [customResumeText, setCustomResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const sampleJD = `Senior Software Development Engineer (SDE-1)
Requirements:
- Strong proficiency in Core Java, Spring Boot, and REST API development.
- Deep expertise in Data Structures, Algorithms, and Object-Oriented System Design.
- Hands-on experience with SQL databases (MySQL/PostgreSQL), query optimization, and Redis caching.
- Familiarity with Microservices architecture, Docker containerization, AWS cloud services, and Git CI/CD pipelines.
- Excellent problem-solving, debugging, and cross-functional communication skills.`;

  const handleMatch = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please paste a Job Description to compare.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/resume/match-jd', {
        jobDescription: jobDescription.trim(),
        customResumeText: useStoredResume ? null : customResumeText.trim()
      });
      setResults(res);
    } catch (err) {
      console.error('Error matching resume with JD:', err);
      setError(err.message || 'Failed to match resume with Job Description.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSampleJD = () => {
    setJobDescription(sampleJD);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-teal-950 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Target size={14} />
            ATS Keyword & Role Gap Analysis
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Resume ↔ Job Description Matcher
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Paste any company's job description to evaluate your resume against their exact ATS criteria, discover missing keywords, and get tailored interview questions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                Target Job Description
              </h2>
              <button
                type="button"
                onClick={handleUseSampleJD}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Use Sample JD
              </button>
            </div>

            <form onSubmit={handleMatch} className="space-y-4">
              <div>
                <textarea
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste target Job Description (roles, responsibilities, tech stack requirements)..."
                  className="w-full bg-background border border-border rounded-xl p-3.5 text-xs text-text-primary focus:outline-none focus:border-primary/50 font-mono leading-relaxed"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-secondary">Resume Source</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUseStoredResume(true)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                        useStoredResume ? 'bg-primary text-white' : 'bg-background text-text-secondary border border-border'
                      }`}
                    >
                      Uploaded Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseStoredResume(false)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                        !useStoredResume ? 'bg-primary text-white' : 'bg-background text-text-secondary border border-border'
                      }`}
                    >
                      Paste Custom Text
                    </button>
                  </div>
                </div>

                {!useStoredResume && (
                  <textarea
                    rows={4}
                    value={customResumeText}
                    onChange={(e) => setCustomResumeText(e.target.value)}
                    placeholder="Paste custom resume text or skills..."
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-primary/50 font-mono"
                  />
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Analyzing ATS Alignment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Run JD Match & Gap Analysis</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-4">
          {!results ? (
            <div className="h-full flex flex-col items-center justify-center p-10 bg-surface border border-border rounded-2xl text-center space-y-3 min-h-[350px]">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <Target size={24} />
              </div>
              <h3 className="text-base font-bold text-text-primary">Ready to Match</h3>
              <p className="text-xs text-text-secondary max-w-sm">
                Paste any job description and click Run JD Match to see match score, ATS rating, missing critical keywords, and targeted interview questions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Score Gauges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface border border-border rounded-2xl p-5 text-center shadow-sm">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Overall Match</span>
                  <div className="text-3xl font-extrabold text-primary mt-1">
                    {results.overallMatch}%
                  </div>
                  <span className="text-[11px] text-text-secondary">Skills & Requirements Alignment</span>
                </div>

                <div className="bg-surface border border-border rounded-2xl p-5 text-center shadow-sm">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">ATS Score</span>
                  <div className="text-3xl font-extrabold text-secondary mt-1">
                    {results.atsScore}/100
                  </div>
                  <span className="text-[11px] text-text-secondary">Keyword Parser Index</span>
                </div>
              </div>

              {/* Matched vs Missing Skills */}
              <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Matched Skills ({results.matchedSkills?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {results.matchedSkills?.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-red-500" />
                    Missing / Required Keywords ({results.missingSkills?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {results.missingSkills?.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resume Improvements */}
              {results.resumeImprovements?.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" />
                    High-Impact Resume Improvements
                  </h4>
                  <ul className="space-y-2">
                    {results.resumeImprovements.map((imp, idx) => (
                      <li key={idx} className="text-xs text-text-secondary flex items-start gap-2">
                        <span className="w-4 h-4 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tailored Interview Questions */}
              {results.interviewQuestions?.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-indigo-500" />
                    Tailored Interview Questions for This Role
                  </h4>
                  <div className="space-y-2">
                    {results.interviewQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 bg-background rounded-xl border border-border text-xs text-text-primary font-medium">
                        "{q}"
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeJdMatcher;
