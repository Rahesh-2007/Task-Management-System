import * as chrono from 'chrono-node';
import { format, addDays, addWeeks, addMonths, isPast, isToday, isTomorrow, startOfDay, parseISO } from 'date-fns';

/**
 * Extracts priority, project, labels, assignees, and natural language date/time/recurrence from input string.
 * @param {string} input - Raw user input e.g. "Submit quarterly report tomorrow 4pm p1 #Work @urgent +Alex"
 * @param {Date} [referenceDate=new Date()]
 * @returns {Object} Parsed task fields and sanitized clean title
 */
export function parseTaskInput(input, referenceDate = new Date()) {
  if (!input || typeof input !== 'string') {
    return {
      title: '',
      dueDate: null,
      dueTime: null,
      recurrence: null,
      recurrenceRule: null,
      priority: 'p4',
      labels: [],
      assigneeName: null,
      projectName: null,
    };
  }

  let text = input.trim();
  let priority = 'p4';
  let labels = [];
  let assigneeName = null;
  let projectName = null;
  let recurrence = null;
  let recurrenceRule = null;
  let dueDate = null;
  let dueTime = null;

  // 1. Detect Priority flags: p1, p2, p3, p4 or !1, !2, !3, !4 or !!
  const pMatch = text.match(/(?:^|\s)(?:p([1-4])|!([1-4])|(!{1,3}))(?=\s|$)/i);
  if (pMatch) {
    if (pMatch[1]) priority = `p${pMatch[1]}`;
    else if (pMatch[2]) priority = `p${pMatch[2]}`;
    else if (pMatch[3]) {
      const count = pMatch[3].length;
      priority = count === 3 ? 'p1' : count === 2 ? 'p2' : 'p3';
    }
    text = text.replace(pMatch[0], ' ');
  }

  // 2. Detect Project hashtag #ProjectName
  const projMatch = text.match(/(?:^|\s)#([a-zA-Z0-9_-]+)/);
  if (projMatch) {
    projectName = projMatch[1];
    text = text.replace(projMatch[0], ' ');
  }

  // 3. Detect Assignee +Name
  const assignMatch = text.match(/(?:^|\s)\+([a-zA-Z0-9_-]+)/);
  if (assignMatch) {
    assigneeName = assignMatch[1];
    text = text.replace(assignMatch[0], ' ');
  }

  // 4. Detect Labels @label
  const labelMatches = [...text.matchAll(/(?:^|\s)@([a-zA-Z0-9_-]+)/g)];
  if (labelMatches.length > 0) {
    labels = labelMatches.map(m => m[1]);
    for (const m of labelMatches) {
      text = text.replace(m[0], ' ');
    }
  }

  // 5. Detect Recurrence patterns (e.g. "every day", "every weekday", "every Monday", "every 2 weeks", "monthly")
  const recurrencePattern = /(?:^|\s)(every\s+(?:day|weekday|weekend|week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+\s+(?:days|weeks|months|years))|daily|weekly|monthly|yearly)(?=\s|$)/i;
  const recurMatch = text.match(recurrencePattern);
  if (recurMatch) {
    recurrenceRule = recurMatch[1].toLowerCase().trim();
    recurrence = normalizeRecurrence(recurrenceRule);
    text = text.replace(recurMatch[0], ' ');
  }

  // 6. Chrono-node natural language date & time parsing
  const chronoResults = chrono.parse(text, referenceDate, { forwardDate: true });
  if (chronoResults.length > 0) {
    const firstResult = chronoResults[0];
    const parsedDate = firstResult.start.date();
    
    dueDate = format(parsedDate, 'yyyy-MM-dd');
    
    // Check if a specific time component was explicitly mentioned
    if (firstResult.start.isCertain('hour')) {
      dueTime = format(parsedDate, 'HH:mm');
    }

    // Remove the parsed date snippet from the task title
    text = text.slice(0, firstResult.index) + text.slice(firstResult.index + firstResult.text.length);
  }

  // If recurring was detected without an explicit date, default next date appropriately
  if (recurrence && !dueDate) {
    dueDate = computeNextRecurrenceDate(new Date(), recurrenceRule);
  }

  // Clean extra whitespace
  const cleanTitle = text.replace(/\s+/g, ' ').trim();

  return {
    title: cleanTitle || input.trim(),
    dueDate,
    dueTime,
    recurrence,
    recurrenceRule,
    priority,
    labels,
    assigneeName,
    projectName,
  };
}

/**
 * Normalizes user-friendly recurrence string into standard types
 */
export function normalizeRecurrence(rule) {
  if (!rule) return null;
  const lower = rule.toLowerCase();
  if (lower.includes('weekday')) return 'weekdays';
  if (lower.includes('daily') || lower === 'every day') return 'daily';
  if (lower.includes('2 week') || lower.includes('two week')) return 'biweekly';
  if (lower.includes('week') || lower.includes('weekly')) return 'weekly';
  if (lower.includes('month')) return 'monthly';
  if (lower.includes('year')) return 'yearly';
  return 'custom';
}

/**
 * Computes the subsequent occurrence date after completion of a recurring task
 * @param {string|Date} currentDate
 * @param {string} recurrenceRule
 * @returns {string} yyyy-MM-dd
 */
export function computeNextRecurrenceDate(currentDate = new Date(), recurrenceRule = 'daily') {
  const base = typeof currentDate === 'string' ? parseISO(currentDate) : currentDate;
  const rule = (recurrenceRule || '').toLowerCase();

  if (rule.includes('weekday')) {
    let next = addDays(base, 1);
    const day = next.getDay(); // 0 is Sun, 6 is Sat
    if (day === 6) next = addDays(next, 2); // Sat -> Mon
    else if (day === 0) next = addDays(next, 1); // Sun -> Mon
    return format(next, 'yyyy-MM-dd');
  }

  if (rule.includes('biweekly') || rule.includes('2 week')) {
    return format(addWeeks(base, 2), 'yyyy-MM-dd');
  }

  if (rule.includes('week')) {
    return format(addWeeks(base, 1), 'yyyy-MM-dd');
  }

  if (rule.includes('month')) {
    return format(addMonths(base, 1), 'yyyy-MM-dd');
  }

  // Default daily
  return format(addDays(base, 1), 'yyyy-MM-dd');
}

/**
 * Format a due date nicely for Todoist UI (Today, Tomorrow, Yesterday, Monday, Oct 12, etc.)
 */
export function formatFriendlyDueDate(dateStr, dueTimeStr = null, startTimeStr = null) {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    const today = startOfDay(new Date());
    const target = startOfDay(date);
    
    let label = '';
    let isOverdue = target < today;

    if (isToday(date)) {
      label = 'Today';
    } else if (isTomorrow(date)) {
      label = 'Tomorrow';
    } else {
      // Check if within the next 6 days
      const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
      if (diffDays > 1 && diffDays < 7) {
        label = format(date, 'EEEE'); // e.g. "Monday"
      } else {
        label = format(date, 'MMM d'); // e.g. "Oct 4"
      }
    }

    if (startTimeStr && dueTimeStr) {
      label += ` (${startTimeStr} - ${dueTimeStr})`;
    } else if (startTimeStr) {
      label += ` @ ${startTimeStr}`;
    } else if (dueTimeStr) {
      label += ` ${dueTimeStr}`;
    }

    return { label, isOverdue };
  } catch (e) {
    return { label: dateStr, isOverdue: false };
  }
}
