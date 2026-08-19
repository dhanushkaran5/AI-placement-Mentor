import React from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('React Error Boundary Caught an Error:', error, errorInfo);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoToDashboard = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-800/90 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm text-center sm:text-left">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6 text-red-400 mx-auto sm:mx-0">
              <AlertTriangle size={28} />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              {isChunkError ? 'Application Update Available' : 'Something went wrong.'}
            </h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {isChunkError
                ? 'A new version of AI Placement Mentor has been deployed, or a module failed to load. Please reload the application to continue.'
                : 'AI Placement Mentor encountered an unexpected error.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={this.handleTryAgain}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20 text-sm"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={this.handleGoToDashboard}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <LayoutDashboard size={16} />
                Go to Dashboard
              </button>
            </div>

            <div className="border-t border-slate-700/60 pt-4">
              <button
                onClick={this.toggleDetails}
                className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1.5 focus:outline-none mx-auto sm:mx-0"
              >
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {this.state.showDetails ? 'Hide technical diagnostics' : 'Show technical diagnostics'}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-red-300 overflow-x-auto max-h-48 custom-scrollbar text-left">
                  <p className="font-semibold text-red-400 mb-1">{this.state.error?.toString()}</p>
                  <pre className="text-slate-500 whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack || 'No component stack available.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
