import React, { useState, useMemo } from 'react';
import { User, Teacher, TeacherView, Role } from '../../types';
import { CollectionIcon, CreditCardIcon, UserCircleIcon, LogoutIcon, MenuIcon, XIcon, HomeIcon, UsersIcon, ChatBubbleOvalLeftEllipsisIcon, SunIcon, MoonIcon, AtomIcon } from '../common/Icons';
import { useAppearance } from '../../App';

interface TeacherLayoutProps {
  user: User;
  teacher: Teacher;
  onLogout: () => void;
  children: React.ReactNode;
  onNavClick: (view: TeacherView) => void;
  activeView: string;
  supervisedTeachers?: Teacher[];
  selectedTeacherId?: string | null;
  onSelectTeacher?: (id: string) => void;
}

const NavButton: React.FC<{ onClick: () => void; label: string; icon: React.FC<{className?: string}>; isActive: boolean; }> = ({ onClick, label, icon: Icon, isActive }) => (
    <button onClick={onClick} className={`w-full text-right flex items-center space-x-4 space-x-reverse group rounded-lg p-3 nav-btn ${isActive ? 'active' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}>
        <Icon className={`w-6 h-6 transition-colors duration-300 nav-icon ${isActive ? '' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`} />
        <span className="text-md">{label}</span>
    </button>
);

const NavContent: React.FC<{ activeView: string; onNavClick: (view: TeacherView) => void; onLogout: () => void; isSupervisor: boolean; teacher: Teacher; user: User; supervisedTeachers?: Teacher[]; selectedTeacherId?: string | null; onSelectTeacher?: (id: string) => void; }> = ({ activeView, onNavClick, onLogout, isSupervisor, teacher, user, supervisedTeachers, selectedTeacherId, onSelectTeacher }) => {
    const { mode, setMode, style, toggleStyle } = useAppearance();

    const navItems = useMemo(() => [
        { id: 'dashboard', label: 'الرئيسية', icon: HomeIcon },
        ...(isSupervisor ? [{ id: 'students', label: 'إدارة الطلاب', icon: UsersIcon }] : []),
        { id: 'studentChats', label: 'رسائل الطلاب', icon: ChatBubbleOvalLeftEllipsisIcon },
        { id: 'content', label: 'المحتوى الدراسي', icon: CollectionIcon },
        { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCardIcon },
        { id: 'profile', label: 'الملف الشخصي', icon: UserCircleIcon },
    ], [isSupervisor]);

    return (
        <div className="flex flex-col flex-1 overflow-y-auto">
             <div className="h-20 flex items-center px-6 flex-shrink-0">
                <div className="flex items-center space-x-3 space-x-reverse">
                    <img src={teacher.imageUrl} alt={teacher.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                        <h1 className="text-lg font-bold text-[var(--text-primary)]">{user.name}</h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {user.role === Role.SUPERVISOR ? `مشرف على: ${teacher.name}` : 'مدرس'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="px-4 py-2 flex items-center justify-center gap-2">
                <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} className="w-12 h-12 p-3 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] theme-toggle-button">
                    <div className="theme-toggle-icons">
                        <SunIcon className="w-5 h-5 sun-icon" />
                        <MoonIcon className="w-5 h-5 moon-icon" />
                    </div>
                </button>
                <button onClick={toggleStyle} className={`w-12 h-12 p-3 rounded-full transition-colors flex items-center justify-center ${style === 'claymorphism' ? 'bg-purple-500/20 text-purple-300' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)]'}`}>
                    <AtomIcon className="w-5 h-5"/>
                </button>
            </div>
            <div className="w-full h-px bg-[var(--border-primary)] my-2 flex-shrink-0"></div>

            {user.role === Role.SUPERVISOR && supervisedTeachers && supervisedTeachers.length > 1 && (
                <div className="p-4 border-b border-[var(--border-primary)]">
                    <label htmlFor="teacher-select" className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">عرض محتوى المدرس:</label>
                    <select
                        id="teacher-select"
                        value={selectedTeacherId || ''}
                        onChange={(e) => onSelectTeacher?.(e.target.value)}
                        className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)]"
                    >
                        {supervisedTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            )}
            <nav className="flex-grow p-4 space-y-1.5">{navItems.map((item) => <NavButton key={item.id} onClick={() => onNavClick(item.id as TeacherView)} label={item.label} icon={item.icon} isActive={activeView === item.id} />)}</nav>
            <div className="p-4 border-t border-[var(--border-primary)]"><button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors duration-200 space-x-4 space-x-reverse"><LogoutIcon className="w-6 h-6" /><span className="text-md font-semibold">تسجيل الخروج</span></button></div>
        </div>
    );
};

const TeacherLayout: React.FC<TeacherLayoutProps> = ({ user, teacher, onLogout, children, onNavClick, activeView, supervisedTeachers, selectedTeacherId, onSelectTeacher }) => {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
    return (
    <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-0 md:p-3">
      <div className="flex w-full h-full md:gap-3">
        {/* Desktop Sidebar */}
        <aside className="w-72 flex-shrink-0 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-2xl flex-col hidden md:flex overflow-hidden">
            <NavContent 
                activeView={activeView} 
                onNavClick={onNavClick} 
                onLogout={onLogout} 
                isSupervisor={user.role === Role.SUPERVISOR} 
                teacher={teacher}
                user={user}
                supervisedTeachers={supervisedTeachers}
                selectedTeacherId={selectedTeacherId}
                onSelectTeacher={onSelectTeacher}
            />
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
            <NavContent 
                activeView={activeView} 
                onNavClick={(v) => { onNavClick(v); setIsMobileNavOpen(false); }} 
                onLogout={() => { onLogout(); setIsMobileNavOpen(false); }} 
                isSupervisor={user.role === Role.SUPERVISOR}
                teacher={teacher}
                user={user}
                supervisedTeachers={supervisedTeachers}
                selectedTeacherId={selectedTeacherId}
                onSelectTeacher={onSelectTeacher}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLayout;