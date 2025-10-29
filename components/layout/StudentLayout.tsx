import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StudentView, Subscription, Theme, AppNotification } from '../../types';
import { HomeIcon, UserCircleIcon, CreditCardIcon, UsersIcon, LogoutIcon, TemplateIcon, XIcon, SparklesIcon, ChartBarIcon, BrainIcon, BellIcon, CogIcon, QuestionMarkCircleIcon, MoonIcon, ShieldCheckIcon, ShieldExclamationIcon } from '../common/Icons';
import { useSession } from '../../hooks/useSession';
import { useSubscription } from '../../hooks/useSubscription';

interface StudentLayoutProps {
  children: React.ReactNode;
  onNavClick: (view: StudentView) => void;
  activeView: string;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  gradeName?: string;
  loadTime?: number | null;
}

const CurriculumIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://j.top4top.io/p_3583qcfj42.png" alt="المنهج" className={className} />
);

const CoursesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://j.top4top.io/p_3583olmgd1.png" alt="الكورسات" className={className} />
);

const SubscriptionBottomNavIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://k.top4top.io/p_35830gaoq2.png" alt="الاشتراكات" className={className} />
);

const ProfileBottomNavIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://l.top4top.io/p_3583el7rr0.png" alt="ملفي" className={className} />
);

const ResultsBottomNavIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://a.top4top.io/p_3583i1gc31.png" alt="النتائج" className={className} />
);

const ChatbotIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://b.top4top.io/p_3583ycfjf2.png" alt="المساعد الذكي" className={className} />
);

const CartoonMoviesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://h.top4top.io/p_3584kk8d71.png" alt="افلام كرتون" className={className} />
);

const bottomNavItems = [
    { id: 'home', label: 'الرئيسية', icon: HomeIcon },
    { id: 'grades', label: 'المنهج', icon: CurriculumIcon },
    { id: 'results', label: 'النتائج', icon: ResultsBottomNavIcon },
    { id: 'subscription', label: 'الاشتراك', icon: SubscriptionBottomNavIcon },
    { id: 'profile', label: 'ملفي', icon: ProfileBottomNavIcon },
];

const NavButton: React.FC<{ onClick: () => void; label: string; icon: React.FC<{className?: string}>; isActive: boolean; }> = ({ onClick, label, icon: Icon, isActive }) => (
    <button onClick={onClick} className={`w-full text-right flex items-center space-x-4 space-x-reverse group rounded-lg p-3 nav-btn ${isActive ? 'active' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}>
        <Icon className={`w-6 h-6 transition-colors duration-300 nav-icon ${isActive ? '' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`} />
        <span className="text-md">{label}</span>
    </button>
);

const SubscriptionStatusCard: React.FC<{ subscription: Subscription; onNavClick: () => void; }> = ({ subscription, onNavClick }) => {
    const days = Math.ceil(Math.max(0, (new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
    const planLabels: Record<Subscription['plan'], string> = { Monthly: 'الشهرية', Quarterly: 'ربع السنوية', Annual: 'السنوية', SemiAnnually: 'نصف السنوية' };

    return (
        <div className="px-4 pb-4">
            <button onClick={onNavClick} className="w-full bg-[rgba(var(--accent-primary-rgb),0.1)] p-4 rounded-xl border border-transparent hover:border-[rgba(var(--accent-primary-rgb),0.5)] transition-all duration-300 text-right space-y-2">
                <div className="flex items-center space-x-3 space-x-reverse"><div className="p-2 bg-[var(--accent-primary)] rounded-full"><SparklesIcon className="w-5 h-5 text-white" /></div><span className="font-bold text-lg text-[var(--text-primary)]">اشتراكك</span></div>
                <p className="text-sm text-[var(--text-secondary)]">الخطة {planLabels[subscription.plan]} النشطة</p>
                <p className="text-md font-bold text-[var(--accent-primary)]">متبقي {days} يوم</p>
            </button>
        </div>
    );
};

const NavContent: React.FC<{ navItems: any[]; activeView: string; onNavClick: (view: StudentView) => void; onLogout: () => void; subscription: Subscription | null; }> = ({ navItems, activeView, onNavClick, onLogout, subscription }) => (
    <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="mt-2 flex-grow p-4 space-y-1.5">{navItems.map((item) => <NavButton key={item.id} onClick={() => onNavClick(item.id as StudentView)} label={item.label} icon={item.icon} isActive={activeView === item.id} />)}</nav>
        {subscription && subscription.status === 'Active' && (new Date(subscription.endDate) >= new Date()) && (<SubscriptionStatusCard subscription={subscription} onNavClick={() => onNavClick('subscription')} />)}
        <div className="p-4 border-t border-[var(--border-primary)]"><button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors duration-200 space-x-4 space-x-reverse"><LogoutIcon className="w-6 h-6" /><span className="text-md font-semibold">تسجيل الخروج</span></button></div>
    </div>
);

const BottomNavItem: React.FC<{ onClick: () => void; label: string; icon: React.FC<{className?: string}>; isActive: boolean; }> = ({ onClick, label, icon: Icon, isActive }) => (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center p-2 transition-colors duration-300 group ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
        <Icon className={`w-6 h-6 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, onNavClick, activeView, theme, setTheme, gradeName, loadTime }) => {
    const { currentUser: user, handleLogout: onLogout } = useSession();
    const { subscription, isLoading: isSubLoading, notifications } = useSubscription();

    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isBannerVisible, setIsBannerVisible] = useState(true);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const hasActiveSubscription = useMemo(() => {
        if (!subscription || subscription.status !== 'Active') return false;
        return new Date(subscription.endDate) >= new Date();
    }, [subscription]);

    const navItems = useMemo(() => [
        { id: 'home', label: 'الرئيسية', icon: HomeIcon },
        { id: 'smartPlan', label: 'الخطة الذكية', icon: SparklesIcon },
        { id: 'chatbot', label: 'المساعد الذكي', icon: ChatbotIcon },
        { id: 'askTheProf', label: 'اسأل البروف', icon: QuestionMarkCircleIcon },
        { id: 'adhkar', label: 'أذكار الصباح والمساء', icon: MoonIcon },
        { id: 'cartoonMovies', label: 'افلام كرتون', icon: CartoonMoviesIcon },
        { id: 'grades', label: 'المنهج الدراسي', icon: CurriculumIcon },
        { id: 'teachers', label: 'المدرسون', icon: UsersIcon },
        { id: 'courses', label: 'الكورسات', icon: CoursesIcon },
        { id: 'results', label: 'الواجبات والنتائج', icon: ChartBarIcon },
        { id: 'subscription', label: 'الاشتراك', icon: CreditCardIcon },
    ], []);

    const expiringNotification = useMemo(() => {
        return notifications.find(n => n.id.startsWith('sub-expire-'));
    }, [notifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setIsProfileMenuOpen(false);
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    if (!user) return null;

    return (
    <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-0 md:p-3">
      <div className="flex w-full h-full md:gap-3">
        {/* Desktop Sidebar */}
        <aside className="w-72 flex-shrink-0 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-2xl flex-col hidden md:flex overflow-hidden">
            <div className="h-20 flex items-center justify-center px-4 flex-shrink-0">
                <div className="flex items-center"><img src="https://j.top4top.io/p_3584uziv73.png" alt="Gstudent Logo" className="w-12 h-12" /></div>
            </div>
            <div className="w-full h-px bg-[var(--border-primary)] flex-shrink-0"></div>
            <NavContent navItems={navItems} activeView={activeView} onNavClick={onNavClick} onLogout={onLogout} subscription={subscription} />
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden md:rounded-2xl">
          {/* Header */}
           <header className="app-header">
                {/* Right Side (in RTL) */}
                <div className="menu-toggle md:hidden" onClick={() => setIsMobileNavOpen(true)}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div className="hidden md:flex">
                     {!isSubLoading && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${hasActiveSubscription ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {hasActiveSubscription ? <ShieldCheckIcon className="w-4 h-4" /> : <ShieldExclamationIcon className="w-4 h-4" />}
                            <span>{hasActiveSubscription ? 'الاشتراك فعال' : 'الاشتراك غير فعال'}</span>
                        </div>
                    )}
                </div>

                {/* Center */}
                <div className="header-logo absolute left-1/2 -translate-x-1/2" style={{ cursor: 'pointer' }} onClick={() => onNavClick('home')}>
                    <div className="header-logo-icon"></div>
                </div>

                {/* Left Side (in RTL) */}
                <div className="header-actions">
                    <div className="relative">
                        <button onClick={() => { setIsNotificationsOpen(p => !p); setIsProfileMenuOpen(false); }} className="notification-btn">
                            <i className="fas fa-bell"></i>
                            {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
                        </button>
                         {isNotificationsOpen && (
                           <div ref={notificationsRef} className="absolute top-full mt-3 left-0 w-80 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-2xl shadow-lg z-50 fade-in-up">
                              <div className="p-4 border-b border-[var(--border-primary)]"><h3 className="font-bold text-lg text-[var(--text-primary)]">الإشعارات</h3></div>
                              {notifications.length > 0 ? (
                                <>
                                  <div className="p-2 max-h-80 overflow-y-auto">{notifications.map(n => 
                                      <button 
                                          key={n.id} 
                                          onClick={() => {
                                              if (n.link) onNavClick(n.link);
                                              setIsNotificationsOpen(false);
                                          }}
                                          className="w-full p-3 rounded-lg hover:bg-[var(--bg-tertiary)] text-right"
                                      >
                                          <p className="text-sm text-[var(--text-primary)]">{n.text}</p>
                                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                                              {new Date(n.createdAt).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}
                                          </p>
                                      </button>
                                  )}</div>
                                </>
                              ) : (
                                <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
                                    <p>لا توجد إشعارات جديدة حاليًا.</p>
                                </div>
                              )}
                          </div>
                      )}
                    </div>
                  
                    <div className="relative">
                        <div onClick={() => { setIsProfileMenuOpen(p => !p); setIsNotificationsOpen(false); }} className="user-avatar">
                            {user.name.charAt(0)}
                        </div>
                         {isProfileMenuOpen && (
                          <div ref={profileMenuRef} className="absolute top-full mt-3 left-0 w-72 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-2xl shadow-lg z-50 fade-in-up overflow-hidden">
                              <div className="p-4"><p className="font-bold text-lg text-[var(--text-primary)] truncate">{user.name}</p><p className="text-sm text-[var(--text-secondary)]">{gradeName || 'طالب'}</p></div>
                              <div className="h-px bg-[var(--border-primary)] mx-4"></div>
                              <div className="p-2 space-y-1">
                                  <button onClick={() => { onNavClick('profile'); setIsProfileMenuOpen(false); }} className="w-full flex items-center p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 space-x-3 space-x-reverse text-right"><UserCircleIcon className="w-6 h-6 text-[var(--text-secondary)]" /><span>الملف الشخصي</span></button>
                                  <button onClick={() => { onNavClick('results'); setIsProfileMenuOpen(false); }} className="w-full flex items-center p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 space-x-3 space-x-reverse text-right"><ChartBarIcon className="w-6 h-6 text-[var(--text-secondary)]" /><span>الإحصائيات</span></button>
                                  <button onClick={() => { onNavClick('profile'); setIsProfileMenuOpen(false); }} className="w-full flex items-center p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 space-x-3 space-x-reverse text-right"><CogIcon className="w-6 h-6 text-[var(--text-secondary)]" /><span>الإعدادات</span></button>
                              </div>
                              <div className="h-px bg-[var(--border-primary)] mx-4"></div>
                              <div className="p-2"><button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors duration-200 space-x-3 space-x-reverse text-right"><LogoutIcon className="w-6 h-6" /><span>تسجيل الخروج</span></button></div>
                          </div>
                      )}
                    </div>
                </div>
            </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 bg-[var(--bg-secondary)] md:rounded-b-2xl">
              {isBannerVisible && expiringNotification && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm rounded-lg p-4 mb-6 flex items-start gap-3 fade-in" role="alert">
                      <ShieldExclamationIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                      <div className="flex-grow">
                          <h4 className="font-bold">تنبيه هام</h4>
                          <p>
                              {expiringNotification.text} 
                              <button onClick={() => expiringNotification.link && onNavClick(expiringNotification.link)} className="font-bold underline hover:text-amber-200 mx-2">جدد الآن</button>
                          </p>
                      </div>
                      <button onClick={() => setIsBannerVisible(false)} className="p-1 rounded-full text-amber-300/70 hover:bg-amber-500/20">
                          <XIcon className="w-4 h-4" />
                      </button>
                  </div>
              )}
              <div key={activeView} className="fade-in">{children}</div>
          </main>
        </div>
      </div>
      <div className="md:hidden fixed bottom-2 left-2 right-2 h-16 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] flex justify-around items-center shadow-lg rounded-2xl">
          {bottomNavItems.map((item) => <BottomNavItem key={item.id} onClick={() => onNavClick(item.id as StudentView)} label={item.label} icon={item.icon} isActive={activeView === item.id} />)}
      </div>
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileNavOpen(false)}></div>
          <div className="fixed inset-y-2 right-2 w-72 bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col animate-slide-in-right rounded-2xl overflow-hidden">
            <div className="h-20 flex items-center justify-between px-6 flex-shrink-0">
               <div className="flex items-center">
                   <img src="https://j.top4top.io/p_3584uziv73.png" alt="Gstudent Logo" className="w-10 h-10" />
               </div>
              <button onClick={() => setIsMobileNavOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><XIcon className="w-6 h-6" /></button>
            </div>
            <NavContent navItems={navItems} activeView={activeView} onNavClick={(v) => { onNavClick(v); setIsMobileNavOpen(false); }} onLogout={() => { onLogout(); setIsMobileNavOpen(false); }} subscription={subscription} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLayout;