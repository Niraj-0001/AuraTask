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
  CheckCircle2,
  ChevronDown,
  BookOpen,
  User,
  ShoppingCart,
  Activity,
  Lightbulb,
  Compass,
  Grid
} from 'lucide-react';
import type { AppTheme, TaskCategory, TaskPriority } from '../types';
import { playClickSound } from '../utils/audio';

interface SidebarProps {
  currentView: 'dashboard' | 'board' | 'list' | 'calendar' | 'focus' | 'themes';
  setView: (view: 'dashboard' | 'board' | 'list' | 'calendar' | 'focus' | 'themes') => void;
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

const LogoIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ width: '16px', height: '16px' }}
  >
    <path d="m20 13.5v5c0 3.032-2.468 5.5-5.5 5.5h-9c-3.032 0-5.5-2.468-5.5-5.5v-13c0-3.033 2.468-5.5 5.5-5.5h8c.828 0 1.5.671 1.5 1.5s-.672 1.5-1.5 1.5h-8c-1.379 0-2.5 1.122-2.5 2.5v13c0 1.379 1.121 2.5 2.5 2.5h9c1.379 0 2.5-1.121 2.5-2.5v-5c0-.829.672-1.5 1.5-1.5s1.5.671 1.5 1.5zm3.512-12.651c-.875-1.07-2.456-1.129-3.409-.176l-5.808 5.808c-.813.813-1.269 1.915-1.269 3.064v.955c0 .276.224.5.5.5h.955c1.149 0 2.252-.457 3.064-1.269l5.715-5.715c.85-.85 1.013-2.236.252-3.167zm-15.008 13.61-1.263 1.229-.222-.205c-.608-.563-1.558-.527-2.12.081-.563.607-.527 1.557.081 2.12l.737.681c.409.41.954.636 1.533.636s1.124-.226 1.509-.612l1.821-1.763c.598-.572.619-1.522.046-2.12-.574-.599-1.522-.619-2.121-.046zm2.121-5.954c-.574-.599-1.522-.619-2.121-.046l-1.263 1.229-.222-.205c-.608-.563-1.558-.527-2.12.081-.563.607-.527 1.557.081 2.12l.737.681c.409.41.954.636 1.533.636s1.124-.226 1.509-.612l1.821-1.763c.598-.572.619-1.522.046-2.12zm2.875 10.496c.828 0 1.5-.671 1.5-1.5s-.672-1.5-1.5-1.5h-.083c-.829 0-1.458.671-1.458 1.5s.713 1.5 1.542 1.5z" />
  </svg>
);

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
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isPrioritiesOpen, setIsPrioritiesOpen] = useState(false);

  const views: { id: typeof currentView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'board', label: 'Kanban Board', icon: <KanbanSquare className="w-4 h-4" /> },
    { id: 'list', label: 'List View', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'focus', label: 'Focus Hub', icon: <Clock className="w-4 h-4" /> },
    { id: 'themes', label: 'Theme Studio', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const categories: { id: TaskCategory | 'all'; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'all', label: 'All Projects', icon: <Grid className="w-3.5 h-3.5" />, color: 'var(--text-muted)' },
    { id: 'study', label: 'Study', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'var(--cat-study)' },
    { id: 'personal', label: 'Personal', icon: <User className="w-3.5 h-3.5" />, color: 'var(--cat-personal)' },
    { id: 'shopping', label: 'Shopping', icon: <ShoppingCart className="w-3.5 h-3.5" />, color: 'var(--cat-shopping)' },
    { id: 'health', label: 'Health & Wellness', icon: <Activity className="w-3.5 h-3.5" />, color: 'var(--cat-health)' },
    { id: 'ideas', label: 'Ideas & Brainstorm', icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'var(--cat-ideas)' },
    { id: 'other', label: 'Other', icon: <Compass className="w-3.5 h-3.5" />, color: 'var(--cat-other)' },
  ];

  const priorities: { id: TaskPriority | 'all'; label: string }[] = [
    { id: 'all', label: 'All Priorities' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
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
          <div className="brand-icon">
            <LogoIcon />
          </div>
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
          <div className="brand-icon">
            <LogoIcon />
          </div>
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

          {/* Projects/Categories Dropdown Toggle */}
          <div
            className="sidebar-title"
            onClick={() => { playClickSound(); setIsCategoriesOpen(!isCategoriesOpen); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
            title="Show/Hide Projects"
          >
            <span>Projects</span>
            <ChevronDown
              size={14}
              style={{
                transform: isCategoriesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.22s ease-in-out',
                color: 'var(--text-secondary)'
              }}
            />
          </div>
          {isCategoriesOpen && (
            <div className="filter-list animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`filter-item ${activeCategory === cat.id ? 'active' : ''}`}
                >
                  <div className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="filter-icon"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: activeCategory === cat.id ? 'var(--accent)' : cat.color
                      }}
                    >
                      {cat.icon}
                    </span>
                    <span>{cat.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Priorities Dropdown Toggle */}
          <div
            className="sidebar-title"
            onClick={() => { playClickSound(); setIsPrioritiesOpen(!isPrioritiesOpen); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
            title="Show/Hide Priorities"
          >
            <span>Priorities</span>
            <ChevronDown
              size={14}
              style={{
                transform: isPrioritiesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.22s ease-in-out',
                color: 'var(--text-secondary)'
              }}
            />
          </div>
          {isPrioritiesOpen && (
            <div className="filter-list animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
          )}
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
