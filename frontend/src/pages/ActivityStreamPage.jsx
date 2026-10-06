import React, { useState, useEffect } from 'react';
import {
  Radio,
  CheckCircle2,
  PlusCircle,
  Video,
  Calendar,
  UserPlus,
  RefreshCw,
  FolderPlus,
  Tag,
  Clock,
  Filter,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { teamApi } from '../api/apiClient';
import Avatar from '../components/app/Avatar';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function ActivityStreamPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const [activities, setActivities] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadActivities = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await teamApi.getActivityStream(activeWorkspaceId);
      if (res.success && Array.isArray(res.data)) {
        setActivities(res.data);
      }
    } catch (err) {
      console.error('[ActivityStream] Failed to load activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time polling every 4s
  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 4000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  const getActionBadge = (action) => {
    if (action.includes('completed')) {
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        label: 'Task Completed',
      };
    }
    if (action.includes('created') || action.includes('task_created')) {
      return {
        icon: <PlusCircle className="w-4 h-4 text-[#E11D48]" />,
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        label: 'Created',
      };
    }
    if (action.includes('meeting')) {
      return {
        icon: <Video className="w-4 h-4 text-blue-600" />,
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        label: 'Google Meet',
      };
    }
    if (action.includes('vacation')) {
      return {
        icon: <Calendar className="w-4 h-4 text-amber-600" />,
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        label: 'Vacation / Time-off',
      };
    }
    if (action.includes('member') || action.includes('joined')) {
      return {
        icon: <UserPlus className="w-4 h-4 text-purple-600" />,
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        label: 'Team',
      };
    }
    return {
      icon: <Radio className="w-4 h-4 text-neutral-500" />,
      bg: 'bg-neutral-50 text-neutral-800 border-neutral-200',
      label: 'Activity',
    };
  };

  const filteredActivities = activities.filter((act) => {
    if (filterType === 'all') return true;
    if (filterType === 'tasks') return act.action.includes('task');
    if (filterType === 'meetings') return act.action.includes('meeting');
    if (filterType === 'vacations') return act.action.includes('vacation');
    if (filterType === 'team') return act.action.includes('member') || act.action.includes('workspace');
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#E11D48] border border-rose-100 shadow-2xs">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">Activity Stream</h1>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Feed
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Live updates on tasks, meetings, vacation requests, and team changes in {activeWorkspace?.name}.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadActivities}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Activity' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'meetings', label: 'Meetings' },
          { id: 'vacations', label: 'Vacations' },
          { id: 'team', label: 'Team & Workspaces' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === tab.id
                ? 'bg-[#E11D48] text-white shadow-2xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center space-y-2">
            <Radio className="w-8 h-8 text-neutral-300 mx-auto" />
            <h3 className="text-xs font-bold text-neutral-700">No activity yet in this filter</h3>
            <p className="text-[11px] text-neutral-400">Actions taken by your team will appear here in real time.</p>
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-neutral-200 divide-y divide-neutral-100 shadow-sm overflow-hidden">
            {filteredActivities.map((act) => {
              const badge = getActionBadge(act.action);
              let metaObj = {};
              try {
                metaObj = typeof act.metadata === 'string' ? JSON.parse(act.metadata) : act.metadata || {};
              } catch (_) {}

              const relativeTime = act.created_at
                ? formatDistanceToNow(new Date(act.created_at), { addSuffix: true })
                : 'just now';

              return (
                <div key={act.id} className="p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-neutral-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <Avatar
                      user={{ name: act.user_name, email: act.user_email, avatar: act.user_avatar }}
                      size="md"
                      className="mt-0.5 shadow-2xs flex-shrink-0"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-neutral-900">{act.user_name || 'System'}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <p className="text-xs text-neutral-700">
                        {act.action === 'task_created' && (
                          <>Created task <strong>"{act.task_title || metaObj.title || 'Untitled'}"</strong></>
                        )}
                        {act.action === 'task_completed' && (
                          <>Completed task <strong>"{act.task_title || metaObj.title || 'Task'}"</strong></>
                        )}
                        {act.action === 'meeting_scheduled' && (
                          <>Scheduled Google Meet: <strong>"{metaObj.title || 'Meeting'}"</strong></>
                        )}
                        {act.action === 'vacation_requested' && (
                          <>Requested {metaObj.type || 'time off'} from <strong>{metaObj.start_date}</strong> to <strong>{metaObj.end_date}</strong></>
                        )}
                        {act.action === 'workspace_created' && (
                          <>Created workspace <strong>"{metaObj.name}"</strong></>
                        )}
                        {!['task_created', 'task_completed', 'meeting_scheduled', 'vacation_requested', 'workspace_created'].includes(act.action) && (
                          <span>{act.action.replace(/_/g, ' ')}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-neutral-400 whitespace-nowrap flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{relativeTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
