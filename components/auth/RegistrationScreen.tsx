import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { getAllGrades } from '../../services/storageService';
import { ArrowRightIcon, SparklesIcon } from '../common/Icons';

interface RegistrationScreenProps {
    onRegister: (userData: Omit<User, 'id' | 'role' | 'subscriptionId'>) => void;
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
        return trimmed; // keep leading '0' for validation
    }
    // Handles cases where user might enter 10 digits directly
    if (trimmed.length === 10) {
        return `0${trimmed}`; // add leading '0'
    }
    return ''; // Return empty for invalid formats to fail regex
};

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegister, error, onBack, code }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        guardianPhone: '',
        password: '',
        confirmPassword: '',
        level: '',
        grade: '',
        track: '',
    });
    const [formError, setFormError] = useState('');

    const allGrades = useMemo(() => getAllGrades(), []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'phone' || name === 'guardianPhone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleNext = () => {
        setFormError('');
        const phoneRegex = /^01[0125]\d{8}$/; // This expects 11 digits with leading 0

        if (!formData.name.trim() || !formData.phone.trim() || !formData.guardianPhone.trim() || !formData.password.trim()) {
            setFormError('يرجى ملء جميع الحقول المطلوبة.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setFormError('كلمتا المرور غير متطابقتين.');
            return;
        }

        const studentPhoneForValidation = normalizePhoneNumber(formData.phone);
        const guardianPhoneForValidation = normalizePhoneNumber(formData.guardianPhone);
        
        const errorMessage = 'الرجاء إدخال رقم هاتف مصري صحيح (مثل 01012345678).';

        if (!phoneRegex.test(studentPhoneForValidation)) {
            setFormError(errorMessage);
            return;
        }
        if (!phoneRegex.test(guardianPhoneForValidation)) {
            setFormError('الرجاء إدخال رقم هاتف ولي أمر مصري صحيح.');
            return;
        }

        setStep(2);
    };

    const handleSubmit = (e: React.FormEvent) => {
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

        const normalizedStudentPhone = normalizePhoneNumber(formData.phone);
        const normalizedGuardianPhone = normalizePhoneNumber(formData.guardianPhone);

        const registrationData: Omit<User, 'id' | 'role' | 'subscriptionId'> = {
            name: formData.name.trim(),
            phone: `+2${normalizedStudentPhone}`,
            guardianPhone: `+2${normalizedGuardianPhone}`,
            password: formData.password,
            grade: parseInt(formData.grade, 10),
            track: (formData.grade === '11' || formData.grade === '12') ? (formData.track as any) : undefined,
        };
        onRegister(registrationData);
    };
    
    const gradesForLevel = useMemo(() => {
        if (!formData.level) return [];
        return allGrades.filter(g => g.level === formData.level);
    }, [formData.level, allGrades]);

    return (
        <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden cosmic-flow-background">
            <button
                onClick={onBack}
                className="absolute top-6 left-6 z-20 flex items-center space-x-2 space-x-reverse text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 group"
            >
                <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
                <span>العودة لتسجيل الدخول</span>
            </button>

            <div className="relative z-10 p-8 w-full max-w-lg bg-[rgba(var(--bg-secondary-rgb),0.6)] backdrop-blur-lg border border-[var(--border-primary)] rounded-2xl shadow-2xl">
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

                {/* Progress Bar */}
                 <div className="flex items-center justify-center mb-8">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= 1 ? 'border-[var(--accent-primary)] bg-[rgba(var(--accent-primary-rgb),0.2)] text-[var(--text-accent)] font-bold' : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>1</div>
                    <div className={`flex-1 h-1 mx-2 transition-all duration-300 rounded-full ${step > 1 ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}></div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= 2 ? 'border-[var(--accent-primary)] bg-[rgba(var(--accent-primary-rgb),0.2)] text-[var(--text-accent)] font-bold' : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>2</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Step 1: Personal Info */}
                    <div className={step === 1 ? 'fade-in' : 'hidden'}>
                        <div className="space-y-4">
                            <input name="name" type="text" placeholder="الاسم الثلاثي" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]" />
                            <PhoneInput name="phone" placeholder="رقم الطالب" value={formData.phone} onChange={handleChange} required />
                            <PhoneInput name="guardianPhone" placeholder="رقم ولي الامر" value={formData.guardianPhone} onChange={handleChange} required />
                            <input name="password" type="password" placeholder="كلمة المرور" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]" />
                            <input name="confirmPassword" type="password" placeholder="تأكيد كلمة المرور" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]" />
                        </div>
                        {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
                        <button type="button" onClick={handleNext} className="mt-6 w-full py-3.5 font-bold text-white bg-[var(--accent-primary)] hover:brightness-110 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-[0_10px_20px_-10px_rgba(var(--accent-primary-rgb),0.4)]">
                            التالي
                        </button>
                    </div>

                    {/* Step 2: Academic Info */}
                    <div className={step === 2 ? 'fade-in' : 'hidden'}>
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
                                <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                                    <p className="text-right text-sm text-[var(--text-secondary)] mb-2">اختر الشعبة</p>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Scientific' ? 'bg-[var(--accent-primary)] text-white shadow' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                            <input type="radio" name="track" value="Scientific" checked={formData.track === 'Scientific'} onChange={handleChange} className="sr-only" />
                                            علمي
                                        </label>
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Literary' ? 'bg-[var(--accent-primary)] text-white shadow' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                            <input type="radio" name="track" value="Literary" checked={formData.track === 'Literary'} onChange={handleChange} className="sr-only" />
                                            أدبي
                                        </label>
                                    </div>
                                </div>
                            )}

                            {formData.grade === '12' && (
                                <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                                    <p className="text-right text-sm text-[var(--text-secondary)] mb-2">اختر الشعبة</p>
                                    <div className="flex gap-2">
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Science' ? 'bg-[var(--accent-primary)] text-white shadow' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                            <input type="radio" name="track" value="Science" checked={formData.track === 'Science'} onChange={handleChange} className="sr-only" />
                                            علمي علوم
                                        </label>
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Math' ? 'bg-[var(--accent-primary)] text-white shadow' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                            <input type="radio" name="track" value="Math" checked={formData.track === 'Math'} onChange={handleChange} className="sr-only" />
                                            علمي رياضيات
                                        </label>
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Literary' ? 'bg-[var(--accent-primary)] text-white shadow' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                            <input type="radio" name="track" value="Literary" checked={formData.track === 'Literary'} onChange={handleChange} className="sr-only" />
                                            أدبي
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                        {(formError || error) && <p className="text-red-500 text-sm mt-2">{formError || error}</p>}
                        <div className="mt-6 flex gap-4">
                            <button type="button" onClick={() => setStep(1)} className="w-1/3 py-3.5 font-bold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--border-primary)]">
                                السابق
                            </button>
                            <button type="submit" className="w-2/3 py-3.5 font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-green-500/20">
                                إنشاء الحساب
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegistrationScreen;