import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { BoardView } from './components/BoardView';
import { ListView } from './components/ListView';
import { CalendarView } from './components/CalendarView';
import { TaskModal } from './components/TaskModal';
import { FocusHubView } from './components/FocusHubView';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { parseAiPrompt, fetchGeminiParsedTask, AiTaskModal } from './components/AiTaskModal';
import { FullScreenClock } from './components/FullScreenClock';
import { ThemeSelectView } from './components/ThemeSelectView';
import { WelcomeModal } from './components/WelcomeModal';
import type { Task, TaskStatus, TaskCategory, TaskPriority, AppTheme } from './types';
import { playTaskCompleteSound, playClickSound } from './utils/audio';
import { triggerConfetti } from './utils/confetti';

const MOCK_TASKS: Task[] = [
  {
    id: 'mock-1',
    title: 'Design AuraTask landing layout & moodboard',
    description: 'Sketch initial wireframes with dynamic glassmorphism aesthetics. Collect color palettes for Sunset and Cyberpunk modes.',
    status: 'completed',
    priority: 'high',
    category: 'study',
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    subtasks: [
      { id: 'sub-1', title: 'Create interactive color palettes', completed: true },
      { id: 'sub-2', title: 'Sketch desktop mockup designs', completed: true }
    ],
    timeSpent: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'mock-2',
    title: 'Conduct micro-interaction testing',
    description: 'Validate canvas particle engine frame rates and check audio synthesis latency across browsers.',
    status: 'in_progress',
    priority: 'critical',
    category: 'study',
    dueDate: new Date().toISOString().split('T')[0], // Today
    subtasks: [
      { id: 'sub-3', title: 'Test sound context initialization on click', completed: true },
      { id: 'sub-4', title: 'Confirm CSS spring animations on Kanban columns', completed: false },
      { id: 'sub-5', title: 'Profile SVG doughnut render times', completed: false }
    ],
    timeSpent: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-3',
    title: 'Purchase training resistance bands',
    description: 'Find heavy-duty resistance bands with comfortable handles from a local fitness store.',
    status: 'todo',
    priority: 'low',
    category: 'health',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    subtasks: [],
    timeSpent: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-4',
    title: 'Renew weekly vitamins & diet plan',
    description: 'Restock avocados, green vegetables, proteins, and daily multi-vitamins.',
    status: 'completed',
    priority: 'medium',
    category: 'shopping',
    dueDate: new Date().toISOString().split('T')[0], // Today
    subtasks: [
      { id: 'sub-6', title: 'Buy fresh avocados and berries', completed: true },
      { id: 'sub-7', title: 'Select cold press protein drinks', completed: true }
    ],
    timeSpent: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-5',
    title: 'Brainstorm creative timeline features',
    description: 'Map out interactive timeline grids for task dependency visualization.',
    status: 'review',
    priority: 'medium',
    category: 'ideas',
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // 2 days from now
    subtasks: [
      { id: 'sub-8', title: 'Design SVG timeline connectors', completed: true }
    ],
    timeSpent: 0,
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  // --- Persistent States ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem('auratask_tasks');
    return stored ? JSON.parse(stored) : MOCK_TASKS;
  });

  const [totalFocusTime, setTotalFocusTime] = useState<number>(() => {
    const stored = localStorage.getItem('auratask_focustime');
    return stored ? Number(stored) : 0; // Fresh start at 0s
  });

  const [theme, setTheme] = useState<AppTheme>(() => {
    const stored = localStorage.getItem('auratask_theme');
    return (stored as AppTheme) || 'dark';
  });

  // --- Workspace States ---
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('auratask_username') || '';
  });
  const [currentView, setView] = useState<'dashboard' | 'board' | 'list' | 'calendar' | 'focus' | 'themes'>('dashboard');
  const [activeCategory, setCategory] = useState<TaskCategory | 'all'>('all');
  const [activePriority, setPriority] = useState<TaskPriority | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Overlay Modals States ---
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAiTaskModalOpen, setIsAiTaskModalOpen] = useState(false);
  const [isFullScreenClockOpen, setIsFullScreenClockOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskModalInitialStatus, setTaskModalInitialStatus] = useState<TaskStatus>('todo');
  const [taskModalInitialDueDate, setTaskModalInitialDueDate] = useState<string>('');

  const [timerActiveTaskId, setTimerActiveTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // --- Save states to localStorage ---
  useEffect(() => {
    localStorage.setItem('auratask_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('auratask_focustime', totalFocusTime.toString());
  }, [totalFocusTime]);

  useEffect(() => {
    localStorage.setItem('auratask_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    // Dynamic Favicon Color Matching active theme's accent
    setTimeout(() => {
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      if (accentColor) {
        const svgString = `<svg id="Layer_1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1"><path d="m20 13.5v5c0 3.032-2.468 5.5-5.5 5.5h-9c-3.032 0-5.5-2.468-5.5-5.5v-13c0-3.033 2.468-5.5 5.5-5.5h8c.828 0 1.5.671 1.5 1.5s-.672 1.5-1.5 1.5h-8c-1.379 0-2.5 1.122-2.5 2.5v13c0 1.379 1.121 2.5 2.5 2.5h9c1.379 0 2.5-1.121 2.5-2.5v-5c0-.829.672-1.5 1.5-1.5s1.5.671 1.5 1.5zm3.512-12.651c-.875-1.07-2.456-1.129-3.409-.176l-5.808 5.808c-.813.813-1.269 1.915-1.269 3.064v.955c0 .276.224.5.5.5h.955c1.149 0 2.252-.457 3.064-1.269l5.715-5.715c.85-.85 1.013-2.236.252-3.167zm-15.008 13.61-1.263 1.229-.222-.205c-.608-.563-1.558-.527-2.12.081-.563.607-.527 1.557.081 2.12l.737.681c.409.41.954.636 1.533.636s1.124-.226 1.509-.612l1.821-1.763c.598-.572.619-1.522.046-2.12-.574-.599-1.522-.619-2.121-.046zm2.121-5.954c-.574-.599-1.522-.619-2.121-.046l-1.263 1.229-.222-.205c-.608-.563-1.558-.527-2.12.081-.563.607-.527 1.557.081 2.12l.737.681c.409.41.954.636 1.533.636s1.124-.226 1.509-.612l1.821-1.763c.598-.572.619-1.522.046-2.12zm2.875 10.496c.828 0 1.5-.671 1.5-1.5s-.672-1.5-1.5-1.5h-.083c-.829 0-1.458.671-1.458 1.5s.713 1.5 1.542 1.5z" fill="${accentColor}"/></svg>`;
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) {
          link.href = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
        }
      }
    }, 50);
  }, [theme]);

  // --- Keyboard Shortcuts Listeners ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is writing in input/textarea/select fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      if (key === '1') {
        e.preventDefault();
        playClickSound();
        setView('dashboard');
      } else if (key === '2') {
        e.preventDefault();
        playClickSound();
        setView('board');
      } else if (key === '3') {
        e.preventDefault();
        playClickSound();
        setView('list');
      } else if (key === '4') {
        e.preventDefault();
        playClickSound();
        setView('calendar');
      } else if (key === '5') {
        e.preventDefault();
        playClickSound();
        setView('themes');
      } else if (key.toLowerCase() === 'n') {
        e.preventDefault();
        playClickSound();
        handleOpenAddTaskModal();
      } else if (key.toLowerCase() === 'f') {
        e.preventDefault();
        playClickSound();
        setView(prev => prev === 'focus' ? 'dashboard' : 'focus');
      } else if (key.toLowerCase() === 't') {
        e.preventDefault();
        playClickSound();
        cycleTheme();
      } else if (key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      } else if (key === 'Escape') {
        e.preventDefault();
        setIsShortcutsOpen(false);
        setIsTaskModalOpen(false);
        setEditingTask(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theme]);

  const cycleTheme = () => {
    const themeSequence: AppTheme[] = ['dark', 'light', 'cyberpunk', 'emerald', 'sunset', 'ocean', 'tokyo', 'nordic', 'minimal', 'github', 'solarized', 'nebula'];
    const nextIdx = (themeSequence.indexOf(theme) + 1) % themeSequence.length;
    setTheme(themeSequence[nextIdx]);
  };

  // --- Handlers ---
  const handleOpenAddTaskModal = (status: TaskStatus = 'todo', dueDate: string = '') => {
    setEditingTask(null);
    setTaskModalInitialStatus(status);
    setTaskModalInitialDueDate(dueDate);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'timeSpent'> & { id?: string }) => {
    if (taskData.id) {
      // Editing Mode
      setTasks(prev =>
        prev.map(t =>
          t.id === taskData.id
            ? { ...t, ...taskData } as Task
            : t
        )
      );
    } else {
      // Creation Mode
      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        timeSpent: 0,
        createdAt: new Date().toISOString()
      } as Task;
      setTasks(prev => [newTask, ...prev]);
    }
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveAiTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'timeSpent'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      timeSpent: 0,
      createdAt: new Date().toISOString()
    } as Task;
    setTasks(prev => [newTask, ...prev]);
    setIsAiTaskModalOpen(false);
  };

  const handleSaveAiTaskPrompt = async (promptText: string) => {
    const apiKey = localStorage.getItem('auratask_gemini_api_key') || '';
    let taskData;
    if (apiKey) {
      try {
        taskData = await fetchGeminiParsedTask(apiKey, promptText);
      } catch (err) {
        console.error("Gemini API failed, falling back to local:", err);
        taskData = parseAiPrompt(promptText);
      }
    } else {
      taskData = parseAiPrompt(promptText);
    }

    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      timeSpent: 0,
      createdAt: new Date().toISOString(),
      status: 'todo'
    } as Task;
    setTasks(prev => [newTask, ...prev]);
  };

  const handleDeleteTask = (taskId: string) => {
    playClickSound();
    setDeletingTaskId(taskId);
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    playClickSound();
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          // If status transitioned to completed, trigger chime and confetti
          if (status === 'completed' && t.status !== 'completed') {
            playTaskCompleteSound();
            triggerConfetti();
          }
          return { ...t, status };
        }
        return t;
      })
    );
  };

  const handleToggleTaskComplete = (taskId: string, e?: React.MouseEvent) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const isCompleting = t.status !== 'completed';
          const nextStatus: TaskStatus = isCompleting ? 'completed' : 'todo';

          if (isCompleting) {
            playTaskCompleteSound();
            // Confetti positioning based on mouse click or center
            const x = e ? e.clientX : undefined;
            const y = e ? e.clientY : undefined;
            triggerConfetti(x, y);
          } else {
            playClickSound();
          }

          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleToggleSubtaskComplete = (taskId: string, subtaskId: string) => {
    playClickSound();
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updatedSubs = t.subtasks.map(s =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          );
          return { ...t, subtasks: updatedSubs };
        }
        return t;
      })
    );
  };

  const handleAddTaskFocusTime = (taskId: string, seconds: number) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return { ...t, timeSpent: t.timeSpent + seconds };
        }
        return t;
      })
    );
    setTotalFocusTime(prev => prev + seconds);
  };

  const handleStartFocusTimer = (task: Task) => {
    playClickSound();
    setTimerActiveTaskId(task.id);
    setView('focus');
  };

  // --- Filtering Core logic ---
  const filteredTasks = tasks.filter(task => {
    // 1. Search term match
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      task.title.toLowerCase().includes(searchLower) ||
      task.description.toLowerCase().includes(searchLower) ||
      task.category.toLowerCase().includes(searchLower);

    // 2. Category match
    const matchesCategory = activeCategory === 'all' || task.category === activeCategory;

    // 3. Priority match
    const matchesPriority = activePriority === 'all' || task.priority === activePriority;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        activeCategory={activeCategory}
        setCategory={setCategory}
        activePriority={activePriority}
        setPriority={setPriority}
        theme={theme}
        setTheme={setTheme}
        completedCount={tasks.filter(t => t.status === 'completed').length}
        totalCount={tasks.length}
        totalFocusTime={totalFocusTime}
        onOpenFocusHub={() => {
          playClickSound();
          setView('focus');
        }}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Header */}
        <Header
          onSaveAiTask={handleSaveAiTaskPrompt}
          onAddTaskClick={() => handleOpenAddTaskModal()}
          onOpenKeyboardShortcuts={() => {
            playClickSound();
            setIsShortcutsOpen(true);
          }}
          onOpenAiModal={() => {
            playClickSound();
            setIsAiTaskModalOpen(true);
          }}
          onClockClick={() => {
            playClickSound();
            setIsFullScreenClockOpen(true);
          }}
        />

        {/* View Layout Renderer */}
        <main className="view-container">
          {currentView === 'dashboard' && (
            <DashboardView tasks={tasks} totalFocusTime={totalFocusTime} username={username} />
          )}

          {currentView === 'board' && (
            <BoardView
              tasks={filteredTasks}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onEditTask={handleOpenEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onStartFocus={handleStartFocusTimer}
              onAddTask={(status) => handleOpenAddTaskModal(status)}
            />
          )}

          {currentView === 'list' && (
            <ListView
              tasks={filteredTasks}
              onToggleTaskComplete={handleToggleTaskComplete}
              onToggleSubtaskComplete={handleToggleSubtaskComplete}
              onEditTask={handleOpenEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onStartFocus={handleStartFocusTimer}
            />
          )}

          {currentView === 'calendar' && (
            <CalendarView
              tasks={filteredTasks}
              onToggleTaskComplete={(id) => handleToggleTaskComplete(id)}
              onEditTask={handleOpenEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onStartFocus={handleStartFocusTimer}
              onAddTaskOnDate={(date) => handleOpenAddTaskModal('todo', date)}
            />
          )}
          {currentView === 'focus' && (
            <FocusHubView
              tasks={tasks}
              activeTaskId={timerActiveTaskId}
              onAddTaskFocusTime={handleAddTaskFocusTime}
              clearActiveTaskId={() => setTimerActiveTaskId(null)}
              onUpdateTaskStatus={handleUpdateTaskStatus}
            />
          )}

          {currentView === 'themes' && (
            <ThemeSelectView theme={theme} setTheme={setTheme} />
          )}
        </main>
      </div>

      {/* --- Overlay Modal Dialogs --- */}

      {/* Keyboard Shortcuts Guide */}
      {isShortcutsOpen && (
        <KeyboardShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
      )}

      {/* Task Creation & Editing Editor */}
      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          initialStatus={taskModalInitialStatus}
          initialDueDate={taskModalInitialDueDate}
          onSave={handleSaveTask}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* AI Task Composer overlay */}
      {isAiTaskModalOpen && (
        <AiTaskModal
          onSave={handleSaveAiTask}
          onClose={() => setIsAiTaskModalOpen(false)}
        />
      )}

      {/* Welcome Greeting Prompt overlay for first-time visitors */}
      {!username && (
        <WelcomeModal
          onSaveName={(name) => {
            localStorage.setItem('auratask_username', name);
            setUsername(name);
          }}
        />
      )}


      {/* Delete Confirmation Modal */}
      {deletingTaskId && (
        <div className="modal-backdrop">
          <div className="modal-card glass animate-scale-in" style={{ maxWidth: '360px', textAlign: 'center' }}>
            <h3 className="modal-display-title glow-text" style={{ color: '#ef4444' }}>
              Delete Task
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '12px 0 24px 0' }}>
              Are you sure you want to permanently delete this task? This action cannot be undone.
            </p>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => { playClickSound(); setDeletingTaskId(null); }}
                className="secondary-btn"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setTasks(prev => prev.filter(t => t.id !== deletingTaskId));
                  if (timerActiveTaskId === deletingTaskId) {
                    setTimerActiveTaskId(null);
                  }
                  setDeletingTaskId(null);
                }}
                className="primary-btn glow-btn"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isFullScreenClockOpen && (
        <FullScreenClock onClose={() => setIsFullScreenClockOpen(false)} />
      )}
    </div>
  );
}
