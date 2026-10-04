import React from 'react';
import {
  X,
  BarChart3,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  Users,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function ReportsModal({ isOpen, onClose }) {
  const {
    tasks = [],
    projects = [],
    members = [],
    activeWs,
  } = useWorkspace();

  if (!isOpen) return null;

  const safeTasks = tasks || [];
  const safeProjects = projects || [];
  const totalTasks = safeTasks.length;
  const completedTasks = safeTasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const highPriorityCount = safeTasks.filter((t) => t.priority === 'p1').length;
  const mediumPriorityCount = safeTasks.filter((t) => t.priority === 'p2').length;
  const lowPriorityCount = safeTasks.filter((t) => t.priority === 'p3' || t.priority === 'p4').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900">
                Workspace Reports & Productivity
              </h3>
              <p className="text-xs text-neutral-500">
                Analytics for {activeWs?.name || 'My Workspace'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-5 py-4 flex-1 pr-1">
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="text-xs font-semibold text-neutral-500 mb-1">Completion Rate</div>
              <div className="text-2xl font-black text-neutral-900">{completionRate}%</div>
              <div className="w-full h-1.5 bg-neutral-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#E11D48] rounded-full" style={{ width: `${completionRate}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="text-xs font-semibold text-emerald-700 mb-1">Completed</div>
              <div className="text-2xl font-black text-emerald-900">{completedTasks}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-1">tasks finished</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <div className="text-xs font-semibold text-amber-700 mb-1">Pending</div>
              <div className="text-2xl font-black text-amber-900">{pendingTasks}</div>
              <div className="text-[10px] text-amber-600 font-medium mt-1">in progress</div>
            </div>
          </div>

          {/* Breakdown by Projects */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Project Distribution
            </h4>
            <div className="space-y-2">
              {safeProjects.map((proj) => {
                const projTasks = safeTasks.filter((t) => t.projectId === proj.id);
                const projCompleted = projTasks.filter((t) => t.completed).length;
                const projPercent = projTasks.length > 0 ? Math.round((projCompleted / projTasks.length) * 100) : 0;

                return (
                  <div key={proj.id} className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color || '#E11D48' }} />
                      <span className="text-xs font-bold text-neutral-800 truncate">{proj.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-neutral-500">
                      <span>{projCompleted}/{projTasks.length} done</span>
                      <span className="w-10 text-right font-bold text-neutral-800">{projPercent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Priority Status
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 font-bold text-rose-700">
                <div className="text-lg font-black">{highPriorityCount}</div>
                <div>High Priority</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 font-bold text-amber-700">
                <div className="text-lg font-black">{mediumPriorityCount}</div>
                <div>Medium</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 font-bold text-blue-700">
                <div className="text-lg font-black">{lowPriorityCount}</div>
                <div>Low</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
