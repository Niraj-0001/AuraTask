import React, { useState, useEffect, useRef } from 'react';
import type { Task } from '../types';
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
  Maximize
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
}

type ModeType = 'timer' | 'stopwatch';
type TimerMode = 'study' | 'short_break' | 'long_break';
type SizeMode = 'normal' | 'large' | 'fullscreen';

export const FocusHubView: React.FC<FocusHubViewProps> = ({
  tasks,
  activeTaskId,
  onAddTaskFocusTime,
  clearActiveTaskId
}) => {
  const [activeTab, setActiveTab] = useState<ModeType>('timer');
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal');

  // --- TIMER STATE ---
  const [timerMode, setTimerMode] = useState<TimerMode>('study');
  const [associatedTaskId, setAssociatedTaskId] = useState<string>('');
  
  const [durations, setDurations] = useState<Record<TimerMode, number>>({
    study: 25,
    short_break: 5,
    long_break: 15
  });
  
  const [isEditingDurations, setIsEditingDurations] = useState(false);
  const [editDurations, setEditDurations] = useState(durations);

  const [timeLeft, setTimeLeft] = useState(durations.study * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(durations.study * 60);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- STOPWATCH STATE ---
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [associatedStopwatchTaskId, setAssociatedStopwatchTaskId] = useState<string>('');
  const [isEditingStopwatch, setIsEditingStopwatch] = useState(false);
  const [editStopwatchHours, setEditStopwatchHours] = useState(0);
  const [editStopwatchMins, setEditStopwatchMins] = useState(0);
  const [editStopwatchSecs, setEditStopwatchSecs] = useState(0);

  const stopwatchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // --- TIMER EFFECTS & LOGIC ---
  useEffect(() => {
    if (!isTimerRunning) {
      const targetMins = durations[timerMode];
      setTimeLeft(targetMins * 60);
      setTotalSeconds(targetMins * 60);
    }
  }, [timerMode, durations]);

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
            
            alert(`${timerConfigs[timerMode].label} complete!`);
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
    setIsEditingDurations(false);
  };

  // --- STOPWATCH LOGIC ---
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime(prev => {
          const next = prev + 1;
          if (associatedStopwatchTaskId && next % 10 === 0) {
            onAddTaskFocusTime(associatedStopwatchTaskId, 10);
          }
          return next;
        });
      }, 1000);
    } else {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }

    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning, associatedStopwatchTaskId]);

  const toggleStopwatch = () => {
    playClickSound();
    setIsStopwatchRunning(!isStopwatchRunning);
  };

  const resetStopwatch = () => {
    playClickSound();
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
  };

  const handleSaveStopwatchEdit = () => {
    playClickSound();
    const finalSecs = (editStopwatchHours * 3600) + (editStopwatchMins * 60) + editStopwatchSecs;
    setStopwatchTime(finalSecs);
    setIsEditingStopwatch(false);
  };

  const openStopwatchEdit = () => {
    playClickSound();
    setIsStopwatchRunning(false);
    const hrs = Math.floor(stopwatchTime / 3600);
    const mins = Math.floor((stopwatchTime % 3600) / 60);
    const secs = stopwatchTime % 60;
    setEditStopwatchHours(hrs);
    setEditStopwatchMins(mins);
    setEditStopwatchSecs(secs);
    setIsEditingStopwatch(true);
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
  const cardMaxWidth = sizeMode === 'large' ? '840px' : '440px';
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

  // ================== FULL SCREEN RENDERING OVERLAY ==================
  if (sizeMode === 'fullscreen') {
    const currentTaskId = activeTab === 'timer' ? associatedTaskId : associatedStopwatchTaskId;
    const activeTask = tasks.find(t => t.id === currentTaskId);
    const accentColor = activeTab === 'timer' ? timerConfigs[timerMode].color : 'var(--accent)';
    
    // Circular calculations for timer progress
    const fsRadius = 134;
    const fsCircumference = fsRadius * 2 * Math.PI;
    const fsStrokeDashoffset = fsCircumference - (timeLeft / totalSeconds) * fsCircumference;

    return (
      <div className="focus-fullscreen-overlay">
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
          {activeTab === 'timer' ? (
            // FULLSCREEN TIMER
            <div className="fullscreen-content">
              <span className="fullscreen-subtitle" style={{ color: accentColor }}>
                {timerConfigs[timerMode].label}
              </span>
              
              {/* Central countdown circle */}
              <div className="fullscreen-digits-wrap" style={{ width: '320px', height: '320px' }}>
                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }} viewBox="0 0 300 300">
                  <circle
                    stroke="rgba(255, 255, 255, 0.03)"
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

              <div className="fullscreen-status">
                {isTimerRunning ? 'focusing' : 'paused'}
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
          ) : (
            // FULLSCREEN STOPWATCH
            <div className="fullscreen-content">
              <span className="fullscreen-subtitle" style={{ color: 'var(--accent)' }}>
                Precision Stopwatch
              </span>

              {/* Clean digital display without circle */}
              <div className="fullscreen-digits" style={{ fontSize: '90px', margin: '48px 0', letterSpacing: '0.04em' }}>
                {formatStopwatchTimeStr(stopwatchTime)}
              </div>

              <div className="fullscreen-status">
                {isStopwatchRunning ? 'running' : 'paused'}
              </div>

              {activeTask && (
                <div className="fullscreen-task-badge">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>Tracking: <strong>{activeTask.title}</strong></span>
                </div>
              )}

              <div className="fullscreen-controls">
                <button onClick={resetStopwatch} className="fullscreen-control-btn" title="Reset Stopwatch">
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                  onClick={toggleStopwatch} 
                  className="fullscreen-control-btn play-pause glow-btn"
                  style={{ backgroundColor: 'var(--accent)', boxShadow: `0 0 20px var(--glow-color)` }}
                  title={isStopwatchRunning ? "Pause Stopwatch" : "Start Stopwatch"}
                >
                  {isStopwatchRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
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
      
      {/* Title block */}
      <div className="dashboard-title-area" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Focus Hub</h1>
          <p>Allocate dedicated study blocks or track stopwatch intervals to log stats.</p>
        </div>

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
                    <p className="timer-log-msg">
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> 
                      <span>Time increments will auto-save to this task</span>
                    </p>
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
                title="Click to edit elapsed time"
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
                  {isStopwatchRunning ? 'running' : 'click to edit'}
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
                  onChange={(val) => setAssociatedStopwatchTaskId(val)}
                  options={taskOptions}
                />
                {associatedStopwatchTaskId && (
                  <p className="timer-log-msg">
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> 
                    <span>Time increments will auto-save to this task</span>
                  </p>
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
          <div className="glass" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <span className="timer-select-title" style={{ color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>Productivity Tip</span>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              The **Study** Focus timer helps you build attention using interval countdowns. If you prefer free-flow tracking, use the **Stopwatch** tab. Assorted time stats accumulate directly to your dashboard stats.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
