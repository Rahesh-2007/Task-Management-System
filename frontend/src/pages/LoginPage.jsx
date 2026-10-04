import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background orbs */}
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-bg-orb auth-bg-orb-3" />

      <div className="auth-container">
        {/* Left panel - branding */}
        <div className="auth-left-panel">
          <div className="auth-left-content">
            <div className="auth-logo-mark">
              <Zap size={32} strokeWidth={2.5} />
            </div>
            <h1 className="auth-left-title">TaskFlow Pro</h1>
            <p className="auth-left-subtitle">
              The intelligent task management platform for high-performance teams.
            </p>
            <div className="auth-features">
              <div className="auth-feature-item">
                <ShieldCheck size={18} />
                <span>Secure workspace collaboration</span>
              </div>
              <div className="auth-feature-item">
                <Zap size={18} />
                <span>Real-time task synchronization</span>
              </div>
              <div className="auth-feature-item">
                <ArrowRight size={18} />
                <span>Smart priority management</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - login form */}
        <div className="auth-right-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <div className="auth-card-icon">
                <Zap size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="auth-title">Welcome back</h2>
                <p className="auth-subtitle">Sign in to your workspace</p>
              </div>
            </div>

            {error && (
              <div className="auth-error-banner">
                <span className="auth-error-dot" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className={`auth-field ${focused === 'email' ? 'focused' : ''} ${email ? 'has-value' : ''}`}>
                <label className="auth-field-label" htmlFor="login-email">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="auth-field-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className={`auth-field ${focused === 'password' ? 'focused' : ''} ${password ? 'has-value' : ''}`}>
                <label className="auth-field-label" htmlFor="login-password">
                  Password
                </label>
                <div className="auth-field-input-wrap">
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="auth-field-input"
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <LogIn size={17} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>Don't have an account?</span>
            </div>

            <Link to="/register" className="auth-register-link">
              Create a free account
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
