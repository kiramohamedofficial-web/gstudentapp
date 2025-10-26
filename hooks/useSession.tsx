import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { User } from '../types';
import { 
    registerAndRedeemCode,
    signIn,
    signUp,
    signOut,
    onAuthStateChange,
    getProfile,
    getSession,
    addActivityLog,
    updateUser,
    deleteUser
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
            const { data: { subscription } } = onAuthStateChange(async (session) => {
                if (session) {
                    let profile: User | null = null;
                    let attempts = 0;
                    while (!profile && attempts < 5) {
                        profile = await getProfile(session.user.id);
                        if (!profile) {
                            attempts++;
                            await new Promise(res => setTimeout(res, 1000 * attempts));
                        }
                    }

                    if (profile) {
                        setCurrentUser(profile);
                    } else {
                        console.error("User is logged in but profile data is missing after multiple attempts.");
                        addToast('فشل تحميل بيانات الملف الشخصي. قد تحتاج إلى تسجيل الخروج والدخول مرة أخرى.', 'error');
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
    }, [addToast]);

    const handleLogin = useCallback(async (identifier: string, password: string): Promise<void> => {
        setAuthError('');
        const { error } = await signIn(identifier, password);
        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                setAuthError('بيانات الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني/رقم الهاتف وكلمة المرور.');
            } else {
                setAuthError(error.message);
            }
        }
    }, []);
  
    const handleRegister = useCallback(async (userData: any, codeToRegister: string | null): Promise<void> => {
        setAuthError('');
        
        const postSignUpUpdate = async (userId: string) => {
            const { error: updateError } = await updateUser(userId, {
                grade: userData.grade,
                track: userData.track,
            });
            if (updateError) {
                console.error("Post-registration update failed:", updateError.message);
                addToast('تم إنشاء الحساب، ولكن قد تحتاج إلى تحديث صفك الدراسي يدويًا من ملفك الشخصي.', 'warning');
            }
        };

        if (codeToRegister) {
            const { data, error } = await registerAndRedeemCode(userData, codeToRegister);
            if (error && !data?.userId) { // A fatal error occurred
                setAuthError(error);
            } else if (data?.userId) {
                await postSignUpUpdate(data.userId);
                if (error) { // Non-fatal error (e.g., code redeem failed)
                    setAuthError(error);
                } else {
                    addToast(`مرحباً بك ${userData.name}! تم إنشاء حسابك وتفعيل اشتراكك.`, 'success');
                }
            }
        } else {
            const { data, error } = await signUp(userData);
            if (error) {
                setAuthError(error.message);
            } else if (data.user) {
                await postSignUpUpdate(data.user.id);
                addToast(`تم إنشاء حسابك بنجاح! مرحباً بك.`, 'success');
            }
        }
    }, [addToast]);

    const handleLogout = useCallback(async (): Promise<void> => {
        const { error } = await signOut();
        if (error) {
            console.error("Logout failed:", error);
            addToast('حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.', 'error');
        } else {
            setCurrentUser(null);
            setAuthView('welcome');
            addToast('تم تسجيل خروجك بنجاح.', 'info');
        }
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