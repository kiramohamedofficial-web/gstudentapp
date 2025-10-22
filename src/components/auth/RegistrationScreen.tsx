import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../types';
import { getAllGrades } from '../../services/storageService';
import { ArrowRightIcon, KeyIcon } from '../common/Icons';
import AuthCharacter from './AuthCharacter';

type CharacterState = 'idle' | 'watching' | 'lookingAway' | 'error';

interface RegistrationScreenProps {
    onRegister: (userData: Omit<User, 'id' | 'role' | 'subscriptionId'>, code?: string) => void;
    error: string;
    onBack: () => void;
    registrationCode?: string;
}

const PhoneInput: React.FC<{ name: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onFocus: () => void; onBlur: () => void; required?: boolean; }> = ({ name, placeholder, value, onChange, onFocus, onBlur, required = false }) => (
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
            className="w-full px-4 py-3 pr-24 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left tracking-widest placeholder:text-right"
            dir="ltr"
            maxLength={11}
            onFocus={onFocus}
            onBlur={onBlur}
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

// FIX: A stray `const;` declaration was present in this file, causing a syntax error. It has been removed.
const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegister, error, onBack, registrationCode }) => {
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
    const [activationCode, setActivationCode] = useState(registrationCode || '');
    const [formError, setFormError] = useState('');
    const [characterState, setCharacterState] = useState<CharacterState>('idle');

    const allGrades = useMemo(() => getAllGrades(), []);

    useEffect(() => {
        setActivationCode(registrationCode || '');
    }, [registrationCode]);

    useEffect(() => {
        if (error || formError) {
          setCharacterState('error');
        } else if (characterState === 'error') {
          setCharacterState('idle');
        }
    }, [error, formError, characterState]);

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
        if (formData.grade === '12' && !formData.track) {
            setFormError('يرجى تحديد الشعبة (علمي أو أدبي).');
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
            track: formData.grade === '12' ? (formData.track as 'Scientific' | 'Literary') : undefined,
        };
        onRegister(registrationData, activationCode);
    };
    
    const gradesForLevel = useMemo(() => {
        if (!formData.level) return [];
        return allGrades.filter(g => g.level === formData.level);
    }, [formData.level, allGrades]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#111827] text-gray-200 p-4 relative overflow-hidden">
             {/* Background Glows */}
            <div className="absolute top-0 -left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>

            <button
                onClick={onBack}
                className="absolute top-6 left-6 z-20 flex items-center space-x-2 space-x-reverse text-gray-400 hover:text-white transition-colors duration-200 group"
            >
                <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
                <span>العودة لتسجيل الدخول</span>
            </button>

            <div className="relative z-10 w-full max-w-md bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden p-8">
                <div className="text-center flex flex-col items-center mb-6">
                  <AuthCharacter state={characterState} />
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-4">
                      إنشاء حساب جديد
                  </h1>
                  <p className="text-center text-gray-400 mt-2">انضم إلينا في رحلة التفوق الدراسي</p>
                </div>
                
                <div className="flex items-center justify-center mb-8">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= 1 ? 'border-blue-500 bg-blue-500/20 text-blue-300 font-bold' : 'border-gray-600 bg-gray-700 text-gray-400'}`}>1</div>
                    <div className={`flex-1 h-1 mx-2 transition-all duration-300 rounded-full ${step > 1 ? 'bg-blue-500' : 'bg-gray-700'}`}></div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= 2 ? 'border-blue-500 bg-blue-500/20 text-blue-300 font-bold' : 'border-gray-600 bg-gray-700 text-gray-400'}`}>2</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className={step === 1 ? 'fade-in' : 'hidden'}>
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <KeyIcon className="w-5 h-5 text-yellow-400"/>
                                </div>
                                <input
                                    name="activationCode"
                                    type="text"
                                    placeholder="كود التفعيل (اختياري)"
                                    value={activationCode}
                                    onChange={e => setActivationCode(e.target.value)}
                                    readOnly={!!registrationCode}
                                    className={`w-full px-4 py-3 pr-10 bg-gray-700/50 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono tracking-widest text-center ${registrationCode ? 'border-green-500 bg-green-500/10' : 'border-gray-600'}`}
                                    style={{ direction: 'ltr' }}
                                    onFocus={() => setCharacterState('watching')} onBlur={() => setCharacterState('idle')}
                                />
                            </div>
                            <input name="name" type="text" placeholder="الاسم الثلاثي" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" onFocus={() => setCharacterState('watching')} onBlur={() => setCharacterState('idle')} />
                            <PhoneInput name="phone" placeholder="رقم الطالب" value={formData.phone} onChange={handleChange} required onFocus={() => setCharacterState('watching')} onBlur={() => setCharacterState('idle')} />
                            <PhoneInput name="guardianPhone" placeholder="رقم ولي الامر" value={formData.guardianPhone} onChange={handleChange} required onFocus={() => setCharacterState('watching')} onBlur={() => setCharacterState('idle')} />
                            <input name="password" type="password" placeholder="كلمة المرور" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" onFocus={() => setCharacterState('lookingAway')} onBlur={() => setCharacterState('idle')} />
                            <input name="confirmPassword" type="password" placeholder="تأكيد كلمة المرور" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" onFocus={() => setCharacterState('lookingAway')} onBlur={() => setCharacterState('idle')} />
                        </div>
                        {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}
                        <button type="button" onClick={handleNext} className="mt-6 w-full py-3.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-blue-500/20">
                            التالي
                        </button>
                    </div>

                    <div className={step === 2 ? 'fade-in' : 'hidden'}>
                        <div className="space-y-4">
                            <select name="level" value={formData.level} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-right" onFocus={() => setCharacterState('watching')} onBlur={() => setCharacterState('idle')}>
                                <option value="">اختر المرحلة الدراسية</option>
                                <option value="Middle">المرحلة الإعدادية</option>
                                <option value="Secondary">المرحلة الثانوية</option>
                            </select>
                            
                            {formData.level && (
                                <select name="grade" value={formData.grade} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-right" onFocus={() => setCharacterState('watching')} onBlur={() => setCharacterState('idle')}>
                                    <option value="">اختر الصف الدراسي</option>
                                    {gradesForLevel.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            )}

                            {formData.grade === '12' && (
                                <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                                    <p className="text-right text-sm text-gray-400 mb-2">اختر الشعبة</p>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Scientific' ? 'bg-blue-600 text-white shadow' : 'bg-gray-700 text-gray-300'}`}>
                                            <input type="radio" name="track" value="Scientific" checked={formData.track === 'Scientific'} onChange={handleChange} className="sr-only" onFocus={() => setCharacterState('watching')} onBlur={() => setCharacterState('idle')} />
                                            علمي
                                        </label>
                                        <label className={`flex-1 text-center py-2 rounded-md cursor-pointer transition-colors ${formData.track === 'Literary' ? 'bg-blue-600 text-white shadow' : 'bg-gray-700 text-gray-300'}`}>
                                            <input type="radio" name="track" value="Literary" checked={formData.track === 'Literary'} onChange={handleChange} className="sr-only" onFocus={() => setCharacterState('watching')} onBlur={() => setCharacterState('idle')} />
                                            أدبي
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                        {(formError || error) && <p className="text-red-500 text-sm mt-2">{formError || error}</p>}
                        <div className="mt-6 flex gap-4">
                            <button type="button" onClick={() => setStep(1)} className="w-1/3 py-3.5 font-bold bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500">
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