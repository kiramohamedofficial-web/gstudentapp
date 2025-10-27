import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User } from '../../types';
import { CollectionIcon, QrcodeIcon, CreditCardIcon, HomeIcon, XIcon, TemplateIcon, CogIcon, LogoutIcon, UsersIcon, UserCircleIcon, BellIcon, QuestionMarkCircleIcon, UserCheckIcon, CurrencyDollarIcon, BookOpenIcon } from '../common/Icons';
import { getPendingSubscriptionRequestCount } from '../../services/storageService';

type AdminView = 'dashboard' | 'students' | 'subscriptions' | 'courseManagement' | 'tools' | 'homeManagement' | 'questionBank' | 'platformSettings' | 'systemHealth' | 'accountSettings' | 'teachers' | 'subscriptionPrices';

const SystemHealthIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://g.top4top.io/p_3584g68tl0.png" alt="System Health" className={className} />
);

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  onNavClick: (view: AdminView) => void;
  activeView: string;
}

const mainNavItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: HomeIcon },
    { id: 'students', label: 'إدارة الطلاب', icon: UsersIcon },
    { id: 'teachers', label: 'إدارة المدرسين', icon: UserCircleIcon },
    { id: 'courseManagement', label: 'إدارة الكورسات', icon: BookOpenIcon },
    { id: 'homeManagement', label: 'إدارة الرئيسية', icon: TemplateIcon },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCardIcon },
    { id: 'subscriptionPrices', label: 'أسعار الاشتراكات', icon: CurrencyDollarIcon },
    { id: 'tools', label: 'أكواد الاشتراكات', icon: QrcodeIcon },
    { id: 'questionBank', label: 'بنك الأسئلة', icon: QuestionMarkCircleIcon },
];

const settingsNavItems = [
    { id: 'platformSettings', label: 'إعدادات المنصة', icon: CogIcon },
    { id: 'systemHealth', label: 'فحص الأعطال', icon: SystemHealthIcon },
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


const NavContent: React.FC<{ activeView: string; onNavClick: (view: AdminView) => void; pendingRequestsCount: number }> = ({ activeView, onNavClick, pendingRequestsCount }) => (
    <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="mt-2 flex-grow p-4">
             <p className="px-3 mb-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">الإدارة الرئيسية</p>
             <div className="space-y-1.5">
                {mainNavItems.map((item) => (
                    <NavButton key={item.id} onClick={() => onNavClick(item.id as AdminView)} label={item.label} icon={item.icon} isActive={activeView === item.id}/>
                ))}
            </div>

            <div className="pt-4 mt-4 border-t border-[var(--border-primary)]">
                <p className="px-3 mb-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">الإعدادات والصيانة</p>
                <div className="space-y-1.5">
                    {settingsNavItems.map((item) => (
                        <NavButton key={item.id} onClick={() => onNavClick(item.id as AdminView)} label={item.label} icon={item.icon} isActive={activeView === item.id}/>
                    ))}
                </div>
            </div>
        </nav>

        <PendingRequestsCard count={pendingRequestsCount} onNavClick={() => onNavClick('subscriptions')} />
    </div>
);

const AdminLayout: React.FC<AdminLayoutProps> = ({ user, onLogout, children, onNavClick, activeView }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const fetchPendingCount = async () => {
          const count = await getPendingSubscriptionRequestCount();
          setPendingRequestsCount(count);
      };
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 60000); // every minute
      return () => clearInterval(interval);
  }, [children]);

   useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

  const handleMobileNavClick = (view: AdminView) => {
    onNavClick(view);
    setIsMobileNavOpen(false);
  };
  
  return (
    <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-0 md:p-3">
      <div className="flex w-full h-full md:gap-3">
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
          <NavContent activeView={activeView} onNavClick={onNavClick} pendingRequestsCount={pendingRequestsCount}/>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden md:rounded-2xl">
          {/* Header */}
          <header className="app-header">
                <div className="header-logo" style={{ cursor: 'pointer' }} onClick={() => onNavClick('dashboard')}>
                    <div className="header-logo-icon" style={{background: 'linear-gradient(135deg, #a855f7, #ec4899)'}}>
                        <i className="fa-solid fa-gear text-white"></i>
                    </div>
                    <span className="hidden md:inline">لوحة التحكم</span>
                </div>

                <div className="header-actions">
                    <button onClick={() => onNavClick('subscriptions')} className="notification-btn">
                        <i className="fas fa-bell"></i>
                        {pendingRequestsCount > 0 && <span className="badge">{pendingRequestsCount}</span>}
                    </button>
                    <div className="relative">
                        <div onClick={() => setIsProfileMenuOpen(p => !p)} className="user-avatar" style={{background: 'linear-gradient(135deg, #a855f7, #ec4899)'}}>
                            {user.name.charAt(0)}
                        </div>
                        {isProfileMenuOpen && (
                            <div ref={profileMenuRef} className="absolute top-full mt-3 left-0 w-64 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-2xl shadow-lg z-50 fade-in-up overflow-hidden">
                                <div className="p-4 border-b border-[var(--border-primary)]">
                                    <p className="font-bold text-md text-[var(--text-primary)] truncate">{user.name}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">مدير النظام</p>
                                </div>
                                <div className="p-2 space-y-1">
                                    <button onClick={() => { onNavClick('accountSettings'); setIsProfileMenuOpen(false); }} className="w-full flex items-center p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 space-x-3 space-x-reverse text-right"><CogIcon className="w-5 h-5 text-[var(--text-secondary)]" /><span>إعدادات الحساب</span></button>
                                </div>
                                <div className="h-px bg-[var(--border-primary)] mx-2"></div>
                                <div className="p-2"><button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors duration-200 space-x-3 space-x-reverse text-right"><LogoutIcon className="w-5 h-5" /><span>تسجيل الخروج</span></button></div>
                            </div>
                        )}
                    </div>
                    <div className="menu-toggle md:hidden" onClick={() => setIsMobileNavOpen(true)}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--bg-secondary)] md:rounded-b-2xl">
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
            <NavContent activeView={activeView} onNavClick={handleMobileNavClick} pendingRequestsCount={pendingRequestsCount} />
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
        </div>
      )}
    </div>
  );
};

export default AdminLayout;