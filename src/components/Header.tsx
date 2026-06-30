import React, { useEffect, useState } from 'react';
import { Sparkles, HelpCircle, Plus } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import { parseAiPrompt } from './AiTaskModal';

interface HeaderProps {
  onSaveAiTask: (taskData: ReturnType<typeof parseAiPrompt>) => void;
  onAddTaskClick: () => void;
  onOpenKeyboardShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSaveAiTask,
  onAddTaskClick,
  onOpenKeyboardShortcuts,
}) => {
  const [time, setTime] = useState(new Date());
  const [aiPromptText, setAiPromptText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleAiSubmit = () => {
    if (!aiPromptText.trim()) return;
    playClickSound();
    const taskData = parseAiPrompt(aiPromptText);
    onSaveAiTask(taskData);
    setAiPromptText('');
    setSuccessMsg('AI created task!');
    setTimeout(() => setSuccessMsg(''), 3000);
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
        <span className="ai-header-input-icon">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </span>
        <input
          type="text"
          value={aiPromptText}
          onChange={(e) => setAiPromptText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Gemini to add task... (e.g. Study physics tomorrow high)"
          className="ai-header-search-input"
        />
        {aiPromptText.trim() && (
          <button className="ai-header-submit-btn animate-scale-in" onClick={handleAiSubmit}>
            Create
          </button>
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
