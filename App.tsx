
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, Theme, ToastType } from './types';
import { initData, getUserByCredentials, addActivityLog } from './services/storageService';
import LoginScreen from './components/auth/LoginScreen';
import StudentDashboard from './components/student/StudentDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { THEME_CLASSES } from './constants';
import CosmicLoader from './components/common/Loader';
import { ToastContainer } from './components/common/Toast';
import { useToast } from './useToast';
import WelcomeScreen from './components/welcome/WelcomeScreen';
import { ShieldCheckIcon } from './components/common/Icons';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>(Theme.DARK);
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [preLoginView, setPreLoginView] = useState<'welcome' | 'login'>('welcome');
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    try {
      initData();
      const storedUser = localStorage.getItem('currentUser');
      const storedTheme = (localStorage.getItem('theme') as Theme) || Theme.DARK;
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
      setTheme(storedTheme);
    } catch (error) {
      console.error("Initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const showCopyWarning = () => {
      addToast('النسخ غير مسموح به لحماية حقوق الملكية.', ToastType.INFO);
    };

    const preventDefaultAction = (e: Event) => {
      e.preventDefault();
      showCopyWarning();
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable DevTools shortcuts and copy/paste/save
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ['C', 'X', 'U', 'S', 'P'].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
        showCopyWarning();
      }
    };

    document.addEventListener('contextmenu', preventDefaultAction);
    document.addEventListener('copy', preventDefaultAction);
    document.addEventListener('cut', preventDefaultAction);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', preventDefaultAction);
      document.removeEventListener('copy', preventDefaultAction);
      document.removeEventListener('cut', preventDefaultAction);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [addToast]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    Object.values(THEME_CLASSES).forEach(themeInfo => {
      root.classList.remove(themeInfo.main);
    });

    // Add the current theme class
    root.classList.add(THEME_CLASSES[theme].main);
    
    // Set body background color via style property to ensure it overrides tailwind
    document.body.style.backgroundColor = THEME_CLASSES[theme].bodyBg;

  }, [theme]);

  // ScreenShot and Screen Recording Protection
  useEffect(() => {
    if (!currentUser) return; // Only apply for logged-in users

    const handleBlur = () => {
      setIsWindowFocused(false);
    };
    const handleFocus = () => {
      setIsWindowFocused(true);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser]);

  const handleLogin = useCallback((identifier: string, code: string): void => {
    const user = getUserByCredentials(identifier, code);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setAuthError('');
      addActivityLog('User Login', `User "${user.name}" logged in.`);
    } else {
      setAuthError('اسم المستخدم أو الكود غير صحيح. يرجى المحاولة مرة أخرى.');
    }
  }, []);

  const handleLogout = useCallback((): void => {
    if (currentUser) {
      addActivityLog('User Logout', `User "${currentUser.name}" logged out.`);
    }
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setPreLoginView('welcome');
    setIsWindowFocused(true); // Reset focus state on logout
  }, [currentUser]);
  
  const handleSetTheme = useCallback((newTheme: Theme): void => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  const handleNavigateToLogin = () => {
    setAuthError('');
    setPreLoginView('login');
  };

  const handleNavigateToWelcome = () => {
    setAuthError('');
    setPreLoginView('welcome');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white font-cairo">
              <CosmicLoader />
              <p className="mt-4 text-lg text-slate-300">جاري تحميل المنصة...</p>
          </div>
      );
    }
  
    if (!currentUser) {
      if (preLoginView === 'welcome') {
        return <WelcomeScreen onNavigateToLogin={handleNavigateToLogin} />;
      }
      return <LoginScreen onLogin={handleLogin} error={authError} onBack={handleNavigateToWelcome} />;
    }
  
    if (currentUser.role === Role.ADMIN) {
      return <AdminDashboard user={currentUser} onLogout={handleLogout} theme={theme} setTheme={handleSetTheme} />;
    }
  
    return <StudentDashboard user={currentUser} onLogout={handleLogout} theme={theme} setTheme={handleSetTheme} />;
  }

  const isContentProtected = !isWindowFocused && !!currentUser;

  return (
    <>
      <div className={`transition-all duration-300 ${isContentProtected ? 'blur-md pointer-events-none' : ''}`}>
        {renderContent()}
      </div>

      {isContentProtected && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm text-[var(--text-primary)] text-center p-4 fade-in">
          <ShieldCheckIcon className="w-20 h-20 text-[var(--accent-primary)]" />
          <h2 className="text-3xl font-bold mt-4">حماية المحتوى مفعلة</h2>
          <p className="mt-2 max-w-md text-[var(--text-secondary)]">
            لا يُسمح بتسجيل الشاشة أو أخذ لقطات منها لحماية حقوق الملكية.
            <br />
            سيظهر المحتوى مرة أخرى عند العودة إلى هذه النافذة.
          </p>
        </div>
      )}
      
      <ToastContainer />
    </>
  );
};

export default App;