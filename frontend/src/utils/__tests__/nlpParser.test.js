import { describe, it, expect } from 'vitest';
import { parseTaskInput, computeNextRecurrenceDate, normalizeRecurrence, formatFriendlyDueDate } from '../nlpParser.js';
import { getQuickRescheduleOptions, rescheduleTask, bulkRescheduleOverdue, groupTasksBySchedule } from '../rescheduleLogic.js';

describe('NLP Task Parser & Recurrence Scheduler', () => {
  const mockRefDate = new Date(2026, 9, 4, 10, 0, 0); // Oct 4, 2026

  it('parses basic task title correctly', () => {
    const result = parseTaskInput('Buy groceries', mockRefDate);
    expect(result.title).toBe('Buy groceries');
    expect(result.priority).toBe('p4');
    expect(result.dueDate).toBeNull();
  });

  it('extracts priority tags p1, p2, p3, p4 and exclamation marks', () => {
    const res1 = parseTaskInput('Fix critical bug p1', mockRefDate);
    expect(res1.priority).toBe('p1');
    expect(res1.title).toBe('Fix critical bug');

    const res2 = parseTaskInput('Submit expense report p2', mockRefDate);
    expect(res2.priority).toBe('p2');

    const res3 = parseTaskInput('Write blog post !!!', mockRefDate);
    expect(res3.priority).toBe('p1');
  });

  it('extracts projects, labels, and assignees with hashtags, @, and + tokens', () => {
    const result = parseTaskInput('Launch campaign #Marketing @growth @q4 +Sarah', mockRefDate);
    expect(result.title).toBe('Launch campaign');
    expect(result.projectName).toBe('Marketing');
    expect(result.labels).toEqual(['growth', 'q4']);
    expect(result.assigneeName).toBe('Sarah');
  });

  it('parses natural language dates and times via chrono-node', () => {
    const result = parseTaskInput('Meeting with design team tomorrow 4pm p1', mockRefDate);
    expect(result.title).toBe('Meeting with design team');
    expect(result.dueDate).toBe('2026-10-05');
    expect(result.dueTime).toBe('16:00');
    expect(result.priority).toBe('p1');
  });

  it('detects recurring schedules like every Monday, daily, weekdays', () => {
    const resDaily = parseTaskInput('Review team metrics every day', mockRefDate);
    expect(resDaily.recurrence).toBe('daily');
    expect(resDaily.recurrenceRule).toBe('every day');

    const resWeekday = parseTaskInput('Standup sync every weekday', mockRefDate);
    expect(resWeekday.recurrence).toBe('weekdays');

    const resBiweekly = parseTaskInput('Sprint retrospective every 2 weeks', mockRefDate);
    expect(resBiweekly.recurrence).toBe('biweekly');
  });

  it('computes next recurrence dates correctly', () => {
    const nextDaily = computeNextRecurrenceDate('2026-10-04', 'daily');
    expect(nextDaily).toBe('2026-10-05');

    const nextWeekly = computeNextRecurrenceDate('2026-10-04', 'every week');
    expect(nextWeekly).toBe('2026-10-11');

    const nextBiweekly = computeNextRecurrenceDate('2026-10-04', 'every 2 weeks');
    expect(nextBiweekly).toBe('2026-10-18');
  });
});

describe('Reschedule Logic', () => {
  it('provides quick reschedule options for today, tomorrow, weekend, and next week', () => {
    const options = getQuickRescheduleOptions(new Date(2026, 9, 4));
    expect(options.length).toBe(5);
    expect(options.find(o => o.id === 'today').date).toBe('2026-10-04');
    expect(options.find(o => o.id === 'tomorrow').date).toBe('2026-10-05');
  });

  it('reschedules a single task', () => {
    const task = { id: 't1', title: 'Task 1', dueDate: '2026-10-01', dueTime: null, completed: false };
    const updated = rescheduleTask(task, '2026-10-05', '14:30');
    expect(updated.dueDate).toBe('2026-10-05');
    expect(updated.dueTime).toBe('14:30');
  });

  it('bulk reschedules overdue tasks while leaving non-overdue tasks unchanged', () => {
    const tasks = [
      { id: 't1', title: 'Overdue task', dueDate: '2020-01-01', completed: false },
      { id: 't2', title: 'Future task', dueDate: '2099-01-01', completed: false },
      { id: 't3', title: 'Completed overdue', dueDate: '2020-01-01', completed: true },
    ];
    const targetDate = '2026-10-04';
    const result = bulkRescheduleOverdue(tasks, targetDate);

    expect(result.find(t => t.id === 't1').dueDate).toBe(targetDate);
    expect(result.find(t => t.id === 't2').dueDate).toBe('2099-01-01');
    expect(result.find(t => t.id === 't3').dueDate).toBe('2020-01-01');
  });

  it('correctly partitions tasks into schedule groups', () => {
    const tasks = [
      { id: 't1', title: 'Overdue', dueDate: '2020-01-01', completed: false },
      { id: 't2', title: 'Future', dueDate: '2099-01-01', completed: false },
      { id: 't3', title: 'No date', dueDate: null, completed: false },
      { id: 't4', title: 'Done', dueDate: '2026-10-04', completed: true },
    ];
    const grouped = groupTasksBySchedule(tasks);
    expect(grouped.overdue.length).toBe(1);
    expect(grouped.upcoming.length).toBe(1);
    expect(grouped.noDate.length).toBe(1);
    expect(grouped.completed.length).toBe(1);
  });
});
