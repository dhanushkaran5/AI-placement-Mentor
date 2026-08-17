import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CompanyLogo from '../components/CompanyLogo';
import { Building2, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Compass } from 'lucide-react';

export default function CompanyMatcher({ setCurrentView }) {
  const { profile } = useAuth();
  const [companiesList, setCompaniesList] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(profile?.target_company || 'TCS');
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanyList();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchMatch(selectedCompany);
    }
  }, [selectedCompany]);

  const fetchCompanyList = async () => {
    try {
      const res = await api.get('/company/list');
      setCompaniesList(res);
    } catch (e) {
      console.error('Error fetching company list:', e);
    }
  };

  const fetchMatch = async (comp) => {
    setLoading(true);
    try {
      const res = await api.post('/company/match', { company: comp });
      setMatchData({
        company: res.companyName,
        matchPercentage: res.matchScore,
        minReadiness: res.difficulty === 'Very Hard' ? 80 : (res.difficulty === 'Hard' ? 70 : 60),
        description: res.description,
        status: res.readinessLabel,
        breakdown: res.skillBreakdown.map(b => ({
          skill: b.skill,
          matched: b.matched,
          verifiedScore: b.score,
          status: b.status
        }))
      });
    } catch (e) {
      console.error('Error fetching match:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
            <Building2 size={14} /> Profile Match Analytics
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Company Match Score Evaluator</h1>
          <p className="text-text-secondary text-sm mt-1">
            Compare your verified skills, projects, and assessment scores against recruitment expectations of top companies.
          </p>
        </div>

        <button
          onClick={() => setCurrentView && setCurrentView('companies')}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary-hover transition-all flex items-center gap-2"
        >
          <Compass size={14} /> Full Company Discovery
        </button>
      </div>

      {/* Dynamic Company Selector Dropdown / Pills */}
      <div className="bg-surface border border-border p-4 rounded-2xl shadow-subtle space-y-3">
        <div className="text-xs font-bold text-text-primary">Select Target Company from Database (51 Companies Available):</div>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full md:w-96 px-4 py-2.5 bg-background border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-primary"
        >
          {companiesList.map(comp => (
            <option key={comp.id} value={comp.name}>
              {comp.name} ({comp.category}) — {comp.difficulty}
            </option>
          ))}
        </select>
      </div>

      {/* Match Card */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-text-secondary">Calculating match score for {selectedCompany}...</div>
      ) : matchData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-surface border border-border p-6 rounded-2xl space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded uppercase">
                {matchData.status}
              </span>
              
              <div className="flex items-center gap-3">
                <CompanyLogo company={{ name: matchData.company }} size="md" />
                <h2 className="text-xl font-extrabold text-text-primary">{matchData.company} Match Score</h2>
              </div>
              
              <p className="text-xs text-text-secondary">{matchData.description}</p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-border text-center space-y-1">
              <div className="text-xs font-bold text-text-secondary">Overall Match Percentage</div>
              <div className="text-4xl font-black text-primary">{matchData.matchPercentage}%</div>
              <div className="text-[11px] text-text-secondary font-semibold pt-1">Min Target Readiness: {matchData.minReadiness}%</div>
            </div>

            <button
              onClick={() => setCurrentView && setCurrentView('simulator')}
              className="w-full py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary-hover flex items-center justify-center gap-2"
            >
              Start {matchData.company} Recruitment Simulation <ArrowRight size={14} />
            </button>
          </div>

          {/* Criteria Breakdown */}
          <div className="lg:col-span-2 bg-surface border border-border p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-text-primary">Required Skill Criteria Breakdown</h3>
            <div className="space-y-3">
              {matchData.breakdown.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-background border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.matched ? (
                      <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={20} />
                    ) : (
                      <XCircle className="text-red-500 flex-shrink-0" size={20} />
                    )}
                    <div>
                      <div className="text-xs font-bold text-text-primary">{item.skill}</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">Verified Score: {item.verifiedScore}%</div>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === 'Strong Match' ? 'bg-emerald-500/10 text-emerald-600' : (item.status === 'Partial Match' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600')
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
