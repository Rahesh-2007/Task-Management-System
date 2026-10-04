import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ChevronDown, Check } from 'lucide-react';

const FOOTER_COLUMNS = [
  {
    title: 'Features',
    links: [
      { name: 'How It Works', href: '#features' },
      { name: 'For Teams', href: '/app' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Templates', href: '#features' },
      { name: 'Integrations', href: '#features' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { name: 'Task Management', href: '/app' },
      { name: 'Kanban Boards', href: '/app' },
      { name: 'Calendar Scheduling', href: '/app' },
      { name: 'Team Workload', href: '/app' },
      { name: 'Project Roadmaps', href: '/app' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Download Apps', href: '/app' },
      { name: 'Help Center', href: '#features' },
      { name: 'Productivity Methods', href: '#features' },
      { name: 'Customer Stories', href: '#features' },
      { name: 'Status & Uptime', href: '#features' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '#features' },
      { name: 'Careers', href: '#features' },
      { name: 'Inspiration Hub', href: '#features' },
      { name: 'Press & Media', href: '#features' },
      { name: 'Twist Team App', href: '#features' },
    ],
  },
  {
    title: 'Download',
    links: [
      { name: 'iOS & iPad', href: '/app' },
      { name: 'Android', href: '/app' },
      { name: 'macOS & Windows', href: '/app' },
      { name: 'Linux', href: '/app' },
      { name: 'Chrome Extension', href: '/app' },
    ],
  },
];

const LANGUAGES = [
  'English',
  'Español',
  'Deutsch',
  'Français',
  'Italiano',
  'Português',
  '日本語',
  '한국어',
];

export default function Footer() {
  const [selectedLang, setSelectedLang] = useState('English');
  const [isLangOpen, setIsLangOpen] = useState(false);

  return (
    <footer className="bg-todoist-dark text-neutral-300 pt-16 pb-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Multi-column Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-neutral-800">
          {FOOTER_COLUMNS.map((col, idx) => (
            <div key={idx} className="space-y-4">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase">
                {col.title}
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <a
                      href={link.href}
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Middle: Logo & Language Selector */}
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M4 6.5h16a1.5 1.5 0 0 0 0-3H4a1.5 1.5 0 0 0 0 3zm0 7h16a1.5 1.5 0 0 0 0-3H4a1.5 1.5 0 0 0 0 3zm0 7h10a1.5 1.5 0 0 0 0-3H4a1.5 1.5 0 0 0 0 3z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">todoist</span>
            <span className="text-xs text-neutral-400 ml-2">
              Join 30M+ people organizing work and life.
            </span>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-xs font-medium text-neutral-300 border border-neutral-700 transition-colors focus-visible:ring-2 focus-visible:ring-brand"
              aria-expanded={isLangOpen}
            >
              <Globe className="w-3.5 h-3.5 text-neutral-400" />
              <span>{selectedLang}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {isLangOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-40 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl py-1 z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang);
                      setIsLangOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 flex items-center justify-between"
                  >
                    <span>{lang}</span>
                    {selectedLang === lang && <Check className="w-3 h-3 text-brand" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Legal Disclaimer & Social Icons */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-neutral-400">
              © {new Date().getFullYear()} Todoist Clone. <strong className="text-neutral-300 font-semibold">Unofficial clone for educational purposes.</strong>
            </p>
            <p className="text-[11px] text-neutral-400">
              Security • Privacy • Terms • California Notice • Cookie Preferences
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4 text-neutral-400">
            {['Twitter / X', 'YouTube', 'GitHub', 'LinkedIn', 'Instagram'].map((network) => (
              <a
                key={network}
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                aria-label={network}
              >
                <span className="text-xs hover:underline">{network}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
