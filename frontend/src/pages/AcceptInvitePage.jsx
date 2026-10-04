import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { createWorkspaceApi } from '../api/workspaceApi';
import { CheckCircle, AlertCircle, Building2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { switchWorkspace } = useWorkspace();

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('Processing invitation...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No invitation token provided.');
      return;
    }

    if (!user) {
      localStorage.setItem('pending_invite_token', token);
      navigate('/login?redirect=invite');
      return;
    }

    const processInvite = async () => {
      try {
        const api = createWorkspaceApi(user.id);
        const ws = await api.acceptInvite(token);
        setStatus('success');
        setMessage(`You have successfully joined ${ws.name || 'the workspace'}!`);
        switchWorkspace(ws);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Failed to accept invitation. Link may be invalid or expired.');
      }
    };

    processInvite();
  }, [token, user, navigate, switchWorkspace]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div className="modal-content" style={{ maxWidth: '440px', padding: '32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          {status === 'loading' && <Building2 size={48} style={{ color: 'var(--accent-indigo)', animation: 'spin 2s linear infinite' }} />}
          {status === 'success' && <CheckCircle size={48} style={{ color: 'var(--accent-emerald)' }} />}
          {status === 'error' && <AlertCircle size={48} style={{ color: 'var(--accent-rose)' }} />}
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
          {status === 'loading' && 'Joining Workspace...'}
          {status === 'success' && 'Welcome to the Team!'}
          {status === 'error' && 'Invitation Error'}
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
          {message}
        </p>

        {status === 'error' && (
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
