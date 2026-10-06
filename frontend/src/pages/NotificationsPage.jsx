import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  Palmtree,
  Video,
  UserCheck,
  Building2,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { teamApi, notificationApi, workspaceApi } from '../api/apiClient';
import Avatar from '../components/app/Avatar';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const { activeWorkspaceId, activeWorkspace, members = [], refreshWorkspaceData, switchWorkspace, loadWorkspaces } = useWorkspace();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'approvals' | 'my_requests'
  const [notifications, setNotifications] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const currentUserRole = members.find((m) => m.id === user?.id)?.role || 'member';
  const isAdminOrOwner = currentUserRole === 'admin' || currentUserRole === 'owner' || activeWorkspace?.owner_id === user?.id;

  const loadData = async () => {
    if (!activeWorkspaceId) return;
    try {
      const [notifsRes, vacsRes, invitesRes] = await Promise.allSettled([
        notificationApi.getNotifications(),
        teamApi.getVacations(activeWorkspaceId),
        workspaceApi.getMyPendingInvitations(),
      ]);

      if (notifsRes.status === 'fulfilled' && notifsRes.value?.data) {
        setNotifications(notifsRes.value.data);
      }
      if (vacsRes.status === 'fulfilled' && vacsRes.value?.data) {
        setVacations(vacsRes.value.data);
      }
      if (invitesRes.status === 'fulfilled' && invitesRes.value?.data) {
        setPendingInvites(invitesRes.value.data);
      }
    } catch (err) {
      console.error('[NotificationsPage] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  const handleApproveVacation = async (vacationId) => {
    try {
      setStatusMsg({ type: '', text: '' });
      const res = await teamApi.updateVacationStatus(activeWorkspaceId, vacationId, 'approved');
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Time-off approved! The team member has been notified.' });
        loadData();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to approve vacation.' });
    }
  };

  const handleRejectVacation = async (vacationId) => {
    try {
      setStatusMsg({ type: '', text: '' });
      const res = await teamApi.updateVacationStatus(activeWorkspaceId, vacationId, 'rejected');
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Time-off rejected. The team member has been notified.' });
        loadData();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to reject vacation.' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      loadData();
      if (refreshWorkspaceData) refreshWorkspaceData();
    } catch (_) {}
  };

  const handleAcceptInvite = async (token, wsId) => {
    try {
      const res = await workspaceApi.acceptInvite(token);
      if (res.success) {
        await loadWorkspaces();
        switchWorkspace(wsId);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to accept invite.');
    }
  };

  // Filter pending approvals for admin
  const pendingVacationApprovals = vacations.filter((v) => v.status === 'pending');
  const myVacationRequests = vacations.filter((v) => v.user_id === user?.id);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#E11D48] border border-rose-100 shadow-2xs">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">Notifications & Approvals</h1>
              {isAdminOrOwner && pendingVacationApprovals.length > 0 && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {pendingVacationApprovals.length} Pending Approval
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Review team time-off approvals, meeting notices, and workspace invitations for {activeWorkspace?.name}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.is_read) && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Mark all read
            </button>
          )}
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#E11D48] text-white shadow-2xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          All Notifications ({notifications.length})
        </button>

        {isAdminOrOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'approvals'
                ? 'bg-[#E11D48] text-white shadow-2xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Approvals</span>
            {pendingVacationApprovals.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-neutral-900 text-[10px] font-black flex items-center justify-center">
                {pendingVacationApprovals.length}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('my_requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'my_requests'
              ? 'bg-[#E11D48] text-white shadow-2xs'
              : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          My Requests ({myVacationRequests.length})
        </button>
      </div>

      {/* Content for Admin Approvals */}
      {activeTab === 'approvals' && isAdminOrOwner && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900">
              Pending Time-off & Leave Requests ({pendingVacationApprovals.length})
            </h2>
          </div>

          {pendingVacationApprovals.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-800">All Clear! No Pending Approvals</h3>
              <p className="text-xs text-neutral-500">All team time-off requests have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVacationApprovals.map((v) => (
                <div
                  key={v.id}
                  className="p-5 rounded-3xl bg-white border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up"
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar
                      user={{ name: v.user_name, email: v.user_email, avatar: v.user_avatar }}
                      size="lg"
                      className="shadow-2xs flex-shrink-0 mt-0.5"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-neutral-900">{v.user_name}</span>
                        <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          {v.type} leave
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-neutral-700">
                        🗓️ {v.start_date} → {v.end_date}
                      </div>

                      {v.reason && (
                        <p className="text-xs text-neutral-500 italic bg-neutral-50 p-2 rounded-xl border border-neutral-100">
                          "{v.reason}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Admin Decision Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleApproveVacation(v.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRejectVacation(v.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content for My Requests */}
      {activeTab === 'my_requests' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-neutral-900">Your Submitted Time-off Requests</h2>
          {myVacationRequests.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center space-y-2">
              <Palmtree className="w-10 h-10 text-neutral-300 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-800">No time-off requests submitted yet</h3>
              <p className="text-xs text-neutral-500">Submit a vacation or sick leave request to notify workspace admins.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myVacationRequests.map((v) => {
                const isApproved = v.status === 'approved';
                const isPending = v.status === 'pending';
                const isRejected = v.status === 'rejected';

                return (
                  <div
                    key={v.id}
                    className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 capitalize">{v.type} Leave</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {v.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1">
                        {v.start_date} to {v.end_date} {v.reason ? `· "${v.reason}"` : ''}
                      </p>
                    </div>

                    <div className="text-xs font-semibold text-neutral-500">
                      {isApproved && '✅ Confirmed'}
                      {isPending && '⏳ Awaiting Admin Approval'}
                      {isRejected && '❌ Declined'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content for All Notifications */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Pending Workspace Invites */}
          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Workspace Invites</h2>
              <div className="space-y-2">
                {pendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold text-xs text-neutral-900">{inv.workspace_name}</span>
                      <p className="text-[11px] text-neutral-600">
                        Invited by {inv.inviter_name} as <strong className="uppercase">{inv.role}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAcceptInvite(inv.token, inv.workspace_id)}
                      className="px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] cursor-pointer self-start sm:self-auto"
                    >
                      Accept & Join
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Notifications List */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Activity & Updates</h2>
            {notifications.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center space-y-2">
                <Bell className="w-10 h-10 text-neutral-300 mx-auto" />
                <h3 className="text-sm font-bold text-neutral-800">No new notifications</h3>
                <p className="text-xs text-neutral-500">You're completely up to date.</p>
              </div>
            ) : (
              <div className="rounded-3xl bg-white border border-neutral-200 divide-y divide-neutral-100 shadow-sm overflow-hidden">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 flex items-start justify-between gap-3 hover:bg-neutral-50 transition-colors ${
                      !n.is_read ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900">{n.title}</span>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#E11D48]" />}
                      </div>
                      <p className="text-xs text-neutral-600">{n.message}</p>
                      <span className="text-[10px] text-neutral-400 block pt-0.5">{n.created_at}</span>
                    </div>

                    {n.link && (
                      <a
                        href={n.link}
                        className="text-xs font-bold text-[#E11D48] hover:underline whitespace-nowrap self-center"
                      >
                        View →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
