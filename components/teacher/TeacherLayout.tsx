import React, { useState } from 'react';
import { User, Teacher, TeacherView } from '../../types';
import { CollectionIcon, CreditCardIcon, UserCircleIcon, LogoutIcon, MenuIcon, XIcon, HomeIcon, QuestionMarkCircleIcon } from '../common/Icons';

interface TeacherLayoutProps {
  user: User;
  teacher: Teacher;
  onLogout: () => void;
  children: React.ReactNode;
  onNavClick: (view: TeacherView) => void;
  activeView: string;
}

const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: HomeIcon },
    { id: 'content', label: 'المحتوى الدراسي', icon: CollectionIcon },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCardIcon },
    { id: 'questionBank', label: 'بنك الأسئلة', icon: QuestionMarkCircleIcon },
    { id: 'profile', label: 'الملف الشخصي', icon: UserCircleIcon },
];

const NavButton: React.FC<{ onClick: () => void; label: string; icon: React.FC<{className?: string}>; isActive: boolean; }> = ({ onClick, label, icon: Icon, isActive }) => (
    <button onClick={onClick} className={`w-full text-right flex items-center space-x-4 space-x-reverse group rounded-lg p-3 nav-btn ${isActive ? 'active' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}>
        <Icon className={`w-6 h-6 transition-colors duration-300 nav-icon ${isActive ? '' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`} />
        <span className="text-md">{label}</span>
    </button>
);

const NavContent: React.FC<{ activeView: string; onNavClick: (view: TeacherView) => void; onLogout: () => void; }> = ({ activeView, onNavClick, onLogout }) => (
    <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="mt-2 flex-grow p-4 space-y-1.5">{navItems.map((item) => <NavButton key={item.id} onClick={() => onNavClick(item.id as TeacherView)} label={item.label} icon={item.icon} isActive={activeView === item.id} />)}</nav>
        <div className="p-4 border-t border-[var(--border-primary)]"><button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors duration-200 space-x-4 space-x-reverse"><LogoutIcon className="w-6 h-6" /><span className="text-md font-semibold">تسجيل الخروج</span></button></div>
    </div>
);

const TeacherLayout: React.FC<TeacherLayoutProps> = ({ user, teacher, onLogout, children, onNavClick, activeView }) => {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
    return (
    <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-2 md:p-3">
      <div className="flex w-full h-full gap-3">
        {/* Desktop Sidebar */}
        <aside className="w-72 flex-shrink-0 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-2xl flex-col hidden md:flex overflow-hidden">
            <div className="h-20 flex items-center px-6 flex-shrink-0">
                <div className="flex items-center space-x-3 space-x-reverse">
                    <img src={teacher.imageUrl} alt={teacher.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                        <h1 className="text-lg font-bold text-[var(--text-primary)]">{teacher.name}</h1>
                        <p className="text-sm text-[var(--text-secondary)]">مدرس</p>
                    </div>
                </div>
            </div>
            <div className="w-full h-px bg-[var(--border-primary)] flex-shrink-0"></div>
            <NavContent activeView={activeView} onNavClick={onNavClick} onLogout={onLogout} />
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl">
          {/* Header */}
          <header className="flex-shrink-0 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] flex items-center justify-between px-4 md:px-6 h-20 rounded-t-2xl border-b border-[var(--glass-border)]">
              <div className="flex items-center space-x-4 space-x-reverse">
                  <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden"><MenuIcon className="w-6 h-6" /></button>
                  <h1 className="hidden md:block text-xl font-bold text-[var(--text-primary)]">أهلاً بك، {user.name.split(' ')[0]}</h1>
              </div>
              <button onClick={() => onNavClick('profile')} className="h-11 w-11 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] border-2 border-transparent flex items-center justify-center text-[var(--text-primary)] font-bold text-lg transition-all hover:border-[var(--accent-primary)]">{user.name.charAt(0)}</button>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--bg-secondary)] rounded-b-2xl"><div key={activeView} className="fade-in">{children}</div></main>
        </div>
      </div>
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileNavOpen(false)}></div>
          <div className="fixed inset-y-2 right-2 w-72 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] flex flex-col animate-slide-in-right rounded-2xl overflow-hidden">
            <div className="h-20 flex items-center justify-between px-6 flex-shrink-0">
               <span className="text-lg font-bold">{teacher.name}</span>
              <button onClick={() => setIsMobileNavOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><XIcon className="w-6 h-6" /></button>
            </div>
            <NavContent activeView={activeView} onNavClick={(v) => { onNavClick(v); setIsMobileNavOpen(false); }} onLogout={() => { onLogout(); setIsMobileNavOpen(false); }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLayout;