import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Server, 
  Database, 
  Cpu, 
  Lock, 
  Building2, 
  FileText, 
  Code2, 
  Users 
} from 'lucide-react';

export const SystemHealthModal = ({ isOpen, onClose }) => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/health/diagnostics');
      setDiagnostics(res);
    } catch (err) {
      console.error('Error fetching diagnostics:', err);
      setError(err.message || 'Backend server is currently offline or unreachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Activity size={22} />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">System Health & Diagnostics</h3>
              <p className="text-xs text-text-secondary">Platform infrastructure and intelligence services status</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              <span className="text-xs font-medium text-text-secondary">Running system diagnostics...</span>
            </div>
          ) : error ? (
            <div className="p-5 bg-red-50 border border-red-200 rounded-xl space-y-2 text-center">
              <div className="flex items-center justify-center gap-2 text-red-700 font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Backend Service Warning</span>
              </div>
              <p className="text-xs text-red-600">{error}</p>
              <div className="pt-2">
                <button
                  onClick={fetchDiagnostics}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Retry Diagnostics
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
                <span className="font-bold text-text-secondary uppercase tracking-wider">Subsystem Component</span>
                <span className="font-bold text-text-secondary uppercase tracking-wider">Status</span>
              </div>

              {diagnostics?.services && Object.entries(diagnostics.services).map(([key, service]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-border text-xs"
                >
                  <div className="flex items-center gap-3">
                    {key === 'frontend' && <Activity size={16} className="text-primary" />}
                    {key === 'backend' && <Server size={16} className="text-indigo-500" />}
                    {key === 'database' && <Database size={16} className="text-emerald-500" />}
                    {key === 'authentication' && <Lock size={16} className="text-amber-500" />}
                    {key === 'aiService' && <Cpu size={16} className="text-purple-500" />}
                    {key === 'companyData' && <Building2 size={16} className="text-blue-500" />}
                    {key === 'resumeEngine' && <FileText size={16} className="text-teal-500" />}
                    {key === 'codingEngine' && <Code2 size={16} className="text-orange-500" />}
                    {key === 'interviewEngine' && <Users size={16} className="text-cyan-500" />}

                    <div>
                      <span className="font-bold text-text-primary">{service.label}</span>
                      {service.count && <span className="text-text-secondary ml-1.5 font-mono">({service.count} datasets)</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {service.ok ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px]">
                        <CheckCircle2 size={12} />
                        Active / Healthy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold text-[11px]">
                        <AlertTriangle size={12} />
                        Fallback
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface flex items-center justify-between">
          <span className="text-[11px] text-text-secondary">
            Diagnostics polled at: {diagnostics?.timestamp ? new Date(diagnostics.timestamp).toLocaleTimeString() : 'N/A'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDiagnostics}
              className="px-3 py-1.5 bg-background hover:bg-border text-text-primary text-xs font-bold rounded-lg border border-border flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthModal;
