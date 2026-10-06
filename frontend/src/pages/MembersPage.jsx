import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { workspaceApi } from '../api/apiClient';
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  Copy,
  Check,
  Building2,
  Sparkles,
  AlertCircle,
  Inbox,
  ArrowRight,
  X,
} from 'lucide-react';
import Avatar from '../components/app/Avatar';

export default function MembersPage() {
  const {
    workspaces = [],
    activeWorkspace,
    activeWorkspaceId,
    members = [],
    refreshWorkspaceData,
    loadWorkspaces,
    switchWorkspace,
  } = useWorkspace();

  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [targetWorkspaceId, setTargetWorkspaceId] = useState(activeWorkspaceId || workspaces[0]?.id);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [myPendingInvites, setMyPendingInvites] = useState([]);
  const [copiedToken, setCopiedToken] = useState(null);
  const [newlyCreatedInvite, setNewlyCreatedInvite] = useState(null);

  useEffect(() => {
    if (activeWorkspaceId) {
      setTargetWorkspaceId(activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  const currentUserRole = members.find((m) => m.id === user?.id)?.role || 'member';
  const isAdminOrOwner =
    currentUserRole === 'admin' || currentUserRole === 'owner' || activeWorkspace?.owner_id === user?.id;

  // Load sent invitations for active workspace
  const loadSentInvitations = async () => {
    if (!activeWorkspaceId || !isAdminOrOwner) return;
    try {
      const res = await workspaceApi.getInvitations(activeWorkspaceId);
      if (res.success && Array.isArray(res.data)) {
        setSentInvitations(res.data);
      }
    } catch (_) {}
  };

  // Load pending invitations sent to current user's email
  const loadMyPendingInvites = async () => {
    if (!user) return;
    try {
      const res = await workspaceApi.getMyPendingInvitations();
      if (res.success && Array.isArray(res.data)) {
        setMyPendingInvites(res.data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadSentInvitations();
    loadMyPendingInvites();
  }, [activeWorkspaceId, isAdminOrOwner, user]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    const effectiveWsId = targetWorkspaceId || activeWorkspaceId;
    if (!effectiveWsId) {
      setStatusMsg({ type: 'error', text: 'Please select a target workspace.' });
      return;
    }

    const targetWsObj = workspaces.find((w) => String(w.id) === String(effectiveWsId));

    try {
      setIsSubmitting(true);
      setStatusMsg({ type: '', text: '' });
      const res = await workspaceApi.inviteMember(effectiveWsId, email.trim(), role);
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: `Invitation created for ${email.trim()} to join "${targetWsObj?.name || 'Workspace'}"!`,
        });
        setNewlyCreatedInvite(res.data);
        setEmail('');
        if (String(effectiveWsId) === String(activeWorkspaceId)) {
          loadSentInvitations();
        }
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to send invitation.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptMyInvite = async (token, workspaceId) => {
    try {
      const res = await workspaceApi.acceptInvite(token);
      if (res.success) {
        await loadWorkspaces();
        await loadMyPendingInvites();
        switchWorkspace(workspaceId);
        setStatusMsg({ type: 'success', text: 'Workspace joined successfully!' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to accept invitation.' });
    }
  };

  const handleDeclineMyInvite = async (token) => {
    try {
      await workspaceApi.declineInvite(token);
      await loadMyPendingInvites();
    } catch (_) {}
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;
    try {
      const res = await workspaceApi.removeMember(activeWorkspaceId, memberId);
      if (res.success) {
        setStatusMsg({ type: 'success', text: `${memberName} has been removed.` });
        refreshWorkspaceData();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to remove member.' });
    }
  };

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Workspace Banner */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#E11D48] border border-rose-200">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">{activeWorkspace?.name || 'Workspace'}</h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                {activeWorkspace?.type === 'company' ? 'Company Workspace' : 'Personal Workspace'}
              </span>
            </div>
          </div>

        </div>
        <p className="text-xs text-neutral-600 mt-3">
          Manage workspace team members, invite new collaborators, and assign roles.
        </p>
      </div>

      {/* Incoming Invitations Sent to Current User */}
      {myPendingInvites.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-rose-50 to-amber-50 p-6 border border-rose-200 shadow-sm animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[#E11D48]" />
            <h2 className="text-sm font-bold text-neutral-900">
              You Have {myPendingInvites.length} Pending Workspace {myPendingInvites.length === 1 ? 'Invitation' : 'Invitations'}
            </h2>
          </div>

          <div className="space-y-3">
            {myPendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs gap-3"
              >
                <div>
                  <h3 className="text-xs font-bold text-neutral-900">{inv.workspace_name}</h3>
                  <p className="text-[11px] text-neutral-500">
                    Invited by <strong>{inv.inviter_name}</strong> as <span className="uppercase font-semibold">{inv.role}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAcceptMyInvite(inv.token, inv.workspace_id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept & Join</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeclineMyInvite(inv.token)}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-semibold cursor-pointer"
                    title="Decline"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Section (Admin / Owner) */}
      {isAdminOrOwner && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-[#E11D48]" />
            <h2 className="text-sm font-bold text-neutral-900">Invite New Team Member</h2>
          </div>

          {statusMsg.text && (
            <div
              className={`mb-4 flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                statusMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            {/* Target Workspace Picker */}
            {workspaces.length > 1 && (
              <select
                value={targetWorkspaceId || activeWorkspaceId}
                onChange={(e) => setTargetWorkspaceId(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-neutral-50 font-bold text-neutral-800 outline-none focus:border-[#E11D48] cursor-pointer"
                title="Target Workspace"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    To: {ws.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-[#E11D48]"
              />
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-medium text-neutral-700 outline-none focus:border-[#E11D48]"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#E11D48] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#BE123C] transition-all disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Inviting...' : 'Send Invite'}</span>
            </button>
          </form>

          {/* Newly Created Invite Link Card */}
          {newlyCreatedInvite && (
            <div className="mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
              <div>
                <span className="text-xs font-bold text-neutral-900 block">Invitation Ready:</span>
                <span className="text-[11px] text-neutral-600 truncate block max-w-sm">
                  {window.location.origin}/invite/{newlyCreatedInvite.token}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyInviteLink(newlyCreatedInvite.token)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-xs font-bold text-neutral-800 hover:bg-neutral-100 shadow-2xs cursor-pointer"
              >
                {copiedToken === newlyCreatedInvite.token ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Join Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Members */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#E11D48]" />
            <h2 className="text-sm font-bold text-neutral-900">Active Workspace Members ({members.length})</h2>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Avatar
                  user={member}
                  size="lg"
                  rounded="rounded-xl"
                  className="shadow-2xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900">{member.name}</span>
                    {member.id === user?.id && (
                      <span className="text-[10px] font-semibold text-[#E11D48] bg-rose-50 px-1.5 py-0.5 rounded-md">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                  {member.role || 'member'}
                </span>

                {isAdminOrOwner && member.id !== user?.id && member.role !== 'owner' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Sent Invitations */}
      {isAdminOrOwner && sentInvitations.length > 0 && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-200">
          <h2 className="text-sm font-bold text-neutral-900 mb-4">Pending Sent Invitations</h2>
          <div className="space-y-2">
            {sentInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 gap-2"
              >
                <div>
                  <span className="text-xs font-bold text-neutral-900">{inv.email}</span>
                  <p className="text-[11px] text-neutral-500">Role: <span className="uppercase font-semibold">{inv.role || 'member'}</span> · Status: Pending</p>
                </div>

                <button
                  type="button"
                  onClick={() => copyInviteLink(inv.token)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 shadow-2xs transition-colors cursor-pointer"
                >
                  {copiedToken === inv.token ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Copy Direct Join Link</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
