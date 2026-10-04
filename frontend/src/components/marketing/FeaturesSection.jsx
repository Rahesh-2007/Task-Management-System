import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Bell,
  Sliders,
  Sparkles,
  Cpu,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  Laptop,
  Watch,
  Globe,
  Share2,
  Tag,
  Filter,
} from 'lucide-react';

const FEATURES = [
  {
    id: 'everywhere',
    icon: Smartphone,
    title: 'With you everywhere',
    tagline: 'Sync across mobile, desktop, widgets, and wearables',
    description:
      'Keep your tasks in sync across iOS, Android, macOS, Windows, web browsers, and your Apple Watch. Access your to-dos even when offline.',
    pill: 'Multi-platform',
    previewType: 'devices',
  },
  {
    id: 'never_miss',
    icon: Bell,
    title: 'Never miss a thing',
    tagline: 'Tasks, projects, due dates & intelligent reminders',
    description:
      'Organize your workload into nested projects and sections. Set automated push notifications, location-based reminders, and calendar deadlines.',
    pill: 'Organization',
    previewType: 'reminders',
  },
  {
    id: 'customizable',
    icon: Sliders,
    title: 'Customizable features',
    tagline: 'Custom filters, colored labels, priorities & templates',
    description:
      'Tailor your productivity workflow with custom saved filters (e.g. "@urgent & today"), priority flags P1-P4, and pre-built workflow templates.',
    pill: 'Flexibility',
    previewType: 'filters',
  },
  {
    id: 'nlp',
    icon: Sparkles,
    title: 'Understands human language',
    tagline: 'Type "read the news every weekday at 7AM"',
    description:
      'Type naturally and Todoist automatically recognizes due dates, recurrence rules, tags, and projects without touching your mouse.',
    pill: 'AI & NLP',
    previewType: 'nlp_demo',
  },
  {
    id: 'integrations',
    icon: Cpu,
    title: 'Connect with your other tools',
    tagline: 'Google Calendar, Slack, Outlook, Siri & 90+ tools',
    description:
      'Turn emails into tasks, sync 2-way with Google Calendar, manage team tasks from Slack channels, and trigger voice commands with Siri & Google Assistant.',
    pill: '90+ Integrations',
    previewType: 'integrations_grid',
  },
];

export default function FeaturesSection() {
  const [activeFeatureId, setActiveFeatureId] = useState('everywhere');
  const activeFeature = FEATURES.find((f) => f.id === activeFeatureId) || FEATURES[0];

  return (
    <section id="features" className="py-20 sm:py-28 bg-white border-y border-neutral-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand px-3 py-1 rounded-full bg-red-50 border border-brand-border">
            Built for High Performance
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Gain complete clarity over every commitment
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-600">
            From quick grocery runs to cross-functional product launches, Todoist adapts to your unique workflow.
          </p>
        </div>

        {/* Feature Grid & Interactive Preview Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: 5 Feature Accordion / Selector Cards */}
          <div className="lg:col-span-5 space-y-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              const isSelected = feature.id === activeFeatureId;

              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setActiveFeatureId(feature.id)}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all border ${
                    isSelected
                      ? 'bg-cream-100/90 border-brand/30 shadow-card ring-1 ring-brand/10'
                      : 'bg-white hover:bg-neutral-50 border-neutral-200/80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-brand text-white' : 'bg-red-50 text-brand'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-neutral-900">{feature.title}</h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                          {feature.pill}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                        {feature.tagline}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Visual Mockup for the Active Feature */}
          <div className="lg:col-span-7">
            <div className="bg-cream-50 rounded-3xl p-6 sm:p-10 border border-neutral-200/80 min-h-[440px] flex items-center justify-center relative overflow-hidden shadow-subtle">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-lg"
                >
                  {/* Feature 1: Multi-platform preview */}
                  {activeFeature.previewType === 'devices' && (
                    <div className="bg-white rounded-2xl p-6 shadow-elevated border border-neutral-200/80 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                          <Laptop className="w-5 h-5 text-brand" />
                          <span className="text-sm font-bold text-neutral-800">Universal Sync Engine</span>
                        </div>
                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                          Synced 0s ago
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                          <Laptop className="w-6 h-6 mx-auto text-neutral-700 mb-1" />
                          <div className="text-xs font-semibold text-neutral-800">Mac & PC</div>
                          <div className="text-[10px] text-neutral-400">Desktop Apps</div>
                        </div>

                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                          <Smartphone className="w-6 h-6 mx-auto text-neutral-700 mb-1" />
                          <div className="text-xs font-semibold text-neutral-800">iOS & Android</div>
                          <div className="text-[10px] text-neutral-400">Mobile Widgets</div>
                        </div>

                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                          <Watch className="w-6 h-6 mx-auto text-neutral-700 mb-1" />
                          <div className="text-xs font-semibold text-neutral-800">Smartwatches</div>
                          <div className="text-[10px] text-neutral-400">Complications</div>
                        </div>
                      </div>

                      <div className="p-3 bg-red-50 rounded-xl text-xs text-neutral-700 border border-brand-border flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand flex-shrink-0" />
                        <span>Instant real-time conflict resolution across all active sessions</span>
                      </div>
                    </div>
                  )}

                  {/* Feature 2: Never miss a thing */}
                  {activeFeature.previewType === 'reminders' && (
                    <div className="bg-white rounded-2xl p-6 shadow-elevated border border-neutral-200/80 space-y-3">
                      <div className="flex items-center gap-2 text-brand font-semibold text-sm">
                        <Bell className="w-4 h-4" />
                        <span>Proactive Due Dates & Deadlines</span>
                      </div>

                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <div>
                              <div className="text-xs font-semibold text-neutral-800">Team Sprint Planning</div>
                              <div className="text-[11px] text-neutral-400">Due Today at 3:00 PM • Remind 15 min before</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-brand rounded">P1</span>
                        </div>

                        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="text-xs font-semibold text-neutral-800">Quarterly Tax Filing</div>
                              <div className="text-[11px] text-neutral-400">Recurring every 3 months</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded">P2</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feature 3: Customizable features */}
                  {activeFeature.previewType === 'filters' && (
                    <div className="bg-white rounded-2xl p-6 shadow-elevated border border-neutral-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                          <Filter className="w-4 h-4" />
                          <span>Custom Filter Query Builder</span>
                        </div>
                        <span className="text-xs text-neutral-400 font-mono">p1 & today & @work</span>
                      </div>

                      <div className="p-3 bg-neutral-50 rounded-xl space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-medium">Priority 1</span>
                          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-medium">Today</span>
                          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">@frontend</span>
                          <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 text-xs font-medium">#Marketing</span>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-500">
                        Create custom dynamic views with Boolean operators (AND, OR, NOT) to surface exactly what matters right now.
                      </p>
                    </div>
                  )}

                  {/* Feature 4: Understands Human Language */}
                  {activeFeature.previewType === 'nlp_demo' && (
                    <div className="bg-white rounded-2xl p-6 shadow-elevated border border-neutral-200/80 space-y-4">
                      <div className="flex items-center gap-2 text-brand font-semibold text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>Chrono-Node Natural Language Parsing</span>
                      </div>

                      <div className="p-3 rounded-xl bg-cream border border-neutral-200 font-mono text-xs text-neutral-800">
                        "Read the news <span className="bg-emerald-100 text-emerald-800 px-1 rounded">every weekday</span> at <span className="bg-amber-100 text-amber-800 px-1 rounded">7AM</span> <span className="bg-red-100 text-red-800 px-1 rounded">p1</span>"
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-neutral-50 rounded-lg">
                          <div className="text-[10px] text-neutral-400 uppercase">Recurrence</div>
                          <div className="font-semibold text-emerald-700">Mon-Fri</div>
                        </div>
                        <div className="p-2 bg-neutral-50 rounded-lg">
                          <div className="text-[10px] text-neutral-400 uppercase">Time</div>
                          <div className="font-semibold text-amber-700">07:00 AM</div>
                        </div>
                        <div className="p-2 bg-neutral-50 rounded-lg">
                          <div className="text-[10px] text-neutral-400 uppercase">Priority</div>
                          <div className="font-semibold text-brand">Urgent (P1)</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feature 5: Integrations Grid */}
                  {activeFeature.previewType === 'integrations_grid' && (
                    <div className="bg-white rounded-2xl p-6 shadow-elevated border border-neutral-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-neutral-800">90+ Seamless Integrations</span>
                        <span className="text-xs text-brand font-medium">Browse App Directory →</span>
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-center">
                        {['Google Calendar', 'Slack', 'Gmail', 'Outlook', 'Zapier', 'GitHub', 'Siri', 'Alexa'].map((app) => (
                          <div key={app} className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors border border-neutral-100">
                            <div className="w-8 h-8 rounded-lg bg-white mx-auto shadow-sm flex items-center justify-center font-bold text-xs text-neutral-700 mb-1 border border-neutral-200">
                              {app[0]}
                            </div>
                            <span className="text-[10px] font-medium text-neutral-600 block truncate">{app}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
