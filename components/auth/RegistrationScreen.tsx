import React, { useState, useEffect } from 'react';
import { Grade } from '../../types';
import { createClient } from '@supabase/supabase-js';
import { ArrowRightIcon, SparklesIcon } from '../common/Icons';

interface RegistrationScreenProps {
    onRegister: (userData: any) => Promise<void>;
    error: string;
    onBack: () => void;
    code: string | null;
}

const PhoneInput: React.FC<{ name: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; }> = ({ name, placeholder, value, onChange, required = false }) => (
    <div className="relative">
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <span className="text-gray-400">🇪🇬 +20</span>
        </div>
        <input
            name={name}
            type="tel"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className="w-full px-4 py-3 pr-24 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] text-left tracking-widest placeholder:text-right"
            dir="ltr"
            maxLength={11}
        />
    </div>
);

const normalizePhoneNumber = (phone: string): string => {
    const trimmed = phone.trim();
    if (trimmed.startsWith('0') && trimmed.length === 11) {
        return trimmed;
    }
    if (trimmed.length === 10) {
        return `0${trimmed}`;
    }
    return '';
};

const supabaseUrl = 'https://csipsaucwcuserhfrehn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaXBzYXVjd2N1c2VyaGZyZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTQwMTgsImV4cCI6MjA3Njg3MDAxOH0.FJu12ARvbqG0ny0D9d1Jje3BxXQ-q33gjx7JSH26j1w';
const supabase = createClient(supabaseUrl, supabaseKey);


const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegister, error, onBack, code }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        guardianPhone: '',
        password: '',
        confirmPassword: '',
        level: '',
        grade: '',
        track: '',
    });
    const [formError, setFormError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    type GradeForSelect = Pick<Grade, 'id' | 'name' | 'level'>;
    const [allGrades, setAllGrades] = useState<GradeForSelect[]>([]);
    const [gradesForLevel, setGradesForLevel] = useState<GradeForSelect[]>([]);

    useEffect(() => {
        const fetchGrades = async () => {
             const { data, error } = await supabase
                .from('grades')
                .select('id, name, level')
                .order('id', { ascending: true });
            
            if (error) {
                console.error("Error fetching grades:", error);
                setFormError("حدث خطأ في تحميل الصفوف الدراسية. يرجى المحاولة مرة أخرى.");
            } else {
                setAllGrades(data || []);
            }
        };
        fetchGrades();
    }, []);

    useEffect(() => {
        if (formData.level) {
            const filtered = allGrades.filter(g => g.level === formData.level);
            setGradesForLevel(filtered);
        } else {
            setGradesForLevel([]);
        }
    }, [formData.level, allGrades]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'phone' || name === 'guardianPhone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => {
                const newState = { ...prev, [name]: value };
                if (name === 'level') {
                    newState.grade = '';
                    newState.track = '';
                }
                return newState;
            });
        }
    };

    const handleNext = () => {
        setFormError('');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.guardianPhone.trim() || !formData.password.trim()) {
            setFormError('يرجى ملء جميع الحقول المطلوبة.');
            return;
        }
        if (!emailRegex.test(formData.email)) {
            setFormError('الرجاء إدخال بريد إلكتروني صالح.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setFormError('كلمتا المرور غير متطابقتين.');
            return;
        }
        if (formData.password.length < 6) {
            setFormError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
            return;
        }

        const studentPhoneForValidation = normalizePhoneNumber(formData.phone);
        const guardianPhoneForValidation = normalizePhoneNumber(formData.guardianPhone);
        
        if (!studentPhoneForValidation) {
            setFormError('الرجاء إدخال رقم هاتف مصري صحيح (مثل 01012345678).');
            return;
        }
        if (!guardianPhoneForValidation) {
            setFormError('الرجاء إدخال رقم هاتف ولي أمر مصري صحيح.');
            return;
        }

        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!formData.level || !formData.grade) {
            setFormError('يرجى تحديد الصف الدراسي.');
            return;
        }
        if ((formData.grade === '11' || formData.grade === '12') && !formData.track) {
            setFormError('يرجى تحديد الشعبة.');
            return;
        }

        setIsLoading(true);
        const registrationData = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            phone: `+2${normalizePhoneNumber(formData.phone)}`,
            guardianPhone: `+2${normalizePhoneNumber(formData.guardianPhone)}`,
            grade: parseInt(formData.grade, 10),
            track: (formData.grade === '11' || formData.grade === '12') ? (formData.track as any) : null,
        };
        await onRegister(registrationData);
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden cosmic-flow-background">
            <button
                onClick={onBack}
                className="absolute top-6 right-6 z-20 flex items-center space-x-2 space-x-reverse text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 group"
            >
                <span>العودة لتسجيل الدخول</span>
                <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <div className="relative z-10 p-8 w-full max-w-lg bg-[var(--bg-secondary)] backdrop-blur-lg border border-[var(--border-primary)] rounded-2xl shadow-2xl">
                <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-2 text-[var(--text-primary)]">
                    إنشاء حساب جديد
                </h1>
                <p className="text-center text-[var(--text-secondary)] mb-6">انضم إلينا في رحلة التفوق الدراسي</p>
                
                {code && (
                    <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center text-green-300 text-sm flex items-center justify-center space-x-2 space-x-reverse">
                        <SparklesIcon className="w-5 h-5" />
                        <span>سيتم تفعيل اشتراكك تلقائياً بعد إتمام التسجيل.</span>
                    </div>
                )}

                <div className="flex items-center w-full max-w-xs mx-auto my-8">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg z-10 transition-colors duration-500 ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}>2</div>
                    <div className="flex-1 h-1 bg-gray-700 relative">
                        <div className={`absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-500`} style={{ width: step > 1 ? '100%' : '0%' }}></div>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg bg-indigo-600 text-white z-10">1</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {step === 1 && (
                        <div className="fade-in space-y-4">
                            <input name="name" type="text" placeholder="الاسم الثلاثي" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]" />
                            <input name="email" type="email" placeholder="البريد الإلكتروني" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]" />
                            <PhoneInput name="phone" placeholder="رقم الطالب" value={formData.phone} onChange={handleChange} required />
                            <PhoneInput name="guardianPhone" placeholder="رقم ولي الامر" value={formData.guardianPhone} onChange={handleChange} required />
                            <input name="password" type="password" placeholder="كلمة المرور (6 أحرف على الأقل)" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]" />
                            <input name="confirmPassword" type="password" placeholder="تأكيد كلمة المرور" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]" />
                            
                            {(formError || error) && <p className="text-red-400 text-sm mt-2 text-center">{formError || error}</p>}
                            
                            <button type="button" onClick={handleNext} className="mt-6 w-full py-3.5 font-bold text-white bg-[var(--accent-primary)] hover:brightness-110 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-[0_10px_20px_-10px_rgba(var(--accent-primary-rgb),0.4)]">
                                التالي
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="fade-in">
                            <div className="p-4 rounded-lg border border-indigo-500/50 bg-indigo-500/10 mb-6 flex items-center space-x-4 space-x-reverse">
                                <div className="w-6 h-6 rounded-full border-2 border-indigo-400 flex items-center justify-center flex-shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                </div>
                                <h2 className="font-bold text-lg text-indigo-300">اختر الصف الدراسي</h2>
                            </div>
                            <div className="space-y-4">
                                <select name="level" value={formData.level} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] appearance-none text-right">
                                    <option value="">اختر المرحلة الدراسية</option>
                                    <option value="Middle">المرحلة الإعدادية</option>
                                    <option value="Secondary">المرحلة الثانوية</option>
                                </select>
                                
                                {formData.level && (
                                    <select name="grade" value={formData.grade} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] appearance-none text-right">
                                        <option value="">اختر الصف الدراسي</option>
                                        {gradesForLevel.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                )}
                                
                                {formData.grade === '11' && (
                                    <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"><p className="text-right text-sm text-[var(--text-secondary)] mb-2">اختر الشعبة</p><div className="flex gap-4">
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Scientific' ? 'bg-[var(--accent-primary)] text-white shadow' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}><input type="radio" name="track" value="Scientific" checked={formData.track === 'Scientific'} onChange={handleChange} className="sr-only" />علمي</label>
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Literary' ? 'bg-[var(--accent-primary)] text-white shadow' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}><input type="radio" name="track" value="Literary" checked={formData.track === 'Literary'} onChange={handleChange} className="sr-only" />أدبي</label>
                                    </div></div>
                                )}

                                {formData.grade === '12' && (
                                    <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"><p className="text-right text-sm text-[var(--text-secondary)] mb-2">اختر الشعبة</p><div className="flex gap-2">
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Science' ? 'bg-[var(--accent-primary)] text-white shadow' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}><input type="radio" name="track" value="Science" checked={formData.track === 'Science'} onChange={handleChange} className="sr-only" />علمي علوم</label>
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Math' ? 'bg-[var(--accent-primary)] text-white shadow' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}><input type="radio" name="track" value="Math" checked={formData.track === 'Math'} onChange={handleChange} className="sr-only" />علمي رياضيات</label>
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Literary' ? 'bg-[var(--accent-primary)] text-white shadow' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}><input type="radio" name="track" value="Literary" checked={formData.track === 'Literary'} onChange={handleChange} className="sr-only" />أدبي</label>
                                    </div></div>
                                )}
                            </div>
                            {(formError || error) && <p className="text-red-400 text-sm mt-2 text-center">{formError || error}</p>}
                            <div className="mt-6 flex gap-4">
                                <button type="button" onClick={() => setStep(1)} className="w-1/3 py-3.5 font-bold bg-[#212121] text-white rounded-lg hover:bg-gray-800 transition-colors">السابق</button>
                                <button type="submit" disabled={isLoading} className="w-2/3 py-3.5 font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-green-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
                                    {isLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default RegistrationScreen;