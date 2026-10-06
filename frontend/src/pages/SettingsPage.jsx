import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { authApi } from '../api/apiClient';
import {
  User,
  Key,
  Building2,
  Check,
  AlertCircle,
  Trash2,
  Plus,
  CheckSquare,
  Square,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import Avatar from '../components/app/Avatar';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const {
    workspaces = [],
    activeWorkspace,
    deleteWorkspace,
    deleteWorkspaces,
    switchWorkspace,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState('profile');
  const [selectedWsIds, setSelectedWsIds] = useState([]);
  const [wsMsg, setWsMsg] = useState({ type: '', text: '' });
  const [isDeletingWs, setIsDeletingWs] = useState(false);

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    try {
      setIsUpdatingProfile(true);
      await updateProfile({ name: name.trim(), email: email.trim(), avatar: '' });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (newPassword.length < 8) {
      setPassMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      setIsUpdatingPass(true);
      const res = await authApi.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPassMsg({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message || 'Password update failed' });
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleToggleSelectWs = (wsId) => {
    setSelectedWsIds((prev) =>
      prev.includes(wsId) ? prev.filter((id) => id !== wsId) : [...prev, wsId]
    );
  };

  const handleSelectAllWs = () => {
    if (selectedWsIds.length === workspaces.length) {
      setSelectedWsIds([]);
    } else {
      setSelectedWsIds(workspaces.map((w) => w.id));
    }
  };

  const handleBulkDeleteWorkspaces = async () => {
    if (selectedWsIds.length === 0) return;
    setWsMsg({ type: '', text: '' });

    const count = selectedWsIds.length;
    const confirmMessage = `Are you sure you want to permanently delete ${count} workspace${count > 1 ? 's' : ''}? All tasks, projects, and members within will be removed.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setIsDeletingWs(true);
      await deleteWorkspaces(selectedWsIds);
      setSelectedWsIds([]);
      setWsMsg({ type: 'success', text: `Successfully deleted ${count} workspace${count > 1 ? 's' : ''}.` });
    } catch (err) {
      setWsMsg({ type: 'error', text: err.message || 'Failed to delete workspaces.' });
    } finally {
      setIsDeletingWs(false);
    }
  };

  const handleDeleteSingleWorkspace = async (wsId, wsName) => {
    setWsMsg({ type: '', text: '' });
    if (!window.confirm(`Are you sure you want to delete workspace "${wsName}"? All tasks, projects, and members will be permanently deleted.`)) {
      return;
    }

    try {
      setIsDeletingWs(true);
      await deleteWorkspace(wsId);
      setSelectedWsIds((prev) => prev.filter((id) => id !== wsId));
      setWsMsg({ type: 'success', text: `Workspace "${wsName}" was deleted successfully.` });
    } catch (err) {
      setWsMsg({ type: 'error', text: err.message || 'Failed to delete workspace.' });
    } finally {
      setIsDeletingWs(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Settings</h1>
        <p className="mt-1 text-xs text-neutral-500">Manage your account profile, password, and workspace preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-[#E11D48] text-[#E11D48]'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
            activeTab === 'password'
              ? 'border-[#E11D48] text-[#E11D48]'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Password & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
            activeTab === 'workspace'
              ? 'border-[#E11D48] text-[#E11D48]'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Workspace Info</span>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Personal Information</h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">Customize your name, email, and profile avatar.</p>
            </div>
          </div>

          {profileMsg.text && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                profileMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {profileMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          {/* Avatar Preview */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center gap-4">
            <Avatar
              name={name || user?.name}
              email={email || user?.email}
              size="3xl"
              className="ring-4 ring-white shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900">Profile Badge</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Auto Generated
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Your profile badge is generated automatically from your name initials.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 outline-none focus:border-[#E11D48]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 outline-none focus:border-[#E11D48]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-neutral-900">Change Password</h2>

          {passMsg.text && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                passMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {passMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <span>{passMsg.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 outline-none focus:border-[#E11D48]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">New Password (min. 8 characters)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 outline-none focus:border-[#E11D48]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 outline-none focus:border-[#E11D48]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdatingPass}
              className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUpdatingPass ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}

      {/* Workspace Management Tab */}
      {activeTab === 'workspace' && (
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Workspaces Management</h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Manage, switch, or batch delete workspaces ({workspaces.length} total).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/workspaces/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Workspace</span>
              </Link>
            </div>
          </div>

          {/* Feedback message */}
          {wsMsg.text && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                wsMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {wsMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
              <span>{wsMsg.text}</span>
            </div>
          )}

          {/* Bulk Action Toolbar */}
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs">
            <label className="flex items-center gap-2 font-semibold text-neutral-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={workspaces.length > 0 && selectedWsIds.length === workspaces.length}
                onChange={handleSelectAllWs}
                className="w-4 h-4 rounded border-neutral-300 text-[#E11D48] focus:ring-[#E11D48] cursor-pointer"
              />
              <span>
                Select All ({selectedWsIds.length}/{workspaces.length})
              </span>
            </label>

            {selectedWsIds.length > 0 && (
              <button
                type="button"
                disabled={isDeletingWs}
                onClick={handleBulkDeleteWorkspaces}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedWsIds.length})</span>
              </button>
            )}
          </div>

          {/* Workspaces List */}
          <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden bg-white">
            {workspaces.map((ws) => {
              const isSelected = selectedWsIds.includes(ws.id);
              const isActive = String(ws.id) === String(activeWorkspace?.id);
              const isOwnerOrAdmin = ws.role === 'owner' || ws.role === 'admin' || !ws.role;

              return (
                <div
                  key={ws.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-colors ${
                    isSelected ? 'bg-rose-50/50' : 'hover:bg-neutral-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectWs(ws.id)}
                      className="w-4 h-4 rounded border-neutral-300 text-[#E11D48] focus:ring-[#E11D48] cursor-pointer"
                    />

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 font-bold text-xs flex-shrink-0">
                      <Building2 className="w-4 h-4 text-neutral-600" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-neutral-900">{ws.name}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold text-white bg-[#E11D48] px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                        {ws.is_default && (
                          <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                        <span className="capitalize">{ws.type || 'personal'} workspace</span>
                        <span>•</span>
                        <span className="uppercase font-semibold text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded">
                          {ws.role || 'owner'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => switchWorkspace(ws.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Switch
                      </button>
                    )}

                    {isOwnerOrAdmin && (
                      <button
                        type="button"
                        disabled={isDeletingWs}
                        onClick={() => handleDeleteSingleWorkspace(ws.id, ws.name)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete this workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Danger explanation */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-[#E11D48]" />
              <span>Workspace Deletion Policy</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Deleting a workspace permanently removes all tasks, projects, comments, and members inside it. If you delete your active workspace, TaskFlow will automatically switch to your remaining default workspace.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
