import { format, addDays, nextMonday, nextSaturday, isPast, isToday, parseISO, startOfDay } from 'date-fns';

/**
 * Calculates quick target dates for Todoist-style rescheduling
 */
export function getQuickRescheduleOptions(referenceDate = new Date()) {
  const today = format(referenceDate, 'yyyy-MM-dd');
  const tomorrow = format(addDays(referenceDate, 1), 'yyyy-MM-dd');
  const thisWeekend = format(nextSaturday(referenceDate), 'yyyy-MM-dd');
  const nextWeek = format(nextMonday(referenceDate), 'yyyy-MM-dd');

  return [
    { id: 'today', label: 'Today', icon: 'sun', date: today, shortcut: 'T' },
    { id: 'tomorrow', label: 'Tomorrow', icon: 'sunrise', date: tomorrow, shortcut: 'TOM' },
    { id: 'weekend', label: 'This weekend', icon: 'couch', date: thisWeekend, shortcut: 'WKND' },
    { id: 'next_week', label: 'Next week', icon: 'calendar-days', date: nextWeek, shortcut: 'NEXT' },
    { id: 'no_date', label: 'No date', icon: 'ban', date: null, shortcut: 'DEL' },
  ];
}

/**
 * Reschedules a single task to a new date/time
 */
export function rescheduleTask(task, newDate, newTime = null) {
  return {
    ...task,
    dueDate: newDate,
    dueTime: newTime !== undefined ? newTime : task.dueTime,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Bulk reschedules all overdue tasks to a target date (e.g. today or tomorrow)
 * @param {Array} tasks
 * @param {string} [targetDate] - Defaults to today's date formatted yyyy-MM-dd
 */
export function bulkRescheduleOverdue(tasks, targetDate = format(new Date(), 'yyyy-MM-dd')) {
  const todayStart = startOfDay(new Date());

  return tasks.map(task => {
    if (!task.completed && task.dueDate) {
      const taskDate = startOfDay(parseISO(task.dueDate));
      if (taskDate < todayStart) {
        return {
          ...task,
          dueDate: targetDate,
          updatedAt: new Date().toISOString(),
        };
      }
    }
    return task;
  });
}

/**
 * Filters and partitions tasks into Overdue, Today, Upcoming, and No Date buckets
 */
export function groupTasksBySchedule(tasks) {
  const todayStart = startOfDay(new Date());
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const overdue = [];
  const today = [];
  const upcoming = [];
  const noDate = [];
  const completed = [];

  for (const task of tasks) {
    if (task.completed) {
      completed.push(task);
      continue;
    }

    if (!task.dueDate) {
      noDate.push(task);
      continue;
    }

    const taskDate = startOfDay(parseISO(task.dueDate));
    if (taskDate < todayStart) {
      overdue.push(task);
    } else if (task.dueDate === todayStr || isToday(taskDate)) {
      today.push(task);
    } else {
      upcoming.push(task);
    }
  }

  // Sort upcoming chronologically
  upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return {
    overdue,
    today,
    upcoming,
    noDate,
    completed,
  };
}
