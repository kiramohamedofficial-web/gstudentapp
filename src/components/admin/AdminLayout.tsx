
import React, { useState } from 'react';
import { User } from '../../types';
import { CollectionIcon, KeyIcon, CreditCardIcon, HomeIcon, MenuIcon, XIcon, TemplateIcon, SparklesIcon, CogIcon, LogoutIcon, UsersIcon, UsersSolidIcon, UserCircleIcon } from '../common/Icons';

type AdminView = 'dashboard' | 'students' | 'subscriptions' | 'content' | 'tools' | 'homeManagement' | 'questionGenerator' | 'platformSettings' | 'teacherManagement' | 'accountSettings';

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  onNavClick: (view: AdminView) => void;
  activeView: string;
  pendingQuestionsCount: number;
  pendingSubscriptionsCount: number;
}

const NavButton: React.FC<{
    onClick: () => void;
    label: string;
    icon: React.FC<{className?: string}>;
    isActive: boolean;
    notificationCount?: number;
}> = ({ onClick, label, icon: Icon, isActive, notificationCount }) => (
    <button
        onClick={onClick}
        className={`w-full text-right nav-btn ${isActive ? 'active' : ''}`}
    >
        <Icon className={`w-6 h-6 ml-4 nav-icon transition-colors ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
        <span className="text-md">{label}</span>
         {notificationCount && notificationCount > 0 && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-[var(--bg-secondary-opaque)]">
                {notificationCount > 9 ? '9+' : notificationCount}
            </span>
        )}
    </button>
);


const NavContent: React.FC<{ activeView: string; onNavClick: (view: AdminView) => void; onLogout: () => void; pendingSubscriptionsCount: number; }> = ({ activeView, onNavClick, onLogout, pendingSubscriptionsCount }) => {
    const navItems = [
        { id: 'dashboard', label: 'الرئيسية', icon: HomeIcon },
        { id: 'students', label: 'إدارة الطلاب', icon: UsersIcon },
        { id: 'teacherManagement', label: 'إدارة المعلمين', icon: UsersSolidIcon },
        { id: 'content', label: 'المحتوى', icon: CollectionIcon },
        { id: 'homeManagement', label: 'إدارة الرئيسية', icon: TemplateIcon },
        { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCardIcon, notificationCount: pendingSubscriptionsCount },
        { id: 'questionGenerator', label: 'مولد الأسئلة (AI)', icon: SparklesIcon },
        { id: 'tools', label: 'الأدوات', icon: KeyIcon },
        { id: 'platformSettings', label: 'إعدادات المنصة', icon: CogIcon },
        { id: 'accountSettings', label: 'إعدادات الحساب', icon: UserCircleIcon },
    ];
    
    return (
        <div className="flex flex-col flex-1">
            <nav className="mt-2 flex-grow p-4 space-y-2">
                {navItems.map((item) => (
                    <NavButton
                        key={item.id}
                        onClick={() => onNavClick(item.id as AdminView)}
                        label={item.label}
                        icon={item.icon}
                        isActive={activeView === item.id}
                        notificationCount={item.notificationCount}
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
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ user, onLogout, children, onNavClick, activeView, pendingSubscriptionsCount }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleMobileNavClick = (view: AdminView) => {
    onNavClick(view);
    setIsMobileNavOpen(false);
  };
  
  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside className="w-72 flex-shrink-0 flex-col hidden md:flex glass-effect border-l">
        <div className="h-20 flex items-center justify-center border-b border-[var(--border-primary)] px-4">
           <div className="flex items-center space-x-2 space-x-reverse">
                <CogIcon className="w-8 h-8 text-purple-500" />
                <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    لوحة التحكم
                </h1>
           </div>
        </div>
        <NavContent 
            activeView={activeView} 
            onNavClick={onNavClick} 
            onLogout={onLogout} 
            pendingSubscriptionsCount={pendingSubscriptionsCount}
        />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 border-b glass-effect flex-shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse group cursor-pointer p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
              {user.name.charAt(0)}
            </div>
            <div className="text-right">
              <span className="font-semibold text-md text-[var(--text-primary)]">{user.name}</span>
              <span className="block text-sm text-[var(--text-secondary)]">المدير</span>
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
          <div className="fixed inset-y-0 right-0 w-72 flex flex-col animate-slide-in-right glass-effect border-l">
            <div className="h-20 flex items-center justify-between px-6 border-b border-[var(--border-primary)] flex-shrink-0">
              <h1 className="text-xl font-bold" style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  لوحة التحكم
              </h1>
              <button onClick={() => setIsMobileNavOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <XIcon className="w-6 h-6" />
              </button>
            </div>
            <NavContent 
                activeView={activeView} 
                onNavClick={handleMobileNavClick} 
                onLogout={onLogout}
                pendingSubscriptionsCount={pendingSubscriptionsCount}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
