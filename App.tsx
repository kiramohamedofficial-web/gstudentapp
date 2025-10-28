import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Role, Theme } from './types';
import { useSession } from './hooks/useSession';
import StudentDashboard from './components/student/StudentDashboard';
import Loader from './components/common/Loader';
import { ToastContainer } from './components/common/Toast';
import WelcomeScreen from './components/welcome/WelcomeScreen';
import AuthScreen from './components/auth/AuthScreen';
import ScreenSecurity from './components/common/ScreenSecurity';
import ErrorBoundary from './components/common/ErrorBoundary';
import { initData } from './services/storageService';

// Lazy load role-specific dashboards to improve initial load time
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard'));


const App: React.FC = () => {
  const { currentUser, isLoading: isSessionLoading, authView, setAuthView } = useSession();
  const [theme, setTheme] = useState<Theme>('light');
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
        setTheme(storedTheme);
    }
    
    // Initialize curriculum data when the app mounts
    initData().then(() => {
      setIsDataInitialized(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const isLoading = isSessionLoading || !isDataInitialized;

  const FullPageLoader: React.FC<{ message?: string }> = ({ message = 'جاري تحميل الواجهة...' }) => (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
          <Loader />
          <p className="mt-4 text-lg text-[var(--text-secondary)]">{message}</p>
      </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return <FullPageLoader message="جاري تحميل المنصة..." />;
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
        <Suspense fallback={<FullPageLoader />}>
          {currentUser.role === Role.ADMIN
            ? <AdminDashboard theme={theme} setTheme={setTheme} />
            : currentUser.role === Role.TEACHER
            ? <TeacherDashboard theme={theme} setTheme={setTheme} />
            : <StudentDashboard theme={theme} setTheme={setTheme} />
          }
        </Suspense>
      </ScreenSecurity>
    );
  }

  return (
    <>
      <div className={`transition-all duration-300`}>
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </div>
      
      <ToastContainer />
    </>
  );
};

export default App;