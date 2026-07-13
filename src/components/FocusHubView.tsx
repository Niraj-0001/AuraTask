import React, { useState, useEffect, useRef } from 'react';
import type { Task, TaskStatus } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  CheckCircle2,
  Clock,
  Hourglass,
  Settings,
  Save,
  ChevronDown,
  X,
  Minimize2,
  Maximize2,
  Maximize,
  Layout,
  Palette,
  Moon
} from 'lucide-react';
import { playClickSound, playTimerCompleteSound } from '../utils/audio';

// --- CUSTOM REACT SELECT DROPDOWN COMPONENT ---
interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = '-- Select Task --' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selected = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className="custom-dropdown-container">
      <button
        type="button"
        onClick={() => { playClickSound(); setIsOpen(!isOpen); }}
        className={`custom-dropdown-trigger ${isOpen ? 'open' : ''}`}
      >
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`dropdown-trigger-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-dropdown-menu animate-scale-in">
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => {
                playClickSound();
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`custom-dropdown-item ${opt.value === value ? 'selected' : ''}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN FOCUS HUB VIEW ---
interface FocusHubViewProps {
  tasks: Task[];
  activeTaskId: string | null;
  onAddTaskFocusTime: (taskId: string, seconds: number) => void;
  clearActiveTaskId: () => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
}

type ModeType = 'timer' | 'stopwatch';
type TimerMode = 'study' | 'short_break' | 'long_break';
type SizeMode = 'normal' | 'large' | 'fullscreen';

export const FocusHubView: React.FC<FocusHubViewProps> = ({
  tasks,
  activeTaskId,
  onAddTaskFocusTime,
  clearActiveTaskId,
  onUpdateTaskStatus
}) => {
  const [activeTab, setActiveTab] = useState<ModeType>(() => {
    return (localStorage.getItem('auratask_focushub_tab') as ModeType) || 'timer';
  });
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal');

  // --- TIMER STATE ---
  const [timerMode, setTimerMode] = useState<TimerMode>(() => {
    return (localStorage.getItem('auratask_timer_mode') as TimerMode) || 'study';
  });
  const [associatedTaskId, setAssociatedTaskId] = useState<string>(() => {
    return localStorage.getItem('auratask_timer_task_id') || '';
  });

  const [durations, setDurations] = useState<Record<TimerMode, number>>(() => {
    const stored = localStorage.getItem('auratask_timer_durations');
    return stored ? JSON.parse(stored) : { study: 25, short_break: 5, long_break: 15 };
  });

  const [isEditingDurations, setIsEditingDurations] = useState(false);
  const [editDurations, setEditDurations] = useState(durations);

  // Synchronously compute timer catch-up on initialization
  const timerInit = (() => {
    const savedTimeLeft = Number(localStorage.getItem('auratask_timer_time_left') ?? (25 * 60));
    const wasRunning = localStorage.getItem('auratask_timer_running') === 'true';
    const lastActive = Number(localStorage.getItem('auratask_timer_last_time') || 0);

    if (wasRunning && lastActive > 0) {
      const elapsed = Math.floor((Date.now() - lastActive) / 1000);
      if (elapsed >= savedTimeLeft) {
        return { timeLeft: 0, isRunning: false, elapsedUsed: savedTimeLeft };
      } else {
        return { timeLeft: savedTimeLeft - elapsed, isRunning: true, elapsedUsed: elapsed };
      }
    }
    return { timeLeft: savedTimeLeft, isRunning: wasRunning, elapsedUsed: 0 };
  })();

  const [timeLeft, setTimeLeft] = useState<number>(timerInit.timeLeft);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(timerInit.isRunning);
  const [totalSeconds, setTotalSeconds] = useState<number>(() => {
    const stored = localStorage.getItem('auratask_timer_total_seconds');
    return stored ? Number(stored) : 25 * 60;
  });

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- STOPWATCH STATE ---
  // 1. Use Date.now() as source of truth for elapsed time calculations
  // 2. Store startTimestamp, accumulatedElapsedTime, and running state
  const stopwatchInit = (() => {
    const savedAccumulated = Number(localStorage.getItem('auratask_stopwatch_accumulated') || localStorage.getItem('auratask_stopwatch_time') || 0);
    const wasRunning = localStorage.getItem('auratask_stopwatch_running') === 'true';
    const startTimestamp = Number(localStorage.getItem('auratask_stopwatch_start_time') || localStorage.getItem('auratask_stopwatch_last_time') || 0);

    let displayTime = savedAccumulated;
    let elapsedUsed = 0;

    if (wasRunning && startTimestamp > 0) {
      const now = Date.now();
      const elapsedSecs = Math.floor((now - startTimestamp) / 1000);
      displayTime = savedAccumulated + elapsedSecs;
      elapsedUsed = elapsedSecs;
    }

    return {
      accumulatedSecs: savedAccumulated,
      startTimestamp: wasRunning ? startTimestamp : null,
      isRunning: wasRunning,
      elapsedUsed,
      displayTime
    };
  })();

  const [stopwatchTime, setStopwatchTime] = useState<number>(stopwatchInit.displayTime);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(stopwatchInit.isRunning);

  // 3. Store core timing state in refs to avoid dependency loops and interval tick counting
  const accumulatedSecsRef = useRef<number>(stopwatchInit.accumulatedSecs);
  const startTimestampRef = useRef<number | null>(stopwatchInit.startTimestamp);
  const [associatedStopwatchTaskId, setAssociatedStopwatchTaskId] = useState<string>(() => {
    return localStorage.getItem('auratask_stopwatch_task_id') || '';
  });
  const [isEditingStopwatch, setIsEditingStopwatch] = useState(false);
  const [editStopwatchHours, setEditStopwatchHours] = useState(0);
  const [editStopwatchMins, setEditStopwatchMins] = useState(0);
  const [editStopwatchSecs, setEditStopwatchSecs] = useState(0);

  const [showProductivityTip, setShowProductivityTip] = useState(true);

  type BgMode = 'blur' | 'gradient' | 'oled';
  const [stopwatchBgMode, setStopwatchBgMode] = useState<BgMode>(() => {
    return (localStorage.getItem('auratask_stopwatch_bg') as BgMode) || 'gradient';
  });

  // Mobile fullscreen stopwatch state
  const [isMobileStopwatchFullscreen, setIsMobileStopwatchFullscreen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = window.innerWidth <= 768;

  // Hide header/footer while MSF is open
  useEffect(() => {
    if (isMobileStopwatchFullscreen) {
      document.body.classList.add('msf-active');
    } else {
      document.body.classList.remove('msf-active');
      setIsMobileMenuOpen(false);
    }
    return () => document.body.classList.remove('msf-active');
  }, [isMobileStopwatchFullscreen]);

  // Real time for fullscreen corner clock
  const [realTime, setRealTime] = useState(new Date());

  useEffect(() => {
    if (sizeMode === 'fullscreen') {
      const timer = setInterval(() => setRealTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [sizeMode]);

  const changeStopwatchBgMode = (mode: BgMode, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setStopwatchBgMode(mode);
    localStorage.setItem('auratask_stopwatch_bg', mode);
  };

  const stopwatchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prevTimerModeRef = useRef<TimerMode>(timerMode);
  const prevDurationsRef = useRef<string>(JSON.stringify(durations));

  // Sync active task from global trigger
  useEffect(() => {
    if (activeTaskId) {
      setAssociatedTaskId(activeTaskId);
      setAssociatedStopwatchTaskId(activeTaskId);
      setActiveTab('timer');
      setTimerMode('study');
      const studySeconds = durations.study * 60;
      setTimeLeft(studySeconds);
      setTotalSeconds(studySeconds);
      setIsTimerRunning(true);
      clearActiveTaskId();
    }
  }, [activeTaskId, durations.study]);

  const timerConfigs: Record<TimerMode, { label: string; icon: React.ReactNode; color: string }> = {
    study: {
      label: 'Study Focus',
      icon: <Brain className="w-4.5 h-4.5" />,
      color: 'var(--accent)'
    },
    short_break: {
      label: 'Short Break',
      icon: <Coffee className="w-4.5 h-4.5" />,
      color: '#10b981'
    },
    long_break: {
      label: 'Long Break',
      icon: <Coffee className="w-4.5 h-4.5" />,
      color: '#06b6d4'
    },
  };

  // --- LOCAL STORAGE PERSISTENCE EFFECTS ---
  useEffect(() => {
    localStorage.setItem('auratask_focushub_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('auratask_timer_mode', timerMode);
    localStorage.setItem('auratask_timer_task_id', associatedTaskId);
    localStorage.setItem('auratask_timer_time_left', timeLeft.toString());
    localStorage.setItem('auratask_timer_running', isTimerRunning.toString());
    localStorage.setItem('auratask_timer_total_seconds', totalSeconds.toString());
    if (isTimerRunning) {
      localStorage.setItem('auratask_timer_last_time', Date.now().toString());
    }
  }, [timerMode, associatedTaskId, timeLeft, isTimerRunning, totalSeconds]);

  useEffect(() => {
    // Only save the task ID here. 
    // Time and running state are now explicitly saved during start/pause/reset/edit actions 
    // to prevent interval ticks from constantly overwriting the start timestamp.
    localStorage.setItem('auratask_stopwatch_task_id', associatedStopwatchTaskId);
  }, [associatedStopwatchTaskId]);

  // --- MOUNT CATCH-UP LOGIC (SIDE EFFECTS ONLY) ---
  useEffect(() => {
    // 1. Timer completed while away
    if (timerInit.elapsedUsed > 0 && timerInit.timeLeft === 0) {
      playTimerCompleteSound();
      if (timerMode === 'study' && associatedTaskId) {
        onAddTaskFocusTime(associatedTaskId, timerInit.elapsedUsed);
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${timerConfigs[timerMode].label} Complete! 🎉`, {
          body: timerMode === 'study'
            ? 'Great job! Time for a short break.'
            : 'Break over! Ready to focus again?',
          icon: `${import.meta.env.BASE_URL}favicon.svg`
        });
      }
    }
    // 2. Timer still running, log elapsed time spent in focus state
    else if (timerInit.elapsedUsed > 0 && timerMode === 'study' && associatedTaskId) {
      onAddTaskFocusTime(associatedTaskId, timerInit.elapsedUsed);
    }

    // 3. Stopwatch running, log elapsed time and sync ref baseline
    if (stopwatchInit.elapsedUsed > 0 && associatedStopwatchTaskId) {
      onAddTaskFocusTime(associatedStopwatchTaskId, stopwatchInit.elapsedUsed);
      // lastSavedStopwatchTimeRef is initialized to stopwatchInit.displayTime
    }
  }, []);

  // --- TIMER EFFECTS & LOGIC ---
  useEffect(() => {
    const durationsStr = JSON.stringify(durations);
    const modeChanged = prevTimerModeRef.current !== timerMode;
    const durationsChanged = prevDurationsRef.current !== durationsStr;

    if (!isTimerRunning && (modeChanged || durationsChanged)) {
      const targetMins = durations[timerMode];
      setTimeLeft(targetMins * 60);
      setTotalSeconds(targetMins * 60);
    }

    prevTimerModeRef.current = timerMode;
    prevDurationsRef.current = durationsStr;
  }, [timerMode, durations, isTimerRunning]);

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            playTimerCompleteSound();
            clearInterval(timerIntervalRef.current!);

            if (timerMode === 'study' && associatedTaskId) {
              onAddTaskFocusTime(associatedTaskId, totalSeconds);
            }

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`${timerConfigs[timerMode].label} Complete! 🎉`, {
                body: timerMode === 'study'
                  ? 'Great job! Time for a short break.'
                  : 'Break over! Ready to focus again?',
                icon: `${import.meta.env.BASE_URL}favicon.svg`
              });
            } else {
              alert(`${timerConfigs[timerMode].label} complete!`);
            }
            return 0;
          }

          if (timerMode === 'study' && associatedTaskId && prev % 10 === 0) {
            onAddTaskFocusTime(associatedTaskId, 10);
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerMode, associatedTaskId, totalSeconds]);

  const toggleTimer = () => {
    playClickSound();
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    playClickSound();
    setIsTimerRunning(false);
    setTimeLeft(durations[timerMode] * 60);
    setTotalSeconds(durations[timerMode] * 60);
  };

  const handleTimerModeChange = (mode: TimerMode) => {
    playClickSound();
    setIsTimerRunning(false);
    setTimerMode(mode);
  };

  const saveCustomDurations = () => {
    playClickSound();
    setDurations(editDurations);
    localStorage.setItem('auratask_timer_durations', JSON.stringify(editDurations));
    setIsEditingDurations(false);
  };

  // --- STOPWATCH LOGIC & TIME KEEPING REFS ---
  const lastSavedStopwatchTimeRef = useRef(stopwatchInit.displayTime);
  const latestStopwatchTimeRef = useRef(stopwatchTime);
  const latestTaskIdRef = useRef(associatedStopwatchTaskId);

  // Keep refs synchronized with state
  useEffect(() => {
    latestStopwatchTimeRef.current = stopwatchTime;
  }, [stopwatchTime]);

  useEffect(() => {
    latestTaskIdRef.current = associatedStopwatchTaskId;
  }, [associatedStopwatchTaskId]);

  const saveUnsavedStopwatchTime = (taskId: string, currentStopwatchTime: number) => {
    if (!taskId) return;
    const diff = currentStopwatchTime - lastSavedStopwatchTimeRef.current;
    if (diff > 0) {
      onAddTaskFocusTime(taskId, diff);
      lastSavedStopwatchTimeRef.current = currentStopwatchTime;
    }
  };

  // Save remaining focus time on unmount or tab switch/view change
  useEffect(() => {
    return () => {
      if (latestTaskIdRef.current) {
        const diff = latestStopwatchTimeRef.current - lastSavedStopwatchTimeRef.current;
        if (diff > 0) {
          onAddTaskFocusTime(latestTaskIdRef.current, diff);
        }
      }
    };
  }, [onAddTaskFocusTime]);

  useEffect(() => {
    if (isStopwatchRunning) {
      // 4. setInterval should only refresh the UI (250ms), never calculate elapsed time.
      stopwatchIntervalRef.current = setInterval(() => {
        if (!startTimestampRef.current) return;

        const now = Date.now();
        // 5. Elapsed time must always be computed from timestamps
        const elapsedSinceStart = Math.floor((now - startTimestampRef.current) / 1000);
        const currentTotalSecs = accumulatedSecsRef.current + elapsedSinceStart;

        setStopwatchTime(currentTotalSecs);

        // 10. Preserve task time tracking without assuming the interval is exactly 1s
        const diffSinceLastSave = currentTotalSecs - lastSavedStopwatchTimeRef.current;
        if (associatedStopwatchTaskId && diffSinceLastSave >= 10) {
          onAddTaskFocusTime(associatedStopwatchTaskId, diffSinceLastSave);
          // Advance the baseline by exactly the amount we logged
          lastSavedStopwatchTimeRef.current += diffSinceLastSave;
        }

        // Periodically sync current time for backwards compatibility
        localStorage.setItem('auratask_stopwatch_time', currentTotalSecs.toString());

      }, 250);
    } else {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }

    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning, associatedStopwatchTaskId, onAddTaskFocusTime]);

  // Helper to cleanly pause the timestamp-based stopwatch
  const pauseStopwatch = () => {
    if (!isStopwatchRunning) return;
    const now = Date.now();

    if (startTimestampRef.current) {
      const elapsedSinceStart = Math.floor((now - startTimestampRef.current) / 1000);
      accumulatedSecsRef.current += elapsedSinceStart;
      startTimestampRef.current = null;
    }

    setStopwatchTime(accumulatedSecsRef.current);

    if (associatedStopwatchTaskId) {
      saveUnsavedStopwatchTime(associatedStopwatchTaskId, accumulatedSecsRef.current);
    }

    setIsStopwatchRunning(false);

    // Save explicit exact state
    localStorage.setItem('auratask_stopwatch_accumulated', accumulatedSecsRef.current.toString());
    localStorage.setItem('auratask_stopwatch_start_time', '0');
    localStorage.setItem('auratask_stopwatch_running', 'false');
    localStorage.setItem('auratask_stopwatch_time', accumulatedSecsRef.current.toString());
  };

  const toggleStopwatch = () => {
    playClickSound();
    if (isStopwatchRunning) {
      pauseStopwatch();
    } else {
      const now = Date.now();
      startTimestampRef.current = now;
      lastSavedStopwatchTimeRef.current = stopwatchTime;
      setIsStopwatchRunning(true);

      localStorage.setItem('auratask_stopwatch_start_time', now.toString());
      localStorage.setItem('auratask_stopwatch_accumulated', accumulatedSecsRef.current.toString());
      localStorage.setItem('auratask_stopwatch_running', 'true');
    }
  };

  const resetStopwatch = () => {
    playClickSound();
    if (associatedStopwatchTaskId) {
      let finalTime = accumulatedSecsRef.current;
      if (isStopwatchRunning && startTimestampRef.current) {
        finalTime += Math.floor((Date.now() - startTimestampRef.current) / 1000);
      }
      saveUnsavedStopwatchTime(associatedStopwatchTaskId, finalTime);
    }

    setIsStopwatchRunning(false);
    accumulatedSecsRef.current = 0;
    startTimestampRef.current = null;
    setStopwatchTime(0);
    lastSavedStopwatchTimeRef.current = 0;

    localStorage.setItem('auratask_stopwatch_accumulated', '0');
    localStorage.setItem('auratask_stopwatch_start_time', '0');
    localStorage.setItem('auratask_stopwatch_running', 'false');
    localStorage.setItem('auratask_stopwatch_time', '0');
  };

  const handleSaveStopwatchEdit = () => {
    playClickSound();
    const finalSecs = (editStopwatchHours * 3600) + (editStopwatchMins * 60) + editStopwatchSecs;

    accumulatedSecsRef.current = finalSecs;
    if (isStopwatchRunning) {
      startTimestampRef.current = Date.now();
      localStorage.setItem('auratask_stopwatch_start_time', startTimestampRef.current.toString());
    }

    setStopwatchTime(finalSecs);
    lastSavedStopwatchTimeRef.current = finalSecs;
    setIsEditingStopwatch(false);

    localStorage.setItem('auratask_stopwatch_accumulated', finalSecs.toString());
    localStorage.setItem('auratask_stopwatch_time', finalSecs.toString());
  };

  const openStopwatchEdit = () => {
    // On mobile: open fullscreen instead of edit panel
    if (window.innerWidth <= 768) {
      playClickSound();
      setIsMobileStopwatchFullscreen(true);
      return;
    }
    playClickSound();
    if (isStopwatchRunning) {
      pauseStopwatch();
    }

    // 8. Preserve manual edit of stopwatch value using our new source of truth
    const currentTime = accumulatedSecsRef.current;
    const hrs = Math.floor(currentTime / 3600);
    const mins = Math.floor((currentTime % 3600) / 60);
    const secs = currentTime % 60;
    setEditStopwatchHours(hrs);
    setEditStopwatchMins(mins);
    setEditStopwatchSecs(secs);
    setIsEditingStopwatch(true);
  };

  const handleCompleteStopwatchTask = () => {
    if (!associatedStopwatchTaskId) return;

    if (isStopwatchRunning) {
      pauseStopwatch();
    } else {
      saveUnsavedStopwatchTime(associatedStopwatchTaskId, stopwatchTime);
    }

    onUpdateTaskStatus(associatedStopwatchTaskId, 'completed');
    setAssociatedStopwatchTaskId('');
    lastSavedStopwatchTimeRef.current = stopwatchTime;
  };

  // Format Helpers
  const formatTimeStr = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStopwatchTimeStr = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sizing adjustments
  const handleSizeModeChange = (mode: SizeMode) => {
    playClickSound();
    setSizeMode(mode);
    try {
      if (mode === 'fullscreen') {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen API error:', err);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && sizeMode === 'fullscreen') {
        setSizeMode('normal');
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [sizeMode]);

  // Size specific styling calculations
  const cardMaxWidth = sizeMode === 'large' ? '1000px' : '440px';
  const wheelSize = sizeMode === 'large' ? '300px' : '210px';
  const timerFontSize = sizeMode === 'large' ? '64px' : '36px';
  const stopwatchFontSize = sizeMode === 'large' ? '80px' : '48px';

  // SVG calculations for countdown wheel
  const radius = sizeMode === 'large' ? 120 : 75;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (timeLeft / totalSeconds) * circumference;

  const incompleteTasks = tasks.filter(t => t.status !== 'completed');
  const taskOptions = [
    { value: '', label: '-- No Specific Task --' },
    ...incompleteTasks.map(t => ({ value: t.id, label: t.title }))
  ];

  // ================== MOBILE STOPWATCH FULLSCREEN ==================
  if (isMobileStopwatchFullscreen) {
    const bgClass = stopwatchBgMode === 'blur' ? 'msf-blur' : stopwatchBgMode === 'oled' ? 'msf-oled' : 'msf-ambient';
    return (
      <div
        className={`mobile-stopwatch-fullscreen ${bgClass} animate-scale-in`}
        onClick={() => { toggleStopwatch(); }}
      >
        {/* Ambient blobs for gradient/ambient mode */}
        {stopwatchBgMode === 'gradient' && (
          <div className="msf-blobs">
            <div className="msf-blob msf-blob-1" />
            <div className="msf-blob msf-blob-2" />
          </div>
        )}

        {/* Top bar – ALWAYS visible (portrait + landscape), stops click propagation */}
        <div className="msf-top-bar" onClick={(e) => e.stopPropagation()}>
          {/* Menu button – top right */}
          <div className="msf-menu-wrap">
            <button
              className="msf-menu-btn"
              onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
            >
              <Layout size={22} />
            </button>

            {isMobileMenuOpen && (
              <div className="msf-menu-panel animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <button
                  className={`msf-menu-item ${stopwatchBgMode === 'blur' ? 'active' : ''}`}
                  onClick={(e) => { changeStopwatchBgMode('blur', e); setIsMobileMenuOpen(false); }}
                >
                  <Layout size={14} /> Blur
                </button>
                <button
                  className={`msf-menu-item ${stopwatchBgMode === 'gradient' ? 'active' : ''}`}
                  onClick={(e) => { changeStopwatchBgMode('gradient', e); setIsMobileMenuOpen(false); }}
                >
                  <Palette size={14} /> Ambient
                </button>
                <button
                  className={`msf-menu-item ${stopwatchBgMode === 'oled' ? 'active' : ''}`}
                  onClick={(e) => { changeStopwatchBgMode('oled', e); setIsMobileMenuOpen(false); }}
                >
                  <Moon size={14} /> Zen
                </button>
                <div className="msf-menu-divider" />
                <button
                  className="msf-menu-item"
                  onClick={(e) => { e.stopPropagation(); setIsMobileStopwatchFullscreen(false); }}
                >
                  <X size={14} /> Close
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Central Time – always visible in both orientations */}
        <div className="msf-time-wrap">
          <div className="msf-time">
            {formatStopwatchTimeStr(stopwatchTime)}
          </div>
          <div className="msf-status portrait-only">
            {isStopwatchRunning ? 'Tap to pause' : 'Tap to resume'}
          </div>
        </div>
      </div>
    );
  }

  // ================== FULL SCREEN RENDERING OVERLAY ==================
  if (sizeMode === 'fullscreen') {
    const currentTaskId = activeTab === 'timer' ? associatedTaskId : associatedStopwatchTaskId;
    const activeTask = tasks.find(t => t.id === currentTaskId);
    const accentColor = activeTab === 'timer' ? timerConfigs[timerMode].color : 'var(--accent)';

    // Circular calculations for timer progress
    const fsRadius = 134;
    const fsCircumference = fsRadius * 2 * Math.PI;
    const fsStrokeDashoffset = fsCircumference - (timeLeft / totalSeconds) * fsCircumference;

    if (activeTab === 'stopwatch') {
      return (
        <div
          className={`fullscreen-clock-overlay mode-${stopwatchBgMode}`}
        >
          {/* Top Left Real Time */}
          <div style={{
            position: 'absolute',
            top: '32px',
            left: '40px',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '16px',
            color: 'var(--text-secondary)',
            letterSpacing: '0.05em',
            fontVariantNumeric: 'tabular-nums',
            textShadow: stopwatchBgMode === 'oled' ? 'none' : '0 2px 10px rgba(0,0,0,0.5)',
            opacity: 0.8
          }}>
            {realTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {stopwatchBgMode === 'gradient' && (
            <div className="fc-blobs-container">
              <div className="fc-blob fc-blob-1" />
              <div className="fc-blob fc-blob-2" />
              <div className="fc-blob fc-blob-3" />
            </div>
          )}

          <button
            className="fc-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleSizeModeChange('normal');
            }}
            title="Exit Fullscreen"
          >
            <X size={20} />
          </button>

          <div className="fc-content" onClick={(e) => e.stopPropagation()}>
            <div className="fc-time" style={{ marginBottom: '0', letterSpacing: '-0.01em', textShadow: stopwatchBgMode === 'oled' ? 'none' : undefined }}>
              {formatStopwatchTimeStr(stopwatchTime)}
            </div>



            {activeTask && (
              <button
                onClick={handleCompleteStopwatchTask}
                className="fullscreen-task-badge"
                style={{
                  cursor: 'pointer',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.22s ease',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  marginTop: '32px',
                  marginBottom: '16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Click to complete this task"
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Tracking: <strong>{activeTask.title}</strong></span>
              </button>
            )}

            <div className="fullscreen-controls" style={{ marginBottom: '24px' }}>
              <button onClick={resetStopwatch} className="fullscreen-control-btn" title="Reset Stopwatch">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={toggleStopwatch}
                className="fullscreen-control-btn play-pause glow-btn"
                style={{ backgroundColor: 'var(--accent)', boxShadow: `0 0 20px rgba(var(--accent-rgb), 0.35)` }}
                title={isStopwatchRunning ? "Pause Stopwatch" : "Start Stopwatch"}
              >
                {isStopwatchRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
              </button>
            </div>
          </div>

          <div className="fc-dock" onClick={(e) => e.stopPropagation()}>
            <button
              className={`fc-dock-btn ${stopwatchBgMode === 'blur' ? 'active' : ''}`}
              onClick={(e) => changeStopwatchBgMode('blur', e)}
              title="Workspace Blur Mode"
            >
              <Layout size={14} />
              <span>Blur</span>
            </button>
            <button
              className={`fc-dock-btn ${stopwatchBgMode === 'gradient' ? 'active' : ''}`}
              onClick={(e) => changeStopwatchBgMode('gradient', e)}
              title="Ambient Gradient Mode"
            >
              <Palette size={14} />
              <span>Ambient</span>
            </button>
            <button
              className={`fc-dock-btn ${stopwatchBgMode === 'oled' ? 'active' : ''}`}
              onClick={(e) => changeStopwatchBgMode('oled', e)}
              title="OLED Minimalist Mode"
            >
              <Moon size={14} />
              <span>Zen</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`focus-fullscreen-overlay gradient-${activeTab === 'timer' ? timerMode : 'stopwatch'}`}>
        {/* Ambient Glowing Blobs */}
        <div className="fullscreen-bg-blobs">
          <div className="fullscreen-bg-blob blob-primary" style={{ backgroundColor: accentColor }}></div>
          <div className="fullscreen-bg-blob blob-secondary" style={{ backgroundColor: accentColor }}></div>
          <div className="fullscreen-bg-blob blob-tertiary" style={{ backgroundColor: accentColor }}></div>
        </div>

        {/* Exit fullscreen button */}
        <button
          onClick={() => handleSizeModeChange('normal')}
          className="fullscreen-exit-btn"
          title="Exit Fullscreen"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="fullscreen-glass-card animate-scale-in">
          {activeTab === 'timer' && (
            // FULLSCREEN TIMER
            <div className="fullscreen-content">
              <span className="fullscreen-subtitle" style={{ color: accentColor }}>
                {timerConfigs[timerMode].label}
              </span>

              {/* Central countdown circle */}
              <div className="fullscreen-digits-wrap" style={{ width: '320px', height: '320px' }}>
                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }} viewBox="0 0 300 300">
                  <circle
                    stroke="var(--border-color)"
                    fill="transparent"
                    strokeWidth="6"
                    r={fsRadius}
                    cx="150"
                    cy="150"
                  />
                  <circle
                    stroke={accentColor}
                    fill="transparent"
                    strokeWidth="6"
                    strokeDasharray={`${fsCircumference} ${fsCircumference}`}
                    style={{
                      strokeDashoffset: fsStrokeDashoffset,
                      filter: `drop-shadow(0 0 10px ${accentColor}55)`,
                      transition: 'all 0.1s linear'
                    }}
                    strokeLinecap="round"
                    r={fsRadius}
                    cx="150"
                    cy="150"
                  />
                </svg>
                <div className="fullscreen-digits">
                  {formatTimeStr(timeLeft)}
                </div>
              </div>

              <div className={`fullscreen-status-badge ${isTimerRunning ? 'running' : 'paused'}`} style={{ color: isTimerRunning ? accentColor : undefined }}>
                {isTimerRunning ? (
                  <>
                    <span className="pulse-dot" style={{ backgroundColor: accentColor }}></span>
                    <span>Focusing</span>
                  </>
                ) : (
                  <>
                    <span className="static-dot"></span>
                    <span>Paused</span>
                  </>
                )}
              </div>

              {activeTask && (
                <div className="fullscreen-task-badge">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  <span>Focusing on: <strong>{activeTask.title}</strong></span>
                </div>
              )}

              <div className="fullscreen-controls">
                <button onClick={resetTimer} className="fullscreen-control-btn" title="Reset Timer">
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleTimer}
                  className="fullscreen-control-btn play-pause glow-btn"
                  style={{ backgroundColor: accentColor, boxShadow: `0 0 20px ${accentColor}55` }}
                  title={isTimerRunning ? "Pause Timer" : "Start Timer"}
                >
                  {isTimerRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================== STANDARD VIEW RENDERING ==================
  return (
    <div className="dashboard-view animate-slide-up" style={{ padding: '24px', overflowY: 'auto' }}>

      {/* Title block - hidden on mobile via CSS */}
      <div className="dashboard-title-area focus-hub-title-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        {/* Tab switcher */}
        <div className="group-toggle-wrap">
          <button
            onClick={() => { playClickSound(); setActiveTab('timer'); }}
            className={`group-toggle-btn ${activeTab === 'timer' ? 'active' : ''}`}
          >
            <Hourglass className="w-3.5 h-3.5" style={{ marginRight: '4px' }} />
            <span>Countdown Timer</span>
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('stopwatch'); }}
            className={`group-toggle-btn ${activeTab === 'stopwatch' ? 'active' : ''}`}
          >
            <Clock className="w-3.5 h-3.5" style={{ marginRight: '4px' }} />
            <span>Stopwatch</span>
          </button>
        </div>
      </div>

      <div className={`focus-hub-grid ${sizeMode === 'large' ? 'large-mode' : ''}`}>

        {/* --- LEFT SIDE: THE MAIN CARD PANEL --- */}
        <div className="focus-hub-main-card glass" style={{ minHeight: '440px' }}>

          {/* Display Sizing Row */}
          <div className="segmented-size-selector">
            <button
              onClick={() => handleSizeModeChange('normal')}
              className={`segmented-size-btn ${sizeMode === 'normal' ? 'active' : ''}`}
              title="Normal Card Size"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSizeModeChange('large')}
              className={`segmented-size-btn ${sizeMode === 'large' ? 'active' : ''}`}
              title="Large Card Size"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSizeModeChange('fullscreen')}
              className={`segmented-size-btn ${sizeMode === 'fullscreen' ? 'active' : ''}`}
              title="Enter Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          {activeTab === 'timer' ? (
            // ================== TIMER WIDGET ==================
            <>
              {/* Timer Mode Selectors */}
              <div className="timer-mode-selector" style={{ marginBottom: '24px' }}>
                {(['study', 'short_break', 'long_break'] as TimerMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => handleTimerModeChange(m)}
                    className={`timer-mode-btn ${timerMode === m ? 'active' : ''}`}
                  >
                    <span>{m === 'study' ? 'Study' : m.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>

              {/* Countdown Circular Wheel */}
              <div className="timer-countdown-wheel" style={{ width: wheelSize, height: wheelSize, marginBottom: '24px', transition: 'all var(--transition-normal)' }}>
                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
                  <circle
                    stroke="var(--bg-tertiary)"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                  <circle
                    stroke={timerConfigs[timerMode].color}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, filter: `drop-shadow(0 0 4px ${timerConfigs[timerMode].color}44)`, transition: 'all 0.1s linear' }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="progress-ring-circle"
                  />
                </svg>
                <div className="timer-text-display">
                  <span className="timer-digits" style={{ fontSize: timerFontSize }}>{formatTimeStr(timeLeft)}</span>
                  <span className="timer-status-lbl">{isTimerRunning ? 'focusing' : 'paused'}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="timer-controls-row" style={{ marginBottom: '24px' }}>
                <button
                  onClick={resetTimer}
                  title="Reset Timer"
                  className="timer-btn-round"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleTimer}
                  className="timer-btn-round play-pause glow-btn"
                  style={{
                    backgroundColor: timerConfigs[timerMode].color,
                    boxShadow: `0 0 16px ${timerConfigs[timerMode].color}44`
                  }}
                >
                  {isTimerRunning ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={() => { playClickSound(); setIsEditingDurations(!isEditingDurations); }}
                  title="Configure Durations"
                  className="timer-btn-round"
                  style={{ borderColor: isEditingDurations ? 'var(--accent)' : 'var(--border-color)', color: isEditingDurations ? 'var(--accent)' : 'var(--text-secondary)' }}
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              {/* Custom Dropdown select task */}
              {timerMode === 'study' && (
                <div className="timer-association-area">
                  <span className="timer-select-title" style={{ marginBottom: '6px' }}>Assigned Focus Task</span>
                  <CustomSelect
                    value={associatedTaskId}
                    onChange={(val) => setAssociatedTaskId(val)}
                    options={taskOptions}
                  />
                  {associatedTaskId && (
                    <div style={{ height: '8px' }} />
                  )}
                </div>
              )}
            </>
          ) : (
            // ================== STOPWATCH WIDGET (CIRCLE-FREE) ==================
            <>
              {/* Header */}
              <div className="timer-mode-selector" style={{ justifyContent: 'center', border: 'none', background: 'none', marginBottom: '16px' }}>
                <span className="modal-display-title glow-text" style={{ margin: 0 }}>
                  <Clock className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  <span>Precision Stopwatch</span>
                </span>
              </div>

              {/* Digital clean display without progress circle */}
              <div
                className="modern-stopwatch-display"
                onClick={openStopwatchEdit}
                title="Click to open fullscreen"
              >
                <div
                  className="timer-digits glow-text"
                  style={{
                    fontSize: stopwatchFontSize,
                    letterSpacing: '0.04em',
                    lineHeight: '1',
                    fontWeight: 900
                  }}
                >
                  {formatStopwatchTimeStr(stopwatchTime)}
                </div>
                <div className="timer-status-lbl" style={{ marginTop: '10px' }}>
                  {isStopwatchRunning ? 'running' : isMobile ? 'tap for fullscreen' : 'click to edit'}
                </div>
              </div>

              {/* Controls */}
              <div className="timer-controls-row" style={{ marginBottom: '24px' }}>
                <button
                  onClick={resetStopwatch}
                  title="Reset Stopwatch"
                  className="timer-btn-round"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleStopwatch}
                  className="timer-btn-round play-pause glow-btn"
                  style={{
                    backgroundColor: 'var(--accent)',
                    boxShadow: '0 0 16px var(--glow-color)'
                  }}
                >
                  {isStopwatchRunning ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={openStopwatchEdit}
                  title="Edit Time"
                  className="timer-btn-round"
                  style={{ borderColor: isEditingStopwatch ? 'var(--accent)' : 'var(--border-color)', color: isEditingStopwatch ? 'var(--accent)' : 'var(--text-secondary)' }}
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              {/* Custom Dropdown select task */}
              <div className="timer-association-area">
                <span className="timer-select-title" style={{ marginBottom: '6px' }}>Assigned Stopwatch Task</span>
                <CustomSelect
                  value={associatedStopwatchTaskId}
                  onChange={(val) => {
                    if (associatedStopwatchTaskId) {
                      saveUnsavedStopwatchTime(associatedStopwatchTaskId, stopwatchTime);
                    }
                    setAssociatedStopwatchTaskId(val);
                    lastSavedStopwatchTimeRef.current = stopwatchTime;
                  }}
                  options={taskOptions}
                />
                {associatedStopwatchTaskId && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={handleCompleteStopwatchTask}
                      className="primary-btn glow-btn animate-scale-in"
                      style={{
                        marginTop: '4px',
                        width: '100%',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, var(--accent) 0%, #10b981 100%)',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete Task
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* --- RIGHT SIDE: SETTINGS & EDITORS PANEL --- */}
        <div className="space-y-4" style={{ width: '100%' }}>

          {/* 1. Timer Durations Settings Box */}
          {activeTab === 'timer' && isEditingDurations && (
            <div className="glass animate-scale-in" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <h3 className="modal-display-title" style={{ margin: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '14px' }}>
                <Settings className="w-4 h-4 text-[var(--accent)]" />
                <span>Configure Durations (Mins)</span>
              </h3>

              <div className="space-y-3">
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label>Study Block</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={editDurations.study}
                    onChange={(e) => setEditDurations(prev => ({ ...prev, study: parseInt(e.target.value) || 1 }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label>Short Break</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={editDurations.short_break}
                    onChange={(e) => setEditDurations(prev => ({ ...prev, short_break: parseInt(e.target.value) || 1 }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Long Break</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={editDurations.long_break}
                    onChange={(e) => setEditDurations(prev => ({ ...prev, long_break: parseInt(e.target.value) || 1 }))}
                    className="form-input"
                  />
                </div>

                <button
                  onClick={saveCustomDurations}
                  className="primary-btn glow-btn"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Save className="w-4 h-4" />
                  Save Durations
                </button>
              </div>
            </div>
          )}

          {/* 2. Stopwatch Duration Editor Box */}
          {activeTab === 'stopwatch' && isEditingStopwatch && (
            <div className="glass animate-scale-in" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <h3 className="modal-display-title" style={{ margin: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '14px' }}>
                <Settings className="w-4 h-4 text-[var(--accent)]" />
                <span>Edit Elapsed Time</span>
              </h3>

              <div className="space-y-3">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={editStopwatchHours}
                      onChange={(e) => setEditStopwatchHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Mins</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={editStopwatchMins}
                      onChange={(e) => setEditStopwatchMins(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Secs</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={editStopwatchSecs}
                      onChange={(e) => setEditStopwatchSecs(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="form-input"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveStopwatchEdit}
                  className="primary-btn glow-btn"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
                >
                  <Save className="w-4 h-4" />
                  Update Duration
                </button>
              </div>
            </div>
          )}

          {/* Productivity Tip */}
          {showProductivityTip && (
            <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)', position: 'relative' }}>
              <button
                onClick={() => setShowProductivityTip(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                title="Close Tip"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="timer-select-title" style={{ color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>Productivity Tip</span>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                The **Study** Focus timer helps you build attention using interval countdowns. If you prefer free-flow tracking, use the **Stopwatch** tab. Assorted time stats accumulate directly to your dashboard stats.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
