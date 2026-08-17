import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CompanyLogo from '../components/CompanyLogo';
import {
  BarChart2,
  ArrowLeft,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  ExternalLink,
  Target,
  Plus
} from 'lucide-react';

export default function CompanyComparison({ compareList, setCompareList, setCurrentView, setSelectedCompanyId }) {
  const { profile, updateProfile } = useAuth();
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComparison();
  }, [compareList]);

  const fetchComparison = async () => {
    if (!compareList || compareList.length === 0) {
      // Default to 4 diverse seed companies if compareList is empty
      const defaultIds = ['tcs', 'infosys', 'amazon', 'zoho'];
      try {
        setLoading(true);
        setError(null);
        const res = await api.post('/company/compare', { companyIds: defaultIds });
        setComparisonData(res);
      } catch (err) {
        console.error('Error fetching default comparison:', err);
        setError('Failed to compute comparison matrix.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const companyIds = compareList.map(c => c.id);
      const res = await api.post('/company/compare', { companyIds });
      setComparisonData(res);
    } catch (err) {
      console.error('Error fetching comparison:', err);
      setError('Failed to compute comparison metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetTarget = async (companyName, roleTitle) => {
    try {
      await api.put('/auth/profile', {
        target_company: companyName,
        target_role: roleTitle
      });
      if (updateProfile) {
        updateProfile({ target_company: companyName, target_role: roleTitle });
      }
      alert(`Target company set to ${companyName} (${roleTitle})!`);
    } catch (err) {
      console.error('Error setting target:', err);
      alert('Failed to set target company.');
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={() => setCurrentView('companies')}
            className="px-3.5 py-2 bg-surface border border-border text-text-primary rounded-xl text-xs font-bold shadow-subtle hover:bg-background transition-all flex items-center gap-2 mb-2"
          >
            <ArrowLeft size={16} /> Back to Company Discovery
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Side-by-Side Target Company Comparison
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Compare candidate readiness, DSA rigor, interview readiness, and skill gaps across target companies.
          </p>
        </div>

        <button
          onClick={() => setCurrentView('companies')}
          className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary-hover transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Select Different Companies
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs font-bold text-text-secondary mt-3">Computing Comparative Match Metrics...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-danger/5 border border-danger/20 rounded-xl text-danger text-xs font-bold text-center">
          {error}
        </div>
      ) : comparisonData.length > 0 ? (
        <div className="bg-surface border border-border rounded-2xl shadow-subtle overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="p-4 text-xs font-extrabold text-text-primary uppercase tracking-wider w-48">Evaluation Metric</th>
                {comparisonData.map(item => (
                  <th key={item.companyId} className="p-4 text-center border-l border-border">
                    <div className="flex flex-col items-center gap-1">
                      <CompanyLogo 
                        company={{ 
                          id: item.companyId, 
                          name: item.companyName, 
                          logo: item.logo, 
                          logoUrl: item.logoUrl, 
                          website: item.website 
                        }} 
                        size="sm" 
                      />
                      <span className="font-extrabold text-text-primary text-base mt-1">{item.companyName}</span>
                      <span className="text-[10px] text-text-secondary font-semibold">{item.category}</span>
                      <span className="text-[10px] bg-background border border-border px-2 py-0.5 rounded font-semibold text-text-secondary mt-1">
                        {item.role?.title}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {/* Overall Match */}
              <tr className="bg-primary/5">
                <td className="p-4 font-bold text-text-primary flex items-center gap-2">
                  <Award size={16} className="text-primary" /> Overall Preparation Alignment
                </td>
                {comparisonData.map(item => (
                  <td key={item.companyId} className="p-4 text-center border-l border-border">
                    <div className="text-2xl font-black text-primary">{item.matchScore}%</div>
                    <div className="text-[10px] font-bold text-emerald-600 mt-0.5">{item.readinessLabel}</div>
                  </td>
                ))}
              </tr>

              {/* Skills Match */}
              <tr>
                <td className="p-4 font-semibold text-text-secondary">Skills Match</td>
                {comparisonData.map(item => (
                  <td key={item.companyId} className="p-4 text-center border-l border-border font-bold text-text-primary">
                    {item.subScores.skillsMatch}%
                  </td>
                ))}
              </tr>

              {/* DSA / Coding Readiness */}
              <tr>
                <td className="p-4 font-semibold text-text-secondary">DSA & Coding Readiness</td>
                {comparisonData.map(item => (
                  <td key={item.companyId} className="p-4 text-center border-l border-border font-bold text-text-primary">
                    {item.subScores.codingMatch}%
                  </td>
                ))}
              </tr>

              {/* Interview Readiness */}
              <tr>
                <td className="p-4 font-semibold text-text-secondary">Interview Readiness</td>
                {comparisonData.map(item => (
                  <td key={item.companyId} className="p-4 text-center border-l border-border font-bold text-text-primary">
                    {item.subScores.interviewMatch}%
                  </td>
                ))}
              </tr>

              {/* Project Match */}
              <tr>
                <td className="p-4 font-semibold text-text-secondary">Project Match</td>
                {comparisonData.map(item => (
                  <td key={item.companyId} className="p-4 text-center border-l border-border font-bold text-text-primary">
                    {item.subScores.projectMatch}%
                  </td>
                ))}
              </tr>

              {/* Critical Skill Gaps */}
              <tr>
                <td className="p-4 font-semibold text-text-secondary">High Priority Skill Gaps</td>
                {comparisonData.map(item => (
                  <td key={item.companyId} className="p-4 text-center border-l border-border font-bold">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${
                      item.skillGaps.high.length === 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                    }`}>
                      {item.skillGaps.high.length} Gaps
                    </span>
                  </td>
                ))}
              </tr>

              {/* Difficulty Level */}
              <tr>
                <td className="p-4 font-semibold text-text-secondary">Hiring Difficulty Level</td>
                {comparisonData.map(item => (
                  <td key={item.companyId} className="p-4 text-center border-l border-border font-bold text-text-primary">
                    {item.difficulty}
                  </td>
                ))}
              </tr>

              {/* Action Rows */}
              <tr className="bg-background/40">
                <td className="p-4 font-bold text-text-primary">Actions</td>
                {comparisonData.map(item => (
                  <td key={item.companyId} className="p-4 text-center border-l border-border space-y-2">
                    <button
                      onClick={() => {
                        if (setSelectedCompanyId) setSelectedCompanyId(item.companyId);
                        setCurrentView('company-profile');
                      }}
                      className="w-full py-1.5 bg-surface border border-border text-text-primary hover:bg-background rounded-lg text-xs font-bold shadow-sm"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleSetTarget(item.companyName, item.role.title)}
                      className="w-full py-1.5 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:bg-primary-hover"
                    >
                      Select Target
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
