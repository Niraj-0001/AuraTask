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

// --- GEMINI API CALLER ---
export const fetchGeminiParsedTask = async (apiKey: string, userInput: string) => {
  const currentDate = new Date().toISOString().split('T')[0];
  const systemPrompt = `
You are a task management AI assistant. Your goal is to analyze the user's natural language task request: "${userInput}".
Generate a structured JSON object representing the task.
The current date (today) is: ${currentDate}.
The JSON object must strictly follow this structure:
{
  "title": "A clean, action-oriented task title (max 60 chars), capitalize the first letter",
  "description": "A detailed description of the task, explaining what needs to be done based on the user prompt.",
  "priority": "low" | "medium" | "high" | "critical" (evaluate based on urgency indicators like asap, urgent, important, critical, low, etc.),
  "category": "study" | "personal" | "shopping" | "health" | "ideas" | "other" (select the most appropriate one),
  "dueDate": "YYYY-MM-DD" (calculate relative dates based on today's date ${currentDate}. For example, 'tomorrow' is ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}, etc.),
  "subtasks": [
    {
      "title": "A short, actionable subtask title",
      "completed": false
    }
  ] (break the task down into 2 to 4 simple, sequential subtasks if applicable. If not applicable, return an empty array)
}
Return ONLY the raw JSON object, without any markdown blocks or extra explanation.
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    let errMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error?.message) {
        errMsg = errJson.error.message;
      }
    } catch (_) { }
    throw new Error(errMsg);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response content returned from Gemini.');
  }

  const parsed = JSON.parse(text);

  // Post-process to ensure type safety and valid subtask IDs
  const subtasks = (parsed.subtasks || []).map((s: any) => ({
    id: s.id || `sub-${Math.random().toString(36).substring(2, 11)}`,
    title: s.title || String(s),
    completed: !!s.completed
  }));

  return {
    title: parsed.title || userInput.trim(),
    description: parsed.description || `Parsed from AI command: "${userInput}"`,
    priority: ['low', 'medium', 'high', 'critical'].includes(parsed.priority) ? parsed.priority : 'medium',
    category: ['study', 'personal', 'shopping', 'health', 'ideas', 'other'].includes(parsed.category) ? parsed.category : 'other',
    dueDate: parsed.dueDate || '',
    subtasks
  };
};

interface AiTaskModalProps {
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'timeSpent'>) => void;
  onClose: () => void;
}

export const AiTaskModal: React.FC<AiTaskModalProps> = ({ onSave, onClose }) => {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('auratask_gemini_api_key') || '';
  });

  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  const [tempKey, setTempKey] = useState(apiKey);
  const [useFallbackLocal, setUseFallbackLocal] = useState(false);

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

  const handleSaveApiKey = () => {
    playClickSound();
    const cleanKey = tempKey.trim();
    if (!cleanKey) {
      setError('API Key cannot be empty.');
      return;
    }
    setApiKey(cleanKey);
    localStorage.setItem('auratask_gemini_api_key', cleanKey);
    setShowKeyInput(false);
    setError('');
    setUseFallbackLocal(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please type an AI command or instructions.');
      return;
    }

    playClickSound();
    setError('');
    setUseFallbackLocal(false);

    // Run local regex parser if key is empty
    if (!apiKey.trim()) {
      try {
        const taskData = parseAiPrompt(prompt);
        onSave({
          ...taskData,
          status: 'todo'
        });
      } catch (err: any) {
        setError(err.message || 'Heuristic parsing failed.');
      }
      return;
    }

    // Call Gemini API
    setIsGenerating(true);
    try {
      const taskData = await fetchGeminiParsedTask(apiKey, prompt);
      onSave({
        ...taskData,
        status: 'todo'
      });
    } catch (err: any) {
      console.error(err);
      setError(`Gemini API failed: ${err.message || err}`);
      setUseFallbackLocal(true);
    } finally {
      setIsGenerating(false);
    }
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
        <h3 className="modal-display-title glow-text" style={{ gap: '8px', marginBottom: '8px' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <span>Add Task by Gemini AI</span>
        </h3>

        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
          Describe your task in natural language. Gemini AI will automatically detect the title, calculate due dates, category, generate a detailed description, and write a checklist of subtasks.
        </p>

        {/* API Key Configuration Block */}
        <div style={{
          margin: '0 0 16px 0',
          padding: '12px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          fontSize: '12px'
        }}>
          {showKeyInput ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Gemini API Configuration</span>
                <button
                  type="button"
                  onClick={() => setShowKeyInput(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
                >
                  Cancel
                </button>
              </div>
              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                Enter your Gemini API Key. Get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Google AI Studio</a>.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Paste API key here..."
                  className="form-input"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '11px', height: 'auto', marginBottom: 0 }}
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="primary-btn"
                  style={{ padding: '6px 12px', height: 'auto', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '99px', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Gemini AI Connected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { playClickSound(); setShowKeyInput(true); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}
                >
                  Change Key
                </button>
              </div>
            </div>
          )}
        </div>

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
            <div style={{ marginTop: '8px' }}>
              <p style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
              {useFallbackLocal && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    const taskData = parseAiPrompt(prompt);
                    onSave({
                      ...taskData,
                      status: 'todo'
                    });
                  }}
                  className="secondary-btn"
                  style={{ marginTop: '8px', fontSize: '11px', padding: '6px 12px', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                >
                  Skip API & Use Local Parser
                </button>
              )}
            </div>
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
            disabled={isGenerating}
            className="primary-btn glow-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isGenerating ? 0.6 : 1,
              cursor: isGenerating ? 'not-allowed' : 'pointer'
            }}
          >
            {isGenerating ? (
              <>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Task</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
