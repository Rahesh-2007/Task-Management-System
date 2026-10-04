import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export default function JoinWorkspacePage() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('id');
  const navigate = useNavigate();

  const {
    currentUser,
    workspaces,
    invitations,
    acceptWorkspaceInvitation,
    declineWorkspaceInvitation,
    requestToJoinWorkspace,
    setActiveWorkspaceId,
  } = useWorkspace();

  const [hasRequested, setHasRequested] = useState(false);
  const [actionDoneMsg, setActionDoneMsg] = useState('');

  const safeWorkspaces = workspaces || [];
  const targetWs = safeWorkspaces.find((w) => String(w.id) === String(workspaceId)) || {
    id: workspaceId || 'ws_team',
    name: 'Team Workspace',
    color: '#E11D48',
  };

  // Check if current user is already an active member or owner
  const isOwner = currentUser?.id && targetWs.ownerId === currentUser.id;
  const isAlreadyMember = currentUser?.id && Array.isArray(targetWs.members) && targetWs.members.includes(currentUser.id);

  // Check if current user has a direct pending invitation for this workspace
  const directInvite = (invitations || []).find(
    (inv) =>
      String(inv.workspaceId) === String(workspaceId) &&
      inv.type === 'direct_invite' &&
      inv.status === 'pending_member' &&
      inv.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );

  // Check if current user already submitted a link request
  const existingRequest = (invitations || []).find(
    (inv) =>
      String(inv.workspaceId) === String(workspaceId) &&
      inv.type === 'link_request' &&
      inv.email?.toLowerCase() === currentUser.email?.toLowerCase()
  );

  const handleAcceptInvite = () => {
    if (directInvite) {
      acceptWorkspaceInvitation(directInvite.id);
      setActionDoneMsg('Invitation accepted! Taking you to the workspace...');
      setTimeout(() => {
        setActiveWorkspaceId(targetWs.id);
        navigate('/app');
      }, 1000);
    }
  };

  const handleDeclineInvite = () => {
    if (directInvite) {
      declineWorkspaceInvitation(directInvite.id);
      navigate('/app');
    }
  };

  const handleSendJoinRequest = () => {
    requestToJoinWorkspace(workspaceId);
    setHasRequested(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-4 font-sans text-neutral-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-200/80 p-8 text-center animate-slide-up">
        {/* Workspace Brand Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center mb-4 shadow-xs">
          <Building2 className="w-8 h-8" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight mb-1">
          {targetWs.name}
        </h1>

        <div className="text-xs font-semibold text-neutral-500 mb-6">
          TaskFlow Team Workspace
        </div>

        {/* Case 1: Already a member or owner */}
        {(isOwner || isAlreadyMember) && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>You are already an active member of this workspace.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveWorkspaceId(targetWs.id);
                navigate('/app');
              }}
              className="w-full py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Open Workspace
            </button>
          </div>
        )}

        {/* Case 2: User has a direct invitation waiting to be accepted */}
        {!isOwner && !isAlreadyMember && directInvite && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-neutral-800 text-xs text-left space-y-1.5">
              <div className="font-bold text-[#E11D48] flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Direct Invitation Received</span>
              </div>
              <p className="text-neutral-600">
                You were invited by <strong>{directInvite.inviterName || 'the workspace creator'}</strong> to collaborate in this workspace. Please accept to join.
              </p>
            </div>

            {actionDoneMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold">
                {actionDoneMsg}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeclineInvite}
                className="flex-1 py-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAcceptInvite}
                className="flex-1 py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Accept Invitation</span>
              </button>
            </div>
          </div>
        )}

        {/* Case 3: User accessed via shareable link -> Creator Must Approve */}
        {!isOwner && !isAlreadyMember && !directInvite && (
          <div className="space-y-5">
            {hasRequested || (existingRequest && existingRequest.status === 'pending_creator_approval') ? (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-2">
                <div className="font-bold flex items-center gap-2 text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Join Request Awaiting Approval</span>
                </div>
                <p className="text-amber-800/90 leading-relaxed">
                  Your request has been sent to the workspace creator. As soon as the creator approves your request, you will get access to this workspace.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/app')}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Back to My Dashboard
                  </button>
                </div>
              </div>
            ) : existingRequest && existingRequest.status === 'accepted' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Your request was approved by the workspace creator!</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveWorkspaceId(targetWs.id);
                    navigate('/app');
                  }}
                  className="w-full py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  Enter Workspace
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-600 text-xs text-left space-y-1.5">
                  <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#E11D48]" />
                    <span>Creator Approval Required</span>
                  </div>
                  <p>
                    Anyone joining via a shared link must be reviewed and approved by the workspace creator before gaining access.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/app')}
                    className="flex-1 py-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendJoinRequest}
                    className="flex-1 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Request to Join</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
