import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CompanyLogo from '../components/CompanyLogo';
import {
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Target
} from 'lucide-react';

export default function PlacementOpportunities({ setCurrentView, setSelectedCompanyId }) {
  const { profile, updateProfile } = useAuth();
  const [matrixData, setMatrixData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('highest');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatrix();
  }, [sortBy]);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/company/matrix?sortBy=${sortBy}`);
      setMatrixData(res);
    } catch (err) {
      console.error('Error fetching placement opportunities matrix:', err);
      setError('Failed to compute readiness matrix.');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = matrixData.filter(item => {
    const matchesSearch = item.companyName.toLowerCase().includes(search.toLowerCase()) || item.targetRole.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category.toUpperCase() === categoryFilter.toUpperCase();
    return matchesSearch && matchesCategory;
  });

  const handleSetTarget = async (companyName, roleTitle) => {
    try {
      await api.put('/auth/profile', {
        target_company: companyName,
        target_role: roleTitle
      });
      if (updateProfile) {
        updateProfile({ target_company: companyName, target_role: roleTitle });
      }
      alert(`Target updated to ${companyName} (${roleTitle})!`);
    } catch (err) {
      console.error('Error updating target:', err);
      alert('Failed to update target.');
    }
  };

  // Summary statistics
  const totalCompanies = matrixData.length;
  const avgReadiness = matrixData.length > 0 ? Math.round(matrixData.reduce((sum, item) => sum + item.readinessScore, 0) / matrixData.length) : 0;
  const highAlignmentCount = matrixData.filter(i => i.readinessScore >= 75).length;
  const topCompany = matrixData.length > 0 ? matrixData[0].companyName : 'TCS';

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
            <Layers size={14} /> My Placement Opportunities
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Target Company Readiness Matrix
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Real-time candidate preparation alignment across all 50 target companies.
          </p>
        </div>

        <button
          onClick={() => setCurrentView('companies')}
          className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-hover transition-all flex items-center gap-2"
        >
          <Building2 size={16} /> Explore Company Discovery
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-5 rounded-2xl shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-text-secondary uppercase">Tracked Target Companies</div>
            <div className="text-2xl font-black text-text-primary mt-1">{totalCompanies}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Building2 size={20} />
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-text-secondary uppercase">Average Readiness Alignment</div>
            <div className="text-2xl font-black text-primary mt-1">{avgReadiness}%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Award size={20} />
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-text-secondary uppercase">High Alignment Companies</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{highAlignmentCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-2xl shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-text-secondary uppercase">Top Opportunity Match</div>
            <div className="text-base font-extrabold text-primary truncate max-w-[140px] mt-1">{topCompany}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="bg-surface border border-border p-5 rounded-2xl shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3 text-text-secondary" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter company or role..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="IT / SERVICE">IT / Service</option>
              <option value="PRODUCT / TECHNOLOGY">Product / Technology</option>
              <option value="INDIAN PRODUCT / TECHNOLOGY">Indian Product / Fintech</option>
            </select>

            {/* Sort Controls */}
            <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-xl">
              <button
                onClick={() => setSortBy('highest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'highest' ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary'
                }`}
              >
                Highest Match
              </button>
              <button
                onClick={() => setSortBy('lowest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'lowest' ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary'
                }`}
              >
                Lowest Match
              </button>
              <button
                onClick={() => setSortBy('prepNeeded')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'prepNeeded' ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary'
                }`}
              >
                Most Prep Needed
              </button>
              <button
                onClick={() => setSortBy('bestOpportunity')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'bestOpportunity' ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary'
                }`}
              >
                Best Opportunity
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunities Table */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs font-bold text-text-secondary mt-3">Generating Placement Opportunities Matrix...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-danger/5 border border-danger/20 rounded-xl text-danger text-xs font-bold text-center">
          {error}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl shadow-subtle overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[11px] font-extrabold text-text-secondary uppercase">
                <th className="p-4">Target Company</th>
                <th className="p-4">Target Role</th>
                <th className="p-4 text-center">Readiness Alignment</th>
                <th className="p-4 text-center">Skills Match</th>
                <th className="p-4 text-center">Coding Match</th>
                <th className="p-4 text-center">High Priority Gaps</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredData.map((item) => {
                const isCurrentTarget = profile?.target_company?.toLowerCase() === item.companyName.toLowerCase();
                return (
                  <tr key={item.companyId} className={`hover:bg-background/40 transition-colors ${isCurrentTarget ? 'bg-primary/5 font-semibold' : ''}`}>
                    {/* Company */}
                    <td className="p-4 font-extrabold text-text-primary">
                      <div className="flex items-center gap-3">
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
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{item.companyName}</span>
                            {isCurrentTarget && (
                              <span className="text-[9px] bg-primary text-white font-bold px-1.5 py-0.5 rounded">Target</span>
                            )}
                          </div>
                          <span className="text-[10px] text-text-secondary font-medium">{item.category} • {item.difficulty}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4 text-text-secondary font-medium">
                      {item.targetRole}
                    </td>

                    {/* Readiness Score */}
                    <td className="p-4 text-center">
                      <div className="font-black text-sm text-primary">{item.readinessScore}%</div>
                      <div className="text-[10px] font-bold text-emerald-600">{item.readinessLabel}</div>
                    </td>

                    {/* Skills Match */}
                    <td className="p-4 text-center font-bold text-text-primary">
                      {item.skillsMatch}%
                    </td>

                    {/* Coding Match */}
                    <td className="p-4 text-center font-bold text-text-primary">
                      {item.codingMatch}%
                    </td>

                    {/* High Priority Gaps */}
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.highPriorityGapCount === 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {item.highPriorityGapCount} Gaps
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          if (setSelectedCompanyId) setSelectedCompanyId(item.companyId);
                          setCurrentView('company-profile');
                        }}
                        className="px-3 py-1.5 bg-surface border border-border text-text-primary hover:bg-background rounded-lg text-xs font-bold shadow-sm"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleSetTarget(item.companyName, item.targetRole)}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:bg-primary-hover"
                      >
                        Set Target
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
