import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Mail, Shield, Trash2, Copy, Check, Link, Building2, Lock } from 'lucide-react';
import { createWorkspaceApi } from '../api/workspaceApi';

export default function MembersPage() {
  const { currentWorkspace, members, isLoadingMembers, inviteMember, removeMember, loadMembers } = useWorkspace();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [copiedToken, setCopiedToken] = useState(null);

  const isCompany = currentWorkspace?.type === 'company';
  const isAdmin = members.find(m => m.id === user?.id)?.role === 'admin' || currentWorkspace?.owner_id === user?.id;

  const fetchInvitations = async () => {
    if (!currentWorkspace || currentWorkspace.type !== 'company' || !user) return;
    try {
      const api = createWorkspaceApi(user.id);
      const data = await api.getInvitations(currentWorkspace.id);
      setInvitations(data || []);
    } catch (_) { }
  };

  useEffect(() => {
    if (isCompany) {
      fetchInvitations();
    }
  }, [currentWorkspace?.id, isCompany]);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await inviteMember(email.trim(), role);
      if (res.success) {
        setMessage({ type: 'success', text: `Invitation sent to ${email.trim()}!` });
        setEmail('');
        fetchInvitations();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to invite worker.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'An error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;
    try {
      const res = await removeMember(memberId);
      if (res.success) {
        setMessage({ type: 'success', text: `${memberName} has been removed.` });
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  return (
    <div className="page-container members-container">
      {/* Workspace Header */}
      <div className="members-header-card">
        <div className="members-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={24} style={{ color: 'var(--accent-indigo)' }} />
            <h2>{currentWorkspace?.name || 'Workspace Members'}</h2>
            <span className={`role-badge ${isCompany ? 'admin' : 'member'}`}>
              {isCompany ? 'Company Workspace' : 'Personal Workspace'}
            </span>
          </div>
          <p style={{ marginTop: 6 }}>
            {isCompany
              ? 'Manage worker access, team invitations, and task assignments for your company.'
              : 'This is your private personal workspace. Switch to or create a Company Workspace to invite workers and collaborate.'}
          </p>
        </div>
      </div>

      {/* Invite Workers Section (Company Workspace only) */}
      {isCompany && (
        <div className="invite-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserPlus size={20} style={{ color: 'var(--accent-indigo)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Invite Worker to Workspace</h3>
          </div>

          {message.text && (
            <div className={`toast ${message.type}`} style={{ position: 'static', animation: 'none' }}>
              <div className="toast-message">{message.text}</div>
            </div>
          )}

          <form onSubmit={handleInviteSubmit} className="invite-form-row">
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="worker@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 40, width: '100%' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <UserPlus size={16} />
              {isSubmitting ? 'Inviting...' : 'Send Invitation'}
            </button>
          </form>
        </div>
      )}

      {/* Members List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} style={{ color: 'var(--accent-indigo)' }} />
            Active Team Members ({members.length})
          </h3>
          <button className="btn btn-secondary" onClick={() => loadMembers()} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            Refresh List
          </button>
        </div>

        {isLoadingMembers ? (
          <div className="empty-state">
            <p>Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <Users size={32} style={{ color: 'var(--text-muted)' }} />
            <div className="empty-title">No members found</div>
            <div className="empty-subtitle">Invite your first worker or team member above to start assigning tasks.</div>
          </div>
        ) : (
          <div className="members-card-grid">
            {members.map(member => (
              <div key={member.id} className="member-card">
                <div className="member-card-user">
                  <div className="member-card-avatar">
                    {member.avatar || member.name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="member-card-name">
                      {member.name} {member.id === user?.id && '(You)'}
                    </div>
                    <div className="member-card-email">{member.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className={`role-badge ${member.role}`}>
                    {member.role}
                  </span>
                  {isAdmin && member.id !== user?.id && (
                    <button
                      className="btn-icon"
                      style={{ width: 28, height: 28, color: 'var(--accent-rose)' }}
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      title="Remove worker"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations Table */}
      {isCompany && invitations.length > 0 && (
        <div className="invite-panel" style={{ marginTop: 12 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link size={16} style={{ color: 'var(--accent-indigo)' }} />
            Pending Invitations & Direct Share Links
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {invitations.filter(i => i.status === 'pending').map(inv => (
              <div key={inv.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                gap: 12,
                flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{inv.email}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: Pending</div>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => copyInviteLink(inv.token)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {copiedToken === inv.token ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
                  {copiedToken === inv.token ? 'Link Copied!' : 'Copy Direct Join Link'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
