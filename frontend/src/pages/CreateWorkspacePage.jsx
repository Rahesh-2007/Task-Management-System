import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Mail,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { workspaceApi } from '../api/apiClient';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const COLOR_OPTIONS = [
  '#E11D48', // Brand Crimson
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#111827', // Slate dark
];

export default function CreateWorkspacePage() {
  const navigate = useNavigate();
  const { createWorkspace, currentUser } = useWorkspace();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  
  // Invites state - STRICT: No recommendations, only validated emails
  const [emailInput, setEmailInput] = useState('');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  // Validate single email format
  const validateEmail = (email) => {
    return EMAIL_REGEX.test(email.trim());
  };

  const handleAddEmail = (e) => {
    if (e) e.preventDefault();
    const cleanEmail = emailInput.trim();

    if (!cleanEmail) {
      setEmailError('Please enter an email address.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setEmailError('Invalid email');
      return;
    }

    // Check if duplicate
    if (invitedEmails.some((item) => item.toLowerCase() === cleanEmail.toLowerCase())) {
      setEmailError('This email is already in the invite list.');
      return;
    }

    // Check if inviting oneself
    if (currentUser?.email && currentUser.email.toLowerCase() === cleanEmail.toLowerCase()) {
      setEmailError('You are already the workspace owner.');
      return;
    }

    // Success: add to list and reset input
    setInvitedEmails((prev) => [...prev, cleanEmail]);
    setEmailInput('');
    setEmailError('');
  };

  const handleRemoveEmail = (emailToRemove) => {
    setInvitedEmails((prev) => prev.filter((em) => em !== emailToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!name.trim()) {
      setGeneralError('Please enter a workspace name.');
      return;
    }

    // If there is text in the email field when submitting, validate it
    let finalInvites = [...invitedEmails];
    if (emailInput.trim()) {
      if (!validateEmail(emailInput.trim())) {
        setEmailError('Invalid email');
        return;
      }
      if (!finalInvites.includes(emailInput.trim())) {
        finalInvites.push(emailInput.trim());
      }
    }

    setIsSubmitting(true);

    try {
      const ws = await createWorkspace(name.trim(), 'company');
      if (ws?.id && finalInvites.length > 0) {
        for (const invEmail of finalInvites) {
          try {
            await workspaceApi.inviteMember(ws.id, invEmail);
          } catch (_) {}
        }
      }
      setCreatedSuccess(true);
      setTimeout(() => {
        navigate('/app/today');
      }, 500);
    } catch (err) {
      setGeneralError(err.message || 'Failed to create workspace.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-white border-b border-neutral-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to App</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E11D48] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="font-bold text-base tracking-tight text-neutral-900">
            Task<span className="text-[#E11D48]">Flow</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Header Heading */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-[#E11D48] text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>New Organization Space</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Create Workspace
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Set up a collaborative environment for your team, invite members, and organize tasks together.
          </p>
        </div>

        {/* Global Error Banner */}
        {generalError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <div className="font-semibold">{generalError}</div>
          </div>
        )}

        {/* Success Banner */}
        {createdSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Workspace created successfully!</span> Redirecting to your new dashboard...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Workspace Details */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#E11D48]" />
                <span>Workspace Information</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Choose a name and theme color for this workspace.
              </p>
            </div>

            {/* Workspace Name */}
            <div>
              <label htmlFor="ws-name-input" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Workspace Name <span className="text-red-500">*</span>
              </label>
              <input
                id="ws-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (generalError) setGeneralError('');
                }}
                placeholder="e.g. Acme Corp, Design Team, Marketing Hub"
                className="w-full text-sm px-4 py-3 rounded-xl border border-neutral-300 focus:border-[#E11D48] focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-neutral-400 font-medium"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="ws-desc-input" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Description <span className="text-neutral-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                id="ws-desc-input"
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is the focus of this workspace?"
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#E11D48] focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-neutral-400 font-medium resize-none"
              />
            </div>

            {/* Color Accent Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Brand Color Accent
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      selectedColor === color
                        ? 'ring-3 ring-neutral-900 ring-offset-2 scale-110 shadow-sm'
                        : 'hover:scale-105 opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  >
                    {selectedColor === color && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Invite People (Strict: No recommendations, only valid email) */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-5">
            <div className="border-b border-neutral-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#E11D48]" />
                  <span>Invite People</span>
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
                  {invitedEmails.length} {invitedEmails.length === 1 ? 'person' : 'people'} to invite
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Enter valid email addresses to send workspace invitations. No automated suggestions or recommendations are shown.
              </p>
            </div>

            {/* Email Input & Add Button */}
            <div>
              <label htmlFor="invite-email-input" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Member Email Address
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="invite-email-input"
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    placeholder="Enter email address (e.g. colleague@company.com)"
                    className={`w-full text-sm pl-10 pr-4 py-3 rounded-xl border ${
                      emailError
                        ? 'border-red-500 bg-red-50/20 focus:ring-4 focus:ring-red-500/10'
                        : 'border-neutral-300 focus:border-[#E11D48] focus:ring-4 focus:ring-rose-500/10'
                    } outline-none transition-all placeholder:text-neutral-400 font-medium`}
                    autoComplete="off"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Invite</span>
                </button>
              </div>

              {/* Explicit Email Validation Error Message */}
              {emailError && (
                <div
                  id="email-error-message"
                  className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-red-600 animate-slide-up"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            {/* List of Added Valid Invitees */}
            {invitedEmails.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                  Pending Invitations:
                </div>
                <div className="space-y-2">
                  {invitedEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 group hover:border-neutral-300 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-[#E11D48] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-neutral-800 truncate">{email}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove invite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/app')}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-sm transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || createdSuccess}
              className="px-8 py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Workspace...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
