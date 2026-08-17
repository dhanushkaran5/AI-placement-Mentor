import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CompanyLogo from '../components/CompanyLogo';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  PlusCircle,
  XCircle,
  Briefcase,
  ShieldCheck,
  Compass
} from 'lucide-react';

export default function CompanyDiscovery({ setCurrentView, setSelectedCompanyId, compareList, setCompareList }) {
  const { profile, updateProfile } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [rolesList, setRolesList] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, [search, categoryFilter, difficultyFilter, selectedRoleFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      let queryStr = `/company/list?search=${encodeURIComponent(search)}&category=${categoryFilter}&difficulty=${difficultyFilter}`;
      if (selectedRoleFilter !== 'ALL') {
        queryStr += `&role=${encodeURIComponent(selectedRoleFilter)}`;
      }
      const res = await api.get(queryStr);
      setCompanies(res);

      // Extract unique roles for dropdown
      const rolesSet = new Set();
      res.forEach(c => c.roles.forEach(r => rolesSet.add(r.title)));
      setRolesList(Array.from(rolesSet).sort());
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Failed to load company database.');
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
      console.error('Error setting target company:', err);
      alert('Failed to set target company.');
    }
  };

  const toggleCompare = (comp) => {
    const exists = compareList.some(item => item.id === comp.id);
    if (exists) {
      setCompareList(compareList.filter(item => item.id !== comp.id));
    } else {
      if (compareList.length >= 4) {
        alert('You can compare up to 4 companies simultaneously.');
        return;
      }
      setCompareList([...compareList, comp]);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Very Hard':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'Hard':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
            <Compass size={14} /> Multi-Company Placement Intelligence Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Target Company Intelligence & Discovery
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Explore 50+ company recruitment patterns, role requirements, difficulty levels, and personalized match scores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {compareList.length > 0 && (
            <button
              onClick={() => setCurrentView('compare')}
              className="px-4 py-2.5 bg-secondary text-white rounded-xl text-xs font-bold shadow-md hover:bg-secondary-hover transition-all flex items-center gap-2"
            >
              <BarChart2 size={16} /> Compare Selected ({compareList.length}/4)
            </button>
          )}
          <button
            onClick={() => setCurrentView('matrix')}
            className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-hover transition-all flex items-center gap-2"
          >
            <Layers size={16} /> My Opportunities Matrix
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-surface border border-border p-5 rounded-2xl shadow-subtle space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-text-secondary" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, tech skill, or role..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary font-semibold"
          >
            <option value="ALL">All Categories (50 Companies)</option>
            <option value="IT / SERVICE">IT / Service Companies (22)</option>
            <option value="PRODUCT / TECHNOLOGY">Product / Tech Companies (18)</option>
            <option value="INDIAN PRODUCT / TECHNOLOGY">Indian Tech & Fintech (10)</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary font-semibold"
          >
            <option value="ALL">All Difficulties</option>
            <option value="Easy">Easy Level</option>
            <option value="Medium">Medium Level</option>
            <option value="Hard">Hard Level</option>
            <option value="Very Hard">Very Hard (Tier-1)</option>
          </select>

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary font-semibold"
          >
            <option value="ALL">All Tech Roles</option>
            {rolesList.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Selected Compare Bar */}
        {compareList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs font-bold text-text-secondary mr-1">Comparison Tray:</span>
            {compareList.map(c => (
              <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold">
                {c.name}
                <button onClick={() => toggleCompare(c)} className="hover:text-red-500">
                  <XCircle size={14} />
                </button>
              </span>
            ))}
            <button
              onClick={() => setCompareList([])}
              className="text-xs font-semibold text-text-secondary hover:text-danger ml-auto"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Company Grid */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs font-bold text-text-secondary mt-3">Loading Placement Intelligence Database...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-danger/5 border border-danger/20 rounded-xl text-danger text-xs font-bold text-center">
          {error}
        </div>
      ) : companies.length === 0 ? (
        <div className="p-12 border border-dashed border-border rounded-2xl text-center space-y-2">
          <Building2 size={32} className="mx-auto text-text-secondary opacity-40" />
          <h3 className="text-base font-bold text-text-primary">No matching companies found</h3>
          <p className="text-xs text-text-secondary">Try relaxing your search terms or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((comp) => {
            const isCompared = compareList.some(item => item.id === comp.id);
            const isCurrentTarget = profile?.target_company?.toLowerCase() === comp.name.toLowerCase();
            const defaultRole = comp.roles[0];

            return (
              <div
                key={comp.id}
                className={`bg-surface border rounded-2xl p-6 shadow-subtle hover:shadow-md transition-all flex flex-col justify-between space-y-5 relative ${
                  isCurrentTarget ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                }`}
              >
                <div>
                  {/* Top Badge & Target Status */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] bg-secondary/10 text-secondary font-bold uppercase px-2.5 py-1 rounded-md tracking-wider">
                      {comp.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getDifficultyBadge(comp.difficulty)}`}>
                      {comp.difficulty}
                    </span>
                  </div>

                  {/* Company Name & Logo */}
                  <div className="flex items-center gap-3 mt-4">
                    <CompanyLogo company={comp} size="md" />
                    <div>
                      <h3 className="font-extrabold text-text-primary text-lg flex items-center gap-2">
                        {comp.name}
                        {isCurrentTarget && (
                          <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full">Target</span>
                        )}
                      </h3>
                      <p className="text-xs text-text-secondary font-medium">{comp.industry} • {comp.headquarters}</p>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed mt-3 line-clamp-2">
                    {comp.description}
                  </p>

                  {/* Key Roles List */}
                  <div className="mt-4 pt-3 border-t border-border space-y-2">
                    <div className="text-[11px] font-bold text-text-primary flex items-center gap-1.5">
                      <Briefcase size={13} className="text-primary" /> Supported Roles ({comp.roles.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {comp.roles.map(r => (
                        <span key={r.id} className="text-[10px] bg-background border border-border px-2 py-0.5 rounded-md font-semibold text-text-secondary">
                          {r.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Assessment Highlights */}
                  <div className="mt-3 bg-background/60 p-3 rounded-xl border border-border space-y-1">
                    <div className="text-[11px] font-semibold text-text-primary truncate">
                      <strong>Pattern:</strong> {comp.assessmentPattern?.name || 'Recruitment Drive'}
                    </div>
                    <div className="text-[10px] text-text-secondary truncate">
                      <strong>Stages:</strong> {comp.assessmentPattern?.stages?.slice(0, 3).join(' ➔ ')}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-4 border-t border-border flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (setSelectedCompanyId) setSelectedCompanyId(comp.id);
                        setCurrentView('company-profile');
                      }}
                      className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5"
                    >
                      View Profile <ArrowRight size={14} />
                    </button>

                    <button
                      onClick={() => toggleCompare(comp)}
                      className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        isCompared
                          ? 'bg-secondary text-white border-secondary shadow-sm'
                          : 'bg-background border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {isCompared ? <CheckCircle2 size={14} /> : <PlusCircle size={14} />} Compare
                    </button>
                  </div>

                  {!isCurrentTarget && (
                    <button
                      onClick={() => handleSetTarget(comp.name, defaultRole.title)}
                      className="w-full py-1.5 bg-background border border-border text-text-secondary hover:text-primary hover:border-primary text-[11px] font-bold rounded-xl transition-all"
                    >
                      Set as Target ({defaultRole.title})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
