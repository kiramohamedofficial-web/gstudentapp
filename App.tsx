import React, { useState, useEffect } from 'react';
import { Role, Theme } from './types';
import { useSession } from './hooks/useSession';
import StudentDashboard from './components/student/StudentDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import Loader from './components/common/Loader';
import { ToastContainer } from './components/common/Toast';
import WelcomeScreen from './components/welcome/WelcomeScreen';
import AuthScreen from './components/auth/AuthScreen';
import ScreenSecurity from './components/common/ScreenSecurity';
import ErrorBoundary from './components/common/ErrorBoundary';

const App: React.FC = () => {
  const { currentUser, isLoading, authView, setAuthView } = useSession();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
        setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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
      switch (authView) {
        case 'auth':
          return <AuthScreen onBack={() => setAuthView('welcome')} />;
        case 'welcome':
        default:
          return <WelcomeScreen 
            onNavigateToLogin={() => setAuthView('auth')} 
            onNavigateToRegister={() => setAuthView('auth')} 
          />;
      }
    }
  
    return (
      <ScreenSecurity>
        {currentUser.role === Role.ADMIN
          ? <AdminDashboard theme={theme} setTheme={setTheme} />
          : currentUser.role === Role.TEACHER
          ? <TeacherDashboard theme={theme} setTheme={setTheme} />
          : <StudentDashboard theme={theme} setTheme={setTheme} />
        }
      </ScreenSecurity>
    );
  }

  return (
    <>
      <div className={`transition-all duration-300`}>
        {/* FIX: Moved renderContent inside ErrorBoundary to pass it as children prop. */}
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </div>
      
      <ToastContainer />
    </>
  );
};

export default App;