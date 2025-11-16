

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Role, Mode, Style, AppearanceSettings, FullTheme, CustomColors } from './types';
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
// FIX: Import signOut to handle session termination consistently.
import { curriculumCache, initData, supabase, signOut } from './services/storageService';
import { useIcons } from './IconContext';

// =================================================================
// APPEARANCE MANAGEMENT CONTEXT V2.0
// =================================================================

// Default colors matching the initial CSS setup
const defaultColors: Record<FullTheme, CustomColors> = {
  light: {
    '--bg-primary': '#f9fafb', '--bg-secondary': '#ffffff',
    '--text-primary': '#333b47', '--accent-primary': '#3366cc',
  },
  dark: {
    '--bg-primary': '#1a1c22', '--bg-secondary': '#22252d',
    '--text-primary': '#e2e4e7', '--accent-primary': '#7094e2',
  },
  '.clymorphism-light': {
    '--bg-primary': '#E6E7ED', '--bg-secondary': '#F0F0F3',
    '--text-primary': '#2d2a3a', '--accent-primary': '#8a3ffc',
  },
  '.clymorphism-dark': {
    '--bg-primary': '#252330', '--bg-secondary': '#2d2a3a',
    '--text-primary': '#f2efff', '--accent-primary': '#9f7aea',
  },
};

const defaultAppearanceSettings: AppearanceSettings = {
  neon: {
    enabled: false,
    color: '#00ffff',
    intensity: 0.5,
  },
  customColors: defaultColors,
};


interface AppearanceContextType {
  mode: Mode;
  style: Style;
  setMode: (mode: Mode) => void;
  setStyle: (style: Style) => void;
  toggleStyle: () => void;
  appearanceSettings: AppearanceSettings;
  setAppearanceSettings: React.Dispatch<React.SetStateAction<AppearanceSettings>>;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const useAppearance = () => {
    const context = useContext(AppearanceContext);
    if (!context) throw new Error('useAppearance must be used within an AppearanceProvider');
    return context;
};

const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<Mode>('light');
    const [style, setStyle] = useState<Style>('basic');
    const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(defaultAppearanceSettings);

    useEffect(() => {
        const storedMode = localStorage.getItem('theme_mode') as Mode | null;
        const storedStyle = localStorage.getItem('theme_style') as Style | null;
        const storedSettings = localStorage.getItem('appearance_settings');
        
        if (storedMode) setMode(storedMode);
        if (storedStyle) setStyle(storedStyle);
        if (storedSettings) {
             try {
                const parsedSettings = JSON.parse(storedSettings);
                // Merge with defaults to prevent errors if structure changed
                setAppearanceSettings(prev => ({
                    ...prev,
                    ...parsedSettings,
                    neon: { ...prev.neon, ...parsedSettings.neon },
                    customColors: { ...prev.customColors, ...parsedSettings.customColors }
                }));
            } catch (e) {
                // FIX: The caught error `e` is of type `unknown`. A type guard is necessary to
                // check if `e` is an `Error` before accessing `e.message`.
                if (e instanceof Error) {
                    console.error("Failed to parse appearance settings from localStorage:", e.message);
                } else {
                    console.error("Failed to parse appearance settings from localStorage:", String(e));
                }
            }
        }
    }, []);

    useEffect(() => {
        // 1. Determine the full theme name (e.g., '.clymorphism-dark')
        const themeToApply: FullTheme = style === '.clymorphism' ? `.clymorphism-${mode}` : mode;
        document.documentElement.setAttribute('data-theme', themeToApply);

        // 2. Apply custom colors for the current theme from settings
        const colors = appearanceSettings.customColors[themeToApply] || defaultColors[themeToApply];
        if (colors) {
            for (const [key, value] of Object.entries(colors)) {
                document.documentElement.style.setProperty(key, value);
            }
        }
        
        // 3. Apply neon effects globally
        const { neon } = appearanceSettings;
        document.documentElement.setAttribute('data-neon-enabled', String(neon.enabled));
        if (neon.enabled) {
            document.documentElement.style.setProperty('--neon-color', neon.color);
            document.documentElement.style.setProperty('--neon-intensity', String(neon.intensity));
        }
        
        // 4. Save all settings to localStorage
        localStorage.setItem('theme_mode', mode);
        localStorage.setItem('theme_style', style);
        localStorage.setItem('appearance_settings', JSON.stringify(appearanceSettings));
    }, [mode, style, appearanceSettings]);

    const toggleStyle = useCallback(() => {
        setStyle(prev => (prev === 'basic' ? '.clymorphism' : 'basic'));
    }, []);

    const value = {
        mode, style, setMode, setStyle, toggleStyle,
        appearanceSettings, setAppearanceSettings
    };

    return (
        <AppearanceContext.Provider value={value}>
            {children}
        </AppearanceContext.Provider>
    );
};


// =================================================================
// MAIN APP COMPONENT
// =================================================================

const App: React.FC = () => {
  const { currentUser, isLoading, authView, setAuthView, isPostRegistrationModalOpen, closePostRegistrationModal } = useSession();
  const [appKey, setAppKey] = useState(0);
  const icons = useIcons();

  useEffect(() => {
    // Dynamically set favicon
    const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
    if (favicon && icons.faviconUrl) {
      favicon.href = icons.faviconUrl;
    }
    // Dynamically set CSS variable for header logo
    if (icons.mainLogoUrl) {
      document.documentElement.style.setProperty('--header-logo-url', `url('${icons.mainLogoUrl}')`);
    }
  }, [icons]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When a tab becomes visible after being hidden, its state can be broken.
        // Remounting the app by changing its key is a robust and less disruptive
        // way to reset the app's state compared to a full page reload.
        setAppKey(k => k + 1);
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
        // This handles bfcache (back/forward cache) where connections are often broken.
        // A full reload is the most reliable fix for this specific browser behavior.
        if (event.persisted) {
            window.location.reload();
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  useEffect(() => {
    // Automatically refresh app state every minute to fetch latest updates
    const refreshInterval = setInterval(() => {
      setAppKey(k => k + 1);
    }, 60000); // 60 seconds

    return () => clearInterval(refreshInterval);
  }, []);


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
          ? <AdminDashboard />
          : currentUser.role === Role.TEACHER || currentUser.role === Role.SUPERVISOR
          ? <TeacherDashboard />
          : <StudentDashboard />
        }
      </ScreenSecurity>
    );
  }

  return (
    <AppearanceProvider>
      <div key={appKey} className={`transition-all duration-300`}>
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
    </AppearanceProvider>
  );
};

export default App;