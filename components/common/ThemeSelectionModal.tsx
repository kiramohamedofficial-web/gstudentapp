import React from 'react';
import { THEMES } from '../../constants';
import { Theme } from '../../types';
import { CheckCircleIcon, XIcon } from './Icons';

interface ThemeCardProps {
  theme: typeof THEMES[0];
  isActive: boolean;
  onClick: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isActive, onClick }) => {
  const Icon = theme.icon;
  return (
    <button
      onClick={onClick}
      className="relative w-full aspect-square rounded-xl flex flex-col items-center justify-center text-white transition-all duration-300 transform group focus:outline-none"
    >
      <div className={`absolute inset-0 rounded-xl transition-all duration-300 border-4 ${isActive ? 'border-blue-500 scale-105' : 'border-transparent group-hover:scale-105'}`} style={{ background: theme.colors.gradient || theme.colors.bg }}></div>
      {isActive && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white/50 shadow-lg">
          <CheckCircleIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div className="relative z-10 flex flex-col items-center p-2 bg-black/20 rounded-lg backdrop-blur-sm">
        <Icon className="w-8 h-8 md:w-10 md:h-10 mb-2" />
        <span className="font-bold text-sm md:text-base">{theme.name}</span>
      </div>
    </button>
  );
};

interface ThemeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeSelectionModal: React.FC<ThemeSelectionModalProps> = ({ isOpen, onClose, currentTheme, setTheme }) => {
  if (!isOpen) return null;

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId as Theme);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl p-4 md:p-6 mx-4 rounded-2xl shadow-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-[var(--border-primary)]">
          <h3 className="text-xl font-bold">اختر الثيم المفضل</h3>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
          {THEMES.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={currentTheme === theme.id}
              onClick={() => handleThemeSelect(theme.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelectionModal;