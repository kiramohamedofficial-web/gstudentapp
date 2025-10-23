import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { CollectionIcon, QrcodeIcon, CreditCardIcon, HomeIcon, XIcon, TemplateIcon, CogIcon, LogoutIcon, UsersIcon, UserCircleIcon, BellIcon, QuestionMarkCircleIcon } from '../common/Icons';
import { getPendingSubscriptionRequestCount } from '../../services/storageService';

type AdminView = 'dashboard' | 'students' | 'subscriptions' | 'content' | 'tools' | 'homeManagement' | 'questionBank' | 'platformSettings' | 'accountSettings' | 'teachers';

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  onNavClick: (view: AdminView) => void;
  activeView: string;
}

const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: HomeIcon },
    { id: 'students', label: 'إدارة الطلاب', icon: UsersIcon },
    { id: 'teachers', label: 'إدارة المدرسين', icon: UserCircleIcon },
    { id: 'content', label: 'المحتوى', icon: CollectionIcon },
    { id: 'homeManagement', label: 'إدارة الرئيسية', icon: TemplateIcon },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCardIcon },
    { id: 'tools', label: 'أكواد الاشتراكات', icon: QrcodeIcon },
    { id: 'questionBank', label: 'بنك الأسئلة', icon: QuestionMarkCircleIcon },
    { id: 'platformSettings', label: 'إعدادات المنصة', icon: CogIcon },
    { id: 'accountSettings', label: 'إعدادات الحساب', icon: UserCircleIcon },
];

const NavButton: React.FC<{
    onClick: () => void;
    label: string;
    icon: React.FC<{className?: string}>;
    isActive: boolean;
}> = ({ onClick, label, icon: Icon, isActive }) => (
    <button
        onClick={onClick}
        className={`w-full text-right flex items-center space-x-4 space-x-reverse group rounded-lg p-3 nav-btn admin
        ${isActive
            ? 'active'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
    >
        <Icon className={`w-6 h-6 transition-colors duration-300 nav-icon ${isActive ? '' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`} />
        <span className="text-md">{label}</span>
    </button>
);

const PendingRequestsCard: React.FC<{ count: number; onNavClick: () => void; }> = ({ count, onNavClick }) => {
    if (count === 0) {
        return null;
    }

    return (
        <div className="px-4 pb-4">
            <button
                onClick={onNavClick}
                className="w-full bg-pink-500/10 p-4 rounded-xl border border-transparent hover:border-pink-500/50 transition-all duration-300 text-right space-y-2"
            >
                <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2 bg-pink-500/80 rounded-full relative">
                        <BellIcon className="w-5 h-5 text-white" />
                         <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{count}</span>
                    </div>
                    <span className="font-bold text-lg text-white">طلبات جديدة</span>
                </div>
                <p className="text-md font-bold text-pink-400">
                    لديك {count} طلبات اشتراك للمراجعة.
                </p>
            </button>
        </div>
    );
};


const NavContent: React.FC<{ activeView: string; onNavClick: (view: AdminView) => void; onLogout: () => void; pendingRequestsCount: number }> = ({ activeView, onNavClick, onLogout, pendingRequestsCount }) => (
    <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="mt-2 flex-grow p-4 space-y-1.5">
            {navItems.map((item) => (
                <NavButton
                    key={item.id}
                    onClick={() => onNavClick(item.id as AdminView)}
                    label={item.label}
                    icon={item.icon}
                    isActive={activeView === item.id}
                />
            ))}
        </nav>

        <PendingRequestsCard count={pendingRequestsCount} onNavClick={() => onNavClick('subscriptions')} />

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

const AdminLayout: React.FC<AdminLayoutProps> = ({ user, onLogout, children, onNavClick, activeView }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pendingRequestsCount = useMemo(() => getPendingSubscriptionRequestCount(), [children]);


  const handleMobileNavClick = (view: AdminView) => {
    onNavClick(view);
    setIsMobileNavOpen(false);
  };
  
  return (
    <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-2 md:p-3">
      <div className="flex w-full h-full gap-3">
        {/* Desktop Sidebar */}
        <aside className="w-72 flex-shrink-0 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-2xl flex-col hidden md:flex overflow-hidden">
          <div className="h-20 flex items-center justify-center px-4 flex-shrink-0">
            <div className="flex items-center space-x-2 space-x-reverse">
                  <CogIcon className="w-8 h-8 text-purple-500" />
                  <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      لوحة التحكم
                  </h1>
            </div>
          </div>
          <div className="w-full h-px bg-[var(--border-primary)] flex-shrink-0"></div>
          <NavContent activeView={activeView} onNavClick={onNavClick} onLogout={onLogout} pendingRequestsCount={pendingRequestsCount}/>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl">
          {/* Header */}
          <header className="h-20 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-b border-[var(--border-primary)] flex items-center justify-between px-4 md:px-6 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center space-x-3 space-x-reverse group">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                {user.name.charAt(0)}
              </div>
              <div className="text-right">
                <span className="font-semibold text-md text-[var(--text-primary)]">{user.name}</span>
                <span className="block text-sm text-[var(--text-secondary)]">المدير</span>
              </div>
            </div>
            <div className="md:hidden">
              <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <img src="https://b.top4top.io/p_3583gmh281.png" alt="Menu" className="w-6 h-6" />
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--bg-secondary)] rounded-b-2xl">
              <div key={activeView} className="fade-in">
                  {children}
              </div>
          </main>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 animate-fade-in backdrop-blur-sm" onClick={() => setIsMobileNavOpen(false)}></div>
          <div className="fixed inset-y-2 right-2 w-72 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] flex flex-col animate-slide-in-right rounded-2xl overflow-hidden">
            <div className="h-20 flex items-center justify-between px-6 flex-shrink-0">
              <h1 className="text-xl font-bold" style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  لوحة التحكم
              </h1>
              <button onClick={() => setIsMobileNavOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <XIcon className="w-6 h-6" />
              </button>
            </div>
            <NavContent activeView={activeView} onNavClick={handleMobileNavClick} onLogout={onLogout} pendingRequestsCount={pendingRequestsCount} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;