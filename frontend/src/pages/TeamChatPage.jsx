import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  Smile,
  Clock,
  Sparkles,
  Paperclip,
  CheckCheck,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { teamApi } from '../api/apiClient';
import Avatar from '../components/app/Avatar';
import { format } from 'date-fns';

export default function TeamChatPage() {
  const { activeWorkspaceId, activeWorkspace, members = [] } = useWorkspace();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const isInitialLoad = useRef(true);

  const loadMessages = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await teamApi.getChatMessages(activeWorkspaceId);
      if (res.success && Array.isArray(res.data)) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('[TeamChatPage] Failed to fetch messages:', err);
    }
  };

  // Real-time polling every 3s
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: isInitialLoad.current ? 'auto' : 'smooth' });
      isInitialLoad.current = false;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isSending) return;

    // Optimistic message
    const tempMsg = {
      id: `temp_${Date.now()}`,
      workspace_id: activeWorkspaceId,
      user_id: user?.id,
      user_name: user?.name || 'You',
      user_email: user?.email,
      user_avatar: user?.avatar,
      user_role: 'member',
      content: cleanText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await teamApi.sendChatMessage(activeWorkspaceId, cleanText);
      if (res.success && res.data) {
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? res.data : m)));
      }
    } catch (err) {
      console.error('[TeamChat] Error sending message:', err);
      // Revert optimistic if error
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center border border-rose-100 shadow-2xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-neutral-900">Team Chat</h1>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Real-Time
              </span>
            </div>
            <p className="text-xs text-neutral-500 truncate">
              {activeWorkspace?.name || 'Workspace'} · {members.length} team {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {/* Teammates Avatar Stack */}
        <div className="flex items-center -space-x-2">
          {members.slice(0, 5).map((m) => (
            <Avatar key={m.id} user={m} size="sm" className="ring-2 ring-white shadow-2xs" />
          ))}
          {members.length > 5 && (
            <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              +{members.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-neutral-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-rose-50 text-[#E11D48] flex items-center justify-center border border-rose-100 shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">Welcome to #{activeWorkspace?.name || 'Team'} Chat</h3>
            <p className="text-xs text-neutral-500 max-w-sm">
              This is the start of your team channel. Send messages, collaborate in real time, and share updates!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.user_id === user?.id || msg.user_email === user?.email;
            const timeStr = msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : '';

            return (
              <div
                key={msg.id || index}
                className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar
                  user={{ name: msg.user_name, email: msg.user_email, avatar: msg.user_avatar }}
                  size="md"
                  className="mt-0.5 shadow-2xs flex-shrink-0"
                />

                <div className={`space-y-1 max-w-[80%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="font-bold text-neutral-900">{isMe ? 'You' : msg.user_name}</span>
                    {msg.user_role && msg.user_role !== 'member' && (
                      <span className="text-[9px] uppercase font-bold text-neutral-500 bg-neutral-200/80 px-1 rounded">
                        {msg.user_role}
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-400">{timeStr}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isMe
                        ? 'bg-[#E11D48] text-white rounded-tr-xs shadow-xs font-normal'
                        : 'bg-white text-neutral-800 rounded-tl-xs border border-neutral-200 shadow-2xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-neutral-200 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="relative flex-1">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${activeWorkspace?.name || 'team'}... (Press Enter to send)`}
              className="w-full text-xs sm:text-sm pl-4 pr-10 py-3 rounded-2xl border border-neutral-300 focus:border-[#E11D48] outline-none resize-none transition-all placeholder:text-neutral-400 max-h-32"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-3 rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white transition-all shadow-xs disabled:opacity-40 cursor-pointer flex-shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
