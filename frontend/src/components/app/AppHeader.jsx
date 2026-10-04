import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  LogOut,
  Check,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function AppHeader() {
  const {
    currentUser,
    searchQuery,
    setSearchQuery,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    logout,
    tasks,
    invitations,
    workspaces,
  } = useWorkspace();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const overdueCount = (tasks || []).filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return t.dueDate < todayStr;
  }).length;

  const myWorkspacesIds = (workspaces || []).map((w) => String(w.id));
  const pendingApprovalsCount = (invitations || []).filter(
    (inv) =>
      inv.type === 'link_request' &&
      inv.status === 'pending_creator_approval' &&
      (inv.inviterId === currentUser?.id || myWorkspacesIds.includes(String(inv.workspaceId)))
  ).length;

  const myPendingInvitesCount = (invitations || []).filter(
    (inv) =>
      inv.type === 'direct_invite' &&
      inv.status === 'pending_member' &&
      inv.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  ).length;

  const totalNotificationCount = overdueCount + pendingApprovalsCount + myPendingInvitesCount;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200/80 px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0 select-none">
      {/* Left side: Sidebar Toggle (at Left) & Brand (at Right) */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Icon & Name */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/app')}>
          <div className="w-8 h-8 rounded-xl bg-[#E11D48] text-white flex items-center justify-center shadow-xs">
            <Check className="w-5 h-5 stroke-[3.5]" />
          </div>
          <span className="text-xl font-black tracking-tight text-neutral-900">
            Task<span className="text-[#E11D48]">Flow</span>
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="relative hidden md:block w-72 lg:w-96 mx-4">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input
          id="app-global-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks, projects, or members..."
          className="w-full bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-neutral-900 placeholder:text-neutral-400 text-xs rounded-xl pl-9 pr-4 py-2 outline-none transition-all border border-neutral-200 focus:border-[#E11D48] focus:ring-2 focus:ring-rose-500/10"
        />
      </div>

      {/* Right side: Notifications, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {totalNotificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#E11D48] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                {totalNotificationCount > 9 ? '9+' : totalNotificationCount}
              </span>
            )}
          </button>
        </div>

        {/* Current User Profile Dropdown (Avatar Only) */}
        <div className="relative pl-1 border-l border-neutral-200">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="p-0.5 rounded-full hover:ring-2 hover:ring-rose-200 transition-all cursor-pointer flex items-center justify-center"
            aria-expanded={isProfileMenuOpen}
            title={currentUser?.name || 'Account'}
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover border border-neutral-200 shadow-2xs"
            />
          </button>

          {/* User Menu Dropdown (Clean - single workspace creation in sidebar) */}
          {isProfileMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white text-neutral-900 rounded-2xl shadow-xl border border-neutral-200 p-2 z-50 animate-slide-up">
              <div className="p-2.5 border-b border-neutral-100">
                <div className="font-bold text-xs text-neutral-900 truncate">{currentUser?.name}</div>
                <div className="text-[11px] text-neutral-500 truncate">{currentUser?.email}</div>
                <div className="text-[10px] text-[#E11D48] font-bold uppercase tracking-wider mt-0.5">Workspace Owner</div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
