import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss, onUndo }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type || 'info'}`}>
          {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald" />}
          {toast.type === 'error' && <AlertCircle size={18} className="text-rose" />}
          {toast.type === 'info' && <Info size={18} className="text-blue" />}
          
          <span className="toast-message">{toast.message}</span>

          {toast.undoAction && (
            <button
              className="btn-undo"
              onClick={() => {
                onUndo(toast.undoAction);
                onDismiss(toast.id);
              }}
            >
              Undo
            </button>
          )}

          <button
            className="btn-icon"
            style={{ width: '24px', height: '24px', border: 'none', background: 'transparent' }}
            onClick={() => onDismiss(toast.id)}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
