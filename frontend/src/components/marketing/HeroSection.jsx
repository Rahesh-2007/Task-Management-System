import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Users, Star, Play } from 'lucide-react';
import MiniTaskManager from './MiniTaskManager';

export default function HeroSection() {
  return (
    <section className="relative pt-8 pb-20 sm:pt-14 sm:pb-28 overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 border border-brand-border text-brand text-xs font-semibold mb-6 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <span>New: Collaborative Team Workspaces & Kanban Boards</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-todoist-text max-w-3xl mx-auto leading-[1.12]"
        >
          Your trusted <br className="hidden sm:inline" />
          <span className="text-brand inline-block">second brain.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-todoist-subtext max-w-2xl mx-auto leading-relaxed"
        >
          The personal and team task manager used by over <span className="font-semibold text-neutral-800">30 million people</span> to organize work and life. Finally become focused, organized, and calm.
        </motion.p>

        {/* Primary CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
        >
          <Link
            to="/signup"
            className="w-full sm:w-auto relative group overflow-hidden px-8 py-3.5 text-base font-semibold text-white bg-brand hover:bg-brand-hover active:bg-brand-active rounded-xl shadow-card hover:shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 flex items-center justify-center gap-2"
          >
            <span className="relative z-10">Start for free</span>
            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
          </Link>

          <Link
            to="/app"
            className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-neutral-800 bg-white hover:bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-brand fill-brand" />
            <span>Try Workspace Demo</span>
          </Link>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 flex items-center justify-center gap-6 text-xs text-neutral-500"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Free forever plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No credit card required</span>
          </div>
        </motion.div>

        {/* Live Interactive Task Manager Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-12 sm:mt-16"
        >
          <MiniTaskManager />
        </motion.div>
      </div>
    </section>
  );
}
