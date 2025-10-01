
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, Theme } from './types';
import { initData, getUserByCredentials, addActivityLog } from './services/storageService';
import LoginScreen from './components/auth/LoginScreen';
import StudentDashboard from './components/student/StudentDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { THEME_CLASSES } from './constants';
import CosmicLoader from './components/common/Loader';
import { ToastContainer } from './components/common/Toast';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>(Theme.DARK);
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const handleLogin = useCallback((username: string, code: string): void => {
    const user = getUserByCredentials(username, code);
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
  }, [currentUser]);
  
  const handleSetTheme = useCallback((newTheme: Theme): void => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

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
      return <LoginScreen onLogin={handleLogin} error={authError} />;
    }
  
    if (currentUser.role === Role.ADMIN) {
      return <AdminDashboard user={currentUser} onLogout={handleLogout} theme={theme} setTheme={handleSetTheme} />;
    }
  
    return <StudentDashboard user={currentUser} onLogout={handleLogout} theme={theme} setTheme={handleSetTheme} />;
  }

  return (
    <>
      {renderContent()}
      <ToastContainer />
    </>
  );
};

export default App;