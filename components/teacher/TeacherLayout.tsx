import React, { useState } from 'react';
import { User, Teacher, TeacherView } from '../../types';
import { CollectionIcon, CreditCardIcon, UserCircleIcon, LogoutIcon, MenuIcon, XIcon, HomeIcon } from '../common/Icons';

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
    <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-0 md:p-3">
      <div className="flex w-full h-full md:gap-3">
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

        <div className="flex-1 flex flex-col overflow-hidden md:rounded-2xl">
          {/* Header */}
          <header className="app-header">
                <div className="header-logo" style={{ cursor: 'pointer' }} onClick={() => onNavClick('dashboard')}>
                    <div className="header-logo-icon"></div>
                </div>

                <div className="header-actions">
                    <button className="notification-btn">
                        <i className="fas fa-bell"></i>
                    </button>
                    <div onClick={() => onNavClick('profile')} className="user-avatar">
                        {user.name.charAt(0)}
                    </div>
                    <div className="menu-toggle md:hidden" onClick={() => setIsMobileNavOpen(true)}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--bg-secondary)] md:rounded-b-2xl"><div key={activeView} className="fade-in">{children}</div></main>
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