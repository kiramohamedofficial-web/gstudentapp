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
import Modal from './components/common/Modal';

const App: React.FC = () => {
  const { currentUser, isLoading, authView, setAuthView, isPostRegistrationModalOpen, closePostRegistrationModal } = useSession();
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
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </div>
      
      <ToastContainer />

      <Modal
        isOpen={isPostRegistrationModalOpen}
        onClose={closePostRegistrationModal}
        title="⚠️ تنبيه هام عند التسجيل"
      >
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-lg space-y-3">
          <ul className="list-disc list-inside space-y-2 text-right">
            <li>سيتم <strong>حذف حسابك تلقائيًّا بعد 60 يومًا من عدم النشاط</strong> (عدم الدخول إلى المنصة).</li>
            <li><strong>تسجيل الدخول مسموح به من جهاز واحد فقط</strong> في نفس الوقت.</li>
          </ul>
          <p className="font-semibold pt-2 border-t border-red-500/30">
            يُرجى الالتزام بسياسة الاستخدام لضمان استمرارية حسابك.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={closePostRegistrationModal}
            className="px-6 py-2 font-bold bg-red-600 text-white rounded-lg transition-colors hover:bg-red-700"
          >
            حسنًا، فهمت
          </button>
        </div>
      </Modal>
    </>
  );
};

export default App;
