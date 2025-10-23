import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, Theme } from './types';
import { initData, getUserByCredentials, addActivityLog, addUser, validateSubscriptionCode, registerAndRedeemCode } from './services/storageService';
import LoginScreen from './components/auth/LoginScreen';
import StudentDashboard from './components/student/StudentDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard'; // Import TeacherDashboard
import Loader from './components/common/Loader';
import { ToastContainer } from './components/common/Toast';
import { useToast } from './useToast';
import WelcomeScreen from './components/welcome/WelcomeScreen';
import RegistrationScreen from './components/auth/RegistrationScreen';
import ScreenSecurity from './components/common/ScreenSecurity';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [preLoginView, setPreLoginView] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [theme, setTheme] = useState<Theme>('dark');
  const [codeToRegister, setCodeToRegister] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    try {
      initData();
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      if (storedTheme) {
        setTheme(storedTheme);
      }
    } catch (error) {
      console.error("Initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);


  const handleLogin = useCallback((identifier: string, password: string): void => {
    const user = getUserByCredentials(identifier, password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setAuthError('');
      addActivityLog('User Login', `User "${user.name}" logged in.`);
    } else {
      setAuthError('رقم الهاتف/البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }
  }, []);
  
  const handleCodeLogin = useCallback((code: string): void => {
      const { valid, error } = validateSubscriptionCode(code);
      if (valid) {
          setCodeToRegister(code);
          setPreLoginView('register');
          setAuthError('');
      } else {
          setAuthError(error || 'الكود غير صالح أو تم استخدامه.');
      }
  }, []);

  const handleRegister = useCallback((userData: Omit<User, 'id' | 'role' | 'subscriptionId'>): void => {
      const result = codeToRegister
          ? registerAndRedeemCode(userData, codeToRegister)
          : addUser(userData);

      if (result.user) {
          setCurrentUser(result.user);
          localStorage.setItem('currentUser', JSON.stringify(result.user));
          setAuthError('');
          addToast(`مرحباً بك ${result.user.name}! تم إنشاء حسابك بنجاح.`, 'success');
          setCodeToRegister(null);
      } else {
          setAuthError(result.error || 'حدث خطأ غير متوقع أثناء إنشاء الحساب.');
          // Navigate back to register screen to show the error
          setPreLoginView('register');
      }
  }, [addToast, codeToRegister]);


  const handleLogout = useCallback((): void => {
    if (currentUser) {
      addActivityLog('User Logout', `User "${currentUser.name}" logged out.`);
    }
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setPreLoginView('welcome');
    setCodeToRegister(null);
  }, [currentUser]);

  const handleNavigateToLogin = () => {
    setAuthError('');
    setPreLoginView('login');
    setCodeToRegister(null);
  };
  
  const handleNavigateToRegister = () => {
    setAuthError('');
    setPreLoginView('register');
    setCodeToRegister(null);
  };

  const handleNavigateToWelcome = () => {
    setAuthError('');
    setPreLoginView('welcome');
    setCodeToRegister(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
              <Loader />
              <p className="mt-4 text-lg text-[var(--text-secondary)]">جاري تحميل المنصة...</p>
          </div>
      );
    }
  
    if (!currentUser) {
      switch (preLoginView) {
        case 'welcome':
          return <WelcomeScreen onNavigateToLogin={handleNavigateToLogin} onNavigateToRegister={handleNavigateToRegister} />;
        case 'login':
          return <LoginScreen onLogin={handleLogin} onCodeLogin={handleCodeLogin} error={authError} onBack={handleNavigateToWelcome} onNavigateToRegister={handleNavigateToRegister} />;
        case 'register':
          return <RegistrationScreen onRegister={handleRegister} error={authError} onBack={handleNavigateToLogin} code={codeToRegister} />;
        default:
           return <WelcomeScreen onNavigateToLogin={handleNavigateToLogin} onNavigateToRegister={handleNavigateToRegister}/>;
      }
    }
  
    return (
      <ScreenSecurity>
        {currentUser.role === Role.ADMIN
          ? <AdminDashboard user={currentUser} onLogout={handleLogout} theme={theme} setTheme={setTheme} />
          : currentUser.role === Role.TEACHER
          ? <TeacherDashboard user={currentUser} onLogout={handleLogout} theme={theme} setTheme={setTheme} />
          : <StudentDashboard user={currentUser} onLogout={handleLogout} theme={theme} setTheme={setTheme} />
        }
      </ScreenSecurity>
    );
  }

  return (
    <>
      <div className={`transition-all duration-300`}>
        {renderContent()}
      </div>
      
      <ToastContainer />
    </>
  );
};

export default App;
