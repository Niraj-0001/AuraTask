import React, { useState, useEffect } from 'react';
import type { Task, TaskPriority, TaskCategory, SubTask } from '../types';
import {
  X,
  Calendar,
  CheckSquare,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface TaskModalProps {
  task: Task | null;
  initialStatus?: string;
  initialDueDate?: string;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'timeSpent'> & { id?: string }) => void;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  initialStatus = 'todo',
  initialDueDate = '',
  onSave,
  onClose
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setCategory(task.category);
      setPriority(task.priority);
      setDueDate(task.dueDate || '');
      setSubtasks(task.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory('study');
      setPriority('medium');
      setDueDate(initialDueDate);
      setSubtasks([]);
    }
  }, [task, initialDueDate]);

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    playClickSound();
    const newSub: SubTask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false
    };

    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subId: string) => {
    playClickSound();
    setSubtasks(subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s));
  };

  const handleDeleteSubtask = (subId: string) => {
    playClickSound();
    setSubtasks(subtasks.filter(s => s.id !== subId));
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError('Task Title is required');
      return;
    }

    playClickSound();
    onSave({
      id: task?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: task ? task.status : (initialStatus as any),
      dueDate,
      subtasks
    });
  };

  const categories: { id: TaskCategory; label: string; color: string }[] = [
    { id: 'study', label: 'Study', color: 'var(--cat-study)' },
    { id: 'personal', label: 'Personal', color: 'var(--cat-personal)' },
    { id: 'shopping', label: 'Shopping', color: 'var(--cat-shopping)' },
    { id: 'health', label: 'Health', color: 'var(--cat-health)' },
    { id: 'ideas', label: 'Ideas', color: 'var(--cat-ideas)' },
    { id: 'other', label: 'Other', color: 'var(--cat-other)' },
  ];

  const priorities: { id: TaskPriority; label: string }[] = [
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  const totalSub = subtasks.length;
  const completedSub = subtasks.filter(s => s.completed).length;
  const subPercent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

  const handleCloseClick = () => {
    playClickSound();
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card editor-modal-card glass animate-scale-in">

        {/* Close Button */}
        <button
          onClick={handleCloseClick}
          className="modal-close-btn"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <h3 className="modal-display-title glow-text">
          <Sparkles className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} />
          <span>{task ? 'Edit Workspace Task' : 'Compose New Task'}</span>
        </h3>

        <div className="editor-form-scroll">
          {/* Title Input */}
          <div className="form-group">
            <label>Task Title <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Redesign analytics UI dashboard"
              className="form-input"
              style={{ borderColor: error ? '#ef4444' : 'var(--border-color)' }}
            />
            {error && (
              <p style={{ fontSize: '9px', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
          </div>

          {/* Description Input */}
          <div className="form-group">
            <label>Description / Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed task description or helper links..."
              rows={3}
              className="form-input"
              style={{ resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Priority Ranking */}
          <div className="form-group">
            <label>Priority Ranking</label>
            <div className="priority-selection-grid">
              {priorities.map(prio => (
                <button
                  key={prio.id}
                  type="button"
                  onClick={() => { playClickSound(); setPriority(prio.id); }}
                  className={`prio-btn ${priority === prio.id ? `active ${prio.id}` : ''}`}
                >
                  {prio.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project Category */}
          <div className="form-group">
            <label>Project Category</label>
            <div className="category-selection-grid">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { playClickSound(); setCategory(cat.id); }}
                  className={`cat-select-btn ${category === cat.id ? 'active' : ''}`}
                >
                  <span
                    className="cat-select-dot"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Due date row */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar className="w-3.5 h-3.5" />
              <span>Due Date</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Subtasks checklist constructor */}
          <div className="subtasks-builder-area">
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <CheckSquare className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span>Checklist Constructor</span>
            </label>

            {/* Subtasks Progress */}
            {totalSub > 0 && (
              <div className="subtasks-progress-badge">
                <div className="stats-row" style={{ fontSize: '10px', marginBottom: '6px' }}>
                  <span className="label" style={{ fontWeight: 'bold' }}>Subtask completion rate</span>
                  <span className="value">{subPercent}%</span>
                </div>
                <div className="progress-container" style={{ marginBottom: 0, height: '4px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${subPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Subtask list */}
            {totalSub > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto', marginBottom: '10px' }}>
                {subtasks.map(sub => (
                  <div key={sub.id} className="subtask-builder-row animate-scale-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span className={`subtask-builder-title ${sub.completed ? 'completed' : ''}`}>
                        {sub.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="subtask-builder-del"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleAddSubtask} className="subtask-input-form">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Compose a checklist item..."
                className="form-input"
              />
              <button
                type="submit"
                className="subtask-add-btn"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Modal Buttons Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleCloseClick}
            className="secondary-btn"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="primary-btn glow-btn"
          >
            {task ? 'Update Changes' : 'Publish Task'}
          </button>
        </div>

      </div>
    </div>
  );
};
