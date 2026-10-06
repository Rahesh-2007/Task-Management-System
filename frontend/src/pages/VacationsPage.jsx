import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Palmtree,
  Check,
  X,
  Clock,
  AlertCircle,
  Users,
  ShieldCheck,
  Trash2,
  HeartPulse,
  Home,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { teamApi } from '../api/apiClient';
import Avatar from '../components/app/Avatar';
import { format, isWithinInterval, parseISO } from 'date-fns';

export default function VacationsPage() {
  const { activeWorkspaceId, activeWorkspace, members = [] } = useWorkspace();
  const { user } = useAuth();

  const [vacations, setVacations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Form State
  const [type, setType] = useState('vacation');
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserRole = members.find((m) => m.id === user?.id)?.role || 'member';
  const isAdminOrOwner = currentUserRole === 'admin' || currentUserRole === 'owner' || activeWorkspace?.owner_id === user?.id;

  const loadVacations = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await teamApi.getVacations(activeWorkspaceId);
      if (res.success && Array.isArray(res.data)) {
        setVacations(res.data);
      }
    } catch (err) {
      console.error('[VacationsPage] Failed to load vacations:', err);
    }
  };

  // Real-time polling every 5s
  useEffect(() => {
    loadVacations();
    const interval = setInterval(loadVacations, 5000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  const handleCreateVacation = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setStatusMsg({ type: 'error', text: 'Please select start and end dates.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMsg({ type: '', text: '' });
      const res = await teamApi.createVacation(activeWorkspaceId, {
        type,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Time-off request registered!' });
        setIsModalOpen(false);
        setReason('');
        loadVacations();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit time-off request.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (vacationId, newStatus) => {
    try {
      const res = await teamApi.updateVacationStatus(activeWorkspaceId, vacationId, newStatus);
      if (res.success) {
        loadVacations();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteVacation = async (vacationId) => {
    if (!window.confirm('Are you sure you want to remove this time-off entry?')) return;
    try {
      const res = await teamApi.deleteVacation(activeWorkspaceId, vacationId);
      if (res.success) {
        setVacations((prev) => prev.filter((v) => v.id !== vacationId));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete vacation.');
    }
  };

  const getTypeBadge = (vType) => {
    switch (vType) {
      case 'vacation':
        return { icon: <Palmtree className="w-3.5 h-3.5 text-emerald-600" />, label: 'Vacation', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'sick':
        return { icon: <HeartPulse className="w-3.5 h-3.5 text-red-600" />, label: 'Sick Leave', bg: 'bg-red-50 text-red-800 border-red-200' };
      case 'remote':
        return { icon: <Home className="w-3.5 h-3.5 text-blue-600" />, label: 'Working Remote', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      default:
        return { icon: <Clock className="w-3.5 h-3.5 text-amber-600" />, label: 'Personal Time', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
  };

  // Find who is off today
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const onVacationToday = vacations.filter(
    (v) => v.status === 'approved' && v.start_date <= todayStr && v.end_date >= todayStr
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#E11D48] border border-rose-100 shadow-2xs">
            <Palmtree className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">Vacations & Time-off</h1>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Team Availability
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Plan vacations, track PTO / sick leaves, and manage team availability for {activeWorkspace?.name}.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Request Time Off</span>
        </button>
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

      {/* Away Today Banner */}
      {onVacationToday.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 p-5 border border-amber-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-neutral-900">
              Teammates Away Today ({onVacationToday.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {onVacationToday.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-amber-200 shadow-2xs text-xs"
              >
                <Avatar user={{ name: v.user_name, email: v.user_email, avatar: v.user_avatar }} size="xs" />
                <span className="font-bold text-neutral-900">{v.user_name}</span>
                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-semibold capitalize">
                  {v.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time-off Schedule List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E11D48]" />
            <span>Scheduled Team Time-off ({vacations.length})</span>
          </h2>
          <span className="text-[11px] text-neutral-500 font-medium">Real-time calendar</span>
        </div>

        {vacations.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center space-y-3">
            <Palmtree className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-800">No Time-off Scheduled</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Plan your upcoming vacations or notify the team when you'll be away.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Book Time Off</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vacations.map((v) => {
              const badge = getTypeBadge(v.type);
              const isMe = v.user_id === user?.id;

              return (
                <div
                  key={v.id}
                  className="p-5 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-3 relative hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        user={{ name: v.user_name, email: v.user_email, avatar: v.user_avatar }}
                        size="md"
                        className="shadow-2xs"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900">{v.user_name}</span>
                          {isMe && (
                            <span className="text-[9px] font-bold text-[#E11D48] bg-rose-50 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border mt-1 ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>
                    </div>

                    {(isMe || isAdminOrOwner) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteVacation(v.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete time-off"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs text-neutral-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-800">
                        {v.start_date} → {v.end_date}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        {v.status || 'Approved'}
                      </span>
                    </div>
                    {v.reason && <p className="text-[11px] text-neutral-500 italic mt-1">"{v.reason}"</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Time Off Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#E11D48] flex items-center justify-center">
                  <Palmtree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Request Time Off</h3>
                  <p className="text-xs text-neutral-500">For {activeWorkspace?.name}</p>
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

            <form onSubmit={handleCreateVacation} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Type of Leave <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:border-[#E11D48] outline-none bg-white font-medium text-neutral-800"
                >
                  <option value="vacation">🌴 Vacation / PTO</option>
                  <option value="sick">🩺 Sick Leave</option>
                  <option value="personal">🏡 Personal Day</option>
                  <option value="remote">💻 Working Remote</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:border-[#E11D48] outline-none bg-neutral-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:border-[#E11D48] outline-none bg-neutral-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Reason / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Annual family vacation, will have limited email access"
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
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
