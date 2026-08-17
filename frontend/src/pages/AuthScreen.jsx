import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Sparkles, Key, Mail, User, AlertCircle } from 'lucide-react';

export const AuthScreen = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const triggerQuickDemo = async () => {
    try {
      setError(null);
      setLoading(true);
      await login('test@example.com', 'password123');
    } catch (err) {
      console.error(err);
      setError('Demo login failed. Make sure seed script was run.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
      {/* Brand logo container */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl text-white shadow-md shadow-primary/20">
          <GraduationCap size={28} />
        </div>
        <div>
          <h1 className="font-extrabold text-text-primary text-2xl tracking-tight leading-none">Placement Mentor</h1>
          <span className="text-xs text-secondary font-medium flex items-center gap-1 mt-1">
            <Sparkles size={10} /> 24/7 AI-Powered Career Coach
          </span>
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-surface border border-border rounded-card p-8 shadow-card space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-primary">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {isLogin ? 'Log in to continue your preparation' : 'Start filling your placement skill gaps today'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-danger/5 text-danger border border-danger/10 rounded-xl text-xs font-semibold leading-relaxed">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-background border border-border rounded-button pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
                />
                <User size={16} className="absolute left-3.5 top-3 text-text-secondary" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full bg-background border border-border rounded-button pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
              />
              <Mail size={16} className="absolute left-3.5 top-3 text-text-secondary" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-button pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary/50"
              />
              <Key size={16} className="absolute left-3.5 top-3 text-text-secondary" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-button text-sm shadow-md transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Quick Demo Login Card */}
        {isLogin && (
          <div className="bg-background/80 border border-border rounded-xl p-4.5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-text-primary">Demo Account Seeded</span>
              <span className="font-semibold text-secondary">Ready to test</span>
            </div>
            <button
              onClick={triggerQuickDemo}
              disabled={loading}
              className="w-full py-2 bg-secondary text-white hover:bg-secondary/90 font-bold rounded-button text-xs transition-colors shadow-sm"
            >
              One-Click Demo Login
            </button>
          </div>
        )}

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
