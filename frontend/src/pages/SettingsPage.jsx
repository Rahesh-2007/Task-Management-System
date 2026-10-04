import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { authApi } from '../api/authApi';
import { User, Building2, Key, Users, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { currentWorkspace, members = [], inviteMember, removeMember } = useWorkspace();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMsg, setInviteMsg] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await authApi.updateProfile(user.id, { name, email });
      if (res.success) {
        updateUser(res.data);
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setProfileMsg({ type: 'error', text: res.message || 'Update failed' });
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'An error occurred.' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      const res = await authApi.changePassword(user.id, {
        currentPassword,
        newPassword
      });

      if (res.success) {
        setPassMsg({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassMsg({ type: 'error', text: res.message || 'Password change failed' });
      }
    } catch (err) {
      setPassMsg({ type: 'error', text: 'An error occurred.' });
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteMsg({ type: '', text: '' });
    if (!inviteEmail.trim()) return;

    try {
      const res = await inviteMember(inviteEmail.trim(), inviteRole);
      if (res.success) {
        setInviteMsg({ type: 'success', text: res.message || 'Member invited!' });
        setInviteEmail('');
      } else {
        setInviteMsg({ type: 'error', text: res.message || 'Invite failed' });
      }
    } catch (err) {
      setInviteMsg({ type: 'error', text: 'An error occurred.' });
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px' }}>Account Settings</h1>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          className={`view-btn ${activeTab === 'profile' ? 'active' : ''}`}
          style={{ padding: '10px 16px', borderRadius: '0', borderBottom: activeTab === 'profile' ? '2px solid var(--accent-indigo)' : 'none' }}
        >
          <User size={16} /> Profile
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`view-btn ${activeTab === 'password' ? 'active' : ''}`}
          style={{ padding: '10px 16px', borderRadius: '0', borderBottom: activeTab === 'password' ? '2px solid var(--accent-indigo)' : 'none' }}
        >
          <Key size={16} /> Password
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`view-btn ${activeTab === 'team' ? 'active' : ''}`}
          style={{ padding: '10px 16px', borderRadius: '0', borderBottom: activeTab === 'team' ? '2px solid var(--accent-indigo)' : 'none' }}
        >
          <Users size={16} /> Team & Workspace
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="invite-panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Profile Information</h2>
          
          {profileMsg.text && (
            <div className={`toast ${profileMsg.type}`} style={{ position: 'static', animation: 'none' }}>
              <div className="toast-message">{profileMsg.text}</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary">Save Profile</button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="invite-panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Security & Password</h2>

          {passMsg.text && (
            <div className={`toast ${passMsg.type}`} style={{ position: 'static', animation: 'none' }}>
              <div className="toast-message">{passMsg.text}</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary">Update Password</button>
          </div>
        </form>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="invite-panel">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Workspace: {currentWorkspace?.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Type: {currentWorkspace?.type === 'company' ? 'Company Workspace' : 'Personal Workspace'}
            </p>

            {inviteMsg.text && (
              <div className={`toast ${inviteMsg.type}`} style={{ position: 'static', animation: 'none' }}>
                <div className="toast-message">{inviteMsg.text}</div>
              </div>
            )}

            {currentWorkspace?.type === 'company' && (
              <form onSubmit={handleInvite} className="invite-form-row">
                <input
                  type="email"
                  className="form-input"
                  placeholder="worker@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Invite Worker
                </button>
              </form>
            )}
          </div>

          <div className="invite-panel">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Workspace Members ({members.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map(m => (
                <div key={m.id || m.user_id} className="member-card">
                  <div className="member-card-user">
                    <div className="member-card-avatar">
                      {(m.name || m.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="member-card-name">{m.name || m.email}</div>
                      <div className="member-card-email">{m.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`role-badge ${m.role}`}>{m.role}</span>
                    {(m.id || m.user_id) !== user.id && (
                      <button
                        className="btn-icon"
                        style={{ width: 28, height: 28, color: 'var(--accent-rose)' }}
                        onClick={() => removeMember(m.id || m.user_id)}
                        title="Remove member"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
