import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  UserPlus,
  Copy,
  Check,
  AlertCircle,
  Building2,
  Trash2,
  Clock,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { workspaceApi } from '../../api/apiClient';

export default function InviteModal({ isOpen, onClose }) {
  const {
    isInviteModalOpen,
    setIsInviteModalOpen,
    workspaces = [],
    activeWorkspaceId,
    activeWorkspace,
    refreshWorkspaceData,
  } = useWorkspace();

  const { user } = useAuth();

  const modalOpen = isOpen !== undefined ? isOpen : isInviteModalOpen;
  const handleClose = onClose || (() => setIsInviteModalOpen(false));

  const [selectedWsId, setSelectedWsId] = useState(activeWorkspaceId || workspaces[0]?.id);
  const [emailInput, setEmailInput] = useState('');
  const [role, setRole] = useState('member');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const [newlyCreatedInvite, setNewlyCreatedInvite] = useState(null);
  const [wsInvitations, setWsInvitations] = useState([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);

  // Sync selected workspace when modal opens or active workspace changes
  useEffect(() => {
    if (modalOpen) {
      setSelectedWsId(activeWorkspaceId || workspaces[0]?.id);
      setErrorMsg('');
      setSuccessMsg('');
      setNewlyCreatedInvite(null);
    }
  }, [modalOpen, activeWorkspaceId, workspaces]);

  const targetWs = workspaces.find((w) => String(w.id) === String(selectedWsId)) || activeWorkspace || workspaces[0];

  // Fetch pending invitations for the selected workspace
  const loadWsInvitations = async (wsId) => {
    if (!wsId) return;
    try {
      setIsLoadingInvites(true);
      const res = await workspaceApi.getInvitations(wsId);
      if (res.success && Array.isArray(res.data)) {
        setWsInvitations(res.data);
      } else {
        setWsInvitations([]);
      }
    } catch (_) {
      setWsInvitations([]);
    } finally {
      setIsLoadingInvites(false);
    }
  };

  useEffect(() => {
    if (modalOpen && selectedWsId) {
      loadWsInvitations(selectedWsId);
    }
  }, [modalOpen, selectedWsId]);

  if (!modalOpen) return null;

  const handleSendInvite = async (e) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    setErrorMsg('');
    setSuccessMsg('');
    setNewlyCreatedInvite(null);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (user?.email && user.email.toLowerCase() === cleanEmail.toLowerCase()) {
      setErrorMsg('You cannot invite yourself.');
      return;
    }

    if (!selectedWsId) {
      setErrorMsg('Please select a target workspace.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await workspaceApi.inviteMember(selectedWsId, cleanEmail, role);
      if (res.success && res.data) {
        setSuccessMsg(`Invitation sent to ${cleanEmail} for "${targetWs?.name || 'Workspace'}"!`);
        setNewlyCreatedInvite(res.data);
        setEmailInput('');
        loadWsInvitations(selectedWsId);
        if (String(selectedWsId) === String(activeWorkspaceId)) {
          refreshWorkspaceData();
        }
      } else {
        setErrorMsg(res.message || 'Failed to send invite.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while sending the invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteLink = (token) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center border border-rose-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Invite Collaborator
              </h3>
              <p className="text-xs text-neutral-500">
                Add a member to any of your workspaces
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 py-4 flex-1 pr-1">
          {/* Target Workspace Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Target Workspace <span className="text-[#E11D48]">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedWsId || ''}
                onChange={(e) => setSelectedWsId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50 text-xs font-bold text-neutral-800 outline-none focus:border-[#E11D48] cursor-pointer appearance-none"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.type === 'company' ? 'Company' : 'Personal'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Success Notification */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Error Notification */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#E11D48] flex-shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Direct Invite Form */}
          <form onSubmit={handleSendInvite} className="space-y-3">
            <div>
              <label htmlFor="modal-invite-email" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Member Email & Role <span className="text-[#E11D48]">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="modal-invite-email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="colleague@company.com"
                    className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#E11D48] outline-none transition-all placeholder:text-neutral-400"
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-neutral-300 bg-white font-medium text-xs text-neutral-700 outline-none focus:border-[#E11D48] cursor-pointer"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending...' : 'Invite'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Newly Created Invite Action Card */}
          {newlyCreatedInvite && (
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2 animate-slide-up">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-neutral-900">Direct Invitation Link</span>
                <button
                  type="button"
                  onClick={() => copyInviteLink(newlyCreatedInvite.token)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-[#E11D48] hover:bg-rose-50 shadow-2xs cursor-pointer"
                >
                  {copiedToken === newlyCreatedInvite.token ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-neutral-600 truncate font-mono bg-white p-2 rounded-lg border border-neutral-200">
                {window.location.origin}/invite/{newlyCreatedInvite.token}
              </p>
            </div>
          )}

          {/* Pending Sent Invites for Selected Workspace */}
          {wsInvitations.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Pending Invitations for {targetWs?.name || 'Workspace'} ({wsInvitations.length})
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {wsInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="font-semibold text-neutral-800 truncate">{inv.email}</span>
                      <span className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-200/80 px-1.5 py-0.5 rounded">
                        {inv.role || 'member'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyInviteLink(inv.token)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                    >
                      {copiedToken === inv.token ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-neutral-400" />
                          <span>Link</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security & Access Info */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-neutral-600 text-xs space-y-1.5">
            <div className="font-bold text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#E11D48]" />
              <span>Workspace Access & Permissions:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              • <strong>Member:</strong> Can view workspace projects, create tasks, and update assignments.<br />
              • <strong>Admin:</strong> Can manage workspace settings, invite members, and edit projects.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
