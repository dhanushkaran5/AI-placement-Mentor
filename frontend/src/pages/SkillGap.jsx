import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  FileText, 
  ArrowRight,
  TrendingUp,
  Map
} from 'lucide-react';

export const SkillGap = ({ setCurrentView }) => {
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGapAnalysis();
  }, [profile?.target_role, profile?.target_company]);

  const fetchGapAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/resume/gap');
      setData(res);
    } catch (err) {
      console.error('Error fetching gap analysis:', err);
      if (err.message.includes('upload')) {
        setError('No resume uploaded yet.');
      } else {
        setError(err.message || 'Failed to fetch gap analysis.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center text-text-secondary mb-4">
          <FileText size={24} />
        </div>
        <h3 className="font-bold text-text-primary text-lg">Resume Check Needed</h3>
        <p className="text-sm text-text-secondary mt-1.5 max-w-sm leading-relaxed">
          {error === 'No resume uploaded yet.' 
            ? 'We need your resume to run a comparison. Upload your PDF resume to evaluate your readiness.'
            : 'Please set your target company and role, and upload your resume to see skill gaps.'}
        </p>
        <button
          onClick={() => setCurrentView('resume')}
          className="mt-6 py-2.5 px-4 bg-primary text-white font-semibold rounded-button text-sm flex items-center gap-2 hover:bg-primary-hover shadow-md transition-all duration-200"
        >
          Upload Resume PDF
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  const { readinessScore, matchingSkills = [], missingSkills = [] } = data;

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">Skill Gap Analysis</h2>
        <p className="text-text-secondary mt-1">
          Comparing your resume skills against key expectations for a <strong className="text-text-primary">{profile?.target_role}</strong> at <strong className="text-text-primary">{profile?.target_company}</strong>.
        </p>
      </div>

      {/* Profile Compatibility Banner */}
      <div className="bg-surface border border-border rounded-card p-6 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Circular progress small */}
          <div className="relative w-20 h-20 flex items-center justify-center bg-background rounded-full">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="34" className="stroke-border fill-transparent" strokeWidth="6" />
              <circle 
                cx="40" 
                cy="40" 
                r="34" 
                className="stroke-secondary fill-transparent transition-all duration-700" 
                strokeWidth="6" 
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 - (readinessScore / 100) * 2 * Math.PI * 34}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-sm font-extrabold text-text-primary">{readinessScore}%</span>
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-lg">Role Compatibility</h3>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              Your profile is matched with {matchingSkills.length} out of {matchingSkills.length + missingSkills.length} required competencies.
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('roadmap')}
          className="py-3 px-5 bg-primary text-white hover:bg-primary-hover font-semibold rounded-button text-sm shadow-md transition-colors flex items-center gap-2"
        >
          <Map size={16} />
          View Custom Study Roadmap
        </button>
      </div>

      {/* Grid for matching and missing skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Matching Skills Column */}
        <div className="bg-surface border border-border rounded-card p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <div className="p-1.5 bg-success/10 rounded-lg text-success">
              <CheckCircle2 size={18} />
            </div>
            <h3 className="font-bold text-text-primary text-base">Skills You Have ({matchingSkills.length})</h3>
          </div>
          
          <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {matchingSkills.length > 0 ? (
              matchingSkills.map((skill, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-success/5 border border-success/10 rounded-xl"
                >
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  <span className="text-sm font-semibold text-text-primary">{skill}</span>
                  <span className="ml-auto text-[10px] bg-success/10 text-success px-2 py-0.5 font-bold uppercase rounded-full">Matched</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-text-secondary">
                No matching skills found in the profile.
              </div>
            )}
          </div>
        </div>

        {/* Missing Skills Column */}
        <div className="bg-surface border border-border rounded-card p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <div className="p-1.5 bg-warning/10 rounded-lg text-warning">
              <AlertTriangle size={18} />
            </div>
            <h3 className="font-bold text-text-primary text-base">Skills You're Missing ({missingSkills.length})</h3>
          </div>
          
          <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-surface border border-warning/30 rounded-xl shadow-sm"
                >
                  <span className="w-2 h-2 bg-warning rounded-full"></span>
                  <span className="text-sm font-semibold text-text-primary">{skill}</span>
                  <span className="ml-auto text-[10px] text-warning border border-warning/50 px-2 py-0.5 font-bold uppercase rounded-full">Gap Identified</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-text-secondary flex flex-col items-center justify-center">
                <TrendingUp className="text-success mb-1" size={24} />
                <span className="font-bold text-success text-xs">100% Match!</span>
                <span className="text-[11px] mt-0.5 text-text-secondary">You have all the core skills for this role!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillGap;
