import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { getAllGrades } from '../../services/storageService';
import { ArrowLeftIcon, ArrowRightIcon } from '../common/Icons';

interface RegistrationScreenProps {
    onRegister: (userData: Omit<User, 'id' | 'role' | 'subscriptionId'>) => void;
    error: string;
    onBack: () => void;
}

const PhoneInput: React.FC<{ name: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; }> = ({ name, placeholder, value, onChange, required = false }) => (
    <div className="relative">
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <span className="text-gray-500">🇪🇬 +20</span>
        </div>
        <input
            name={name}
            type="tel"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className="w-full px-4 py-3 pr-24 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left tracking-widest placeholder:text-right"
            dir="ltr"
            maxLength={11}
        />
    </div>
);

const normalizePhoneNumber = (phone: string): string => {
    const trimmed = phone.trim();
    if (trimmed.startsWith('0') && trimmed.length === 11) {
        return trimmed.substring(1); // remove leading '0' to get 10 digits
    }
    // Handles cases where user might enter 10 digits directly
    if (trimmed.length === 10) {
        return trimmed;
    }
    return ''; // Return empty for invalid formats to fail regex
};

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegister, error, onBack }) => {
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
        const phoneRegex = /^(10|11|12|15)\d{8}$/; // This expects 10 digits

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
        if (formData.grade === '12' && !formData.track) {
            setFormError('يرجى تحديد الشعبة (علمي أو أدبي).');
            return;
        }

        const normalizedStudentPhone = normalizePhoneNumber(formData.phone);
        const normalizedGuardianPhone = normalizePhoneNumber(formData.guardianPhone);

        const registrationData: Omit<User, 'id' | 'role' | 'subscriptionId'> = {
            name: formData.name.trim(),
            phone: `+20${normalizedStudentPhone}`,
            guardianPhone: `+20${normalizedGuardianPhone}`,
            password: formData.password,
            grade: parseInt(formData.grade, 10),
            track: formData.grade === '12' ? (formData.track as 'Scientific' | 'Literary') : undefined,
        };
        onRegister(registrationData);
    };
    
    const gradesForLevel = useMemo(() => {
        if (!formData.level) return [];
        return allGrades.filter(g => g.level === formData.level);
    }, [formData.level, allGrades]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-4">
            <button
                onClick={onBack}
                className="absolute top-6 left-6 z-20 flex items-center space-x-2 space-x-reverse text-gray-500 hover:text-gray-800 transition-colors duration-200 group"
            >
                <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
                <span>العودة لتسجيل الدخول</span>
            </button>
            <div className="relative z-10 p-8 w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl">
                <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-2 text-gray-900">
                    إنشاء حساب جديد
                </h1>
                <p className="text-center text-gray-500 mb-6">انضم إلينا في رحلة التفوق الدراسي</p>
                
                {/* Progress Bar */}
                 <div className="flex items-center justify-center mb-8">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${step >= 1 ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-gray-300 bg-gray-50 text-gray-400'}`}>1</div>
                    <div className={`flex-1 h-0.5 mx-2 transition-colors ${step > 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${step >= 2 ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-gray-300 bg-gray-50 text-gray-400'}`}>2</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Step 1: Personal Info */}
                    <div className={step === 1 ? 'fade-in' : 'hidden'}>
                        <div className="space-y-4">
                            <input name="name" type="text" placeholder="الاسم الثلاثي" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            <PhoneInput name="phone" placeholder="رقم الطالب" value={formData.phone} onChange={handleChange} required />
                            <PhoneInput name="guardianPhone" placeholder="رقم ولي الامر" value={formData.guardianPhone} onChange={handleChange} required />
                            <input name="password" type="password" placeholder="كلمة المرور" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            <input name="confirmPassword" type="password" placeholder="تأكيد كلمة المرور" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        {formError && <p className="text-red-600 text-sm mt-2">{formError}</p>}
                        <button type="button" onClick={handleNext} className="mt-6 w-full py-3.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-transform transform hover:scale-105 shadow-md">
                            التالي
                        </button>
                    </div>

                    {/* Step 2: Academic Info */}
                    <div className={step === 2 ? 'fade-in' : 'hidden'}>
                        <div className="space-y-4">
                            <select name="level" value={formData.level} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-right">
                                <option value="">اختر المرحلة الدراسية</option>
                                <option value="Middle">المرحلة الإعدادية</option>
                                <option value="Secondary">المرحلة الثانوية</option>
                            </select>
                            
                            {formData.level && (
                                <select name="grade" value={formData.grade} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-right">
                                    <option value="">اختر الصف الدراسي</option>
                                    {gradesForLevel.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            )}

                            {formData.grade === '12' && (
                                <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                                    <p className="text-right text-sm text-gray-600 mb-2">اختر الشعبة</p>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Scientific' ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700'}`}>
                                            <input type="radio" name="track" value="Scientific" checked={formData.track === 'Scientific'} onChange={handleChange} className="sr-only" />
                                            علمي
                                        </label>
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Literary' ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700'}`}>
                                            <input type="radio" name="track" value="Literary" checked={formData.track === 'Literary'} onChange={handleChange} className="sr-only" />
                                            أدبي
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                        {(formError || error) && <p className="text-red-600 text-sm mt-2">{formError || error}</p>}
                        <div className="mt-6 flex gap-4">
                            <button type="button" onClick={() => setStep(1)} className="w-1/3 py-3.5 font-bold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                                السابق
                            </button>
                            <button type="submit" className="w-2/3 py-3.5 font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-transform transform hover:scale-105 shadow-md">
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