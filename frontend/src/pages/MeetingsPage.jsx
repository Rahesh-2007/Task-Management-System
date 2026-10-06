import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  Trash2,
  Users,
  Check,
  Sparkles,
  AlertCircle,
  X,
  Building2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { teamApi } from '../api/apiClient';
import Avatar from '../components/app/Avatar';
import { format, parseISO, isFuture, isPast } from 'date-fns';

export default function MeetingsPage() {
  const { activeWorkspaceId, activeWorkspace, members = [] } = useWorkspace();
  const { user } = useAuth();

  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledStart, setScheduledStart] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  });
  const [duration, setDuration] = useState(30);
  const [customLink, setCustomLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load meetings
  const loadMeetings = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await teamApi.getMeetings(activeWorkspaceId);
      if (res.success && Array.isArray(res.data)) {
        setMeetings(res.data);
      }
    } catch (err) {
      console.error('[MeetingsPage] Failed to load meetings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time polling every 5s
  useEffect(() => {
    loadMeetings();
    const interval = setInterval(loadMeetings, 5000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!title.trim() || !scheduledStart) {
      setStatusMsg({ type: 'error', text: 'Please provide a title and date/time.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMsg({ type: '', text: '' });
      const formattedStart = scheduledStart.replace('T', ' ') + ':00';
      const res = await teamApi.createMeeting(activeWorkspaceId, {
        title: title.trim(),
        description: description.trim(),
        scheduled_start: formattedStart,
        duration_minutes: parseInt(duration, 10) || 30,
        meeting_link: customLink.trim() || undefined,
      });

      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Meeting scheduled successfully with Google Meet!' });
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setCustomLink('');
        loadMeetings();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to schedule meeting.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      const res = await teamApi.deleteMeeting(activeWorkspaceId, meetingId);
      if (res.success) {
        setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete meeting.');
    }
  };

  const handleStartInstantMeet = () => {
    window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
  };

  const upcomingMeetings = meetings.filter((m) => {
    try {
      return new Date(m.scheduled_start) >= new Date(Date.now() - 30 * 60 * 1000);
    } catch (_) {
      return true;
    }
  });

  const pastMeetings = meetings.filter((m) => {
    try {
      return new Date(m.scheduled_start) < new Date(Date.now() - 30 * 60 * 1000);
    } catch (_) {
      return false;
    }
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#E11D48] border border-rose-100 shadow-2xs">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">Team Meetings</h1>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Google Meet Enabled
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Host live video conferences and schedule team syncs for {activeWorkspace?.name || 'Workspace'}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleStartInstantMeet}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Instant Google Meet</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {statusMsg.text && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-2xl text-xs font-medium animate-slide-up ${
            statusMsg.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Upcoming Meetings Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E11D48]" />
            <span>Upcoming Meetings ({upcomingMeetings.length})</span>
          </h2>
          <span className="text-[11px] text-neutral-500 font-medium">Real-time sync active</span>
        </div>

        {upcomingMeetings.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">No Upcoming Meetings</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Start an instant Google Meet or schedule a sync with your workspace team.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule First Meeting</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMeetings.map((m) => {
              const startDate = new Date(m.scheduled_start);
              const formattedDate = format(startDate, 'EEE, MMM d, yyyy');
              const formattedTime = format(startDate, 'h:mm a');

              return (
                <div
                  key={m.id}
                  className="p-5 rounded-3xl bg-white border border-neutral-200 hover:border-neutral-300 shadow-sm space-y-4 transition-all hover:shadow-md relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                        Google Meet
                      </span>
                      <h3 className="text-base font-bold text-neutral-900 leading-tight">{m.title}</h3>
                      {m.description && (
                        <p className="text-xs text-neutral-500 line-clamp-2">{m.description}</p>
                      )}
                    </div>

                    {(m.creator_id === user?.id || user?.role === 'admin' || user?.role === 'owner') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMeeting(m.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Cancel meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-neutral-600 pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="font-semibold text-neutral-800">{formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span>
                        {formattedTime} ({m.duration_minutes} mins)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Avatar
                        user={{ name: m.creator_name, email: m.creator_email, avatar: m.creator_avatar }}
                        size="sm"
                      />
                      <span className="text-[11px] text-neutral-500">
                        Organized by <strong>{m.creator_name}</strong>
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Join Google Meet Action */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-neutral-400 truncate max-w-[180px]">
                      {m.meeting_link.replace('https://', '')}
                    </span>

                    <a
                      href={m.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join with Google Meet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Meetings List */}
      {pastMeetings.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Past Meetings</h2>
          <div className="rounded-3xl bg-white border border-neutral-200 divide-y divide-neutral-100">
            {pastMeetings.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between text-xs opacity-75">
                <div>
                  <span className="font-bold text-neutral-800">{m.title}</span>
                  <p className="text-[11px] text-neutral-500">
                    {format(new Date(m.scheduled_start), 'MMM d, yyyy · h:mm a')} · Organized by {m.creator_name}
                  </p>
                </div>
                <a
                  href={m.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-600 hover:text-neutral-900 font-semibold flex items-center gap-1"
                >
                  <span>Re-open Meet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#E11D48] flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Schedule Google Meet</h3>
                  <p className="text-xs text-neutral-500">Create a video sync for {activeWorkspace?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Meeting Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Product Sync & Roadmap Review"
                  className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:border-[#E11D48] outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:border-[#E11D48] outline-none bg-neutral-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:border-[#E11D48] outline-none bg-white"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Google Meet Link (Optional)
                </label>
                <input
                  type="url"
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij (leave blank to auto-generate)"
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:border-[#E11D48] outline-none placeholder:text-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Agenda / Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key topics, agenda items, or document links..."
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:border-[#E11D48] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule Meet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
