import React, { useState } from 'react';
import {
  X,
  Mail,
  UserPlus,
  Copy,
  Check,
  AlertCircle,
  Users,
  Building2,
  Trash2,
  UserCheck,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function InviteModal({ isOpen, onClose }) {
  const {
    authUser,
    currentUser,
    workspaces,
    activeWorkspaceId,
    invitations,
    sendWorkspaceInvite,
    approveJoinRequest,
    rejectJoinRequest,
    cancelWorkspaceInvitation,
  } = useWorkspace();

  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const activeWs = workspaces.find((w) => String(w.id) === String(activeWorkspaceId)) || workspaces[0];

  if (!isOpen) return null;

  const validateEmail = (email) => EMAIL_REGEX.test(email.trim());

  // Workspace invitations for current workspace
  const currentWsInvites = (invitations || []).filter(
    (i) => String(i.workspaceId) === String(activeWs?.id)
  );

  const pendingJoinRequests = currentWsInvites.filter(
    (i) => i.type === 'link_request' && i.status === 'pending_creator_approval'
  );

  const pendingMemberInvites = currentWsInvites.filter(
    (i) => i.type === 'direct_invite' && i.status === 'pending_member'
  );

  const handleSendInvite = (e) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    setEmailError('');
    setSuccessMsg('');

    if (!cleanEmail) {
      setEmailError('Please enter an email address.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setEmailError('Invalid email');
      return;
    }

    if (currentUser?.email && currentUser.email.toLowerCase() === cleanEmail.toLowerCase()) {
      setEmailError('You are already the workspace owner.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = sendWorkspaceInvite(activeWs.id, cleanEmail);
      if (res.success) {
        setSuccessMsg(`Invitation sent to ${cleanEmail}! The member will be added once they accept.`);
        setEmailInput('');
      } else {
        setEmailError(res.message || 'Failed to send invite.');
      }
    } catch (err) {
      setEmailError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyShareLink = () => {
    const inviteUrl = `${window.location.origin}/join-workspace?id=${activeWs?.id || 'default'}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#E11D48] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Invite to {activeWs?.name || 'Workspace'}
              </h3>
              <p className="text-xs text-neutral-500">
                Direct email invites or shareable join link
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 py-3 flex-1 pr-1">
          {/* Success Alert */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Pending Join Requests Requiring Creator Approval */}
          {pendingJoinRequests.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <UserCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Join Requests Awaiting Your Approval ({pendingJoinRequests.length})</span>
              </div>
              <div className="space-y-2">
                {pendingJoinRequests.map((req) => (
                  <div key={req.id} className="p-2.5 bg-white rounded-lg border border-amber-200 shadow-2xs flex items-center justify-between gap-2">
                    <div className="truncate">
                      <div className="font-bold text-xs text-neutral-900 truncate">
                        {req.requesterName || req.email.split('@')[0]}
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate">{req.email}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => approveJoinRequest(req.id)}
                        className="py-1 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
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

          {/* Invite Form */}
          <form onSubmit={handleSendInvite} className="space-y-3">
            <div>
              <label htmlFor="modal-invite-email" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Send Direct Email Invitation <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="modal-invite-email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="Enter email (e.g. colleague@company.com)"
                    className={`w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border ${
                      emailError ? 'border-red-500 bg-red-50/20' : 'border-neutral-300 focus:border-[#E11D48]'
                    } outline-none transition-all placeholder:text-neutral-400`}
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Invite'}</span>
                </button>
              </div>

              {emailError && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-600">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>
          </form>

          {/* Pending Sent Invites (Member must Accept) */}
          {pendingMemberInvites.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Sent Invitations (Awaiting Member Acceptance)
              </div>
              <div className="space-y-1.5">
                {pendingMemberInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="font-semibold text-neutral-800 truncate">{inv.email}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full font-bold">
                        Pending Acceptance
                      </span>
                      <button
                        type="button"
                        onClick={() => cancelWorkspaceInvitation(inv.id)}
                        className="p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Cancel invitation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules / Explanation */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-neutral-600 text-xs space-y-1.5">
            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#E11D48]" />
              <span>Workspace Security & Membership Rules:</span>
            </div>
            <p>
              • <strong>Direct Email Invites:</strong> The invited member must click <strong>Accept Invitation</strong> to join.<br />
              • <strong>Shareable Link:</strong> When someone uses the link to join, you (the creator) must <strong>Approve</strong> their request.
            </p>
          </div>
        </div>

        {/* Direct Link Share Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-neutral-500 truncate">
            Shareable Join Link:
          </div>
          <button
            type="button"
            onClick={copyShareLink}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Join Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
