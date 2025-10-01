
import React from 'react';
import { User, Theme } from '../../types';
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
           <div>
            <div className="flex items-center space-x-3 space-x-reverse group">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg transition-transform duration-300 group-hover:scale-110">
                {user.name.charAt(0)}
              </div>
               <div className="text-right">
                <span className="font-semibold text-sm md:text-md text-[var(--text-primary)]">{user.name}</span>
                <span className="block text-xs text-[var(--text-secondary)]">طالب</span>
              </div>
            </div>
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
