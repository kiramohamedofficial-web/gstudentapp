import React, { useState, useRef, useEffect } from 'react';
import { User, StudentView, Subscription, Theme } from '../../types';
import { HomeIcon, UserCircleIcon, CreditCardIcon, UsersIcon, LogoutIcon, TemplateIcon, XIcon, SparklesIcon, ChartBarIcon, BrainIcon, BellIcon, CogIcon, QuestionMarkCircleIcon } from '../common/Icons';

interface StudentLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  onNavClick: (view: StudentView) => void;
  activeView: string;
  subscription: Subscription | null;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  gradeName?: string;
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

const navItems = [
    { id: 'home', label: 'الرئيسية', icon: HomeIcon },
    { id: 'smartPlan', label: 'الخطة الذكية', icon: SparklesIcon },
    { id: 'chatbot', label: 'المساعد الذكي', icon: ChatbotIcon },
    { id: 'askTheProf', label: 'اسأل البروف', icon: QuestionMarkCircleIcon },
    { id: 'grades', label: 'المنهج الدراسي', icon: CurriculumIcon },
    { id: 'teachers', label: 'المدرسون', icon: UsersIcon },
    { id: 'courses', label: 'الكورسات', icon: CoursesIcon },
    { id: 'results', label: 'الواجبات والنتائج', icon: ChartBarIcon },
    { id: 'subscription', label: 'الاشتراك', icon: CreditCardIcon },
];

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

const NavContent: React.FC<{ activeView: string; onNavClick: (view: StudentView) => void; onLogout: () => void; subscription: Subscription | null; }> = ({ activeView, onNavClick, onLogout, subscription }) => (
    <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="mt-2 flex-grow p-4 space-y-1.5">{navItems.map((item) => <NavButton key={item.id} onClick={() => onNavClick(item.id as StudentView)} label={item.label} icon={item.icon} isActive={activeView === item.id} />)}</nav>
        {subscription && subscription.status === 'Active' && (<SubscriptionStatusCard subscription={subscription} onNavClick={() => onNavClick('subscription')} />)}
        <div className="p-4 border-t border-[var(--border-primary)]"><button onClick={onLogout} className="w-full flex items-center p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors duration-200 space-x-4 space-x-reverse"><LogoutIcon className="w-6 h-6" /><span className="text-md font-semibold">تسجيل الخروج</span></button></div>
    </div>
);

const BottomNavItem: React.FC<{ onClick: () => void; label: string; icon: React.FC<{className?: string}>; isActive: boolean; }> = ({ onClick, label, icon: Icon, isActive }) => (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center p-2 transition-colors duration-300 group ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
        <Icon className={`w-6 h-6 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

const StudentLayout: React.FC<StudentLayoutProps> = ({ user, onLogout, children, onNavClick, activeView, subscription, theme, setTheme, gradeName }) => {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const mockNotifications = [
        { id: 1, text: "تم إضافة واجب جديد في مادة الفيزياء.", time: "منذ 5 دقائق" },
        { id: 2, text: "سيتم عقد حصة مراجعة مباشرة غداً الساعة 8 مساءً.", time: "منذ 1 ساعة" },
        { id: 3, text: "حصلت على 95% في اختبار الكيمياء. أحسنت!", time: "منذ 3 ساعات" },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setIsProfileMenuOpen(false);
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    return (
    <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-2 md:p-3">
      <div className="flex w-full h-full gap-3">
        {/* Desktop Sidebar */}
        <aside className="w-72 flex-shrink-0 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-2xl flex-col hidden md:flex overflow-hidden">
            <div className="h-20 flex items-center justify-center px-4 flex-shrink-0">
                <div className="flex items-center space-x-2 space-x-reverse"><img src="https://h.top4top.io/p_3583m5j8t0.png" alt="Gstudent Logo" className="w-8 h-8" /><h1 className="text-2xl font-bold gradient-text">Gstudent</h1></div>
            </div>
            <div className="w-full h-px bg-[var(--border-primary)] flex-shrink-0"></div>
            <NavContent activeView={activeView} onNavClick={onNavClick} onLogout={onLogout} subscription={subscription} />
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl">
          {/* Header */}
          <header className="relative z-10 flex-shrink-0 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] flex items-center justify-between px-4 md:px-6 h-20 rounded-t-2xl border-b border-[var(--glass-border)]">
              <div className="flex items-center space-x-4 space-x-reverse">
                  <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] md:hidden"><img src="https://b.top4top.io/p_3583gmh281.png" alt="Menu" className="w-6 h-6" /></button>
                  <h1 className="hidden md:block text-xl font-bold text-[var(--text-primary)]">مرحباً، {user.name.split(' ')[0]}</h1>
              </div>
              {/* Centered Logo */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <img src="https://l.top4top.io/p_3583m3alu0.png" alt="Platform Logo" className="h-[76px] object-contain" />
              </div>
              <div className="flex items-center space-x-2 md:space-x-3 space-x-reverse">
                  {/* Notifications */}
                  <div className="relative">
                      <button onClick={() => { setIsNotificationsOpen(p => !p); setIsProfileMenuOpen(false); }} className="relative h-11 w-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] rounded-full transition-all">
                          <BellIcon className="w-6 h-6" /><span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                      </button>
                      {isNotificationsOpen && (
                           <div ref={notificationsRef} className="absolute top-full mt-3 left-0 w-80 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-2xl shadow-lg z-50 fade-in-up">
                              <div className="p-4 border-b border-[var(--border-primary)]"><h3 className="font-bold text-lg text-[var(--text-primary)]">الإشعارات</h3></div>
                              <div className="p-2 max-h-80 overflow-y-auto">{mockNotifications.map(n => <div key={n.id} className="p-3 rounded-lg hover:bg-[var(--bg-tertiary)] text-right"><p className="text-sm text-[var(--text-primary)]">{n.text}</p><p className="text-xs text-[var(--text-secondary)] mt-1">{n.time}</p></div>)}</div>
                              <div className="p-2 border-t border-[var(--border-primary)] text-center"><button className="text-sm font-semibold text-[var(--accent-primary)] hover:underline">عرض الكل</button></div>
                          </div>
                      )}
                  </div>
                  {/* Profile */}
                  <div className="relative">
                      <button onClick={() => { setIsProfileMenuOpen(p => !p); setIsNotificationsOpen(false); }} className="h-11 w-11 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] flex items-center justify-center text-[var(--text-primary)] font-bold text-lg transition-all">{user.name.charAt(0)}</button>
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
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 bg-[var(--bg-secondary)] rounded-b-2xl"><div key={activeView} className="fade-in">{children}</div></main>
        </div>
      </div>
      <div className="md:hidden fixed bottom-2 left-2 right-2 h-16 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] flex justify-around items-center shadow-lg rounded-2xl">
          {bottomNavItems.map((item) => <BottomNavItem key={item.id} onClick={() => onNavClick(item.id as StudentView)} label={item.label} icon={item.icon} isActive={activeView === item.id} />)}
      </div>
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileNavOpen(false)}></div>
          <div className="fixed inset-y-2 right-2 w-72 bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col animate-slide-in-right rounded-2xl overflow-hidden">
            <div className="h-20 flex items-center justify-between px-6 flex-shrink-0">
               <div className="flex items-center space-x-2 space-x-reverse">
                   <img src="https://h.top4top.io/p_3583m5j8t0.png" alt="Gstudent Logo" className="w-8 h-8" />
                   <h1 className="text-xl font-bold gradient-text">Gstudent</h1>
               </div>
              <button onClick={() => setIsMobileNavOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><XIcon className="w-6 h-6" /></button>
            </div>
            <NavContent activeView={activeView} onNavClick={(v) => { onNavClick(v); setIsMobileNavOpen(false); }} onLogout={() => { onLogout(); setIsMobileNavOpen(false); }} subscription={subscription} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLayout;