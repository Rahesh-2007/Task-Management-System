import React from 'react';
import { BadgeCheck, Heart, MessageCircle, Repeat2 } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Marcus Vance',
    handle: '@marcus_vance',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    role: 'Engineering Director',
    quote:
      'Natural language date parsing changed how our entire team handles sprint tasks. We went from dropping deadlines to shipping 3 weeks ahead of schedule.',
    likes: '1.4k',
    retweets: '248',
    date: 'Oct 2',
  },
  {
    name: 'Dr. Clara Thorne',
    handle: '@clarathorne_md',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    role: 'Clinical Researcher',
    quote:
      'Between clinic hours, journal submissions, and grant deadlines, Todoist is the only tool that keeps my mental space uncluttered. The Today view is pure zen.',
    likes: '3.8k',
    retweets: '512',
    date: 'Sep 28',
  },
  {
    name: 'Julian Hayes',
    handle: '@julian_creates',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80',
    role: 'Product Designer & Author',
    quote:
      'The board view with custom section columns is super slick. It feels lightweight yet handles massive cross-functional roadmaps with zero lag.',
    likes: '2.1k',
    retweets: '319',
    date: 'Oct 1',
  },
  {
    name: 'Priya Sharma',
    handle: '@priyacodes',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    role: 'Staff Frontend Engineer',
    quote:
      'Quick add with keyboard shortcut "Q" is muscle memory for me. I can capture fleeting thoughts in 2 seconds without switching browser tabs.',
    likes: '980',
    retweets: '144',
    date: 'Oct 3',
  },
  {
    name: 'Lucas Dupont',
    handle: '@lucas_dupont',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    role: 'Startup Founder',
    quote:
      'Our team switched from cumbersome Jira boards to Todoist workspaces. Team alignment doubled overnight and everybody actually enjoys logging tasks now.',
    likes: '4.2k',
    retweets: '730',
    date: 'Sep 24',
  },
  {
    name: 'Amina Al-Mansoor',
    handle: '@amina_ops',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    role: 'Operations VP',
    quote:
      'The team workload matrix helps me prevent burnout across our 25-person team. I can spot overloaded days instantly and reassign with drag-and-drop.',
    likes: '1.7k',
    retweets: '289',
    date: 'Oct 4',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 bg-white border-b border-neutral-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand px-3 py-1 rounded-full bg-red-50 border border-brand-border">
            Real Stories
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Loved by creators, engineers, and modern teams
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-600">
            Discover why millions trust Todoist as their daily productivity foundation.
          </p>
        </div>

        {/* Tweet Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="bg-cream-50/70 hover:bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Author Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-11 h-11 rounded-full object-cover border border-neutral-200"
                      loading="lazy"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-neutral-900">{t.name}</span>
                        <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
                      </div>
                      <div className="text-xs text-neutral-500">{t.handle}</div>
                    </div>
                  </div>

                  {/* SVG Twitter Bird Icon */}
                  <svg className="w-5 h-5 text-neutral-400 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>

                {/* Quote Text */}
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {t.quote}
                </p>
              </div>

              {/* Card Footer (Engagement stats) */}
              <div className="flex items-center justify-between pt-5 mt-5 border-t border-neutral-200/60 text-xs text-neutral-400">
                <span className="font-medium">{t.role}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 group-hover:text-neutral-600 transition-colors">
                    <Heart className="w-3.5 h-3.5" />
                    {t.likes}
                  </span>
                  <span className="flex items-center gap-1 group-hover:text-neutral-600 transition-colors">
                    <Repeat2 className="w-3.5 h-3.5" />
                    {t.retweets}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
