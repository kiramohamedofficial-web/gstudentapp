import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, StudentView, Notification } from '../../types';
import { BookOpenIcon, HomeIcon, UserCircleIcon, CreditCardIcon, QuestionMarkCircleIcon, ChartBarIcon, LogoutIcon, AtomIcon, MenuIcon, XIcon, BellIcon, SparklesIcon, UsersSolidIcon } from '../common/Icons';
import { getNotificationsByUserId, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../../services/storageService';
import NotificationsPanel from '../common/NotificationsPanel';

interface StudentLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  onNavClick: (view: StudentView) => void;
  activeView: string;
}

const navItems = [
    { id: 'home', label: 'الرئيسية', icon: HomeIcon },
    { id: 'studyPlan', label: 'الخطة الذكية', icon: SparklesIcon },
    { id: 'grades', label: 'المنهج الدراسي', icon: BookOpenIcon },
    { id: 'teachers', label: 'المدرسون', icon: UsersSolidIcon },
    { id: 'results', label: 'الواجبات والنتائج', icon: ChartBarIcon },
    { id: 'subscription', label: 'الاشتراك', icon: CreditCardIcon },
    { id: 'profile', label: 'الإعدادات', icon: UserCircleIcon },
];

const bottomNavItems = [
    { id: 'home', label: 'الرئيسية', icon: HomeIcon },
    { id: 'grades', label: 'المنهج', icon: BookOpenIcon },
    { id: 'teachers', label: 'المدرسون', icon: UsersSolidIcon },
    { id: 'subscription', label: 'الاشتراك', icon: CreditCardIcon },
    { id: 'profile', label: 'ملفي', icon: UserCircleIcon },
];

const NavButton: React.FC<{
    onClick: () => void;
    label: string;
    icon: React.FC<{className?: string}>;
    isActive: boolean;
}> = ({ onClick, label, icon: Icon, isActive }) => (
    <button
        onClick={onClick}
        className={`w-full text-right nav-btn ${isActive ? 'active' : ''}`}
    >
        <Icon className={`w-6 h-6 ml-4 nav-icon transition-colors ${isActive ? 'text-[var(--accent-primary)]' : 'text-gray-500'}`} />
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

const BottomNavItem: React.FC<{
    onClick: () => void;
    label: string;
    icon: React.FC<{className?: string}>;
    isActive: boolean;
}> = ({ onClick, label, icon: Icon, isActive }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center p-2 transition-colors duration-300 group ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
    >
        <Icon className={`w-6 h-6 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

const StudentLayout: React.FC<StudentLayoutProps> = ({ user, onLogout, children, onNavClick, activeView }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsPanelRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
  
  // Fetch notifications on mount and when view changes (to reflect updates)
  useEffect(() => {
    setNotifications(getNotificationsByUserId(user.id));
  }, [user.id, activeView]);

  // Handler for closing panel on outside click
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          const bellButton = document.getElementById('notification-bell-button');
          if (
              isNotificationsOpen &&
              notificationsPanelRef.current &&
              !notificationsPanelRef.current.contains(event.target as Node) &&
              bellButton &&
              !bellButton.contains(event.target as Node)
          ) {
              setIsNotificationsOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);
  
  const handleMarkAsRead = (id: string) => {
      markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };
  
  const handleMarkAllAsRead = () => {
      markAllNotificationsAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };
  
  const handleDelete = (id: string) => {
      deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
  };


  const handleMobileNavClick = (view: StudentView) => {
    onNavClick(view);
    setIsMobileNavOpen(false);
  };
  
  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside className="w-72 flex-shrink-0 flex-col hidden md:flex glass-effect border-l">
        <div className="h-20 flex items-center justify-center border-b border-[var(--border-primary)] px-4">
           <div className="flex items-center space-x-2 space-x-reverse">
                <AtomIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--accent-gradient)]">
                    بوابة الطالب
                </h1>
            </div>
        </div>
        <NavContent activeView={activeView} onNavClick={onNavClick} onLogout={onLogout} />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 border-b glass-effect flex-shrink-0">
          
          {/* Right side of header (for RTL) */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button onClick={() => setIsMobileNavOpen(true)} className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <MenuIcon className="w-6 h-6" />
            </button>
            {/* Desktop brand */}
            <div className="hidden md:flex items-center space-x-3 space-x-reverse">
                <AtomIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                    Gstudent
                </h1>
            </div>
          </div>
          
          {/* Left side of header (for RTL) - User info and notifications */}
          <div className="flex items-center space-x-4 space-x-reverse">
             <div className="relative">
              <button 
                id="notification-bell-button"
                onClick={() => setIsNotificationsOpen(p => !p)} 
                className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                  <BellIcon className="w-6 h-6"/>
                  {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
              </button>
              {isNotificationsOpen && (
                <div ref={notificationsPanelRef}>
                    <NotificationsPanel 
                        notifications={notifications}
                        onClose={() => setIsNotificationsOpen(false)}
                        onMarkAsRead={handleMarkAsRead}
                        onMarkAllAsRead={handleMarkAllAsRead}
                        onDelete={handleDelete}
                        onNavigate={onNavClick}
                    />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 space-x-reverse group cursor-pointer p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors" onClick={() => onNavClick('profile')}>
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                  {user.name.charAt(0)}
                </div>
                <div className="absolute -inset-1 rounded-full border-2 border-transparent group-hover:border-[var(--accent-primary)] transition-all duration-300"></div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="font-semibold text-md text-[var(--text-primary)]">{user.name}</span>
                <span className="block text-sm text-[var(--text-secondary)]">طالب</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          <div key={activeView} className="fade-in">
            {children}
          </div>
        </main>
        
        {/* Bottom Nav Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-lg border-t border-[var(--border-primary)] flex justify-around items-center shadow-lg">
            {bottomNavItems.map((item) => (
                <BottomNavItem
                    key={item.id}
                    onClick={() => onNavClick(item.id as StudentView)}
                    label={item.label}
                    icon={item.icon}
                    isActive={activeView === item.id}
                />
            ))}
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileNavOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 w-72 flex flex-col animate-slide-in-right glass-effect border-l">
            <div className="h-20 flex items-center justify-between px-6 border-b border-[var(--border-primary)] flex-shrink-0">
                <div className="flex items-center space-x-2 space-x-reverse">
                    <AtomIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-[var(--accent-gradient)]">
                        بوابة الطالب
                    </h1>
                </div>
              <button onClick={() => setIsMobileNavOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <XIcon className="w-6 h-6" />
              </button>
            </div>
            <NavContent 
                activeView={activeView} 
                onNavClick={handleMobileNavClick} 
                onLogout={onLogout}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLayout;