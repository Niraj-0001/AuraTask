export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskCategory = 'study' | 'personal' | 'shopping' | 'health' | 'ideas' | 'other';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string; // YYYY-MM-DD
  subtasks: SubTask[];
  timeSpent: number; // in seconds, tracked by Pomodoro
  createdAt: string;
}

export interface TaskFilter {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  category: TaskCategory | 'all';
}

export type AppTheme = 'light' | 'dark' | 'cyberpunk' | 'emerald' | 'sunset' | 'ocean' | 'tokyo' | 'nordic' | 'minimal' | 'github' | 'solarized' | 'nebula' | 'latte' | 'mint' | 'cotton';
