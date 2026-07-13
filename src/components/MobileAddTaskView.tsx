import React, { useState, useEffect } from 'react';
import type { Task, TaskPriority, TaskCategory } from '../types';
import { ArrowLeft, Check, AlertTriangle, Calendar } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface MobileAddTaskViewProps {
  task: Task | null;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'timeSpent'> & { id?: string }) => void;
  onCancel: () => void;
}

export const MobileAddTaskView: React.FC<MobileAddTaskViewProps> = ({
  task,
  onSave,
  onCancel
}) => {
  const todayStr = new Date().toLocaleDateString('sv');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(() => todayStr);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setCategory(task.category);
      setPriority(task.priority);
      setDueDate(task.dueDate || todayStr);
    }
  }, [task]);

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
      status: task ? task.status : 'todo',
      dueDate,
      subtasks: task ? task.subtasks : []
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

  return (
    <div className="mobile-add-task-view animate-slide-up" style={{ padding: '16px', paddingBottom: '120px', height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'var(--bg-primary)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={() => { playClickSound(); onCancel(); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '8px' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
          {task ? 'Edit Task' : 'New Task'}
        </h2>
        <button onClick={handleSave} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: '16px', padding: '8px' }}>
          Save
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Title Input */}
        <div>
          <textarea
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            placeholder="Task Title"
            rows={2}
            style={{ 
              width: '100%', 
              background: 'transparent', 
              border: 'none', 
              borderBottom: '1px solid var(--border-color)', 
              fontSize: '24px', 
              fontWeight: 600, 
              color: 'var(--text-primary)',
              padding: '8px 0',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              wordBreak: 'break-word'
            }}
            autoFocus
          />
          {error && (
            <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details..."
            rows={3}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Priority */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Priority</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {priorities.map(prio => (
              <button
                key={prio.id}
                type="button"
                onClick={() => { playClickSound(); setPriority(prio.id); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: `1px solid var(--priority-${prio.id})`,
                  background: priority === prio.id ? `var(--priority-${prio.id})` : 'transparent',
                  color: priority === prio.id ? '#fff' : `var(--priority-${prio.id})`,
                  transition: 'all var(--transition-fast)'
                }}
              >
                {prio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Category</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { playClickSound(); setCategory(cat.id); }}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: priority === cat.id ? '1px solid transparent' : '1px solid var(--border-color)',
                  background: category === cat.id ? `rgba(var(--accent-rgb), 0.1)` : 'var(--bg-secondary)',
                  color: category === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span>{cat.label}</span>
                {category === cat.id && <Check className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Due Date</label>
          <div style={{ position: 'relative' }}>
            <Calendar className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 12px 12px 36px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
