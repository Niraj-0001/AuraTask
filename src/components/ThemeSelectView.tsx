import React from 'react';
import type { AppTheme } from '../types';
import { playClickSound } from '../utils/audio';
import { Sparkles, Check, Heart } from 'lucide-react';

interface ThemeSelectViewProps {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

interface ThemeConfig {
  id: AppTheme;
  name: string;
  description: string;
  colors: {
    bg: string;
    secondary: string;
    accent: string;
    text: string;
    priority: string;
  };
}

const THEME_OPTIONS: ThemeConfig[] = [
  {
    id: 'dark',
    name: 'Void Obsidian',
    description: 'An ultra-dark cosmic workspace for developers who code in the deep shadows.',
    colors: { bg: '#080c14', secondary: '#0e1626', accent: '#6366f1', text: '#f8fafc', priority: '#fb923c' }
  },
  {
    id: 'light',
    name: 'Polar Light',
    description: 'High-contrast light mode with clean borders for daytime productivity.',
    colors: { bg: '#f8fafc', secondary: '#ffffff', accent: '#4f46e5', text: '#0f172a', priority: '#f97316' }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Energetic futuristic city vibes with neon pink highlights and cyan texts.',
    colors: { bg: '#040408', secondary: '#080810', accent: '#ff007f', text: '#00ffcc', priority: '#ffaa00' }
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    description: 'Soothing organic green hues and moss accents for tranquil productivity.',
    colors: { bg: '#05100b', secondary: '#091a12', accent: '#10b981', text: '#e2f2ea', priority: '#fed7aa' }
  },
  {
    id: 'sunset',
    name: 'Rose Sunset',
    description: 'Warm gold and dusky pink gradients inspired by peaceful summer sunsets.',
    colors: { bg: '#0e070c', secondary: '#1a0d19', accent: '#ec4899', text: '#fff1f2', priority: '#f59e0b' }
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    description: 'Calm nautical navy blues combined with bright aquatic turquoise glows.',
    colors: { bg: '#0b132b', secondary: '#1c2541', accent: '#00b4d8', text: '#edf2f4', priority: '#ffb703' }
  },
  {
    id: 'tokyo',
    name: 'Tokyo Night',
    description: 'Futuristic lavender and violet accents set against a neon Tokyo slate skyline.',
    colors: { bg: '#1a1b26', secondary: '#24283b', accent: '#bb9af3', text: '#a9b1d6', priority: '#ff9e64' }
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    description: 'Chilled polar steel blues and crisp white tones inspired by clean arctic nights.',
    colors: { bg: '#2e3440', secondary: '#3b4252', accent: '#88c0d0', text: '#eceff4', priority: '#bf616a' }
  },
  {
    id: 'minimal',
    name: 'Linear Carbon',
    description: 'Ultra-modern graphite workspace featuring stark white accents and pure minimalist lines.',
    colors: { bg: '#0c0c0e', secondary: '#16161a', accent: '#ffffff', text: '#f4f4f5', priority: '#a1a1aa' }
  },
  {
    id: 'github',
    name: 'GitHub Dimmed',
    description: 'The classic, highly professional slate dark workspace favored by millions of developers.',
    colors: { bg: '#1c2128', secondary: '#22272e', accent: '#539bf5', text: '#adbac7', priority: '#373e47' }
  },
  {
    id: 'solarized',
    name: 'Solarized Amber',
    description: 'Warm, low-contrast retro terminal theme with organic roasted amber tones.',
    colors: { bg: '#1e1915', secondary: '#2b221a', accent: '#f59e0b', text: '#fef3c7', priority: '#d97706' }
  },
  {
    id: 'nebula',
    name: 'Cosmic Nebula',
    description: 'Energetic galactic fantasy theme with glowing violet-magenta gas clouds.',
    colors: { bg: '#0d0714', secondary: '#180e29', accent: '#d946ef', text: '#fdf4ff', priority: '#a21caf' }
  },
  {
    id: 'latte',
    name: 'Morning Latte',
    description: 'A warm, light coffee theme with soft brown text and elegant creamy backgrounds.',
    colors: { bg: '#fdfbf7', secondary: '#f4efe6', accent: '#b07d62', text: '#4a3f35', priority: '#d4a373' }
  },
  {
    id: 'mint',
    name: 'Fresh Mint',
    description: 'Crisp and refreshing light green tones with dark forest accents for a natural feel.',
    colors: { bg: '#f2fbf7', secondary: '#e6f6ec', accent: '#081c15', text: '#1b4332', priority: '#40916c' }
  },
  {
    id: 'cotton',
    name: 'Cotton Candy',
    description: 'Soft pastel pinks and airy blues create a dreamy, light workspace atmosphere.',
    colors: { bg: '#fcfdfe', secondary: '#f0f7fa', accent: '#ffb5a7', text: '#2b3a4a', priority: '#f28482' }
  }
];

export const ThemeSelectView: React.FC<ThemeSelectViewProps> = ({ theme, setTheme }) => {
  const handleSelectTheme = (id: AppTheme) => {
    playClickSound();
    setTheme(id);
  };

  return (
    <div className="theme-studio-container animate-slide-up" style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      {/* Page Header */}
      <div className="theme-studio-header" style={{ marginBottom: '32px' }}>
        <h1 className="theme-studio-title glow-text" style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <Sparkles className="w-6 h-6 text-accent" />
          <span>AURA THEME STUDIO</span>
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Personalize your workspace aesthetics. Choose a layout theme to match your focus mood.
        </p>
      </div>

      {/* Themes Grid */}
      <div className="theme-studio-grid">
        {THEME_OPTIONS.map(opt => {
          const isActive = theme === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => handleSelectTheme(opt.id)}
              className={`theme-studio-card ${isActive ? 'active' : ''}`}
            >
              {/* Active Indicator Badge */}
              {isActive && (
                <div className="theme-active-badge">
                  <Check size={12} className="text-white" />
                  <span>ACTIVE</span>
                </div>
              )}

              {/* Theme Name */}
              <h3 className="theme-card-name">{opt.name}</h3>
              <p className="theme-card-desc">{opt.description}</p>

              {/* Color Swatch row */}
              <div className="theme-swatch-row" style={{ display: 'flex', gap: '6px', margin: '16px 0' }}>
                <span className="theme-swatch-circle" style={{ backgroundColor: opt.colors.bg }} title="Background" />
                <span className="theme-swatch-circle" style={{ backgroundColor: opt.colors.secondary }} title="Secondary" />
                <span className="theme-swatch-circle" style={{ backgroundColor: opt.colors.accent }} title="Accent Accent" />
                <span className="theme-swatch-circle" style={{ backgroundColor: opt.colors.text }} title="Text color" />
                <span className="theme-swatch-circle" style={{ backgroundColor: opt.colors.priority }} title="Badges" />
              </div>

              {/* Live Preview Element */}
              <div 
                className="theme-card-preview"
                style={{ 
                  backgroundColor: opt.colors.secondary,
                  border: `1px solid ${isActive ? opt.colors.accent : 'transparent'}`,
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: opt.colors.accent }}>#PROJECT_STUDY</span>
                  <span 
                    style={{ 
                      fontSize: '7px', 
                      fontWeight: 'bold', 
                      backgroundColor: opt.colors.priority, 
                      color: opt.id === 'light' ? '#fff' : '#000',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}
                  >
                    HIGH PRIO
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: opt.colors.text, textDecoration: 'none' }}>
                  AuraTask dashboard design
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: opt.id === 'light' ? '#666' : '#999' }}>
                  <Heart size={10} style={{ color: opt.colors.accent }} />
                  <span>Interactive CSS gradients</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
