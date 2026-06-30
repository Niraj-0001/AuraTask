import React, { useState } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../types';
import { 
  Calendar, 
  Play, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Check
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface ListViewProps {
  tasks: Task[];
  onToggleTaskComplete: (taskId: string, e?: React.MouseEvent) => void;
  onToggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStartFocus: (task: Task) => void;
}

type GroupingType = 'dueDate' | 'priority' | 'category' | 'status';

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  onToggleTaskComplete,
  onToggleSubtaskComplete,
  onEditTask,
  onDeleteTask,
  onStartFocus
}) => {
  const [grouping, setGrouping] = useState<GroupingType>('status');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleExpandTask = (taskId: string) => {
    playClickSound();
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleCollapseGroup = (groupName: string) => {
    playClickSound();
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Grouping Logics
  const getGroups = () => {
    const groups: Record<string, Task[]> = {};
    const sortedTasks = [...tasks].sort((a, b) => a.title.localeCompare(b.title));

    sortedTasks.forEach(task => {
      let key = 'Unassigned';
      if (grouping === 'status') {
        key = task.status === 'todo' ? 'To Do' 
            : task.status === 'in_progress' ? 'In Progress'
            : task.status === 'review' ? 'Under Review'
            : 'Completed';
      } else if (grouping === 'priority') {
        key = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      } else if (grouping === 'category') {
        key = task.category.charAt(0).toUpperCase() + task.category.slice(1);
      } else if (grouping === 'dueDate') {
        if (!task.dueDate) {
          key = 'No Due Date';
        } else {
          const today = new Date().toISOString().split('T')[0];
          if (task.status === 'completed') {
            key = 'Completed';
          } else if (task.dueDate < today) {
            key = 'Overdue';
          } else if (task.dueDate === today) {
            key = 'Due Today';
          } else {
            key = 'Upcoming';
          }
        }
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return groups;
  };

  const groups = getGroups();

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
    }
  };

  const isOverdue = (dateStr: string, status: TaskStatus) => {
    if (status === 'completed' || !dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTimeSpent = (sec: number) => {
    if (sec === 0) return '0m';
    const mins = Math.floor(sec / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  return (
    <div className="list-view animate-slide-up">
      {/* Header */}
      <div className="list-view-header">
        <div>
          <h1 className="view-title">Workspace Tasks</h1>
          <p className="view-subtitle">Quick checklist and subtask tracking view</p>
        </div>

        {/* Group by control */}
        <div className="list-group-toggle">
          <span>Group By:</span>
          <div className="group-toggle-wrap">
            {(['status', 'priority', 'category', 'dueDate'] as GroupingType[]).map(type => (
              <button
                key={type}
                onClick={() => {
                  playClickSound();
                  setGrouping(type);
                }}
                className={`group-toggle-btn ${grouping === type ? 'active' : ''}`}
              >
                {type === 'dueDate' ? 'Due Date' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lists Group Container */}
      <div className="list-scroll-area">
        {Object.entries(groups).map(([groupName, groupTasks]) => {
          const isCollapsed = collapsedGroups[groupName];

          return (
            <div key={groupName} className="list-group-container">
              {/* Group Title Section */}
              <button
                onClick={() => toggleCollapseGroup(groupName)}
                className="list-group-title-btn"
              >
                <div className="group-title-label">
                  <span className="group-title-text">{groupName}</span>
                  <span className="group-title-count">{groupTasks.length}</span>
                </div>
                {isCollapsed ? (
                  <ChevronDown className="w-4.5 h-4.5" style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <ChevronUp className="w-4.5 h-4.5" style={{ color: 'var(--text-muted)' }} />
                )}
              </button>

              {/* Tasks list inside group */}
              {!isCollapsed && (
                <div className="list-rows-stack">
                  {groupTasks.map(task => {
                    const isExpanded = expandedTasks[task.id];
                    const priorityClass = getPriorityStyle(task.priority);
                    const overdue = isOverdue(task.dueDate, task.status);
                    
                    const totalSub = task.subtasks.length;
                    const completedSub = task.subtasks.filter(s => s.completed).length;
                    const subPercent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

                    return (
                      <div
                        key={task.id}
                        className={`list-row-card glass ${isExpanded ? 'expanded' : ''}`}
                      >
                        {/* Main Row */}
                        <div className="row-main-layout">
                          <div className="row-left-group">
                            <div 
                              onClick={(e) => onToggleTaskComplete(task.id, e)}
                              className={`custom-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
                            >
                              <Check />
                            </div>

                            <div 
                              onClick={() => toggleExpandTask(task.id)}
                              className="row-title-area"
                            >
                              <h4 className={`row-title-text ${task.status === 'completed' ? 'completed' : ''}`}>
                                {task.title}
                              </h4>
                              {task.description && !isExpanded && (
                                <span className="row-desc-snippet">{task.description}</span>
                              )}
                            </div>
                          </div>

                          <div className="row-right-group">
                            {/* Checklist status */}
                            {totalSub > 0 && (
                              <div className="row-subtasks-progress">
                                <div className="row-progress-track">
                                  <div 
                                    className="row-progress-fill" 
                                    style={{ width: `${subPercent}%` }}
                                  />
                                </div>
                                <span className="row-progress-text">{completedSub}/{totalSub}</span>
                              </div>
                            )}

                            {/* Project tag */}
                            <span 
                              className="row-cat-badge"
                              style={{ 
                                border: `1px solid var(--cat-${task.category})33`,
                                color: `var(--cat-${task.category})`,
                                backgroundColor: `var(--cat-${task.category})08`
                              }}
                            >
                              {task.category}
                            </span>

                            {/* Priority tag */}
                            <span className={`priority-badge ${priorityClass}`}>
                              {task.priority}
                            </span>

                            {/* Due date */}
                            {task.dueDate && (
                              <div className={`row-due-date ${overdue ? 'overdue' : ''}`}>
                                {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                <span>{formatDueDate(task.dueDate)}</span>
                              </div>
                            )}

                            {/* Actions block */}
                            <div className="row-actions-divider">
                              {task.status !== 'completed' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onStartFocus(task); }}
                                  title="Focus Session"
                                  className="row-action-btn play"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); playClickSound(); onEditTask(task); }}
                                title="Edit"
                                className="row-action-btn"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                                title="Delete"
                                className="row-action-btn delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExpandTask(task.id); }}
                                className="row-action-btn"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="expanded-panel animate-slide-up">
                            {/* Description */}
                            {task.description ? (
                              <div>
                                <h5 className="expanded-section-title">Description</h5>
                                <p className="expanded-desc-box">{task.description}</p>
                              </div>
                            ) : (
                              <p className="row-desc-snippet" style={{ fontStyle: 'italic' }}>No description details provided</p>
                            )}

                            {/* Subtask list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <h5 className="expanded-section-title">
                                Subtask Checklist {totalSub > 0 && `(${completedSub}/${totalSub})`}
                              </h5>
                              
                              {totalSub > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {task.subtasks.map(sub => (
                                    <div key={sub.id} className="expanded-subtask-row">
                                      <div 
                                        onClick={() => onToggleSubtaskComplete(task.id, sub.id)}
                                        className={`custom-checkbox ${sub.completed ? 'checked' : ''}`}
                                        style={{ width: '18px', height: '18px', borderRadius: '5px' }}
                                      >
                                        <Check style={{ width: '10px', height: '10px' }} />
                                      </div>
                                      <span className={`expanded-subtask-title ${sub.completed ? 'completed' : ''}`}>
                                        {sub.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="row-desc-snippet" style={{ fontStyle: 'italic' }}>No checklist items created</p>
                              )}
                            </div>

                            {/* Footer stats */}
                            <div className="expanded-footer">
                              <div className="expanded-footer-info">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Time Spent Focused: <strong>{formatTimeSpent(task.timeSpent)}</strong></span>
                              </div>
                              <span>Created: {new Date(task.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed var(--border-color)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
            No tasks found matching your filter rules
          </div>
        )}
      </div>
    </div>
  );
};
