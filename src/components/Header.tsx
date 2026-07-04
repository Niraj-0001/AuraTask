import React, { useEffect, useState } from 'react';
import { Sparkles, HelpCircle, Plus } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface HeaderProps {
  onSaveAiTask: (promptText: string) => Promise<void>;
  onAddTaskClick: () => void;
  onOpenKeyboardShortcuts: () => void;
  onOpenAiModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSaveAiTask,
  onAddTaskClick,
  onOpenKeyboardShortcuts,
  onOpenAiModal,
}) => {
  const [time, setTime] = useState(new Date());
  const [aiPromptText, setAiPromptText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleHelpClick = () => {
    playClickSound();
    onOpenKeyboardShortcuts();
  };

  const handleAddClick = () => {
    playClickSound();
    onAddTaskClick();
  };

  const handleAiSubmit = async () => {
    if (!aiPromptText.trim() || isAiLoading) return;
    playClickSound();
    setIsAiLoading(true);
    try {
      await onSaveAiTask(aiPromptText);
      setAiPromptText('');
      setSuccessMsg('Gemini created task!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error(err);
      setSuccessMsg('Error creating task.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAiSubmit();
    }
  };

  return (
    <header className="app-header glass">
      {/* AI Task Prompt Input (replaces search bar) */}
      <div className="ai-header-input-container">
        <button 
          onClick={onOpenAiModal} 
          title="Open Gemini AI Composer"
          className="ai-header-modal-trigger-btn"
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '0 8px 0 12px',
            color: 'var(--accent)',
            transition: 'transform 0.2s',
            height: '100%'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Sparkles className="w-4.5 h-4.5" />
        </button>
        <input
          type="text"
          value={aiPromptText}
          onChange={(e) => setAiPromptText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAiLoading ? "Gemini is thinking..." : "Ask Gemini to add task... (or click Sparkles)"}
          disabled={isAiLoading}
          className="ai-header-search-input"
          style={{ paddingLeft: '4px' }}
        />
        {aiPromptText.trim() && !isAiLoading && (
          <button className="ai-header-submit-btn animate-scale-in" onClick={handleAiSubmit}>
            Create
          </button>
        )}
        {isAiLoading && (
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: '12px' }}>
            <div style={{ 
              width: '14px', 
              height: '14px', 
              border: '2px solid var(--accent)', 
              borderTopColor: 'transparent', 
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}
        {successMsg && (
          <div className="ai-header-success-msg animate-scale-in">
            {successMsg}
          </div>
        )}
      </div>

      {/* Date/Time widget & Actions */}
      <div className="header-actions">
        {/* Local time clock */}
        <div className="date-time-widget">
          <span className="time-display glow-text">{formatTime(time)}</span>
          <span className="date-display">{formatDate(time)}</span>
        </div>

        {/* Action Controls */}
        <button
          onClick={handleHelpClick}
          title="Keyboard Shortcuts"
          className="icon-btn"
        >
          <HelpCircle className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={handleAddClick}
          className="primary-btn glow-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
