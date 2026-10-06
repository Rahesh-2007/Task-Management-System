import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/apiClient';
import { Layers, ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setStatus({ state: 'loading', message: '' });
      const res = await authApi.forgotPassword(email.trim());
      setStatus({ state: 'success', message: res.message || 'Password reset link sent to your email.' });
    } catch (err) {
      setStatus({ state: 'error', message: err.message || 'Failed to request password reset.' });
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E11D48] text-white shadow-md">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">TaskFlow</span>
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-900">Reset your password</h2>
        <p className="mt-2 text-center text-xs text-neutral-600">
          Enter your registered email address and we will send you password reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-neutral-200 sm:rounded-2xl sm:px-10">
          {status.state === 'success' ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-xs text-neutral-700 font-medium">{status.message}</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E11D48] hover:underline pt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status.state === 'error' && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status.state === 'loading'}
                className="w-full py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {status.state === 'loading' ? 'Sending instructions...' : 'Send Reset Instructions'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
