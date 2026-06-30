import React, { useState } from 'react';
import type { Task, TaskPriority } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Edit3,
  Play,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

const getLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface CalendarViewProps {
  tasks: Task[];
  onToggleTaskComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStartFocus: (task: Task) => void;
  onAddTaskOnDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onToggleTaskComplete,
  onEditTask,
  onDeleteTask,
  onStartFocus,
  onAddTaskOnDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    getLocalDateString(new Date())
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const nextMonth = () => {
    playClickSound();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    playClickSound();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const selectDate = (day: number, isCurrentMonth: 'prev' | 'curr' | 'next') => {
    playClickSound();
    let d = new Date(year, month, day);
    if (isCurrentMonth === 'prev') {
      d = new Date(year, month - 1, day);
    } else if (isCurrentMonth === 'next') {
      d = new Date(year, month + 1, day);
    }
    setSelectedDateStr(getLocalDateString(d));
  };

  const gridDays: { day: number; dateStr: string; isCurrentMonth: 'prev' | 'curr' | 'next' }[] = [];

  // Prev month fill
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, day);
    gridDays.push({
      day,
      dateStr: getLocalDateString(prevDate),
      isCurrentMonth: 'prev'
    });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const currDate = new Date(year, month, i);
    gridDays.push({
      day: i,
      dateStr: getLocalDateString(currDate),
      isCurrentMonth: 'curr'
    });
  }

  // Next month fill
  const remainingCells = 42 - gridDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    gridDays.push({
      day: i,
      dateStr: getLocalDateString(nextDate),
      isCurrentMonth: 'next'
    });
  }

  const getTasksForDate = (dateStr: string) => {
    return tasks.filter(t => t.dueDate === dateStr);
  };

  const selectedDateTasks = getTasksForDate(selectedDateStr);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getPriorityClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
    }
  };

  const isToday = (dateStr: string) => {
    return dateStr === getLocalDateString(new Date());
  };

  const handleTaskCheckClick = (taskId: string) => {
    onToggleTaskComplete(taskId);
  };

  const handleTaskEditClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault();
    playClickSound();
    onEditTask(task);
  };

  const handleTaskDeleteClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    e.preventDefault();
    onDeleteTask(taskId);
  };

  const handleTaskPlayClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault();
    onStartFocus(task);
  };

  const handleAddTaskClick = () => {
    playClickSound();
    onAddTaskOnDate(selectedDateStr);
  };

  return (
    <div className="calendar-view animate-slide-up">

      {/* Left side: Calendar grid */}
      <div className="calendar-main-card">
        {/* Calendar Navigation header */}
        <div className="calendar-nav-row">
          <div>
            <h2 className="calendar-month-year">
              {monthNames[month]} {year}
            </h2>
            <p className="calendar-subtext">Click a cell to view or add tasks</p>
          </div>

          <div className="calendar-nav-buttons">
            <button onClick={prevMonth} className="icon-btn">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextMonth} className="icon-btn">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekdays Labels */}
        <div className="calendar-weekdays-grid">
          {weekdayNames.map(d => (
            <span key={d} className="weekday-lbl">{d}</span>
          ))}
        </div>

        {/* Days cells */}
        <div className="calendar-days-grid">
          {gridDays.map((cell, idx) => {
            const cellTasks = getTasksForDate(cell.dateStr);
            const isSelected = selectedDateStr === cell.dateStr;
            const cellToday = isToday(cell.dateStr);

            return (
              <div
                key={idx}
                onClick={() => selectDate(cell.day, cell.isCurrentMonth)}
                className={`
                  calendar-day-cell 
                  ${cell.isCurrentMonth !== 'curr' ? 'inactive' : ''}
                  ${cellToday ? 'today' : ''}
                  ${isSelected ? 'selected' : ''}
                `}
              >
                <span className="cell-day-num">{cell.day}</span>

                {/* Dots row */}
                <div className="cell-dots-row">
                  {cellTasks.map(t => (
                    <span
                      key={t.id}
                      title={t.title}
                      className="cell-dot"
                      style={{
                        backgroundColor: t.status === 'completed'
                          ? 'var(--text-muted)'
                          : `var(--cat-${t.category})`
                      }}
                    />
                  ))}
                </div>

                {/* Hover Add icon */}
                <span className="cell-hover-plus">
                  <Plus className="w-2.5 h-2.5" />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side: Day Task Drawer */}
      <div className="calendar-side-panel">
        <div className="side-panel-header">
          <div>
            <span className="side-panel-title-label">Tasks Scheduled</span>
            <h2 className="side-panel-title-date">
              {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </h2>
          </div>

          <button
            onClick={handleAddTaskClick}
            className="icon-btn"
            style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', gap: '4px' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Task List */}
        <div className="calendar-task-list">
          {selectedDateTasks.length > 0 ? (
            selectedDateTasks.map(task => {
              const priorityClass = getPriorityClass(task.priority);

              return (
                <div key={task.id} className="calendar-task-row animate-scale-in">
                  <div className="calendar-task-left">
                    <div
                      onClick={() => handleTaskCheckClick(task.id)}
                      className={`custom-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
                      style={{ width: '18px', height: '18px', borderRadius: '5px' }}
                    >
                      <Check style={{ width: '10px', height: '10px' }} />
                    </div>

                    <div className="calendar-task-info">
                      <h4 className={`calendar-task-title ${task.status === 'completed' ? 'completed' : ''}`}>
                        {task.title}
                      </h4>

                      <div className="calendar-task-meta">
                        <span className="calendar-task-meta-dot" style={{ backgroundColor: `var(--cat-${task.category})` }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{task.category}</span>
                        <span className={`priority-badge ${priorityClass}`} style={{ padding: '1px 4px', fontSize: '7px', borderRadius: '3px' }}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="calendar-task-actions">
                    {task.status !== 'completed' && (
                      <button
                        onClick={(e) => handleTaskPlayClick(e, task)}
                        className="row-action-btn play"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleTaskEditClick(e, task)}
                      className="row-action-btn"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleTaskDeleteClick(e, task.id)}
                      className="row-action-btn delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '16px', padding: '16px' }}>
              <AlertCircle className="w-5 h-5" style={{ color: 'var(--text-muted)', marginBottom: '4px' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500' }}>No tasks scheduled for today</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
