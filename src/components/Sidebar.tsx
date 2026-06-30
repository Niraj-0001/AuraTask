import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  ListTodo, 
  Calendar, 
  Flame, 
  Folder, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import type { AppTheme, TaskCategory, TaskPriority } from '../types';
import { playClickSound } from '../utils/audio';

interface SidebarProps {
  currentView: 'dashboard' | 'board' | 'list' | 'calendar' | 'focus';
  setView: (view: 'dashboard' | 'board' | 'list' | 'calendar' | 'focus') => void;
  activeCategory: TaskCategory | 'all';
  setCategory: (cat: TaskCategory | 'all') => void;
  activePriority: TaskPriority | 'all';
  setPriority: (priority: TaskPriority | 'all') => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  completedCount: number;
  totalCount: number;
  totalFocusTime: number; // in seconds
  onOpenFocusHub: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  activeCategory,
  setCategory,
  activePriority,
  setPriority,
  theme,
  setTheme,
  completedCount,
  totalCount,
  totalFocusTime,
  onOpenFocusHub
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const views: { id: typeof currentView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'board', label: 'Kanban Board', icon: <KanbanSquare className="w-4 h-4" /> },
    { id: 'list', label: 'List View', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'focus', label: 'Focus Hub', icon: <Clock className="w-4 h-4" /> },
  ];

  const categories: { id: TaskCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Projects' },
    { id: 'study', label: 'Study' },
    { id: 'personal', label: 'Personal' },
    { id: 'shopping', label: 'Shopping' },
    { id: 'health', label: 'Health & Wellness' },
    { id: 'ideas', label: 'Ideas & Brainstorm' },
    { id: 'other', label: 'Other' },
  ];

  const priorities: { id: TaskPriority | 'all'; label: string }[] = [
    { id: 'all', label: 'All Priorities' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  const themes: { id: AppTheme; label: string; icon: React.ReactNode }[] = [
    { id: 'dark', label: 'Void', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'cyberpunk', label: 'Cyber', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'emerald', label: 'Forest', icon: <Folder className="w-3.5 h-3.5" /> },
    { id: 'sunset', label: 'Sunset', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'ocean', label: 'Ocean', icon: <Clock className="w-3.5 h-3.5" /> },
  ];

  const formatFocusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleViewChange = (v: typeof currentView) => {
    playClickSound();
    setView(v);
    setIsOpen(false);
  };

  const handleCategoryChange = (cat: TaskCategory | 'all') => {
    playClickSound();
    setCategory(cat);
  };

  const handlePriorityChange = (prio: TaskPriority | 'all') => {
    playClickSound();
    setPriority(prio);
  };

  const handleThemeChange = (t: AppTheme) => {
    playClickSound();
    setTheme(t);
  };

  return (
    <>
      {/* Mobile Header Toggle */}
      <div className="mobile-header">
        <div className="sidebar-brand" style={{ marginBottom: 0 }}>
          <div className="brand-icon">Ω</div>
          <span className="brand-name">AURA.TASK</span>
        </div>
        <button 
          onClick={() => { playClickSound(); setIsOpen(!isOpen); }}
          className="icon-btn"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Panel */}
      <aside className={`app-sidebar glass ${isOpen ? 'open' : ''}`}>
        
        {/* Brand Logo */}
        <div className="sidebar-brand">
          <div className="brand-icon">Ω</div>
          <span className="brand-name">AuraTask</span>
        </div>

        {/* View Switching */}
        <div className="sidebar-title">Workspace Views</div>
        <nav className="nav-list">
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => handleViewChange(view.id)}
              className={`nav-item ${currentView === view.id ? 'active' : ''}`}
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
        </nav>

        {/* Scrollable Filters Section */}
        <div className="sidebar-scroll">
          
          {/* Projects/Categories */}
          <div className="sidebar-title">Projects</div>
          <div className="filter-list">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`filter-item ${activeCategory === cat.id ? 'active' : ''}`}
              >
                <div className="filter-label">
                  <span 
                    className="column-dot" 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: cat.id === 'all' ? 'var(--text-muted)' : `var(--cat-${cat.id})` 
                    }}
                  />
                  <span>{cat.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Priorities */}
          <div className="sidebar-title">Priorities</div>
          <div className="filter-list">
            {priorities.map(prio => (
              <button
                key={prio.id}
                onClick={() => handlePriorityChange(prio.id)}
                className={`filter-item ${activePriority === prio.id ? 'active' : ''}`}
              >
                <div className="filter-label">
                  <span 
                    className="column-dot" 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: prio.id === 'all' ? 'var(--text-muted)' : `var(--priority-${prio.id})` 
                    }}
                  />
                  <span>{prio.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Theme Selector */}
          <div className="sidebar-title">Aesthetic Theme</div>
          <div className="theme-grid">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`theme-btn ${theme === t.id ? 'active' : ''}`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Widget & Pomodoro Trigger */}
        <div className="sidebar-footer">
          {/* Productivity Stats Widget */}
          <div className="stats-card">
            <div className="stats-row">
              <span className="label">Completion Rate</span>
              <span className="value">{completionRate}%</span>
            </div>
            
            <div className="progress-container">
              <div 
                className="progress-bar-fill"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            
            <div className="stats-details">
              <span className="stats-details-item">
                <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--accent)' }} /> 
                {completedCount}/{totalCount} Done
              </span>
              <span className="stats-details-item">
                <Clock className="w-3 h-3" /> 
                {formatFocusTime(totalFocusTime)}
              </span>
            </div>
          </div>

          {/* Pomodoro Focus Timer Trigger */}
          <button
            onClick={onOpenFocusHub}
            className="pomodoro-trigger-btn glow-btn"
          >
            <Clock className="w-4 h-4" />
            <span>Start Focus Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
