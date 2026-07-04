import React, { useState, useEffect } from 'react';
import type { Task, TaskPriority, TaskCategory, SubTask } from '../types';
import {
  X,
  Calendar,
  CheckSquare,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  User,
  ShoppingCart,
  Activity,
  Lightbulb,
  Compass,
  ChevronLeft,
  ChevronRight,
  ChevronDown
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
  const todayStr = new Date().toLocaleDateString('sv');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(() => initialDueDate || todayStr);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [error, setError] = useState('');

  // --- Custom Date Picker states ---
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = (dueDate || todayStr) ? new Date((dueDate || todayStr) + 'T00:00:00') : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setCategory(task.category);
      setPriority(task.priority);
      setDueDate(task.dueDate || todayStr);
      setSubtasks(task.subtasks || []);
      const parsedDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : new Date();
      setCalendarDate(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
    } else {
      setTitle('');
      setDescription('');
      setCategory('study');
      setPriority('medium');
      setDueDate(initialDueDate || todayStr);
      setSubtasks([]);
      const parsedDate = (initialDueDate || todayStr) ? new Date((initialDueDate || todayStr) + 'T00:00:00') : new Date();
      setCalendarDate(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
    }
  }, [task, initialDueDate]);

  // --- Close Calendar Dropdown on Outside Click ---
  useEffect(() => {
    if (!showCalendar) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-date-picker-container')) {
        setShowCalendar(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showCalendar]);

  // --- Calendar Date Calculations & Actions ---
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDayIndex = getFirstDayOfMonth(calendarYear, calendarMonth);
  const daysInPrevMonth = getDaysInMonth(calendarYear, calendarMonth - 1);

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const handleSelectDate = (day: number, isCurrentMonth: 'prev' | 'curr' | 'next', e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    let d = new Date(calendarYear, calendarMonth, day);
    if (isCurrentMonth === 'prev') {
      d = new Date(calendarYear, calendarMonth - 1, day);
    } else if (isCurrentMonth === 'next') {
      d = new Date(calendarYear, calendarMonth + 1, day);
    }
    const formatted = d.toLocaleDateString('sv');
    setDueDate(formatted);
    setShowCalendar(false);
  };

  const getSwedishDateString = (date: Date) => {
    return date.toLocaleDateString('sv');
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekdayInitials = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const gridDays: { day: number; dateStr: string; isCurrentMonth: 'prev' | 'curr' | 'next' }[] = [];

  // Prepend previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevDate = new Date(calendarYear, calendarMonth - 1, day);
    gridDays.push({
      day,
      dateStr: getSwedishDateString(prevDate),
      isCurrentMonth: 'prev'
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const currDate = new Date(calendarYear, calendarMonth, i);
    gridDays.push({
      day: i,
      dateStr: getSwedishDateString(currDate),
      isCurrentMonth: 'curr'
    });
  }

  // Append next month days
  const remaining = 42 - gridDays.length;
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(calendarYear, calendarMonth + 1, i);
    gridDays.push({
      day: i,
      dateStr: getSwedishDateString(nextDate),
      isCurrentMonth: 'next'
    });
  }

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

  const categories: { id: TaskCategory; label: string; color: string; icon: React.ReactNode }[] = [
    { id: 'study', label: 'Study', color: 'var(--cat-study)', icon: <BookOpen size={14} /> },
    { id: 'personal', label: 'Personal', color: 'var(--cat-personal)', icon: <User size={14} /> },
    { id: 'shopping', label: 'Shopping', color: 'var(--cat-shopping)', icon: <ShoppingCart size={14} /> },
    { id: 'health', label: 'Health', color: 'var(--cat-health)', icon: <Activity size={14} /> },
    { id: 'ideas', label: 'Ideas', color: 'var(--cat-ideas)', icon: <Lightbulb size={14} /> },
    { id: 'other', label: 'Other', color: 'var(--cat-other)', icon: <Compass size={14} /> },
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
    <div className="task-page-container">
      {/* Top Header Navigation */}
      <header className="task-page-header">
        <button
          onClick={handleCloseClick}
          className="task-page-header-back"
          title="Back to Workspace (Esc)"
        >
          <ArrowLeft size={16} />
          <span>Back to Workspace</span>
        </button>

        <h3 className="task-page-header-title">
          <Sparkles className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} />
          <span>{task ? 'Edit Workspace Task' : 'Compose New Task'}</span>
        </h3>

        <div style={{ width: '130px' }} className="hidden md:block" /> {/* Balance the flex space */}
      </header>

      {/* Main Workspace Form */}
      <div className="task-page-content">
        <form onSubmit={(e) => e.preventDefault()} className="task-page-form animate-scale-in">

          <div className="task-page-grid">

            {/* Left Column - Primary Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Large minimalist title */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Task Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. Redesign analytics UI dashboard..."
                  className="task-title-input-large"
                  autoFocus
                />
                {error && (
                  <p style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <AlertTriangle className="w-3.5 h-3.5" /> {error}
                  </p>
                )}
              </div>

              {/* Description field */}
              <div className="task-page-card">
                <div className="task-page-card-title">
                  <span>Description &amp; Workspace Notes</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed context, links, or goals for this task..."
                  rows={6}
                  className="form-input"
                  style={{ resize: 'vertical', fontFamily: 'inherit', minHeight: '120px' }}
                />
              </div>

              {/* Checklist Builder */}
              <div className="task-page-card">
                <div className="task-page-card-title">
                  <CheckSquare className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>Checklist Constructor</span>
                </div>

                {/* Subtasks Progress */}
                {totalSub > 0 && (
                  <div className="subtasks-progress-badge" style={{ padding: '0 0 12px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <div className="stats-row" style={{ fontSize: '11px', marginBottom: '8px' }}>
                      <span className="label" style={{ fontWeight: 'bold' }}>Subtask completion rate</span>
                      <span className="value" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{subPercent}%</span>
                    </div>
                    <div className="progress-container" style={{ marginBottom: 0, height: '6px', borderRadius: '3px' }}>
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${subPercent}%`, borderRadius: '3px' }}
                      />
                    </div>
                  </div>
                )}

                {/* Subtask list */}
                {totalSub > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '12px', paddingRight: '4px' }}>
                    {subtasks.map(sub => (
                      <div key={sub.id} className="subtask-builder-row animate-scale-in" style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.015)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => handleToggleSubtask(sub.id)}
                            style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                          />
                          <span className={`subtask-builder-title ${sub.completed ? 'completed' : ''}`} style={{ fontSize: '13px' }}>
                            {sub.title}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(sub.id)}
                          className="subtask-builder-del"
                          style={{ padding: '4px' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Form */}
                <div className="subtask-input-form">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const mockEvent = { preventDefault: () => { } } as React.FormEvent;
                        handleAddSubtask(mockEvent);
                      }
                    }}
                    placeholder="Add a checklist item (Press Enter or Click +)..."
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const mockEvent = { preventDefault: () => { } } as React.FormEvent;
                      handleAddSubtask(mockEvent);
                    }}
                    className="subtask-add-btn"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Metadata Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Due Date Card */}
              <div className="task-page-card">
                <div className="task-page-card-title">
                  <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>Due Date</span>
                </div>

                <div className="custom-date-picker-container">
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="custom-date-picker-trigger"
                    title="Select due date"
                  >
                    <span style={{ fontWeight: 600 }}>
                      {dueDate ? new Date(dueDate + 'T00:00:00').toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select Date'}
                    </span>
                    <ChevronDown size={16} style={{ transform: showCalendar ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>

                  {showCalendar && (
                    <div className="custom-calendar-dropdown" onClick={(e) => e.stopPropagation()}>
                      <div className="cc-nav-row">
                        <button type="button" onClick={prevMonth} className="cc-nav-btn">
                          <ChevronLeft size={16} />
                        </button>
                        <span className="cc-month-year">
                          {monthNames[calendarMonth]} {calendarYear}
                        </span>
                        <button type="button" onClick={nextMonth} className="cc-nav-btn">
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      <div className="cc-weekdays-row">
                        {weekdayInitials.map(d => (
                          <span key={d} className="cc-weekday-lbl">{d}</span>
                        ))}
                      </div>

                      <div className="cc-days-grid">
                        {gridDays.map((cell, idx) => {
                          const isSelected = dueDate === cell.dateStr;
                          const cellToday = cell.dateStr === todayStr;
                          return (
                            <div
                              key={idx}
                              onClick={(e) => handleSelectDate(cell.day, cell.isCurrentMonth, e)}
                              className={`
                                cc-day-cell 
                                ${cell.isCurrentMonth !== 'curr' ? 'inactive' : ''}
                                ${cellToday ? 'today' : ''}
                                ${isSelected ? 'selected' : ''}
                              `}
                            >
                              {cell.day}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Priority Selection */}
              <div className="task-page-card">
                <div className="task-page-card-title">
                  <span>Priority Ranking</span>
                </div>
                <div className="priority-selection-grid">
                  {priorities.map(prio => (
                    <button
                      key={prio.id}
                      type="button"
                      onClick={() => { playClickSound(); setPriority(prio.id); }}
                      className={`prio-btn ${priority === prio.id ? `active ${prio.id}` : ''}`}
                      style={{ padding: '12px 8px', fontSize: '12px' }}
                    >
                      {prio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Category */}
              <div className="task-page-card">
                <div className="task-page-card-title">
                  <span>Project Category</span>
                </div>
                <div className="category-selection-grid">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { playClickSound(); setCategory(cat.id); }}
                      className={`cat-select-btn ${category === cat.id ? 'active' : ''}`}
                    >
                      <span
                        className="cat-select-icon"
                        style={{ display: 'flex', color: category === cat.id ? 'var(--accent)' : cat.color }}
                      >
                        {cat.icon}
                      </span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Footer Actions */}
          <div className="task-page-footer">
            <button
              type="button"
              onClick={handleCloseClick}
              className="secondary-btn"
              style={{ padding: '12px 24px', borderRadius: '12px' }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="primary-btn glow-btn"
              style={{ padding: '12px 28px', borderRadius: '12px' }}
            >
              {task ? 'Save Workspace Changes' : 'Publish Task'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
