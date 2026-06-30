import React, { useState } from 'react';
import type { Task, TaskStatus } from '../types';
import { 
  Calendar, 
  CheckSquare, 
  Play, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Plus
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface BoardViewProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStartFocus: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  tasks,
  onUpdateTaskStatus,
  onEditTask,
  onDeleteTask,
  onStartFocus,
  onAddTask
}) => {
  const [activeDragColumn, setActiveDragColumn] = useState<TaskStatus | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'var(--text-muted)' },
    { id: 'in_progress', title: 'In Progress', color: 'var(--accent)' },
    { id: 'review', title: 'Under Review', color: '#fb923c' },
    { id: 'completed', title: 'Completed', color: '#10b981' },
  ];

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    
    setTimeout(() => {
      const card = document.getElementById(`task-card-${taskId}`);
      if (card) card.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (taskId: string) => {
    setDraggedTaskId(null);
    setActiveDragColumn(null);
    const card = document.getElementById(`task-card-${taskId}`);
    if (card) card.classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (activeDragColumn !== status) {
      setActiveDragColumn(status);
    }
  };

  const handleDragLeave = () => {
    setActiveDragColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onUpdateTaskStatus(taskId, status);
    }
    setActiveDragColumn(null);
    setDraggedTaskId(null);
  };

  const isOverdue = (dateStr: string, status: TaskStatus) => {
    if (status === 'completed' || !dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleCardEditClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault();
    playClickSound();
    onEditTask(task);
  };

  const handleCardDeleteClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    e.preventDefault();
    onDeleteTask(taskId);
  };

  const handleCardPlayClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault();
    onStartFocus(task);
  };

  const handleColumnAddClick = (status: TaskStatus) => {
    playClickSound();
    onAddTask(status);
  };

  return (
    <div className="board-view animate-slide-up">
      {/* Board Header */}
      <div className="board-header">
        <div>
          <h1 className="view-title">Kanban Board</h1>
          <p className="view-subtitle">Drag tasks between statuses to track completion</p>
        </div>
      </div>

      {/* Columns Container */}
      <div className="board-columns">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          const isOver = activeDragColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`board-column ${isOver ? 'drag-over' : ''}`}
            >
              {/* Column Header */}
              <div className="column-header">
                <div className="column-title-group">
                  <span className="column-dot" style={{ backgroundColor: col.color }} />
                  <h3 className="column-name">{col.title}</h3>
                  <span className="column-count">{colTasks.length}</span>
                </div>
                <button
                  onClick={() => handleColumnAddClick(col.id)}
                  className="column-add-btn"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Cards List */}
              <div className="column-cards">
                {colTasks.length > 0 ? (
                  colTasks.map(task => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    
                    const totalSub = task.subtasks.length;
                    const completedSub = task.subtasks.filter(s => s.completed).length;
                    const subPercent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

                    return (
                      <div
                        key={task.id}
                        id={`task-card-${task.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={() => handleDragEnd(task.id)}
                        className={`task-card animate-scale-in ${task.status === 'completed' ? 'completed' : ''}`}
                      >
                        {/* Tags and Actions Row */}
                        <div className="card-top-row">
                          <div className="card-category">
                            <span 
                              className="category-dot" 
                              style={{ backgroundColor: `var(--cat-${task.category})` }}
                            />
                            <span>{task.category}</span>
                          </div>
                          
                          {/* Actions */}
                          <div className="card-actions">
                             {task.status !== 'completed' && (
                              <button
                                onClick={(e) => handleCardPlayClick(e, task)}
                                title="Focus session"
                                className="card-action-btn play"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleCardEditClick(e, task)}
                              title="Edit task"
                              className="card-action-btn"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleCardDeleteClick(e, task.id)}
                              title="Delete task"
                              className="card-action-btn delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="card-title">{task.title}</h4>

                        {/* Description snippet */}
                        {task.description && (
                          <p className="card-desc">{task.description}</p>
                        )}

                        {/* Subtasks Progress */}
                        {totalSub > 0 && (
                          <div className="card-subtasks">
                            <div className="subtasks-header">
                              <span className="subtasks-count">
                                <CheckSquare className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> 
                                <span>Checklist ({completedSub}/{totalSub})</span>
                              </span>
                              <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{subPercent}%</span>
                            </div>
                            <div className="progress-container" style={{ marginBottom: 0, height: '4px' }}>
                              <div 
                                className="progress-bar-fill"
                                style={{ width: `${subPercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Card Footer Info */}
                        <div className="card-footer">
                          {/* Priority Badge */}
                          <span className={`priority-badge ${task.priority}`}>
                            {task.priority}
                          </span>

                          {/* Due Date Indicator */}
                          {task.dueDate && (
                            <div className={`card-due-date ${overdue ? 'overdue' : ''}`}>
                              {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                              <span>{formatDueDate(task.dueDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ height: '96px', borderRadius: '16px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '500' }}>
                    No tasks remaining
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
