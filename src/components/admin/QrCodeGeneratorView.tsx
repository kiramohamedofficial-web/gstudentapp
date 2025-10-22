import React, { useState, useMemo } from 'react';
import { Teacher } from '../../types';
import { getTeachers, generatePrepaidCode } from '../../services/storageService';
import { KeyIcon } from '../common/Icons';
import { useToast } from '../../hooks/useToast';

const Select: React.FC<{ label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder: string; disabled?: boolean; }> = ({ label, value, onChange, options, placeholder, disabled = false }) => (
    <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all duration-300 disabled:opacity-50"
        >
            <option value="">{placeholder}</option>
            {options.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    </div>
);

const AccessCodeGeneratorView: React.FC = () => {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedPlan, setSelectedPlan] = useState<'Monthly' | 'Annual'>('Monthly');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const { addToast } = useToast();

    const teachers = useMemo(() => getTeachers(), []);

    const handleGenerate = () => {
        if (!selectedTeacherId) {
            addToast('الرجاء اختيار معلم أولاً.', 'error');
            return;
        }
        const code = generatePrepaidCode(selectedTeacherId, selectedPlan);
        setGeneratedCode(code);
    };
    
    const handleCopy = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode);
            addToast('تم نسخ الكود بنجاح!', 'success');
        }
    };

    const resetSelections = () => {
        setGeneratedCode(null);
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">مولد أكواد التفعيل</h1>
            <p className="mb-8 text-[var(--text-secondary)]">أنشئ كودًا رقميًا لمنح اشتراك في جميع مواد معلم معين لمدة محددة.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side - Configuration */}
                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">1. حدد تفاصيل الكود</h2>
                    <div className="space-y-4">
                        <Select
                            label="المعلم"
                            value={selectedTeacherId}
                            onChange={val => { setSelectedTeacherId(val); resetSelections(); }}
                            options={teachers.map(t => ({ value: t.id, label: `${t.name} - ${t.subject}` }))}
                            placeholder="اختر المعلم..."
                        />
                        <Select
                            label="مدة الاشتراك"
                            value={selectedPlan}
                            onChange={val => { setSelectedPlan(val as 'Monthly' | 'Annual'); resetSelections(); }}
                            options={[{ value: 'Monthly', label: 'شهري' }, { value: 'Annual', label: 'سنوي' }]}
                            placeholder="اختر المدة..."
                        />
                    </div>
                    <div className="mt-8 pt-6 border-t border-[var(--border-primary)]">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">2. أنشئ الكود</h2>
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedTeacherId}
                            className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg 
                                       hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-500/50
                                       transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <KeyIcon className="w-6 h-6 ml-2" />
                            إنشاء الكود
                        </button>
                    </div>
                </div>
                
                {/* Right side - Result */}
                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] flex flex-col items-center justify-center min-h-[300px]">
                    {generatedCode ? (
                        <div className="text-center fade-in w-full">
                            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">تم إنشاء الكود بنجاح</h1>
                            <div className="p-4 bg-[var(--bg-tertiary)] border-2 border-dashed border-[var(--border-primary)] rounded-lg">
                                <p 
                                    className="text-3xl font-mono tracking-widest text-yellow-300" 
                                    style={{ direction: 'ltr' }}
                                >
                                    {generatedCode}
                                </p>
                            </div>
                            <p className="text-xs text-yellow-400/80 mt-2">ملاحظة: هذا الكود صالح للاستخدام مرة واحدة فقط.</p>
                            
                            <button
                                onClick={handleCopy}
                                className="mt-6 w-full max-w-xs flex items-center justify-center py-2.5 px-4 font-semibold text-white bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg 
                                           hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
                            >
                                نسخ الكود
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-[var(--text-secondary)]">
                            <KeyIcon className="w-20 h-20 mx-auto opacity-20 mb-4" />
                            <p>سيظهر كود التفعيل هنا بعد إنشائه.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccessCodeGeneratorView;
