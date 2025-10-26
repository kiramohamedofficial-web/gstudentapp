import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { User } from '../types';
import { 
    initData, 
    registerAndRedeemCode,
    signIn,
    signUp,
    signOut,
    onAuthStateChange,
    getProfile,
    getSession,
    addActivityLog
} from '../services/storageService';
import { useToast } from '../useToast';

type AuthView = 'welcome' | 'auth';

interface SessionContextType {
    currentUser: User | null;
    isLoading: boolean;
    authError: string;
    clearAuthError: () => void;
    authView: AuthView;
    setAuthView: React.Dispatch<React.SetStateAction<AuthView>>;
    handleLogin: (identifier: string, password: string) => Promise<void>;
    handleRegister: (userData: any, codeToRegister: string | null) => Promise<void>;
    handleLogout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [authView, setAuthView] = useState<AuthView>('welcome');
    const { addToast } = useToast();
    
    useEffect(() => {
        const initializeApp = async () => {
            await initData();
            
            const { data: { subscription } } = onAuthStateChange(async (session) => {
                if (session) {
                    const profile = await getProfile(session.user.id);
                    if (profile) {
                        setCurrentUser(profile);
                    } else {
                        console.error("User is logged in but profile data is missing.");
                        await signOut();
                        setCurrentUser(null);
                    }
                } else {
                    setCurrentUser(null);
                }
                setIsLoading(false);
            });

            const session = await getSession();
            if (!session) {
                setIsLoading(false);
            }

            return () => {
                subscription?.unsubscribe();
            };
        };
        
        initializeApp();
    }, []);

    const handleLogin = useCallback(async (identifier: string, password: string): Promise<void> => {
        setAuthError('');
        const { error } = await signIn(identifier, password);
        if (error) {
            setAuthError('بيانات الدخول غير صحيحة.');
        }
    }, []);
  
    const handleRegister = useCallback(async (userData: any, codeToRegister: string | null): Promise<void> => {
        setAuthError('');
        if (codeToRegister) {
            const { error } = await registerAndRedeemCode(userData, codeToRegister);
            if (error) {
                setAuthError(error);
            } else {
                 addToast(`مرحباً بك ${userData.name}! تم إنشاء حسابك وتفعيل اشتراكك.`, 'success');
            }
        } else {
            const { error } = await signUp(userData);
            if (error) {
                setAuthError(error.message);
            } else {
                addToast(`تم إنشاء حسابك بنجاح! مرحباً بك.`, 'success');
            }
        }
    }, [addToast]);

    const handleLogout = useCallback(async (): Promise<void> => {
        await signOut();
        setCurrentUser(null);
        setAuthView('welcome');
        addToast('تم تسجيل خروجك بنجاح.', 'info');
    }, [addToast]);
    
    const clearAuthError = () => setAuthError('');
    
    const value = {
        currentUser,
        isLoading,
        authError,
        clearAuthError,
        authView,
        setAuthView,
        handleLogin,
        handleRegister,
        handleLogout
    };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};