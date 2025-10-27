import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRightIcon, ChevronDownIcon } from '../common/Icons';
import { Grade } from '../../types';
import { validateSubscriptionCode, getGradesForSelection } from '../../services/storageService';
import { useSession } from '../../hooks/useSession';

interface AuthScreenProps {
    onBack: () => void;
}

type AuthView = 'login' | 'register-step-1' | 'register-step-2' | 'reset-password' | 'update-password';
type GradeForSelect = Pick<Grade, 'id' | 'name' | 'level'>;


const GradeSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (gradeId: string, gradeName: string) => void;
    grades: GradeForSelect[];
}> = ({ isOpen, onClose, onSelect, grades }) => {
    const [step, setStep] = useState<'level' | 'grade'>('level');
    const [selectedLevel, setSelectedLevel] = useState<'Middle' | 'Secondary' | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset on open
            setStep('level');
            setSelectedLevel(null);
        }
    }, [isOpen]);

    const handleLevelSelect = (level: 'Middle' | 'Secondary') => {
        setSelectedLevel(level);
        setStep('grade');
    };

    const handleGradeSelect = (grade: GradeForSelect) => {
        onSelect(grade.id.toString(), grade.name);
    };

    const gradesForLevel = useMemo(() => {
        if (!selectedLevel) return [];
        return grades.filter(g => g.level === selectedLevel);
    }, [grades, selectedLevel]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div 
                className="relative w-full max-w-md p-6 mx-4 rounded-2xl shadow-2xl bg-[rgba(var(--bg-secondary-rgb),0.8)] backdrop-blur-xl border border-[var(--border-primary)] text-[var(--text-primary)] fade-in-up" 
                onClick={(e) => e.stopPropagation()}
            >
                {step === 'level' ? (
                    <div>
                        <h3 className="text-xl font-bold text-center mb-6">اختر المرحلة الدراسية</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleLevelSelect('Middle')} className="p-8 bg-gradient-to-br from-blue-500 to-sky-500 rounded-lg text-white font-bold text-lg transition-transform hover:scale-105">الإعدادية</button>
                            <button onClick={() => handleLevelSelect('Secondary')} className="p-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg text-white font-bold text-lg transition-transform hover:scale-105">الثانوية</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">اختر الصف الدراسي</h3>
                            <button onClick={() => setStep('level')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">تغيير المرحلة</button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {gradesForLevel.map(grade => (
                                <button
                                    key={grade.id}
                                    onClick={() => handleGradeSelect(grade)}
                                    className="w-full text-right p-4 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors"
                                >
                                    {grade.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PhoneInput: React.FC<{ name: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; }> = ({ name, placeholder, value, onChange, required = false }) => (
    <div className="relative">
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <span className="text-gray-400">🇪🇬 +20</span>
        </div>
        <input name={name} type="tel" placeholder={placeholder} value={value} onChange={onChange} required={required} className="w-full px-4 py-3 pr-24 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-left tracking-widest placeholder:text-right" dir="ltr" maxLength={11} />
    </div>
);

// Returns the 10 digits of an Egyptian number (without the leading '0')
const normalizePhoneNumber = (phone: string): string => {
    const trimmed = phone.trim().replace(/\s/g, '');
    if (trimmed.startsWith('0') && trimmed.length === 11) {
        return trimmed.substring(1); // Return 10 digits
    }
    if (trimmed.length === 10 && !trimmed.startsWith('0')) {
        return trimmed; // Already 10 digits
    }
    return ''; // Invalid format
};

const deriveTrackFromGrade = (gradeId: number): 'Scientific' | 'Literary' | undefined => {
    switch (gradeId) {
        case 5: // الثاني الثانوي - علمي
        case 7: // الثالث الثانوي - علمي علوم
        case 8: // الثالث الثانوي - علمي رياضيات
            return 'Scientific';
        case 6: // الثاني الثانوي - أدبي
        case 9: // الثالث الثانوي - أدبي
            return 'Literary';
        default:
            return undefined;
    }
};

const AuthScreen: React.FC<AuthScreenProps> = ({ onBack }) => {
    const { handleLogin, handleRegister, authError, clearAuthError, handleSendPasswordReset, handleUpdatePassword } = useSession();
    const [view, setView] = useState<AuthView>('login');
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', guardianPhone: '', password: '', confirmPassword: '', grade: '', track: '' });
    const [formError, setFormError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [allGrades, setAllGrades] = useState<GradeForSelect[]>([]);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedGradeName, setSelectedGradeName] = useState('');
    
    useEffect(() => {
        const grades = getGradesForSelection();
        setAllGrades(grades);
    }, []);

    const handleGradeSelect = (gradeId: string, gradeName: string) => {
        setFormData(prev => ({ ...prev, grade: gradeId }));
        setSelectedGradeName(gradeName);
        setIsGradeModalOpen(false);
    };

    const changeView = (newView: AuthView) => {
        clearAuthError();
        setFormError('');
        setView(newView);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isPhone = name === 'phone' || name === 'guardianPhone';
        const newValue = isPhone ? value.replace(/[^0-9]/g, '') : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleNext = () => {
        setFormError('');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setFormError('الرجاء إدخال بريد إلكتروني صالح.');
        if (formData.password.length < 6) return setFormError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
        if (formData.password !== formData.confirmPassword) return setFormError('كلمتا المرور غير متطابقتين.');
        if (normalizePhoneNumber(formData.phone).length !== 10) return setFormError('الرجاء إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 0).');
        if (normalizePhoneNumber(formData.guardianPhone).length !== 10) return setFormError('الرجاء إدخال رقم هاتف ولي أمر مصري صحيح (11 رقم يبدأ بـ 0).');
        changeView('register-step-2');
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError('');
        clearAuthError();
        
        switch (view) {
            case 'login':
                await handleLogin(formData.email, formData.password);
                break;
            case 'reset-password':
                await handleSendPasswordReset(formData.email);
                break;
            case 'update-password':
                if (formData.password.length < 6) {
                    setFormError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
                    setIsLoading(false);
                    return;
                }
                if (formData.password !== formData.confirmPassword) {
                    setFormError('كلمتا المرور غير متطابقتين.');
                    setIsLoading(false);
                    return;
                }
                await handleUpdatePassword(formData.password);
                break;
            case 'register-step-2':
                if (!formData.grade) {
                    setFormError('الرجاء اختيار الصف الدراسي.');
                    setIsLoading(false);
                    return;
                }
                const gradeId = formData.grade ? parseInt(formData.grade, 10) : null;
                const derivedTrack = gradeId ? deriveTrackFromGrade(gradeId) : undefined;

                const registrationData = {
                    name: formData.name.trim(), email: formData.email.trim(), password: formData.password,
                    phone: `+20${normalizePhoneNumber(formData.phone)}`,
                    guardianPhone: `+20${normalizePhoneNumber(formData.guardianPhone)}`,
                    grade: gradeId,
                    track: derivedTrack || 'All',
                };
                await handleRegister(registrationData, null);
                break;
        }
        setIsLoading(false);
    };
    
    const renderContent = () => {
        const title = {
            'login': 'تسجيل الدخول',
            'register-step-1': 'إنشاء حساب جديد', 'register-step-2': 'إنشاء حساب جديد',
            'reset-password': 'إعادة تعيين كلمة المرور', 'update-password': 'تحديث كلمة المرور'
        }[view];

        const subtitle = {
            'login': 'مرحباً بعودتك! أدخل بياناتك للمتابعة.',
            'register-step-1': 'الخطوة 1: المعلومات الشخصية.', 'register-step-2': 'الخطوة 2: المعلومات الدراسية.',
            'reset-password': 'أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة التعيين.',
            'update-password': 'أدخل كلمة مرور جديدة قوية لحسابك.'
        }[view];

        return (
            <>
                <div className="text-center fade-in flex flex-col items-center">
                    <div className="w-24 h-24 bg-black/20 rounded-full flex items-center justify-center mb-4 border-2 border-white/10 p-1">
                         <img src="https://h.top4top.io/p_3583m5j8t0.png" alt="Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">{title}</h1>
                    <p className="text-[var(--text-secondary)] mt-3 max-w-xs mx-auto">{subtitle}</p>
                </div>
                
                <form onSubmit={handleFormSubmit} className="w-full space-y-4 fade-in">
                    {/* Login View */}
                    {view === 'login' && (
                        <>
                            <input name="email" type="text" value={formData.email} onChange={handleChange} required placeholder="البريد الإلكتروني أو رقم الهاتف" className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" />
                            <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="كلمة المرور" className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" />
                            <div className="text-right">
                                <button type="button" onClick={() => changeView('reset-password')} className="text-sm font-semibold text-blue-400 hover:text-blue-300">نسيت كلمة المرور؟</button>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-3.5 font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg disabled:opacity-60">{isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}</button>
                        </>
                    )}
                    {/* Reset Password View */}
                    {view === 'reset-password' && (
                         <>
                             <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="البريد الإلكتروني المسجل" className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" />
                             <button type="submit" disabled={isLoading} className="w-full py-3.5 font-bold text-white bg-[var(--accent-primary)] rounded-lg disabled:opacity-60">{isLoading ? 'جاري الإرسال...' : 'أرسل رابط إعادة التعيين'}</button>
                        </>
                    )}
                    {/* Update Password View */}
                    {view === 'update-password' && (
                         <>
                            <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="كلمة المرور الجديدة" className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" />
                            <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="تأكيد كلمة المرور الجديدة" className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" />
                             <button type="submit" disabled={isLoading} className="w-full py-3.5 font-bold text-white bg-green-600 rounded-lg disabled:opacity-60">{isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}</button>
                        </>
                    )}
                    {/* Register Step 1 */}
                    {view === 'register-step-1' && (
                        <>
                            <input name="name" type="text" placeholder="الاسم الثلاثي" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" />
                            <input name="email" type="email" placeholder="البريد الإلكتروني" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" />
                            <PhoneInput name="phone" placeholder="رقم الطالب" value={formData.phone} onChange={handleChange} required />
                            <PhoneInput name="guardianPhone" placeholder="رقم ولي الامر" value={formData.guardianPhone} onChange={handleChange} required />
                            <input name="password" type="password" placeholder="كلمة المرور" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" />
                            <input name="confirmPassword" type="password" placeholder="تأكيد كلمة المرور" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" />
                            <button type="button" onClick={handleNext} className="w-full py-3.5 font-bold text-white bg-[var(--accent-primary)] rounded-lg">التالي</button>
                        </>
                    )}
                    {/* Register Step 2 */}
                    {view === 'register-step-2' && (
                        <>
                           <div className="space-y-4">
                                <label htmlFor="grade" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">اختر الصف الدراسي</label>
                                <button
                                    type="button"
                                    onClick={() => setIsGradeModalOpen(true)}
                                    className="w-full flex items-center justify-between text-right px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"
                                >
                                    <span className={formData.grade ? 'text-[var(--text-primary)]' : 'text-gray-500'}>
                                        {formData.grade ? selectedGradeName : '-- اختر الصف الدراسي --'}
                                    </span>
                                    <ChevronDownIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                                </button>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => changeView('register-step-1')} className="w-1/3 py-3.5 font-bold bg-[#212121] text-white rounded-lg">السابق</button>
                                <button type="submit" disabled={isLoading || !formData.grade} className="w-2/3 py-3.5 font-bold text-white bg-green-600 rounded-lg disabled:opacity-60">{isLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}</button>
                            </div>
                        </>
                    )}
                </form>

                {(formError || authError) && <p className="text-red-400 text-sm text-center pt-4">{formError || authError}</p>}
            </>
        );
    };

    return (
        <>
            <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden cosmic-flow-background">
                <button onClick={onBack} className="absolute top-6 right-6 z-20 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group">
                    <span>العودة للرئيسية</span><ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
                <div className="relative z-10 p-8 space-y-6 w-full max-w-md bg-[rgba(var(--bg-secondary-rgb),0.6)] backdrop-blur-lg border border-[var(--border-primary)] rounded-2xl shadow-2xl">
                    {renderContent()}
                    <div className="w-full pt-6 border-t border-[var(--border-primary)] text-center space-y-3">
                        {view === 'login' && (
                            <p className="text-sm text-[var(--text-secondary)]">ليس لديك حساب؟ <button onClick={() => changeView('register-step-1')} className="font-semibold text-blue-400 hover:text-blue-300">إنشاء حساب جديد</button></p>
                        )}
                        {(view === 'register-step-1' || view === 'register-step-2' || view === 'reset-password' || view === 'update-password') && (
                             <p className="text-sm text-[var(--text-secondary)]">
                                {view === 'update-password' ? 'تذكرت كلمة المرور؟' : 'لديك حساب بالفعل؟'}
                                <button onClick={() => changeView('login')} className="font-semibold text-blue-400 hover:text-blue-300 mr-1">
                                    تسجيل الدخول
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <GradeSelectionModal
                isOpen={isGradeModalOpen}
                onClose={() => setIsGradeModalOpen(false)}
                onSelect={handleGradeSelect}
                grades={allGrades}
            />
        </>
    );
};

export default AuthScreen;