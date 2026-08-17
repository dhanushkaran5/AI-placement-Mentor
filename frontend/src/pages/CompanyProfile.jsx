import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CompanyLogo from '../components/CompanyLogo';
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Layers,
  BookOpen,
  Award,
  Play,
  Compass,
  Zap,
  ExternalLink,
  Target,
  FileCode,
  Users
} from 'lucide-react';

export default function CompanyProfile({ companyId, setCurrentView }) {
  const { profile, updateProfile } = useAuth();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [error, setError] = useState(null);

  const compId = companyId || profile?.target_company || 'tcs';

  useEffect(() => {
    fetchProfileMatch();
  }, [compId, selectedRoleIndex]);

  const fetchProfileMatch = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch full company profile with user match calculations
      const compRes = await api.get(`/company/${compId}`);
      const selectedRole = compRes.roles[selectedRoleIndex] || compRes.roles[0];

      // Evaluate match score for specific selected role
      const matchRes = await api.post('/company/match', {
        company: compRes.id,
        role: selectedRole.id
      });

      setMatchData(matchRes);
    } catch (err) {
      console.error('Error fetching profile match:', err);
      setError('Failed to calculate company match metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetTarget = async () => {
    if (!matchData) return;
    try {
      await api.put('/auth/profile', {
        target_company: matchData.companyName,
        target_role: matchData.role.title
      });
      if (updateProfile) {
        updateProfile({ target_company: matchData.companyName, target_role: matchData.role.title });
      }
      alert(`Target company updated to ${matchData.companyName} (${matchData.role.title})!`);
    } catch (err) {
      console.error('Error updating target company:', err);
      alert('Failed to set target company.');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto space-y-8">
      {/* Top Back Navigation & Set Target CTA */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('companies')}
          className="px-3.5 py-2 bg-surface border border-border text-text-primary rounded-xl text-xs font-bold shadow-subtle hover:bg-background transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Company Discovery
        </button>

        {matchData && (
          <button
            onClick={handleSetTarget}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-hover transition-all flex items-center gap-2"
          >
            <Target size={16} /> Set {matchData.companyName} ({matchData.role.title}) as Target
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs font-bold text-text-secondary mt-3">Evaluating Preparation Alignment...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-danger/5 border border-danger/20 rounded-xl text-danger text-xs font-bold text-center">
          {error}
        </div>
      ) : matchData ? (
        <>
          {/* Header Banner */}
          <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-subtle space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <CompanyLogo 
                  company={{ 
                    id: companyId || matchData.companyId, 
                    name: matchData.companyName, 
                    logo: matchData.logo, 
                    logoUrl: matchData.logoUrl, 
                    website: matchData.website 
                  }} 
                  size="lg" 
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-secondary/10 text-secondary font-bold uppercase px-2.5 py-0.5 rounded-full">
                      {matchData.category}
                    </span>
                    <span className="text-[10px] bg-background border border-border text-text-secondary font-bold px-2.5 py-0.5 rounded-full">
                      Difficulty: {matchData.difficulty}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight mt-1">
                    {matchData.companyName}
                  </h1>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {matchData.industry} • {matchData.headquarters} •{' '}
                    <a href={matchData.website} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      Website <ExternalLink size={12} />
                    </a>
                  </p>
                </div>
              </div>

              {/* Match Score Dial */}
              <div className="p-5 rounded-2xl bg-background border border-border text-center flex items-center gap-6 min-w-[240px]">
                <div>
                  <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Preparation Alignment</div>
                  <div className="text-4xl font-black text-primary mt-0.5">{matchData.matchScore}%</div>
                  <div className="text-[11px] font-bold text-emerald-600 mt-1">{matchData.readinessLabel}</div>
                </div>
                <div className="h-12 w-px bg-border"></div>
                <div className="text-left space-y-1 text-[11px]">
                  <div className="text-text-secondary font-medium">Target Role: <strong className="text-text-primary">{matchData.role.title}</strong></div>
                  <div className="text-text-secondary font-medium">High Gaps: <strong className="text-red-500">{matchData.skillGaps.high.length}</strong></div>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed border-t border-border pt-4">
              {matchData.description}
            </p>

            {/* Role Tabs */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Briefcase size={14} className="text-primary" /> Select Target Role for Analysis:
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Find company object to list available roles */}
                {matchData.role && (
                  <button
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-primary text-white shadow-md"
                  >
                    {matchData.role.title} ({matchData.role.requirements.experienceLevel})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grid Layout: Match Breakdown & Skill Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Sub-scores Breakdown */}
            <div className="bg-surface border border-border p-6 rounded-2xl shadow-subtle space-y-5">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Award size={18} className="text-primary" /> Alignment Breakdown
              </h3>

              <div className="space-y-4">
                {Object.entries(matchData.subScores).map(([key, score]) => {
                  const labelMap = {
                    skillsMatch: 'Technical Skills Match',
                    codingMatch: 'Coding & DSA Readiness',
                    projectMatch: 'Project Portfolio Match',
                    interviewMatch: 'Mock Interview Performance',
                    resumeMatch: 'Resume Credibility Match'
                  };
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-text-secondary">{labelMap[key] || key}</span>
                        <span className="font-bold text-text-primary">{score}%</span>
                      </div>
                      <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-background border border-border rounded-xl space-y-2 pt-4">
                <div className="text-xs font-bold text-text-primary">Role Technical Stack:</div>
                <div className="flex flex-wrap gap-1.5">
                  {matchData.role.requirements.technicalSkills.concat(matchData.role.requirements.programmingLanguages).map(s => (
                    <span key={s} className="text-[10px] bg-surface border border-border px-2 py-0.5 rounded font-semibold text-text-primary">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2 & 3: Skill Gaps & Recommended Topics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Skill Gap Matrix */}
              <div className="bg-surface border border-border p-6 rounded-2xl shadow-subtle space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" /> Prioritized Skill Gap Analysis
                  </h3>
                  <span className="text-xs text-text-secondary font-medium">Calculated vs. Verified Profile</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* High Priority */}
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-600">HIGH PRIORITY</span>
                      <span className="text-xs font-bold text-red-600">{matchData.skillGaps.high.length}</span>
                    </div>
                    <p className="text-[10px] text-text-secondary">Core requirements needing immediate focus:</p>
                    <div className="space-y-1 pt-1">
                      {matchData.skillGaps.high.length > 0 ? (
                        matchData.skillGaps.high.map(g => (
                          <div key={g} className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                            <XCircle size={14} className="text-red-500 flex-shrink-0" /> {g}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={14} /> No Critical Gaps
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medium Priority */}
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600">MEDIUM PRIORITY</span>
                      <span className="text-xs font-bold text-amber-600">{matchData.skillGaps.medium.length}</span>
                    </div>
                    <p className="text-[10px] text-text-secondary">Recommended secondary skills:</p>
                    <div className="space-y-1 pt-1">
                      {matchData.skillGaps.medium.length > 0 ? (
                        matchData.skillGaps.medium.map(g => (
                          <div key={g} className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" /> {g}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Solid Coverage
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Low Priority */}
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600">LOW PRIORITY</span>
                      <span className="text-xs font-bold text-blue-600">{matchData.skillGaps.low.length}</span>
                    </div>
                    <p className="text-[10px] text-text-secondary">Nice to have / optional skills:</p>
                    <div className="space-y-1 pt-1">
                      {matchData.skillGaps.low.length > 0 ? (
                        matchData.skillGaps.low.map(g => (
                          <div key={g} className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                            <Layers size={14} className="text-blue-500 flex-shrink-0" /> {g}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs font-medium text-text-secondary">None</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment & Interview Patterns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assessment Pattern */}
                <div className="bg-surface border border-border p-6 rounded-2xl shadow-subtle space-y-3">
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <FileCode size={16} className="text-primary" /> Assessment Pattern
                  </h4>
                  <div className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded inline-block">
                    {matchData.assessmentPattern?.name || 'Recruitment Online Test'}
                  </div>
                  <p className="text-xs text-text-secondary"><strong>Timing:</strong> {matchData.assessmentPattern?.timings}</p>
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-bold text-text-primary">Selection Stages:</div>
                    {matchData.assessmentPattern?.stages?.map((st, i) => (
                      <div key={i} className="text-xs text-text-secondary font-medium flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-background border border-border text-[10px] font-bold flex items-center justify-center text-primary">
                          {i + 1}
                        </span>
                        {st}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interview Pattern */}
                <div className="bg-surface border border-border p-6 rounded-2xl shadow-subtle space-y-3">
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Users size={16} className="text-secondary" /> Interview Pattern
                  </h4>
                  <div className="text-xs font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded inline-block">
                    {matchData.interviewPattern?.rounds?.length || 3} Interview Loops
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {matchData.interviewPattern?.format}
                  </p>
                  <div className="space-y-1 pt-2">
                    <div className="text-[11px] font-bold text-text-primary">Focus Areas:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchData.interviewPattern?.focusAreas?.map((fa, i) => (
                        <span key={i} className="text-[10px] bg-background border border-border px-2 py-0.5 rounded text-text-secondary font-medium">
                          {fa}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Simulator & Roadmap */}
              <div className="p-6 bg-gradient-to-r from-primary/10 via-surface to-secondary/10 border border-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-text-primary text-base">Ready to test your readiness?</h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Launch candidate simulation for {matchData.companyName} or recalculate your adaptive study roadmap.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentView('simulator')}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-hover transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <Play size={14} /> Start {matchData.companyName} Simulation
                  </button>

                  <button
                    onClick={() => setCurrentView('roadmap')}
                    className="px-4 py-2.5 bg-surface border border-border text-text-primary rounded-xl text-xs font-bold shadow-sm hover:bg-background transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <Compass size={14} /> Generate Target Roadmap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
