import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Users,
  Layers,
  Calendar,
  Zap,
  ArrowRight,
} from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-cream/90 backdrop-blur-md shadow-sm py-3.5 border-b border-black/5'
          : 'bg-cream py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-brand rounded-lg p-1"
          aria-label="Todoist Home"
        >
          {/* Custom SVG Logo */}
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm text-white transform group-hover:scale-105 transition-transform duration-200">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M4 6.5h16a1.5 1.5 0 0 0 0-3H4a1.5 1.5 0 0 0 0 3zm0 7h16a1.5 1.5 0 0 0 0-3H4a1.5 1.5 0 0 0 0 3zm0 7h10a1.5 1.5 0 0 0 0-3H4a1.5 1.5 0 0 0 0 3z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-todoist-text flex items-center">
            todoist
            <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-light text-brand tracking-normal border border-brand-border">
              PRO
            </span>
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium text-todoist-text" aria-label="Main Navigation">
          {/* Features Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setActiveDropdown('features')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-black/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand"
              aria-expanded={activeDropdown === 'features'}
            >
              <span>Features</span>
              <ChevronDown className="w-4 h-4 text-neutral-500 transition-transform duration-200" />
            </button>

            <AnimatePresence>
              {activeDropdown === 'features' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 w-80 bg-white rounded-2xl shadow-elevated border border-neutral-200/70 p-3 mt-1.5 z-50"
                >
                  <div className="space-y-1">
                    <Link
                      to="/app"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-brand flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900 group-hover:text-brand transition-colors">
                          Task Management
                        </div>
                        <p className="text-xs text-neutral-500 leading-snug">
                          Capture, organize, and prioritize tasks instantly
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/app"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900 group-hover:text-amber-600 transition-colors">
                          Natural Language Scheduling
                        </div>
                        <p className="text-xs text-neutral-500 leading-snug">
                          Type "tomorrow 4pm" for automatic date parsing
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/app"
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                          Kanban Boards & Calendars
                        </div>
                        <p className="text-xs text-neutral-500 leading-snug">
                          Switch between list, board, and monthly grid views
                        </p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/app"
            className="px-3 py-2 rounded-lg hover:bg-black/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand flex items-center gap-1.5"
          >
            <span>For Teams</span>
            <span className="px-1.5 py-0.2 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
              New
            </span>
          </Link>

          <a
            href="#features"
            className="px-3 py-2 rounded-lg hover:bg-black/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand"
          >
            Resources
          </a>

          <a
            href="#pricing"
            className="px-3 py-2 rounded-lg hover:bg-black/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand"
          >
            Pricing
          </a>
        </nav>

        {/* Right: Auth & CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/app"
            className="px-3.5 py-2 text-sm font-medium text-todoist-text hover:text-neutral-900 hover:bg-black/5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-brand"
          >
            Log in
          </Link>

          <Link
            to="/app"
            className="relative group overflow-hidden px-5 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover active:bg-brand-active rounded-lg transition-all shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 flex items-center gap-1.5"
          >
            <span className="relative z-10">Start for free</span>
            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-todoist-text hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-brand"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Slide-down Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-white border-b border-neutral-200 px-5 pt-3 pb-6 shadow-xl"
          >
            <div className="flex flex-col space-y-3 pt-2">
              <Link
                to="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 text-base font-medium text-neutral-800 border-b border-neutral-100"
              >
                <span>Features</span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </Link>

              <Link
                to="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 text-base font-medium text-neutral-800 border-b border-neutral-100"
              >
                <span>For Teams</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  New
                </span>
              </Link>

              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-base font-medium text-neutral-800 border-b border-neutral-100"
              >
                Resources
              </a>

              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-base font-medium text-neutral-800 border-b border-neutral-100"
              >
                Pricing
              </a>

              <div className="pt-4 flex flex-col gap-2.5">
                <Link
                  to="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-neutral-800 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg shadow-sm"
                >
                  Start for free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
