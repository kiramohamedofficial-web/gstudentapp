
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, Theme } from './types';
import { 
    initData, 
    validateSubscriptionCode, 
    registerAndRedeemCode,
    signIn,
    signUp,
    signOut,
    onAuthStateChange,
    getProfile,
    // FIX: Import `getSession` and `addActivityLog` to resolve 'Cannot find name' errors.
    getSession,
    addActivityLog
} from './services/storageService';
import LoginScreen from './components/auth/LoginScreen';
import StudentDashboard from './components/student/StudentDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
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
    const initializeApp = async () => {
        try {
            await initData(); // Initialize non-auth data (content, etc.)
            
            // Supabase auth state listener will handle user session
            const { data: { subscription } } = onAuthStateChange(async (session) => {
                if (session) {
                    const profile = await getProfile(session.user.id);
                    if (profile) {
                        setCurrentUser({
                            ...profile,
                            email: session.user.email!,
                        });
                    } else {
                        // This case can happen if profile creation fails, log user out
                        console.error("User is logged in but profile data is missing.");
                        await signOut();
                        setCurrentUser(null);
                    }
                } else {
                    setCurrentUser(null);
                }
                setIsLoading(false); // Auth check is complete
            });

            // Initial session check
            const session = await getSession();
            if (!session) {
                setIsLoading(false);
            }

            return () => {
                subscription?.unsubscribe();
            };
        } catch (error) {
            console.error("Initialization failed:", error);
            setIsLoading(false);
        }
    };
    
    initializeApp();

    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
        setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);


  const handleLogin = useCallback(async (email: string, password: string): Promise<void> => {
    const { error } = await signIn(email, password);
    if (error) {
      setAuthError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    } else {
      setAuthError('');
      // onAuthStateChange will handle setting the user
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

  const handleRegister = useCallback(async (userData: any): Promise<void> => {
      if (codeToRegister) {
          const result = await registerAndRedeemCode(userData, codeToRegister);
          if (result.error) {
              setAuthError(result.error);
          } else {
               addToast(`مرحباً بك ${result.user?.name}! تم إنشاء حسابك وتفعيل اشتراكك.`, 'success');
               setCodeToRegister(null);
               // onAuthStateChange will handle setting the user
          }
      } else {
          const { error } = await signUp(userData);
          if (error) {
              setAuthError(error.message);
          } else {
              addToast(`تم إنشاء حسابك بنجاح! مرحباً بك.`, 'success');
              // onAuthStateChange will handle setting the user
          }
      }
  }, [addToast, codeToRegister]);


  const handleLogout = useCallback(async (): Promise<void> => {
    if (currentUser) {
      addActivityLog('User Logout', `User "${currentUser.name}" logged out.`);
    }
    await signOut();
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