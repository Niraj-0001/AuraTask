import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import type { Task, TaskPriority, TaskCategory } from '../types';
import { playClickSound } from '../utils/audio';

const getLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const parseAiPrompt = (prompt: string) => {
  const cleanPrompt = prompt.toLowerCase().trim();
  
  // 1. Determine priority
  let priority: TaskPriority = 'medium';
  if (/\b(critical|urgent|asap)\b/.test(cleanPrompt)) priority = 'critical';
  else if (/\b(high|important)\b/.test(cleanPrompt)) priority = 'high';
  else if (/\b(low|trivial)\b/.test(cleanPrompt)) priority = 'low';
  else if (/\b(medium|moderate)\b/.test(cleanPrompt)) priority = 'medium';

  // 2. Determine category
  let category: TaskCategory = 'other';
  if (/\b(study|learn|book|read|homework|exam|class|math|coding|school|college|course)\b/.test(cleanPrompt)) category = 'study';
  else if (/\b(personal|private|home|house|family|call|chore|cleaning)\b/.test(cleanPrompt)) category = 'personal';
  else if (/\b(shopping|buy|shop|grocery|store|milk|clothes|purchase|cart)\b/.test(cleanPrompt)) category = 'shopping';
  else if (/\b(health|gym|workout|exercise|doctor|dentist|run|sport|fit|meds|sleep)\b/.test(cleanPrompt)) category = 'health';
  else if (/\b(idea|ideas|brainstorm|draft|sketch|write|creative|design|draw)\b/.test(cleanPrompt)) category = 'ideas';

  // 3. Determine due date
  let dueDate = '';
  const today = new Date();
  
  if (/\btoday\b/.test(cleanPrompt)) {
    dueDate = getLocalDateString(today);
  } else if (/\btomorrow\b/.test(cleanPrompt)) {
    const tom = new Date(today);
    tom.setDate(today.getDate() + 1);
    dueDate = getLocalDateString(tom);
  } else if (/\bnext week\b/.test(cleanPrompt)) {
    const nextWk = new Date(today);
    nextWk.setDate(today.getDate() + 7);
    dueDate = getLocalDateString(nextWk);
  } else {
    // Check for days of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let matchedDayIdx = -1;
    for (let i = 0; i < 7; i++) {
      if (cleanPrompt.includes(days[i])) {
        matchedDayIdx = i;
        break;
      }
    }
    if (matchedDayIdx !== -1) {
      const targetDate = new Date(today);
      const currentDayIdx = today.getDay();
      let diff = matchedDayIdx - currentDayIdx;
      if (diff <= 0) diff += 7; // Next week's target day
      targetDate.setDate(today.getDate() + diff);
      dueDate = getLocalDateString(targetDate);
    }
  }

  // 4. Extract title
  // Remove keyword matches from title
  let title = prompt;
  
  // Replace time-bound expressions
  title = title.replace(/\b(today|tomorrow|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
  // Replace priority expressions
  title = title.replace(/\b(critical|high|medium|low|urgent|asap|important|trivial|moderate)\s+priority\b/gi, '');
  title = title.replace(/\bpriority\s+(critical|high|medium|low|urgent|asap|important|trivial|moderate)\b/gi, '');
  title = title.replace(/\b(critical|high|medium|low|urgent|asap|important|trivial|moderate)\b/gi, '');
  // Replace category expressions
  title = title.replace(/\bcategory\s+(study|personal|shopping|health|ideas|other)\b/gi, '');
  title = title.replace(/\b(study|personal|shopping|health|ideas|other)\b/gi, '');
  // Clean up filler words
  title = title.replace(/\b(project|task|at|on|for|need to|want to|schedule|add|create|make)\b/gi, '');
  
  // Clean punctuation and double spaces
  title = title.replace(/[,;.]/g, '').replace(/\s+/g, ' ').trim();
  
  // Fallback: If title extraction leaves nothing, use original prompt
  if (title.length < 3) {
    title = prompt.trim();
  } else {
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return {
    title,
    priority,
    category,
    dueDate,
    description: `Parsed from AI command: "${prompt}"`,
    subtasks: []
  };
};

interface AiTaskModalProps {
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'timeSpent'>) => void;
  onClose: () => void;
}

export const AiTaskModal: React.FC<AiTaskModalProps> = ({ onSave, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');

  const suggestions = [
    'Study mathematics tomorrow morning at high priority',
    'Buy fresh groceries and milk low priority today',
    'Gym workout on Friday, health category',
    'Draft a new project roadmap idea next week critical priority'
  ];

  const handleSuggestionClick = (sug: string) => {
    playClickSound();
    setPrompt(sug);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      setError('Please type an AI command or instructions.');
      return;
    }

    playClickSound();
    const taskData = parseAiPrompt(prompt);
    onSave({
      ...taskData,
      status: 'todo'
    });
  };

  const handleCloseClick = () => {
    playClickSound();
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card glass animate-scale-in" style={{ maxWidth: '480px' }}>
        
        {/* Close Button */}
        <button
          onClick={handleCloseClick}
          className="modal-close-btn"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <h3 className="modal-display-title glow-text" style={{ gap: '8px' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <span>Add Task by AI</span>
        </h3>

        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
          Describe your task in natural language. Our local parser will automatically detect the title, due date, category, and priority ranking.
        </p>

        {/* Text Area Input */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Schedule coding session next monday high priority..."
            rows={3}
            className="form-input"
            style={{ 
              resize: 'none', 
              fontSize: '13px', 
              lineHeight: '1.5',
              borderColor: error ? '#ef4444' : 'var(--border-color)'
            }}
          />
          {error && (
            <p style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Suggestion Chips */}
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
            Try These Suggestion Commands
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(sug)}
                className="filter-item"
                style={{ 
                  textAlign: 'left', 
                  fontSize: '11px', 
                  padding: '8px 12px', 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Buttons Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={handleCloseClick}
            className="secondary-btn"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleGenerate}
            className="primary-btn glow-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Task</span>
          </button>
        </div>

      </div>
    </div>
  );
};
