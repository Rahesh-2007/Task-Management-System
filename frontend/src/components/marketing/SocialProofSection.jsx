import React from 'react';
import { Star, ShieldCheck, Award, Heart, Sparkles } from 'lucide-react';

const REVIEWS = [
  {
    quote: '“Simple, straightforward, and super powerful task organization.”',
    publication: 'The Verge',
    tag: 'Editor’s Pick',
  },
  {
    quote: '“The best to-do list app on the market for personal & team productivity.”',
    publication: 'PC Magazine',
    tag: '5/5 Outstanding',
  },
  {
    quote: '“Nothing short of stellar. An indispensable second brain for your day.”',
    publication: 'TechRadar',
    tag: 'Best Productivity App',
  },
];

const STATS = [
  { label: 'Registered Users', value: '30M+' },
  { label: 'Completed Tasks', value: '2 Billion+' },
  { label: 'Active Teams & Workspaces', value: '100,000+' },
  { label: 'Countries Supported', value: '160+' },
  { label: 'App Store Rating', value: '4.8 ★' },
];

export default function SocialProofSection() {
  return (
    <section className="py-20 sm:py-24 bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-4 border border-amber-200">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Top Rated Productivity Platform</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
            People in 160+ countries rely on Todoist to organize work and life
          </h2>
        </div>

        {/* 3 Publication Quote Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {REVIEWS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-neutral-200/80 text-left flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand uppercase tracking-wider">
                    {item.publication}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                    {item.tag}
                  </span>
                </div>
                <blockquote className="text-base sm:text-lg font-medium text-neutral-800 leading-snug">
                  {item.quote}
                </blockquote>
              </div>

              <div className="flex items-center gap-1 text-amber-500 pt-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 pt-10 border-t border-neutral-200/70">
          {STATS.map((stat, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/70 border border-neutral-200/50">
              <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
