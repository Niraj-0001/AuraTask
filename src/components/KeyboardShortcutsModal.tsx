import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: '1', description: 'Switch to Dashboard View' },
    { key: '2', description: 'Switch to Kanban Board View' },
    { key: '3', description: 'Switch to List View' },
    { key: '4', description: 'Switch to Calendar View' },
    { key: 'N', description: 'Create a new task' },
    { key: 'F', description: 'Open Pomodoro Focus Timer' },
    { key: 'T', description: 'Cycle aesthetic color themes' },
    { key: '/', description: 'Focus search bar' },
    { key: 'Esc', description: 'Close any open modal overlay' },
  ];

  const handleClose = () => {
    playClickSound();
    onClose();
  };

  return (
    <div className="modal-backdrop animate-scale-in">
      <div className="modal-card glass">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="modal-close-btn"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="modal-display-title glow-text" style={{ width: '100%', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', justifyContent: 'flex-start' }}>
          <Keyboard className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} />
          <span>Keyboard Commands</span>
        </div>

        {/* Shortcuts List */}
        <div className="shortcuts-list">
          {shortcuts.map((sh, idx) => (
            <div key={idx} className="shortcut-row">
              <span className="shortcut-desc">{sh.description}</span>
              <kbd className="shortcut-key-cap">{sh.key}</kbd>
            </div>
          ))}
        </div>

        {/* Info footer */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.03)', textAlign: 'center', width: '100%' }}>
          <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Command className="w-3.5 h-3.5" /> 
            <span>Command Palette Guide</span>
          </p>
        </div>
      </div>
    </div>
  );
};
