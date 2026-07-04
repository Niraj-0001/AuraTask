import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface WelcomeModalProps {
  onSaveName: (name: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onSaveName }) => {
  const [nameInput, setNameInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    playClickSound();
    onSaveName(nameInput.trim());
  };

  return (
    <div 
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(12px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="modal-card glass animate-scale-in"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '32px',
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 30px var(--glow-color)',
          position: 'relative'
        }}
      >
        {/* Decorative Sparkle icon */}
        <div 
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'rgba(var(--accent-rgb), 0.1)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            color: 'var(--accent)',
            boxShadow: '0 0 12px var(--glow-color)'
          }}
        >
          <Sparkles className="w-5 h-5" />
        </div>

        {/* Modal Titles */}
        <h2 
          className="glow-text"
          style={{
            fontSize: '22px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '8px'
          }}
        >
          Welcome to AuraTask
        </h2>
        <p 
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: '1.45',
            marginBottom: '24px'
          }}
        >
          Your premium, high-aesthetic productivity board. Please enter your name to customize your workspace dashboard.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            required
            autoFocus
            maxLength={25}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="What should we call you?"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              textAlign: 'center',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent)';
              e.target.style.boxShadow = '0 0 8px var(--glow-color)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          />

          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="primary-btn glow-btn"
            style={{
              padding: '12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: nameInput.trim() ? 'pointer' : 'not-allowed',
              opacity: nameInput.trim() ? 1 : 0.6
            }}
          >
            <span>Get Started</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
