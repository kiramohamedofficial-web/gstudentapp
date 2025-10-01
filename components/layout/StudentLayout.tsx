
import React, { useState } from 'react';
import { User, Theme } from '../../types';
import { THEMES } from '../../constants';
import { BookOpenIcon, HomeIcon, UserCircleIcon, CreditCardIcon } from '../common/Icons';

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

const StudentBottomNav: React.FC<{ activeView: string; onNavClick: (view: StudentView) => void }> = ({ activeView, onNavClick }) => {
    const navItems = [
        { id: 'home', label: 'الرئيسية', icon: HomeIcon },
        { id: 'curriculum', label: 'المنهج', icon: BookOpenIcon },
        { id: 'subscription', label: 'الاشتراك', icon: CreditCardIcon },
        { id: 'profile', label: 'الإعدادات', icon: UserCircleIcon },
    ];
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] flex justify-around items-center z-30">
            {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onNavClick(item.id as StudentView)}
                        className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        <Icon className="w-7 h-7 mb-1" />
                        <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                )
            })}
        </nav>
    );
};


const StudentLayout: React.FC<StudentLayoutProps> = ({ user, onLogout, theme, setTheme, children, onNavClick, activeView }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: HomeIcon },
    { id: 'curriculum', label: 'المنهج', icon: BookOpenIcon },
    { id: 'subscription', label: 'الاشتراك', icon: CreditCardIcon },
    { id: 'profile', label: 'الإعدادات', icon: UserCircleIcon },
  ];

  return (
    <div className="flex h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-[var(--bg-primary)] flex items-center justify-between px-4 md:px-8 border-b border-[var(--border-primary)]">
           <div className="relative">
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-3 space-x-reverse group">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg transition-transform duration-300 group-hover:scale-110">
                {user.name.charAt(0)}
              </div>
               <div className="text-right">
                <span className="font-semibold text-sm md:text-md text-[var(--text-primary)]">{user.name}</span>
                <span className="block text-xs text-[var(--text-secondary)]">طالب</span>
              </div>
            </button>
            {isProfileOpen && (
              <div className="absolute left-0 mt-3 w-56 bg-[var(--bg-secondary)] rounded-lg shadow-2xl py-2 border border-[var(--border-primary)] z-20 fade-in">
                <div className="px-4 py-2 text-sm text-[var(--text-primary)] font-semibold border-b border-[var(--border-primary)] mb-2">{user.name}</div>
                <div className="px-4 py-2 text-xs text-[var(--text-secondary)]">تغيير السمة</div>
                <div className="flex justify-around px-4 py-2">
                    {THEMES.map(t => (
                        <button key={t.id} onClick={() => setTheme(t.id)} title={t.name} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${theme === t.id ? 'ring-2 ring-[var(--accent-primary)]' : ''} theme-${t.id}-bg`}>
                          {/* Special backgrounds for themes */}
                          {t.id === 'dark' && <div className="w-full h-full rounded-full bg-gray-800"></div>}
                          {t.id === 'light' && <div className="w-full h-full rounded-full bg-gray-100"></div>}
                          {t.id === 'gold' && <div className="w-full h-full rounded-full bg-yellow-100"></div>}
                          {t.id === 'pink' && <div className="w-full h-full rounded-full bg-pink-100"></div>}
                        </button>
                    ))}
                </div>
                <div className="border-t border-[var(--border-primary)] my-2"></div>
                <button
                  onClick={onLogout}
                  className="w-full text-right block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
          <div className="md:hidden text-xl font-black" style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
             بوابة الطالب
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div key={activeView} className="fade-in">
            {children}
          </div>
        </main>
      </div>
      
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-[var(--bg-primary)] border-l border-[var(--border-primary)] flex-col hidden md:flex">
        <div className="h-20 flex items-center justify-center border-b border-[var(--border-primary)]">
          <h1 className="text-3xl font-black" style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            بوابة الطالب
          </h1>
        </div>
        <nav className="mt-8 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavClick(item.id as StudentView)}
                className={`w-full text-right pr-8 py-4 mb-2 flex items-center transition-all duration-300 relative group
                  ${activeView === item.id 
                    ? 'text-[var(--accent-primary)] font-bold' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                <span className={`absolute right-0 top-0 bottom-0 w-1 bg-[var(--accent-primary)] transition-transform duration-300 rounded-l-full ${activeView === item.id ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'}`}></span>
                <Icon className="w-5 h-5 ml-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="p-6 text-xs text-center text-[var(--text-secondary)]">
          &copy; {new Date().getFullYear()} Dr. Ahmed Saber. All rights reserved.
        </div>
      </aside>
       <StudentBottomNav activeView={activeView} onNavClick={onNavClick} />
    </div>
  );
};

export default StudentLayout;
