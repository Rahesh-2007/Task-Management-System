import React from 'react';
import { format, addDays, isToday } from 'date-fns';
import { Users, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function WorkloadView({ tasks }) {
  const { members, setActiveTaskModal, updateTask } = useWorkspace();

  const today = new Date();
  const days = Array.from({ length: 5 }, (_, i) => addDays(today, i));

  // Max recommended tasks per person per day before showing overload warning
  const MAX_CAPACITY = 2;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-subtle p-4 sm:p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            <h2 className="text-base sm:text-lg font-bold text-neutral-900">
              Team Workload & Capacity Matrix
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitor daily task distribution across 4 teammates to prevent burnout.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Load (≤ {MAX_CAPACITY})
          </span>
          <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-md font-medium border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Overloaded (&gt; {MAX_CAPACITY})
          </span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase">
              <th className="py-3 px-3 w-56">Teammate</th>
              {days.map((d) => (
                <th key={d.toISOString()} className="py-3 px-3 text-center">
                  <div>{format(d, 'EEE')}</div>
                  <div className={`text-[11px] font-normal ${isToday(d) ? 'text-brand font-bold' : ''}`}>
                    {format(d, 'MMM d')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs">
            {(members || []).map((member) => {
              const memberTasks = (tasks || []).filter((t) => t.assigneeId === member.id && !t.completed);

              return (
                <tr key={member.id} className="hover:bg-neutral-50/70 transition-colors">
                  {/* Member Profile */}
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-neutral-200"
                      />
                      <div>
                        <div className="font-bold text-neutral-900">{member.name}</div>
                        <div className="text-[11px] text-neutral-500">{member.title}</div>
                      </div>
                    </div>
                  </td>

                  {/* Per Day Columns */}
                  {days.map((d) => {
                    const dateStr = format(d, 'yyyy-MM-dd');
                    const dayTasks = memberTasks.filter((t) => t.dueDate === dateStr);
                    const isOverloaded = dayTasks.length > MAX_CAPACITY;

                    return (
                      <td key={dateStr} className="py-4 px-2.5 align-top">
                        <div
                          className={`rounded-xl p-2 min-h-[85px] transition-colors ${
                            isOverloaded
                              ? 'bg-red-50/80 border border-red-200'
                              : dayTasks.length > 0
                              ? 'bg-neutral-50 border border-neutral-200/80'
                              : 'bg-transparent border border-dashed border-neutral-200/60'
                          }`}
                        >
                          {/* Task Count Badge */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                isOverloaded
                                  ? 'bg-red-200 text-red-800'
                                  : dayTasks.length > 0
                                  ? 'bg-neutral-200 text-neutral-700'
                                  : 'text-neutral-400'
                              }`}
                            >
                              {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                            </span>
                            {isOverloaded && (
                              <ShieldAlert className="w-3.5 h-3.5 text-brand" title="Overloaded day!" />
                            )}
                          </div>

                          {/* Task Titles */}
                          <div className="space-y-1">
                            {dayTasks.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => setActiveTaskModal(t)}
                                className="p-1 rounded bg-white border border-neutral-200 text-[10px] font-medium text-neutral-800 truncate hover:border-brand cursor-pointer shadow-2xs"
                                title={t.title}
                              >
                                {t.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
