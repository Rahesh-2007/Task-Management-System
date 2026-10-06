import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Menu, LogOut, Check, Settings, User } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from './Avatar';

export default function AppHeader() {
  const { isSidebarOpen, setIsSidebarOpen, activeWorkspace, notifications = [], tasks = [] } = useWorkspace();
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();

  const unreadNotifs = (notifications || []).filter((n) => !n.is_read).length;

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200/80 px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0 select-none">
      {/* Left side: If sidebar is closed, show Menu toggle + Brand */}
      <div className="flex items-center gap-3">
        {!isSidebarOpen ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/app/today" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E11D48] text-white flex items-center justify-center shadow-xs">
                <Check className="w-5 h-5 stroke-[3.5]" />
              </div>
              <span className="text-xl font-black tracking-tight text-neutral-900">
                Task<span className="text-[#E11D48]">Flow</span>
              </span>
            </Link>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-neutral-500">
            <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-bold">
              {activeWorkspace?.name || 'Workspace'}
            </span>
          </div>
        )}
      </div>

      {/* Center: Global Search Bar */}
      <div className="relative hidden md:block w-72 lg:w-96 mx-4">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Press '/' to search tasks & projects..."
          className="w-full bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white text-neutral-900 placeholder:text-neutral-400 text-xs rounded-xl pl-9 pr-4 py-2 outline-none transition-all border border-neutral-200 focus:border-[#E11D48]"
        />
      </div>

      {/* Right side: Notifications & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Notification Bell */}
        <Link
          to="/app/notifications"
          className="relative p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          title="Notifications & Approvals"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifs > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#E11D48] rounded-full ring-2 ring-white" />
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative pl-1 border-l border-neutral-200">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-rose-200 transition-all cursor-pointer"
            aria-expanded={isProfileMenuOpen}
          >
            <Avatar user={user} size="md" className="shadow-2xs" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white text-neutral-900 rounded-2xl shadow-xl border border-neutral-200 p-2 z-50 animate-slide-up">
              <div className="p-2.5 border-b border-neutral-100">
                <div className="font-bold text-xs text-neutral-900 truncate">{user?.name || 'User'}</div>
                <div className="text-[11px] text-neutral-500 truncate">{user?.email}</div>
              </div>

              <div className="py-1">
                <Link
                  to="/app/settings"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <Settings className="w-4 h-4 text-neutral-500" />
                  <span>Account Settings</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
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
