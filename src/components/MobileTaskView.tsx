import React, { useRef } from 'react';
import type { Task } from '../types';
import { Plus, Check, Calendar, AlertTriangle } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface MobileTaskViewProps {
  tasks: Task[];
  onToggleTaskComplete: (taskId: string, e?: React.MouseEvent) => void;
  onStartFocus: (task: Task) => void;
  onAddNewTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const MobileTaskView: React.FC<MobileTaskViewProps> = ({
  tasks,
  onToggleTaskComplete,
  onStartFocus,
  onAddNewTask,
  onEditTask,
  onDeleteTask
}) => {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (task: Task) => {
    longPressTimer.current = setTimeout(() => {
      onDeleteTask(task.id);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  return (
    <div className="mobile-task-view animate-slide-up" style={{ padding: '0 16px', height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }} className="glow-text">Tasks</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeTasks.length === 0 && completedTasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No tasks found.</p>
            <p style={{ fontSize: '13px' }}>Tap the + button to add one.</p>
          </div>
        )}

        {activeTasks.map(task => {
          const overdue = isOverdue(task.dueDate);
          return (
            <div 
              key={task.id} 
              className="mobile-task-card glass" 
              onClick={() => onEditTask(task)}
              onTouchStart={() => handleTouchStart(task)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
              onMouseDown={() => handleTouchStart(task)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div 
                  onClick={(e) => { e.stopPropagation(); onToggleTaskComplete(task.id, e); }}
                  className="custom-checkbox"
                  style={{ marginTop: '2px', transform: 'scale(1.1)' }}
                >
                  <Check style={{ width: '12px', height: '12px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{task.title}</h4>
                  {task.description && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                      {task.description}
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {task.dueDate && (
                      <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: overdue ? 'var(--priority-critical)' : 'var(--text-muted)', fontWeight: overdue ? 700 : 500 }}>
                        {overdue ? <AlertTriangle style={{ width: '10px', height: '10px' }} /> : <Calendar style={{ width: '10px', height: '10px' }} />}
                        {formatDueDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {completedTasks.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '16px', paddingLeft: '4px' }}>Completed</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {completedTasks.map(task => (
                <div 
                  key={task.id} 
                  className="mobile-task-card glass" 
                  style={{ opacity: 0.6 }} 
                  onClick={() => onEditTask(task)}
                  onTouchStart={() => handleTouchStart(task)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(task)}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div 
                      onClick={(e) => { e.stopPropagation(); onToggleTaskComplete(task.id, e); }}
                      className="custom-checkbox checked"
                      style={{ marginTop: '2px', transform: 'scale(1.1)' }}
                    >
                      <Check style={{ width: '12px', height: '12px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 500, margin: '0', textDecoration: 'line-through', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{task.title}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
