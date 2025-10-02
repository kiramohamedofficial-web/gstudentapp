
import React, { useState } from 'react';
import { User, Theme } from '../../types';
import { BookOpenIcon, HomeIcon, UserCircleIcon, CreditCardIcon, MenuIcon, XIcon } from '../common/Icons';

type StudentView = 'home' | 'curriculum' | 'subscription' | 'profile';

interface StudentLayoutProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  children: React.ReactNode;
  onNavClick: (view: StudentView) => void;
  activeView: string;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ user, onLogout, theme, setTheme, children, onNavClick, activeView }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: HomeIcon },
    { id: 'curriculum', label: 'المنهج', icon: BookOpenIcon },
    { id: 'subscription', label: 'الاشتراك', icon: CreditCardIcon },
    { id: 'profile', label: 'الإعدادات', icon: UserCircleIcon },
  ];

  const handleMobileNavClick = (view: StudentView) => {
    onNavClick(view);
    setIsMobileNavOpen(false);
  };

  const NavContent = () => (
    <nav className="mt-8 flex-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleMobileNavClick(item.id as StudentView)}
            className={`w-full text-right pr-8 py-4 mb-2 flex items-center transition-all duration-300 relative group rounded-r-lg
              ${isActive
                ? 'bg-gradient-to-l from-[var(--bg-secondary)] text-[var(--accent-primary)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50'}`}
          >
            <span className={`absolute right-0 top-0 bottom-0 w-1 bg-[var(--accent-primary)] transition-all duration-300 ${isActive ? 'h-full' : 'h-0 group-hover:h-1/2'}`}></span>
            <Icon className="w-5 h-5 ml-4" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[var(--bg-primary)] flex items-center justify-between px-4 md:px-8 border-b border-[var(--border-primary)] flex-shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse group">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg transition-transform duration-300 group-hover:scale-110">
              {user.name.charAt(0)}
            </div>
            <div className="text-right">
              <span className="font-semibold text-sm md:text-md text-[var(--text-primary)]">{user.name}</span>
              <span className="block text-xs text-[var(--text-secondary)]">طالب</span>
            </div>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div key={activeView} className="fade-in">
            {children}
          </div>
        </main>
      </div>
      
      {/* Desktop Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-[var(--bg-primary)] border-l border-[var(--border-primary)] flex-col hidden md:flex">
        <div className="h-16 flex items-center justify-center border-b border-[var(--border-primary)]">
          <h1 className="text-2xl font-black" style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            بوابة الطالب
          </h1>
        </div>
        <NavContent />
        <div className="p-6 text-xs text-center text-[var(--text-secondary)]">
          &copy; {new Date().getFullYear()} سنتر جوجل التعليمي. All rights reserved.
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileNavOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 w-72 bg-[var(--bg-primary)] border-l border-[var(--border-primary)] flex flex-col animate-slide-in-right">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-primary)] flex-shrink-0">
              <h1 className="text-xl font-black" style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                بوابة الطالب
              </h1>
              <button onClick={() => setIsMobileNavOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <NavContent />
             <div className="p-6 text-xs text-center text-[var(--text-secondary)]">
                &copy; {new Date().getFullYear()} سنتر جوجل التعليمي. All rights reserved.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLayout;