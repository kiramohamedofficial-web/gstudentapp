import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User } from '../../types';
import { QrcodeIcon, CreditCardIcon, HomeIcon, XIcon, TemplateIcon, CogIcon, LogoutIcon, BellIcon, QuestionMarkCircleIcon, CurrencyDollarIcon, BookOpenIcon, HardDriveIcon, ChartBarIcon, UsersSolidIcon, ReelsIcon, SunIcon, MoonIcon, SparklesIcon } from '../common/Icons';
import { getPendingSubscriptionRequestCount, supabase } from '../../services/storageService';
import { useAppearance } from '../../App';
import { useIcons } from '../../IconContext';

type AdminView = 'dashboard' | 'students' | 'subscriptions' | 'courseManagement' | 'tools' | 'homeManagement' | 'questionBank' | 'platformSettings' | 'systemHealth' | 'accountSettings' | 'teachers' | 'subscriptionPrices' | 'deviceManagement' | 'content' | 'accountCreationDiagnostics' | 'teacherCreationDiagnostics' | 'financials' | 'cartoonMoviesManagement' | 'supervisors' | 'reelsManagement' | 'iconSettings';

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  onNavClick: (view: AdminView) => void;
  activeView: string;
}

const NavButton: React.FC<{
    onClick: () => void;
    label: string;
    iconUrl: string;
    fallbackIcon: React.FC<{className?: string}>;
    isActive: boolean;
}> = ({ onClick, label, iconUrl, fallbackIcon: FallbackIcon, isActive }) => {
    const { style } = useAppearance();
    const isCly = style.startsWith('.clymorphism');

    return (
        <button
            onClick={onClick}
            className={`w-full text-right flex items-center space-x-4 space-x-reverse group p-3 nav-btn admin ${isCly ? `clay-element rounded-lg ${isActive ? 'clay-inset' : 'clay-outset'}` : `rounded-lg ${isActive ? 'active' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}`}
        >
            {iconUrl ? (
                <img src={iconUrl} alt={label} className="w-6 h-6 nav-icon" />
            ) : (
                <FallbackIcon className={`w-6 h-6 transition-colors duration-300 nav-icon ${isActive ? (isCly ? '' : 'text-purple-500') : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`} />
            )}
            <span className="text-md">{label}</span>
        </button>
    );
};

const PendingRequestsCard: React.FC<{ count: number; onNavClick: () => void; }> = ({ count, onNavClick }) => {
    if (count === 0) {
        return null;
    }
    const { style } = useAppearance();
    const isCly = style.startsWith('.clymorphism');

    return (
        <div className={`px-4 pb-4 ${isCly ? 'clay-element clay-outset' : ''}`}>
            <button
                onClick={onNavClick}
                className={`w-full p-4 rounded-xl border border-transparent transition-all duration-300 text-right space-y-2 ${isCly ? 'bg-transparent' : 'bg-pink-500/10 hover:border-pink-500/50'}`}
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


const NavContent: React.FC<{ activeView: string; onNavClick: (view: AdminView) => void; pendingRequestsCount: number }> = ({ activeView, onNavClick, pendingRequestsCount }) => {
    const icons = useIcons();

    const mainNavItems = [
        { id: 'dashboard', label: 'الرئيسية', iconUrl: '', fallback: HomeIcon },
        { id: 'students', label: 'إدارة الطلاب', iconUrl: icons.adminNavStudentIconUrl, fallback: UsersSolidIcon },
        { id: 'teachers', label: 'إدارة المدرسين', iconUrl: icons.adminNavTeacherIconUrl, fallback: UsersSolidIcon },
        { id: 'supervisors', label: 'إدارة المشرفين', iconUrl: '', fallback: UsersSolidIcon },
        { id: 'content', label: 'إدارة المنهج الدراسي', iconUrl: icons.adminNavContentIconUrl, fallback: BookOpenIcon },
        { id: 'courseManagement', label: 'إدارة الكورسات', iconUrl: '', fallback: BookOpenIcon },
        { id: 'homeManagement', label: 'إدارة الرئيسية', iconUrl: '', fallback: TemplateIcon },
        { id: 'cartoonMoviesManagement', label: 'أفلام الكرتون', iconUrl: icons.adminNavCartoonIconUrl, fallback: TemplateIcon },
        { id: 'reelsManagement', label: 'إدارة الريلز', iconUrl: '', fallback: ReelsIcon },
        { id: 'subscriptions', label: 'الاشتراكات', iconUrl: '', fallback: CreditCardIcon },
        { id: 'financials', label: 'التقارير المالية', iconUrl: '', fallback: ChartBarIcon },
        { id: 'subscriptionPrices', label: 'أسعار الاشتراكات', iconUrl: '', fallback: CurrencyDollarIcon },
        { id: 'tools', label: 'أكواد الاشتراكات', iconUrl: '', fallback: QrcodeIcon },
        { id: 'questionBank', label: 'بنك الأسئلة', iconUrl: '', fallback: QuestionMarkCircleIcon },
    ];

    const settingsNavItems = [
        { id: 'platformSettings', label: 'إعدادات المنصة', iconUrl: '', fallback: CogIcon },
        { id: 'iconSettings', label: 'إدارة الأيقونات', iconUrl: '', fallback: SparklesIcon },
        { id: 'deviceManagement', label: 'إدارة الأجهزة', iconUrl: '', fallback: HardDriveIcon },
        { id: 'systemHealth', label: 'فحص الأعطال', iconUrl: icons.adminNavHealthIconUrl, fallback: HardDriveIcon },
    ];

    return (
    <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="w-full h-px bg-[var(--border-primary)] mb-2 flex-shrink-0"></div>
        <nav className="flex-grow p-4 space-y-2">
             <p className="px-3 mb-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">الإدارة الرئيسية</p>
             <div className="space-y-2">
                {mainNavItems.map((item) => (
                    <NavButton key={item.id} onClick={() => onNavClick(item.id as AdminView)} label={item.label} iconUrl={item.iconUrl} fallbackIcon={item.fallback} isActive={activeView === item.id}/>
                ))}
            </div>

            <div className="pt-4 mt-4 border-t border-[var(--border-primary)]">
                <p className="px-3 mb-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">الإعدادات والصيانة</p>
                <div className="space-y-2">
                    {settingsNavItems.map((item) => (
                        <NavButton key={item.id} onClick={() => onNavClick(item.id as AdminView)} label={item.label} iconUrl={item.iconUrl} fallbackIcon={item.fallback} isActive={activeView === item.id}/>
                    ))}
                </div>
            </div>
        </nav>

        <PendingRequestsCard count={pendingRequestsCount} onNavClick={() => onNavClick('subscriptions')} />
    </div>
)};

const AdminLayout: React.FC<AdminLayoutProps> = ({ user, onLogout, children, onNavClick, activeView }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { mode, setMode, style, toggleStyle } = useAppearance();

  useEffect(() => {
    const fetchPendingCount = async () => {
        const count = await getPendingSubscriptionRequestCount();
        setPendingRequestsCount(count);
    };
    fetchPendingCount();

    const channel = supabase
        .channel('pending-requests-count')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'subscription_requests'
        }, payload => {
            fetchPendingCount();
        })
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

   useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
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
        <aside className="w-72 flex-shrink-0 rounded-2xl flex-col hidden md:flex p-3">
          <div className="p-4 flex flex-col items-center gap-4 flex-shrink-0">
            <div className="flex items-center space-x-2 space-x-reverse cursor-pointer" onClick={() => onNavClick('dashboard')}>
                <CogIcon className="w-8 h-8 text-purple-500" />
                <h1 className="text-xl font-bold" style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    لوحة التحكم
                </h1>
            </div>
            <div className="bg-[var(--bg-tertiary)] p-1 rounded-full flex items-center gap-1 border border-[var(--border-primary)]">
                <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} className="w-12 h-12 p-2.5 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] transition-colors flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] theme-toggle-button">
                    <div className="theme-toggle-icons">
                        <SunIcon className="w-6 h-6 sun-icon" />
                        <MoonIcon className="w-6 h-6 moon-icon" />
                    </div>
                </button>
                <button onClick={toggleStyle} className={`w-12 h-12 p-2.5 rounded-full transition-colors flex items-center justify-center ${style === '.clymorphism' ? 'bg-purple-500/20' : 'hover:bg-[var(--border-primary)]'}`}>
                    <img src="https://d.top4top.io/p_3606pacf30.png" alt="Toggle Style" className="w-6 h-6" />
                </button>
            </div>
          </div>
          <NavContent activeView={activeView} onNavClick={onNavClick} pendingRequestsCount={pendingRequestsCount}/>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden md:rounded-2xl">
          {/* Header */}
          <header className="app-header relative">
                <div className="header-logo" style={{ cursor: 'pointer' }} onClick={() => onNavClick('dashboard')}>
                    <div className="header-logo-icon" style={{background: 'linear-gradient(135deg, #a855f7, #ec4899)'}}>
                        <i className="fa-solid fa-gear text-white"></i>
                    </div>
                    <span className="hidden md:inline">لوحة التحكم</span>
                </div>

                <div className="header-actions">
                    <div className="relative">
                        <button onClick={() => { setIsNotificationsOpen(p => !p); setIsProfileMenuOpen(false); }} className="notification-btn">
                            <BellIcon className="w-6 h-6 text-[var(--text-secondary)]" />
                            {pendingRequestsCount > 0 && <span className="badge">{pendingRequestsCount}</span>}
                        </button>
                        {isNotificationsOpen && (
                            <div ref={notificationsRef} className="absolute top-full mt-3 left-0 w-80 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-2xl shadow-lg z-50 fade-in-up">
                                <div className="p-4 border-b border-[var(--border-primary)]"><h3 className="font-bold text-lg text-[var(--text-primary)]">الإشعارات</h3></div>
                                {pendingRequestsCount > 0 ? (
                                    <div className="p-2 max-h-80 overflow-y-auto">
                                        <button 
                                            onClick={() => {
                                                onNavClick('subscriptions');
                                                setIsNotificationsOpen(false);
                                            }}
                                            className="w-full p-3 rounded-lg hover:bg-[var(--bg-tertiary)] text-right"
                                        >
                                            <p className="text-sm text-[var(--text-primary)]">لديك {pendingRequestsCount} طلبات اشتراك جديدة للمراجعة.</p>
                                            <p className="text-xs text-purple-400 font-semibold mt-1">
                                                اضغط هنا للانتقال
                                            </p>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
                                        <p>لا توجد إشعارات جديدة حاليًا.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <div onClick={() => { setIsProfileMenuOpen(p => !p); setIsNotificationsOpen(false); }} className="user-avatar" style={{background: 'linear-gradient(135deg, #a855f7, #ec4899)'}}>
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
            <div className="h-20 flex items-center justify-between px-4 flex-shrink-0">
              <div className="flex items-center space-x-2 space-x-reverse">
                    <CogIcon className="w-8 h-8 text-purple-500" />
                    <h1 className="text-xl font-bold" style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        لوحة التحكم
                    </h1>
              </div>
              <button onClick={() => setIsMobileNavOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <XIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="px-4 pb-4 flex items-center justify-center">
                <div className="bg-[var(--bg-tertiary)] p-1 rounded-full flex items-center gap-1 border border-[var(--border-primary)]">
                    <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} className="w-12 h-12 p-2.5 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] transition-colors flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] theme-toggle-button">
                        <div className="theme-toggle-icons">
                            <SunIcon className="w-6 h-6 sun-icon" />
                            <MoonIcon className="w-6 h-6 moon-icon" />
                        </div>
                    </button>
                    <button onClick={toggleStyle} className={`w-12 h-12 p-2.5 rounded-full transition-colors flex items-center justify-center ${style === '.clymorphism' ? 'bg-purple-500/20' : 'hover:bg-[var(--border-primary)]'}`}>
                        <img src="https://d.top4top.io/p_3606pacf30.png" alt="Toggle Style" className="w-6 h-6" />
                    </button>
                </div>
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