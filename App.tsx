import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
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
import { ServerIcon, ShieldCheckIcon, WaveIcon, PhotoIcon } from './components/common/Icons';


// =================================================================
// LIVE HEALTH CHECK SYSTEM
// =================================================================

type Status = 'idle' | 'running' | 'ok' | 'warning' | 'error';

interface Check {
    id: string;
    title: string;
    status: Status;
    details: string;
    icon: React.FC<any>;
    action: () => Promise<{ status: Status; details: string; }>;
}

const StatusIndicator: React.FC<{ status: Status }> = ({ status }) => {
    const styles: Record<Status, { color: string; label: string; animation?: string }> = {
        idle: { color: 'bg-gray-500', label: 'جاهز' },
        running: { color: 'bg-blue-500', label: 'جاري...', animation: 'animate-pulse' },
        ok: { color: 'bg-green-500', label: 'سليم' },
        warning: { color: 'bg-yellow-500', label: 'تحذير' },
        error: { color: 'bg-red-500', label: 'خطأ' },
    };
    const { color, label, animation } = styles[status];
    return (
        <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${color} ${animation || ''}`}></span>
            <span className="text-xs font-semibold">{label}</span>
        </div>
    );
};

const LiveHealthCheck: React.FC = () => {
    const getInitialChecks = useCallback((): Check[] => [
        {
            id: 'cdn', title: 'شبكة توصيل المحتوى (CDN)', icon: PhotoIcon,
            status: 'idle', details: 'فحص الوصول لخدمات استضافة الصور والملفات.',
            action: async () => {
                try {
                    await fetch('https://h.top4top.io/p_3583m5j8t0.png', { mode: 'no-cors', signal: AbortSignal.timeout(8000) });
                    return { status: 'ok', details: 'CDN يستجيب بشكل طبيعي.' };
                } catch (error) {
                    return { status: 'error', details: 'فشل الوصول إلى شبكة توصيل المحتوى. قد تكون مشكلة في الإنترنت.' };
                }
            }
        },
        {
            id: 'dbConnection', title: 'اتصال قاعدة البيانات', icon: ServerIcon,
            status: 'idle', details: 'فحص الاتصال بخادم Supabase.',
            action: async () => {
                const supabaseUrl = 'https://csipsaucwcuserhfrehn.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaXBzYXVjd2N1c2VyaGZyZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTQwMTgsImV4cCI6MjA3Njg3MDAxOH0.FJu12ARvbqG0ny0D9d1Jje3BxXQ-q33gjx7JSH26j1w';
                try {
                    const res = await fetch(`${supabaseUrl}/rest/v1/teachers?select=id`, {
                        method: 'HEAD',
                        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
                        signal: AbortSignal.timeout(8000)
                    });
                    if (!res.ok) throw new Error(`استجاب الخادم برمز ${res.status}`);
                    return { status: 'ok', details: 'الاتصال ناجح.' };
                } catch (error: any) {
                    return { status: 'error', details: `فشل الاتصال: ${error.message}` };
                }
            }
        },
        {
            id: 'pageLoad', title: 'سلامة تحميل الواجهات', icon: ShieldCheckIcon,
            status: 'idle', details: 'التحقق من إمكانية تحميل واجهات المستخدم.',
            action: async () => {
                try {
                    await import('./components/admin/AdminDashboard');
                    await import('./components/teacher/TeacherDashboard');
                    return { status: 'ok', details: 'تم تحميل الواجهات الرئيسية بنجاح.' };
                } catch (error: any) {
                    console.error('Lazy load check failed:', error);
                    return { status: 'error', details: `فشل تحميل إحدى الواجهات الرئيسية. قد تكون مشكلة في الشبكة.` };
                }
            }
        },
        {
            id: 'appIntegrity', title: 'سلامة المكتبات الأساسية', icon: ShieldCheckIcon,
            status: 'idle', details: 'التحقق من تحميل مكتبات React.',
            action: async () => {
                if (React && ReactDOM) {
                    return { status: 'ok', details: 'مكتبات React الأساسية تم تحميلها.' };
                }
                return { status: 'error', details: 'فشل تحميل إحدى مكتبات React الأساسية.' };
            }
        },
    ], []);
    
    const [checks, setChecks] = useState<Check[]>(getInitialChecks());
    
    useEffect(() => {
        const runChecks = () => {
            const initial = getInitialChecks();
            setChecks(initial.map(c => ({...c, status: 'running', details: 'جاري...'})));

            initial.forEach(check => {
                check.action().then(result => {
                    setChecks(prev => prev.map(c => c.id === check.id ? {...c, ...result} : c));
                }).catch(error => {
                    console.error(`Health check '${check.id}' failed unexpectedly:`, error);
                    setChecks(prev => prev.map(c => c.id === check.id ? { ...c, status: 'error', details: 'حدث خطأ غير متوقع أثناء الفحص.' } : c));
                });
            });
        };
        runChecks();
    }, [getInitialChecks]);

    const overallStatus = useMemo(() => {
        if (checks.some(c => c.status === 'running' || c.status === 'idle')) return 'running';
        if (checks.some(c => c.status === 'error')) return 'error';
        if (checks.some(c => c.status === 'warning')) return 'warning';
        return 'ok';
    }, [checks]);

    return (
        <div>
            {checks.map(check => (
                 <div key={check.id} className="p-3 bg-[var(--bg-tertiary)] rounded-lg mb-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <check.icon className="w-5 h-5 text-purple-400"/>
                            <span className="font-semibold text-sm">{check.title}</span>
                        </div>
                        <StatusIndicator status={check.status} />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 pr-8">{check.details}</p>
                </div>
            ))}
            <div className="mt-6 p-4 rounded-lg border border-[var(--border-primary)] text-center">
                {overallStatus === 'running' && <p className="text-[var(--text-secondary)]">جاري تنفيذ الفحوصات النهائية...</p>}
                {overallStatus === 'ok' && <p className="text-green-400">يبدو أن كل شيء يعمل بشكل صحيح. قد يكون التحميل بطيئًا بسبب ضغط على الخادم. يرجى محاولة إعادة تحميل الصفحة.</p>}
                {overallStatus === 'warning' && <p className="text-yellow-400">تم اكتشاف بعض المشاكل البسيطة التي قد تسبب بطء في التحميل. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.</p>}
                {overallStatus === 'error' && <p className="text-red-400">تم اكتشاف أخطاء حرجة. قد يكون هناك مشكلة في اتصالك بالإنترنت أو في خوادم المنصة. يرجى التواصل مع الدعم الفني.</p>}
                 <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">إعادة تحميل الصفحة</button>
            </div>
        </div>
    );
};

// Lazy load role-specific dashboards to improve initial load time
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard'));


const App: React.FC = () => {
  const { currentUser, isLoading: isSessionLoading, authView, setAuthView } = useSession();
  const [theme, setTheme] = useState<Theme>('light');
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [showStuckUI, setShowStuckUI] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
        setTheme(storedTheme);
    }
    
    // Initialize curriculum data when the app mounts
    initData()
      .catch((err) => {
        // Log the issue, explaining that this could lead to an infinite loop if not handled correctly.
        console.error(
          "An error occurred during initial data load. This could cause a loading screen loop. The application will proceed with fallback data.",
          err
        );
      })
      .finally(() => {
        // This block ensures that the loading state is always resolved, preventing an infinite loading screen.
        // The app can proceed with either fetched data or local fallback data provided by storageService.
        setIsDataInitialized(true);
      });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const isLoading = isSessionLoading || !isDataInitialized;

  useEffect(() => {
    let timer: number;
    if (isLoading) {
      // After 10 seconds of loading, show the diagnostic UI
      timer = window.setTimeout(() => {
        setShowStuckUI(true);
      }, 10000);
    } else {
      // If loading finishes, hide the UI
      setShowStuckUI(false);
    }

    return () => window.clearTimeout(timer);
  }, [isLoading]);


  const FullPageLoader: React.FC<{ message?: string }> = ({ message = 'جاري تحميل الواجهة...' }) => (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-4">
          {!showStuckUI ? (
              <>
                  <Loader />
                  <p className="mt-4 text-lg text-[var(--text-secondary)]">{message}</p>
              </>
          ) : (
              <div className="w-full max-w-lg text-center fade-in">
                  <WaveIcon className="w-12 h-12 text-blue-500 mx-auto mb-4"/>
                  <h2 className="text-2xl font-bold mb-2">يبدو أن التحميل استغرق وقتاً أطول من المتوقع...</h2>
                  <p className="text-[var(--text-secondary)] mb-6">نقوم الآن بإجراء فحص تلقائي للنظام لتشخيص المشكلة. يرجى الانتظار قليلاً.</p>
                  <div className="text-left">
                      <LiveHealthCheck />
                  </div>
              </div>
          )}
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