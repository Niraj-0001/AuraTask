import React from 'react';
import { LayoutDashboard, ListTodo, Target, Plus, Palette } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface MobileNavProps {
  currentView: 'dashboard' | 'board' | 'list' | 'calendar' | 'focus' | 'themes' | 'mobile-add-task';
  setView: (view: 'dashboard' | 'board' | 'list' | 'calendar' | 'focus' | 'themes' | 'mobile-add-task') => void;
  onAddClick: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, setView, onAddClick }) => {
  const handleViewChange = (v: typeof currentView) => {
    playClickSound();
    setView(v);
  };

  return (
    <nav className="mobile-bottom-nav">
      <button 
        className={`mobile-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
        onClick={() => handleViewChange('dashboard')}
      >
        <LayoutDashboard className="w-6 h-6" />
        <span>Home</span>
      </button>
      
      <button 
        className={`mobile-nav-item ${currentView === 'list' ? 'active' : ''}`}
        onClick={() => handleViewChange('list')}
      >
        <ListTodo className="w-6 h-6" />
        <span>Task</span>
      </button>

      {/* Center Floating Action Button in Navbar */}
      <button 
        className="mobile-nav-fab"
        onClick={() => { playClickSound(); onAddClick(); }}
      >
        <Plus className="w-6 h-6" strokeWidth={3} />
      </button>
      
      <button 
        className={`mobile-nav-item ${currentView === 'focus' ? 'active' : ''}`}
        onClick={() => handleViewChange('focus')}
      >
        <Target className="w-6 h-6" />
        <span>Focus</span>
      </button>

      <button 
        className={`mobile-nav-item ${currentView === 'themes' ? 'active' : ''}`}
        onClick={() => handleViewChange('themes')}
      >
        <Palette className="w-6 h-6" />
        <span>Theme</span>
      </button>
    </nav>
  );
};
