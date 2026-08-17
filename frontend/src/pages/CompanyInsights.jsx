import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Search, 
  Send, 
  BookOpen, 
  UserCheck, 
  Bookmark, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const CompanyInsights = () => {
  const { profile } = useAuth();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(profile?.target_company || 'TCS');
  const [question, setQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, [selectedCompany]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/company/insights?company=${selectedCompany}`);
      setInsights(res);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load insights database.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    try {
      setAsking(true);
      setChatAnswer('');
      setError(null);
      
      const res = await api.post('/company/ask', {
        question: question.trim(),
        company: selectedCompany
      });
      
      setChatAnswer(res.answer);
    } catch (err) {
      console.error('RAG query error:', err);
      setError(err.message || 'Failed to retrieve answer from insights DB.');
    } finally {
      setAsking(false);
    }
  };

  const [companiesList, setCompaniesList] = useState(['TCS', 'Google', 'Amazon', 'Infosys', 'Wipro', 'Zoho', 'Accenture', 'Microsoft']);

  useEffect(() => {
    fetchCompanyOptions();
  }, []);

  const fetchCompanyOptions = async () => {
    try {
      const res = await api.get('/company/list');
      if (Array.isArray(res) && res.length > 0) {
        setCompaniesList(res.map(c => c.name));
      }
    } catch (e) {
      console.error('Error fetching company options for insights:', e);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Company Insights & RAG</h2>
          <p className="text-text-secondary mt-1">
            Search Placement logs, interview patterns, and past student placement experiences.
          </p>
        </div>

        {/* Company filter dropdown */}
        <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-1.5">
          <span className="text-xs font-bold text-text-secondary pl-2">Select Company:</span>
          <select
            value={selectedCompany}
            onChange={(e) => {
              setSelectedCompany(e.target.value);
              setChatAnswer('');
            }}
            className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary focus:outline-none"
          >
            {companiesList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* RAG Q&A (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface border border-border rounded-card p-6 shadow-subtle flex flex-col justify-between min-h-[400px]">
            <div className="space-y-4">
              <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                Ask Mentor about {selectedCompany} Placements
              </h3>
              <p className="text-xs text-text-secondary">
                Our RAG search queries past placement diaries and synthesizes a cited answer.
              </p>

              {/* Chat answer box */}
              {chatAnswer && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4.5 text-sm text-text-primary leading-relaxed whitespace-pre-line shadow-inner">
                  {chatAnswer}
                </div>
              )}

              {!chatAnswer && !asking && (
                <div className="border border-dashed border-border rounded-xl p-8 text-center text-xs text-text-secondary flex flex-col items-center justify-center min-h-[220px]">
                  <HelpCircle size={28} className="text-border mb-2" />
                  Ask something like "What programming languages does {selectedCompany} prefer?" or "Describe the NQT interview stages."
                </div>
              )}

              {asking && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-text-secondary gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  Searching insights repository and formulating answer...
                </div>
              )}

              {error && (
                <div className="p-3 bg-danger/5 text-danger border border-danger/10 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}
            </div>

            {/* Q&A Input form */}
            <form onSubmit={handleAskQuestion} className="flex gap-2 border-t border-border pt-4 mt-6">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={`Ask a question about ${selectedCompany} recruitment...`}
                className="flex-1 bg-background border border-border rounded-button px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
              />
              <button
                type="submit"
                disabled={asking || !question.trim()}
                className="p-2.5 bg-primary text-white hover:bg-primary-hover rounded-button shadow-md disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Local Insights Database Listing (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-text-primary text-base flex items-center gap-2 px-1">
            <BookOpen size={16} className="text-secondary" />
            Insights Archive
          </h3>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-secondary"></div>
            </div>
          ) : insights.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {insights.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-surface border border-border rounded-card p-5 shadow-subtle space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-secondary/10 text-secondary font-bold uppercase px-2 py-0.5 rounded-full">
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-text-secondary font-semibold">
                      {item.source}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-text-primary text-sm leading-snug">
                    {item.title}
                  </h4>
                  
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-border rounded-xl text-center text-xs text-text-secondary">
              No specific documents found for {selectedCompany}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyInsights;
