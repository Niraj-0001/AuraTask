import React, { useState, useEffect } from 'react';
import { X, Palette, Eye, EyeOff, Layout, Moon, Clock } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface FullScreenClockProps {
  onClose: () => void;
}

type BgMode = 'blur' | 'gradient' | 'oled';

export const FullScreenClock: React.FC<FullScreenClockProps> = ({ onClose }) => {
  const [time, setTime] = useState(new Date());

  // --- Persistent User Preferences ---
  const [format12h, setFormat12h] = useState<boolean>(() => {
    return localStorage.getItem('auratask_clock_12h') !== 'false';
  });

  const [showSeconds, setShowSeconds] = useState<boolean>(() => {
    return localStorage.getItem('auratask_clock_seconds') !== 'false';
  });

  const [bgMode, setBgMode] = useState<BgMode>(() => {
    return (localStorage.getItem('auratask_clock_bg') as BgMode) || 'gradient';
  });

  // --- Clock Tick Effect ---
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 250); // Refresh frequently for instant response and smooth seconds tick

    return () => clearInterval(interval);
  }, []);

  // --- Save Preferences to LocalStorage ---
  useEffect(() => {
    localStorage.setItem('auratask_clock_12h', format12h.toString());
  }, [format12h]);

  useEffect(() => {
    localStorage.setItem('auratask_clock_seconds', showSeconds.toString());
  }, [showSeconds]);

  useEffect(() => {
    localStorage.setItem('auratask_clock_bg', bgMode);
  }, [bgMode]);

  // --- Escape Key handler to close ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playClickSound();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // --- Formatter Utilities ---
  const formatTimeParts = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    if (format12h) {
      hours = hours % 12;
      hours = hours ? hours : 12; // Hour '0' -> '12'
    }

    const pad = (num: number) => String(num).padStart(2, '0');
    
    // We don't pad single digit hours in 12-hour mode for clean display (e.g. 5:23 instead of 05:23)
    const hoursStr = format12h ? String(hours) : pad(hours);
    const minutesStr = pad(minutes);
    const secondsStr = pad(seconds);

    return {
      timeStr: `${hoursStr}:${minutesStr}${showSeconds ? `:${secondsStr}` : ''}`,
      ampm: format12h ? ampm : ''
    };
  };

  const formatDateStr = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const { timeStr, ampm } = formatTimeParts(time);

  const handleClose = () => {
    playClickSound();
    onClose();
  };

  const toggle12h = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setFormat12h(prev => !prev);
  };

  const toggleSeconds = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setShowSeconds(prev => !prev);
  };

  const changeBgMode = (mode: BgMode, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setBgMode(mode);
  };

  return (
    <div 
      className={`fullscreen-clock-overlay mode-${bgMode}`}
      onClick={handleClose}
      title="Click anywhere to return"
    >
      {/* Floating Animated Gradient Blobs (rendered only in gradient mode) */}
      <div className="fc-blobs-container">
        <div className="fc-blob fc-blob-1" />
        <div className="fc-blob fc-blob-2" />
        <div className="fc-blob fc-blob-3" />
      </div>

      {/* Close Button */}
      <button 
        className="fc-close-btn" 
        onClick={handleClose}
        title="Exit Fullscreen (Esc)"
      >
        <X size={20} />
      </button>

      {/* Center Clock Display */}
      <div className="fc-content" onClick={(e) => e.stopPropagation()}>
        <div className="fc-time">
          {timeStr}
          {ampm && (
            <span style={{ 
              fontSize: '0.35em', 
              fontWeight: 500, 
              marginLeft: '12px',
              verticalAlign: 'super',
              opacity: 0.85,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.05em'
            }}>
              {ampm}
            </span>
          )}
        </div>
        <div className="fc-date">{formatDateStr(time)}</div>
      </div>

      {/* Bottom Option Toolbar */}
      <div className="fc-dock" onClick={(e) => e.stopPropagation()}>
        {/* 12h/24h Toggle */}
        <button 
          className={`fc-dock-btn ${format12h ? 'active' : ''}`}
          onClick={toggle12h}
          title="Toggle 12/24 Hour Format"
        >
          <Clock size={14} />
          <span>{format12h ? '12H' : '24H'}</span>
        </button>

        {/* Seconds Toggle */}
        <button 
          className={`fc-dock-btn ${showSeconds ? 'active' : ''}`}
          onClick={toggleSeconds}
          title="Toggle Seconds"
        >
          {showSeconds ? <Eye size={14} /> : <EyeOff size={14} />}
          <span>Sec</span>
        </button>

        <div className="fc-dock-divider" />

        {/* Visual Mode Toggles */}
        <button 
          className={`fc-dock-btn ${bgMode === 'blur' ? 'active' : ''}`}
          onClick={(e) => changeBgMode('blur', e)}
          title="Workspace Blur Mode"
        >
          <Layout size={14} />
          <span>Blur</span>
        </button>

        <button 
          className={`fc-dock-btn ${bgMode === 'gradient' ? 'active' : ''}`}
          onClick={(e) => changeBgMode('gradient', e)}
          title="Ambient Gradient Mode"
        >
          <Palette size={14} />
          <span>Ambient</span>
        </button>

        <button 
          className={`fc-dock-btn ${bgMode === 'oled' ? 'active' : ''}`}
          onClick={(e) => changeBgMode('oled', e)}
          title="OLED Minimalist Mode"
        >
          <Moon size={14} />
          <span>Zen</span>
        </button>
      </div>
    </div>
  );
};
