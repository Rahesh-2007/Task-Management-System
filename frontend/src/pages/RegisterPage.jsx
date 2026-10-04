import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
              Join thousands of teams that trust TaskFlow Pro for seamless project management.
            </p>
            <div className="auth-features">
              <div className="auth-feature-item">
                <ShieldCheck size={18} />
                <span>Enterprise-grade security</span>
              </div>
              <div className="auth-feature-item">
                <Zap size={18} />
                <span>Instant workspace setup</span>
              </div>
              <div className="auth-feature-item">
                <ArrowRight size={18} />
                <span>Collaborate with your team</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - register form */}
        <div className="auth-right-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <div className="auth-card-icon">
                <Zap size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="auth-title">Create account</h2>
                <p className="auth-subtitle">Start your free workspace today</p>
              </div>
            </div>

            {error && (
              <div className="auth-error-banner">
                <span className="auth-error-dot" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className={`auth-field ${focused === 'name' ? 'focused' : ''} ${name ? 'has-value' : ''}`}>
                <label className="auth-field-label" htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  className="auth-field-input"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused('')}
                  autoFocus
                />
              </div>

              <div className={`auth-field ${focused === 'email' ? 'focused' : ''} ${email ? 'has-value' : ''}`}>
                <label className="auth-field-label" htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  className="auth-field-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  autoComplete="email"
                />
              </div>

              <div className={`auth-field ${focused === 'password' ? 'focused' : ''} ${password ? 'has-value' : ''}`}>
                <label className="auth-field-label" htmlFor="reg-password">Password</label>
                <div className="auth-field-input-wrap">
                  <input
                    id="reg-password"
                    type={showPass ? 'text' : 'password'}
                    className="auth-field-input"
                    placeholder="Min. 4 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
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

              <div className={`auth-field ${focused === 'confirm' ? 'focused' : ''} ${confirm ? 'has-value' : ''}`}>
                <label className="auth-field-label" htmlFor="reg-confirm">Confirm Password</label>
                <input
                  id="reg-confirm"
                  type="password"
                  className="auth-field-input"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused('')}
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? <span className="auth-spinner" /> : <><UserPlus size={17} /> Create Account</>}
              </button>
            </form>

            <div className="auth-divider">
              <span>Already have an account?</span>
            </div>

            <Link to="/login" className="auth-register-link">
              Sign in instead
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
