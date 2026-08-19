import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Sparkles, Key, Mail, User, AlertCircle, CheckCircle2, ArrowRight, Lock } from 'lucide-react';

export const AuthScreen = () => {
  const { login, signup, authError, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (clearError) clearError();

    if (!email.trim() || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setLocalError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match. Please verify and re-type.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (isLogin) {
        await login(email.trim().toLowerCase(), password);
      } else {
        await signup(name.trim(), email.trim().toLowerCase(), password, confirmPassword);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setLocalError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerQuickDemo = async () => {
    setLocalError(null);
    if (clearError) clearError();
    try {
      setIsSubmitting(true);
      await login('test@example.com', 'password123');
    } catch (err) {
      console.error('Demo login error:', err);
      setLocalError(err.message || 'Demo login failed. Make sure backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/30">
          <GraduationCap size={28} />
        </div>
        <div>
          <h1 className="font-black text-text-primary text-2xl tracking-tight leading-none">
            AI Placement Mentor
          </h1>
          <span className="text-xs text-primary font-bold flex items-center gap-1 mt-1 bg-primary/10 px-2 py-0.5 rounded-full w-fit">
            <Sparkles size={11} /> 24/7 AI-Powered Placement Operating System
          </span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        {/* Toggle Mode Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-background border border-border p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setLocalError(null);
              if (clearError) clearError();
            }}
            className={`py-2 rounded-lg transition-all ${
              isLogin ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setLocalError(null);
              if (clearError) clearError();
            }}
            className={`py-2 rounded-lg transition-all ${
              !isLogin ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Create Account
          </button>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-text-primary">
            {isLogin ? 'Welcome back, Student!' : 'Create Candidate Account'}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {isLogin
              ? 'Enter your credentials to access your placement dashboard.'
              : 'Sign up to analyze your resume and match 30+ top tech companies.'}
          </p>
        </div>

        {/* Error notification alert */}
        {displayedError && (
          <div className="flex items-start gap-2.5 p-3.5 bg-danger/10 text-danger border border-danger/20 rounded-xl text-xs font-semibold leading-relaxed">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{displayedError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                />
                <User size={16} className="absolute left-3.5 top-3 text-text-secondary" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                required
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
              />
              <Mail size={16} className="absolute left-3.5 top-3 text-text-secondary" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
              />
              <Key size={16} className="absolute left-3.5 top-3 text-text-secondary" />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                />
                <Lock size={16} className="absolute left-3.5 top-3 text-text-secondary" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-3 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span>{isLogin ? 'Sign In to Dashboard' : 'Register & Begin Placement Prep'}</span>
                <ArrowRight size={14} />
              </div>
            )}
          </button>
        </form>

        {/* Instant Demo Login Button */}
        {isLogin && (
          <div className="bg-background border border-border rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-text-primary flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> College Demo Account
              </span>
              <span className="font-bold text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Pre-Seeded
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Login immediately with pre-loaded mock interviews, verified skills, and resume data.
            </p>
            <button
              type="button"
              onClick={triggerQuickDemo}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-secondary text-white hover:bg-secondary/90 font-extrabold rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Sparkles size={13} />
              One-Click Demo Login
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-text-secondary mt-6 font-medium text-center">
        AI Placement Mentor • Ready for College Placement Cell & Demo Presentations
      </p>
    </div>
  );
};

export default AuthScreen;
