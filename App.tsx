import React, { useState, useEffect, useCallback } from 'react';
import { User, Role } from './types';
import { initData, getUserByCredentials, addActivityLog, addUser } from './services/storageService';
import LoginScreen from './components/auth/LoginScreen';
import StudentDashboard from './components/student/StudentDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import Loader from './components/common/Loader';
import { ToastContainer } from './components/common/Toast';
import { useToast } from './useToast';
import WelcomeScreen from './components/welcome/WelcomeScreen';
import RegistrationScreen from './components/auth/RegistrationScreen';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [preLoginView, setPreLoginView] = useState<'welcome' | 'login' | 'register'>('welcome');
  const { addToast } = useToast();

  useEffect(() => {
    try {
      initData();
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleRegister = useCallback((userData: Omit<User, 'id' | 'role' | 'subscriptionId'>): void => {
      const { user, error } = addUser(userData);
      if (user) {
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          setAuthError('');
          addToast(`مرحباً بك ${user.name}! تم إنشاء حسابك بنجاح.`, 'success');
      } else {
          setAuthError(error || 'حدث خطأ غير متوقع أثناء إنشاء الحساب.');
          // Navigate back to register screen to show the error
          setPreLoginView('register');
      }
  }, [addToast]);

  const handleLogout = useCallback((): void => {
    if (currentUser) {
      addActivityLog('User Logout', `User "${currentUser.name}" logged out.`);
    }
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setPreLoginView('welcome');
  }, [currentUser]);

  const handleNavigateToLogin = () => {
    setAuthError('');
    setPreLoginView('login');
  };
  
  const handleNavigateToRegister = () => {
    setAuthError('');
    setPreLoginView('register');
  };

  const handleNavigateToWelcome = () => {
    setAuthError('');
    setPreLoginView('welcome');
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
          return <LoginScreen onLogin={handleLogin} error={authError} onBack={handleNavigateToWelcome} onNavigateToRegister={handleNavigateToRegister} />;
        case 'register':
          return <RegistrationScreen onRegister={handleRegister} error={authError} onBack={handleNavigateToLogin} />;
        default:
           return <WelcomeScreen onNavigateToLogin={handleNavigateToLogin} onNavigateToRegister={handleNavigateToRegister}/>;
      }
    }
  
    if (currentUser.role === Role.ADMIN) {
      return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
    }
  
    return <StudentDashboard user={currentUser} onLogout={handleLogout} />;
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