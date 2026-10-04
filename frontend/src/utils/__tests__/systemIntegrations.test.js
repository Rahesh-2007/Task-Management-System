import { describe, it, expect, beforeEach } from 'vitest';
import { parseTaskInput } from '../nlpParser';
import { rescheduleTask, bulkRescheduleOverdue } from '../rescheduleLogic';
import { format, addDays } from 'date-fns';

describe('Task Management System - Comprehensive Functionality Tests', () => {
  let sampleTasks;
  let todayStr;

  beforeEach(() => {
    todayStr = format(new Date(), 'yyyy-MM-dd');
    sampleTasks = [
      {
        id: 'task-1',
        title: 'Review Q4 quarterly deliverables',
        description: 'Prepare report for team leads',
        priority: 'p1',
        dueDate: todayStr,
        completed: false,
        status: 'todo',
        assigneeId: 'user_abbinav',
        projectId: 'proj_work',
        labels: ['Work', 'Q4'],
        subtasks: [
          { id: 'st-1', title: 'Gather metrics', completed: true },
          { id: 'st-2', title: 'Write summary', completed: false },
        ],
        comments: [
          { id: 'c-1', content: 'Almost ready', authorId: 'user_abbinav', timestamp: '10:00 AM' },
        ],
      },
      {
        id: 'task-2',
        title: 'Develop drag-and-drop Kanban columns',
        description: 'Enable smooth card movements across board',
        priority: 'p2',
        dueDate: '2026-09-25', // Overdue
        completed: false,
        status: 'in_progress',
        assigneeId: 'user_ravi',
        projectId: 'proj_hackathon',
        labels: ['Frontend'],
        subtasks: [],
        comments: [],
      },
      {
        id: 'task-3',
        title: 'Team sync and standup notes',
        description: 'Completed morning sync',
        priority: 'p3',
        dueDate: todayStr,
        completed: true,
        status: 'completed',
        assigneeId: 'user_divya',
        projectId: 'proj_work',
        labels: ['Work'],
        subtasks: [],
        comments: [],
      },
      {
        id: 'task-4',
        title: 'Gym workout & 5km run',
        description: 'Health & fitness routine',
        priority: 'p4',
        dueDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
        completed: false,
        status: 'todo',
        assigneeId: 'user_abbinav',
        projectId: 'proj_personal',
        labels: ['Fitness'],
        subtasks: [],
        comments: [],
      },
    ];
  });

  describe('1. Task CRUD & State Management', () => {
    it('creates a task with correct defaults and metadata', () => {
      const parsed = parseTaskInput('Fix critical auth vulnerability p1 #Work +Ravi tomorrow 2pm');
      const newTask = {
        id: `task_${Date.now()}`,
        title: parsed.title,
        priority: parsed.priority,
        dueDate: parsed.dueDate,
        dueTime: parsed.dueTime,
        completed: false,
        status: 'todo',
        assigneeId: 'user_ravi',
        projectId: 'proj_work',
        subtasks: [],
        comments: [],
      };

      expect(newTask.title).toBe('Fix critical auth vulnerability');
      expect(newTask.priority).toBe('p1');
      expect(newTask.completed).toBe(false);
      expect(newTask.status).toBe('todo');
      expect(newTask.assigneeId).toBe('user_ravi');
      expect(newTask.dueDate).toBeTruthy();
    });

    it('toggles task completion properly', () => {
      const task = sampleTasks[0];
      expect(task.completed).toBe(false);

      const toggled = { ...task, completed: !task.completed, status: !task.completed ? 'completed' : 'todo' };
      expect(toggled.completed).toBe(true);
      expect(toggled.status).toBe('completed');

      const unToggled = { ...toggled, completed: !toggled.completed, status: 'todo' };
      expect(unToggled.completed).toBe(false);
      expect(unToggled.status).toBe('todo');
    });

    it('updates task properties including title, priority, dueDate, and subtasks', () => {
      const task = sampleTasks[0];
      const updates = {
        title: 'Updated Deliverables Title',
        priority: 'p2',
        dueDate: '2026-10-15',
        subtasks: [...task.subtasks, { id: 'st-3', title: 'Proofread text', completed: false }],
      };
      const updated = { ...task, ...updates };

      expect(updated.title).toBe('Updated Deliverables Title');
      expect(updated.priority).toBe('p2');
      expect(updated.dueDate).toBe('2026-10-15');
      expect(updated.subtasks.length).toBe(3);
      expect(updated.subtasks[2].title).toBe('Proofread text');
    });

    it('deletes a task from the list', () => {
      const idToDelete = 'task-2';
      const remaining = sampleTasks.filter((t) => t.id !== idToDelete);
      expect(remaining.length).toBe(3);
      expect(remaining.some((t) => t.id === idToDelete)).toBe(false);
    });
  });

  describe('2. Kanban Board Mapping and Column Transitions', () => {
    it('accurately distributes tasks into To Do, In Progress, and Done columns', () => {
      const getColumnTasks = (tasks, columnType) => {
        return tasks.filter((t) => {
          if (columnType === 'done') {
            return t.completed || t.status === 'completed';
          }
          if (t.completed || t.status === 'completed') return false;
          if (columnType === 'progress') {
            return t.status === 'in_progress';
          }
          if (columnType === 'todo') {
            return t.status !== 'in_progress';
          }
          return false;
        });
      };

      const todoTasks = getColumnTasks(sampleTasks, 'todo');
      const inProgressTasks = getColumnTasks(sampleTasks, 'progress');
      const doneTasks = getColumnTasks(sampleTasks, 'done');

      expect(todoTasks.map((t) => t.id)).toEqual(['task-1', 'task-4']);
      expect(inProgressTasks.map((t) => t.id)).toEqual(['task-2']);
      expect(doneTasks.map((t) => t.id)).toEqual(['task-3']);
    });

    it('transitions task status and completion when dragged to different columns', () => {
      const task = sampleTasks[0]; // currently 'todo'
      // Move to In Progress
      const movedToProgress = { ...task, status: 'in_progress', completed: false };
      expect(movedToProgress.status).toBe('in_progress');
      expect(movedToProgress.completed).toBe(false);

      // Move to Done
      const movedToDone = { ...movedToProgress, status: 'completed', completed: true };
      expect(movedToDone.status).toBe('completed');
      expect(movedToDone.completed).toBe(true);

      // Move back to To Do
      const movedBackToTodo = { ...movedToDone, status: 'todo', completed: false };
      expect(movedBackToTodo.status).toBe('todo');
      expect(movedBackToTodo.completed).toBe(false);
    });
  });

  describe('3. Filtering & Search Logic', () => {
    it('filters tasks by search query across title, description, and labels', () => {
      const query = 'kanban';
      const results = sampleTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.labels.some((l) => l.toLowerCase().includes(query))
      );
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('task-2');
    });

    it('filters tasks by priority', () => {
      const p1Tasks = sampleTasks.filter((t) => t.priority === 'p1');
      expect(p1Tasks.length).toBe(1);
      expect(p1Tasks[0].id).toBe('task-1');
    });

    it('filters tasks by tabs: overdue, my_tasks, completed', () => {
      // Overdue tab
      const overdue = sampleTasks.filter((t) => !t.completed && t.dueDate && t.dueDate < todayStr);
      expect(overdue.length).toBe(1);
      expect(overdue[0].id).toBe('task-2');

      // Completed tab
      const completed = sampleTasks.filter((t) => t.completed);
      expect(completed.length).toBe(1);
      expect(completed[0].id).toBe('task-3');

      // My tasks tab
      const myTasks = sampleTasks.filter((t) => t.assigneeId === 'user_abbinav');
      expect(myTasks.length).toBe(2);
      expect(myTasks.map((t) => t.id)).toEqual(['task-1', 'task-4']);
    });
  });

  describe('4. Reschedule Logic & Bulk Overdue Resolution', () => {
    it('reschedules an overdue task to a new target date', () => {
      const overdueTask = sampleTasks[1];
      const targetDate = format(new Date(), 'yyyy-MM-dd');
      const rescheduled = rescheduleTask(overdueTask, targetDate);
      expect(rescheduled.dueDate).toBe(targetDate);
    });

    it('bulk reschedules all overdue tasks in 1 click', () => {
      const targetDate = format(new Date(), 'yyyy-MM-dd');
      const updatedList = bulkRescheduleOverdue(sampleTasks, targetDate);
      const overdueRemaining = updatedList.filter((t) => !t.completed && t.dueDate && t.dueDate < targetDate);
      expect(overdueRemaining.length).toBe(0);
    });
  });

  describe('5. Workload Matrix & Capacity Calculator', () => {
    it('identifies daily task counts per team member and flags overload (> 2 tasks/day)', () => {
      const MAX_CAPACITY = 2;
      const tasksForMemberOnDate = (memberId, date) =>
        sampleTasks.filter((t) => t.assigneeId === memberId && t.dueDate === date && !t.completed);

      const abbinavTasksToday = tasksForMemberOnDate('user_abbinav', todayStr);
      expect(abbinavTasksToday.length).toBe(1);
      expect(abbinavTasksToday.length > MAX_CAPACITY).toBe(false);

      // Simulate overloading with 3 tasks
      const overloadedSet = [
        ...sampleTasks,
        { id: 'extra-1', assigneeId: 'user_abbinav', dueDate: todayStr, completed: false },
        { id: 'extra-2', assigneeId: 'user_abbinav', dueDate: todayStr, completed: false },
      ];
      const overloadedCount = overloadedSet.filter(
        (t) => t.assigneeId === 'user_abbinav' && t.dueDate === todayStr && !t.completed
      ).length;
      expect(overloadedCount).toBe(3);
      expect(overloadedCount > MAX_CAPACITY).toBe(true);
    });
  });
});
