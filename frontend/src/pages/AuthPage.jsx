import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  List,
  Calendar,
  Users,
  BarChart2,
  Check,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup } = useWorkspace();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address or username.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(trimmedEmail, password);
      setIsLoading(false);

      if (result.success) {
        setSuccessMsg('Logged in successfully! Redirecting...');
        setTimeout(() => {
          navigate('/app');
        }, 200);
      } else {
        setErrorMsg(result.message || 'Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Login failed. Please try again.');
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup({ name, email: email.trim(), password });
      setIsLoading(false);

      if (result.success) {
        setSuccessMsg('Account created successfully in database! Redirecting...');
        setTimeout(() => {
          navigate('/app');
        }, 300);
      } else {
        setErrorMsg(result.message || 'Registration error. Please try again.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FFF5F8] relative overflow-x-hidden font-sans select-none">
      
      {/* Background Ambient Glows on Left */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF5F7] via-[#FFF0F4] to-[#FFEBF1] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-[#FDA4AF]/40 to-[#F43F5E]/20 blur-3xl pointer-events-none" />
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-pink-200/40 blur-3xl pointer-events-none" />

      {/* =========================================================================
          LEFT SIDE: Large Bold Typography & 4 Feature Tiles
         ========================================================================= */}
      <div className="w-full lg:w-[52%] xl:w-[54%] min-h-screen flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-14 xl:px-20 py-12 lg:py-16 relative z-10 space-y-8 sm:space-y-11">
        
        {/* Top Logo */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E11D48] flex items-center justify-center text-white shadow-md shadow-pink-500/25">
            <Check className="w-8 h-8 stroke-[3.5]" />
          </div>
          <span className="text-3xl sm:text-4xl lg:text-[42px] font-black text-neutral-900 tracking-tight">
            Task<span className="text-[#E11D48]">Flow</span>
          </span>
        </div>

        {/* Big Bold Headline */}
        <div className="space-y-5">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] font-black text-neutral-900 tracking-tight leading-[1.03]">
            Plan Smarter <br />
            Get <span className="text-[#E11D48]">More Done</span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-neutral-600 max-w-2xl leading-relaxed font-normal">
            A simple and powerful task manager to organize your work, stay focused and achieve your goals.
          </p>
        </div>

        {/* 4 Feature Items */}
        <div className="space-y-6 max-w-xl pt-2">
          {/* 1. Organize Tasks */}
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#FFE4E8] text-[#E11D48] flex items-center justify-center flex-shrink-0 shadow-xs">
              <List className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-neutral-900">Organize Tasks</div>
              <div className="text-sm sm:text-base text-neutral-500 font-normal">Keep everything in one place</div>
            </div>
          </div>

          {/* 2. Plan Your Day */}
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center flex-shrink-0 shadow-xs">
              <Calendar className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-neutral-900">Plan Your Day</div>
              <div className="text-sm sm:text-base text-neutral-500 font-normal">Set deadlines and reminders</div>
            </div>
          </div>

          {/* 3. Work Together */}
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center flex-shrink-0 shadow-xs">
              <Users className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-neutral-900">Work Together</div>
              <div className="text-sm sm:text-base text-neutral-500 font-normal">Collaborate with your team</div>
            </div>
          </div>

          {/* 4. Track Progress */}
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0 shadow-xs">
              <BarChart2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-neutral-900">Track Progress</div>
              <div className="text-sm sm:text-base text-neutral-500 font-normal">Stay on top of your goals</div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT-MOST PANEL: Covers the ENTIRE right side with NO GAP
         ========================================================================= */}
      <div className="w-full lg:w-[48%] xl:w-[46%] min-h-screen bg-white flex flex-col justify-center items-center px-6 sm:px-12 md:px-16 lg:px-12 xl:px-16 py-12 lg:py-16 shadow-[-20px_0_50px_rgba(225,29,72,0.06)] border-l border-neutral-100 z-20">
        <div className="w-full max-w-[480px] space-y-8">
          
          {/* Top Centered Logo & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-[#E11D48] flex items-center justify-center text-white shadow-xs">
                <Check className="w-6 h-6 stroke-[3.5]" />
              </div>
              <span className="text-3xl font-black text-neutral-900 tracking-tight">
                Task<span className="text-[#E11D48]">Flow</span>
              </span>
            </div>

            <h2 className="text-3xl sm:text-[36px] font-black text-neutral-900 tracking-tight leading-tight">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm sm:text-base text-neutral-500 font-normal">
              {isSignUp ? 'Sign up to create your new account' : 'Log in to continue to your account'}
            </p>
          </div>

          {/* Interactive Form */}
          <form onSubmit={isSignUp ? handleSignUpSubmit : handleLoginSubmit} className="space-y-5 sm:space-y-6">
            {/* Full Name (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm sm:text-base font-bold text-neutral-700 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-base sm:text-lg pl-12 pr-4 py-4 rounded-2xl bg-[#F8FAFC] border border-neutral-200/90 focus:border-[#E11D48] focus:bg-white outline-none transition-all font-medium text-neutral-800"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-sm sm:text-base font-bold text-neutral-700 block">
                Email Address {isSignUp ? '' : 'or Username'}
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={isSignUp ? 'email' : 'text'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-base sm:text-lg pl-12 pr-4 py-4 rounded-2xl bg-[#F8FAFC] border border-neutral-200/90 focus:border-[#E11D48] focus:bg-white outline-none transition-all font-medium text-neutral-800"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm sm:text-base font-bold text-neutral-700 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-base sm:text-lg pl-12 pr-12 py-4 rounded-2xl bg-[#F8FAFC] border border-neutral-200/90 focus:border-[#E11D48] focus:bg-white outline-none transition-all font-medium text-neutral-800 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm sm:text-base font-bold text-neutral-700 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-base sm:text-lg pl-12 pr-4 py-4 rounded-2xl bg-[#F8FAFC] border border-neutral-200/90 focus:border-[#E11D48] focus:bg-white outline-none transition-all font-medium text-neutral-800 tracking-wider"
                  />
                </div>
              </div>
            )}

            {/* Remember me & Forgot Password (Login only) */}
            {!isSignUp && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-3 text-sm sm:text-base font-medium text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded-md text-[#E11D48] accent-[#E11D48] focus:ring-[#E11D48]"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => alert('Demo account credentials: Username: staff123 | Password: password123')}
                  className="text-sm sm:text-base font-medium text-[#E11D48] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Pink Gradient Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4.5 sm:py-5 bg-gradient-to-r from-[#E11D48] via-[#E11D48] to-[#BE123C] hover:opacity-95 active:scale-[0.99] text-white text-base sm:text-lg font-bold rounded-2xl shadow-xl shadow-pink-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-60 mt-4 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Log in'}</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </>
              )}
            </button>

            {/* Error Message (Below Button) */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-[#E11D48] font-semibold flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div>{errorMsg}</div>
                  {!isSignUp && errorMsg.includes('sign up') && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="mt-1.5 inline-flex items-center text-xs font-bold underline text-[#BE123C] hover:text-[#9F1239] cursor-pointer"
                    >
                      Click here to create an account &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Success Message (Below Button) */}
            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-semibold flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </form>

          {/* Bottom Toggle Switch */}
          <div className="text-center pt-3 text-sm sm:text-base text-neutral-600 border-t border-neutral-100">
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="font-bold text-[#E11D48] hover:underline ml-1 cursor-pointer"
                >
                  Log in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="font-bold text-[#E11D48] hover:underline ml-1 cursor-pointer"
                >
                  Sign up
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
