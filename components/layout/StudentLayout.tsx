import React, { useState } from 'react';
import { User, StudentView } from '../../types';
import { BookOpenIcon, HomeIcon, UserCircleIcon, CreditCardIcon, MenuIcon, XIcon, QuestionMarkCircleIcon, ChartBarIcon, LogoutIcon, AtomIcon } from '../common/Icons';

interface StudentLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  onNavClick: (view: StudentView) => void;
  activeView: string;
}

const navItems = [
    { id: 'home', label: 'الرئيسية', icon: HomeIcon },
    { id: 'grades', label: 'المنهج الدراسي', icon: BookOpenIcon },
    { id: 'results', label: 'الواجبات والنتائج', icon: ChartBarIcon },
    { id: 'ask', label: 'اسأل البروف', icon: QuestionMarkCircleIcon },
    { id: 'subscription', label: 'الاشتراك', icon: CreditCardIcon },
    { id: 'profile', label: 'الإعدادات', icon: UserCircleIcon },
];

const NavButton: React.FC<{
    onClick: () => void;
    label: string;
    icon: React.FC<{className?: string}>;
    isActive: boolean;
}> = ({ onClick, label, icon: Icon, isActive }) => (
    <button
        onClick={onClick}
        className={`relative w-full text-right flex items-center space-x-4 space-x-reverse transition-all duration-300 group rounded-lg p-3 nav-btn
        ${isActive
            ? 'active'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
    >
        <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'text-[var(--accent-primary)]' : 'group-hover:scale-110 text-gray-500'}`} />
        <span className="text-md">{label}</span>
    </button>
);


const NavContent: React.FC<{ activeView: string; onNavClick: (view: StudentView) => void; onLogout: () => void; }> = ({ activeView, onNavClick, onLogout }) => (
    <div className="flex flex-col flex-1">
        <nav className="mt-2 flex-grow p-4 space-y-2">
            {navItems.map((item) => (
                <NavButton
                    key={item.id}
                    onClick={() => onNavClick(item.id as StudentView)}
                    label={item.label}
                    icon={item.icon}
                    isActive={activeView === item.id}
                />
            ))}
        </nav>
        <div className="p-4 border-t border-[var(--border-primary)]">
            <button
                onClick={onLogout}
                className="w-full flex items-center p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors duration-200 space-x-4 space-x-reverse"
            >
                <LogoutIcon className="w-6 h-6" />
                <span className="text-md font-semibold">تسجيل الخروج</span>
            </button>
        </div>
    </div>
);

const StudentLayout: React.FC<StudentLayoutProps> = ({ user, onLogout, children, onNavClick, activeView }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleMobileNavClick = (view: StudentView) => {
    onNavClick(view);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] flex-col hidden md:flex">
        <div className="h-20 flex items-center justify-center border-b border-[var(--border-primary)] px-4">
           <div className="flex items-center space-x-2 space-x-reverse">
                <AtomIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500">
                    بوابة الطالب
                </h1>
            </div>
        </div>
        <NavContent activeView={activeView} onNavClick={onNavClick} onLogout={onLogout} />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-[var(--bg-secondary)] flex items-center justify-between px-4 md:px-8 border-b border-[var(--border-primary)] flex-shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse group">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">
              {user.name.charAt(0)}
            </div>
            <div className="text-right">
              <span className="font-semibold text-md text-[var(--text-primary)]">{user.name}</span>
              <span className="block text-sm text-[var(--text-secondary)]">طالب</span>
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
      
      {/* Mobile Sidebar */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileNavOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 w-72 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] flex flex-col animate-slide-in-right">
            <div className="h-20 flex items-center justify-between px-6 border-b border-[var(--border-primary)] flex-shrink-0">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500">
                بوابة الطالب
              </h1>
              <button onClick={() => setIsMobileNavOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <NavContent activeView={activeView} onNavClick={handleMobileNavClick} onLogout={onLogout} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLayout;