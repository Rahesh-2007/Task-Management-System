import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { workspaceApi } from "../api/apiClient";
import {
  CheckCircle,
  AlertCircle,
  Building2,
  ArrowRight,
  Clock,
  Users,
  Shield,
  Loader2,
  Mail,
  XCircle,
  LogIn,
  UserPlus,
  ChevronRight,
} from "lucide-react";

/* helpers */
function Avatar({ name = "", size = "md" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const cls = size === "lg" ? "w-16 h-16 text-xl font-black rounded-2xl" : "w-10 h-10 text-sm font-bold rounded-xl";
  const colors = ["bg-violet-500","bg-sky-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-indigo-500","bg-teal-500"];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  return <div className={`${cls} ${color} text-white flex items-center justify-center flex-shrink-0`}>{initials || "?"}</div>;
}

function StatPill({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 font-medium">
      <Icon className="w-3.5 h-3.5" />{label}
    </div>
  );
}

/* status sub-views */
function LoadingView() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-[#E11D48] opacity-40" />
        </div>
        <Loader2 className="absolute -top-1 -right-1 w-5 h-5 text-[#E11D48] animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-neutral-700">Verifying invitation&hellip;</p>
        <p className="text-xs text-neutral-400 mt-0.5">Please wait a moment</p>
      </div>
    </div>
  );
}

function ErrorView({ title, message, showGoHome = true }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
        <XCircle className="w-8 h-8 text-red-500" />
      </div>
      <div>
        <h3 className="text-base font-bold text-neutral-900">{title}</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">{message}</p>
      </div>
      {showGoHome && (
        <Link to="/app/today" className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-5 py-2.5 text-xs font-bold transition-all">
          Go to My Tasks <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function ExpiredView({ workspaceName }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
        <Clock className="w-8 h-8 text-amber-500" />
      </div>
      <div>
        <h3 className="text-base font-bold text-neutral-900">Invitation Expired</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
          This invitation to <span className="font-semibold text-neutral-700">{workspaceName || "the workspace"}</span> has
          expired. Please ask the workspace admin to send a new invite.
        </p>
      </div>
      <Link to="/app/today" className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-5 py-2.5 text-xs font-bold transition-all">
        Go to My Tasks <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function SuccessView({ workspaceName }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-8 text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center" style={{animation:"bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards"}}>
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white" />
      </div>
      <div>
        <h3 className="text-base font-bold text-neutral-900">{"You're in! \uD83C\uDF89"}</h3>
        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
          {"You've successfully joined "}
          <span className="font-semibold text-neutral-700">{workspaceName || "the workspace"}</span>.
          <br />Redirecting you now&hellip;
        </p>
      </div>
      <div className="w-32 h-1 rounded-full bg-neutral-100 overflow-hidden">
        <div className="h-full bg-emerald-400 rounded-full" style={{animation:"progress-fill 2s linear forwards"}} />
      </div>
    </div>
  );
}

function AlreadyMemberView({ workspaceName }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
        <Users className="w-8 h-8 text-sky-500" />
      </div>
      <div>
        <h3 className="text-base font-bold text-neutral-900">Already a Member</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
          {"You're already part of "}
          <span className="font-semibold text-neutral-700">{workspaceName || "this workspace"}</span>.
          {" Head there to start collaborating."}
        </p>
      </div>
      <Link to="/app/today" className="inline-flex items-center gap-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all">
        Open Workspace <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function InvitationCard({ inviteData, isAuthenticated, user, onAccept, onDecline, isAccepting, isDeclining }) {
  const roleLabel = inviteData.role === "admin" ? "Admin" : inviteData.role === "owner" ? "Owner" : "Member";
  const expiresAt = inviteData.expires_at ? new Date(inviteData.expires_at) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  const emailMismatch = inviteData.email && user?.email && inviteData.email.toLowerCase() !== user.email.toLowerCase();

  return (
    <div className="flex flex-col gap-6">
      {/* Workspace identity */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100">
        <div className="w-14 h-14 rounded-2xl bg-white border border-rose-200 flex items-center justify-center shadow-sm flex-shrink-0">
          <Building2 className="w-7 h-7 text-[#E11D48]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-0.5">
            {inviteData.workspace_type === "company" ? "Company Workspace" : "Personal Workspace"}
          </p>
          <h3 className="text-lg font-black text-neutral-900 truncate">{inviteData.workspace_name}</h3>
        </div>
      </div>

      {/* Inviter + role */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
          <Avatar name={inviteData.inviter_name || "Team"} size="sm" />
          <div className="min-w-0">
            <p className="text-xs text-neutral-500">Invited by</p>
            <p className="text-sm font-bold text-neutral-900 truncate">{inviteData.inviter_name || "A team member"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatPill icon={Shield} label={`Role: ${roleLabel}`} />
          {inviteData.email && <StatPill icon={Mail} label={inviteData.email} />}
          {daysLeft !== null && (
            <StatPill icon={Clock} label={daysLeft === 0 ? "Expires today" : `Expires in ${daysLeft}d`} />
          )}
        </div>
      </div>

      {/* CTA area */}
      {!isAuthenticated ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">Sign in required.</span> You need a TaskFlow account to accept this invitation.
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 py-2.5 text-xs font-bold transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </Link>
            <Link
              to={`/signup?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white py-2.5 text-xs font-bold shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" /> Create Account
            </Link>
          </div>
          <p className="text-center text-xs text-neutral-400">The invitation will be waiting after you sign in.</p>
        </div>
      ) : emailMismatch ? (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 space-y-2">
          <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Email mismatch
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            This invite was sent to <strong>{inviteData.email}</strong> but you are logged in as{" "}
            <strong>{user.email}</strong>. You can still accept, but the admin may need to verify.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button" onClick={onDecline} disabled={isDeclining}
              className="flex-1 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 text-xs font-bold transition-all"
            >
              {isDeclining ? "Declining\u2026" : "Decline"}
            </button>
            <button
              type="button" onClick={onAccept} disabled={isAccepting}
              className="flex-1 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              {isAccepting ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Joining&hellip;</>) : (<>Accept Anyway <ChevronRight className="w-3.5 h-3.5" /></>)}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <button
            type="button" onClick={onAccept} disabled={isAccepting || isDeclining}
            className="w-full py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] disabled:opacity-60 text-white text-sm font-black shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isAccepting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Joining workspace&hellip;</>) : (<>Accept Invitation <ArrowRight className="w-4 h-4" /></>)}
          </button>
          <button
            type="button" onClick={onDecline} disabled={isAccepting || isDeclining}
            className="w-full py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-xs font-bold transition-all"
          >
            {isDeclining ? "Declining\u2026" : "Decline invitation"}
          </button>
        </div>
      )}
    </div>
  );
}

/* main page */
export default function AcceptInvitePage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const token = params.token || searchParams.get("token");
  const navigate = useNavigate();

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { switchWorkspace, loadWorkspaces } = useWorkspace();

  const [inviteData, setInviteData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorInfo, setErrorInfo] = useState({ title: "", message: "" });

  const checkInvite = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setErrorInfo({ title: "Missing Token", message: "No invitation token was provided in the link." });
      return;
    }
    setStatus("loading");
    try {
      const res = await workspaceApi.getInviteByToken(token);
      if (res.success && res.data) {
        const invite = res.data;
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
          setInviteData(invite);
          setStatus("expired");
        } else {
          setInviteData(invite);
          setStatus("ready");
        }
      } else {
        setStatus("error");
        setErrorInfo({ title: "Invitation Not Found", message: res.message || "This invitation link is invalid or has already been used." });
      }
    } catch (err) {
      if (err.status === 410) {
        setStatus("expired");
      } else if (err.status === 404) {
        setStatus("error");
        setErrorInfo({ title: "Invitation Not Found", message: "This invitation link does not exist or has already been used." });
      } else {
        setStatus("error");
        setErrorInfo({ title: "Something Went Wrong", message: err.message || "Unable to verify the invitation. Please try again." });
      }
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthLoading) checkInvite();
  }, [checkInvite, isAuthLoading]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      sessionStorage.setItem("pending_invite_token", token);
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    try {
      setStatus("accepting");
      const res = await workspaceApi.acceptInvite(token);
      if (res.success && res.data) {
        setStatus("success");
        try { await loadWorkspaces(); switchWorkspace(res.data.id); } catch (_) {}
        setTimeout(() => navigate("/app/today", { replace: true }), 2000);
      } else {
        throw new Error(res.message || "Failed to accept invitation.");
      }
    } catch (err) {
      if (err.status === 409 || (err.message && err.message.toLowerCase().includes("already"))) {
        setStatus("already_member");
      } else if (err.status === 410) {
        setStatus("expired");
      } else {
        setStatus("error");
        setErrorInfo({ title: "Could Not Join", message: err.message || "Something went wrong while accepting the invitation." });
      }
    }
  };

  const handleDecline = async () => {
    try {
      setStatus("declining");
      await workspaceApi.declineInvite(token);
    } catch (_) {}
    navigate(isAuthenticated ? "/app/today" : "/", { replace: true });
  };

  const isActing = status === "accepting" || status === "declining";

  return (
    <>
      <style>{`
        @keyframes progress-fill { from { width:0% } to { width:100% } }
        @keyframes bounce-in {
          0%   { transform:scale(0.5); opacity:0 }
          60%  { transform:scale(1.1) }
          100% { transform:scale(1);  opacity:1 }
        }
        @keyframes fade-up {
          from { opacity:0; transform:translateY(16px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .aip-fade-up { animation: fade-up 0.35s ease-out both }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg,#fff7f7 0%,#fdf4ff 50%,#f0f9ff 100%)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8 aip-fade-up" style={{ animationDelay: "0ms" }}>
          <div className="w-9 h-9 rounded-xl bg-[#E11D48] flex items-center justify-center text-white font-black text-lg shadow-md">T</div>
          <span className="text-lg font-black text-neutral-900 tracking-tight">TaskFlow</span>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden aip-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="h-1 bg-gradient-to-r from-[#E11D48] via-rose-400 to-orange-400" />
          <div className="p-7">
            {/* Header label */}
            <div className="mb-6 text-center">
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-widest mb-1">
                {["ready","accepting","declining"].includes(status) ? "Workspace Invitation"
                  : status === "success" ? "Joined!"
                  : status === "expired" ? "Invitation Expired"
                  : status === "already_member" ? "Already a Member"
                  : status === "loading" ? "Verifying\u2026"
                  : "Invitation Issue"}
              </p>
              {status === "ready" && <h1 className="text-2xl font-black text-neutral-900">{"You've been invited"}</h1>}
            </div>

            {(status === "loading" || isAuthLoading) && <LoadingView />}

            {(status === "ready" || status === "accepting" || status === "declining") && inviteData && (
              <InvitationCard
                inviteData={inviteData}
                isAuthenticated={isAuthenticated}
                user={user}
                onAccept={handleAccept}
                onDecline={handleDecline}
                isAccepting={status === "accepting"}
                isDeclining={status === "declining"}
              />
            )}

            {status === "success" && <SuccessView workspaceName={inviteData?.workspace_name} />}
            {status === "expired" && <ExpiredView workspaceName={inviteData?.workspace_name} />}
            {status === "already_member" && <AlreadyMemberView workspaceName={inviteData?.workspace_name} />}
            {status === "error" && (
              <ErrorView
                title={errorInfo.title || "Something Went Wrong"}
                message={errorInfo.message || "Unable to process this invitation."}
                showGoHome={isAuthenticated}
              />
            )}
          </div>

          {/* Footer */}
          {["ready","accepting","declining"].includes(status) && (
            <div className="px-7 pb-6">
              <p className="text-center text-xs text-neutral-400">
                {"By accepting, you agree to TaskFlow's "}
                <a href="/" className="underline hover:text-neutral-600">Terms of Service</a>.
              </p>
            </div>
          )}
        </div>

        {/* Bottom help */}
        {!isAuthenticated && status !== "loading" && status !== "success" && (
          <p className="mt-6 text-xs text-neutral-500 aip-fade-up" style={{ animationDelay: "150ms" }}>
            Already have an account?{" "}
            <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`} className="font-bold text-[#E11D48] hover:underline">
              Sign in
            </Link>
          </p>
        )}
        {isAuthenticated && status === "error" && (
          <p className="mt-6 text-xs text-neutral-500 aip-fade-up" style={{ animationDelay: "150ms" }}>
            Back to{" "}
            <Link to="/app/today" className="font-bold text-[#E11D48] hover:underline">My Tasks</Link>
          </p>
        )}
      </div>
    </>
  );
}
