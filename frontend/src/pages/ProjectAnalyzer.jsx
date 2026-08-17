import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FolderGit2, CheckCircle2, ArrowRight, Code, Award, Lightbulb } from 'lucide-react';

export default function ProjectAnalyzer({ setCurrentView }) {
  const [formData, setFormData] = useState({
    projectName: 'Smart E-Commerce Portal',
    description: 'Developed a full-stack Spring Boot & React platform with JWT auth, MySQL database indexing, and Stripe payment gateway.',
    techStack: 'Java, Spring Boot, React, MySQL, REST API',
    githubUrl: 'https://github.com/student/ecommerce-app',
    liveUrl: 'https://ecommerce-demo.vercel.app'
  });
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/projects/analyze', formData);
      setAnalysis(data.analysis);
    } catch (err) {
      console.error('Project analyze error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
          <FolderGit2 size={14} /> Portfolio Architecture Evaluator
        </div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">AI Project Portfolio Analyzer</h1>
        <p className="text-text-secondary text-sm mt-1">
          Evaluate technical depth, architecture quality, resume impact, and generate target project interview questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="bg-surface border border-border p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-text-primary">Submit Project for Analysis</h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-text-secondary font-semibold mb-1">Project Name</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full p-3 rounded-xl bg-background border border-border text-text-primary focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-text-secondary font-semibold mb-1">Technologies Used</label>
              <input
                type="text"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                className="w-full p-3 rounded-xl bg-background border border-border text-text-primary focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-text-secondary font-semibold mb-1">Project Description & Architecture</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 rounded-xl bg-background border border-border text-text-primary focus:outline-none focus:border-primary resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-text-secondary font-semibold mb-1">GitHub URL (Optional)</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full p-3 rounded-xl bg-background border border-border text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Analyzing Architecture & Impact...' : 'Analyze Project Portfolio Entry'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {analysis ? (
            <div className="bg-surface border border-border p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{formData.projectName} Analysis</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Architecture Quality: {analysis.architectureQuality}</p>
                </div>
                <div className="text-2xl font-extrabold text-primary">{analysis.projectScore}% Score</div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-background border border-border text-center">
                  <div className="text-xs font-bold text-text-secondary">Technical Depth</div>
                  <div className="text-base font-extrabold text-emerald-600 mt-1">{analysis.technicalDepth}</div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border text-center">
                  <div className="text-xs font-bold text-text-secondary">Resume Value</div>
                  <div className="text-base font-extrabold text-primary mt-1">{analysis.resumeValue}</div>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border text-center">
                  <div className="text-xs font-bold text-text-secondary">Interview Readiness</div>
                  <div className="text-base font-extrabold text-amber-600 mt-1">{analysis.interviewReadiness}%</div>
                </div>
              </div>

              {/* Potential Interview Questions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-amber-500" /> Expected Project Interview Questions
                </h4>
                <div className="space-y-2">
                  {analysis.potentialInterviewQuestions.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-background border border-border text-xs text-text-primary font-medium">
                      Q{idx + 1}: {q}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border p-12 rounded-2xl text-center text-xs font-bold text-text-secondary">
              Submit your project details on the left to receive deep architectural evaluation and interview questions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
