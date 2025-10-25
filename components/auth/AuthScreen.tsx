import React, { useState, useEffect } from 'react';
import { ArrowRightIcon } from '../common/Icons';
import { Grade } from '../../types';
import { validateSubscriptionCode, getGradesForSelection } from '../../services/storageService';

interface AuthScreenProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (userData: any, code: string | null) => Promise<void>;
    error: string;
    clearError: () => void;
    onBack: () => void;
}

type AuthView = 'login' | 'register-step-1' | 'register-step-2' | 'code-login';
type GradeForSelect = Pick<Grade, 'id' | 'name' | 'level'>;


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


const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister, error, clearError, onBack }) => {
    const [view, setView] = useState<AuthView>('login');
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', guardianPhone: '', password: '', confirmPassword: '', level: '', grade: '', track: '' });
    const [code, setCode] = useState('');
    const [formError, setFormError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [allGrades, setAllGrades] = useState<GradeForSelect[]>([]);
    const [gradesForLevel, setGradesForLevel] = useState<GradeForSelect[]>([]);
    
    useEffect(() => {
        const fetchGrades = async () => {
            // Fetch grades directly from the database to avoid race conditions with the caching system
            // and to align with the user's new `grades` table schema.
            const grades = await getGradesForSelection();
            setAllGrades(grades);
        };
        fetchGrades();
    }, []);

    useEffect(() => {
        setGradesForLevel(formData.level ? allGrades.filter(g => g.level === formData.level) : []);
    }, [formData.level, allGrades]);
    
    const changeView = (newView: AuthView) => {
        clearError();
        setFormError('');
        setView(newView);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isPhone = name === 'phone' || name === 'guardianPhone';
        setFormData(prev => ({ ...prev, [name]: isPhone ? value.replace(/[^0-9]/g, '') : value }));
        if (name === 'level') setFormData(prev => ({...prev, grade: '', track: ''}));
    };

    const handleNext = () => {
        setFormError('');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setFormError('الرجاء إدخال بريد إلكتروني صالح.');
        if (formData.password.length < 6) return setFormError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
        if (formData.password !== formData.confirmPassword) return setFormError('كلمتا المرور غير متطابقتين.');
        if (!normalizePhoneNumber(formData.phone)) return setFormError('الرجاء إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 0).');
        if (!normalizePhoneNumber(formData.guardianPhone)) return setFormError('الرجاء إدخال رقم هاتف ولي أمر مصري صحيح (11 رقم يبدأ بـ 0).');
        changeView('register-step-2');
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError('');
        clearError();
        
        switch (view) {
            case 'login':
                await onLogin(formData.email, formData.password);
                break;
            case 'code-login':
                const { valid, error } = validateSubscriptionCode(code);
                if(valid) {
                    changeView('register-step-1');
                } else {
                    setFormError(error || 'الكود غير صالح.');
                }
                break;
            case 'register-step-2':
                if (!formData.grade) return setFormError('يرجى تحديد الصف الدراسي.');
                if ((formData.grade === '11' || formData.grade === '12') && !formData.track) return setFormError('يرجى تحديد الشعبة.');
                
                const registrationData = {
                    name: formData.name.trim(), email: formData.email.trim(), password: formData.password,
                    phone: `+20${normalizePhoneNumber(formData.phone)}`,
                    guardianPhone: `+20${normalizePhoneNumber(formData.guardianPhone)}`,
                    grade: parseInt(formData.grade, 10),
                    track: (formData.grade === '11' || formData.grade === '12') ? formData.track as any : undefined,
                };
                await onRegister(registrationData, code || null);
                break;
        }
        setIsLoading(false);
    };
    
    const renderContent = () => {
        const title = {
            'login': 'تسجيل الدخول', 'code-login': 'تسجيل الدخول بالكود',
            'register-step-1': 'إنشاء حساب جديد', 'register-step-2': 'إنشاء حساب جديد'
        }[view];

        const subtitle = {
            'login': 'مرحباً بعودتك! أدخل بياناتك للمتابعة.', 'code-login': 'أدخل كود الاشتراك الخاص بك.',
            'register-step-1': 'الخطوة 1: المعلومات الشخصية.', 'register-step-2': 'الخطوة 2: المعلومات الدراسية.'
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
                
                {code && (view === 'register-step-1' || view === 'register-step-2') && (
                    <div className="my-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center text-green-300 text-sm flex items-center justify-center gap-2">
                         <span>سيتم تفعيل اشتراكك تلقائياً بعد التسجيل.</span>
                    </div>
                )}
                
                <form onSubmit={handleFormSubmit} className="w-full space-y-4 fade-in">
                    {/* Login View */}
                    {view === 'login' && (
                        <>
                            <input name="email" type="text" value={formData.email} onChange={handleChange} required placeholder="البريد الإلكتروني أو رقم الهاتف" className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" />
                            <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="كلمة المرور" className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" />
                            <button type="submit" disabled={isLoading} className="w-full py-3.5 font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg disabled:opacity-60">{isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}</button>
                        </>
                    )}
                    {/* Code Login View */}
                    {view === 'code-login' && (
                        <>
                             <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="أدخل كود الاشتراك" className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-center tracking-widest" />
                             <button type="submit" disabled={isLoading} className="w-full py-3.5 font-bold text-white bg-green-600 rounded-lg disabled:opacity-60">{isLoading ? 'جاري التحقق...' : 'متابعة'}</button>
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
                            <select name="level" value={formData.level} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"><option value="">اختر المرحلة</option><option value="Middle">الإعدادية</option><option value="Secondary">الثانوية</option></select>
                            <select name="grade" value={formData.grade} onChange={handleChange} required disabled={!formData.level} className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg disabled:opacity-50"><option value="">اختر الصف</option>{gradesForLevel.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select>
                            {(formData.grade === '11' || formData.grade === '12') && (
                                <select name="track" value={formData.track} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"><option value="">اختر الشعبة</option>{formData.grade==='11' ? <><option value="Scientific">علمي</option><option value="Literary">أدبي</option></> : <><option value="Science">علمي علوم</option><option value="Math">علمي رياضيات</option><option value="Literary">أدبي</option></>}</select>
                            )}
                            <div className="flex gap-4">
                                <button type="button" onClick={() => changeView('register-step-1')} className="w-1/3 py-3.5 font-bold bg-[#212121] text-white rounded-lg">السابق</button>
                                <button type="submit" disabled={isLoading} className="w-2/3 py-3.5 font-bold text-white bg-green-600 rounded-lg disabled:opacity-60">{isLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}</button>
                            </div>
                        </>
                    )}
                </form>

                {(formError || error) && <p className="text-red-400 text-sm text-center pt-4">{formError || error}</p>}
            </>
        );
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden cosmic-flow-background">
            <button onClick={onBack} className="absolute top-6 right-6 z-20 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group">
                <span>العودة للرئيسية</span><ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <div className="relative z-10 p-8 space-y-6 w-full max-w-md bg-[rgba(var(--bg-secondary-rgb),0.6)] backdrop-blur-lg border border-[var(--border-primary)] rounded-2xl shadow-2xl">
                {renderContent()}
                <div className="w-full pt-6 border-t border-[var(--border-primary)] text-center space-y-3">
                    {view === 'login' && (
                        <>
                            <p className="text-sm text-[var(--text-secondary)]">ليس لديك حساب؟ <button onClick={() => changeView('register-step-1')} className="font-semibold text-blue-400 hover:text-blue-300">إنشاء حساب جديد</button></p>
                            <p className="text-sm text-[var(--text-secondary)]">أو <button onClick={() => changeView('code-login')} className="font-semibold text-green-400 hover:text-green-300">تسجيل الدخول بكود اشتراك</button></p>
                        </>
                    )}
                    {(view === 'register-step-1' || view === 'register-step-2' || view === 'code-login') && (
                        <p className="text-sm text-[var(--text-secondary)]">لديك حساب بالفعل؟ <button onClick={() => changeView('login')} className="font-semibold text-blue-400 hover:text-blue-300">تسجيل الدخول</button></p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;