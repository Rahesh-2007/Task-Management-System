import React from 'react';
import {
  X,
  Bell,
  Calendar,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  UserX,
  UserPlus,
  Building2,
  Check,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { format } from 'date-fns';

export default function NotificationCenter() {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    tasks,
    currentUser,
    handleBulkRescheduleOverdue,
    setActiveTaskModal,
    invitations,
    approveJoinRequest,
    rejectJoinRequest,
    acceptWorkspaceInvitation,
    declineWorkspaceInvitation,
    workspaces,
  } = useWorkspace();

  if (!isNotificationsOpen) return null;

  const safeTasks = tasks || [];
  const safeInvitations = invitations || [];
  const safeWorkspaces = workspaces || [];

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const overdueTasks = safeTasks.filter((t) => !t.completed && t.dueDate && t.dueDate < todayStr);
  const assignedToMeTasks = safeTasks.filter((t) => !t.completed && t.assigneeId === currentUser?.id);

  // 1. Join requests that current user (creator) needs to APPROVE
  const myWorkspacesIds = safeWorkspaces.map((w) => String(w.id));
  const pendingApprovalsForMe = safeInvitations.filter(
    (inv) =>
      inv.type === 'link_request' &&
      inv.status === 'pending_creator_approval' &&
      (inv.inviterId === currentUser?.id || myWorkspacesIds.includes(String(inv.workspaceId)))
  );

  // 2. Direct invitations that current user needs to ACCEPT
  const myPendingDirectInvites = safeInvitations.filter(
    (inv) =>
      inv.type === 'direct_invite' &&
      inv.status === 'pending_member' &&
      inv.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/20 backdrop-blur-xs"
      onClick={() => setIsNotificationsOpen(false)}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden mt-12 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 bg-cream-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand" />
            <h3 className="text-xs font-bold text-neutral-900">Notification Center</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(false)}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {/* Section 1: Join Requests requiring Creator Approval */}
          {pendingApprovalsForMe.length > 0 && (
            <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <UserCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Join Requests ({pendingApprovalsForMe.length})</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Users used a workspace join link. As creator, approve or reject their access:
              </p>
              <div className="space-y-2">
                {pendingApprovalsForMe.map((req) => (
                  <div key={req.id} className="p-2.5 bg-white rounded-lg border border-amber-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <div className="font-bold text-xs text-neutral-900 truncate">
                          {req.requesterName || (req.email ? req.email.split('@')[0] : 'User')}
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate">{req.email}</div>
                        <div className="text-[10px] text-amber-700 font-medium">To: {req.workspaceName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => approveJoinRequest(req.id)}
                        className="flex-1 py-1 px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectJoinRequest(req.id)}
                        className="py-1 px-2 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Direct Workspace Invitations requiring Member Acceptance */}
          {myPendingDirectInvites.length > 0 && (
            <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200 space-y-2.5">
              <div className="flex items-center gap-2 text-[#E11D48] font-bold text-xs">
                <Building2 className="w-4 h-4 text-[#E11D48] flex-shrink-0" />
                <span>Workspace Invitations ({myPendingDirectInvites.length})</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-snug">
                You've been invited to join a team workspace:
              </p>
              <div className="space-y-2">
                {myPendingDirectInvites.map((inv) => (
                  <div key={inv.id} className="p-2.5 bg-white rounded-lg border border-rose-200/80 shadow-2xs space-y-2">
                    <div>
                      <div className="font-bold text-xs text-neutral-900">{inv.workspaceName}</div>
                      <div className="text-[10px] text-neutral-500">Invited by: {inv.inviterName || 'Workspace Admin'}</div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => acceptWorkspaceInvitation(inv.id)}
                        className="flex-1 py-1 px-2 rounded-md bg-[#E11D48] hover:bg-[#BE123C] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Accept & Join</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => declineWorkspaceInvitation(inv.id)}
                        className="py-1 px-2 rounded-md border border-neutral-200 hover:bg-neutral-100 text-neutral-600 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Alert Banner */}
          {overdueTasks.length > 0 && (
            <div className="p-3.5 bg-red-50 rounded-xl border border-brand-border space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-brand flex-shrink-0" />
                <span>{overdueTasks.length} Overdue {overdueTasks.length === 1 ? 'Task' : 'Tasks'}</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-snug">
                You have tasks whose due date has passed. Keep your momentum going!
              </p>
              <button
                type="button"
                onClick={() => handleBulkRescheduleOverdue()}
                className="w-full py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                Reschedule all to Today
              </button>
            </div>
          )}

          {/* Assigned Tasks Stream */}
          <div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Your Active Commitments ({assignedToMeTasks.length})
            </div>
            <div className="space-y-1.5">
              {assignedToMeTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    setActiveTaskModal(task);
                    setIsNotificationsOpen(false);
                  }}
                  className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold text-neutral-800 truncate">{task.title}</div>
                    <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>{task.dueDate ? `Due ${task.dueDate}` : 'No due date'}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
