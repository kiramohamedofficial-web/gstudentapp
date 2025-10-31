import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { User, Grade } from '../types';
import { 
    registerAndRedeemCode,
    signIn,
    signUp,
    signOut,
    onAuthStateChange,
    getUserById,
    getSession,
    addActivityLog,
    updateUser,
    deleteUser,
    sendPasswordResetEmail,
    updateUserPassword,
    getOrCreateDeviceId,
    supabase
} from '../services/storageService';
import { useToast } from '../useToast';

type AuthView = 'welcome' | 'auth' | 'reset-password' | 'update-password';

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
    handleSendPasswordReset: (email: string) => Promise<void>;
    handleUpdatePassword: (password: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const mapGradeData = (grade: any): Grade | undefined => {
    if (!grade) return undefined;
    return {
        ...grade,
        semesters: (grade.semesters || []).map((semester: any) => ({
            ...semester,
            units: (semester.units || []).map((unit: any) => ({
                ...unit,
                teacherId: unit.teacher_id, // Map snake_case to camelCase
                lessons: (unit.lessons || []).map((lesson: any) => ({
                    ...lesson,
                    quizType: lesson.quiz_type,
                    correctAnswers: lesson.correct_answers,
                    timeLimit: lesson.time_limit,
                    passingScore: lesson.passing_score,
                    dueDate: lesson.due_date,
                }))
            }))
        }))
    };
};


export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [authView, setAuthView] = useState<AuthView>('welcome');
    const { addToast } = useToast();
    
    useEffect(() => {
        const { data: { subscription } } = onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setAuthView('update-password');
                addToast('مرحباً بك مجدداً. الرجاء إدخال كلمة المرور الجديدة.', 'info');
                setIsLoading(false);
                return;
            }

            if (session) {
                let profile: any = null;
                let attempts = 0;
                while (!profile && attempts < 5) {
                    const { data: profileData } = await supabase.from('profiles').select('*, grades(*, semesters(*, units(*, lessons(*))))').eq('id', session.user.id).single();
                    profile = profileData;
                    if (!profile) {
                        attempts++;
                        await new Promise(res => setTimeout(res, 1000 * attempts));
                    }
                }

                if (profile) {
                    const mappedGradeData = mapGradeData(profile.grades);
                    const mergedUser: User = {
                        ...(profile as any),
                        id: session.user.id,
                        email: session.user.email || profile.email,
                        grade: profile.grade_id,
                        guardianPhone: profile.guardian_phone,
                        gradeData: mappedGradeData as Grade,
                    };
                    setCurrentUser(mergedUser);
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

        (async () => {
            const session = await getSession();
            if (!session) {
                setIsLoading(false);
            }
        })();

        return () => {
            subscription?.unsubscribe();
        };
    }, [addToast]);

    const handleLogin = useCallback(async (identifier: string, password: string): Promise<void> => {
        setAuthError('');
        const { error } = await signIn(identifier, password);
        if (error) {
            setAuthError(error.message);
        }
    }, []);
  
    const handleRegister = useCallback(async (userData: any, codeToRegister: string | null): Promise<void> => {
        setAuthError('');
        
        const postSignUpUpdate = async (userId: string) => {
            // Explicitly update all profile fields to make it robust against trigger failures
            const { error: updateError } = await updateUser(userId, {
                name: userData.name,
                phone: userData.phone,
                guardianPhone: userData.guardianPhone,
                grade: userData.grade,
                track: userData.track,
            });

            if (updateError) {
                console.error("Post-registration update failed:", updateError.message);
                addToast('تم إنشاء الحساب، ولكن قد تحتاج إلى تحديث بياناتك يدويًا من ملفك الشخصي.', 'warning');
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

    const handleSendPasswordReset = useCallback(async (email: string): Promise<void> => {
        setAuthError('');
        const { error } = await sendPasswordResetEmail(email);
        if (error) {
            setAuthError(error.message);
            addToast('حدث خطأ أثناء إرسال الرابط. تأكد من البريد الإلكتروني.', 'error');
        } else {
            addToast('إذا كان الحساب موجودًا، فسيتم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.', 'success');
            setAuthView('auth');
        }
    }, [addToast]);
    
    const handleUpdatePassword = useCallback(async (password: string): Promise<void> => {
        setAuthError('');
        const { error } = await updateUserPassword(password);
        if (error) {
            setAuthError(error.message);
            addToast('فشل تحديث كلمة المرور. قد يكون الرابط منتهي الصلاحية أو كلمة المرور ضعيفة.', 'error');
        } else {
            addToast('تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.', 'success');
            await signOut(); 
            setCurrentUser(null);
            setAuthView('auth');
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
        handleLogout,
        handleSendPasswordReset,
        handleUpdatePassword
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
