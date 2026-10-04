import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function CallToActionSection() {
  return (
    <section className="py-20 sm:py-28 bg-cream relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(#E44332_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-brand text-xs font-semibold mb-6 border border-brand-border">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Supercharge your daily workflow</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight">
          Gain clarity and calm <br className="hidden sm:inline" />
          in your workday.
        </h2>

        <p className="mt-6 text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          Join over 30 million individuals and high-performing teams who stay organized, hit deadlines, and achieve more with Todoist.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto relative group overflow-hidden px-8 py-4 text-base font-semibold text-white bg-brand hover:bg-brand-hover active:bg-brand-active rounded-xl shadow-elevated hover:shadow-xl transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <span className="relative z-10">Start for free</span>
            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
          </Link>

          <Link
            to="/app"
            className="w-full sm:w-auto px-6 py-4 text-base font-semibold text-neutral-800 bg-white hover:bg-neutral-50 rounded-xl border border-neutral-300/80 shadow-sm transition-all"
          >
            Open Live Workspace
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-neutral-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free 30-day Pro trial
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
}
